export const text = {
  helper: {
    pipe(value, ...steps) {
      return steps.reduce((result, step) => step(result), value);
    },
    replace(string, rules) {
      return rules.reduce(
        (result, [from, to]) => result.replace(from, to),
        string,
      );
    },
    variants(list) {
      return list
        .flatMap((item) => [item, item[0].toUpperCase() + item.slice(1)])
        .join("|");
    },
    caseify: {
      first(source, target) {
        return source[0] === source[0].toUpperCase()
          ? target[0].toUpperCase() + target.slice(1)
          : target;
      },
      all(source, lower, upper) {
        return source === source.toUpperCase() ? upper : lower;
      },
    },
    glue(match) {
      return match.replace(/\s+/g, "\u00A0");
    },
    decodeAngles(string) {
      return string.replace(/&lt;([^<>]{1,120})&gt;/gi, (full, inner) => {
        if (/^\s*\/?\s*[a-z][a-z0-9-]*\b/i.test(inner)) return full;
        return `<${inner}>`;
      });
    },
  },

  token: {
    whitespace: {
      horizontal: String.raw`[\u0009\u0020]`,
      vertical: String.raw`[\u000A\u000B\u000C\u000D]`,
      get all() {
        const horizontal = text.token.whitespace.horizontal.slice(1, -1);
        const vertical = text.token.whitespace.vertical.slice(1, -1);
        return `[${horizontal}${vertical}]`;
      },
    },
    typography: {
      dash: String.raw`[\u002D\u2013\u2014]`,
      dot: String.raw`[\u00B7\u2022\u2219\u22C5]`,
      char: String.raw`[^\u0009\u0020\u000A]`,
    },
    number: {
      roman: String.raw`[IVXLCDM]+`,
    },
    tag: {
      open: String.raw`(?:<[a-z][a-z0-9]*[^\/>]*>)+`,
      close: String.raw`(?:<\/[a-z][a-z0-9]*>)+`,
    },
    ahead: {
      word: String.raw`\s+[^\s\u00BB")\],;:!?\u2026]`,
      closing: String.raw`[\u00BB")\]]`,
      tag: String.raw`<[^>]+>`,
    },
    map: {
      cyr_lat: {
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
      },
    },
  },

  whitespace(string) {
    const space = text.token.whitespace.horizontal;
    const whitespace = text.token.whitespace.all;
    const open = text.token.tag.open;
    const close = text.token.tag.close;
    string = string
      .replace(/&amp;/gi, "&")
      .replace(/&quot;/gi, '"')
      .replace(/&#39;|&apos;/gi, "'")
      .replace(/&nbsp;/gi, "\u0020")
      .replace(/&#160;/gi, "&#32;")
      .replace(/&#32;/gi, "\u0020");
    string = text.helper.decodeAngles(string);
    string = string
      .replace(/&#160;/gi, "&#32;")
      .replace(/\u00A0/g, "\u0020")
      .replace(/\u000D\u000A/g, "\u000A")
      .replace(/\u000D/g, "\u000A")
      .replace(new RegExp(`${space}+\\u000A`, "g"), "\u000A")
      .replace(new RegExp(`\\u000A${space}+`, "g"), "\u000A")
      .replace(new RegExp(`${space}{2,}`, "g"), "\u0020")
      .trim();
    let snap;
    do {
      snap = string;
      string = string
        .replace(new RegExp(`(${open})(${whitespace}+)`, "gi"), "$2$1")
        .replace(new RegExp(`(${whitespace}+)(${close})`, "gi"), "$2$1");
    } while (string !== snap);
    string = string
      .replace(new RegExp(`${space}+\\u000A`, "g"), "\u000A")
      .replace(new RegExp(`\\u000A${space}+`, "g"), "\u000A")
      .replace(new RegExp(`${space}{2,}`, "g"), "\u0020")
      .replace(/[\u0020\u0009\u00A0]+([,.!?…:;»])/g, "$1")
      .replace(/([»„“”"\)\]])[\u0020\u0009\u00A0]+([,.!?…:;])/g, "$1$2")
      .replace(/([!?…;])(?=[^\u0020\u0009\u00A0\n<!?…;»])/g, "$1\u0020")
      .replace(/(»)(?=[^\u0020\u0009\u00A0\n<.,:;»!?…])/g, "$1\u0020")
      .replace(/([,:])(?=[^\u0020\u0009\u00A0\n<\d.,:;»!?…_])/g, "$1\u0020")
      .replace(
        /(^|[^A-Za-z0-9])\.(?=[^\u0020\u0009\u00A0\n<\d.,:;»!?…_])/g,
        "$1.\u0020",
      )
      .replace(/(«)[\u0020\u0009\u00A0]+/g, "$1");
    return string.trim();
  },

  typography(string) {
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
      return text.helper.pipe(string, english, straight, nested);
    };

    const space = text.token.whitespace.horizontal;
    const dash = text.token.typography.dash;
    const char = text.token.typography.char;
    const roman = text.token.number.roman;
    const rules = [
      [`(${space})${dash}+(${space})`, "g"],
      [`(${char})${dash}{2,}(${char})`, "g"],
      [`(${char})${dash}+(${space})`, "g"],
      [`(${space})${dash}+(${char})`, "g"],
      [`(\\d)${dash}+(\\d)`, "g"],
      [`\\b(${roman})${dash}+(${roman})\\b`, "g"],
    ];
    const dashes = (string) => {
      return rules.reduce((result, [pattern, flags]) => {
        return result.replace(new RegExp(pattern, flags), "$1—$2");
      }, string);
    };

    const dots = (string) => {
      const variants = ["А·ч", "Н·м", "Па·с", "кг·м/с"];
      return variants.reduce((result, variant) => {
        const [left, right] = variant.split("·");
        return result.replace(
          new RegExp(
            String.raw`\b(${left})\s*${text.token.typography.dot}+\s*(${right})\b`,
            "g",
          ),
          "$1·$2",
        );
      }, string);
    };

    const ellipsis = (string) => string.replace(/\u002E{3}/g, "\u2026");

    const cyrillic = (string) => {
      const cyr_lat = text.token.map.cyr_lat;
      return string.replace(/\b[\p{L}]+\b/gu, (word) => {
        if (!/\p{Script=Cyrillic}/u.test(word) || !/[A-Za-z]/.test(word)) {
          return word;
        }
        return word.replace(/[ABCEHKMOPTXYaceopxy]/g, (letter) => {
          return cyr_lat[letter] || letter;
        });
      });
    };

    const brands = (string) =>
      string
        .replace(/\bOnliner\b/g, "Onlíner")
        .replace(/\bLego\b/g, "LEGO")
        .replace(/\bIphone\b/g, "iPhone")
        .replace(/\bYoutube\b/g, "YouTube")
        .replace(/\bTik[- ]?Tok\b/gi, "TikTok");

    const socials = (string) =>
      string.replace(
        /\b(telegram|instagram|tiktok)(-)(?=[а-яё])/gi,
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

    return text.helper.pipe(
      string,
      quotes,
      dashes,
      dots,
      ellipsis,
      cyrillic,
      brands,
      socials,
    );
  },

  punctuation(string) {
    const both = text.helper.variants([
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
    const start = text.helper.variants([
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
    string = string
      .replace(
        /([!?…])([»"“”]),(?=(?:<\/[a-z][a-z0-9]*>\s*)*\s*[—–-])/gi,
        "$1$2",
      )
      .replace(/([(!?…])\s+(\))/g, "$1$2");
    return string;
  },

  grammar(string) {
    return string;
  },

  spelling(string) {
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
        (match, ending) => text.helper.caseify.first(match, to) + ending,
      );
    }, string);
  },

  collocations(string) {
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
          const phrase = text.helper.caseify.all(head, lower, upper);
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
        const digits = value.replace(/\u0020/g, "");
        if (digits.length < 5) return digits;
        return digits.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
      });

    const years = (string) =>
      string.replace(
        /(^|[^\d])(\d{4})-(?:й|го|му|м|е|х|ми)\s+(год(?:а|у|ом|е)?|гг?\.)(?=$|[^\p{L}\d_])/giu,
        "$1$2\u00A0$3",
      );

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
        const number = Number(value.replace(/\u0020/g, ""));
        const mod100 = number % 100;
        if (mod100 >= 11 && mod100 <= 14) return "рублей";
        const mod10 = number % 10;
        if (mod10 === 1) return "рубль";
        if (mod10 >= 2 && mod10 <= 4) return "рубля";
        return "рублей";
      };
      string = string.replace(
        new RegExp(
          String.raw`\b(${amount})\s+(?:р\.|руб\.)(?=\s|$|${text.token.ahead.closing}|[,;:!?…])`,
          "gi",
        ),
        (full, value, offset, source) => {
          const tail = source.slice(offset + full.length);
          const result = `${value} ${rubles(value)}`;
          if (new RegExp(`^${text.token.ahead.word}`).test(tail)) return result;
          if (new RegExp(`^(?:$|${text.token.ahead.closing})`).test(tail)) {
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
    return text.helper.pipe(
      string,
      date,
      time,
      thousands,
      years,
      amounts,
      money,
    );
  },

  nbsp(string) {
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
      (result, pattern) =>
        result.replace(new RegExp(pattern, "gi"), text.helper.glue),
      string,
    );
    return string
      .replace(/([^\s])(\u0020)(\u2014\u0020)/g, (_, left, space, dash) => {
        return `${left}\u00A0${dash}`;
      })
      .replace(
        new RegExp(
          String.raw`(^|\n)(\s*)((?:<(?!\/)[a-z][a-z0-9]*\b[^>]*>\s*){0,2})\u2014\s+`,
          "gi",
        ),
        (_, start, indent, tags) => `${start}${indent}${tags}\u2014\u00A0`,
      );
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

  run(value = "") {
    return text.helper.pipe(
      value,
      text.whitespace,
      text.typography,
      text.punctuation,
      text.grammar,
      text.spelling,
      text.collocations,
      text.numbers,
      text.nbsp,
    );
  },
};
