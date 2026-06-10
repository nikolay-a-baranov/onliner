export const createPunctuation = (api) => ({
  nbsp(element) {
    const start = element.selectionStart;
    const value = element.value;
    if (value[start - 1] === "\u00a0") {
      element.value = value.slice(0, start - 1) + " " + value.slice(start);
      return api.done(element, start);
    }
    if (value[start] === "\u00a0") {
      element.value = value.slice(0, start) + " " + value.slice(start + 1);
      return api.done(element, start + 1);
    }
    const left = value.slice(0, start);
    const right = value.slice(start);
    if (left.endsWith(" ")) {
      const before = left.slice(0, -1) + "\u00a0";
      element.value = before + right;
      return api.done(element, before.length);
    }
    if (right.startsWith(" ")) {
      element.value = left + "\u00a0" + right.slice(1);
      return api.done(element, left.length + 1);
    }
    element.value = left + "\u00a0" + right;
    return api.done(element, start + 1);
  },
  punctData() {
    const list = [
      { key: "dot", mark: ".", next: ".\u0020" },
      { key: "comma", mark: ",", next: ",\u0020" },
      { key: "colon", mark: ":", next: ":\u0020" },
      { key: "dash", next: "\u00a0—\u0020" },
    ];
    return {
      list,
      index: list.reduce((state, item, index) => {
        state[item.key] = index;
        return state;
      }, {}),
    };
  },
  punctForward(value, start) {
    const block = api.block(value, start, start);
    const from = Math.max(start, block.start);
    const scope = value.slice(from, block.end);
    const match = scope.match(/([ \u00a0]\u2014\s*|:\s*|,\s*|\.\s*)/);
    if (!match) return null;
    const at = from + match.index;
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
  punctCase(value, index, mode) {
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
  punctTagGap(value) {
    return value.replace(
      /([,:;.!?])(?:\s|&nbsp;|&#160;)+(<\/[^>]+>)/gi,
      "$1$2",
    );
  },
  punctTailMark(value, mark) {
    const esc = mark.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp(
      `(${esc})(?:\\s|&nbsp;|&#160;)+((?:<\\/[^>]+>(?:\\s|&nbsp;|&#160;)*)*)$`,
      "iu",
    );
    return value.replace(pattern, "$1$2");
  },
  punctTailMarkBlock(value, mark, edge) {
    return (
      api.punctTailMark(value.slice(0, edge), mark) + value.slice(edge)
    );
  },
  punct(element) {
    const start = element.selectionStart;
    const value = element.value;
    const data = api.punctData();
    const found = api.punctForward(value, start);
    if (!found) return false;
    const block = api.block(value, start, start);
    const tail = value.slice(found.at + found.raw.length, block.end);
    const atEnd = !tail.replace(/(?:\s|<\/?[^>]+>|&nbsp;|&#160;)+/gi, "");
    const cycle = atEnd
      ? [data.list[data.index.dot], data.list[data.index.colon]]
      : data.list;
    const index = cycle.findIndex((item) => item.key === found.key);
    const next = index < 0 ? cycle[0] : cycle[(index + 1) % cycle.length];
    let string =
      value.slice(0, found.at) +
      next.next +
      value.slice(found.at + found.raw.length);
    if (found.key === "dot" && next.key !== "dot") {
      string = api.punctCase(string, found.at + next.next.length, "lower");
    }
    if (found.key !== "dot" && next.key === "dot") {
      string = api.punctCase(string, found.at + next.next.length, "upper");
    }
    const scope = api.block(string, start, start);
    const cleaned =
      next.key === "dot"
        ? api.punctTailMarkBlock(string, ".", scope.end)
        : next.key === "colon"
          ? api.punctTailMarkBlock(string, ":", scope.end)
          : string;
    element.value = api.punctTagGap(cleaned);
    return api.done(element, start);
  },
  quoted(value, start) {
    const left = value.slice(0, start);
    const outer = {
      open: left.lastIndexOf("«"),
      close: left.lastIndexOf("»"),
      before: "«",
      after: "»",
    };
    const inner = {
      open: left.lastIndexOf("„"),
      close: left.lastIndexOf("“"),
      before: "„",
      after: "“",
    };
    const data =
      outer.open > outer.close
        ? outer
        : inner.open > inner.close
          ? inner
          : null;
    if (!data) return null;
    const right = value.slice(start);
    const close = right.indexOf(data.after);
    if (close < 0) return null;
    return {
      start: data.open,
      end: start + close + data.after.length,
      bodyStart: data.open + data.before.length,
      bodyEnd: start + close,
    };
  },
  quote(element) {
    const start = element.selectionStart;
    const end = element.selectionEnd;
    const value = element.value;
    if (start === end) {
      const data = api.quoted(value, start);
      if (data) {
        const body = value.slice(data.bodyStart, data.bodyEnd);
        element.value =
          value.slice(0, data.start) + body + value.slice(data.end);
        const plain = body.replace(/<\/?[^>]+>/g, "");
        const lead = plain.match(/^\s*/)?.[0].length || 0;
        return api.done(element, data.start + lead);
      }
    }
    const range = api.item(value, start, end);
    if (range.start === range.end) return false;
    const string = value.slice(range.start, range.end);
    const block = api.block(value, range.start, range.end);
    const left = value.slice(block.start, range.start);
    const nested =
      (left.match(/«/g) || []).length > (left.match(/»/g) || []).length;
    const before = nested ? "„" : "«";
    const after = nested ? "“" : "»";
    element.value =
      value.slice(0, range.start) +
      before +
      string +
      after +
      value.slice(range.end);
    return api.done(element, range.start + before.length);
  },
  punctLocalSimple(value, start, mark) {
    if (mark === "—") {
      const around = [
        [start - 3, start, "\u00a0—"],
        [start - 2, start + 1, "— "],
        [start, start + 3, "\u00a0— "],
        [start - 1, start + 2, " —"],
        [start - 1, start, "—"],
        [start, start + 1, "—"],
      ].find(
        ([from, to, sample]) =>
          from >= 0 && to <= value.length && value.slice(from, to) === sample,
      );
      if (!around) return null;
      const [from, to] = around;
      return value.slice(0, from) + value.slice(to);
    }
    if (value[start - 1] === mark)
      return value.slice(0, start - 1) + value.slice(start);
    if (value[start] === mark)
      return value.slice(0, start) + value.slice(start + 1);
    if (
      start >= 2 &&
      value[start - 2] === mark &&
      (value[start - 1] === " " || value[start - 1] === "\u00a0")
    ) {
      return value.slice(0, start - 2) + value.slice(start - 1);
    }
    return null;
  },
  punctInsertSimple(value, start, mark) {
    const token = mark === "—" ? "\u00a0— " : `${mark} `;
    const markKey = { ",": "comma", ":": "colon", "—": "dash" }[mark];
    const keyOf = (raw) =>
      /^[ \u00a0]\u2014/.test(raw)
        ? "dash"
        : raw.trim().startsWith(":")
          ? "colon"
          : raw.trim().startsWith(",")
            ? "comma"
            : "dot";
    const swapBeforeWord = (wordStart) => {
      const left = value.slice(0, wordStart);
      const found = left.match(/([ \u00a0]\u2014\s*|:\s*|,\s*|\.\s*)$/);
      if (!found) return null;
      const raw = found[1];
      const from = wordStart - raw.length;
      const key = keyOf(raw);
      if (!dataKeys.includes(key)) return null;
      if (key === markKey) {
        const next = value.slice(0, from) + value.slice(wordStart);
        const tail = next.slice(from);
        const merged = /^[A-Za-zА-Яа-яЁё0-9]/.test(tail)
          ? `${next.slice(0, from)} ${tail}`
          : next;
        return key === "dot"
          ? api.punctCase(merged, from, "lower")
          : merged;
      }
      const merged = value.slice(0, from) + token + value.slice(wordStart);
      return key === "dot" && markKey !== "dot"
        ? api.punctCase(merged, from + token.length, "lower")
        : merged;
    };
    const swapAt = (pivot) => {
      const found = value
        .slice(pivot)
        .match(/^([ \u00a0]\u2014\s*|:\s*|,\s*|\.\s*)/);
      if (!found) return null;
      const raw = found[1];
      const key = keyOf(raw);
      if (key === markKey) {
        const left = value.slice(0, pivot);
        const right = value.slice(pivot + raw.length);
        const stick =
          /[A-Za-zА-Яа-яЁё0-9]$/.test(left) &&
          /^[A-Za-zА-Яа-яЁё0-9]/.test(right);
        const merged = stick ? `${left} ${right}` : left + right;
        return key === "dot"
          ? api.punctCase(merged, pivot, "lower")
          : merged;
      }
      if (dataKeys.includes(key)) {
        const merged =
          value.slice(0, pivot) + token + value.slice(pivot + raw.length);
        return key === "dot" && markKey !== "dot"
          ? api.punctCase(merged, pivot + token.length, "lower")
          : merged;
      }
      return null;
    };
    const dataKeys = ["dot", "comma", "colon", "dash"];
    const range = api.word(value, start);
    if (range.start === range.end) {
      const swap = swapAt(start);
      if (swap !== null) return swap;
      const cut = value[start] === " " || value[start] === "\u00a0" ? 1 : 0;
      return value.slice(0, start) + token + value.slice(start + cut);
    }
    if (start === range.start) {
      const beforeWord = swapBeforeWord(range.start);
      if (beforeWord !== null) return beforeWord;
      const hasGap =
        range.start > 0 &&
        (value[range.start - 1] === " " ||
          value[range.start - 1] === "\u00a0");
      const pivot = hasGap ? range.start - 1 : range.start;
      const swap = swapAt(pivot);
      if (swap !== null) return swap;
      const cut = hasGap ? 1 : 0;
      return value.slice(0, pivot) + token + value.slice(pivot + cut);
    }
    const pivot = range.end;
    const swap = swapAt(pivot);
    if (swap !== null) return swap;
    const cut = value[pivot] === " " || value[pivot] === "\u00a0" ? 1 : 0;
    return value.slice(0, pivot) + token + value.slice(pivot + cut);
  },
  punctMark(element, mark) {
    const start = element.selectionStart;
    const value = element.value;
    const local = api.punctLocalSimple(value, start, mark);
    const next =
      local === null ? api.punctInsertSimple(value, start, mark) : local;
    element.value = api.punctTagGap(next);
    return api.done(element, start);
  },
  qswapText(text, cursor = 0) {
    const apply = (pattern, build) => {
      const match = pattern.exec(text);
      if (!match) return null;
      const from = match.index;
      const to = from + match[0].length;
      if (cursor < from || cursor > to) return null;
      const replace = build(match);
      if (!replace || replace === match[0]) return null;
      const next = text.slice(0, from) + replace + text.slice(to);
      return { text: next, cursor: from + replace.length };
    };
    return (
      apply(/(<em>)\s*[—-]\s*([\s\S]*?)\s*(<\/em>\s*[—-]\s*)/i, (match) => {
        const body = String(match[2] || "").trim();
        if (!body) return null;
        const punct = body.match(/([,.;:!?…])$/)?.[1] || "";
        const core = punct ? body.slice(0, -1).trimEnd() : body;
        if (!core) return null;
        return `${match[1]}«${core}»${punct}${match[3]}`;
      }) ||
      apply(
        /(<em>)\s*[«„]\s*([\s\S]*?)\s*[»“]\s*([,.;:!?…]?)\s*(<\/em>\s*[—-]\s*)/i,
        (match) => {
          const body = String(match[2] || "").trim();
          if (!body) return null;
          return `${match[1]}— ${body}${String(match[3] || "")}${match[4]}`;
        },
      )
    );
  },
  qswap(element) {
    const start = element.selectionStart;
    const end = element.selectionEnd;
    const value = element.value;
    const block = api.block(value, start, end);
    const local = value.slice(block.start, block.end);
    const next = api.qswapText(local, start - block.start);
    if (!next) return false;
    element.value =
      value.slice(0, block.start) + next.text + value.slice(block.end);
    return api.done(element, block.start + next.cursor);
  },
});
