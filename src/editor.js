import { frame } from "./core/panel.js";

(() => {
  const id = "editor-panel";
  const css = `
    #editor-panel {
      right: 20px;
      top: 40px;
      padding: var(--panel-pad);
    }
    #editor-panel .button {
      min-width: 28px;
      padding-inline: 6px;
    }
    #editor-panel [data-row] {
      display: flex;
      gap: var(--control-gap);
      margin-bottom: var(--panel-row-gap);
    }
    #editor-panel [data-row]:last-child {
      margin-bottom: 0;
    }
    #editor-panel[data-nbsp="true"] [data-action="nbsp"] {
      background: var(--flash-blue-background);
    }
    #editor-panel[data-em="true"] [data-action="em"],
    #editor-panel[data-strong="true"] [data-action="strong"] {
      background: var(--flash-green-background);
    }
    #editor-panel[data-quote="true"] [data-action="quote"] {
      background: var(--flash-green-background);
    }
  `;
  const html = `
    <div data-row>
      <button class="button button-text" data-action="nbsp">🔦 nbsp</button>
      <button class="button button-text" data-action="em">🩹 em</button>
      <button class="button button-text" data-action="strong">🩹 strong</button>
      <button class="button button-text" data-action="clearEm">💀 em</button>
    </div>
    <div data-row>
      <button class="button button-text" data-action="comma">,</button>
      <button class="button button-text" data-action="dash">—</button>
      <button class="button button-text" data-action="swap">: ↔ —</button>
      <button class="button button-text" data-action="quote">«„“»</button>
      <button class="button button-text" data-action="number">#</button>
    </div>
    <div data-row>
      <button class="button button-text" data-action="left">←</button>
      <button class="button button-text" data-action="right">→</button>
      <button class="button button-text" data-action="home">⇤</button>
    </div>
    <div data-row>
      <button class="button button-text" data-action="note">💭 Прим.</button>
      <button class="button button-text" data-action="abbr">🤏 Сокр.</button>
    </div>
    <div data-row>
      <button class="button button-text" data-action="gramota">🔎 Грамота</button>
      <button class="button button-text" data-action="google">🔎 Гугл</button>
    </div>
  `;
  const exists = document.getElementById(id);
  if (exists) {
    exists.remove();
    return;
  }
  const panel = frame.create({ id, html, place: "right" });
  frame.mount(`${id}-style`, css);
  const editor = {
    get() {
      const element = document.activeElement;
      if (!element) return null;
      if (element.tagName !== "TEXTAREA" && element.tagName !== "INPUT")
        return null;
      return element;
    },
    emit(element) {
      ["input", "change"].forEach((type) =>
        element.dispatchEvent(new Event(type, { bubbles: true })),
      );
    },
    done(element) {
      editor.emit(element);
      element.focus();
      editor.mark(panel, editor.state(element));
    },
    block(value, start, end) {
      const left = value.lastIndexOf("\n", start - 1) + 1;
      const right = value.indexOf("\n", end);
      return {
        start: left,
        end: right < 0 ? value.length : right,
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
      if (start !== end) return editor.trim(value, start, end);
      const block = editor.block(value, start, end);
      return editor.inside(value, block.start, block.end);
    },
    word(value, start) {
      const before = value.slice(0, start).match(/[А-Яа-яA-Za-zЁё0-9]+$/);
      const after = value.slice(start).match(/^[А-Яа-яA-Za-zЁё0-9]+/);
      return {
        start: before ? start - before[0].length : start,
        end: start + (after ? after[0].length : 0),
      };
    },
    item(value, start, end) {
      if (start !== end) return editor.trim(value, start, end);
      return editor.word(value, start);
    },
    clean(value) {
      return value
        .replace(/<\/?[^>]+>/g, "")
        .replace(/[«„“”"']/g, "")
        .trim();
    },
    skip(value, index) {
      let next = index;
      while (true) {
        const string = value.slice(next);
        const tag = string.match(/^<\/?[^>]+>/);
        if (tag) {
          next += tag[0].length;
          continue;
        }
        const quote = string.match(/^[\s«„“”"']+/);
        if (quote) {
          next += quote[0].length;
          continue;
        }
        return next;
      }
    },
    start(value, index) {
      return !editor.clean(value.slice(0, index));
    },
    gap(value) {
      return editor.clean(value) ? " " : "";
    },
    letter(value, upper) {
      return value.replace(
        /^([^А-Яа-яA-Za-zЁё]*)([А-Яа-яA-Za-zЁё])/,
        (_, left, letter) =>
          left + (upper ? letter.toUpperCase() : letter.toLowerCase()),
      );
    },
    sentence(value, index) {
      const left = value.slice(0, index);
      const match = left.match(/[.!?…:](?:\s|<\/?[^>]+>|[»“"'])*$/);
      if (!match) return editor.skip(value, 0);
      return editor.skip(value, left.length - match[0].length + 1);
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
    insideTag(value, start, tag) {
      const left = value.slice(0, start);
      const open = left.lastIndexOf(`<${tag}>`);
      const close = left.lastIndexOf(`</${tag}>`);
      return open > close;
    },
    replace(element, string) {
      const start = element.selectionStart;
      const end = element.selectionEnd;
      const value = element.value;
      element.value = value.slice(0, start) + string + value.slice(end);
      element.selectionStart = start + string.length;
      element.selectionEnd = start + string.length;
      editor.done(element);
    },
    wrap(element, before, after) {
      const start = element.selectionStart;
      const end = element.selectionEnd;
      const value = element.value;
      const range = editor.range(value, start, end);
      const string = value.slice(range.start, range.end);
      element.value =
        value.slice(0, range.start) +
        before +
        string +
        after +
        value.slice(range.end);
      const cursor = Math.min(start + before.length, element.value.length);
      element.selectionStart = cursor;
      element.selectionEnd = cursor;
      editor.done(element);
    },
    unwrap(element, data, start) {
      const value = element.value;
      const body = value.slice(data.bodyStart, data.bodyEnd);
      element.value = value.slice(0, data.start) + body + value.slice(data.end);
      const cursor = Math.max(data.start, start - data.before.length);
      element.selectionStart = cursor;
      element.selectionEnd = cursor;
      editor.done(element);
    },
    taggle(element, name) {
      const start = element.selectionStart;
      const end = element.selectionEnd;
      const value = element.value;
      if (start === end) {
        const data = editor.tag(value, start, name);
        if (data) {
          editor.unwrap(element, data, start);
          return;
        }
      }
      editor.wrap(element, `<${name}>`, `</${name}>`);
    },
    nbsp(element) {
      const start = element.selectionStart;
      const value = element.value;
      if (value[start - 1] === "\u00a0") {
        element.value = value.slice(0, start - 1) + " " + value.slice(start);
        element.selectionStart = start;
        element.selectionEnd = start;
        editor.done(element);
        return;
      }
      if (value[start] === "\u00a0") {
        element.value = value.slice(0, start) + " " + value.slice(start + 1);
        element.selectionStart = start + 1;
        element.selectionEnd = start + 1;
        editor.done(element);
        return;
      }
      const left = value.slice(0, start);
      const right = value.slice(start);
      const before = left.replace(/ $/, "\u00a0");
      const after = before === left ? right.replace(/^ /, "\u00a0") : right;
      element.value = before + after;
      element.selectionStart = before.length;
      element.selectionEnd = before.length;
      editor.done(element);
    },
    comma(element) {
      const start = element.selectionStart;
      const value = element.value;
      const left = value.slice(0, start);
      const right = value.slice(start);
      if (left.endsWith(" ")) {
        const index = start - 1;
        const quote =
          value[index - 1] === "»" ||
          value[index - 1] === "“" ||
          value[index - 1] === '"';
        const comma = quote ? index - 2 : index - 1;
        if (value[comma] === ",") {
          element.value = value.slice(0, comma) + value.slice(comma + 1);
          element.selectionStart = Math.max(start - 1, 0);
          element.selectionEnd = Math.max(start - 1, 0);
          editor.done(element);
          return;
        }
        element.value = value.slice(0, index) + "," + value.slice(index);
        element.selectionStart = start + 1;
        element.selectionEnd = start + 1;
        editor.done(element);
        return;
      }
      const tail = right.match(/^[А-Яа-яA-Za-zЁё0-9]+[»“"]*/);
      const index = start + (tail ? tail[0].length : 0);
      if (value[index] === ",") {
        element.value = value.slice(0, index) + value.slice(index + 1);
        element.selectionStart = start;
        element.selectionEnd = start;
        editor.done(element);
        return;
      }
      element.value = value.slice(0, index) + "," + value.slice(index);
      element.selectionStart = start;
      element.selectionEnd = start;
      editor.done(element);
    },
    dash(element) {
      const start = element.selectionStart;
      const end = element.selectionEnd;
      const value = element.value;
      if (start !== end) {
        editor.replace(element, "\u00a0— ");
        return;
      }
      const left = value.slice(0, start);
      const right = value.slice(start);
      if (left.endsWith(" ")) {
        const before = left.slice(0, -1);
        element.value = before + "\u00a0— " + right;
        element.selectionStart = before.length + 3;
        element.selectionEnd = before.length + 3;
        editor.done(element);
        return;
      }
      if (right.startsWith(" ")) {
        element.value = left + "\u00a0—" + right;
        element.selectionStart = left.length + 2;
        element.selectionEnd = left.length + 2;
        editor.done(element);
        return;
      }
      const tail = right.match(/^[А-Яа-яA-Za-zЁё0-9]+[.,:;!?…]*/);
      if (tail) {
        const index = start + tail[0].length;
        const space =
          value[index] === " " || value[index] === "\u00a0" ? "" : " ";
        element.value =
          value.slice(0, index) + "\u00a0—" + space + value.slice(index);
        element.selectionStart = index + 2 + space.length;
        element.selectionEnd = index + 2 + space.length;
        editor.done(element);
        return;
      }
      editor.replace(element, "\u00a0— ");
    },
    swap(element) {
      const start = element.selectionStart;
      const value = element.value;
      const right = value.slice(start);
      const colon = right.search(/:/);
      const dash = right.search(/[ \u00a0]—/);
      const first = [colon, dash]
        .filter((index) => index >= 0)
        .sort((a, b) => a - b)[0];
      if (first === undefined) return;
      const index = start + first;
      if (value[index] === ":") {
        element.value =
          value.slice(0, index) + "\u00a0—" + value.slice(index + 1);
        element.selectionStart = start;
        element.selectionEnd = start;
        editor.done(element);
        return;
      }
      const left =
        value[index] === " " || value[index] === "\u00a0" ? index : index - 1;
      element.value = value.slice(0, left) + ":" + value.slice(index + 2);
      element.selectionStart = start;
      element.selectionEnd = start;
      editor.done(element);
    },
    quote(element) {
      const start = element.selectionStart;
      const end = element.selectionEnd;
      const value = element.value;
      if (start === end) {
        const data = editor.quoted(value, start);
        if (data) {
          const body = value.slice(data.bodyStart, data.bodyEnd);
          element.value =
            value.slice(0, data.start) + body + value.slice(data.end);
          element.selectionStart = Math.max(data.start, start - 1);
          element.selectionEnd = Math.max(data.start, start - 1);
          editor.done(element);
          return;
        }
      }
      const range = editor.item(value, start, end);
      if (range.start === range.end) return;
      const string = value.slice(range.start, range.end);
      const block = editor.block(value, range.start, range.end);
      const left = value.slice(block.start, range.start);
      const right = value.slice(range.end, block.end);
      const nested = left.includes("«") && right.includes("»");
      const before = nested ? "„" : "«";
      const after = nested ? "“" : "»";
      element.value =
        value.slice(0, range.start) +
        before +
        string +
        after +
        value.slice(range.end);
      element.selectionStart = start;
      element.selectionEnd = start;
      editor.done(element);
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
        if (!Number.isInteger(number)) return null;
        if (number < 0 || number >= 100) return null;
        if (number < 20) return small[number];
        const main = Math.floor(number / 10) * 10;
        const rest = number % 10;
        return rest ? `${tens[main]} ${small[rest]}` : tens[main];
      };
      const join = (left, right) => {
        if (!left.includes(" ") && !right.includes(" "))
          return `${left}-${right}`;
        return `${left}\u00a0— ${right}`;
      };
      const pair = (() => {
        const before = value.slice(0, start).match(/\d+$/);
        const after = value.slice(start).match(/^\d+/);
        const left = before ? start - before[0].length : start;
        const right = start + (after ? after[0].length : 0);
        const around = value.slice(0, left).match(/\d+\s*[-–—]\s*$/);
        const ahead = value.slice(right).match(/^\s*[-–—]\s*\d+/);
        if (around) {
          return {
            start: left - around[0].length,
            end: right,
          };
        }
        if (ahead) {
          return {
            start: left,
            end: right + ahead[0].length,
          };
        }
        return null;
      })();
      if (pair) {
        const string = value.slice(pair.start, pair.end);
        const match = string.match(/^\s*(\d+)\s*[-–—]\s*(\d+)\s*$/);
        if (!match) return;
        const left = build(Number(match[1]));
        const right = build(Number(match[2]));
        if (!left || !right) return;
        const next = join(left, right);
        element.value =
          value.slice(0, pair.start) + next + value.slice(pair.end);
        element.selectionStart = start;
        element.selectionEnd = start;
        editor.done(element);
        return;
      }
      const range = (() => {
        const before = value.slice(0, start).match(/\d+$/);
        const after = value.slice(start).match(/^\d+/);
        const space =
          value[start - 1] === " "
            ? value.slice(0, start - 1).match(/\d+$/)
            : null;
        if (before || after) {
          return {
            start: before ? start - before[0].length : start,
            end: start + (after ? after[0].length : 0),
          };
        }
        if (!space) return null;
        return {
          start: start - 1 - space[0].length,
          end: start - 1,
        };
      })();
      if (!range) return;
      const next = build(Number(value.slice(range.start, range.end)));
      if (!next) return;
      element.value =
        value.slice(0, range.start) + next + value.slice(range.end);
      element.selectionStart = start;
      element.selectionEnd = start;
      editor.done(element);
    },
    clear(element) {
      if (!confirm("Удалить все теги em в поле?")) return;
      element.value = element.value.replace(/<\/?em>/g, "");
      editor.done(element);
    },
    move(element, step) {
      const start = element.selectionStart;
      const end = element.selectionEnd;
      if (start === end) return;
      const value = element.value;
      const block = editor.block(value, start, end);
      const range = { start, end };
      const next =
        step < 0
          ? editor.backward(value, block, range)
          : editor.forward(value, block, range);
      if (!next) return;
      element.value =
        value.slice(0, block.start) + next.value + value.slice(block.end);
      element.selectionStart = block.start + next.start;
      element.selectionEnd = block.start + next.end;
      editor.done(element);
    },
    backward(value, block, range) {
      const text = value.slice(block.start, block.end);
      const start = range.start - block.start;
      const end = range.end - block.start;
      const before = text.slice(0, start).replace(/[ \u00a0]+$/, "");
      const select = text.slice(start, end).trim();
      const after = text.slice(end).replace(/^[ \u00a0]+/, "");
      const match = before.match(/[А-Яа-яA-Za-zЁё0-9]+[.,:;!?…»“"]*$/);
      if (!match) return null;
      const word = match[0];
      const left = before
        .slice(0, before.length - word.length)
        .replace(/[ \u00a0]+$/, "");
      const first = editor.start(text, left.length);
      const next = editor.letter(select, first);
      const prev = editor.letter(word, false);
      const head = `${left}${editor.gap(left)}`;
      const body = `${next} ${prev}`;
      const tail = `${after ? " " : ""}${after}`;
      return {
        value: head + body + tail,
        start: head.length,
        end: head.length + next.length,
      };
    },
    forward(value, block, range) {
      const text = value.slice(block.start, block.end);
      const start = range.start - block.start;
      const end = range.end - block.start;
      const before = text.slice(0, start).replace(/[ \u00a0]+$/, "");
      const select = text.slice(start, end).trim();
      const after = text.slice(end).replace(/^[ \u00a0]+/, "");
      const match = after.match(/^[«„"']*[А-Яа-яA-Za-zЁё0-9]+[.,:;!?…»“"]*/);
      if (!match) return null;
      const word = match[0];
      const point = after.slice(word.length).match(/^[.,:;!?…»“"]+/)?.[0] || "";
      const right = after
        .slice(word.length + point.length)
        .replace(/^[ \u00a0]+/, "");
      const first = editor.start(text, before.length);
      const prev = editor.letter(word, first);
      const next = editor.letter(select, false);
      const head = `${before}${editor.gap(before)}${prev}`;
      const tail = right ? ` ${right}` : point;
      return {
        value: `${head} ${next}${tail}`,
        start: head.length + 1,
        end: head.length + 1 + next.length,
      };
    },
    home(element) {
      const start = element.selectionStart;
      const end = element.selectionEnd;
      const value = element.value;
      const block = editor.block(value, start, end);
      const range = editor.item(value, start, end);
      if (range.start === range.end) return;
      const text = value.slice(block.start, block.end);
      const local = {
        start: range.start - block.start,
        end: range.end - block.start,
      };
      const point = editor.sentence(text, local.start);
      const left = text.slice(0, point);
      const before = text.slice(point, local.start).replace(/[ \u00a0]+$/, "");
      if (!editor.clean(before)) return;
      const select = editor.letter(
        text.slice(local.start, local.end).trim(),
        true,
      );
      const middle = editor.start(text, point)
        ? editor.letter(before, false)
        : before;
      const after = text.slice(local.end).replace(/^[ \u00a0]+/, "");
      const tail = after
        ? /^[.,:;!?…»“"]/.test(after)
          ? after
          : ` ${after}`
        : "";
      const next = `${left}${select} ${middle}${tail}`;
      element.value =
        value.slice(0, block.start) + next + value.slice(block.end);
      element.selectionStart = block.start + left.length;
      element.selectionEnd = block.start + left.length + select.length;
      editor.done(element);
    },
    note(element) {
      const start = element.selectionStart;
      const value = element.value;
      const block = editor.block(value, start, start);
      const text = value.slice(block.start, block.end);
      if (/<\/em>\([^()]+?\. — Прим\. [^()]+\)<em>/i.test(text)) return;
      const match = text.match(/\(([^()]+?)(?:\s+—|,)\s+прим\.\s+([^()]+)\)/i);
      if (!match) return;
      const body = match[1].replace(/\s*[.:,]?\s*$/, "");
      const name = match[2].trim();
      const next = `</em>(${body}. — Прим. ${name})<em>`;
      const result = text.replace(match[0], next);
      element.value =
        value.slice(0, block.start) + result + value.slice(block.end);
      element.selectionStart = start;
      element.selectionEnd = start;
      editor.done(element);
    },
    abbr(element) {
      alert("abbr");
      const start = element.selectionStart;
      const value = element.value;
      const left = value.slice(0, start).match(/[А-Яа-яA-Za-zЁё]+$/);
      const right = value.slice(start).match(/^[А-Яа-яA-Za-zЁё]+/);
      const range = {
        start: left ? start - left[0].length : start,
        end: start + (right ? right[0].length : 0),
      };
      if (range.start === range.end) return;
      const string = value.slice(range.start, range.end).toLowerCase();
      const data = {
        тысяча: "тыс.",
        тысячи: "тыс.",
        тысяч: "тыс.",
        миллион: "млн",
        миллиона: "млн",
        миллионов: "млн",
        миллиард: "млрд",
        миллиарда: "млрд",
        миллиардов: "млрд",
        триллион: "трлн",
        триллиона: "трлн",
        триллионов: "трлн",
      };
      const next = data[string];
      if (!next) return;
      const dot = next.endsWith(".") && value[range.end] === "." ? 1 : 0;
      element.value =
        value.slice(0, range.start) + next + value.slice(range.end + dot);
      const cursor = Math.min(start, element.value.length);
      element.selectionStart = cursor;
      element.selectionEnd = cursor;
      editor.done(element);
    },
    search(element, source) {
      const start = element.selectionStart;
      const end = element.selectionEnd;
      const value = element.value;
      const range = start === end ? editor.word(value, start) : { start, end };
      if (range.start === range.end) return;
      const string = value.slice(range.start, range.end).trim();
      if (!string) return;
      const query = encodeURIComponent(string);
      const data = {
        google: `https://www.google.com/search?q=${query}`,
        gramota: `https://gramota.ru/poisk?query=${query}&mode=spravka`,
      };
      window.open(data[source], "_blank", "noopener,noreferrer");
      element.selectionStart = start;
      element.selectionEnd = end;
      element.focus();
    },
    state(element) {
      const start = element.selectionStart;
      const value = element.value;
      return {
        em: editor.insideTag(value, start, "em"),
        strong: editor.insideTag(value, start, "strong"),
        nbsp: value[start - 1] === "\u00a0" || value[start] === "\u00a0",
        quote: Boolean(editor.quoted(value, start)),
      };
    },
    mark(panel, state) {
      panel.dataset.nbsp = state.nbsp ? "true" : "false";
      panel.dataset.em = state.em ? "true" : "false";
      panel.dataset.strong = state.strong ? "true" : "false";
      panel.dataset.quote = state.quote ? "true" : "false";
    },
  };
  const action = {
    nbsp: editor.nbsp,
    em: (element) => editor.taggle(element, "em"),
    strong: (element) => editor.taggle(element, "strong"),
    clearEm: editor.clear,
    comma: editor.comma,
    dash: editor.dash,
    swap: editor.swap,
    quote: editor.quote,
    number: editor.number,
    left: (element) => editor.move(element, -1),
    right: (element) => editor.move(element, 1),
    home: editor.home,
    note: editor.note,
    abbr: editor.abbr,
    gramota: (element) => editor.search(element, "gramota"),
    google: (element) => editor.search(element, "google"),
  };
  panel.addEventListener("mousedown", (event) => event.preventDefault());
  panel.addEventListener("click", (event) => {
    const button = event.target.closest("[data-action]");
    if (!button) return;
    const element = editor.get();
    if (!element) return;
    action[button.dataset.action](element);
  });
  document.addEventListener("selectionchange", () => {
    const element = editor.get();
    if (!element) return;
    editor.mark(panel, editor.state(element));
  });
})();
