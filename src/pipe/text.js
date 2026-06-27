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
        .replace(/(?<!\d)\u00A0/gu, "\u0020")
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
        .replace(/([»„“”"\)\]])[\u0020\u0009\u00A0]+([\)\]])/g, "$1$2")
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

  language: {
    belarusian(string) {
      return /[ІіЎў]/u.test(String(string || ""));
    },
  },

  yo(string) {
    return String(string || "")
      .split(/(\n{2,})/)
      .map((part) => {
        if (/^\n+$/u.test(part)) return part;
        if (text.language.belarusian(part)) return part;
        return part.replace(/Ё/g, "Е").replace(/ё/g, "е");
      })
      .join("");
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
              return left === "," ? `${left} ${word},` : `${left}, ${word},`;
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
        return string
          .replace(
            /([!?…])([»"“”]),(?=(?:<\/[a-z][a-z0-9]*>\s*)*\s*[—–-])/gi,
            "$1$2",
          )
          .replace(/([!?…])([»"“”])\./g, "$1$2");
      },
      ellipsisLead(string) {
        return string.replace(/(^|\n)(…)[\u0020\u0009\u00A0]+/g, "$1$2");
      },
      parenthesis(string) {
        return string.replace(/([(!?…»"“”])\s+(\))/g, "$1$2");
      },
      run(string) {
        return helper.pipe(string, [
          cleanup.quote,
          cleanup.ellipsisLead,
          cleanup.parenthesis,
        ]);
      },
    };
    return helper.pipe(string, [intro.run, cleanup.run]);
  },
  finalize(string) {
    const skip = (block) => {
      const value = block.trim();
      return (
        !value ||
        /^</.test(value) ||
        /^\[/.test(value) ||
        /(?:[.!?…:;»")\]]|<\/[a-z][a-z0-9]*>)$/i.test(value)
      );
    };
    const punctuate = (block) => {
      if (skip(block)) return block;
      return block.replace(/([А-Яа-яЁё])(\s*)$/u, "$1.$2");
    };
    return string
      .split(/\n{2,}/)
      .map(punctuate)
      .join("\n\n");
  },

  grammar(string) {
    const amount = {
      number: String.raw`\d[\d \u00A0]*(?:[.,]\d+)?`,
      unit: String.raw`(?:кило)?грамма?`,
      plural(value) {
        const number = Number(
          value.replace(/[\u0020\u00A0]/g, "").replace(",", "."),
        );
        if (!Number.isInteger(number)) return true;
        const mod100 = number % 100;
        if (mod100 >= 11 && mod100 <= 14) return true;
        const mod10 = number % 10;
        return mod10 === 0 || mod10 >= 5;
      },
      replace(unit) {
        return /^кило/i.test(unit) ? "килограммов" : "граммов";
      },
      run(string) {
        return string.replace(
          new RegExp(
            String.raw`(^|[^\p{L}\d_])(${amount.number})${text.helper.match.space()}(${amount.unit})(?=$|[^\p{L}\d_])`,
            "giu",
          ),
          (full, left, number, unit) => {
            if (!amount.plural(number)) return full;
            return `${left}${number} ${amount.replace(unit)}`;
          },
        );
      },
    };
    const fraction = {
      number: String.raw`\d[\d \u00A0]*[.,]\d+`,
      rules: [
        [String.raw`рубл(?:ей|я|ь)`, "рубля"],
        [String.raw`грамм(?:ов|а)?`, "грамма"],
        [String.raw`килограмм(?:ов|а)?`, "килограмма"],
        [String.raw`метр(?:ов|а)?`, "метра"],
        [String.raw`километр(?:ов|а)?`, "километра"],
        [String.raw`сантиметр(?:ов|а)?`, "сантиметра"],
        [String.raw`миллиметр(?:ов|а)?`, "миллиметра"],
        [String.raw`литр(?:ов|а)?`, "литра"],
        [String.raw`миллилитр(?:ов|а)?`, "миллилитра"],
        [String.raw`час(?:ов|а)?`, "часа"],
        [String.raw`процент(?:ов|а)?`, "процента"],
      ],
      run(string) {
        return fraction.rules.reduce((result, [from, to]) => {
          return result.replace(
            new RegExp(
              String.raw`(^|[^\p{L}\d_])(${fraction.number})${text.helper.match.space()}(${from})(?=$|[^\p{L}\d_])`,
              "giu",
            ),
            (_, left, number) => `${left}${number} ${to}`,
          );
        }, string);
      },
    };
    return text.helper.pipe(string, amount.run, fraction.run);
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
      string = rules.simplify.reduce((result, [from, to]) => {
        return result.replace(
          new RegExp(text.helper.match.boundary(from), "giu"),
          (_, left) => `${left}${to}`,
        );
      }, string);
      return string.replace(
        /(^|[^\p{L}\d_])(используется\s+в\s+качестве\s+иллюстрации)(?=$|[^\p{L}\d_])/giu,
        (_, left, phrase) =>
          `${left}${text.helper.caseify.first(phrase, "носит иллюстративный характер")}`,
      );
    };
    const legal = {
      number: String.raw`\d+(?:[.-]\d+)*`,
      rules: [
        [String.raw`ч`, "часть", "части"],
        [String.raw`п`, "пункт", "пункта"],
        [String.raw`ст`, "статья", "статьи"],
      ],
      nominative(context) {
        return /(?:^|\()\s*$|,\s*$/u.test(context);
      },
      genitive(context, from) {
        return from === "ст" && /\d\s*$/u.test(context);
      },
      run(string) {
        return legal.rules.reduce((result, [from, nominative, genitive]) => {
          return result.replace(
            new RegExp(
              String.raw`(^|[^\p{L}\d_])${from}\.\s*(${legal.number})(?=$|[^\p{L}\d_])`,
              "giu",
            ),
            (full, left, number, offset, source) => {
              const context = source.slice(0, offset + left.length);
              const word =
                legal.genitive(context, from) || !legal.nominative(context)
                  ? genitive
                  : nominative;
              return `${left}${word}\u00A0${number}`;
            },
          );
        }, string);
      },
    };
    return text.helper.pipe(string, expand, simplify, legal.run);
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
          .replace(
            /\b(\d{1,2})\.\s*(\d{2})(?!\.\d{2,4}\b)\b/g,
            (full, hour, minute) => {
              const hh = Number(hour);
              const mm = Number(minute);
              if (!Number.isInteger(hh) || !Number.isInteger(mm)) return full;
              if (hh < 0 || hh > 23 || mm < 0 || mm > 59) return full;
              return `${String(hh).padStart(2, "0")}:${minute}`;
            },
          )
          .replace(/\b(\d):\s*(\d{2})\b/g, "0$1:$2")
          .replace(/\b(\d{2}):\s*(\d{2})\b/g, "$1:$2");
      },
    };
    const decimal = {
      run(string) {
        return string.replace(
          /(?<!\d\.)\b(\d[\d \u00A0\u202F]*)\.(\d+)\b(?!\.\d)/g,
          "$1,$2",
        );
      },
    };
    const thousands = {
      run(string) {
        return string.replace(
          /\b\d{1,3}(?:[\u0020\u00A0\u202F]\d{3})+\b|\b\d{4,}\b/g,
          (value) => {
            const digits = value.replace(/[\u0020\u00A0\u202F]/g, "");
            if (digits.length < 5) return digits;
            return digits.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
          },
        );
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
    const ratio = {
      run(string) {
        return string
          .replace(
            /(^|[^\p{L}\d_])24[ \u00A0]+на[ \u00A0]+7(?=$|[^\p{L}\d_])/giu,
            "$124/7",
          )
          .replace(
            /(^|[^\p{L}\d_])50[ \u00A0]*\/[ \u00A0]*50(?=$|[^\p{L}\d_])/giu,
            "$150 на 50",
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
      decimal.run,
      thousands.run,
      taxpayer.run,
      ratio.run,
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

  units(string, mode = "full") {
    const morphology = text.helper.morphology;
    const entries = [
      {
        key: "thousand",
        source: {
          forms: [
            "тысяча",
            "тысячи",
            "тысяче",
            "тысячу",
            "тысячей",
            "тысяч",
            "тысячам",
            "тысячами",
            "тысячах",
          ],
        },
        short: "тыс.",
        full: ["тысяча", "тысячи", "тысяч"],
      },
      {
        key: "million",
        source: "миллион",
        short: "млн",
        full: ["миллион", "миллиона", "миллионов"],
      },
      {
        key: "billion",
        source: "миллиард",
        short: "млрд",
        full: ["миллиард", "миллиарда", "миллиардов"],
      },
      {
        key: "trillion",
        source: "триллион",
        short: "трлн",
        full: ["триллион", "триллиона", "триллионов"],
      },
    ];
    const mapped = entries.map((item) => {
      const built = morphology.build(item.source);
      const shortPattern = item.short.replace(/\./g, "\\.");
      return {
        ...item,
        built,
        shortPattern,
        unitPattern: new RegExp(`^(?:${built})$`, "i"),
        aliasPattern: new RegExp(`^(?:${built}|${shortPattern})$`, "i"),
      };
    });
    const amounts = {
      scale: {
        item(unit) {
          return mapped.find((item) => item.aliasPattern.test(unit));
        },
        index(value) {
          if (!Number.isFinite(value)) return 2;
          if (!Number.isInteger(value)) return 1;
          const mod100 = value % 100;
          if (mod100 >= 11 && mod100 <= 14) return 2;
          const mod10 = value % 10;
          if (mod10 === 1) return 0;
          if (mod10 >= 2 && mod10 <= 4) return 1;
          return 2;
        },
        form(unit, number) {
          const item = amounts.scale.item(unit);
          if (!item) return unit;
          const value = Number(
            String(number)
              .replace(/[\u0020\u00A0\u202F]/g, "")
              .replace(",", "."),
          );
          const forms = item.full;
          return forms[amounts.scale.index(value)] || forms[2];
        },
      },
      fullPattern() {
        const units = mapped
          .flatMap((item) => [item.built, item.shortPattern])
          .join("|");
        return new RegExp(
          text.helper.match.boundary(
            String.raw`(\d[\d ]*(?:[.,]\d+)?)${text.helper.match.space()}(${units})`,
          ),
          "giu",
        );
      },
      pattern() {
        const units = mapped.map((item) => item.built).join("|");
        return new RegExp(
          text.helper.match.boundary(
            String.raw`(\d[\d ]*(?:[.,]\d+)?)${text.helper.match.space()}(${units})`,
          ),
          "giu",
        );
      },
      replace(value, unit) {
        const item = mapped.find((item) => item.unitPattern.test(unit));
        if (!item) return `${value} ${unit}`;
        return `${value} ${item.short}`;
      },
      run(string) {
        return string.replace(amounts.pattern(), (_, left, value, unit) => {
          return `${left}${amounts.replace(value, unit)}`;
        });
      },
      full(string) {
        return string.replace(amounts.fullPattern(), (_, left, value, unit) => {
          return `${left}${value} ${amounts.scale.form(unit, value)}`;
        });
      },
      mode(string, mode) {
        if (mode === "short") return amounts.run(string);
        return amounts.full(string);
      },
    };
    return text.helper.pipe(string, (value) => amounts.mode(value, mode));
  },

  money(string) {
    const amount = String.raw`\d[\d ]*(?:[.,]\d+)?(?:\s+(?:тыс\.|млн|млрд|трлн))?`;
    const range = {
      dollar(string) {
        return string.replace(
          /(^|[^\p{L}\d_])(\d[\d ]*(?:[.,]\d+)?)\s*[—–-]\s*\$(\d[\d ]*(?:[.,]\d+)?)(?=$|[^\p{L}\d_])/giu,
          "$1$$$2—$3",
        );
      },
      run(string) {
        return range.dollar(string);
      },
    };
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
        [`${text.helper.morphology.build("доллар")}(?:\\s+США)?`, "$"],
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
            (full, left, value, offset, source) => {
              const before = source.slice(0, offset + left.length);
              if (/(?:^|[^\p{L}\d_])млн\s+рубл(?:ь|я|ей)\s*$/iu.test(before)) return full;
              return `${left}${sign}${value}`;
            },
          );
        }, string);
      },
    };
    const compound = {
      currency: {
        sign: String.raw`[€$£]`,
        word: String.raw`(?:евро|${text.helper.morphology.build("доллар")}(?:\s+США)?|${text.helper.morphology.build("фунт")}\s+стерлингов|${text.helper.morphology.build("рубль")})`,
        value(unit) {
          const normalized = String(unit || "").toLowerCase();
          if (normalized === "€" || normalized === "евро") return "€";
          if (normalized === "$" || normalized.includes("доллар")) return "$";
          if (normalized === "£" || normalized.includes("фунт")) return "£";
          return "рублей";
        },
        format(value, unit) {
          const currency = compound.currency.value(unit);
          if (currency === "рублей") return `${value}\u00A0млн рублей`;
          return `${currency}${value}\u00A0млн`;
        },
      },
      million: {
        unit: String.raw`(?:млн|${text.helper.morphology.build("миллион")})`,
        fraction: String.raw`(?:тыс\.|${text.helper.morphology.build("тысяча")})`,
        format(main, rest) {
          const value = Number(main.replace(/\s/g, "")) +
            Number(rest.replace(/\s/g, "")) / 1000;
          if (!Number.isFinite(value)) return "";
          return String(value).replace(".", ",").replace(/,?0+$/, "");
        },
        normalize(string) {
          return string.replace(
            new RegExp(
              text.helper.match.boundary(
                String.raw`(\d[\d ]*)${text.helper.match.space()}${compound.million.unit}${text.helper.match.space()}(\d{1,3})${text.helper.match.space()}${compound.million.fraction}${text.helper.match.space()}(${compound.currency.word}|${compound.currency.sign})`,
              ),
              "giu",
            ),
            (full, left, main, rest, unit) => {
              const value = compound.million.format(main, rest);
              return value
                ? `${left}${compound.currency.format(value, unit)}`
                : full;
            },
          );
        },
        signed(string) {
          return string.replace(
            new RegExp(
              text.helper.match.boundary(
                String.raw`(\d[\d ]*)${text.helper.match.space()}${compound.million.unit}${text.helper.match.space()}(${compound.currency.sign})(?:${text.helper.match.space()})?(\d{1,3})${text.helper.match.space()}${compound.million.fraction}`,
              ),
              "giu",
            ),
            (full, left, main, unit, rest) => {
              const value = compound.million.format(main, rest);
              return value
                ? `${left}${compound.currency.format(value, unit)}`
                : full;
            },
          );
        },
        run(string) {
          return text.helper.pipe(
            string,
            compound.million.normalize,
            compound.million.signed,
          );
        },
      },
      run(string) {
        return compound.million.run(string);
      },
    };
    return text.helper.pipe(
      string,
      range.run,
      rubles.run,
      compound.run,
      currency.run,
    );
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
          "суток",
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
          {
            forms: [
              "копейка",
              "копейки",
              "копеек",
              "копейке",
              "копейку",
              "копейкой",
              "копейкою",
              "копейкам",
              "копейками",
              "копейках",
            ],
          },
          "коп\\.",
          "евро",
          "доллар",
          "цент",
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
          "миллилитр",
          "мл",
          "литр",
          "л",
          "градус",
          "промилле",
          "процент",
          "раздел",
          "глава",
          "гл.",
          "статья",
          "ст.",
          "пункт",
          "п.",
          "подпункт",
          "пп.",
          "абзац",
          "абз.",
          "приложение",
          "прил.",
          "прил.",
          "раз",
          "человек",
          "пользователь",
          "юзер",
          "член",
          "участник",
          "ватт",
          "Вт",
          "киловатт",
          "кВт",
          "мегаватт",
          "МВт",
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
          "нит",
          "ppi",
          "матч",
          "гол",
          "передача",
          "очко",
          "балл",
          "%",
          "\\$",
          "руб\\.",
          "р\\.",
          "копейка",
          "цент",
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
        String.raw`л\.\s+с\.`,
      ],
      roman: [
        morphology.list([
          "век",
          "в.",
          "вв.",
          "столетие",
          "ст.",
          "стст.",
        ]),
      ],
      phrase: [
        String.raw`л\.\s+с\.`,
        String.raw`и\s+т.\s+д.`,
        String.raw`в\s+т.\s+ч.`,
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
      roman(value) {
        return text.helper.match.boundary(
          String.raw`(${text.token.number.roman}${text.helper.match.space()}(?:${value}))`,
        );
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
    const roman = (string) => apply(string, rules.roman, pattern.roman);
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
    const legal = {
      words: [
        "раздел(?:а|е|у|ом)?",
        "глав(?:а|ы|е|у|ой|ою)?",
        "част(?:ь|и|ью|ях|ям|ями)?",
        "пункт(?:а|е|у|ом|ы|ов|ах|ам|ами)?",
        "подпункт(?:а|е|у|ом|ы|ов|ах|ам|ами)?",
        "абзац(?:а|е|у|ем|ы|ев|ах|ам|ами)?",
        "стать(?:я|и|е|ю|ей|ею|ям|ями|ях)",
        "приложени(?:е|я|ю|ем|и|й|ям|ями|ях)",
      ],
      run(string) {
        const words = legal.words.join("|");
        return string.replace(
          new RegExp(
            String.raw`\b(${words})\u00A0(\d+(?:[.-]\d+)*)\u00A0(?=(${words})\u00A0\d)`,
            "giu",
          ),
          "$1\u00A0$2 ",
        );
      },
    };
    return text.helper.pipe(string, numbers, roman, phrases, dashes, legal.run);
  },

  run(string) {
    return text.helper.pipe(
      string,
      text.whitespace,
      text.yo,
      text.typography,
      text.punctuation,
      text.grammar,
      text.spelling,
      text.collocations,
      text.numbers,
      (value) => text.units(value, "full"),
      text.money,
      text.nbsp,
    );
  },
};
