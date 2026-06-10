export const createTokens = (api) => ({
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
      return api.done(element, Math.max(markAt, start - run));
    }
    element.value = value.slice(0, markAt) + acute + value.slice(markAt);
    return api.done(element, start <= markAt ? start : start + 1);
  },
  cyclePick(element, list) {
    const start = element.selectionStart;
    const end = element.selectionEnd;
    const value = element.value;
    if (start !== end) {
      element.value = value.slice(0, start) + list[0] + value.slice(end);
      return api.done(element, start + list[0].length);
    }
    const left = value[start - 1];
    const right = value[start];
    const index = list.findIndex((item) => item === left || item === right);
    if (index < 0) {
      element.value = value.slice(0, start) + list[0] + value.slice(start);
      return api.done(element, start + list[0].length);
    }
    const next = list[(index + 1) % list.length];
    const shift = list[index] === left ? -1 : 0;
    const place = start + shift;
    element.value =
      value.slice(0, place) + next + value.slice(place + list[index].length);
    return api.done(element, start);
  },
  letter(element) {
    const start = element.selectionStart;
    const end = element.selectionEnd;
    const value = element.value;
    const range =
      start === end
        ? api.word(value, start)
        : api.trim(value, start, end);
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
    return api.done(
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
    return api.done(element, range.start + next.length);
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
    const data = api.yearToken(value, start);
    if (!data) return false;
    element.value =
      value.slice(0, data.start) + data.next + value.slice(data.end);
    return api.done(element, data.start + 4);
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
    const data = api.abbrData(value, start);
    if (!data) return false;
    const next = data.chain[(data.index + 1) % data.chain.length];
    element.value =
      value.slice(0, data.range.start) + next + value.slice(data.range.end);
    return api.done(element, data.range.start);
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
    const data = api.wordCycleData(value, start, end);
    if (!data) return false;
    const index = data.index < 0 ? 0 : (data.index + 1) % data.chain.length;
    const next = data.chain[index];
    element.value =
      value.slice(0, data.range.start) + next + value.slice(data.range.end);
    return api.done(element, data.range.start + next.length);
  },
});
