export const createMotion = (api) => ({
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
  quoteLead(range, value) {
    const text = value.slice(range.start, range.end);
    const skip = text.match(
      /^(?:\s|<(?:em|strong)(?:\s[^>]*)?>|<\/(?:em|strong)>)*(?:—\s+)?/i,
    )?.[0].length;
    if (!skip) return range;
    return {
      start: Math.min(range.start + skip, range.end),
      end: range.end,
    };
  },
  sentence(value, start) {
    const block = api.block(value, start, start);
    const data = api.plain(value, block.start, block.end);
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
    return api.quoteLead(range, value);
  },
  sentenceScope(value, start, end) {
    if (start === end) return api.sentence(value, start);
    const left = api.sentence(value, start);
    const right = api.sentence(value, Math.max(0, end - 1));
    return {
      start: Math.min(left.start, right.start),
      end: Math.max(left.end, right.end),
    };
  },
  kind(value) {
    if (/^[.!?…]+$/.test(value)) return "punctuation";
    if (/^[«»„“"'()[\]{}]$/.test(value)) return "wrapper";
    return "word";
  },
  inlineTag(name) {
    return /^(?:a|em|strong|span)$/i.test(String(name || ""));
  },
  inlineBlock(value, start) {
    const source = String(value || "");
    const open = source.slice(start).match(/^<([a-z][a-z0-9]*)(?:\s[^>]*)?>/i);
    if (!open || !api.inlineTag(open[1])) return null;
    const close = new RegExp(`</${open[1]}>`, "i");
    const body = source.slice(start + open[0].length);
    const found = body.search(close);
    if (found < 0) return null;
    const closeText = body.slice(found).match(close)?.[0] || "";
    return {
      start,
      end: start + open[0].length + found + closeText.length,
      text: source.slice(start, start + open[0].length + found + closeText.length),
    };
  },
  rawTokens(value = "", start = 0, end = value.length) {
    const source = String(value || "");
    const tokens = [];
    const pushRun = (from, text) => {
      const terminal = text.match(/^([\s\S]*?)([,:;.!?…]+)([»”"')\]]*)$/u);
      if (terminal && terminal[1]) {
        tokens.push({
          start: from,
          end: from + terminal[1].length,
          text: terminal[1],
          type: api.kind(terminal[1]),
        });
        tokens.push({
          start: from + terminal[1].length,
          end: from + terminal[1].length + terminal[2].length,
          text: terminal[2],
          type: "punctuation",
        });
        if (terminal[3]) {
          tokens.push({
            start: from + terminal[1].length + terminal[2].length,
            end: from + text.length,
            text: terminal[3],
            type: "wrapper",
          });
        }
        return;
      }
      tokens.push({
        start: from,
        end: from + text.length,
        text,
        type: api.kind(text),
      });
    };
    let index = start;
    while (index < end) {
      if (/\s/.test(source[index])) {
        index += 1;
        continue;
      }
      const block = api.inlineBlock(source, index);
      if (block && block.end <= end) {
        tokens.push({
          start: block.start,
          end: block.end,
          text: block.text,
          type: "word",
        });
        index = block.end;
        continue;
      }
      if (/^[«»„“"'()[\]{}]$/.test(source[index])) {
        tokens.push({
          start: index,
          end: index + 1,
          text: source[index],
          type: "wrapper",
        });
        index += 1;
        continue;
      }
      const match = source.slice(index, end).match(/^[^\s«»„“"'()[\]{}]+/u);
      if (!match) {
        index += 1;
        continue;
      }
      pushRun(index, match[0]);
      index += match[0].length;
    }
    return tokens;
  },
  groups(data) {
    const groups = [];
    data.tokens.forEach((token) => {
      if (token.type === "word") {
        groups.push({ tokens: [token], word: token });
        return;
      }
      if (!groups.length || token.type === "wrapper") return;
      const group = groups[groups.length - 1];
      group.tokens = [...group.tokens, token];
    });
    const suffix = [];
    const last = groups[groups.length - 1];
    while (last && last.tokens.length) {
      const token = last.tokens[last.tokens.length - 1];
      const terminal =
        token.type === "punctuation" && /[.!?…]/.test(token.text);
      const wrapper = token.type === "wrapper" && suffix.length;
      if (!terminal && !wrapper) break;
      suffix.unshift(last.tokens.pop());
    }
    const list = groups
      .flatMap((group) => {
        const body = group.tokens.slice();
        const tail = [];
        while (body.length) {
          const token = body[body.length - 1];
          if (token.type !== "punctuation") break;
          tail.unshift(body.pop());
        }
        const next = [];
        if (body.length) next.push({ ...group, tokens: body });
        tail.forEach((token) => next.push({ tokens: [token], word: null }));
        return next;
      })
      .map((group, index) => {
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
      .map((group, index) =>
        data.value.slice(group.absEnd, list[index + 1].absStart),
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
        if (/^(?:-|‑|–|\u00A0|&nbsp;|&#160;)$/.test(join)) {
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
    return {
      ...data,
      groups: indexed,
      between: chain.between,
      head,
      tail,
      suffix,
    };
  },
  motion(value, range) {
    return api.groups({
      value,
      start: range.start,
      end: range.end,
      tokens: api.rawTokens(value, range.start, range.end),
    });
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
  text(group, mode = null) {
    return group.tokens
      .map((token) => {
        if (token !== group.word) return token.text;
        return mode ? api.caseText(token.text, mode) : token.text;
      })
      .join("");
  },
  caseText(value, mode) {
    return value.replace(
      /^((?:(?:[«„“"'()[\]{}]\s*)|(?:<[^>]+>\s*))*)([А-Яа-яA-Za-zЁё])/,
      (_, before = "", letter) => {
        const next =
          mode === "upper" ? letter.toUpperCase() : letter.toLowerCase();
        return `${before}${next}`;
      },
    );
  },
  between(left, right, join) {
    const leftToken = left?.tokens?.[left.tokens.length - 1];
    const rightToken = right?.tokens?.[0];
    const leftWord =
      leftToken?.type === "word" ||
      left?.tokens?.some((token) => token.type === "word");
    const rightWord =
      rightToken?.type === "word" ||
      (rightToken?.type === "wrapper" &&
        right?.tokens?.some((token) => token.type === "word"));
    const leftPunctGap =
      leftToken?.type === "punctuation" && /[,:;.!?…]/.test(leftToken.text);
    if (rightToken?.type === "punctuation") return "";
    if (join === "" && leftWord && rightWord) return " ";
    if (join === "" && leftPunctGap && rightWord) return " ";
    if (join !== undefined) return join;
    if (leftPunctGap && rightWord) return " ";
    return " ";
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
      const text = api.text(group, mode);
      parts.push(text);
      const end = parts.join("").length;
      ranges.push({ group, start, end });
      if (index < groups.length - 1) {
        parts.push(
          api.between(group, groups[index + 1], data.between[index]),
        );
      }
    });
    parts.push(data.tail || "");
    return {
      text: parts.join(""),
      ranges,
    };
  },
  reorder(data, selection, target) {
    const groups = data.groups.slice();
    const count = selection.to - selection.from + 1;
    const chunk = groups.splice(selection.from, count);
    groups.splice(target, 0, ...chunk);
    const render = api.render(data, groups);
    const items = render.ranges.filter((range) => chunk.includes(range.group));
    if (!items.length) return null;
    const range = {
      start: Math.min(...items.map((item) => item.start)),
      end: Math.max(...items.map((item) => item.end)),
    };
    return {
      value:
        data.value.slice(0, data.start) +
        render.text +
        data.value.slice(data.end),
      start: data.start + range.start,
      end: data.start + range.end,
    };
  },
  attached(group) {
    if (!group || group.tokens.length !== 1) return false;
    const token = group.tokens[0];
    return token.type === "punctuation" && /^[,:;]+$/.test(token.text);
  },
  forward(data, selection, step) {
    if (step <= 0 || !api.attached(data.groups[selection.to + 1])) {
      return selection;
    }
    return { ...selection, to: selection.to + 1 };
  },
  shift(selection, step, size) {
    const count = selection.to - selection.from + 1;
    const target = selection.from + step;
    if (target < 0) return null;
    if (target + count > size) return null;
    return {
      from: selection.from,
      to: selection.to,
      target,
    };
  },
  home(element) {
    const start = element.selectionStart;
    const end = element.selectionEnd;
    const value = element.value;
    const range = api.sentenceScope(value, start, end);
    const data = api.motion(value, range);
    const selection = api.pick(data, start, end);
    if (!selection || selection.from <= 0) return false;
    const result = api.reorder(data, selection, 0);
    if (!result) return false;
    api.set(element, result.value);
    return api.doneData(element, result);
  },
  move(element, step) {
    const start = element.selectionStart;
    const end = element.selectionEnd;
    const value = element.value;
    const range = api.sentenceScope(value, start, end);
    const data = api.motion(value, range);
    const selection = api.pick(data, start, end);
    if (!selection) return false;
    const current = api.forward(data, selection, step);
    const next = api.shift(current, step, data.groups.length);
    if (!next) return false;
    const result = api.reorder(data, current, next.target);
    if (!result) return false;
    api.set(element, result.value);
    return api.doneData(element, result);
  },
});
