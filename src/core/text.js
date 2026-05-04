export const text = {
  wordAhead: String.raw`\s+[^\s»")\],;:!?…]`,
  closingAhead: String.raw`[»")\]]`,

  replace(string, rules) {
    return rules.reduce(
      (result, [from, to]) => result.replace(from, to),
      string,
    );
  },

  pipe(value, ...steps) {
    return steps.reduce((result, step) => step(result), value);
  },

  variants(list) {
    return list
      .flatMap((item) => [item, item[0].toUpperCase() + item.slice(1)])
      .join("|");
  },

  spaces(string) {
    string = string
      .replace(/\u00A0/g, " ")
      .replace(/&nbsp;/gi, " ")
      .replace(/&#160;/gi, "&#32;");
    let snap;
    do {
      snap = string;
      string = string
        .replace(/((?:<[a-z][a-z0-9]*[^\/>]*>)+)([ \t]+)/gi, "$2$1")
        .replace(/([ \t]+)((?:<\/[a-z][a-z0-9]*>)+)/gi, "$2$1");
    } while (string !== snap);
    return string
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n[ \t]+/g, "\n")
      .replace(/[ \t]{2,}/g, " ")
      .trim();
  },

  century: {
    word: String.raw`(?:век(?:а|е|у|ом|ов|ах)?|столет(?:ие|ия|ию|ием|ий|иям|иями|иях)?)`,
    normalize(value) {
      return value
        .replace(/М/g, "M")
        .replace(/С/g, "C")
        .replace(/Х/g, "X")
        .toUpperCase();
    },
    roman(value) {
      const digits = [
        [1000, "M"],
        [900, "CM"],
        [500, "D"],
        [400, "CD"],
        [100, "C"],
        [90, "XC"],
        [50, "L"],
        [40, "XL"],
        [10, "X"],
        [9, "IX"],
        [5, "V"],
        [4, "IV"],
        [1, "I"],
      ];
      let number = Number(value);
      let result = "";
      for (const [arabic, roman] of digits) {
        while (number >= arabic) {
          result += roman;
          number -= arabic;
        }
      }
      return result;
    },
  },

  typography(string) {
    const dashes = (string) => {
      const dash = "[-–—]";
      const space = "[ \\t]";
      const char = "[^ \\t\\n]";
      return string
        .replace(
          new RegExp(`\\b([IVXLCDM]+)${dash}+([IVXLCDM]+)\\b`, "gi"),
          (_, left, right) => `${left}—${right}`,
        )
        .replace(
          new RegExp(`(\\d)${dash}+(\\d)`, "g"),
          (_, left, right) => `${left}—${right}`,
        )
        .replace(new RegExp(`(${space})${dash}+(${space})`, "g"), "$1—$2")
        .replace(new RegExp(`(${char})${dash}{2,}(${char})`, "g"), "$1—$2")
        .replace(new RegExp(`(${char})${dash}+(${space})`, "g"), "$1—$2")
        .replace(new RegExp(`(${space})${dash}+(${char})`, "g"), "$1—$2");
    };

    const quotes = (string) => {
      const english = (string) => string.replace(/“([^“”\n]*)”/g, "«$1»");
      const straight = (string) => {
        let open = true;
        return string.replace(/"/g, () => {
          const quote = open ? "«" : "»";
          open = !open;
          return quote;
        });
      };
      const nested = (string) => {
        let snap;
        do {
          snap = string;
          string = string.replace(
            /«([^«»\n]*)«([^«»\n]+)»([^«»\n]*)»/g,
            "«$1„$2“$3»",
          );
        } while (string !== snap);
        return string;
      };
      return nested(straight(english(string)));
    };

    const ellipsis = (string) => string.replace(/\.{3}/g, "…");

    const units = (string) =>
      string
        .replace(/\bм\s*[·•∙⋅.]?\s*а\s*[·•∙⋅.]?\s*ч\b/gi, "мА·ч")
        .replace(/\bн\s*[·•∙⋅.]\s*м\b|\bн\s+м\b/gi, "Н·м");

    const brands = (string) =>
      string
        .replace(/\bOnliner\b/g, "Onlíner")
        .replace(/\bLego\b/g, "LEGO")
        .replace(/\bIphone\b/g, "iPhone")
        .replace(/\bYoutube\b/g, "YouTube")
        .replace(/\bTik[- ]?Tok\b/gi, "TikTok");

    const socials = (string) =>
      string.replace(
        /\b(telegram|instagram|tiktok)(-)(?=[А-Яа-яЁё])/gi,
        (_, name, dash) => {
          const map = {
            telegram: "телеграм",
            instagram: "инстаграм",
            tiktok: "тикток",
          };
          const value = map[name.toLowerCase()];
          const head =
            name[0] === name[0].toUpperCase()
              ? value[0].toUpperCase() + value.slice(1)
              : value;
          return `${head}${dash}`;
        },
      );

    return brands(socials(units(ellipsis(quotes(dashes(string))))));
  },

  spacing(string) {
    return string
      .replace(/[\u0020\u0009\u00A0]+([,.!?…:;»])/g, "$1")
      .replace(/([»„“”"\)\]])[\u0020\u0009\u00A0]+([,.!?…:;])/g, "$1$2")
      .replace(/([!?…;])(?=[^\u0020\u0009\u00A0\n<!?…;»])/g, "$1 ")
      .replace(/(»)(?=[^\u0020\u0009\u00A0\n<.,:;»!?…])/g, "$1 ")
      .replace(/([.,:])(?=[^\u0020\u0009\u00A0\n<\d.,:;»!?…])/g, "$1 ")
      .replace(/(«)[\u0020\u0009\u00A0]+/g, "$1");
  },

  punctuation(string) {
    const both = text.variants([
      "во-первых",
      "во-вторых",
      "в-третьих",
      "к сожалению",
      "к счастью",
      "казалось бы",
      "как правило",
      "наверное",
      "по сути",
      "пожалуй",
      "скорее всего",
    ]);

    const start = text.variants([
      "кроме того",
      "на самом деле",
      "с одной стороны",
      "таким образом",
      "так",
    ]);

    string = string
      .replace(
        new RegExp(`(^|[.!?…]\\s+)(${both})(?=\\s+[^,])`, "g"),
        (_, a, b) => `${a}${b},`,
      )
      .replace(
        new RegExp(`([^\\s(«—])\\s+(${both})(?=\\s+[^,])`, "g"),
        (_, a, b) => `${a}, ${b},`,
      )
      .replace(
        new RegExp(`(^|[.!?…]\\s+)(${start})(?=\\s+[^,])`, "g"),
        (_, a, b) => `${a}${b},`,
      );

    return string;
  },

  grammar(string) {
    const latinToCyrillic = {
      A: "А",
      B: "В",
      C: "С",
      E: "Е",
      H: "Н",
      K: "К",
      M: "М",
      O: "О",
      P: "Р",
      T: "Т",
      X: "Х",
      Y: "У",
      a: "а",
      c: "с",
      e: "е",
      o: "о",
      p: "р",
      x: "х",
      y: "у",
    };

    return string.replace(/\b[\p{L}]+\b/gu, (word) => {
      if (!/\p{Script=Cyrillic}/u.test(word) || !/[A-Za-z]/.test(word)) {
        return word;
      }
      return word.replace(/[ABCEHKMOPTXYaceopxy]/g, (letter) => {
        return latinToCyrillic[letter] || letter;
      });
    });
  },

  spelling(string) {
    const caseify = (source, target) =>
      source[0] === source[0].toUpperCase()
        ? target[0].toUpperCase() + target.slice(1)
        : target;
    const modes = {
      stem: String.raw`[а-яё]*`,
      noun: String.raw`(?:а|у|ом|е|ы|ов|ам|ами|ах)?`,
      adjective: String.raw`(?:ый|ая|ое|ые|ого|ому|ым|ом|ой|ую|ых|ыми|ою|ее|ий|яя|ее|ие|его|ему|им|их|ими)`,
      hyphen: String.raw`(?=-)`,
    };
    const rules = [
      ["stem", "агенств", "агентств"],
      ["stem", "блоггер", "блогер"],
      ["stem", "скилл", "скил"],
      ["stem", "оффлайн", "офлайн"],
      ["stem", "риэлтор", "риелтор"],
      ["stem", "ритейл", "ретейл"],
      ["stem", "фешн", "фешен"],
      ["stem", "экшн", "экшен"],
      ["stem", "шоппинг", "шопинг"],
      ["adjective", "считанн", "считан"],
      ["hyphen", "колл", "кол"],
    ];
    return rules.reduce((result, [mode, from, to]) => {
      const ending = modes[mode] || modes.stem;
      return result.replace(
        new RegExp(String.raw`\b${from}(${ending})\b`, "gi"),
        (match, ending) => caseify(match, to) + ending,
      );
    }, string);
  },

  collocations(string) {
    const caseify = (source, lower, upper) =>
      source === source.toUpperCase() ? upper : lower;

    const tail = String.raw`([,!?…:;]|\.(?=\s|$)|(?=\s|$|[»")\]])|$)?`;
    const expands = [
      [String.raw`и\s+т\.\s*д\.`, "и так далее", "И так далее"],
      [String.raw`т\.\s*е\.`, "то есть", "То есть"],
      [String.raw`т\.\s*к\.`, "так как", "Так как"],
    ];
    expands.forEach(([from, lower, upper]) => {
      string = string.replace(
        new RegExp(String.raw`\b(${from})${tail}`, "gi"),
        (_, head, mark = "") => {
          const phrase = caseify(head, lower, upper);
          return mark ? `${phrase}${mark}` : `${phrase}.`;
        },
      );
    });

    const phrases = [
      [String.raw`(име(?:ет|ют|л|ла|ло|ли))\s+место\s+быть`, "$1 место"],
      [String.raw`в\s+конечном\s+итоге`, "в итоге"],
      [String.raw`на\s+сегодняшний\s+день`, "сегодня"],
    ];
    phrases.forEach(([from, to]) => {
      string = string.replace(
        new RegExp(String.raw`(^|[^\p{L}\d_])${from}(?=$|[^\p{L}\d_])`, "giu"),
        (_, left) => `${left}${to}`,
      );
    });

    return string;
  },

  numbers(string) {
    const thousands = (string) =>
      string.replace(/\b\d{1,3}(?: \d{3})+\b|\b\d{4,}\b/g, (value) => {
        const digits = value.replace(/ /g, "");
        if (digits.length < 5) return digits;
        return digits.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
      });

    const amounts = (string) =>
      string.replace(
        /\b(\d[\d ]*(?:[.,]\d+)?)\s+(тысяч(?:а|и|е|у|ей|ам|ами|ах)?|миллион(?:а|у|е|ом|ы|ов|ам|ами|ах)?|миллиард(?:а|у|е|ом|ы|ов|ам|ами|ах)?|триллион(?:а|у|е|ом|ы|ов|ам|ами|ах)?)\b/gi,
        (_, value, unit) => {
          const lower = unit.toLowerCase();
          if (lower.startsWith("тысяч")) return `${value} тыс.`;
          if (lower.startsWith("миллион")) return `${value} млн`;
          if (lower.startsWith("миллиард")) return `${value} млрд`;
          return `${value} трлн`;
        },
      );

    const centuries = (string) =>
      string.replace(
        new RegExp(
          String.raw`\b([1-9]|1\d|2\d|30)(?:-?(?:й|го|му|м|е|х|ми))?(?=\s+${this.century.word})`,
          "giu",
        ),
        (_, value) => text.roman(value),
      );

    const date = (string) =>
      string.replace(
        /\b(\d{1,2})\.(\d{1,2})\.(\d{4})\b/g,
        (_, day, month, year) =>
          `${day.padStart(2, "0")}.${month.padStart(2, "0")}.${year}`,
      );

    const time = (string) =>
      string
        .replace(/\b(\d)\.\s*(\d{2})(?!\.\d{2,4}\b)\b/g, "0$1:$2")
        .replace(/\b(\d{2})\.\s*(\d{2})(?!\.\d{2,4}\b)\b/g, "$1:$2")
        .replace(/\b(\d):\s*(\d{2})\b/g, "0$1:$2")
        .replace(/\b(\d{2}):\s*(\d{2})\b/g, "$1:$2");

    const money = (string) => {
      const amount = String.raw`\d[\d ]*(?:[.,]\d+)?(?:\s+(?:тыс\.|млн|млрд|трлн))?`;
      const rubles = (value) => {
        if (/(?:тыс\.|млн|млрд|трлн)\b/.test(value)) return "рублей";
        if (/[.,]/.test(value)) return "рубля";
        const number = Number(value.replace(/ /g, ""));
        const mod100 = number % 100;
        if (mod100 >= 11 && mod100 <= 14) return "рублей";
        const mod10 = number % 10;
        if (mod10 === 1) return "рубль";
        if (mod10 >= 2 && mod10 <= 4) return "рубля";
        return "рублей";
      };
      string = string.replace(
        new RegExp(
          String.raw`\b(${amount})\s+(?:р\.|руб\.)(?=\s|$|${text.closingAhead}|[,;:!?…])`,
          "gi",
        ),
        (full, value, offset, source) => {
          const tail = source.slice(offset + full.length);
          const result = `${value} ${rubles(value)}`;
          if (new RegExp(`^${text.wordAhead}`).test(tail)) return result;
          if (new RegExp(`^(?:$|${text.closingAhead})`).test(tail)) {
            return `${result}.`;
          }
          return result;
        },
      );
      [
        ["доллар(?:а|ов)?", "$"],
        ["евро", "€"],
        ["фунт(?:а|ов)?\\s+стерлингов", "£"],
      ].forEach(([unit, sign]) => {
        string = string.replace(
          new RegExp(String.raw`\b(${amount})\s+${unit}\b`, "gi"),
          (_, value) => `${sign}${value}`,
        );
      });
      return string;
    };
    return text.pipe(string, date, time, thousands, amounts, money);
  },

  nbsp(string) {
    const glue = (match) => match.replace(/\s+/g, "\u00A0");
    const rules = {
      number: [
        String.raw`год(?:а|у|ом|е)?`,
        String.raw`января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря`,
        String.raw`руб(?:ль|ля|лей|лю|лем|ле|ли|лях|лям|лями)?|руб\.|р\.`,
        String.raw`час(?:а|ов|у|ам|ами|ах)?|минут(?:а|ы|у|ой|е|ам|ами|ах)?|секунд(?:а|ы|у|ой|е|ам|ами|ах)?|д(?:ень|ня|ней|ню|нем|ни|ням|нями|нях)`,
        String.raw`грамм(?:а|ов|у|ом|е|ы|ам|ами|ах)?|килограмм(?:а|ов|у|ом|е|ы|ам|ами|ах)?|тонн(?:а|ы|у|ой|е|ам|ами|ах)?|г|кг`,
        String.raw`метр(?:а|ов|у|ом|е|ы|ам|ами|ах)?|километр(?:а|ов|у|ом|е|ы|ам|ами|ах)?|сантиметр(?:а|ов|у|ом|е|ы|ам|ами|ах)?|миллиметр(?:а|ов|у|ом|е|ы|ам|ами|ах)?|м|км|см|мм`,
      ],
      phrase: [String.raw`в\s+том\s+числе`, String.raw`по\s+крайней\s+мере`],
    };
    const patterns = [
      ...rules.number.map(
        (rule) => String.raw`\b\d[\d ]*(?:[.,]\d+)?\s+(?:${rule})\b`,
      ),
      ...rules.phrase.map((rule) => String.raw`\b(?:${rule})\b`),
    ];
    string = patterns.reduce(
      (result, pattern) => result.replace(new RegExp(pattern, "gi"), glue),
      string,
    );
    return string
      .replace(/([^\s]) (— )/g, (_, left, dash) => `${left}\u00A0${dash}`)
      .replace(
        /(^|\n)(\s*)((?:<(?!\/)[a-z][a-z0-9]*\b[^>]*>\s*){0,2})—\s+/gi,
        (_, start, indent, tags) => `${start}${indent}${tags}—\u00A0`,
      );
  },

  run(value = "") {
    return text.pipe(
      value,
      text.spaces,
      text.typography,
      text.spacing,
      text.punctuation,
      text.grammar,
      text.spelling,
      text.collocations,
      text.numbers,
      text.nbsp,
    );
  },
};
