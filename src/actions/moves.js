export const createMoves = (api) => ({
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
  sentenceEnd(text, index) {
    const mark = text[index] || "";
    if (/[!?…]/.test(mark)) return true;
    if (mark !== ".") return false;
    const rest = text.slice(index + 1).match(/^(?:\s|[»“"')\]])*/)?.[0] || "";
    const next = text[index + 1 + rest.length] || "";
    if (!next) return true;
    return /[A-ZА-ЯЁ0-9<]/.test(next);
  },
  previousEnd(text, point) {
    for (let index = point - 1; index >= 0; index -= 1) {
      if (!/[.!?…]/.test(text[index])) continue;
      if (api.sentenceEnd(text, index)) return index;
    }
    return -1;
  },
  nextEnd(text, point) {
    for (let index = point; index < text.length; index += 1) {
      if (!/[.!?…]/.test(text[index])) continue;
      if (api.sentenceEnd(text, index)) return index;
    }
    return -1;
  },
  sentence(value, start) {
    const block = api.block(value, start, start);
    const data = api.plain(value, block.start, block.end);
    const local = data.map.findIndex((index) => index >= start);
    const point = local < 0 ? data.clean.length : local;
    const before = api.previousEnd(data.clean, point);
    const after = api.nextEnd(data.clean, point);
    const from = before < 0 ? 0 : before + 1;
    const to = after < 0 ? data.clean.length : after + 1;
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
    if (/^[,:;.!?…]+$/.test(value)) return "punctuation";
    if (/^(?:-|\u2011|\u2013|\u2014)$/.test(value)) return "separator";
    if (/^[«»„“"'()[\]{}]$/.test(value)) return "wrapper";
    return "word";
  },
  wrap: {
    close(value) {
      return {
        "«": "»",
        "„": "“",
        "“": "”",
        "\"": "\"",
        "'": "'",
        "(": ")",
        "[": "]",
        "{": "}",
      }[value];
    },
    opening(value) {
      return /[\u0022\u0027\u0028\u005B\u007B\u00AB\u201C\u201E]/.test(
        String(value || ""),
      );
    },
    closing(value) {
      return /[\u0022\u0027\u0029\u005D\u007D\u00BB\u201C\u201D]/.test(
        String(value || ""),
      );
    },
    terminal(value) {
      return /[.!?\u2026]/.test(String(value || ""));
    },
    edge(value) {
      const text = String(value || "");
      const match = text.match(
        /^(\s*[\u0022\u0027\u0029\u005D\u007D\u00BB\u201C\u201D]+)([,:;.!?\u2026]+\s*)$/,
      );
      return match ? { close: match[1], punctuation: match[2] } : null;
    },
    open(value, edge = false) {
      const text = String(value || "").trim();
      if (!text) return "";
      return edge ? text : ` ${text}`;
    },
    closeJoin(value, edge = false) {
      const text = String(value || "").trim();
      if (!text) return "";
      return edge ? text : `${text} `;
    },
    single(group, value) {
      if (!group?.word) return group;
      const openIndex = group.word.start - 1;
      const closeIndex = group.word.end;
      const open = value[openIndex] || "";
      const close = value[closeIndex] || "";
      if (openIndex < 0 || api.wrap.close(open) !== close) return group;
      const closeToken = {
        start: closeIndex,
        end: closeIndex + 1,
        text: close,
        type: "wrapper",
      };
      const tokens = [
        { start: openIndex, end: group.word.start, text: open, type: "wrapper" },
      ];
      group.tokens.forEach((token) => {
        tokens.push(token);
        if (token === group.word) tokens.push(closeToken);
      });
      return {
        ...group,
        tokens,
        absStart: openIndex,
        absEnd: Math.max(group.absEnd, closeIndex + 1),
      };
    },
    atom(group) {
      const first = group?.tokens?.[0];
      const last = group?.tokens?.[group.tokens.length - 1];
      if (!first || !last || first.type !== "wrapper" || last.type !== "wrapper") {
        return null;
      }
      return api.wrap.close(first.text) === last.text
        ? { open: first, close: last }
        : null;
    },
    expand(data, selection, step) {
      if (selection.from !== selection.to) return null;
      const groups = data.groups.map((group) => ({
        ...group,
        tokens: group.tokens.slice(),
      }));
      const current = groups[selection.from];
      const neighborIndex = selection.from + step;
      const neighbor = groups[neighborIndex];
      const atom = api.wrap.atom(neighbor);
      if (!current || !neighbor || !atom) return null;
      const between = data.between.slice();
      if (step > 0) {
        current.tokens = [atom.open, ...current.tokens];
        current.absStart = atom.open.start;
        neighbor.tokens = neighbor.tokens.slice(1);
        neighbor.absStart = neighbor.word.start;
        between[selection.from] = " ";
      } else {
        current.tokens = [...current.tokens, atom.close];
        current.absEnd = atom.close.end;
        neighbor.tokens = neighbor.tokens.slice(0, -1);
        neighbor.absEnd = neighbor.word.end;
        between[neighborIndex] = " ";
      }
      const render = api.render({ ...data, between }, groups);
      const item = render.ranges.find((range) => range.group === current);
      if (!item) return null;
      return {
        value:
          data.value.slice(0, data.start) +
          render.text +
          data.value.slice(data.end),
        start: data.start + item.start,
        end: data.start + item.end,
      };
    },
    move(data, selection, step, side, join) {
      const between = data.between.slice();
      const before = selection.from - 1;
      const after = selection.to;
      const first = selection.from <= 0;
      const last = selection.to >= data.groups.length - 1;
      const setBefore = (value) => {
        if (first) return { head: value };
        between[before] = value;
        return {};
      };
      const setAfter = (value) => {
        if (last) return { tail: value };
        between[after] = value;
        return {};
      };
      const plainBefore = first
        ? ""
        : api.between(data.groups[before], data.groups[selection.from], "");
      const plainAfter = last
        ? ""
        : api.between(data.groups[selection.to], data.groups[after + 1], "");
      const patch =
        step > 0 && side === "open"
          ? {
              ...setBefore(api.wrap.open(join, first)),
              ...setAfter(plainAfter),
            }
          : step > 0 && side === "close"
            ? {
                ...setBefore(api.wrap.closeJoin(join, first)),
                ...setAfter(plainAfter),
              }
            : step < 0 && side === "open"
              ? {
                  ...setBefore(plainBefore),
                  ...setAfter(api.wrap.open(join, last)),
                }
              : {
                  ...setBefore(plainBefore),
                  ...setAfter(
                    api.wrap.closeJoin(join, last) + (last ? data.tail : ""),
                  ),
                };
      return {
        between,
        head: patch.head ?? data.head,
        tail: patch.tail ?? data.tail,
      };
    },
    cross(data, selection, step) {
      if (selection.from !== selection.to) return null;
      const before = selection.from
        ? data.between[selection.from - 1]
        : data.head;
      const after =
        selection.to < data.groups.length - 1
          ? data.between[selection.to]
          : data.tail;
      const side =
        step > 0 && api.wrap.opening(after)
          ? "open"
          : step > 0 && api.wrap.closing(after)
            ? "close"
            : step < 0 && api.wrap.opening(before)
              ? "open"
              : step < 0 && api.wrap.closing(before)
                ? "close"
                : "";
      const join = step > 0 ? after : before;
      if (!side) return null;
      const rightEdge = step > 0 && selection.to >= data.groups.length - 1;
      const leftEdge = step < 0 && selection.from <= 0;
      const split = step > 0 && side === "close" ? api.wrap.edge(join) : null;
      if (rightEdge && api.wrap.terminal(join) && !split) {
        return null;
      }
      if (leftEdge && api.wrap.terminal(join)) {
        return null;
      }
      const moved = api.wrap.move(data, selection, step, side, split?.close || join);
      if (split && rightEdge) moved.tail = split.punctuation;
      if (split && !rightEdge) moved.between[selection.to] = split.punctuation;
      const render = api.render({ ...data, ...moved }, data.groups);
      const group = data.groups[selection.from];
      const item = render.ranges.find((range) => range.group === group);
      if (!item) return null;
      return {
        value:
          data.value.slice(0, data.start) +
          render.text +
          data.value.slice(data.end),
        start: data.start + item.start,
        end: data.start + item.end,
      };
    },
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
      }
    });
    const indexed = groups.map((group, index) => {
      const first = group.tokens[0] || group.word;
      const lastToken = group.tokens[group.tokens.length - 1] || group.word;
      return {
        ...group,
        index,
        absStart: first.start,
        absEnd: lastToken.end,
      };
    });
    const wrapped = indexed.map((group) => api.wrap.single(group, data.value));
    const between = wrapped
      .slice(0, -1)
      .map((group, index) =>
        data.value.slice(group.absEnd, wrapped[index + 1].absStart),
      );
    const head = wrapped.length
      ? data.value.slice(data.start, wrapped[0].absStart)
      : data.value.slice(data.start, data.end);
    const tail = wrapped.length
      ? data.value.slice(wrapped[wrapped.length - 1].absEnd, data.end)
      : "";
    return {
      ...data,
      groups: wrapped.map((group, index) => ({ ...group, index })),
      between,
      head,
      tail,
    };
  },
  moves(value, range) {
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
    const text = String(value || "");
    if (mode === "lower" && /^[А-ЯЁA-Z0-9]{2,}$/u.test(text)) return value;
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
  boundary(join) {
    return /[,:;\u2013\u2014]/.test(String(join || ""));
  },
  cross(data, selection, step) {
    if (step > 0 && !selection.from) return null;
    if (step < 0 && selection.to >= data.groups.length - 1) return null;
    const next = step > 0 ? selection.to : selection.from - 1;
    const join = data.between[next];
    if (!api.boundary(join)) return null;
    const between = data.between.slice();
    const patch =
      step > 0
        ? {
            head: selection.from ? data.head : join,
            tail: data.tail,
            from: selection.from - 1,
            to: selection.to,
          }
        : {
            head: data.head,
            tail: selection.to < data.groups.length - 1 ? data.tail : join,
            from: selection.from - 1,
            to: selection.to,
          };
    if (step > 0) {
      if (selection.from) between[patch.from] = join;
      between[patch.to] = api.between(
        data.groups[selection.to],
        data.groups[selection.to + 1],
        "",
      );
    } else {
      between[patch.from] = api.between(
        data.groups[selection.from - 1],
        data.groups[selection.from],
        "",
      );
      if (selection.to < data.groups.length - 1) between[patch.to] = join;
    }
    const render = api.render(
      { ...data, between, head: patch.head, tail: patch.tail },
      data.groups,
    );
    const chunk = data.groups.slice(selection.from, selection.to + 1);
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
  place(selection, step, size) {
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
    const data = api.moves(value, range);
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
    const data = api.moves(value, range);
    const selection = api.pick(data, start, end);
    if (!selection) return false;
    const expanded = api.wrap.expand(data, selection, step);
    if (expanded) {
      api.set(element, expanded.value);
      return api.doneData(element, expanded);
    }
    const wrapped = api.wrap.cross(data, selection, step);
    if (wrapped) {
      api.set(element, wrapped.value);
      return api.doneData(element, wrapped);
    }
    const crossed = api.cross(data, selection, step);
    if (crossed) {
      api.set(element, crossed.value);
      return api.doneData(element, crossed);
    }
    const next = api.place(selection, step, data.groups.length);
    if (!next) return false;
    const result = api.reorder(data, selection, next.target);
    if (!result) return false;
    api.set(element, result.value);
    return api.doneData(element, result);
  },
});
