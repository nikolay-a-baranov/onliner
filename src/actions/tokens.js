export const createTokens = (api) => {
  const char = {
    letter(value) {
      return /[А-Яа-яA-Za-zЁё]/.test(value || "");
    },
    word(value) {
      return /[0-9A-Za-zА-Яа-яЁё\u002D\u2010\u2011]/.test(value || "");
    },
  };
  const range = {
    wordBody() {
      return String.raw`[0-9A-Za-zА-Яа-яЁё]+(?:[\u002D\u2010\u2011][0-9A-Za-zА-Яа-яЁё]+)*`;
    },
    inside(start, from, to) {
      return start >= from && start <= to;
    },
    hyphenated(value, start) {
      const pattern = new RegExp(range.wordBody(), "g");
      for (const match of String(value || "").matchAll(pattern)) {
        const from = match.index;
        const to = from + match[0].length;
        const hasDash = ["-", "‐", "‑"].some((dash) => match[0].includes(dash));
        if (!hasDash) continue;
        if (range.inside(start, from, to)) return { start: from, end: to };
      }
      return null;
    },
    quantified(value, start) {
      const source = String(value || "");
      const word = range.wordBody();
      const pattern = new RegExp(
        String.raw`\d+(?:\u00A0(?![-–—])${word})+`,
        "g",
      );
      for (const match of source.matchAll(pattern)) {
        const from = match.index;
        const to = from + match[0].length;
        if (range.inside(start, from, to)) return { start: from, end: to };
      }
      return null;
    },
    word(value, start, end) {
      if (start !== end) return api.trim(value, start, end);
      return (
        range.quantified(value, start) ||
        range.hyphenated(value, start) ||
        api.word(value, start)
      );
    },
    stress(value, start, end) {
      if (start !== end) return api.trim(value, start, end);
      const before = value.slice(0, start).match(/[А-Яа-яA-Za-zЁё0-9\u0301]+$/);
      const after = value.slice(start).match(/^[А-Яа-яA-Za-zЁё0-9\u0301]+/);
      return {
        start: before ? start - before[0].length : start,
        end: start + (after ? after[0].length : 0),
      };
    },
    digits(value, start) {
      const before = value.slice(0, start).match(/\d+$/);
      const after = value.slice(start).match(/^\d+/);
      if (!before && !after) return null;
      return {
        start: before ? start - before[0].length : start,
        end: start + (after ? after[0].length : 0),
      };
    },
    letters(value, start) {
      const left = value.slice(0, start).match(/[А-Яа-яA-Za-zЁё.]+$/);
      const right = value.slice(start).match(/^[А-Яа-яA-Za-zЁё.]+/);
      return {
        start: left ? start - left[0].length : start,
        end: start + (right ? right[0].length : 0),
      };
    },
  };
  const edit = {
    text(value, range, next) {
      return value.slice(0, range.start) + next + value.slice(range.end);
    },
    replace(element, data) {
      const value = element.value;
      api.set(element, edit.text(value, data.range, data.next));
      return api.doneData(element, data);
    },
    tail(element, data, tail) {
      const value = element.value;
      api.set(
        element,
        value.slice(0, data.range.start) +
          data.next +
          tail(value.slice(data.range.end)),
      );
      return api.doneData(element, data);
    },
  };
  const chain = {
    next(data) {
      if (data.next) return data.next;
      const index = data.index < 0 ? 0 : (data.index + 1) % data.chain.length;
      return data.chain[index];
    },
  };
  const casing = {
    first(value, mode) {
      return String(value || "").replace(
        /^((?:(?:[«„“"'()[\]{}]\s*)|(?:<[^>]+>\s*))*)([А-Яа-яA-Za-zЁё])/,
        (_, before = "", letter) => {
          const next =
            mode === "upper" ? letter.toUpperCase() : letter.toLowerCase();
          return `${before}${next}`;
        },
      );
    },
    all(value, mode) {
      return mode === "upper"
        ? String(value || "").toUpperCase()
        : String(value || "").toLowerCase();
    },
    sentence(value, range) {
      const before = String(value || "")
        .slice(0, range.start)
        .replace(/<[^>]+>/g, "")
        .replace(/&nbsp;|&#160;|\u00a0/gi, " ");
      return /(?:^|[.!?…]\s*)[«„“"'()[\]{}]*\s*$/u.test(before);
    },
    apply(value, range, next) {
      if (!casing.sentence(value, range)) return next;
      return casing.first(next, "upper");
    },
  };
  const accent = {
    mark: "\u0301",
    base(value, start, end) {
      if (start !== end && end - start === 1 && char.letter(value[start])) {
        return start;
      }
      if (
        start > 1 &&
        value[start - 1] === accent.mark &&
        char.letter(value[start - 2])
      ) {
        return start - 2;
      }
      if (char.letter(value[start - 1])) return start - 1;
      if (value[start] === accent.mark && char.letter(value[start - 1])) {
        return start - 1;
      }
      return -1;
    },
    data(value, start, end) {
      const base = accent.base(value, start, end);
      if (base < 0) return null;
      const markAt = base + 1;
      const count = value.slice(markAt).match(/^\u0301+/)?.[0].length || 0;
      if (count > 0) {
        return {
          range: { start: markAt, end: markAt + count },
          next: "",
          caret: Math.max(markAt, start - count),
        };
      }
      return {
        range: { start: markAt, end: markAt },
        next: accent.mark,
        caret: start <= markAt ? start : start + 1,
      };
    },
    run(element) {
      const data = accent.data(
        element.value,
        element.selectionStart,
        element.selectionEnd,
      );
      if (!data) return false;
      return edit.replace(element, data);
    },
  };
  const choice = {
    quote(list) {
      if (!Array.isArray(list) || list.length !== 2) return false;
      return list[0] === "«" && list[1] === "»";
    },
    mode(value, list) {
      if (value === "inner" || choice.quote(list)) {
        return { wrap: "inner", unwrap: "select" };
      }
      if (!value || typeof value !== "object") return null;
      const wrap = value.wrap || value.caret || value.after || "inner";
      const unwrap = value.unwrap || value.select || "select";
      return { wrap, unwrap };
    },
    pair(list, mode) {
      if (!choice.mode(mode, list)) return null;
      if (!Array.isArray(list) || list.length !== 2) return null;
      if (!list[0] || !list[1] || list[0] === list[1]) return null;
      return { open: String(list[0]), close: String(list[1]) };
    },
    line(value, start, end) {
      const before = value.lastIndexOf("\n", Math.max(0, start - 1));
      const after = value.indexOf("\n", end);
      return {
        start: before < 0 ? 0 : before + 1,
        end: after < 0 ? value.length : after,
      };
    },
    spans(value, line, pair) {
      const stack = [];
      const spans = [];
      for (let index = line.start; index < line.end; index += 1) {
        if (value.startsWith(pair.open, index)) {
          stack.push(index);
          index += pair.open.length - 1;
          continue;
        }
        if (!value.startsWith(pair.close, index)) continue;
        const open = stack.pop();
        if (typeof open !== "number") continue;
        spans.push({
          start: open,
          end: index + pair.close.length,
          innerStart: open + pair.open.length,
          innerEnd: index,
        });
        index += pair.close.length - 1;
      }
      return spans.sort((left, right) => {
        return left.end - left.start - (right.end - right.start);
      });
    },
    contains(span, start, end) {
      if (start === end) return start > span.start && start < span.end;
      return start >= span.start && end <= span.end;
    },
    unwrap(value, start, end, pair, mode) {
      if (start !== end) return null;
      const line = choice.line(value, start, end);
      const span = choice
        .spans(value, line, pair)
        .find((item) => choice.contains(item, start, end));
      if (!span) return null;
      const next = value.slice(span.innerStart, span.innerEnd);
      const select =
        choice.mode(mode, [pair.open, pair.close]).unwrap === "select";
      return {
        range: { start: span.start, end: span.end },
        next,
        start: select ? span.start : span.start + next.length,
        end: select ? span.start + next.length : span.start + next.length,
      };
    },
    wrapRange(value, start, end) {
      if (start !== end) return api.trim(value, start, end);
      const current = range.word(value, start, end);
      if (current && current.start !== current.end) return current;
      return { start, end };
    },
    wrap(value, start, end, pair, mode) {
      const current = choice.wrapRange(value, start, end);
      const body = value.slice(current.start, current.end);
      const next = `${pair.open}${body}${pair.close}`;
      const inside = current.start + pair.open.length;
      const place =
        choice.mode(mode, [pair.open, pair.close]).wrap === "inner"
          ? inside
          : inside + body.length;
      return {
        range: current,
        next,
        caret: place,
      };
    },
    paired(value, start, end, list, mode) {
      const pair = choice.pair(list, mode);
      if (!pair) return null;
      return (
        choice.unwrap(value, start, end, pair, mode) ||
        choice.wrap(value, start, end, pair, mode)
      );
    },
    data(value, start, end, list, mode) {
      const paired = choice.paired(String(value || ""), start, end, list, mode);
      if (paired) return paired;
      if (start !== end) {
        return {
          range: { start, end },
          next: list[0],
          caret: start + list[0].length,
        };
      }
      const left = value[start - 1];
      const right = value[start];
      const index = list.findIndex((item) => item === left || item === right);
      if (index < 0) {
        return {
          range: { start, end: start },
          next: list[0],
          caret: start + list[0].length,
        };
      }
      const shift = list[index] === left ? -1 : 0;
      const place = start + shift;
      return {
        range: { start: place, end: place + list[index].length },
        next: list[(index + 1) % list.length],
        caret: start,
      };
    },
    run(element, list, mode) {
      const data = choice.data(
        element.value,
        element.selectionStart,
        element.selectionEnd,
        list,
        mode,
      );
      if (!data) return false;
      return edit.replace(element, data);
    },
  };
  const capital = {
    state: new WeakMap(),
    key(range, lower) {
      return `${range.start}:${range.end}:${lower}`;
    },
    sequence(source, lower) {
      const title = casing.first(lower, "upper");
      const upper = casing.all(lower, "upper");
      if (source === upper) return [lower, title, upper];
      if (source === title) return [lower, upper, title];
      return [title, upper, lower];
    },
    data(value, start, end, cycle = null) {
      const current = range.word(value, start, end);
      if (current.start === current.end) return null;
      const source = value.slice(current.start, current.end);
      const lower = casing.all(source, "lower");
      const key = capital.key(current, lower);
      const active =
        cycle &&
        cycle.key === key &&
        cycle.value === source &&
        Array.isArray(cycle.items);
      const items = active ? cycle.items : capital.sequence(source, lower);
      const index = active ? cycle.index : 0;
      const next = items[index] || items[0] || source;
      return {
        range: current,
        next,
        start: start === end ? Math.min(start, value.length) : current.start,
        end:
          start === end
            ? Math.min(start, value.length)
            : current.start + next.length,
        cycle: {
          key,
          value: next,
          items,
          index: (index + 1) % items.length,
        },
      };
    },
    run(element) {
      const data = capital.data(
        element.value,
        element.selectionStart,
        element.selectionEnd,
        capital.state.get(element) || null,
      );
      if (!data) return false;
      const result = edit.replace(element, data);
      capital.state.set(element, data.cycle);
      return result;
    },
  };  const multiply = {
    data(value, start, end) {
      const source = String(value || "");
      const pattern = /\d[ \t\u00a0]*[xх][ \t\u00a0]*\d/giu;
      for (const match of source.matchAll(pattern)) {
        const index = match.index + match[0].search(/[xх]/iu);
        const range = { start: index, end: index + 1 };
        const inside =
          start === end
            ? start >= range.start && start <= range.end
            : start < range.end && end > range.start;
        if (!inside) continue;
        return {
          range,
          next: "×",
          caret: range.start + 1,
        };
      }
      return null;
    },
    run(element) {
      const data = multiply.data(
        element.value,
        element.selectionStart,
        element.selectionEnd,
      );
      if (!data) return false;
      return edit.replace(element, data);
    },
  };
  const number = {
    small: [
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
    ],
    tens: {
      20: "двадцать",
      30: "тридцать",
      40: "сорок",
      50: "пятьдесят",
      60: "шестьдесят",
      70: "семьдесят",
      80: "восемьдесят",
      90: "девяносто",
    },
    words: {
      0: ["ноль", "нуля", "нулю", "нулем", "нулём", "нуле"],
      1: [
        "один",
        "одна",
        "одно",
        "одного",
        "одному",
        "одним",
        "одном",
        "одной",
        "одну",
      ],
      2: ["два", "две", "двух", "двум", "двумя"],
      3: ["три", "трех", "трёх", "трем", "трём", "тремя"],
      4: ["четыре", "четырех", "четырёх", "четырем", "четырём", "четырьмя"],
      5: ["пять", "пяти", "пятью"],
      6: ["шесть", "шести", "шестью"],
      7: ["семь", "семи", "семью"],
      8: ["восемь", "восьми", "восемью"],
      9: ["девять", "девяти", "девятью"],
      10: ["десять", "десяти", "десятью"],
      11: ["одиннадцать", "одиннадцати", "одиннадцатью"],
      12: ["двенадцать", "двенадцати", "двенадцатью"],
      13: ["тринадцать", "тринадцати", "тринадцатью"],
      14: ["четырнадцать", "четырнадцати", "четырнадцатью"],
      15: ["пятнадцать", "пятнадцати", "пятнадцатью"],
      16: ["шестнадцать", "шестнадцати", "шестнадцатью"],
      17: ["семнадцать", "семнадцати", "семнадцатью"],
      18: ["восемнадцать", "восемнадцати", "восемнадцатью"],
      19: ["девятнадцать", "девятнадцати", "девятнадцатью"],
      20: ["двадцать", "двадцати", "двадцатью"],
      30: ["тридцать", "тридцати", "тридцатью"],
      40: ["сорок", "сорока"],
      50: ["пятьдесят", "пятидесяти", "пятьюдесятью"],
      60: ["шестьдесят", "шестидесяти", "шестьюдесятью"],
      70: ["семьдесят", "семидесяти", "семьюдесятью"],
      80: ["восемьдесят", "восьмидесяти", "восемьюдесятью"],
      90: ["девяносто", "девяноста"],
    },
    normalize(value) {
      return String(value || "")
        .toLowerCase()
        .replace(/ё/g, "е");
    },
    map() {
      const items = new Map();
      Object.entries(number.words).forEach(([key, list]) => {
        list.forEach((word) => items.set(number.normalize(word), Number(key)));
      });
      return items;
    },
    build(value) {
      if (!Number.isInteger(value) || value < 0 || value >= 100) return null;
      if (value < 20) return number.small[value];
      const main = Math.floor(value / 10) * 10;
      const rest = value % 10;
      return rest
        ? `${number.tens[main]} ${number.small[rest]}`
        : number.tens[main];
    },
    half(value) {
      if (!Number.isInteger(value) || value <= 0 || value >= 100) return null;
      if (value === 1) return "полтора";
      const text = number.build(value);
      return text ? `${text} с половиной` : null;
    },
    compoundBase(value) {
      const forms = {
        1: "одно",
        2: "двух",
        3: "трех",
        4: "четырех",
        5: "пяти",
        6: "шести",
        7: "семи",
        8: "восьми",
        9: "девяти",
        10: "десяти",
        11: "одиннадцати",
        12: "двенадцати",
        13: "тринадцати",
        14: "четырнадцати",
        15: "пятнадцати",
        16: "шестнадцати",
        17: "семнадцати",
        18: "восемнадцати",
        19: "девятнадцати",
        20: "двадцати",
        30: "тридцати",
        40: "сорока",
        50: "пятидесяти",
        60: "шестидесяти",
        70: "семидесяти",
        80: "восьмидесяти",
        90: "девяносто",
      };
      if (!Number.isInteger(value) || value <= 0 || value >= 100) return null;
      if (forms[value]) return forms[value];
      const main = Math.floor(value / 10) * 10;
      const rest = value % 10;
      if (!forms[main] || !forms[rest]) return null;
      return `${forms[main]}${forms[rest]}`;
    },
    compoundPrefixes() {
      return Array.from({ length: 99 }, (_, index) => index + 1)
        .map((value) => ({ value, prefix: number.compoundBase(value) }))
        .filter((item) => item.prefix)
        .sort((left, right) => right.prefix.length - left.prefix.length);
    },
    compoundTail(value) {
      const tail = String(value || "");
      if (!/^[А-Яа-яЁё]+$/u.test(tail)) return false;
      return /(?:ый|ий|ой|ая|яя|ое|ее|ые|ие|ого|его|ому|ему|ым|им|ом|ем|ых|их|ыми|ими|ую|юю)$/iu.test(tail);
    },
    join(left, right) {
      if (!left.includes(" ") && !right.includes(" "))
        return `${left}-${right}`;
      return `${left}\u00a0— ${right}`;
    },
    tail(value, mode) {
      if (mode === "number") return value.replace(/^[ \t\u00A0]+/u, "\u00A0");
      if (mode === "word") return value.replace(/^[ \t\u00A0]+/u, " ");
      return value;
    },
    pair(value, start) {
      const before = value.slice(0, start).match(/\d+$/);
      const after = value.slice(start).match(/^\d+/);
      const left = before ? start - before[0].length : start;
      const right = start + (after ? after[0].length : 0);
      const around = value.slice(0, left).match(/\d+[ \t]*[-–—][ \t]*$/);
      const ahead = value.slice(right).match(/^[ \t]*[-–—][ \t]*\d+/);
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
    },
    pairs(value, range) {
      const string = value.slice(range.start, range.end);
      const match = string.match(/^[ \t]*(\d+)[ \t]*[-–—][ \t]*(\d+)[ \t]*$/);
      if (!match) return null;
      const left = number.build(Number(match[1]));
      const right = number.build(Number(match[2]));
      if (!left || !right) return null;
      return {
        range,
        next: number.join(left, right),
      };
    },
    wordList(value) {
      return [...String(value || "").matchAll(/[А-Яа-яЁё]+/gu)].map(
        (match) => ({
          start: match.index,
          end: match.index + match[0].length,
          text: match[0],
        }),
      );
    },
    wordRange(value, words, left, right) {
      const items = words.slice(left, right + 1);
      if (!items.length) return null;
      for (let index = 1; index < items.length; index += 1) {
        const previous = items[index - 1];
        const current = items[index];
        const middle = value.slice(previous.end, current.start);
        if (!/^(?:\s|\u00a0)+$/u.test(middle)) return null;
      }
      return {
        start: items[0].start,
        end: items[items.length - 1].end,
        text: items.map((item) => item.text).join(" "),
      };
    },
    wordCandidates(value, start) {
      const words = number.wordList(value);
      const index = words.findIndex((word, place) => {
        const next = words[place + 1] || null;
        return (
          (word.start <= start && start <= word.end) ||
          (next && word.end <= start && start <= next.start)
        );
      });
      if (index < 0) return [];
      const ranges = [];
      for (let left = Math.max(0, index - 3); left <= index; left += 1) {
        for (
          let right = index;
          right < words.length && right < left + 4;
          right += 1
        ) {
          ranges.push(number.wordRange(value, words, left, right));
        }
      }
      return ranges.filter(Boolean);
    },
    wordValue(text) {
      const parts = String(text || "")
        .split(/\s+/u)
        .map(number.normalize)
        .filter(Boolean);
      if (parts.length === 1 && parts[0] === "полтора") return 1.5;
      const data = number.map();
      if (parts.length === 1) return data.get(parts[0]) ?? null;
      if (parts.length === 3 && parts[1] === "с" && parts[2] === "половиной") {
        const left = data.get(parts[0]) ?? null;
        return left ? left + 0.5 : null;
      }
      if (
        parts.length === 4 &&
        parts[2] === "с" &&
        parts[3] === "половиной"
      ) {
        const left = data.get(parts[0]) ?? null;
        const right = data.get(parts[1]) ?? null;
        if (left === null || right === null) return null;
        if (left < 20 || left % 10 !== 0 || right <= 0 || right >= 10)
          return null;
        return left + right + 0.5;
      }
      if (parts.length !== 2) return null;
      const left = data.get(parts[0]) ?? null;
      const right = data.get(parts[1]) ?? null;
      if (left === null || right === null) return null;
      if (left < 20 || left % 10 !== 0 || right <= 0 || right >= 10)
        return null;
      return left + right;
    },
    wordData(value, start) {
      const data = number
        .wordCandidates(value, start)
        .map((range) => ({ range, value: number.wordValue(range.text) }))
        .filter((item) => item.value !== null)
        .sort(
          (left, right) =>
            right.range.end -
            right.range.start -
            (left.range.end - left.range.start),
        )[0];
      if (!data) return null;
      const next = Number.isInteger(data.value)
        ? String(data.value)
        : String(data.value).replace(".", ",");
      return {
        range: { start: data.range.start, end: data.range.end },
        next,
        caret: data.range.start + next.length,
        space: "number",
      };
    },
    group(value) {
      const string = String(value);
      if (/^\d{4}$/u.test(string)) return string;
      return string.replace(/\B(?=(\d{3})+(?!\d))/g, "\u00a0");
    },
    rank: [
      {
        zero: 12,
        mark: "трлн",
        words: ["триллион", "триллиона", "триллионов"],
      },
      {
        zero: 9,
        mark: "млрд",
        words: ["миллиард", "миллиарда", "миллиардов"],
      },
      {
        zero: 6,
        mark: "млн",
        words: ["миллион", "миллиона", "миллионов"],
      },
      {
        zero: 3,
        mark: "тыс.",
        words: ["тысяча", "тысячи", "тысяч"],
      },
    ],
    rankWordIndex(value) {
      if (!Number.isFinite(value)) return 2;
      if (!Number.isInteger(value)) return 1;
      const mod100 = value % 100;
      if (mod100 >= 11 && mod100 <= 14) return 2;
      const mod10 = value % 10;
      if (mod10 === 1) return 0;
      if (mod10 >= 2 && mod10 <= 4) return 1;
      return 2;
    },
    rankWord(value, rank) {
      const source = String(value || "").replace(",", ".");
      if (!/^\d+(?:\.\d)?$/u.test(source)) return null;
      const amount = Number(source);
      if (!Number.isFinite(amount) || !Array.isArray(rank?.words)) return null;
      const word = rank.words[number.rankWordIndex(amount)] || rank.words[2];
      return word ? `${value}\u00A0${word}` : null;
    },
    rankAmount(value) {
      const source = String(value || "").replace(/[ \t\u00A0]/g, "");
      if (!/^\d+$/u.test(source)) return null;
      const amount = Number(source);
      if (!Number.isSafeInteger(amount)) return null;
      return amount;
    },
    rankShort(amount, rank) {
      const scale = 10 ** rank.zero;
      const step = 10 ** Math.max(rank.zero - 1, 0);
      if (!Number.isSafeInteger(amount) || amount < scale) return null;
      if (amount % step !== 0) return null;
      const value = amount / scale;
      if (value >= 1000) return null;
      return Number.isInteger(value)
        ? String(value)
        : String(value).replace(".", ",");
    },
    rankLong(value, rank) {
      const source = String(value || "").replace(",", ".");
      if (!/^\d+(?:\.\d)?$/u.test(source)) return null;
      const amount = Number(source) * 10 ** rank.zero;
      if (!Number.isSafeInteger(amount)) return null;
      return number.group(amount);
    },
    rankLongDot(value, end) {
      if (value[end] !== ".") return false;
      return /^[ \t\u00A0]+[А-ЯЁA-Z]/u.test(value.slice(end + 1));
    },
    rankShortDot(value, rank, end) {
      const at = rank.mark.endsWith(".") ? end - 1 : end;
      if (value[at] !== ".") return false;
      return /^[ \t\u00A0]+[А-ЯЁA-Z]/u.test(value.slice(at + 1));
    },
    rankMarkPattern(rank) {
      return rank.mark.endsWith(".")
        ? rank.mark.replace(".", "\\.")
        : rank.mark;
    },
    rankWordPattern(rank) {
      return Array.isArray(rank?.words)
        ? [...rank.words].sort((left, right) => right.length - left.length).join("|")
        : "";
    },
    rankLongData(value, start) {
      const source = String(value || "");
      const pattern = /(?:\d{1,3}(?:[ \t\u00A0]\d{3})+|\d{4,15})/g;
      for (const match of source.matchAll(pattern)) {
        const from = match.index;
        const end = from + match[0].length;
        if (start < from || start > end) continue;
        if (char.word(source[from - 1]) || char.word(source[end])) continue;
        const amount = number.rankAmount(match[0]);
        if (amount === null) continue;
        const data = number.rank
          .map((rank) => ({ rank, short: number.rankShort(amount, rank) }))
          .find((item) => item.short);
        if (!data) continue;
        const dot = number.rankLongDot(source, end);
        return {
          range: { start: from, end: dot ? end + 1 : end },
          next: `${data.short}\u00a0${data.rank.mark}${dot && !data.rank.mark.endsWith(".") ? "." : ""}`,
          caret: from + data.short.length,
          space: dot ? null : "number",
        };
      }
      return null;
    },
    rankShortData(value, start) {
      const source = String(value || "");
      const marks = number.rank.map(number.rankMarkPattern).join("|");
      const pattern = new RegExp(`\\d+(?:,\\d)?[ \\t\\u00A0]+(?:${marks})`, "giu");
      for (const match of source.matchAll(pattern)) {
        const from = match.index;
        const end = from + match[0].length;
        if (start < from || start > end) continue;
        if (char.word(source[from - 1]) || char.word(source[end])) continue;
        const amount = match[0].match(/^\d+(?:,\d)?/u)?.[0] || "";
        const rank = number.rank.find((item) => {
          const rest = match[0].slice(amount.length).trimStart().toLowerCase();
          return rest === item.mark;
        });
        if (!rank) continue;
        const next = number.rankWord(amount, rank);
        if (!next) continue;
        const dot = number.rankShortDot(source, rank, end);
        return {
          range: { start: from, end: dot && !rank.mark.endsWith(".") ? end + 1 : end },
          next: dot ? `${next}.` : next,
          caret: from + next.length,
          space: dot ? null : "number",
        };
      }
      return null;
    },
    rankFullData(value, start) {
      const source = String(value || "");
      const words = number.rank
        .map(number.rankWordPattern)
        .filter(Boolean)
        .join("|");
      const pattern = new RegExp(`\\d+(?:,\\d)?[ \\t\\u00A0]+(?:${words})`, "giu");
      for (const match of source.matchAll(pattern)) {
        const from = match.index;
        const end = from + match[0].length;
        if (start < from || start > end) continue;
        if (char.word(source[from - 1]) || char.word(source[end])) continue;
        const amount = match[0].match(/^\d+(?:,\d)?/u)?.[0] || "";
        const rank = number.rank.find((item) => {
          const rest = match[0].slice(amount.length).trimStart().toLowerCase();
          return Array.isArray(item.words) && item.words.includes(rest);
        });
        if (!rank) continue;
        const next = number.rankLong(amount, rank);
        if (!next) continue;
        return {
          range: { start: from, end },
          next,
          caret: from + next.length,
          space: "number",
        };
      }
      return null;
    },
    rankData(value, start) {
      return (
        number.rankShortData(value, start) ||
        number.rankFullData(value, start) ||
        number.rankLongData(value, start)
      );
    },
    digitData(value, start) {
      const pair = number.pair(value, start);
      if (pair) return number.pairs(value, pair);
      const source = String(value || "");
      const halfPattern = /\d{1,2},5/gu;
      for (const match of source.matchAll(halfPattern)) {
        const from = match.index;
        const end = from + match[0].length;
        if (start < from || start > end) continue;
        if (char.word(source[from - 1]) || char.word(source[end])) continue;
        const whole = Number(match[0].split(",")[0]);
        const text = number.half(whole);
        if (!text) continue;
        return {
          range: { start: from, end },
          next: casing.apply(source, { start: from, end }, text),
          space: "word",
        };
      }
      const current = range.digits(value, start);
      if (!current) return null;
      const text = number.build(
        Number(value.slice(current.start, current.end)),
      );
      if (!text) return null;
      return {
        range: current,
        next: casing.apply(value, current, text),
        space: "word",
      };
    },
    compoundDigitData(value, start) {
      const source = String(value || "");
      const pattern = /\d{1,2}[-\u2010\u2011]([А-Яа-яЁё]+)/gu;
      for (const match of source.matchAll(pattern)) {
        const from = match.index;
        const end = from + match[0].length;
        if (start < from || start > end) continue;
        if (char.word(source[from - 1]) || char.word(source[end])) continue;
        if (!number.compoundTail(match[1])) continue;
        const amount = Number(match[0].match(/^\d+/u)?.[0] || "");
        const prefix = number.compoundBase(amount);
        if (!prefix) continue;
        const range = { start: from, end };
        return {
          range,
          next: casing.apply(source, range, `${prefix}${match[1]}`),
          caret: from + prefix.length,
        };
      }
      return null;
    },
    compoundWordData(value, start) {
      const current = range.word(value, start, start);
      if (current.start === current.end) return null;
      const source = String(value || "").slice(current.start, current.end);
      const lower = number.normalize(source);
      const data = number.compoundPrefixes().find((item) => {
        if (!lower.startsWith(item.prefix)) return false;
        return number.compoundTail(source.slice(item.prefix.length));
      });
      if (!data) return null;
      const tail = source.slice(data.prefix.length);
      return {
        range: current,
        next: `${data.value}-${tail}`,
        caret: current.start + String(data.value).length,
      };
    },
    compoundData(value, start) {
      return (
        number.compoundDigitData(value, start) ||
        number.compoundWordData(value, start)
      );
    },
    data(value, start) {
      return (
        number.rankData(value, start) ||
        number.compoundData(value, start) ||
        number.digitData(value, start) ||
        number.wordData(value, start)
      );
    },
    run(element) {
      const data = number.data(element.value, element.selectionStart);
      if (!data) return false;
      const tail = Math.max(
        data.range.start,
        data.range.start + data.next.length - 1,
      );
      return edit.tail(
        element,
        {
          ...data,
          start: data.start ?? data.caret ?? tail,
          end: data.end ?? data.range.start + data.next.length,
        },
        (value) => number.tail(value, data.space),
      );
    },
  };
  const year = {
    forms: [
      { short: "й", full: "год" },
      { short: "го", full: "года" },
      { short: "м", full: "году" },
    ],
    data(value, start) {
      const token = /(\d{4})(?:[-‑–—](й|го|м)|(?:\u00a0| )(года|году|год))/giu;
      for (const match of value.matchAll(token)) {
        const from = match.index;
        const to = from + match[0].length;
        if (start < from || start > to) continue;
        if (char.word(value[from - 1]) || char.word(value[to])) continue;
        const short = match[2] ? match[2].toLowerCase() : null;
        const full = match[3] ? match[3].toLowerCase() : null;
        const data = short
          ? year.forms.find((item) => item.short === short)
          : year.forms.find((item) => item.full === full);
        if (!data) return null;
        return {
          range: { start: from, end: to },
          next: short
            ? `${match[1]}\u00a0${data.full}`
            : `${match[1]}-${data.short}`,
          caret: from + 4,
        };
      }
      return null;
    },
    run(element) {
      const data = year.data(element.value, element.selectionStart);
      if (!data) return false;
      return edit.replace(element, data);
    },
  };
  const decade = {
    list: [
      { short: "00", forms: ["нулевые", "нулевых", "нулевым", "нулевыми"] },
      { short: "0", forms: ["нулевые", "нулевых", "нулевым", "нулевыми"] },
      { short: "10", forms: ["десятые", "десятых", "десятым", "десятыми"] },
      { short: "20", forms: ["двадцатые", "двадцатых", "двадцатым", "двадцатыми"] },
      { short: "30", forms: ["тридцатые", "тридцатых", "тридцатым", "тридцатыми"] },
      { short: "40", forms: ["сороковые", "сороковых", "сороковым", "сороковыми"] },
      { short: "50", forms: ["пятидесятые", "пятидесятых", "пятидесятым", "пятидесятыми"] },
      { short: "60", forms: ["шестидесятые", "шестидесятых", "шестидесятым", "шестидесятыми"] },
      { short: "70", forms: ["семидесятые", "семидесятых", "семидесятым", "семидесятыми"] },
      { short: "80", forms: ["восьмидесятые", "восьмидесятых", "восьмидесятым", "восьмидесятыми"] },
      { short: "90", forms: ["девяностые", "девяностых", "девяностым", "девяностыми"] },
    ],
    endings: ["е", "х", "м", "ми"],
    numericData(value, start) {
      const source = String(value || "");
      const pattern = /(?:00|[1-9]?0)[-‐‑–—](ми|е|х|м)/giu;
      for (const match of source.matchAll(pattern)) {
        const from = match.index;
        const to = from + match[0].length;
        if (start < from || start > to) continue;
        if (char.word(source[from - 1]) || char.word(source[to])) continue;
        const sourceNumber = match[0].match(/^(?:00|[1-9]?0)/u)?.[0] || "";
        const item = decade.list.find((entry) => entry.short === sourceNumber);
        const ending = String(match[1] || "").toLowerCase();
        const index = decade.endings.indexOf(ending);
        if (!item || index < 0) return null;
        const range = { start: from, end: to };
        const next = casing.apply(source, range, item.forms[index]);
        return {
          range,
          next,
          caret: from + next.length,
        };
      }
      return null;
    },
    wordData(value, start) {
      const current = range.word(value, start, start);
      if (current.start === current.end) return null;
      const source = String(value || "").slice(current.start, current.end);
      const lower = source.toLowerCase();
      for (const item of decade.list) {
        const index = item.forms.indexOf(lower);
        if (index < 0) continue;
        const next = `${item.short}-${decade.endings[index]}`;
        return {
          range: current,
          next,
          caret: current.start + next.length,
        };
      }
      return null;
    },
    data(value, start) {
      return decade.numericData(value, start) || decade.wordData(value, start);
    },
    run(element) {
      const data = decade.data(element.value, element.selectionStart);
      if (!data) return false;
      return edit.replace(element, data);
    },
  };
  const abbr = {
    list: [
      { left: ["тыс."], right: ["тысяч", "тысячи", "тысяча"] },
      { left: ["млн"], right: ["миллиона", "миллионов", "миллион"] },
      { left: ["млрд"], right: ["миллиарда", "миллиардов", "миллиард"] },
      { left: ["трлн"], right: ["триллиона", "триллионов", "триллион"] },
      { left: ["г."], right: ["года"] },
      { left: ["р.", "руб."], right: ["рублей", "рубля", "рубль"] },
      { left: ["г"], right: ["граммов", "грамма", "грамм"] },
      { left: ["кг"], right: ["килограммов", "килограмма", "килограмм"] },
      { left: ["м"], right: ["метров", "метра", "метр"] },
      { left: ["км"], right: ["километров", "километра", "километре"] },
      { left: ["см"], right: ["сантиметров", "сантиметра", "сантиметр"] },
      { left: ["мм"], right: ["миллиметров", "миллиметра", "миллиметр"] },
      { left: ["Мп"], right: ["мегапикселей", "мегапикселя"] },
    ],
    strip(value) {
      return value.replace(/\.$/, "");
    },
    equal(left, right) {
      const source = String(left || "").toLowerCase();
      const target = String(right || "").toLowerCase();
      return (
        source === target ||
        (source !== "г." &&
          target !== "г." &&
          abbr.strip(source) === abbr.strip(target))
      );
    },
    sentenceDot(value, current) {
      const source = value.slice(current.start, current.end);
      if (!source.endsWith(".")) return false;
      return /^[ \t\u00A0]+[А-ЯЁA-Z]/u.test(value.slice(current.end));
    },
    withSentenceDot(sentenceDot, value) {
      if (!sentenceDot || /[.!?…]$/.test(value)) return value;
      return `${value}.`;
    },
    data(value, start) {
      const current = range.letters(value, start);
      if (current.start === current.end) return null;
      const sentenceDot = abbr.sentenceDot(value, current);
      const string = value.slice(current.start, current.end).toLowerCase();
      const item = abbr.list.find((entry) => {
        const right = Array.isArray(entry.right) ? entry.right : [entry.right];
        return (
          entry.left.some((value) => abbr.equal(value, string)) ||
          right.some((value) => abbr.equal(value, string))
        );
      });
      if (!item) return null;
      const right = Array.isArray(item.right) ? item.right : [item.right];
      const currentChain = [...item.left, ...right].map((value) =>
        abbr.withSentenceDot(sentenceDot, value),
      );
      const index = currentChain.findIndex((value) =>
        abbr.equal(value, string),
      );
      if (index < 0) return null;
      return {
        range: current,
        next: currentChain[(index + 1) % currentChain.length],
        caret: current.start,
      };
    },
    run(element) {
      const data = abbr.data(element.value, element.selectionStart);
      if (!data) return false;
      return edit.replace(element, data);
    },
  };
  const brand = {
    list: [
      { title: "Instagram", name: "инстаграм" },
      { title: "TikTok", name: "тикток" },
      { title: "Telegram", name: "телеграм" },
    ],
    forms(name) {
      return [name, `${name}а`, `${name}у`, `${name}ом`, `${name}е`];
    },
    data(value, start) {
      const current = range.letters(value, start);
      if (current.start === current.end) return null;
      const source = value.slice(current.start, current.end);
      const lower = source.toLowerCase();
      const item = brand.list.find((entry) => {
        return (
          entry.title.toLowerCase() === lower ||
          brand.forms(entry.name).includes(lower)
        );
      });
      if (!item) return null;
      return {
        range: current,
        next: item.title.toLowerCase() === lower ? item.name : item.title,
        caret: current.start,
      };
    },
    run(element) {
      const data = brand.data(element.value, element.selectionStart);
      if (!data) return false;
      return edit.replace(element, data);
    },
  };
  const stress = {
    data(value, start, end) {
      const current = range.stress(value, start, end);
      if (current.start === current.end) return null;
      const source = value.slice(current.start, current.end);
      const plain = source.normalize("NFD").replace(/\u0301/g, "");
      if (!/^(большая|большую|большие|большим|больших)$/i.test(plain)) return null;
      const mark = source.search(/[оО]\u0301/);
      if (mark >= 0) {
        return {
          range: current,
          next: source.slice(0, mark + 1) + source.slice(mark + 2),
        };
      }
      const index = source.search(/[оО]/);
      if (index < 0) return null;
      return {
        range: current,
        next:
          source.slice(0, index + 1) + accent.mark + source.slice(index + 1),
      };
    },
  };
  const yo = {
    data(value, start, end) {
      const current = range.word(value, start, end);
      if (current.start === current.end) return null;
      const source = value.slice(current.start, current.end);
      if (!/[Ёё]/u.test(source)) return null;
      return {
        range: current,
        next: source.replace(/Ё/g, "Е").replace(/ё/g, "е"),
      };
    },
    run(element) {
      const data = yo.data(
        element.value,
        element.selectionStart,
        element.selectionEnd,
      );
      if (!data) return false;
      return edit.replace(element, {
        ...data,
        caret: data.range.start + data.next.length,
      });
    },
  };
  const reflexive = {
    data(value, start, end) {
      const current = range.word(value, start, end);
      if (current.start === current.end) return null;
      const source = value.slice(current.start, current.end);
      const lower = source.toLowerCase();
      const match = lower.match(/ться$|тся$/u);
      if (!match) return null;
      const suffix = match[0] === "тся" ? "ться" : "тся";
      return {
        range: current,
        next: `${source.slice(0, source.length - match[0].length)}${suffix}`,
      };
    },
  };
  const stem = {
    pairs: [["закончи", "окончи"]],
    format(value, source) {
      if (source[0] !== source[0].toUpperCase()) return value;
      return `${value[0].toUpperCase()}${value.slice(1)}`;
    },
    data(value, start, end) {
      const current = range.word(value, start, end);
      if (current.start === current.end) return null;
      const source = value.slice(current.start, current.end);
      const lower = source.toLowerCase();
      const pair = stem.pairs.find((items) =>
        items.some((item) => lower.startsWith(item)),
      );
      if (!pair) return null;
      const index = pair.findIndex((item) => lower.startsWith(item));
      if (index < 0) return null;
      const from = pair[index];
      const to = pair[(index + 1) % pair.length];
      return {
        range: current,
        next: `${stem.format(to, source)}${source.slice(from.length)}`,
      };
    },
  };
  const variant = {
    groups() {
      return [
        ["не", "ни"],
        ["или", "либо"],
        ["но", "однако"],
        ["больше", "более"],
        ["меньше", "менее"],
        ["со слов", "по словам"],
        ["после", "впоследствии"],
        ["с помощью", "при помощи"],
        ["учитывая", "с учетом того"],
        ["независимо", "вне зависимости"],
        ["в том числе", "помимо прочего"],
        ["более или менее", "более-менее"],
        ["чуть", "немножко", "немного"],
        ["около", "примерно", "приблизительно", "порядка"],
        ["РБ", "Республики Беларусь", "Беларусь", "Беларуси"],
        ["м2", "кв. м", "квадратных метров", "«квадратов»"],
        ["делится", "рассказывает", "говорит", "сообщает"],
        ["делятся", "рассказывают", "говорят", "сообщают"],
        ["поделился", "рассказал", "сообщил"],
        ["поделилась", "рассказала", "сообщила"],
        ["поделились", "рассказали", "сообщили"],
      ];
    },
    token() {
      const plural = ["делятся", "поделились"];
      return variant.groups().filter((chain) => !plural.includes(chain[0]));
    },
    find(value, start, end, groups = variant.groups()) {
      const lowerValue = value.toLowerCase();
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
            if (
              inside &&
              !char.word(lowerValue[from - 1]) &&
              !char.word(lowerValue[to])
            ) {
              matches.push({ chain, from, to, token });
            }
            from = lowerValue.indexOf(token, from + 1);
          }
        });
      });
      if (!matches.length) return null;
      return matches.sort(
        (left, right) => right.token.length - left.token.length,
      )[0];
    },
    sentenceDot(value, to, token) {
      if (token.endsWith(".")) return false;
      return /^\.[ \t\u00A0]+[А-ЯЁA-Z]/u.test(value.slice(to));
    },
    withSentenceDot(value, hit, item) {
      if (!hit.sentenceDot || /[.!?…]$/.test(item)) return item;
      return `${item}.`;
    },
    data(value, start, end, groups = variant.groups()) {
      const hit = variant.find(value, start, end, groups);
      if (!hit) return null;
      const source = value.slice(hit.from, hit.to);
      const upper = source[0] === source[0].toUpperCase();
      const currentChain = hit.chain.map((item) =>
        upper ? `${item[0].toUpperCase()}${item.slice(1)}` : item,
      );
      return {
        range: { start: hit.from, end: hit.to },
        chain: currentChain,
        index: currentChain.findIndex(
          (item) => item.toLowerCase() === source.toLowerCase(),
        ),
      };
    },
  };
  const branch = {
    data(value, start, end, groups = variant.groups()) {
      const normalized = yo.data(value, start, end);
      if (normalized) return normalized;
      const stressed = stress.data(value, start, end);
      if (stressed) return stressed;
      const reflexed = reflexive.data(value, start, end);
      if (reflexed) return reflexed;
      const stemmed = stem.data(value, start, end);
      if (stemmed) return stemmed;
      const data = variant.data(value, start, end, groups);
      if (!data) return null;
      return {
        range: data.range,
        next: chain.next(data),
      };
    },
    run(element) {
      const data = branch.data(
        element.value,
        element.selectionStart,
        element.selectionEnd,
      );
      if (!data) return false;
      return edit.replace(element, {
        ...data,
        caret: data.range.start + data.next.length,
      });
    },
  };
  const inflect = {
    models: [
      ["ый", "ого", "ому", "ым", "ом"],
      ["ой", "ого", "ому", "ым", "ом"],
      ["ий", "его", "ему", "им", "ем"],
      ["ые", "ых", "ым", "ыми"],
      ["ие", "их", "им", "ими"],
      ["ая", "ой", "ую"],
      ["яя", "ей", "юю"],
      ["ое", "ого", "ому", "ым", "ом"],
      ["ее", "его", "ему", "им", "ем"],
      ["а", "ы", "е", "у", "ой"],
      ["я", "и", "е", "ю", "ей"],
    ],
    data(value, start, end) {
      const current = range.word(value, start, end);
      if (current.start === current.end) return null;
      const source = value.slice(current.start, current.end);
      const lower = source.toLowerCase();
      const upper = source === source.toUpperCase();
      const data = inflect.models
        .map((chain) => {
          const index = chain.findIndex((ending) => lower.endsWith(ending));
          if (index < 0) return null;
          return { chain, index, ending: chain[index] };
        })
        .filter(Boolean)
        .sort((left, right) => right.ending.length - left.ending.length)[0];
      if (!data) return null;
      const next = data.chain[(data.index + 1) % data.chain.length];
      const stem = source.slice(0, source.length - data.ending.length);
      return {
        range: current,
        next: `${stem}${upper ? next.toUpperCase() : next}`,
      };
    },
    run(element) {
      const data = inflect.data(
        element.value,
        element.selectionStart,
        element.selectionEnd,
      );
      if (!data) return false;
      return edit.replace(element, {
        ...data,
        caret: data.range.start + data.next.length,
      });
    },
  };
  const token = {
    data(value, start, end) {
      return (
        yo.data(value, start, end) ||
        multiply.data(value, start, end) ||
        year.data(value, start) ||
        decade.data(value, start) ||
        number.data(value, start) ||
        abbr.data(value, start) ||
        brand.data(value, start) ||
        branch.data(value, start, end, variant.token())
      );
    },
    active(element) {
      return Boolean(
        token.data(element.value, element.selectionStart, element.selectionEnd),
      );
    },
    word(element) {
      const data = branch.data(
        element.value,
        element.selectionStart,
        element.selectionEnd,
        variant.token(),
      );
      if (!data) return false;
      return edit.replace(element, {
        ...data,
        caret: data.range.start + data.next.length,
      });
    },
    run(element) {
      return [
        yo.run,
        multiply.run,
        year.run,
        decade.run,
        number.run,
        abbr.run,
        brand.run,
        token.word,
      ].some((run) => run(element));
    },
  };
  return {
    accent: accent.run,
    cycle: choice.run,
    capital: capital.run,
    number: number.run,
    year: year.run,
    abbr: abbr.run,
    token: token.run,
    tokenActive: token.active,
    branch: branch.run,
    inflect: inflect.run,
  };
};
