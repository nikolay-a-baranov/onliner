const replace = (string, rules) =>
  rules.reduce((result, [from, to]) => result.replace(from, to), string);

const pipe = (value, ...steps) =>
  steps.reduce((result, step) => step(result), value);

const wordAhead = String.raw`\s+[^\sÂ»")\],;:!?â€¦]`;
const closingAhead = String.raw`[Â»")\]]`;
const centuryWord = String.raw`(?:Ð²ÐµÐº(?:Ð°|Ðµ|Ñƒ|Ð¾Ð¼|Ð¾Ð²|Ð°Ñ…)?|ÑÑ‚Ð¾Ð»ÐµÑ‚(?:Ð¸Ðµ|Ð¸Ñ|Ð¸ÑŽ|Ð¸ÐµÐ¼|Ð¸Ð¹|Ð¸ÑÐ¼|Ð¸ÑÐ¼Ð¸|Ð¸ÑÑ…)?)`;

const toRoman = (value) => {
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
};

const romanCentury = (value) =>
  value
    .replace(/Ðœ/g, "M")
    .replace(/Ð¡/g, "C")
    .replace(/Ð¥/g, "X")
    .replace(/Ð¼/g, "m")
    .replace(/Ñ/g, "c")
    .replace(/Ñ…/g, "x")
    .toUpperCase();

const variants = (list) =>
  list
    .flatMap((item) => [item, item[0].toUpperCase() + item.slice(1)])
    .join("|");

