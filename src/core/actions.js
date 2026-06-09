import { transform } from "./transform.js";
import { embed as embedCore } from "./embed.js";
import { more } from "./more.js";
import { block } from "./block.js";
import { edit } from "./edit.js";

export const actions = {
  element() {
    const element = document.getElementById("content");
    if (!element) return null;
    if (element.tagName !== "TEXTAREA" && element.tagName !== "INPUT")
      return null;
    return element;
  },
  block(value, start, end) {
    const left = value.lastIndexOf("\n", start - 1) + 1;
    const right = value.indexOf("\n", end);
    return {
      start: left,
      end: right < 0 ? value.length : right,
    };
  },
  insideTag(value, start, tag) {
    const left = value.slice(0, start);
    const open = left.lastIndexOf(`<${tag}>`);
    const close = left.lastIndexOf(`</${tag}>`);
    return open > close;
  },
  around(value, start, pattern) {
    return (
      pattern.test(value[start - 1] || "") || pattern.test(value[start] || "")
    );
  },
  state() {
    const element = actions.element();
    if (!element) return {};
    const start = element.selectionStart || 0;
    const end = element.selectionEnd || start;
    const value = element.value || "";
    const block = actions.block(value, start, end);
    const text = value.slice(block.start, block.end);
    const note =
      !/<\/em>\([^()]+?\. — Прим\. [^()]+\)<em>/i.test(text) &&
      /\(([^()]+?)(?:\s+—|,)\s+прим\.\s+([^()]+)\)/i.test(text);
    return {
      "editor.nbsp": value[start - 1] === "\u00a0" || value[start] === "\u00a0",
      "editor.em": actions.insideTag(value, start, "em"),
      "editor.strong": actions.insideTag(value, start, "strong"),
      "editor.comma": actions.around(value, start, /,/),
      "editor.colon": actions.around(value, start, /:/),
      "editor.dash": actions.around(value, start, /\u2014/),
      "editor.punct": actions.around(value, start, /[,.:\u2014!?…;]/),
      "editor.quote": Boolean(actions.quoted(value, start)),
      "editor.note": note,
      "editor.list": /<\/?(?:ul|ol|li)\b/i.test(text),
      "editor.year": Boolean(
        value.slice(0, start).match(/\d{4}$/) ||
        value.slice(start).match(/^\d{4}/),
      ),
      "editor.number": Boolean(
        value.slice(0, start).match(/\d+$/) || value.slice(start).match(/^\d+/),
      ),
    };
  },
  active(id) {
    return Boolean(actions.state()[String(id || "")]);
  },
  apply(run) {
    const element = actions.element();
    if (!element) return false;
    return edit.apply(element, run);
  },
  insert(value, caretOffset = null) {
    const element = actions.element();
    if (!element) return false;
    return block.insert(element, value, caretOffset);
  },
  embed() {
    return navigator.clipboard
      .readText()
      .then((value) => {
        const element = actions.element();
        const shortcode = embedCore.build(value);
        if (!element || !shortcode) return false;
        return block.insert(element, shortcode);
      })
      .catch(() => false);
  },

  emit(element) {
    if (!element) return;
    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
  },
  done(element, start = null, end = start) {
    if (!element) return false;
    if (Number.isInteger(start)) {
      const size = element.value.length;
      const from = Math.max(0, Math.min(start, size));
      const to = Number.isInteger(end)
        ? Math.max(0, Math.min(end, size))
        : from;
      element.selectionStart = from;
      element.selectionEnd = to;
    }
    actions.emit(element);
    element.focus?.();
    return true;
  },
  word(value, start) {
    const before = value.slice(0, start).match(/[А-Яа-яA-Za-zЁё0-9]+$/);
    const after = value.slice(start).match(/^[А-Яа-яA-Za-zЁё0-9]+/);
    return {
      start: before ? start - before[0].length : start,
      end: start + (after ? after[0].length : 0),
    };
  },
  trim(value, start, end) {
    const string = value.slice(start, end);
    const left = string.match(/^\s*/)[0].length;
    const right = string.match(/\s*$/)[0].length;
    return {
      start: start + left,
      end: end - right,
    };
  },
  inside(value, start, end) {
    const string = value.slice(start, end);
    const left = string.match(/^\s*(?:<[^/][^>]*>\s*)*/)[0].length;
    const right = string.match(/(?:\s*<\/[^>]+>)*\s*$/)[0].length;
    return {
      start: start + left,
      end: end - right,
    };
  },
  range(value, start, end) {
    if (start !== end) return actions.trim(value, start, end);
    const block = actions.block(value, start, end);
    return actions.inside(value, block.start, block.end);
  },
  item(value, start, end) {
    if (start !== end) return actions.trim(value, start, end);
    return actions.word(value, start);
  },
  replace(element, string) {
    const start = element.selectionStart;
    const end = element.selectionEnd;
    const value = element.value;
    element.value = value.slice(0, start) + string + value.slice(end);
    return actions.done(element, start + string.length);
  },
  nbsp(element) {
    const start = element.selectionStart;
    const value = element.value;
    if (value[start - 1] === "\u00a0") {
      element.value = value.slice(0, start - 1) + " " + value.slice(start);
      return actions.done(element, start);
    }
    if (value[start] === "\u00a0") {
      element.value = value.slice(0, start) + " " + value.slice(start + 1);
      return actions.done(element, start + 1);
    }
    const left = value.slice(0, start);
    const right = value.slice(start);
    if (left.endsWith(" ")) {
      const before = left.slice(0, -1) + "\u00a0";
      element.value = before + right;
      return actions.done(element, before.length);
    }
    if (right.startsWith(" ")) {
      element.value = left + "\u00a0" + right.slice(1);
      return actions.done(element, left.length + 1);
    }
    element.value = left + "\u00a0" + right;
    return actions.done(element, start + 1);
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
    const block = actions.block(value, start, start);
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
      actions.punctTailMark(value.slice(0, edge), mark) + value.slice(edge)
    );
  },
  punct(element) {
    const start = element.selectionStart;
    const value = element.value;
    const data = actions.punctData();
    const found = actions.punctForward(value, start);
    if (!found) return false;
    const block = actions.block(value, start, start);
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
      string = actions.punctCase(string, found.at + next.next.length, "lower");
    }
    if (found.key !== "dot" && next.key === "dot") {
      string = actions.punctCase(string, found.at + next.next.length, "upper");
    }
    const scope = actions.block(string, start, start);
    const cleaned =
      next.key === "dot"
        ? actions.punctTailMarkBlock(string, ".", scope.end)
        : next.key === "colon"
          ? actions.punctTailMarkBlock(string, ":", scope.end)
          : string;
    element.value = actions.punctTagGap(cleaned);
    return actions.done(element, start);
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
      const data = actions.quoted(value, start);
      if (data) {
        const body = value.slice(data.bodyStart, data.bodyEnd);
        element.value =
          value.slice(0, data.start) + body + value.slice(data.end);
        const plain = body.replace(/<\/?[^>]+>/g, "");
        const lead = plain.match(/^\s*/)?.[0].length || 0;
        return actions.done(element, data.start + lead);
      }
    }
    const range = actions.item(value, start, end);
    if (range.start === range.end) return false;
    const string = value.slice(range.start, range.end);
    const block = actions.block(value, range.start, range.end);
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
    return actions.done(element, range.start + before.length);
  },
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
    const block = actions.block(value, start, start);
    const data = actions.plain(value, block.start, block.end);
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
    return actions.quoteLead(range, value);
  },
  sentenceScope(value, start, end) {
    if (start === end) return actions.sentence(value, start);
    const left = actions.sentence(value, start);
    const right = actions.sentence(value, Math.max(0, end - 1));
    return {
      start: Math.min(left.start, right.start),
      end: Math.max(left.end, right.end),
    };
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
        (!groups.length || actions.openWrap(token.text))
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
    const data = actions.plain(value, range.start, range.end);
    const token = /[А-Яа-яA-Za-zЁё0-9]+|[«»„“"'()[\]{}.,:;!?…]/g;
    const tokens = [...data.clean.matchAll(token)].map((match) => ({
      cleanStart: match.index,
      cleanEnd: match.index + match[0].length,
      start: data.map[match.index],
      end: data.map[match.index + match[0].length - 1] + 1,
      text: match[0],
      type: actions.kind(match[0]),
    }));
    return actions.groups({ ...data, tokens });
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
        return mode ? actions.caseText(token.text, mode) : token.text;
      })
      .join("");
  },
  caseText(value, mode) {
    return value.replace(
      /^((?:[«„“"'()[\]{}]\s*)*)([А-Яа-яA-Za-zЁё])/,
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
      const text = actions.text(group, mode);
      parts.push(text);
      const end = parts.join("").length;
      ranges.push({ group, start, end });
      if (index < groups.length - 1) {
        parts.push(
          actions.between(group, groups[index + 1], data.between[index]),
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
    const render = actions.render(data, groups);
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
    const range = actions.sentenceScope(value, start, end);
    const data = actions.motion(value, range);
    const selection = actions.pick(data, start, end);
    if (!selection || selection.from <= 0) return false;
    const result = actions.reorder(data, selection, 0);
    if (!result) return false;
    element.value = result.value;
    return actions.done(element, result.start, result.end);
  },
  move(element, step) {
    const start = element.selectionStart;
    const end = element.selectionEnd;
    const value = element.value;
    const range = actions.sentenceScope(value, start, end);
    const data = actions.motion(value, range);
    const selection = actions.pick(data, start, end);
    if (!selection) return false;
    const next = actions.shift(selection, step, data.groups.length);
    if (!next) return false;
    const result = actions.reorder(data, selection, next.target);
    if (!result) return false;
    element.value = result.value;
    return actions.done(element, result.start, result.end);
  },
  tag(value, start, name) {
    const before = `<${name}>`;
    const after = `</${name}>`;
    const left = value.slice(0, start);
    const open = left.lastIndexOf(before);
    const close = left.lastIndexOf(after);
    if (open < 0 || open < close) return null;
    const right = value.slice(start);
    const end = right.indexOf(after);
    if (end < 0) return null;
    return {
      start: open,
      end: start + end + after.length,
      bodyStart: open + before.length,
      bodyEnd: start + end,
      before,
      after,
    };
  },
  taggle(element, name) {
    const start = element.selectionStart;
    const end = element.selectionEnd;
    const value = element.value;
    const data = actions.tag(value, start, name);
    if (data && start >= data.bodyStart && end <= data.bodyEnd) {
      const body = value.slice(data.bodyStart, data.bodyEnd);
      element.value = value.slice(0, data.start) + body + value.slice(data.end);
      return actions.done(
        element,
        Math.max(data.start, start - data.before.length),
      );
    }
    const range = actions.range(value, start, end);
    if (range.start === range.end) return false;
    const before = `<${name}>`;
    const after = `</${name}>`;
    const string = value.slice(range.start, range.end);
    element.value =
      value.slice(0, range.start) +
      before +
      string +
      after +
      value.slice(range.end);
    return actions.done(
      element,
      Math.min(start + before.length, element.value.length),
    );
  },
  clearTag(element, name) {
    const pattern = new RegExp(`</?${name}>`, "g");
    const next = element.value.replace(pattern, "");
    if (next === element.value) return false;
    const start = element.selectionStart;
    const end = element.selectionEnd;
    element.value = next;
    return actions.done(
      element,
      Math.min(start, next.length),
      Math.min(end, next.length),
    );
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
          ? actions.punctCase(merged, from, "lower")
          : merged;
      }
      const merged = value.slice(0, from) + token + value.slice(wordStart);
      return key === "dot" && markKey !== "dot"
        ? actions.punctCase(merged, from + token.length, "lower")
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
          ? actions.punctCase(merged, pivot, "lower")
          : merged;
      }
      if (dataKeys.includes(key)) {
        const merged =
          value.slice(0, pivot) + token + value.slice(pivot + raw.length);
        return key === "dot" && markKey !== "dot"
          ? actions.punctCase(merged, pivot + token.length, "lower")
          : merged;
      }
      return null;
    };
    const dataKeys = ["dot", "comma", "colon", "dash"];
    const range = actions.word(value, start);
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
        (value[range.start - 1] === " " || value[range.start - 1] === "\u00a0");
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
    const local = actions.punctLocalSimple(value, start, mark);
    const next =
      local === null ? actions.punctInsertSimple(value, start, mark) : local;
    element.value = actions.punctTagGap(next);
    return actions.done(element, start);
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
    const block = actions.block(value, start, end);
    const local = value.slice(block.start, block.end);
    const next = actions.qswapText(local, start - block.start);
    if (!next) return false;
    element.value =
      value.slice(0, block.start) + next.text + value.slice(block.end);
    return actions.done(element, block.start + next.cursor);
  },
  accent(element) {
    const start = element.selectionStart;
    const end = element.selectionEnd;
    const value = element.value;
    const acute = "\u0301";
    const base = (() => {
      if (
        start !== end &&
        end - start === 1 &&
        /[А-Яа-яA-Za-zЁё]/.test(value[start] || "")
      )
        return start;
      if (
        start > 1 &&
        value[start - 1] === acute &&
        /[А-Яа-яA-Za-zЁё]/.test(value[start - 2] || "")
      )
        return start - 2;
      if (/[А-Яа-яA-Za-zЁё]/.test(value[start - 1] || "")) return start - 1;
      if (
        value[start] === acute &&
        /[А-Яа-яA-Za-zЁё]/.test(value[start - 1] || "")
      )
        return start - 1;
      return -1;
    })();
    if (base < 0) return false;
    const markAt = base + 1;
    const run = value.slice(markAt).match(/^\u0301+/)?.[0].length || 0;
    if (run > 0) {
      element.value = value.slice(0, markAt) + value.slice(markAt + run);
      return actions.done(element, Math.max(markAt, start - run));
    }
    element.value = value.slice(0, markAt) + acute + value.slice(markAt);
    return actions.done(element, start <= markAt ? start : start + 1);
  },
  cyclePick(element, list) {
    const start = element.selectionStart;
    const end = element.selectionEnd;
    const value = element.value;
    if (start !== end) {
      element.value = value.slice(0, start) + list[0] + value.slice(end);
      return actions.done(element, start + list[0].length);
    }
    const left = value[start - 1];
    const right = value[start];
    const index = list.findIndex((item) => item === left || item === right);
    if (index < 0) {
      element.value = value.slice(0, start) + list[0] + value.slice(start);
      return actions.done(element, start + list[0].length);
    }
    const next = list[(index + 1) % list.length];
    const shift = list[index] === left ? -1 : 0;
    const place = start + shift;
    element.value =
      value.slice(0, place) + next + value.slice(place + list[index].length);
    return actions.done(element, start);
  },
  letter(element) {
    const start = element.selectionStart;
    const end = element.selectionEnd;
    const value = element.value;
    const range =
      start === end
        ? actions.word(value, start)
        : actions.trim(value, start, end);
    if (range.start === range.end) return false;
    const source = value.slice(range.start, range.end);
    const lower = source.toLowerCase();
    const next =
      source === lower
        ? lower.replace(
            /^((?:<[^>]+>|\s|[«„“"'()])+)?([А-Яа-яA-Za-zЁё])/,
            (_, left = "", letter) => `${left}${letter.toUpperCase()}`,
          )
        : lower;
    element.value = value.slice(0, range.start) + next + value.slice(range.end);
    return actions.done(
      element,
      start === end ? Math.min(start, element.value.length) : range.start,
      start === end
        ? Math.min(start, element.value.length)
        : range.start + next.length,
    );
  },
  number(element) {
    const start = element.selectionStart;
    const value = element.value;
    const small = [
      "ноль",
      "один",
      "два",
      "три",
      "четыре",
      "пять",
      "шесть",
      "семь",
      "восемь",
      "девять",
      "десять",
      "одиннадцать",
      "двенадцать",
      "тринадцать",
      "четырнадцать",
      "пятнадцать",
      "шестнадцать",
      "семнадцать",
      "восемнадцать",
      "девятнадцать",
    ];
    const tens = {
      20: "двадцать",
      30: "тридцать",
      40: "сорок",
      50: "пятьдесят",
      60: "шестьдесят",
      70: "семьдесят",
      80: "восемьдесят",
      90: "девяносто",
    };
    const build = (number) => {
      if (!Number.isInteger(number) || number < 0 || number >= 100) return null;
      if (number < 20) return small[number];
      const main = Math.floor(number / 10) * 10;
      const rest = number % 10;
      return rest ? `${tens[main]} ${small[rest]}` : tens[main];
    };
    const before = value.slice(0, start).match(/\d+$/);
    const after = value.slice(start).match(/^\d+/);
    if (!before && !after) return false;
    const range = {
      start: before ? start - before[0].length : start,
      end: start + (after ? after[0].length : 0),
    };
    const next = build(Number(value.slice(range.start, range.end)));
    if (!next) return false;
    element.value = value.slice(0, range.start) + next + value.slice(range.end);
    return actions.done(element, range.start + next.length);
  },
  yearToken(value, start) {
    const forms = [
      { short: "й", full: "год" },
      { short: "го", full: "года" },
      { short: "м", full: "году" },
    ];
    const token = /(\d{4})(?:[-‑–—](й|го|м)|(?:\u00a0| )(года|году|год))/giu;
    const word = (char) => /[0-9A-Za-zА-Яа-яЁё]/.test(char || "");
    for (const match of value.matchAll(token)) {
      const absStart = match.index;
      const absEnd = absStart + match[0].length;
      if (start < absStart || start > absEnd) continue;
      if (word(value[absStart - 1]) || word(value[absEnd])) continue;
      const short = match[2] ? match[2].toLowerCase() : null;
      const full = match[3] ? match[3].toLowerCase() : null;
      const data = short
        ? forms.find((item) => item.short === short)
        : forms.find((item) => item.full === full);
      if (!data) return null;
      return {
        start: absStart,
        end: absEnd,
        next: short
          ? `${match[1]}\u00a0${data.full}`
          : `${match[1]}-${data.short}`,
      };
    }
    return null;
  },
  year(element) {
    const start = element.selectionStart;
    const value = element.value;
    const data = actions.yearToken(value, start);
    if (!data) return false;
    element.value =
      value.slice(0, data.start) + data.next + value.slice(data.end);
    return actions.done(element, data.start + 4);
  },
  abbrData(value, start) {
    const left = value.slice(0, start).match(/[А-Яа-яA-Za-zЁё.]+$/);
    const right = value.slice(start).match(/^[А-Яа-яA-Za-zЁё.]+/);
    const range = {
      start: left ? start - left[0].length : start,
      end: start + (right ? right[0].length : 0),
    };
    if (range.start === range.end) return null;
    const string = value.slice(range.start, range.end).toLowerCase();
    const data = [
      { left: ["тыс."], right: ["тысяч", "тысячи", "тысяча"] },
      { left: ["млн"], right: ["миллиона", "миллионов", "миллион"] },
      { left: ["млрд"], right: ["миллиарда", "миллиардов", "миллиард"] },
      { left: ["трлн"], right: ["триллиона", "триллионов", "триллион"] },
      { left: ["г."], right: ["года"] },
      { left: ["руб."], right: ["рублей", "рубля", "рубль"] },
      { left: ["кг"], right: ["килограммов", "килограмма", "килограмм"] },
      { left: ["км"], right: ["километров", "километра", "километр"] },
    ];
    const stripDot = (string) => string.replace(/\.$/, "");
    const equal = (left, right) =>
      left === right ||
      (left !== "г." && right !== "г." && stripDot(left) === stripDot(right));
    const item = data.find((entry) => {
      const right = Array.isArray(entry.right) ? entry.right : [entry.right];
      return (
        entry.left.some((value) => equal(value, string)) ||
        right.some((value) => equal(value, string))
      );
    });
    if (!item) return null;
    const rightList = Array.isArray(item.right) ? item.right : [item.right];
    const chain = [...item.left, ...rightList];
    const index = chain.findIndex((value) => equal(value, string));
    if (index < 0) return null;
    return { range, chain, index };
  },
  abbr(element) {
    const start = element.selectionStart;
    const value = element.value;
    const data = actions.abbrData(value, start);
    if (!data) return false;
    const next = data.chain[(data.index + 1) % data.chain.length];
    element.value =
      value.slice(0, data.range.start) + next + value.slice(data.range.end);
    return actions.done(element, data.range.start);
  },
  listTag(value, start) {
    const left = value.slice(0, start);
    const item = [...left.matchAll(/<li(?:\s[^>]*)?>/gi)].pop();
    if (!item || left.lastIndexOf("</li>") > item.index) return null;
    const list = [...left.matchAll(/<(ul|ol)(?:\s[^>]*)?>/gi)].pop();
    if (!list) return null;
    const tag = list[1].toLowerCase();
    const close = value.slice(start).search(new RegExp(`</${tag}>`, "i"));
    if (close < 0) return null;
    return { start: list.index, end: start + close + `</${tag}>`.length };
  },
  listSelection(value, start, end) {
    if (start === end) return null;
    const range = actions.trim(value, start, end);
    if (range.start === range.end) return null;
    const source = value.slice(range.start, range.end);
    if (/<(?:ul|ol|li)\b/i.test(source)) return null;
    const rows = source
      .split(/\r?\n/)
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => item.replace(/^([-•●▪◦]|\d+\.)\s+/i, "").trim())
      .filter(Boolean);
    if (!rows.length) return null;
    return {
      start: range.start,
      end: range.end,
      value: `<ul>\n${rows.map((item) => `<li>${item}</li>`).join("\n")}\n</ul>`,
    };
  },
  list(element) {
    const start = element.selectionStart;
    const end = element.selectionEnd;
    const value = element.value;
    const selection = actions.listSelection(value, start, end);
    if (selection) {
      element.value =
        value.slice(0, selection.start) +
        selection.value +
        value.slice(selection.end);
      return actions.done(element, selection.start);
    }
    const html = actions.listTag(value, start);
    if (!html) return false;
    const string = value.slice(html.start, html.end);
    const semicolon =
      /<\/li>\s*<li/i.test(string) && /;\s*<\/li>/i.test(string);
    const mode = semicolon ? "." : ";";
    const next = string.replace(
      /<li(?:\s[^>]*)?>([\s\S]*?)<\/li>/gi,
      (_, item) => {
        const text = item.trim().replace(/[.,;:!?…]\s*$/u, "");
        return `<li>${text}${mode}</li>`;
      },
    );
    const result =
      mode === ";" ? next.replace(/;(<\/li>\s*<\/(?:ul|ol)>)/i, ".$1") : next;
    element.value = value.slice(0, html.start) + result + value.slice(html.end);
    return actions.done(element, start);
  },
  note(element) {
    const start = element.selectionStart;
    const value = element.value;
    const block = actions.block(value, start, start);
    const text = value.slice(block.start, block.end);
    const plain = text.replace(/<\/?em>/gi, "");
    const notes = [];
    const prepared = plain.replace(
      /\(([^()]+?)(?:\s+—|,)\s+прим\.\s+([^()]+)\)/gi,
      (_, body, name) => {
        const clear = body.replace(/\s*[.:,]?\s*$/, "");
        const index = notes.push(`(${clear}. — Прим. ${name.trim()})`) - 1;
        return `\u0001NOTE${index}\u0002`;
      },
    );
    if (!notes.length) return false;
    const next = notes.reduce(
      (string, item, index) =>
        string.replace(`\u0001NOTE${index}\u0002`, `</em>${item}<em>`),
      `<em>${prepared}</em>`,
    );
    element.value = value.slice(0, block.start) + next + value.slice(block.end);
    return actions.done(element, start);
  },
  wordCycleData(value, start, end) {
    const groups = [
      ["после", "впоследствии"],
      ["или", "либо"],
      ["но", "однако"],
      ["закончить", "окончить"],
      ["учитывая", "с учетом того"],
      ["независимо", "вне зависимости"],
      ["с помощью", "при помощи"],
      ["больше", "более"],
      ["меньше", "менее"],
      ["более или менее", "более-менее"],
      ["РБ", "Республики Беларусь", "Беларусь"],
      ["делится", "рассказывает", "говорит", "сообщает"],
      ["делятся", "рассказывают", "говорят", "сообщают"],
      ["поделился", "рассказал", "сообщил"],
      ["поделилась", "рассказала", "сообщила"],
      ["поделились", "рассказали", "сообщили"],
    ];
    const lowerValue = value.toLowerCase();
    const word = (char) => /[0-9A-Za-zА-Яа-яЁё]/.test(char || "");
    const matches = [];
    groups.forEach((chain) => {
      chain.forEach((form) => {
        const token = form.toLowerCase();
        let from = lowerValue.indexOf(token);
        while (from >= 0) {
          const to = from + token.length;
          const inside =
            start === end
              ? start >= from && start <= to
              : end > from && start < to;
          if (inside && !word(lowerValue[from - 1]) && !word(lowerValue[to])) {
            matches.push({ chain, from, to, token });
          }
          from = lowerValue.indexOf(token, from + 1);
        }
      });
    });
    if (!matches.length) return null;
    const hit = matches.sort(
      (left, right) => right.token.length - left.token.length,
    )[0];
    const source = value.slice(hit.from, hit.to);
    const upper = source[0] === source[0].toUpperCase();
    const chain = hit.chain.map((item) =>
      upper ? `${item[0].toUpperCase()}${item.slice(1)}` : item,
    );
    return {
      range: { start: hit.from, end: hit.to },
      chain,
      index: chain.findIndex(
        (item) => item.toLowerCase() === source.toLowerCase(),
      ),
    };
  },
  branch(element) {
    const start = element.selectionStart;
    const end = element.selectionEnd;
    const value = element.value;
    const data = actions.wordCycleData(value, start, end);
    if (!data) return false;
    const index = data.index < 0 ? 0 : (data.index + 1) % data.chain.length;
    const next = data.chain[index];
    element.value =
      value.slice(0, data.range.start) + next + value.slice(data.range.end);
    return actions.done(element, data.range.start + next.length);
  },
  markup: {
    inlineModes: ["plain", "em", "strong", "strong-em"],
    blockModes: ["plain", "h2", "h3"],
    step(list, current, reverse = false) {
      const index = Math.max(0, list.indexOf(current));
      const delta = reverse ? -1 : 1;
      return list[(index + delta + list.length) % list.length];
    },
    frame(value = "") {
      const string = String(value || "");
      const lead = string.match(/^\s*/)?.[0] || "";
      const trail = string.match(/\s*$/)?.[0] || "";
      return {
        lead,
        trail,
        body: string.slice(lead.length, string.length - trail.length),
      };
    },
    unwrap(value = "", tag = "") {
      const pattern = new RegExp(
        `^<${tag}\\b[^>]*>([\\s\\S]*)<\\/${tag}>$`,
        "i",
      );
      const match = String(value || "").match(pattern);
      return match ? match[1] : null;
    },
    inlineState(value = "") {
      const body = actions.markup.frame(value).body;
      if (/^<strong\b[^>]*><em\b[^>]*>[\s\S]*<\/em><\/strong>$/i.test(body))
        return "strong-em";
      if (/^<em\b[^>]*><strong\b[^>]*>[\s\S]*<\/strong><\/em>$/i.test(body))
        return "strong-em";
      if (/^<strong\b[^>]*>[\s\S]*<\/strong>$/i.test(body)) return "strong";
      if (/^<em\b[^>]*>[\s\S]*<\/em>$/i.test(body)) return "em";
      return "plain";
    },
    inlineInner(value = "") {
      const body = actions.markup.frame(value).body;
      const state = actions.markup.inlineState(body);
      if (state === "strong") return actions.markup.unwrap(body, "strong");
      if (state === "em") return actions.markup.unwrap(body, "em");
      if (state === "strong-em") {
        const strong = actions.markup.unwrap(body, "strong");
        if (strong !== null) return actions.markup.unwrap(strong, "em");
        const em = actions.markup.unwrap(body, "em");
        if (em !== null) return actions.markup.unwrap(em, "strong");
        return null;
      }
      return body;
    },
    inlineBuild(value = "", mode = "plain") {
      if (mode === "em") return `<em>${value}</em>`;
      if (mode === "strong") return `<strong>${value}</strong>`;
      if (mode === "strong-em") return `<strong><em>${value}</em></strong>`;
      return value;
    },
    inlineExpand(value, start, end) {
      let from = start;
      let to = end;
      let changed = true;
      while (changed) {
        changed = false;
        const left = value.slice(0, from);
        const right = value.slice(to);
        [
          { open: "<strong>", close: "</strong>" },
          { open: "<em>", close: "</em>" },
        ].forEach((item) => {
          if (!left.endsWith(item.open)) return;
          if (!right.startsWith(item.close)) return;
          from -= item.open.length;
          to += item.close.length;
          changed = true;
        });
      }
      return { start: from, end: to };
    },
    inlineTag(value, start) {
      const em = actions.tag(value, start, "em");
      const strong = actions.tag(value, start, "strong");
      const list = [em, strong].filter(Boolean);
      if (!list.length) return null;
      return {
        start: Math.min(...list.map((item) => item.start)),
        end: Math.max(...list.map((item) => item.end)),
      };
    },
    inlineParagraphRange(value, start) {
      const source = String(value || "");
      const left = [...source.slice(0, start).matchAll(/\n\s*\n/g)].pop();
      const right = source.slice(start).match(/\n\s*\n/);
      const from = left ? left.index + left[0].length : 0;
      const to = right ? start + right.index : source.length;
      const range = actions.trim(source, from, to);
      if (range.start === range.end) return null;
      return range;
    },
    inlineRange(value, start, end) {
      if (start === end) {
        const tag = actions.markup.inlineTag(value, start);
        if (tag) return { ...tag, paragraph: false };
        const paragraph = actions.markup.inlineParagraphRange(value, start);
        return paragraph ? { ...paragraph, paragraph: true } : null;
      }
      const range = actions.trim(value, start, end);
      if (range.start === range.end) return null;
      return {
        ...actions.markup.inlineExpand(value, range.start, range.end),
        paragraph: false,
      };
    },
    inlineQuoteBreak(value = "") {
      return /<\/(?:em|strong)>\s*—[\s\S]*?—\s*<(?:em|strong)\b/i.test(
        String(value || ""),
      );
    },
    inlineQuotePattern() {
      return /<strong\b[^>]*>\s*<em\b[^>]*>[\s\S]*?<\/em>\s*<\/strong>|<em\b[^>]*>\s*<strong\b[^>]*>[\s\S]*?<\/strong>\s*<\/em>|<em\b[^>]*>[\s\S]*?<\/em>|<strong\b[^>]*>[\s\S]*?<\/strong>/gi;
    },
    inlineSegmentData(value = "") {
      const source = String(value || "");
      const inner = actions.markup.inlineInner(source);
      if (inner === null) return null;
      const start = source.indexOf(inner);
      if (start < 0) return null;
      return {
        inner,
        state: actions.markup.inlineState(source),
        start,
        end: start + inner.length,
      };
    },
    inlineQuoteSegments(value = "") {
      const source = String(value || "");
      if (!actions.markup.inlineQuoteBreak(source)) return [];
      return [...source.matchAll(actions.markup.inlineQuotePattern())]
        .map((match) => {
          const data = actions.markup.inlineSegmentData(match[0]);
          if (!data) return null;
          return {
            absStart: match.index,
            absEnd: match.index + match[0].length,
            source: match[0],
            inner: data.inner,
            state: data.state,
            innerStart: data.start,
            innerEnd: data.end,
          };
        })
        .filter(Boolean);
    },
    inlineQuoteState(value = "") {
      const segments = actions.markup.inlineQuoteSegments(value);
      if (!segments.length) return "";
      const states = segments.map((item) => item.state);
      return states.every((state) => state === states[0]) ? states[0] : "plain";
    },
    inlineQuoteText(
      value = "",
      { mode = "plain", start = 0, end = start } = {},
    ) {
      const source = String(value || "");
      const segments = actions.markup.inlineQuoteSegments(source);
      if (!segments.length) return null;
      const map = (offset = 0) => {
        const point = Math.max(0, Math.min(offset, source.length));
        let sourceAt = 0;
        let targetAt = 0;
        for (const segment of segments) {
          if (point <= segment.absStart) {
            return targetAt + point - sourceAt;
          }
          targetAt += segment.absStart - sourceAt;
          const body = actions.markup.inlineBuild(segment.inner, mode);
          const bodyStart = Math.max(0, body.indexOf(segment.inner));
          if (point <= segment.absEnd) {
            const local = Math.max(
              0,
              Math.min(
                point - segment.absStart - segment.innerStart,
                segment.inner.length,
              ),
            );
            return targetAt + bodyStart + local;
          }
          targetAt += body.length;
          sourceAt = segment.absEnd;
        }
        return targetAt + point - sourceAt;
      };
      const parts = [];
      let at = 0;
      for (const segment of segments) {
        parts.push(source.slice(at, segment.absStart));
        parts.push(actions.markup.inlineBuild(segment.inner, mode));
        at = segment.absEnd;
      }
      parts.push(source.slice(at));
      return {
        value: parts.join(""),
        start: map(start),
        end: map(end),
      };
    },
    inlineText(
      value,
      { start = 0, end = start, mode = "cycle", reverse = false } = {},
    ) {
      const range = actions.markup.inlineRange(value, start, end);
      if (!range) return null;
      const source = value.slice(range.start, range.end);
      const frame = actions.markup.frame(source);
      if (!frame.body) return null;
      const quoteState = range.paragraph
        ? actions.markup.inlineQuoteState(frame.body)
        : "";
      const current = quoteState || actions.markup.inlineState(frame.body);
      const target =
        mode === "cycle"
          ? actions.markup.step(actions.markup.inlineModes, current, reverse)
          : actions.markup.inlineModes.includes(mode)
            ? mode
            : current;
      if (quoteState) {
        const quote = actions.markup.inlineQuoteText(frame.body, {
          mode: target,
          start: Math.max(0, start - range.start - frame.lead.length),
          end: Math.max(0, end - range.start - frame.lead.length),
        });
        if (!quote) return null;
        const next = `${frame.lead}${quote.value}${frame.trail}`;
        return {
          value: value.slice(0, range.start) + next + value.slice(range.end),
          start: range.start + frame.lead.length + quote.start,
          end: range.start + frame.lead.length + quote.end,
        };
      }
      const inner = actions.markup.inlineInner(frame.body);
      if (inner === null) return null;
      const body = actions.markup.inlineBuild(inner, target);
      const next = `${frame.lead}${body}${frame.trail}`;
      const open = body.indexOf(inner);
      const from = range.start + frame.lead.length + Math.max(0, open);
      return {
        value: value.slice(0, range.start) + next + value.slice(range.end),
        start: from,
        end: from + inner.length,
      };
    },
    inline(element, options = {}) {
      const result = actions.markup.inlineText(element.value, {
        start: element.selectionStart,
        end: element.selectionEnd,
        ...options,
      });
      if (!result) return false;
      element.value = result.value;
      return actions.done(element, result.start, result.end);
    },
    blockLineState(value = "") {
      const body = actions.markup.frame(value).body;
      if (/^<h2\b[^>]*>[\s\S]*<\/h2>$/i.test(body)) return "h2";
      if (/^<h3\b[^>]*>[\s\S]*<\/h3>$/i.test(body)) return "h3";
      return "plain";
    },
    blockLineInner(value = "") {
      const body = actions.markup.frame(value).body;
      const state = actions.markup.blockLineState(body);
      if (state === "h2") return actions.markup.unwrap(body, "h2");
      if (state === "h3") return actions.markup.unwrap(body, "h3");
      return body;
    },
    blockOpen(mode = "plain") {
      if (mode === "h2") return "<h2>";
      if (mode === "h3") return "<h3>";
      return "";
    },
    blockLineData(value = "") {
      const frame = actions.markup.frame(value);
      const body = frame.body;
      if (!body) return null;
      const state = actions.markup.blockLineState(body);
      const inner = actions.markup.blockLineInner(body);
      if (inner === null) return null;
      const open =
        state === "h2"
          ? body.match(/^<h2\b[^>]*>/i)?.[0] || ""
          : state === "h3"
            ? body.match(/^<h3\b[^>]*>/i)?.[0] || ""
            : "";
      const bodyStart = frame.lead.length + open.length;
      return {
        frame,
        body,
        state,
        inner,
        bodyStart,
        bodyEnd: bodyStart + inner.length,
      };
    },
    blockLine(value = "", mode = "plain") {
      const data = actions.markup.blockLineData(value);
      if (!data) return value;
      const body =
        mode === "h2"
          ? `<h2>${data.inner}</h2>`
          : mode === "h3"
            ? `<h3>${data.inner}</h3>`
            : data.inner;
      return `${data.frame.lead}${body}${data.frame.trail}`;
    },
    blockLineMap(value = "", mode = "plain", offset = 0) {
      const data = actions.markup.blockLineData(value);
      if (!data) return Math.max(0, Math.min(offset, value.length));
      const targetStart =
        data.frame.lead.length + actions.markup.blockOpen(mode).length;
      const local = Math.max(
        0,
        Math.min(offset - data.bodyStart, data.inner.length),
      );
      if (offset <= data.bodyStart) return targetStart;
      if (offset >= data.bodyEnd) return targetStart + data.inner.length;
      return targetStart + local;
    },
    blockState(value = "") {
      const states = String(value || "")
        .split(/\r?\n/)
        .map((line) => actions.markup.frame(line).body)
        .filter(Boolean)
        .map((line) => actions.markup.blockLineState(line));
      if (!states.length) return "plain";
      if (states.every((state) => state === "h2")) return "h2";
      if (states.every((state) => state === "h3")) return "h3";
      return "plain";
    },
    blockRange(value, start, end) {
      const from = value.lastIndexOf("\n", Math.max(0, start - 1)) + 1;
      const point = end > start && value[end - 1] === "\n" ? end - 1 : end;
      const right = value.indexOf("\n", Math.max(start, point));
      return {
        start: from,
        end: right < 0 ? value.length : right,
      };
    },
    blockMap(value = "", mode = "plain", offset = 0) {
      const parts = String(value || "").split(/(\r?\n)/);
      let sourceAt = 0;
      let targetAt = 0;
      for (const part of parts) {
        const lineBreak = /\r?\n/.test(part);
        const next = lineBreak ? part : actions.markup.blockLine(part, mode);
        const sourceEnd = sourceAt + part.length;
        if (offset <= sourceEnd) {
          const local = Math.max(0, Math.min(offset - sourceAt, part.length));
          if (lineBreak) return targetAt + Math.min(local, next.length);
          return targetAt + actions.markup.blockLineMap(part, mode, local);
        }
        sourceAt = sourceEnd;
        targetAt += next.length;
      }
      return targetAt;
    },
    blockText(
      value,
      { start = 0, end = start, mode = "cycle", reverse = false } = {},
    ) {
      const range = actions.markup.blockRange(value, start, end);
      const source = value.slice(range.start, range.end);
      if (!actions.markup.frame(source).body) return null;
      const current = actions.markup.blockState(source);
      const target =
        mode === "cycle"
          ? actions.markup.step(actions.markup.blockModes, current, reverse)
          : actions.markup.blockModes.includes(mode)
            ? mode
            : current;
      const next = source
        .split(/(\r?\n)/)
        .map((line) =>
          /\r?\n/.test(line) ? line : actions.markup.blockLine(line, target),
        )
        .join("");
      const localStart = Math.max(
        0,
        Math.min(start - range.start, source.length),
      );
      const localEnd = Math.max(0, Math.min(end - range.start, source.length));
      return {
        value: value.slice(0, range.start) + next + value.slice(range.end),
        start:
          range.start + actions.markup.blockMap(source, target, localStart),
        end: range.start + actions.markup.blockMap(source, target, localEnd),
      };
    },
    block(element, options = {}) {
      const result = actions.markup.blockText(element.value, {
        start: element.selectionStart,
        end: element.selectionEnd,
        ...options,
      });
      if (!result) return false;
      element.value = result.value;
      return actions.done(element, result.start, result.end);
    },
  },
  has(id) {
    const value = String(id || "");
    return value.startsWith("author.") || value.startsWith("editor.");
  },
  run(id, options = {}) {
    const element = actions.element();
    if (id === "editor.nbsp") return element ? actions.nbsp(element) : false;
    if (id === "editor.comma")
      return element ? actions.punctMark(element, ",") : false;
    if (id === "editor.colon")
      return element ? actions.punctMark(element, ":") : false;
    if (id === "editor.dash")
      return element ? actions.punctMark(element, "—") : false;
    if (id === "editor.punct") return element ? actions.punct(element) : false;
    if (id === "editor.quote") return element ? actions.quote(element) : false;
    if (id === "editor.qswap") return element ? actions.qswap(element) : false;
    if (id === "editor.accent")
      return element ? actions.accent(element) : false;
    if (id === "editor.symbol")
      return element
        ? actions.cyclePick(element, [
            "°",
            "′",
            "″",
            "$",
            "€",
            "Ў",
            "ў",
            "І",
            "і",
            "í",
            "…",
          ])
        : false;
    if (id === "editor.math")
      return element
        ? actions.cyclePick(element, [
            "−",
            "×",
            "·",
            "÷",
            "≈",
            "≠",
            "±",
            "≤",
            "≥",
            "²",
            "³",
          ])
        : false;
    if (id === "editor.home") return element ? actions.home(element) : false;
    if (id === "editor.left")
      return element ? actions.move(element, -1) : false;
    if (id === "editor.right")
      return element ? actions.move(element, 1) : false;
    if (id === "editor.letter")
      return element ? actions.letter(element) : false;
    if (id === "editor.number")
      return element ? actions.number(element) : false;
    if (id === "editor.abbr") return element ? actions.abbr(element) : false;
    if (id === "editor.year") return element ? actions.year(element) : false;
    if (id === "editor.branch")
      return element ? actions.branch(element) : false;
    if (id === "editor.inline")
      return element
        ? actions.markup.inline(element, {
            mode: "cycle",
            reverse: Boolean(options.reverse),
          })
        : false;
    if (id === "editor.block")
      return element
        ? actions.markup.block(element, {
            mode: "cycle",
            reverse: Boolean(options.reverse),
          })
        : false;
    if (id === "editor.em")
      return element ? actions.markup.inline(element, { mode: "em" }) : false;
    if (id === "editor.strong")
      return element
        ? actions.markup.inline(element, { mode: "strong" })
        : false;
    if (id === "editor.killem")
      return element
        ? actions.markup.inline(element, { mode: "plain" })
        : false;
    if (id === "editor.note") return element ? actions.note(element) : false;
    if (id === "editor.list") return element ? actions.list(element) : false;
    if (id === "author.heading") {
      return actions.apply((value) =>
        transform.heading(value.value, {
          start: value.start,
          end: value.end,
        }),
      );
    }
    if (id === "author.emphasis") {
      return actions.apply((value) =>
        transform.emphasis(value.value, {
          start: value.start,
          end: value.end,
        }),
      );
    }
    if (id === "author.quote") {
      return actions.apply((value) =>
        transform.quote(value.value, {
          start: value.start,
          end: value.end,
        }),
      );
    }
    if (id === "author.more") {
      const element = actions.element();
      if (!element) return false;
      return more.run(element);
    }
    if (id === "author.embed") {
      actions.embed();
      return true;
    }
    if (id === "author.photo") return actions.insert("ФОТО ", 5);
    if (id === "author.video") return actions.insert("[video][/video]", 7);
    if (id === "author.cleanup") {
      return actions.apply((value) =>
        transform.cleanup(value.value, {
          start: value.start,
          end: value.end,
        }),
      );
    }
    return false;
  },
};
