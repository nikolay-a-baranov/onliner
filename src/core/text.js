const replace = (text, rules) =>
  rules.reduce((result, [from, to]) => result.replace(from, to), text);

const pipe = (value, ...steps) =>
  steps.reduce((result, step) => step(result), value);

const wordAhead = String.raw`\s+[^\s»")\],;:!?…]`;
const closingAhead = String.raw`[»")\]]`;
const centuryWord = String.raw`(?:век(?:а|е|у|ом|ов|ах)?|столет(?:ие|ия|ию|ием|ий|иям|иями|иях)?)`;

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
    .replace(/М/g, "M")
    .replace(/С/g, "C")
    .replace(/Х/g, "X")
    .replace(/м/g, "m")
    .replace(/с/g, "c")
    .replace(/х/g, "x")
    .toUpperCase();

const variants = (list) =>
  list
    .flatMap((item) => [item, item[0].toUpperCase() + item.slice(1)])
    .join("|");

export const spaces = (text) => {
  text = text
    .replace(/\u00A0/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&#160;/gi, "&#32;");
  let snap;
  do {
    snap = text;
    text = text
      .replace(/((?:<[a-z][a-z0-9]*[^\/>]*>)+)([ \t]+)/gi, "$2$1")
      .replace(/([ \t]+)((?:<\/[a-z][a-z0-9]*>)+)/gi, "$2$1");
  } while (text !== snap);
  return text
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
};

export const typography = (text) => {
  const brands = (text) =>
    replace(text, [
      [/\bOnliner\b/g, "Onlíner"],
      [/\bLego\b/g, "LEGO"],
      [/\bIphone\b/g, "iPhone"],
      [/\bYoutube\b/g, "YouTube"],
      [/\bTik[- ]?Tok\b/gi, "TikTok"],
    ]);

  const socials = (text) =>
    text.replace(
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

  const ellipsis = (text) => text.replace(/\.{3}/g, "…");

  const dashes = (text) => {
    const dash = "[-–—]";
    const space = "[ \\t]";
    const char = "[^ \\t\\n]";
    return text
      .replace(
        new RegExp(
          String.raw`\b([IVXLCDMМСХ]+)\s*${dash}\s*([IVXLCDMМСХ]+)(?=\s+${centuryWord})`,
          "giu",
        ),
        (_, left, right) => `${romanCentury(left)}—${romanCentury(right)}`,
      )
      .replace(
        new RegExp(String.raw`\b([IVXLCDMМСХ]+)(?=\s+${centuryWord})`, "giu"),
        (_, value) => romanCentury(value),
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

  const quotes = (text) => {
    const english = (text) => text.replace(/“([^“”\n]*)”/g, "«$1»");
    const straight = (text) => {
      let open = true;
      return text.replace(/"/g, () => {
        const quote = open ? "«" : "»";
        open = !open;
        return quote;
      });
    };
    const nested = (text) => {
      let snap;
      do {
        snap = text;
        text = text.replace(
          /«([^«»\n]*)«([^«»\n]+)»([^«»\n]*)»/g,
          "«$1„$2“$3»",
        );
      } while (text !== snap);
      return text;
    };
    return nested(straight(english(text)));
  };

  return quotes(dashes(ellipsis(socials(brands(text)))));
};

export const spacing = (text) =>
  text
    .replace(/[ \t]+([,.!?…:;»])/g, "$1")
    .replace(/([»„“”"\)\]])[ \t]+([,.!?…:;])/g, "$1$2")
    .replace(/([!?…;»])(?=[^ \t\n<!?…;»])/g, "$1 ")
    .replace(/([.,:])(?=[^ \t\n<\d.,:;»!?…])/g, "$1 ")
    .replace(/(«)[ \t]+/g, "$1");

export const punctuation = (text) => {
  const both = variants([
    "по сути",
    "как правило",
    "скорее всего",
    "наверное",
    "к счастью",
    "к сожалению",
    "во-первых",
    "во-вторых",
    "в-третьих",
  ]);

  const start = variants([
    "таким образом",
    "с одной стороны",
    "так",
    "на самом деле",
  ]);

  text = text
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

  return text;
};

export const grammar = (text) => {
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

  return text.replace(/\b[\p{L}]+\b/gu, (word) => {
    if (!/\p{Script=Cyrillic}/u.test(word) || !/[A-Za-z]/.test(word)) {
      return word;
    }
    return word.replace(/[ABCEHKMOPTXYaceopxy]/g, (letter) => {
      return latinToCyrillic[letter] || letter;
    });
  });
};

const nbsp = (text) =>
  text
    .replace(/([^\s]) (— )/g, (_, left, dash) => `${left}\u00A0${dash}`)
    .replace(
      /(^|\n)(\s*)((?:<(?!\/)[a-z][a-z0-9]*\b[^>]*>\s*){0,2})—\s+/gi,
      (_, start, indent, tags) => `${start}${indent}${tags}—\u00A0`,
    );

const thousands = (text) =>
  text.replace(/\b\d{1,3}(?: \d{3})+\b|\b\d{4,}\b/g, (value) => {
    const digits = value.replace(/ /g, "");
    if (digits.length < 5) return digits;
    return digits.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  });

const amounts = (text) =>
  text.replace(
    /\b(\d[\d ]*(?:[.,]\d+)?)\s+(тысяч(?:а|и|е|у|ей|ам|ами|ах)?|миллион(?:а|у|е|ом|ы|ов|ам|ами|ах)?|миллиард(?:а|у|е|ом|ы|ов|ам|ами|ах)?)\b/gi,
    (_, value, unit) => {
      const lower = unit.toLowerCase();
      if (lower.startsWith("тысяч")) return `${value} тыс.`;
      if (lower.startsWith("миллион")) return `${value} млн`;
      return `${value} млрд`;
    },
  );

const numbers = (text) => {
  const centuries = (text) =>
    text.replace(
      new RegExp(
        String.raw`\b([1-9]|1\d|2\d|30)(?:-?(?:й|го|му|м|е|х|ми))?(?=\s+${centuryWord})`,
        "giu",
      ),
      (_, value) => toRoman(value),
    );

  const date = (text) =>
    text.replace(
      /\b(\d{1,2})\.(\d{1,2})\.(\d{4})\b/g,
      (_, day, month, year) =>
        `${day.padStart(2, "0")}.${month.padStart(2, "0")}.${year}`,
    );

  const time = (text) =>
    text
      .replace(/\b(\d)\.\s*(\d{2})(?!\.\d{2,4}\b)\b/g, "0$1:$2")
      .replace(/\b(\d{2})\.\s*(\d{2})(?!\.\d{2,4}\b)\b/g, "$1:$2")
      .replace(/\b(\d):\s*(\d{2})\b/g, "0$1:$2")
      .replace(/\b(\d{2}):\s*(\d{2})\b/g, "$1:$2");

  const money = (text) => {
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

    text = text.replace(
      new RegExp(
        String.raw`\b(${amount})\s+(?:р\.|руб\.)(?=\s|$|${closingAhead}|[,;:!?…])`,
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
      ["доллар(?:а|ов)?", "$"],
      ["евро", "€"],
      ["фунт(?:а|ов)?\\s+стерлингов", "£"],
    ].forEach(([unit, sign]) => {
      text = text.replace(
        new RegExp(String.raw`\b(${amount})\s+${unit}\b`, "gi"),
        (_, value) => `${sign}${value}`,
      );
    });

    return text;
  };

  return pipe(text, centuries, date, time, thousands, amounts, money);
};

const collocations = (text) => {
  const expand = (text, pattern, lower, upper) =>
    text.replace(pattern, (_, head, tail = "") => {
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
    text = expand(text, new RegExp(pattern, "gi"), lower, upper);
  });
  return text;
};

export const text = (value = "") => {
  return pipe(
    value,
    spaces,
    typography,
    spacing,
    punctuation,
    grammar,
    collocations,
    numbers,
    nbsp,
  );
};
