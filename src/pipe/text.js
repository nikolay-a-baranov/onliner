export const text = {
  helper: {
    pipe(value, ...steps) {
      return steps.reduce((result, step) => step(result), value);
    },
    match: {
      boundary(value) {
        return String.raw`(^|[^\p{L}\d_])${value}(?=$|[^\p{L}\d_])`;
      },
      space() {
        return String.raw`[\u0020\u00A0]+`;
      },
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
    morphology: {
      declension: {
        masculine: {
          hard: ["", "а", "ов", "у", "ом", "е", "ы", "ам", "ами", "ах"],
          soft: ["ь", "я", "ей", "ю", "ем", "е", "и", "ям", "ями", "ях"],
        },
        feminine: {
          hard: ["", "а", "ы", "е", "у", "ой", "ою", "ам", "ами", "ах"],
          soft: ["я", "и", "е", "ю", "ей", "ею", "ям", "ями", "ях"],
          iya: ["ия", "ии", "ию", "ией", "иею", "иям", "иями", "иях"],
        },
        neuter: {
          hard: ["о", "а", "у", "ом", "е", "ы", "ам", "ами", "ах"],
          iye: ["ие", "ия", "ию", "ием", "ии", "ий", "иям", "иями", "иях"],
        },
      },
      classify(value) {
        if (/ия$/i.test(value)) return { gender: "feminine", group: "iya" };
        if (/ие$/i.test(value)) return { gender: "neuter", group: "iye" };
        if (/я$/i.test(value)) return { gender: "feminine", group: "soft" };
        if (/а$/i.test(value)) return { gender: "feminine", group: "hard" };
        if (/[оеё]$/i.test(value)) return { gender: "neuter", group: "hard" };
        if (/[ьй]$/i.test(value)) return { gender: "masculine", group: "soft" };
        return { gender: "masculine", group: "hard" };
      },
      stem(value) {
        if (/(ия|ие)$/i.test(value)) return value.slice(0, -2);
        if (/[аяоеёьй]$/i.test(value)) return value.slice(0, -1);
        return value;
      },
      endings(value) {
        const data = text.helper.morphology.classify(value);
        return text.helper.morphology.declension[data.gender][data.group];
      },
      suffix(value) {
        return `(?:${text.helper.morphology.endings(value).join("|")})`;
      },
      build(value) {
        if (typeof value !== "string") return value.forms.join("|");
        const stem = text.helper.morphology.stem(value);
        const endings = text.helper.morphology.endings(value);
        return `${stem}(?:${endings.join("|")})`;
      },
      list(values) {
        return values.map(text.helper.morphology.build).join("|");
      },
      fixed(values) {
        return values.join("|");
      },
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
    const entities = (string) => {
      return string
        .replace(/&amp;/gi, "\u0026")
        .replace(/&quot;/gi, "\u0022")
        .replace(/&#39;|&apos;/gi, "\u0027")
        .replace(/&nbsp;/gi, "\u0020")
        .replace(/&#160;/gi, "&#32;")
        .replace(/&#32;/gi, "\u0020");
    };
    const spaces = (string) => {
      return string
        .replace(/&#160;/gi, "&#32;")
        .replace(/\u00A0/g, "\u0020")
        .replace(/\u000D\u000A/g, "\u000A")
        .replace(/\u000D/g, "\u000A")
        .replace(new RegExp(`${space}+\\u000A`, "g"), "\u000A")
        .replace(new RegExp(`\\u000A${space}+`, "g"), "\u000A")
        .replace(new RegExp(`${space}{2,}`, "g"), "\u0020")
        .trim();
    };
    const tags = (string) => {
      let snap;
      do {
        snap = string;
        string = string
          .replace(new RegExp(`(${open})(${whitespace}+)`, "gi"), "$2$1")
          .replace(new RegExp(`(${whitespace}+)(${close})`, "gi"), "$2$1");
      } while (string !== snap);
      return string;
    };
    const punctuation = (string) => {
      return string
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
    };
    return text.helper.pipe(
      string,
      entities,
      text.helper.decodeAngles,
      spaces,
      tags,
      punctuation,
      (value) => value.trim(),
    );
  },

  typography(string) {
    const quotes = {
      english(string) {
        return string.replace(/“([^“”\n]*)”/g, "«$1»");
      },
      straight(string) {
        let open = true;
        return string.replace(/"/g, () => {
          const quote = open ? "«" : "»";
          open = !open;
          return quote;
        });
      },
      nested(string) {
        let snap;
        do {
          snap = string;
          string = string.replace(
            /«([^«»\n]*)«([^«»\n]+)»([^«»\n]*)»/g,
            "«$1„$2“$3»",
          );
        } while (string !== snap);
        return string;
      },
      run(string) {
        return text.helper.pipe(
          string,
          quotes.english,
          quotes.straight,
          quotes.nested,
        );
      },
    };
    const dash = {
      rules: [
        [
          `(${text.token.whitespace.horizontal})${text.token.typography.dash}+(${text.token.whitespace.horizontal})`,
          "$1—$2",
        ],
        [
          `(${text.token.typography.char})${text.token.typography.dash}{2,}(${text.token.typography.char})`,
          "$1—$2",
        ],
        [
          `(${text.token.typography.char})${text.token.typography.dash}+(${text.token.whitespace.horizontal})`,
          "$1—$2",
        ],
        [
          `(${text.token.whitespace.horizontal})${text.token.typography.dash}+(${text.token.typography.char})`,
          "$1—$2",
        ],
        [`(\\d)${text.token.typography.dash}+(\\d)`, "$1—$2"],
        [
          `\\b(${text.token.number.roman})${text.token.typography.dash}+(${text.token.number.roman})\\b`,
          "$1—$2",
        ],
      ],
      run(string) {
        return dash.rules.reduce((result, [pattern, replacement]) => {
          return result.replace(new RegExp(pattern, "g"), replacement);
        }, string);
      },
    };
    const dot = {
      values: ["А·ч", "Вт·ч", "кВт·ч", "Н·м", "Па·с", "кг·м/с"],
      replace(string, value) {
        const [left, right] = value.split("·");
        return string.replace(
          new RegExp(
            text.helper.match.boundary(
              String.raw`(${left})\s*${text.token.typography.dot}+\s*(${right})`,
            ),
            "giu",
          ),
          "$1$2·$3",
        );
      },
      run(string) {
        return dot.values.reduce((result, value) => {
          return dot.replace(result, value);
        }, string);
      },
    };
    const ellipsis = {
      run(string) {
        return string.replace(/\u002E{3}/g, "\u2026");
      },
    };
    const cyrillic = {
      run(string) {
        const map = text.token.map.cyr_lat;
        return string.replace(/[\p{L}]+/gu, (word) => {
          if (!/\p{Script=Cyrillic}/u.test(word) || !/[A-Za-z]/.test(word)) {
            return word;
          }
          return word.replace(/[ABCEHKMOPTXYaceopxy]/g, (letter) => {
            return map[letter] || letter;
          });
        });
      },
    };
    const brand = {
      rules: [
        [/\bOnliner\b/g, "Onlíner"],
        [/\bLego\b/g, "LEGO"],
        [/\bIphone\b/g, "iPhone"],
        [/\bYoutube\b/g, "YouTube"],
        [/\bTik[- ]?Tok\b/gi, "TikTok"],
      ],
      run(string) {
        return brand.rules.reduce((result, [pattern, replacement]) => {
          return result.replace(pattern, replacement);
        }, string);
      },
    };
    const social = {
      words: {
        telegram: "телеграм",
        instagram: "инстаграм",
        tiktok: "тикток",
      },
      brands: {
        телеграм: "Telegram",
        инстаграм: "Instagram",
        тикток: "TikTok",
      },
      localize(string) {
        return string.replace(
          /\b(telegram|instagram|tiktok)(-)(?=[а-яё])/gi,
          (_, name, dash) => {
            const value = social.words[name.toLowerCase()];
            return `${text.helper.caseify.first(name, value)}${dash}`;
          },
        );
      },
      brand(string) {
        return string.replace(
          /(^|[^\p{L}\d_])(телеграм|инстаграм|тикток)(?=$|[^\p{L}\d_-])/giu,
          (_, left, name) => {
            return `${left}${social.brands[name.toLowerCase()]}`;
          },
        );
      },
      run(string) {
        return text.helper.pipe(string, social.localize, social.brand);
      },
    };
    return text.helper.pipe(
      string,
      quotes.run,
      dash.run,
      dot.run,
      ellipsis.run,
      cyrillic.run,
      brand.run,
      social.run,
    );
  },

  punctuation(string) {
    const helper = {
      pipe(value, steps) {
        return steps.reduce((result, step) => step(result), value);
      },
    };
    const phrase = {
      both: text.helper.variants([
        "во-первых",
        "во-вторых",
        "в-третьих",
        "вероятно",
        "видимо",
        "впрочем",
        "главное",
        "как правило",
        "к сожалению",
        "к счастью",
        "конечно",
        "наверное",
        "пожалуй",
        "по сути",
        "собственно",
        "скорее всего",
      ]),
      start: text.helper.variants([
        "более того",
        "в частности",
        "вообще",
        "итак",
        "кроме того",
        "между тем",
        "на самом деле",
        "с одной стороны",
        "таким образом",
      ]),
    };
    const pattern = {
      sentence(value) {
        return new RegExp(`(^|[.!?…]\\s+)(${value})(?=\\s+[^,])`, "g");
      },
      inline(value) {
        return new RegExp(`([^\\s(«—])\\s+(${value})(?=\\s+[^,])`, "g");
      },
    };
    const intro = {
      both(string) {
        const sentence = (string) => {
          return string.replace(
            pattern.sentence(phrase.both),
            (_, left, word) => {
              return `${left}${word},`;
            },
          );
        };
        const inline = (string) => {
          return string.replace(
            pattern.inline(phrase.both),
            (_, left, word) => {
              return `${left}, ${word},`;
            },
          );
        };
        return helper.pipe(string, [sentence, inline]);
      },
      start(string) {
        return string.replace(
          pattern.sentence(phrase.start),
          (_, left, word) => {
            return `${left}${word},`;
          },
        );
      },
      run(string) {
        return helper.pipe(string, [intro.both, intro.start]);
      },
    };
    const cleanup = {
      quote(string) {
        return string.replace(
          /([!?…])([»"“”]),(?=(?:<\/[a-z][a-z0-9]*>\s*)*\s*[—–-])/gi,
          "$1$2",
        );
      },
      parenthesis(string) {
        return string.replace(/([(!?…])\s+(\))/g, "$1$2");
      },
      run(string) {
        return helper.pipe(string, [cleanup.quote, cleanup.parenthesis]);
      },
    };
    return helper.pipe(string, [intro.run, cleanup.run]);
  },

  grammar(string) {
    return string;
  },

  spelling(string) {
    const morphology = text.helper.morphology;
    const endings = {
      stem: String.raw`[а-яё]*`,
      noun: morphology.suffix("метр"),
      adjective: String.raw`(?:ый|ая|ое|ые|ого|ому|ым|ом|ой|ую|ых|ыми|ою|ее|ий|яя|ие|его|ему|им|их|ими)`,
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
    const pattern = {
      word(mode, from) {
        const ending = endings[mode] || endings.stem;
        return new RegExp(
          String.raw`(^|[^\p{L}\d_])${from}(${ending})(?=$|[^\p{L}\d_])`,
          "giu",
        );
      },
    };
    const replace = (string, rule) => {
      const [mode, from, to] = rule;
      return string.replace(pattern.word(mode, from), (match, left, ending) => {
        const source = match.slice(left.length);
        return `${left}${text.helper.caseify.first(source, to)}${ending}`;
      });
    };
    const words = (string) => {
      return rules.reduce((result, rule) => replace(result, rule), string);
    };
    return text.helper.pipe(string, words);
  },

  collocations(string) {
    const tail = String.raw`([,!?…:;]|\.(?=\s|$)|(?=\s|$|[»")\]])|$)?`;
    const rules = {
      expand: [
        [String.raw`и\s+т\.\s*д\.`, "и так далее", "И так далее"],
        [String.raw`и\s+т\.\s*п\.`, "и тому подобное", "И тому подобное"],
        [String.raw`т\.\s*е\.`, "то есть", "То есть"],
        [String.raw`т\.\s*к\.`, "так как", "Так как"],
        [String.raw`т\.\s*н\.`, "так называемый", "Так называемый"],
      ],
      simplify: [
        [String.raw`(име(?:ет|ют|л|ла|ло|ли))\s+место\s+быть`, "$1 место"],
        [String.raw`в\s+конечном\s+итоге`, "в итоге"],
        [String.raw`на\s+сегодняшний\s+день`, "сегодня"],
      ],
    };
    const expand = (string) => {
      return rules.expand.reduce((result, [from, lower, upper]) => {
        return result.replace(
          new RegExp(
            text.helper.match.boundary(String.raw`(${from})${tail}`),
            "giu",
          ),
          (_, left, head, mark = "") => {
            const value = text.helper.caseify.all(head, lower, upper);
            return `${left}${mark ? `${value}${mark}` : `${value}.`}`;
          },
        );
      }, string);
    };
    const simplify = (string) => {
      return rules.simplify.reduce((result, [from, to]) => {
        return result.replace(
          new RegExp(text.helper.match.boundary(from), "giu"),
          (_, left) => `${left}${to}`,
        );
      }, string);
    };
    return text.helper.pipe(string, expand, simplify);
  },

  numbers(string) {
    const date = {
      run(string) {
        return string.replace(
          /\b(\d{1,2})\.(\d{1,2})\.(\d{4})\b/g,
          (_, day, month, year) => {
            return `${day.padStart(2, "0")}.${month.padStart(2, "0")}.${year}`;
          },
        );
      },
    };
    const time = {
      run(string) {
        return string
          .replace(/\b(\d)\.\s*(\d{2})(?!\.\d{2,4}\b)\b/g, "0$1:$2")
          .replace(/\b(\d{2})\.\s*(\d{2})(?!\.\d{2,4}\b)\b/g, "$1:$2")
          .replace(/\b(\d):\s*(\d{2})\b/g, "0$1:$2")
          .replace(/\b(\d{2}):\s*(\d{2})\b/g, "$1:$2");
      },
    };
    const thousands = {
      run(string) {
        return string.replace(/\b\d{1,3}(?: \d{3})+\b|\b\d{4,}\b/g, (value) => {
          const digits = value.replace(/\u0020/g, "");
          if (digits.length < 5) return digits;
          return digits.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
        });
      },
    };
    const taxpayer = {
      run(string) {
        return string.replace(
          /(^|[^\p{L}\d_])(УНП)[ \u00A0]+(\d{3}) (\d{3}) (\d{3})(?=$|[^\p{L}\d_])/giu,
          "$1$2 $3$4$5",
        );
      },
    };
    const years = {
      word: text.helper.morphology.list(["год"]),
      run(string) {
        return string.replace(
          new RegExp(
            String.raw`(^|[^\d])(\d{4})-(?:й|го|му|м|е|х|ми)\s+(${years.word}|гг?\.)`,
            "giu",
          ),
          "$1$2\u00A0$3",
        );
      },
    };
    return text.helper.pipe(
      string,
      date.run,
      time.run,
      thousands.run,
      taxpayer.run,
      years.run,
      text.centuries.run,
    );
  },

  centuries: {
    word: String.raw`(?:век(?:а|е|у|ом|ов|ах)?|столет(?:ие|ия|ию|ием|ий|иям|иями|иях)?|в\.|ст\.)`,
    suffix: String.raw`(?:й|го|му|м|е|х|ми)`,
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
    replace(value) {
      return value.replace(
        new RegExp(
          String.raw`\b([1-9]|1\d|2\d|30)(?:-?${text.centuries.suffix})?(?:\s*[—–-]\s*([1-9]|1\d|2\d|30)(?:-?${text.centuries.suffix})?)?(?=\s+${text.centuries.word})`,
          "giu",
        ),
        (_, first, second) => {
          if (!second) return text.centuries.roman(first);
          return `${text.centuries.roman(first)}—${text.centuries.roman(second)}`;
        },
      );
    },
    run(string) {
      return text.centuries.replace(string);
    },
  },

  units(string) {
    const morphology = text.helper.morphology;
    const amounts = {
      rules: [
        ["тысяча", "тыс."],
        ["миллион", "млн"],
        ["миллиард", "млрд"],
        ["триллион", "трлн"],
      ],
      pattern() {
        const units = amounts.rules
          .map(([value]) => morphology.build(value))
          .join("|");
        return new RegExp(
          text.helper.match.boundary(
            String.raw`(\d[\d ]*(?:[.,]\d+)?)${text.helper.match.space()}(${units})`,
          ),
          "giu",
        );
      },
      replace(value, unit) {
        const rule = amounts.rules.find(([source]) => {
          return new RegExp(`^${morphology.stem(source)}`, "i").test(unit);
        });
        if (!rule) return `${value} ${unit}`;
        return `${value} ${rule[1]}`;
      },
      run(string) {
        return string.replace(amounts.pattern(), (_, left, value, unit) => {
          return `${left}${amounts.replace(value, unit)}`;
        });
      },
    };
    return text.helper.pipe(string, amounts.run);
  },

  money(string) {
    const amount = String.raw`\d[\d ]*(?:[.,]\d+)?(?:\s+(?:тыс\.|млн|млрд|трлн))?`;
    const rubles = {
      word(value) {
        if (/(?:тыс\.|млн|млрд|трлн)\b/.test(value)) return "рублей";
        if (/[.,]/.test(value)) return "рубля";
        const number = Number(value.replace(/[\u0020\u00A0]/g, ""));
        const mod100 = number % 100;
        if (mod100 >= 11 && mod100 <= 14) return "рублей";
        const mod10 = number % 10;
        if (mod10 === 1) return "рубль";
        if (mod10 >= 2 && mod10 <= 4) return "рубля";
        return "рублей";
      },
      run(string) {
        return string.replace(
          new RegExp(
            String.raw`\b(${amount})\s+(?:р(?:\.|уб\.?)?)(?=\s|$|${text.token.ahead.closing}|[,;:!?…])`,
            "gi",
          ),
          (full, value, offset, source) => {
            const tail = source.slice(offset + full.length);
            const result = `${value} ${rubles.word(value)}`;
            if (new RegExp(`^${text.token.ahead.word}`).test(tail))
              return result;
            if (new RegExp(`^(?:$|${text.token.ahead.closing})`).test(tail)) {
              return `${result}.`;
            }
            return result;
          },
        );
      },
    };
    const currency = {
      rules: [
        [text.helper.morphology.build("доллар"), "$"],
        ["евро", "€"],
        [`${text.helper.morphology.build("фунт")}\\s+стерлингов`, "£"],
      ],
      run(string) {
        return currency.rules.reduce((result, [unit, sign]) => {
          return result.replace(
            new RegExp(
              text.helper.match.boundary(
                String.raw`(${amount})${text.helper.match.space()}${unit}`,
              ),
              "giu",
            ),
            (_, left, value) => `${left}${sign}${value}`,
          );
        }, string);
      },
    };
    return text.helper.pipe(string, rubles.run, currency.run);
  },

  nbsp(string) {
    const morphology = text.helper.morphology;
    const rules = {
      number: [
        morphology.list([
          "год",
          "лет",
          "г.",
          "век",
          "в.",
          "вв.",
          "столетие",
          "ст.",
          "стст.",
          "тысячелетие",
          "полугодие",
          "квартал",
          "месяц",
          "сутки",
          {
            forms: [
              "день",
              "дня",
              "дней",
              "дню",
              "днем",
              "дне",
              "дни",
              "дням",
              "днями",
              "днях",
            ],
          },
          "час",
          "ч",
          "минута",
          "мин",
          "секунда",
          "с",
          "рубль",
          "р\\.",
          "руб\\.",
          "евро",
          "доллар",
          "штука",
          "шт.",
          "единица",
          "ед.",
          "десяток",
          "дес.",
          "тысяча",
          "тыс.",
          "миллион",
          "млн",
          "миллиард",
          "млрд",
          "триллион",
          "трлн",
          "метр",
          "м",
          "километр",
          "км",
          "сантиметр",
          "см",
          "миллиметр",
          "мм",
          "грамм",
          "г",
          "килограмм",
          "кг",
          "центнер",
          "тонна",
          "т",
          "процент",
          "раздел",
          "глава",
          "гл.",
          "пункт",
          "п.",
          "подпункт",
          "пп.",
          "абзац",
          "абз.",
          "приложение",
          "прил.",
          "раз",
          "человек",
          "пользователь",
          "байт",
          "килобайт",
          "КБ",
          "мегабайт",
          "МБ",
          "гигабайт",
          "ГБ",
          "терабайт",
          "ТБ",
          "пиксель",
          "мегапиксель",
          "МП",
          "%",
          "\\$",
          "руб\\.",
          "р\\.",
          "страница",
          "стр\\.",
          "экземпляр",
          "экз'\\.",
          "фриспин",
        ]),
        morphology.fixed([
          "января",
          "февраля",
          "марта",
          "апреля",
          "мая",
          "июня",
          "июля",
          "августа",
          "сентября",
          "октября",
          "ноября",
          "декабря",
        ]),
      ],
      phrase: [
        String.raw`л.\s+с.\s`,
        String.raw`в\s+том\s+числе`,
        String.raw`по\s+крайней\s+мере`,
      ],
    };
    const pattern = {
      number(value) {
        return text.helper.match.boundary(
          String.raw`(\d[\d ]*(?:[.,]\d+)?${text.helper.match.space()}(?:${value}))`,
        );
      },
      phrase(value) {
        return text.helper.match.boundary(String.raw`((?:${value}))`);
      },
    };
    const replace = (string, value) => {
      return string.replace(new RegExp(value, "giu"), (_, left, match) => {
        return `${left}${text.helper.glue(match)}`;
      });
    };
    const apply = (string, values, build) => {
      return values
        .map(build)
        .reduce((result, value) => replace(result, value), string);
    };
    const numbers = (string) => apply(string, rules.number, pattern.number);
    const phrases = (string) => apply(string, rules.phrase, pattern.phrase);
    const dashes = (string) => {
      return string
        .replace(/([^\s])(\u0020)(\u2014\u0020)/g, "$1\u00A0$3")
        .replace(
          new RegExp(
            String.raw`(^|\n)(\s*)((?:<(?!\/)[a-z][a-z0-9]*\b[^>]*>\s*){0,2})\u2014\s+`,
            "gi",
          ),
          "$1$2$3\u2014\u00A0",
        );
    };
    return text.helper.pipe(string, numbers, phrases, dashes);
  },

  run(string) {
    return text.helper.pipe(
      string,
      text.whitespace,
      text.typography,
      text.punctuation,
      text.grammar,
      text.spelling,
      text.collocations,
      text.numbers,
      text.units,
      text.money,
      text.nbsp,
    );
  },
};