export const text = {
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
      replace(string, [
        [/\bOnliner\b/g, "OnlÃ­ner"],
        [/\bLego\b/g, "LEGO"],
        [/\bIphone\b/g, "iPhone"],
        [/\bYoutube\b/g, "YouTube"],
        [/\bTik[- ]?Tok\b/gi, "TikTok"],
      ]);

    const socials = (string) =>
      string.replace(
        /\b(telegram|instagram|tiktok)(-)(?=[Ð-Ð¯Ð°-ÑÐÑ‘])/gi,
        (_, name, dash) => {
          const map = {
            telegram: "Ñ‚ÐµÐ»ÐµÐ³Ñ€Ð°Ð¼",
            instagram: "Ð¸Ð½ÑÑ‚Ð°Ð³Ñ€Ð°Ð¼",
            tiktok: "Ñ‚Ð¸ÐºÑ‚Ð¾Ðº",
          };
          const value = map[name.toLowerCase()];
          const head =
            name[0] === name[0].toUpperCase()
              ? value[0].toUpperCase() + value.slice(1)
              : value;
          return `${head}${dash}`;
        },
      );

    const ellipsis = (string) => string.replace(/\.{3}/g, "â€¦");

    const dashes = (string) => {
      const dash = "[-â€“â€”]";
      const space = "[ \\t]";
      const char = "[^ \\t\\n]";
      return string
        .replace(
          new RegExp(
            String.raw`\b([IVXLCDMÐœÐ¡Ð¥]+)\s*${dash}\s*([IVXLCDMÐœÐ¡Ð¥]+)(?=\s+${centuryWord})`,
            "giu",
          ),
          (_, left, right) => `${romanCentury(left)}â€”${romanCentury(right)}`,
        )
        .replace(
          new RegExp(String.raw`\b([IVXLCDMÐœÐ¡Ð¥]+)(?=\s+${centuryWord})`, "giu"),
          (_, value) => romanCentury(value),
        )
        .replace(
          new RegExp(`\\b([IVXLCDM]+)${dash}+([IVXLCDM]+)\\b`, "gi"),
          (_, left, right) => `${left}â€”${right}`,
        )
        .replace(
          new RegExp(`(\\d)${dash}+(\\d)`, "g"),
          (_, left, right) => `${left}â€”${right}`,
        )
        .replace(new RegExp(`(${space})${dash}+(${space})`, "g"), "$1â€”$2")
        .replace(new RegExp(`(${char})${dash}{2,}(${char})`, "g"), "$1â€”$2")
        .replace(new RegExp(`(${char})${dash}+(${space})`, "g"), "$1â€”$2")
        .replace(new RegExp(`(${space})${dash}+(${char})`, "g"), "$1â€”$2");
    };

    const quotes = (string) => {
      const english = (string) =>
        string.replace(/â€œ([^â€œâ€\n]*)â€/g, "Â«$1Â»");
      const straight = (string) => {
        let open = true;
        return string.replace(/"/g, () => {
          const quote = open ? "Â«" : "Â»";
          open = !open;
          return quote;
        });
      };
      const nested = (string) => {
        let snap;
        do {
          snap = string;
          string = string.replace(
            /Â«([^Â«Â»\n]*)Â«([^Â«Â»\n]+)Â»([^Â«Â»\n]*)Â»/g,
            "Â«$1â€ž$2â€œ$3Â»",
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
      .replace(/[\u0020\u0009\u00A0]+([,.!?â€¦:;Â»])/g, "$1")
      .replace(/([Â»â€žâ€œâ€"\)\]])[\u0020\u0009\u00A0]+([,.!?â€¦:;])/g, "$1$2")
      .replace(/([!?â€¦;])(?=[^\u0020\u0009\u00A0\n<!?â€¦;Â»])/g, "$1 ")
      .replace(/(Â»)(?=[^\u0020\u0009\u00A0\n<.,:;Â»!?â€¦])/g, "$1 ")
      .replace(/([.,:])(?=[^\u0020\u0009\u00A0\n<\d.,:;Â»!?â€¦])/g, "$1 ")
      .replace(/(Â«)[\u0020\u0009\u00A0]+/g, "$1");
  },

  punctuation(string) {
    const both = variants([
      "Ð¿Ð¾ ÑÑƒÑ‚Ð¸",
      "ÐºÐ°Ðº Ð¿Ñ€Ð°Ð²Ð¸Ð»Ð¾",
      "ÑÐºÐ¾Ñ€ÐµÐµ Ð²ÑÐµÐ³Ð¾",
      "ÐºÑ€Ð¾Ð¼Ðµ Ñ‚Ð¾Ð³Ð¾",
      "Ð½Ð°Ð²ÐµÑ€Ð½Ð¾Ðµ",
      "Ðº ÑÑ‡Ð°ÑÑ‚ÑŒÑŽ",
      "Ðº ÑÐ¾Ð¶Ð°Ð»ÐµÐ½Ð¸ÑŽ",
      "Ð²Ð¾-Ð¿ÐµÑ€Ð²Ñ‹Ñ…",
      "Ð²Ð¾-Ð²Ñ‚Ð¾Ñ€Ñ‹Ñ…",
      "Ð²-Ñ‚Ñ€ÐµÑ‚ÑŒÐ¸Ñ…",
    ]);

    const start = variants([
      "Ñ‚Ð°ÐºÐ¸Ð¼ Ð¾Ð±Ñ€Ð°Ð·Ð¾Ð¼",
      "Ñ Ð¾Ð´Ð½Ð¾Ð¹ ÑÑ‚Ð¾Ñ€Ð¾Ð½Ñ‹",
      "Ñ‚Ð°Ðº",
      "Ð½Ð° ÑÐ°Ð¼Ð¾Ð¼ Ð´ÐµÐ»Ðµ",
    ]);

    string = string
      .replace(
        new RegExp(`(^|[.!?â€¦]\\s+)(${both})(?=\\s+[^,])`, "g"),
        (_, a, b) => `${a}${b},`,
      )
      .replace(
        new RegExp(`([^\\s(Â«â€”])\\s+(${both})(?=\\s+[^,])`, "g"),
        (_, a, b) => `${a}, ${b},`,
      )
      .replace(
        new RegExp(`(^|[.!?â€¦]\\s+)(${start})(?=\\s+[^,])`, "g"),
        (_, a, b) => `${a}${b},`,
      );

    return string;
  },

  grammar(string) {
    const latinToCyrillic = {
      A: "Ð",
      B: "Ð’",
      C: "Ð¡",
      E: "Ð•",
      H: "Ð",
      K: "Ðš",
      M: "Ðœ",
      O: "Ðž",
      P: "Ð ",
      T: "Ð¢",
      X: "Ð¥",
      Y: "Ð£",
      a: "Ð°",
      c: "Ñ",
      e: "Ðµ",
      o: "Ð¾",
      p: "Ñ€",
      x: "Ñ…",
      y: "Ñƒ",
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
      .replace(/([^\s]) (â€” )/g, (_, left, dash) => `${left}\u00A0${dash}`)
      .replace(
        /(^|\n)(\s*)((?:<(?!\/)[a-z][a-z0-9]*\b[^>]*>\s*){0,2})â€”\s+/gi,
        (_, start, indent, tags) => `${start}${indent}${tags}â€”\u00A0`,
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
        /\b(\d[\d ]*(?:[.,]\d+)?)\s+(Ñ‚Ñ‹ÑÑÑ‡(?:Ð°|Ð¸|Ðµ|Ñƒ|ÐµÐ¹|Ð°Ð¼|Ð°Ð¼Ð¸|Ð°Ñ…)?|Ð¼Ð¸Ð»Ð»Ð¸Ð¾Ð½(?:Ð°|Ñƒ|Ðµ|Ð¾Ð¼|Ñ‹|Ð¾Ð²|Ð°Ð¼|Ð°Ð¼Ð¸|Ð°Ñ…)?|Ð¼Ð¸Ð»Ð»Ð¸Ð°Ñ€Ð´(?:Ð°|Ñƒ|Ðµ|Ð¾Ð¼|Ñ‹|Ð¾Ð²|Ð°Ð¼|Ð°Ð¼Ð¸|Ð°Ñ…)?)\b/gi,
        (_, value, unit) => {
          const lower = unit.toLowerCase();
          if (lower.startsWith("Ñ‚Ñ‹ÑÑÑ‡")) return `${value} Ñ‚Ñ‹Ñ.`;
          if (lower.startsWith("Ð¼Ð¸Ð»Ð»Ð¸Ð¾Ð½")) return `${value} Ð¼Ð»Ð½`;
          return `${value} Ð¼Ð»Ñ€Ð´`;
        },
      );

    const centuries = (string) =>
      string.replace(
        new RegExp(
          String.raw`\b([1-9]|1\d|2\d|30)(?:-?(?:Ð¹|Ð³Ð¾|Ð¼Ñƒ|Ð¼|Ðµ|Ñ…|Ð¼Ð¸))?(?=\s+${centuryWord})`,
          "giu",
        ),
        (_, value) => toRoman(value),
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
      const amount = String.raw`\d[\d ]*(?:[.,]\d+)?(?:\s+(?:Ñ‚Ñ‹Ñ\.|Ð¼Ð»Ð½|Ð¼Ð»Ñ€Ð´))?`;
      const rubles = (value) => {
        if (/(?:Ñ‚Ñ‹Ñ\.|Ð¼Ð»Ð½|Ð¼Ð»Ñ€Ð´)\b/.test(value)) return "Ñ€ÑƒÐ±Ð»ÐµÐ¹";
        if (/[.,]/.test(value)) return "Ñ€ÑƒÐ±Ð»Ñ";
        const number = Number(value.replace(/ /g, ""));
        const mod100 = number % 100;
        if (mod100 >= 11 && mod100 <= 14) return "Ñ€ÑƒÐ±Ð»ÐµÐ¹";
        const mod10 = number % 10;
        if (mod10 === 1) return "Ñ€ÑƒÐ±Ð»ÑŒ";
        if (mod10 >= 2 && mod10 <= 4) return "Ñ€ÑƒÐ±Ð»Ñ";
        return "Ñ€ÑƒÐ±Ð»ÐµÐ¹";
      };

      string = string.replace(
        new RegExp(
          String.raw`\b(${amount})\s+(?:Ñ€\.|Ñ€ÑƒÐ±\.)(?=\s|$|${closingAhead}|[,;:!?â€¦])`,
          "gi",
        ),
        (full, value, offset, source) => {
          const tail = source.slice(offset + full.length);
          const result = `${value} ${rubles(value)}`;
          if (new RegExp(`^${wordAhead}`).test(tail)) return result;
          if (new RegExp(`^(?:$|${closingAhead})`).test(tail)) {
            return `${result}.`;
          }
          return result;
        },
      );

      [
        ["Ð´Ð¾Ð»Ð»Ð°Ñ€(?:Ð°|Ð¾Ð²)?", "$"],
        ["ÐµÐ²Ñ€Ð¾", "â‚¬"],
        ["Ñ„ÑƒÐ½Ñ‚(?:Ð°|Ð¾Ð²)?\\s+ÑÑ‚ÐµÑ€Ð»Ð¸Ð½Ð³Ð¾Ð²", "Â£"],
      ].forEach(([unit, sign]) => {
        text = text.replace(
          new RegExp(String.raw`\b(${amount})\s+${unit}\b`, "gi"),
          (_, value) => `${sign}${value}`,
        );
      });

      return string;
    };

    return pipe(string, centuries, date, time, thousands, amounts, money);
  },

  collocations(string) {
    const expand = (string, pattern, lower, upper) =>
      string.replace(pattern, (_, head, tail = "") => {
        const phrase = head === head.toUpperCase() ? upper : lower;
        return tail ? `${phrase}${tail}` : `${phrase}.`;
      });

    const tail = String.raw`([,!?â€¦:;]|\.(?=\s|$)|(?=\s|$|[Â»")\]])|$)?`;
    const rules = [
      [String.raw`\b(Ð¸)\s+Ñ‚\.\s*Ð´\.${tail}`, "Ð¸ Ñ‚Ð°Ðº Ð´Ð°Ð»ÐµÐµ", "Ð˜ Ñ‚Ð°Ðº Ð´Ð°Ð»ÐµÐµ"],
      [String.raw`\b(Ñ‚)\.\s*Ðµ\.${tail}`, "Ñ‚Ð¾ ÐµÑÑ‚ÑŒ", "Ð¢Ð¾ ÐµÑÑ‚ÑŒ"],
      [String.raw`\b(Ñ‚)\.\s*Ðº\.${tail}`, "Ñ‚Ð°Ðº ÐºÐ°Ðº", "Ð¢Ð°Ðº ÐºÐ°Ðº"],
    ];
    rules.forEach(([pattern, lower, upper]) => {
      string = expand(string, new RegExp(pattern, "gi"), lower, upper);
    });
    return string;
  },

  run(value = "") {
    return pipe(
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
