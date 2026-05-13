const check = {
  plain(value, start, end) {
    const text = value.slice(start, end);
    const data = { value, start, end, text, clean: "", map: [] };
    const tag = /<\/?[^>]+>/y;
    const entity = /&(?:nbsp|#160);/iy;
    let index = 0;
    while (index < text.length) {
      tag.lastIndex = index;
      entity.lastIndex = index;
      const tagged = tag.exec(text);
      const space = entity.exec(text);
      if (tagged) {
        index = tag.lastIndex;
        continue;
      }
      if (space) {
        data.clean += " ";
        data.map.push(start + index);
        index = entity.lastIndex;
        continue;
      }
      data.clean += text[index];
      data.map.push(start + index);
      index += 1;
    }
    return data;
  },
  block(value, start) {
    const left = value.lastIndexOf("\n", start - 1) + 1;
    const right = value.indexOf("\n", start);
    return { start: left, end: right < 0 ? value.length : right };
  },
  sentence(value, start) {
    const block = check.block(value, start);
    const data = check.plain(value, block.start, block.end);
    const local = data.map.findIndex((index) => index >= start);
    const point = local < 0 ? data.clean.length : local;
    const left = data.clean.slice(0, point);
    const right = data.clean.slice(point);
    const before = left.search(/[.!?…](?:\s|[»“"'])*[^.!?…]*$/);
    const after = right.search(/[.!?…]/);
    const from = before < 0 ? 0 : before + 1;
    const to = after < 0 ? data.clean.length : point + after + 1;
    const range = {
      start: data.map[from] ?? block.start,
      end: (data.map[to - 1] ?? block.end - 1) + 1,
    };
    return check.quote(range, value);
  },
  quote(range, value) {
    const text = value.slice(range.start, range.end);
    const skip = text.match(
      /^(?:\s|<(?:em|strong)(?:\s[^>]*)?>|<\/(?:em|strong)>)*(?:—\s+)?/i,
    )?.[0].length;
    if (!skip) return range;
    return { start: Math.min(range.start + skip, range.end), end: range.end };
  },
  kind(value) {
    if (/^[А-Яа-яA-Za-zЁё0-9]+$/.test(value)) return "word";
    if (/^[.,:;!?…]$/.test(value)) return "punctuation";
    return "wrapper";
  },
  openWrap(value) {
    return /^[«„“([{]$/.test(value);
  },
  groups(data) {
    const groups = [];
    let pending = [];
    data.tokens.forEach((token) => {
      if (token.type === "word") {
        groups.push({ tokens: [...pending, token], word: token });
        pending = [];
        return;
      }
      if (
        token.type === "wrapper" &&
        (!groups.length || check.openWrap(token.text))
      ) {
        pending = [...pending, token];
        return;
      }
      if (!groups.length) return;
      const group = groups[groups.length - 1];
      group.tokens = [...group.tokens, token];
    });
    if (pending.length && groups.length) {
      const group = groups[groups.length - 1];
      group.tokens = [...group.tokens, ...pending];
    }
    const suffix = [];
    const last = groups[groups.length - 1];
    while (last && last.tokens.length) {
      const token = last.tokens[last.tokens.length - 1];
      const terminal = token.type === "punctuation" && /[.!?…]/.test(token.text);
      const wrapper = token.type === "wrapper" && suffix.length;
      if (!terminal && !wrapper) break;
      suffix.unshift(last.tokens.pop());
    }
    const list = groups.map((group, index) => {
      const first = group.tokens[0] || group.word;
      const lastToken = group.tokens[group.tokens.length - 1] || group.word;
      return {
        ...group,
        index,
        absStart: first.start,
        absEnd: lastToken.end,
      };
    });
    const between = list
      .slice(0, -1)
      .map(
        (group, index) =>
          data.value.slice(group.absEnd, list[index + 1].absStart) || " ",
      );
    const chain = (() => {
      const groups = [];
      const slots = [];
      list.forEach((group, index) => {
        if (!index) {
          groups.push({ ...group });
          return;
        }
        const join = between[index - 1] || "";
        const lastGroup = groups[groups.length - 1];
        if (/^(?:-|‑|–)$/.test(join)) {
          lastGroup.tokens = [
            ...lastGroup.tokens,
            { text: join, type: "wrapper" },
            ...group.tokens,
          ];
          lastGroup.absEnd = group.absEnd;
          return;
        }
        slots.push(join);
        groups.push({ ...group });
      });
      return { groups, between: slots };
    })();
    const head = list.length
      ? data.value.slice(data.start, list[0].absStart)
      : data.value.slice(data.start, data.end);
    const tail = list.length
      ? data.value.slice(list[list.length - 1].absEnd, data.end)
      : "";
    const indexed = chain.groups.map((group, index) => ({ ...group, index }));
    return { ...data, groups: indexed, between: chain.between, head, tail, suffix };
  },
  motion(value, range) {
    const data = check.plain(value, range.start, range.end);
    const token = /[А-Яа-яA-Za-zЁё0-9]+|[«»„“"'()[\]{}.,:;!?…]/g;
    const tokens = [...data.clean.matchAll(token)].map((match) => ({
      start: data.map[match.index],
      end: data.map[match.index + match[0].length - 1] + 1,
      text: match[0],
      type: check.kind(match[0]),
    }));
    return check.groups({ ...data, tokens });
  },
  pick(data, start, end) {
    const from = data.groups.findIndex((group) =>
      start === end
        ? group.absStart <= start && start <= group.absEnd
        : group.absStart < end && group.absEnd > start,
    );
    if (from < 0) return null;
    if (start === end) return { from, to: from };
    const to = data.groups.reduce(
      (last, group, index) =>
        group.absStart < end && group.absEnd > start ? index : last,
      from,
    );
    return { from, to };
  },
  case(value, mode) {
    return value.replace(
      /^((?:[«„“"'()[\]{}]\s*)*)([А-Яа-яA-Za-zЁё])/,
      (_, before = "", letter) =>
        `${before}${mode === "upper" ? letter.toUpperCase() : letter.toLowerCase()}`,
    );
  },
  text(group, mode) {
    return group.tokens
      .map((token) => (token === group.word && mode ? check.case(token.text, mode) : token.text))
      .join("");
  },
  render(data, groups) {
    const parts = [data.head || ""];
    const ranges = [];
    const first = groups[0];
    const previous = data.groups[0];
    groups.forEach((group, index) => {
      const start = parts.join("").length;
      const mode =
        group === first
          ? "upper"
          : group === previous && previous !== first
            ? "lower"
            : null;
      const text = check.text(group, mode);
      parts.push(text);
      if (index < groups.length - 1) parts.push(data.between[index] || " ");
      ranges.push({ group, start, end: parts.join("").length });
    });
    parts.push(data.tail || "");
    return { text: parts.join(""), ranges };
  },
  reorder(data, selection, target) {
    const groups = data.groups.slice();
    const count = selection.to - selection.from + 1;
    const chunk = groups.splice(selection.from, count);
    groups.splice(target, 0, ...chunk);
    const render = check.render(data, groups);
    const items = render.ranges.filter((range) => chunk.includes(range.group));
    const range = {
      start: Math.min(...items.map((item) => item.start)),
      end: Math.max(...items.map((item) => item.end)),
    };
    return {
      value: data.value.slice(0, data.start) + render.text + data.value.slice(data.end),
      start: data.start + range.start,
      end: data.start + range.end,
    };
  },
  shift(selection, step, size) {
    const count = selection.to - selection.from + 1;
    const target = selection.from + step;
    if (target < 0 || target + count > size) return null;
    return { ...selection, target };
  },
  begin(selection) {
    if (selection.from <= 0) return null;
    return { ...selection, target: 0 };
  },
  run(value, start, end, plan) {
    const range = check.sentence(value, start);
    const data = check.motion(value, range);
    const selection = check.pick(data, start, end);
    const next = plan(selection, data.groups.length);
    const result = check.reorder(data, selection, next.target);
    return result.value;
  },
};
const tests = [
  {
    name: "first-word-right-casing",
    run() {
      const value = "Привет мир снова.";
      const start = value.indexOf("Привет") + 1;
      return check.run(value, start, start, (selection, size) => check.shift(selection, 1, size));
    },
    expect: "Мир привет снова.",
  },
  {
    name: "selection-home-casing",
    run() {
      const value = "Первое второе третье слово.";
      const start = value.indexOf("второе");
      const end = value.indexOf("слово") - 1;
      return check.run(value, start, end, (selection) => check.begin(selection));
    },
    expect: "Второе третье первое слово.",
  },
  {
    name: "dash-preserved",
    run() {
      const value = "<em>— Почему мы здесь?</em>";
      const start = value.indexOf("мы") + 1;
      return check.run(value, start, start, (selection) => check.begin(selection));
    },
    expect: "<em>— Мы почему здесь?</em>",
  },
  {
    name: "move-with-em-comma-context",
    run() {
      const value =
        "Небольшой городок встречает нас выкрашенным в синий цвет придорожным крестом, рядами одноэтажных домиков — на одном из них кто-то изобразил пингвинов из <em>«Мадагаскара»,</em> уютными двориками и развешанным для сушки бельем.";
      const start = value.indexOf("рядами") + 2;
      return check.run(value, start, start, (selection, size) => check.shift(selection, -1, size));
    },
    expect:
      "Небольшой городок встречает нас выкрашенным в синий цвет придорожным рядами крестом, одноэтажных домиков — на одном из них кто-то изобразил пингвинов из <em>«Мадагаскара»,</em> уютными двориками и развешанным для сушки бельем.",
  },
  {
    name: "hyphen-word-move-as-one",
    run() {
      const value = "Это научно-популярный формат текста.";
      const start = value.indexOf("популярный") + 2;
      return check.run(value, start, start, (selection, size) =>
        check.shift(selection, 1, size),
      );
    },
    expect: "Это формат научно-популярный текста.",
  },
];
const failed = tests
  .map((item) => ({ name: item.name, actual: item.run(), expect: item.expect }))
  .filter((item) => item.actual !== item.expect);
if (failed.length) {
  failed.forEach((item) =>
    console.error(`${item.name}\nexpected: ${item.expect}\nactual:   ${item.actual}\n`),
  );
  process.exit(1);
}
console.log(`OK ${tests.length}`);
const punct = {
  case(value, index, mode) {
    const left = value.slice(0, index);
    const right = value
      .slice(index)
      .replace(
        /^((?:\s|<[^>]+>|[«„“"'()])+)?([А-Яа-яA-Za-zЁё])/,
        (_, before = "", letter) =>
          `${before}${mode === "upper" ? letter.toUpperCase() : letter.toLowerCase()}`,
      );
    return `${left}${right}`;
  },
  forward(value, start) {
    const match = value.slice(start).match(/([ \u00a0]\u2014\s*|:\s*|,\s*|\.\s*)/);
    if (!match) return null;
    const at = start + match.index;
    const raw = match[1];
    const key = /^[ \u00a0]\u2014/.test(raw)
      ? "dash"
      : raw.trim().startsWith(":")
        ? "colon"
        : raw.trim().startsWith(",")
          ? "comma"
          : "dot";
    return { at, raw, key };
  },
  apply(value, start, key) {
    const sign = key === "comma" ? "," : key === "colon" ? ":" : null;
    if (sign && value[start - 1] === sign)
      return value.slice(0, start - 1) + value.slice(start);
    if (sign && (value[start] === " " || value[start] === "\u00a0"))
      return value.slice(0, start) + sign + value.slice(start);
    const found = punct.forward(value, start);
    if (!found) return value;
    const list = ["dot", "comma", "colon", "dash"];
    const next = list[(list.indexOf(found.key) + 1) % list.length];
    const mark = next === "dot" ? ". " : next === "comma" ? ", " : next === "colon" ? ": " : "\u00a0— ";
    let string = value.slice(0, found.at) + mark + value.slice(found.at + found.raw.length);
    if (found.key === "dot" && next !== "dot")
      string = punct.case(string, found.at + mark.length, "lower");
    if (found.key !== "dot" && next === "dot")
      string = punct.case(string, found.at + mark.length, "upper");
    return string;
  },
};
const punctTests = [
  {
    name: "punct-local-comma-toggle",
    actual: punct.apply("Он пришел домой", "Он пришел".length, "comma"),
    expect: "Он пришел, домой",
  },
  {
    name: "punct-forward-dot-to-comma",
    actual: punct.apply("Он пришел. Потом сел.", 0, "comma"),
    expect: "Он пришел, потом сел.",
  },
];
const punctFailed = punctTests.filter((item) => item.actual !== item.expect);
if (punctFailed.length) {
  punctFailed.forEach((item) =>
    console.error(`${item.name}\nexpected: ${item.expect}\nactual:   ${item.actual}\n`),
  );
  process.exit(1);
}
console.log(`PUNCT OK ${punctTests.length}`);
const em = {
  quoteParts(value) {
    const cut = value.match(/^\s*/)?.[0].length || 0;
    const text = value.slice(cut);
    if (!/^—\s+/u.test(text)) return null;
    const split = text.match(
      /^(—[\s\S]*?,)\s+—\s+([а-яё][\s\S]*?[.!?…])\s+—\s+([\s\S]+)$/u,
    );
    if (split) {
      const first = split[1];
      const third = split[3];
      return {
        cut,
        parts: [
          { start: 0, end: first.length },
          { start: text.length - third.length, end: text.length },
        ],
      };
    }
    const mid = text.match(/^(—[\s\S]*?,)\s+—\s+([а-яё][\s\S]*?),\s+(—[\s\S]+)$/u);
    if (mid) {
      const first = mid[1];
      const third = mid[3];
      return {
        cut,
        parts: [
          { start: 0, end: first.length },
          { start: text.length - third.length, end: text.length },
        ],
      };
    }
    const tail =
      text.match(/^(—[\s\S]*?[.!?…»"'])\s+—\s+[а-яё][\s\S]*$/u) ||
      text.match(/^(—[\s\S]*?,)\s+—\s+[а-яё][\s\S]*$/u);
    if (tail) return { cut, parts: [{ start: 0, end: tail[1].length }] };
    return { cut, parts: [{ start: 0, end: text.length }] };
  },
  apply(value) {
    const quote = em.quoteParts(value.replace(/<\/?[^>]+>/g, ""));
    if (!quote) return value;
    const clean = value.replace(/<\/?[^>]+>/g, "");
    const spans = quote.parts.map((part) => ({
      start: quote.cut + part.start,
      end: quote.cut + part.end,
    }));
    return spans
      .sort((a, b) => b.start - a.start)
      .reduce(
        (text, span) =>
          text.slice(0, span.start) +
          `<em>${text.slice(span.start, span.end)}</em>` +
          text.slice(span.end),
        clean,
      );
  },
};
const emTests = [
  {
    name: "em-quote-full",
    source: "— Почему мы здесь?",
    expect: "<em>— Почему мы здесь?</em>",
  },
  {
    name: "em-quote-tail-author",
    source: "— Почему мы здесь? — спросил он.",
    expect: "<em>— Почему мы здесь?</em> — спросил он.",
  },
  {
    name: "em-quote-mid-author",
    source: "— Почему, — спросил он, — мы здесь?",
    expect: "<em>— Почему,</em> — спросил он, <em>— мы здесь?</em>",
  },
  {
    name: "em-quote-author-period",
    source: "— Наш проект стартовал, — вспоминает Виктор. — А для этого нужно поле.",
    expect:
      "<em>— Наш проект стартовал,</em> — вспоминает Виктор. — <em>А для этого нужно поле.</em>",
  },
];
const emFailed = emTests
  .map((item) => ({ name: item.name, actual: em.apply(item.source), expect: item.expect }))
  .filter((item) => item.actual !== item.expect);
if (emFailed.length) {
  emFailed.forEach((item) =>
    console.error(`${item.name}\nexpected: ${item.expect}\nactual:   ${item.actual}\n`),
  );
  process.exit(1);
}
console.log(`EM OK ${emTests.length}`);
