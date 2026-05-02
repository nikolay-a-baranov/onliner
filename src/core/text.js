export const text = {
  wordAhead: String.raw`\s+[^\s»")\],;:!?…]`,
  closingAhead: String.raw`[»")\]]`,
  centuryWord:
    String.raw`(?:век(?:а|е|у|ом|ов|ах)?|столет(?:ие|ия|ию|ием|ий|иям|иями|иях)?)`,

  replace(string, rules) {
    return rules.reduce(
      (result, [from, to]) => result.replace(from, to),
      string,
    );
  },

  pipe(value, ...steps) {
    return steps.reduce((result, step) => step(result), value);
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

  romanCentury(value) {
    return value
      .replace(/М/g, "M")
      .replace(/С/g, "C")
      .replace(/Х/g, "X")
      .replace(/м/g, "m")
      .replace(/с/g, "c")
      .replace(/х/g, "x")
      .toUpperCase();
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

  typography(string) {
    const brands = (string) =>
      text.replace(string, [
        [/\bOnliner\b/g, "Onlíner"],
        [/\bLego\b/g, "LEGO"],
        [/\bIphone\b/g, "iPhone"],
        [/\bYoutube\b/g, "YouTube"],
        [/\bTik[- ]?Tok\b/gi, "TikTok"],
      ]);

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

    const ellipsis = (string) => string.replace(/\.{3}/g, "…");

    const dashes = (string) => {
      const dash = "[-–—]";
      const space = "[ \\t]";
      const char = "[^ \\t\\n]";
      return string
        .replace(
          new RegExp(
            String.raw`\b([IVXLCDMМСХ]+)\s*${dash}\s*([IVXLCDMМСХ]+)(?=\s+${text.centuryWord})`,
            "giu",
          ),
          (_, left, right) =>
            `${text.romanCentury(left)}—${text.romanCentury(right)}`,
        )
        .replace(
          new RegExp(
            String.raw`\b([IVXLCDMМСХ]+)(?=\s+${text.centuryWord})`,
            "giu",
          ),
          (_, value) => text.romanCentury(value),
        )
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
      const english = (string) =>
        string.replace(/“([^“”\n]*)”/g, "«$1»");
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

    return quotes(dashes(ellipsis(socials(brands(string)))));
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
      "по сути",
      "как правило",
      "скорее всего",
      "кроме того",
      "наверное",
      "к счастью",
      "к сожалению",
      "во-первых",
      "во-вторых",
      "в-третьих",
    ]);

    const start = text.variants([
      "таким образом",
      "с одной стороны",
      "так",
      "на самом деле",
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

  nbsp(string) {
    return string
      .replace(/([^\s]) (— )/g, (_, left, dash) => `${left}\u00A0${dash}`)
      .replace(
        /(^|\n)(\s*)((?:<(?!\/)[a-z][a-z0-9]*\b[^>]*>\s*){0,2})—\s+/gi,
        (_, start, indent, tags) => `${start}${indent}${tags}—\u00A0`,
      );
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
        /\b(\d[\d ]*(?:[.,]\d+)?)\s+(тысяч(?:а|и|е|у|ей|ам|ами|ах)?|миллион(?:а|у|е|ом|ы|ов|ам|ами|ах)?|миллиард(?:а|у|е|ом|ы|ов|ам|ами|ах)?)\b/gi,
        (_, value, unit) => {
          const lower = unit.toLowerCase();
          if (lower.startsWith("тысяч")) return `${value} тыс.`;
          if (lower.startsWith("миллион")) return `${value} млн`;
          return `${value} млрд`;
        },
      );

    const centuries = (string) =>
      string.replace(
        new RegExp(
          String.raw`\b([1-9]|1\d|2\d|30)(?:-?(?:й|го|му|м|е|х|ми))?(?=\s+${text.centuryWord})`,
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
      const amount = String.raw`\d[\d ]*(?:[.,]\d+)?(?:\s+(?:тыс\.|млн|млрд))?`;
      const rubles = (value) => {
        if (/(?:тыс\.|млн|млрд)\b/.test(value)) return "рублей";
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

    return text.pipe(string, centuries, date, time, thousands, amounts, money);
  },

  collocations(string) {
    const expand = (string, pattern, lower, upper) =>
      string.replace(pattern, (_, head, tail = "") => {
        const phrase = head === head.toUpperCase() ? upper : lower;
        return tail ? `${phrase}${tail}` : `${phrase}.`;
      });

    const tail = String.raw`([,!?…:;]|\.(?=\s|$)|(?=\s|$|[»")\]])|$)?`;
    const rules = [
      [String.raw`\b(и)\s+т\.\s*д\.${tail}`, "и так далее", "И так далее"],
      [String.raw`\b(т)\.\s*е\.${tail}`, "то есть", "То есть"],
      [String.raw`\b(т)\.\s*к\.${tail}`, "так как", "Так как"],
    ];
    rules.forEach(([pattern, lower, upper]) => {
      string = expand(string, new RegExp(pattern, "gi"), lower, upper);
    });
    return string;
  },

  run(value = "") {
    return text.pipe(
      value,
      text.spaces,
      text.typography,
      text.spacing,
      text.punctuation,
      text.grammar,
      text.collocations,
      text.numbers,
      text.nbsp,
    );
  },
};
