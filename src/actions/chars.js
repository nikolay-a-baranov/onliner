export const createChars = (api) => {
  const chars = {
  punctCycleMemory: new WeakMap(),
  nbspActive(element) {
    const start = element.selectionStart;
    const value = element.value;
    return value[start - 1] === "\u00a0" || value[start] === "\u00a0";
  },
  state(element, id) {
    const value = String(id || "");
    if (value === "nbsp") return chars.nbspActive(element);
    if (value === "comma") return chars.punctMarkState(element, ",");
    if (value === "colon") return chars.punctMarkState(element, ":");
    if (value === "dash") return chars.punctMarkState(element, "—");
    if (value === "quote") return chars.quoteState(element);
    return false;
  },
  nbsp(element) {
    api.punctCycleClear(element);
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
  punctCycleClear(element) {
    if (!element) return false;
    chars.punctCycleMemory.delete(element);
    return true;
  },
  punctCycleState(element, start, block) {
    const current = chars.punctCycleMemory.get(element) || null;
    if (!current) return null;
    if (current.start !== start) {
      chars.punctCycleClear(element);
      return null;
    }
    if (!block || current.blockStart !== block.start || current.blockEnd !== block.end) {
      chars.punctCycleClear(element);
      return null;
    }
    return current;
  },
  punctCycleRemember(element, state = {}) {
    if (!element) return false;
    chars.punctCycleMemory.set(element, state);
    return true;
  },
  punctCycleList(data, atEnd = false) {
    const base = atEnd
      ? data.list.filter((item) => ["dot", "colon"].includes(item.key))
      : data.list.slice();
    return [...base, { key: "none", mark: "", next: "" }];
  },
  punctCycleToken(value, found, target) {
    if (target.key !== "none") return target.next;
    const tail = api.punctNeedSpace(value, found.at + found.raw.length);
    if (api.punctLead(value, found.at)) return "";
    return tail ? " " : "";
  },
  punctCycleFound(value, anchor = 0) {
    const found = api.punctRead(value, anchor);
    if (found) return found;
    const gap = String(value || "")
      .slice(anchor)
      .match(/^[ \u00a0]+/)?.[0] || "";
    return { at: anchor, raw: gap, key: "" };
  },
  punctCycleApply(value, start, found, target) {
    const token = api.punctCycleToken(value, found, target);
    let string =
      value.slice(0, found.at) +
      token +
      value.slice(found.at + found.raw.length);
    if (found.key === "dot" && target.key !== "dot") {
      string = api.punctCase(string, found.at + token.length, "lower");
    }
    if (found.key !== "dot" && target.key === "dot") {
      string = api.punctCase(string, found.at + token.length, "upper");
    }
    if (!found.key && target.key === "dot") {
      string = api.punctCase(string, found.at + token.length, "upper");
    }
    const scope = api.block(string, start, start);
    const cleaned =
      target.key === "dot"
        ? api.punctTailMarkBlock(string, ".", scope.end)
        : target.key === "colon"
          ? api.punctTailMarkBlock(string, ":", scope.end)
          : string;
    return {
      value: api.punctTagGap(cleaned),
      anchor: found.at,
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
    const block = api.block(value, start, start);
    const sticky = api.punctCycleState(element, start, block);
    const found = sticky
      ? api.punctCycleFound(value, sticky.anchor)
      : api.punctForward(value, start);
    if (!found) return false;
    const tail = value.slice(found.at + found.raw.length, block.end);
    const atEnd = !tail.replace(/(?:\s|<\/?[^>]+>|&nbsp;|&#160;)+/gi, "");
    const cycle = api.punctCycleList(data, atEnd);
    const currentKey = found.key || "none";
    const currentIndex = cycle.findIndex((item) => item.key === currentKey);
    const nextIndex = sticky?.nextKey
      ? cycle.findIndex((item) => item.key === sticky.nextKey)
      : currentIndex < 0
        ? 0
        : (currentIndex + 1) % cycle.length;
    const next = cycle[nextIndex < 0 ? 0 : nextIndex];
    const result = api.punctCycleApply(value, start, found, next);
    element.value = result.value;
    const nextKey = cycle[(cycle.findIndex((item) => item.key === next.key) + 1) % cycle.length].key;
    const nextBlock = api.block(result.value, start, start);
    api.punctCycleRemember(element, {
      start,
      blockStart: nextBlock.start,
      blockEnd: nextBlock.end,
      anchor: result.anchor,
      nextKey,
    });
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
    api.punctCycleClear(element);
    const start = element.selectionStart;
    const end = element.selectionEnd;
    const value = element.value;
    if (start === end) {
      const data = api.quoted(value, start);
      if (data) {
        const body = value.slice(data.bodyStart, data.bodyEnd);
        element.value =
          value.slice(0, data.start) + body + value.slice(data.end);
        return api.done(element, data.start, data.start + body.length);
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
    return api.done(
      element,
      range.start + before.length,
      range.end + before.length,
    );
  },
  punctMarkKey(raw = "") {
    if (/^[ \u00a0]*\u2014/.test(raw)) return "dash";
    if (String(raw).trim().startsWith(":")) return "colon";
    if (String(raw).trim().startsWith(",")) return "comma";
    if (String(raw).trim().startsWith(".")) return "dot";
    return "";
  },
  punctRead(value = "", at = 0) {
    const match = String(value || "")
      .slice(at)
      .match(/^([ \u00a0]*\u2014[ \u00a0]*|:\s*|,\s*|\.\s*)/);
    if (!match) return null;
    return {
      at,
      raw: match[1],
      key: api.punctMarkKey(match[1]),
    };
  },
  punctNeedSpace(value = "", start = 0) {
    const block = api.block(value, start, start);
    const tail = String(value || "")
      .slice(start, block.end)
      .replace(/(?:[ \u00a0\t\r\n]|&nbsp;|&#160;|<\/?[^>]+>)+/gi, "");
    return Boolean(tail);
  },
  punctLead(value = "", start = 0) {
    const block = api.block(value, start, start);
    const lead = String(value || "").slice(block.start, start);
    return !lead.replace(/(?:[ \u00a0\t\r\n]|&nbsp;|&#160;|<\/?[^>]+>)+/gi, "");
  },
  punctToken(mark, space = true, lead = false) {
    const tail = space ? " " : "";
    if (mark === "—" && lead) return space ? "—\u00a0" : "—";
    if (mark === "—") return `\u00a0—${tail}`;
    return `${mark}${tail}`;
  },
  punctCaret(at, token) {
    return at + String(token || "").length;
  },
  punctResult(value, at, token, raw) {
    return {
      value: value.slice(0, at) + token + value.slice(at + raw.length),
      caret: api.punctCaret(at, token),
    };
  },
  punctDashRemove(value, start) {
    const block = api.block(value, start, start);
    const source = value.slice(block.start, block.end);
    const matches = [...source.matchAll(/[ \u00a0]*\u2014[ \u00a0]*/g)];
    const found = matches
      .map((match) => ({
        raw: match[0],
        from: block.start + match.index,
        to: block.start + match.index + match[0].length,
      }))
      .find((item) => start >= item.from && start <= item.to);
    if (!found) return null;
    const space = api.punctLead(value, found.from)
      ? ""
      : found.raw.match(/\u2014([ ]*)$/)?.[1] || "";
    return {
      value: value.slice(0, found.from) + space + value.slice(found.to),
      caret: found.from,
    };
  },
  punctLocalSimple(value, start, mark) {
    if (mark === "—") return api.punctDashRemove(value, start);
    if (value[start - 1] === mark) {
      return {
        value: value.slice(0, start - 1) + value.slice(start),
        caret: start - 1,
      };
    }
    if (value[start] === mark) {
      return {
        value: value.slice(0, start) + value.slice(start + 1),
        caret: start,
      };
    }
    if (
      start >= 2 &&
      value[start - 2] === mark &&
      (value[start - 1] === " " || value[start - 1] === "\u00a0")
    ) {
      return {
        value: value.slice(0, start - 2) + value.slice(start - 1),
        caret: start - 2,
      };
    }
    return null;
  },
  punctInsertSimple(value, start, mark) {
    const markKey = { ",": "comma", ":": "colon", "—": "dash" }[mark];
    const dataKeys = ["dot", "comma", "colon", "dash"];
    const swapBeforeWord = (wordStart) => {
      const left = value.slice(0, wordStart);
      const found = left.match(/([ \u00a0]*\u2014[ \u00a0]*|:\s*|,\s*|\.\s*)$/);
      if (!found) return null;
      const raw = found[1];
      const from = wordStart - raw.length;
      const key = api.punctMarkKey(raw);
      if (!dataKeys.includes(key)) return null;
      if (key === markKey) {
        if (markKey === "dash") return api.punctDashRemove(value, from);
        const next = value.slice(0, from) + value.slice(wordStart);
        const tail = next.slice(from);
        const merged = /^[A-Za-zА-Яа-яЁё0-9]/.test(tail)
          ? `${next.slice(0, from)} ${tail}`
          : next;
        return {
          value: key === "dot" ? api.punctCase(merged, from, "lower") : merged,
          caret: from,
        };
      }
      const space = api.punctNeedSpace(value, wordStart);
      const token = api.punctToken(mark, space, api.punctLead(value, from));
      const next = key === "comma" && markKey === "dash" ? `,${token}` : token;
      const merged = value.slice(0, from) + next + value.slice(wordStart);
      return {
        value:
          key === "dot" && markKey !== "dot"
            ? api.punctCase(merged, from + next.length, "lower")
            : merged,
        caret: api.punctCaret(from, next),
      };
    };
    const swapAt = (pivot) => {
      const found = api.punctRead(value, pivot);
      if (!found) return null;
      if (found.key === markKey) {
        if (markKey === "dash") return api.punctDashRemove(value, pivot);
        const left = value.slice(0, pivot);
        const right = value.slice(pivot + found.raw.length);
        const stick =
          /[A-Za-zА-Яа-яЁё0-9]$/.test(left) &&
          /^[A-Za-zА-Яа-яЁё0-9]/.test(right);
        const merged = stick ? `${left} ${right}` : left + right;
        return {
          value:
            found.key === "dot"
              ? api.punctCase(merged, pivot, "lower")
              : merged,
          caret: pivot,
        };
      }
      if (!dataKeys.includes(found.key)) return null;
      const space = api.punctNeedSpace(value, pivot + found.raw.length);
      const token = api.punctToken(mark, space, api.punctLead(value, pivot));
      const next =
        found.key === "comma" && markKey === "dash" ? `,${token}` : token;
      const merged =
        value.slice(0, pivot) + next + value.slice(pivot + found.raw.length);
      return {
        value:
          found.key === "dot" && markKey !== "dot"
            ? api.punctCase(merged, pivot + next.length, "lower")
            : merged,
        caret: api.punctCaret(pivot, next),
      };
    };
    const insertAt = (pivot) => {
      const gap = value.slice(pivot).match(/^[ \u00a0]+/)?.[0] || "";
      const space = api.punctNeedSpace(value, pivot + gap.length);
      const token = api.punctToken(mark, space, api.punctLead(value, pivot));
      return api.punctResult(value, pivot, token, gap);
    };
    const range = api.word(value, start);
    if (range.start === range.end) {
      const swap = swapAt(start);
      return swap || insertAt(start);
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
      return insertAt(pivot);
    }
    const pivot = range.end;
    const swap = swapAt(pivot);
    return swap || insertAt(pivot);
  },
  punctPairRange(value, start, end) {
    const trimmed = api.trim(value, start, end);
    if (trimmed.start >= trimmed.end) return null;
    const startWord = api.word(value, trimmed.start);
    const endWord = api.word(value, trimmed.end);
    const rangeStart =
      startWord.start < trimmed.start && trimmed.start <= startWord.end
        ? startWord.start
        : trimmed.start;
    const rangeEnd =
      endWord.start < trimmed.end && trimmed.end < endWord.end
        ? endWord.end
        : trimmed.end;
    return {
      start: rangeStart,
      end: rangeEnd,
    };
  },
  punctPairPattern(mark, side) {
    if (mark === "—") {
      return side === "left"
        ? /[ \u00a0]*\u2014[ \u00a0]*$/
        : /^[ \u00a0]*\u2014[ \u00a0]*/;
    }
    if (mark === ",") return side === "left" ? /,\s*$/ : /^,\s*/;
    return null;
  },
  punctPairJoin(left = "", right = "") {
    if (!left || !right) return "";
    if (/\s/.test(left) || /\s/.test(right)) return "";
    if (/\n/.test(left) || /\n/.test(right)) return "";
    return " ";
  },
  punctPairRemove(value, range, mark) {
    const leftPattern = api.punctPairPattern(mark, "left");
    const rightPattern = api.punctPairPattern(mark, "right");
    if (!leftPattern || !rightPattern) return null;
    const left = value.slice(0, range.start);
    const right = value.slice(range.end);
    const leftMatch = left.match(leftPattern);
    const rightMatch = right.match(rightPattern);
    if (!leftMatch || !rightMatch) return null;
    const leftFrom = range.start - leftMatch[0].length;
    const rightTo = range.end + rightMatch[0].length;
    const body = value.slice(range.start, range.end);
    const before = value.slice(0, leftFrom);
    const after = value.slice(rightTo);
    const leftJoin = api.punctPairJoin(before.slice(-1), body[0] || "");
    const rightJoin = api.punctPairJoin(body.slice(-1), after[0] || "");
    return {
      value: before + leftJoin + body + rightJoin + after,
      start: before.length + leftJoin.length,
      end: before.length + leftJoin.length + body.length,
    };
  },
  punctPairLeftFrom(value, start) {
    const block = api.block(value, start, start);
    const source = value.slice(block.start, start);
    const gap = source.match(/[ \u00a0]+$/)?.[0] || "";
    return start - gap.length;
  },
  punctPairInsert(value, range, mark) {
    const leftFrom = api.punctPairLeftFrom(value, range.start);
    const rightGap = value.slice(range.end).match(/^[ \u00a0]+/)?.[0] || "";
    const rightTo = range.end + rightGap.length;
    const body = value.slice(range.start, range.end);
    const tail = api.punctNeedSpace(value, rightTo);
    const before =
      mark === "—"
        ? api.punctToken(mark, true, api.punctLead(value, leftFrom))
        : `${mark} `;
    const after = mark === "—" ? `\u00a0—${tail ? " " : ""}` : `${mark}${tail ? " " : ""}`;
    const left = value.slice(0, leftFrom);
    const right = value.slice(rightTo);
    return {
      value: left + before + body + after + right,
      start: left.length + before.length,
      end: left.length + before.length + body.length,
    };
  },
  punctPair(element, mark) {
    const range = api.punctPairRange(
      element.value,
      element.selectionStart,
      element.selectionEnd,
    );
    if (!range) return false;
    const removed = api.punctPairRemove(element.value, range, mark);
    const result = removed || api.punctPairInsert(element.value, range, mark);
    element.value = api.punctTagGap(result.value);
    return api.doneData(element, result);
  },
  bracketRange(value, start, end) {
    if (start !== end) return api.punctPairRange(value, start, end);
    const range = api.item(value, start, end);
    return range.start === range.end ? null : range;
  },
  bracketRemove(value, range) {
    if (value[range.start - 1] !== "(" || value[range.end] !== ")") return null;
    return {
      value:
        value.slice(0, range.start - 1) +
        value.slice(range.start, range.end) +
        value.slice(range.end + 1),
      start: range.start - 1,
      end: range.end - 1,
    };
  },
  brackets(element) {
    const range = api.bracketRange(
      element.value,
      element.selectionStart,
      element.selectionEnd,
    );
    if (!range) return false;
    const removed = api.bracketRemove(element.value, range);
    if (removed) {
      element.value = removed.value;
      return api.doneData(element, removed);
    }
    element.value =
      element.value.slice(0, range.start) +
      "(" +
      element.value.slice(range.start, range.end) +
      ")" +
      element.value.slice(range.end);
    return api.done(element, range.start + 1, range.end + 1);
  },
  punctMarkState(element, mark) {
    const start = element.selectionStart;
    const end = element.selectionEnd;
    const value = element.value;
    if (start !== end) {
      const range = chars.punctPairRange(value, start, end);
      if (!range) return false;
      if (mark === "—") return Boolean(chars.punctPairRemove(value, range, mark));
      return Boolean(chars.punctPairRemove(value, range, mark));
    }
    return chars.punctMarkActive(element, mark);
  },
  quoteState(element) {
    const start = element.selectionStart;
    const end = element.selectionEnd;
    const value = element.value;
    if (start === end) return Boolean(chars.quoted(value, start));
    const range = api.trim(value, start, end);
    const pairs = [
      ["«", "»"],
      ["„", "“"],
    ];
    return pairs.some(
      ([open, close]) => value[range.start - 1] === open && value[range.end] === close,
    );
  },
  punctMarkActive(element, mark) {
    const start = element.selectionStart;
    const end = element.selectionEnd;
    const value = element.value;
    if (start !== end) return Boolean(api.punctPairRange(value, start, end));
    if (api.punctLocalSimple(value, start, mark)) return true;
    if (mark !== ",") return false;
    const range = api.word(value, start);
    if (range.start !== start || range.start === range.end) return false;
    return /,\s*$/.test(value.slice(0, range.start));
  },
  punctMark(element, mark) {
    api.punctCycleClear(element);
    if (element.selectionStart !== element.selectionEnd && [",", "—"].includes(mark)) {
      return api.punctPair(element, mark);
    }
    const start = element.selectionStart;
    const value = element.value;
    const local = api.punctLocalSimple(value, start, mark);
    const result =
      local === null ? api.punctInsertSimple(value, start, mark) : local;
    element.value = api.punctTagGap(result.value);
    return api.done(element, result.caret);
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
    api.punctCycleClear(element);
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
  };
  return {
    chars,
    ...chars,
  };
};
