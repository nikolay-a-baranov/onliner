export const createTokens = (api) => {
  const char = {
    letter(value) {
      return /[А-Яа-яA-Za-zЁё]/.test(value || "");
    },
    word(value) {
      return /[0-9A-Za-zА-Яа-яЁё]/.test(value || "");
    },
  };
  const range = {
    word(value, start, end) {
      return start === end
        ? api.word(value, start)
        : api.trim(value, start, end);
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
      element.value = edit.text(value, data.range, data.next);
      return api.done(element, data.start ?? data.caret, data.end);
    },
    tail(element, data, tail) {
      const value = element.value;
      element.value =
        value.slice(0, data.range.start) +
        data.next +
        tail(value.slice(data.range.end));
      return api.done(element, data.start ?? data.caret, data.end);
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
    data(value, start, end, list) {
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
    run(element, list) {
      const data = choice.data(
        element.value,
        element.selectionStart,
        element.selectionEnd,
        list,
      );
      if (!data) return false;
      return edit.replace(element, data);
    },
  };
  const capital = {
    data(value, start, end) {
      const current = range.word(value, start, end);
      if (current.start === current.end) return null;
      const source = value.slice(current.start, current.end);
      const lower = source.toLowerCase();
      const next =
        source === lower
          ? lower.replace(
              /^((?:<[^>]+>|\s|[«„“"'()])+)?([А-Яа-яA-Za-zЁё])/,
              (_, left = "", letter) => `${left}${letter.toUpperCase()}`,
            )
          : lower;
      return {
        range: current,
        next,
        start: start === end ? Math.min(start, value.length) : current.start,
        end:
          start === end
            ? Math.min(start, value.length)
            : current.start + next.length,
      };
    },
    run(element) {
      const data = capital.data(
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
    join(left, right) {
      if (!left.includes(" ") && !right.includes(" "))
        return `${left}-${right}`;
      return `${left}\u00a0— ${right}`;
    },
    tail(value) {
      return value.replace(/^\u00a0/, " ");
    },
    pair(value, start) {
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
    },
    pairs(value, range) {
      const string = value.slice(range.start, range.end);
      const match = string.match(/^\s*(\d+)\s*[-–—]\s*(\d+)\s*$/);
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
    wordRange(value, left, right) {
      const middle = value.slice(left.end, right.start);
      if (!/^(?:\s|\u00a0)+$/u.test(middle)) return null;
      return {
        start: left.start,
        end: right.end,
        text: `${left.text} ${right.text}`,
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
      const current = words[index];
      const previous = words[index - 1] || null;
      const next = words[index + 1] || null;
      return [
        next ? number.wordRange(value, current, next) : null,
        previous ? number.wordRange(value, previous, current) : null,
        { start: current.start, end: current.end, text: current.text },
      ].filter(Boolean);
    },
    wordValue(text) {
      const parts = String(text || "")
        .split(/\s+/u)
        .map(number.normalize)
        .filter(Boolean);
      const data = number.map();
      if (parts.length === 1) return data.get(parts[0]) ?? null;
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
      return {
        range: { start: data.range.start, end: data.range.end },
        next: String(data.value),
        caret: data.range.start + String(data.value).length,
      };
    },
    digitData(value, start) {
      const pair = number.pair(value, start);
      if (pair) return number.pairs(value, pair);
      const current = range.digits(value, start);
      if (!current) return null;
      const text = number.build(
        Number(value.slice(current.start, current.end)),
      );
      if (!text) return null;
      return {
        range: current,
        next: casing.apply(value, current, text),
      };
    },
    data(value, start) {
      return number.digitData(value, start) || number.wordData(value, start);
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
        number.tail,
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
    data(value, start) {
      const current = range.letters(value, start);
      if (current.start === current.end) return null;
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
      const currentChain = [...item.left, ...right];
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
  const stress = {
    data(value, start, end) {
      const current = range.stress(value, start, end);
      if (current.start === current.end) return null;
      const source = value.slice(current.start, current.end);
      const plain = source.normalize("NFD").replace(/\u0301/g, "");
      if (!/^(большая|большую)$/i.test(plain)) return null;
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
        ["или", "либо"],
        ["но", "однако"],
        ["после", "впоследствии"],
        ["с помощью", "при помощи"],
        ["учитывая", "с учетом того"],
        ["независимо", "вне зависимости"],
        ["в том числе", "помимо прочего"],
        ["больше", "более"],
        ["меньше", "менее"],
        ["более или менее", "более-менее"],
        ["РБ", "Республики Беларусь", "Беларусь", "Беларуси"],
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
        year.data(value, start) ||
        number.data(value, start) ||
        abbr.data(value, start) ||
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
      return [year.run, number.run, abbr.run, token.word].some((run) =>
        run(element),
      );
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
