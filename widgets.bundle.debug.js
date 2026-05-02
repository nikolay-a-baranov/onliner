const sections = {
  people: { icon: "👫🏻", label: "Люди" },
  sport: { icon: "🏅", label: "Спорт" },
  money: { icon: "👛", label: "Кошель" },
  auto: { icon: "🚘", label: "Авто" },
  tech: { icon: "💻", label: "Течь" },
  realt: { icon: "🏙️", label: "Недвига" },
};
const timezone = "Europe/Minsk";
const editor = (() => {
  const button = (mode) => document.querySelector(`#content-${mode}`);

  return {
    html() {
      const target = button("html");
      if (target) target.click();
      return target;
    },

    tmce({ beforeClick, click = false } = {}) {
      const target = button("tmce");
      if (!target) return null;

      if (
        typeof beforeClick === "function" &&
        target.dataset.editorTmceHook !== "1"
      ) {
        target.dataset.editorTmceHook = "1";
        target.addEventListener("click", () => beforeClick(), true);
      }

      if (click) target.click();
      return target;
    },
  };
})();
const vpn = {
  ensure: async (message = "⚠️ VPN", timeout = 1500) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(`${location.origin}/wp-admin/admin-ajax.php`, {
        method: "GET",
        credentials: "same-origin",
        cache: "no-store",
        signal: controller.signal,
      });

      if (!response.ok) throw new Error(message);
    } catch {
      throw new Error(message);
    } finally {
      clearTimeout(timer);
    }
  },
};
const debug = {
  cleanup: (() => {
    const marker =
      /(?:\n|^)\s*(?:<!--cleanup-debug:[^>]+-->|<p>\[cleanup-debug:[^\]]+\]<\/p>)\s*(?=\n|$)/g;

    return {
      stamp() {
        const date = new Date();
        const pad = (value) => String(value).padStart(2, "0");
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
      },

      strip(value) {
        return value.replace(marker, "").replace(/\s+$/g, "");
      },

      append(value) {
        return `${this.strip(value)}\n\n<!--cleanup-debug:${this.stamp()}-->`;
      },
    };
  })(),
};

const entity = {
  decode(string) {
    const node = document.createElement("textarea");
    let value = string;
    let snap;
    do {
      snap = value;
      node.innerHTML = value;
      value = node.value;
    } while (value !== snap);
    return value;
  },
  encode(string) {
    return Array.from(string, (char) => `&#${char.codePointAt(0)};`).join("");
  },
  encoded(string) {
    return /&#\d+;|&#x[0-9a-f]+;|&lt;|&gt;|&quot;|&amp;#/i.test(string);
  },
};
const widget = (() => {
  const schema = {
    "onliner-promo-widget": {
      visit(data, fn) {
        if (typeof data.text === "string") {
          data.text = fn(data.text);
        }
      },
    },
    "onliner-vote": {
      visit(data, fn) {
        data.variants?.forEach((item) => {
          if (typeof item?.description === "string") {
            item.description = fn(item.description);
          }
        });
      },
    },
  };

  const read = (string) => entity.decode(string).replace(/\\"/g, '"');

  const map = (string, fn) =>
    Object.entries(schema).reduce(
      (result, [tag, { visit }]) =>
        result.replace(
          new RegExp(`\\[${tag}\\]([\\s\\S]*?)\\[\\/${tag}\\]`, "g"),
          (full, raw) => {
            try {
              const data = JSON.parse(raw);
              visit(data, fn);
              return `[${tag}]${JSON.stringify(data)}[/${tag}]`;
            } catch {
              return full;
            }
          },
        ),
      string,
    );

  return {
    decode(string, fn = (value) => value) {
      return map(string, (value) => fn(read(value)));
    },
    encode(string) {
      return map(string, entity.encode);
    },
    ensure(string) {
      return map(string, (value) =>
        entity.encoded(value) ? value : entity.encode(value),
      );
    },
    transform(string, fn) {
      return map(string, (value) => entity.encode(fn(read(value))));
    },
    toggle(string, fn) {
      return this.encoded(string) ? this.decode(string, fn) : this.encode(string);
    },
    encoded(string) {
      let found = false;
      map(string, (value) => {
        if (entity.encoded(value)) found = true;
        return value;
      });
      return found;
    },
  };
})();


const text = {
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



const whitespace = {
  inline: "[\\u0020\\u0009]",
  line: "\n",
  block: "\n\n",
  nbsp: {
    char: "\u00A0",
    html: ["&nbsp;", "&#160;"],
  },
  empty: {
    paragraph: /<p>\s*<\/p>/gi,
    lines: /\n{3,}/g,
  },
};

const model = {
  tag: {
    block: [
      "p",
      "div",
      "section",
      "article",
      "aside",
      "blockquote",
      "h[1-6]",
      "ul",
      "ol",
      "li",
      "dl",
      "dt",
      "dd",
      "table",
      "thead",
      "tbody",
      "tfoot",
      "tr",
      "td",
      "th",
      "figure",
      "figcaption",
    ],
    inline: ["a", "span", "strong", "em", "b", "i", "u", "s", "sup", "sub"],
    single: ["br", "hr", "img"],
    shortcode: {
      onliner: {
        misc: ["onliner-[a-z][a-z0-9-]*"],
        widget: ["onliner-promo-widget", "onliner-vote"],
      },
      media: [
        "video",
        "threads",
        "instagram",
        "tiktok",
        "telegram",
        "before-after",
      ],
    },
  },
  marker: {
    more: "<!--more-->",
    end: "<!--end-tag-->",
    unmore(string) {
      return string.replace(
        new RegExp(`\\s*${model.pattern.marker.more}\\s*`, "gi"),
        whitespace.block,
      );
    },
    unend(string) {
      return string.replace(
        new RegExp(`\\s*${model.pattern.marker.end}\\s*`, "gi"),
        "",
      );
    },
    placeEnd(string) {
      const blocks = model.marker.unend(string).split(whitespace.block);
      const plain = (block) =>
        model.transform.strip(block).replace(/\s+/g, " ").trim();
      const textual = (block) =>
        !!plain(block) &&
        !/^Читайте также:/i.test(plain(block)) &&
        !/\bУНП\b/i.test(plain(block)) &&
        !/^<(?:ul|ol|li|dl|dt|dd|blockquote|img)\b/i.test(block.trim()) &&
        !/^\[(?:onliner-[a-z0-9-]+|video)\b/i.test(block.trim());
      const special =
        /<p\b[^>]*>[\s\S]*?\bУНП\b[\s\S]*?<\/p>/i.test(string) ||
        blocks.some((block) => /^Читайте также:/i.test(plain(block))) ||
        blocks.some((block) => /^\[onliner-[a-z0-9-]+\]/i.test(block.trim()));

      if (!special)
        return blocks.join(whitespace.block).trimEnd() + model.marker.end;

      const index = blocks.reduce(
        (last, block, current) => (textual(block) ? current : last),
        -1,
      );
      if (index === -1)
        return blocks.join(whitespace.block).trimEnd() + model.marker.end;
      blocks[index] = blocks[index].trimEnd() + model.marker.end;
      return blocks.join(whitespace.block);
    },
    applyMore(string) {
      let snap;
      do {
        snap = string;
        string = string.replace(
          new RegExp(
            `<([a-z][a-z0-9]*)\\b[^>]*>\\s*(${model.pattern.marker.more})\\s*<\\/\\1>`,
            "gi",
          ),
          "$2",
        );
      } while (string !== snap);
      string = string.replace(
        new RegExp(`\\s*${model.pattern.marker.more}\\s*`, "gi"),
        whitespace.block,
      );
      const parts = string.split(whitespace.block);
      const index = parts.findIndex((part) => part.trim());
      if (index !== -1)
        parts[index] = parts[index].trimEnd() + model.marker.more;
      return parts.join(whitespace.block);
    },
  },
  footer: {
    telegram() {
      return {
        marker: /\/newsonliner_bot/i,
        remove(text) {
          return text
            .replace(
              /<p\b[^>]*>[\s\S]*?newsonliner_bot[\s\S]*?(?:<\/p>|(?=<p\b[^>]*>)|$)/gi,
              "",
            )
            .replace(/\s+$/g, "");
        },
        add() {
          return '<p style="text-align: right;"><strong>Есть о чем рассказать? Пишите в наш <a href="https://t.me/newsonliner_bot" target="_blank">телеграм-бот</a>. Это анонимно и быстро</strong></p>';
        },
      };
    },
    copyright() {
      return {
        marker: /mailto:ga@onliner\.by/i,
        remove(text) {
          return text
            .replace(
              /<p\b[^>]*>[\s\S]*?mailto:ga@onliner\.by[\s\S]*?(?:<\/p>|(?=<p\b[^>]*>)|$)/gi,
              "",
            )
            .replace(/\s+$/g, "");
        },
        add() {
          return '<p style="text-align: right;"><span style="font-size: small;"><strong>Перепечатка текста и фотографий Onlíner без разрешения редакции запрещена. <a href="mailto:ga@onliner.by">ga@onliner.by</a></strong></span></p>';
        },
      };
    },
    remove(text) {
      const telegram = this.telegram();
      const copyright = this.copyright();
      return copyright.remove(telegram.remove(text));
    },
    add(text, longread) {
      const telegram = this.telegram();
      const copyright = this.copyright();
      text = this.remove(text);
      text += "\n" + telegram.add();
      if (longread) text += "\n" + copyright.add();
      return text;
    },
    layout() {
      return (
        document.querySelector("#layout_select") ||
        document.querySelector('[name="layout"]')
      );
    },
    apply(text) {
      const layout = this.layout();
      const copyright = layout && /(longread|photoreport)/i.test(layout.value);
      return this.add(text, copyright);
    },
  },
  attribute: {
    style: {
      drop: [
        "\\s*text-align:\\s*left;?",
        '\\s*font-size\\s*:\\s*[^";]+;?\\s*',
        "\\s*color\\s*:\\s*#000000;?\\s*",
      ],
    },
    drop: {
      global: [
        "dir",
        "data-start",
        "data-end",
        "data-section-id",
        "data-is-last-node",
        "data-is-only-node",
      ],
    },
    scrub(string) {
      model.attribute.style.drop.forEach((value) => {
        string = string.replace(new RegExp(`\\sstyle="${value}"`, "gi"), "");
      });
      model.attribute.drop.global.forEach((name) => {
        string = string.replace(new RegExp(`\\s${name}="[^"]*"`, "gi"), "");
      });
      return string;
    },
  },
  clean: {
    drop: ["span", "br"],
    rename: {
      b: "strong",
      i: "em",
    },
  },
  widget: {
    extract: {
      "onliner-promo-widget": (data) =>
        typeof data.text === "string" ? [data.text] : [],
      "onliner-vote": (data) =>
        (data.variants || [])
          .map((item) => item?.description)
          .filter((value) => typeof value === "string"),
    },
    text(tag, raw) {
      const extract = model.widget.extract[tag];
      if (!extract) return "\u0020";
      try {
        const data = JSON.parse(raw);
        const text = extract(data).join("\u0020").trim();
        return text ? ` ${text} ` : "\u0020";
      } catch {
        return "\u0020";
      }
    },
  },
  entity: {
    decode(string) {
      const protectedText = model.transform.protect(string);
      protectedText.text = protectedText.text
        .replace(model.regex.whitespace.nbsp, "\u0020")
        .replace(/&amp;/gi, "&")
        .replace(/&quot;/gi, '"')
        .replace(/&#x27;|&#39;/gi, "'");
      return protectedText.restore(protectedText.text);
    },
  },
  transform: {
    clean(string) {
      return string
        .replace(model.regex.whitespace.nbsp, "\u0020")
        .replace(
          new RegExp(
            `</?(?:${model.source.group(model.clean.drop)})\\b[^>]*>`,
            "gi",
          ),
          "",
        )
        .replace(/\s+<\/p>/gi, "</p>")
        .replace(whitespace.empty.paragraph, "")
        .replace(/<\/?(b|i)\b[^>]*>/gi, (tag, name) => {
          const next = model.clean.rename[name.toLowerCase()];
          return tag[1] === "/" ? `</${next}>` : `<${next}>`;
        });
    },
    strip(html) {
      const node = document.createElement("textarea");
      html = html
        .replace(
          /\[(onliner-promo-widget|onliner-vote)\]([\s\S]*?)\[\/\1\]/gi,
          (_, tag, raw) => model.widget.text(tag.toLowerCase(), raw),
        )
        .replace(model.regex.tag.shortcode.all, (full) =>
          model.regex.tag.shortcode.onliner.miscMatch.test(full)
            ? full
            : "\u0020",
        )
        .replace(/<br\b[^>]*>/gi, "\n")
        .replace(/<hr\b[^>]*\/?>/gi, "\n")
        .replace(/<img\b[^>]*\/?>/gi, "\u0020")
        .replace(model.regex.tag.block, "\n")
        .replace(/<[^>]+>/g, "\u0020");
      node.innerHTML = html;
      return node.value
        .replace(/\u00A0/g, "\u0020")
        .replace(/[\u0020\u0009]+/g, "\u0020")
        .replace(/\n\s+/g, "\n")
        .replace(/\s+\n/g, "\n")
        .replace(whitespace.empty.lines, whitespace.block)
        .trim();
    },
    protect(string) {
      const parts = [];
      const put = (part) => {
        const key = `___PRT${parts.length}___`;
        parts.push(part);
        return key;
      };
      string = string
        .replace(model.regex.tag.shortcode.all, put)
        .replace(/<[^>]*>/g, put)
        .replace(/\[(\/)?([a-z][a-z0-9-]*)(?:[^\]]*)\]/g, put);
      return {
        text: string,
        restore: (string) =>
          string.replace(/___PRT(\d+)___/g, (_, index) => parts[+index]),
      };
    },
  },
  link: {
    clean(string) {
      const pure = (url) => {
        url = entity.decode(url);
        if (
          /^https?:\/\/b2bblog\.onliner\.by\/2018\/01\/01\/specproekty-onliner-by\/?(?:[?#].*)?$/i.test(
            url,
          )
        ) {
          return "https://content.onliner.by/b2b/spec.pdf";
        }
        if (/youtube\.com|youtu\.be/i.test(url)) {
          url = url
            .replace(/([?&])si=[^&#]+(&)?/i, (_, sep, tail) =>
              sep === "?" && tail ? "?" : tail ? "&" : "",
            )
            .replace(/\?$/, "")
            .replace(/&$/, "");
        }
        if (/instagram\.com|tiktok\.com/i.test(url)) {
          url = url.replace(/\?.*$/, "");
          url = url.replace(/([^\/?#])(?=($|[?#]))/, "$1/");
        }
        return url;
      };

      string = string.replace(/https?:\/\/[^\s"'<>]+/gi, (url) => pure(url));
      return string.replace(
        /<a\b([^>]*)>([\s\S]*?)<\/a>/gi,
        (full, attrs, body) => {
          const href = (attrs.match(/\bhref="([^"]*)"/i) || [, ""])[1];
          if (!href || /^\s*(#|mailto:|tel:)/i.test(href)) return full;
          let url = pure(href);
          const isInternal = /\.onliner\.by(?:\/|$|\?|#)/i.test(url);
          const needsSlash =
            /^https?:\/\/[a-z0-9-]+\.onliner\.by\/\d{4}\/\d{2}\/\d{2}\/[^\/?#]+(?:$|\?|#)/i.test(
              url,
            );
          if (needsSlash) url = url.replace(/([^\/?#])(?=($|[?#]))/, "$1/");
          return isInternal
            ? `<a href="${url}">${body}</a>`
            : `<a href="${url}" target="_blank">${body}</a>`;
        },
      );
    },
  },
  markup: {
    html(string) {
      string = model.attribute
        .scrub(string)
        .replace(/<img\b[^>]*>/gi, (tag) => {
          const src = (tag.match(/\bsrc="([^"]*)"/i) || [, ""])[1];
          const alt = (tag.match(/\balt="([^"]*)"/i) || [, ""])[1];
          return src
            ? `<img class="aligncenter" src="${src}" alt="${alt}" />`
            : tag;
        })
        .replace(/<dl\b[^>]*>/gi, '<dl class="wp-caption aligncenter">');
      let snap = "";
      while (string !== snap) {
        snap = string;
        string = string
          .replace(
            /<((?!a\b|dl\b|dt\b)[a-z][a-z0-9]*)(?:\b[^>]*)>\s*((?:<(?!\/|a\b|dl\b|dt\b)[a-z][a-z0-9]*\b[^>]*>\s*)*(?:<a\b[^>]*>\s*)?<img\b[^>]*>(?:\s*<\/a>)?(?:\s*<\/(?!a\b|dl\b|dt\b)[a-z][a-z0-9]*>)*)\s*<\/\1>/gi,
            "$2",
          )
          .replace(
            /<(em|strong)>([\s\S]*?)<\1>([\s\S]*?)<\/\1>([\s\S]*?)<\/\1>/gi,
            "<$1>$2$3$4</$1>",
          )
          .replace(
            new RegExp(
              `<((?!em\\b|strong\\b)[a-z][a-z0-9]*)>(${whitespace.inline}+)<\\/\\1>`,
              "gi",
            ),
            "$2",
          )
          .replace(/<((?!em\b|strong\b)[a-z][a-z0-9]*)>([^<>\n])<\/\1>/gi, "$2")
          .replace(/<(em|strong)>\s*<\1>/gi, "<$1>")
          .replace(/<\/(em|strong)>\s*<\/\1>/gi, "</$1>")
          .replace(
            new RegExp(
              `<((?!em\\b|strong\\b)[a-z][a-z0-9]*)>${whitespace.inline}*<\\/\\1>`,
              "gi",
            ),
            "",
          )
          .replace(
            new RegExp(`</(em|strong)>(${whitespace.inline}+)<\\1>`, "gi"),
            "$2",
          )
          .replace(/<\/([a-z][a-z0-9]*)><\1>/gi, "");
      }
      return string
        .replace(
          new RegExp(`${whitespace.inline}+(</[a-z][a-z0-9]*>)`, "gi"),
          "$1",
        )
        .replace(/<\/?p>/g, "\n")
        .replace(/<blockquote>\s*\n+\s*/gi, "<blockquote>")
        .replace(/\s*\n+\s*<\/blockquote>/gi, "</blockquote>")
        .replace(
          /<h([1-6])>\s*<a\s+name="([^"]+)"\s*><\/a>\s*/gi,
          '<h$1 id="$2">',
        )
        .replace(
          /<h([1-6])([^>]*)>\s*<strong>([\s\S]*?)<\/strong>\s*<\/h\1>/gi,
          "<h$1$2>$3</h$1>",
        )
        .replace(
          /<em>\s*<strong>([\s\S]*?)<\/strong>\s*<\/em>/gi,
          "<strong><em>$1</em></strong>",
        )
        .replace(
          /\[([a-z][a-z0-9-]*)([^\]]*)\]\s*([\s\S]*?)\s*\[\/\1\]/g,
          (full, tag, attrs, content) =>
            /<[a-z][\s\S]*>/i.test(content)
              ? `[${tag}${attrs}]${content.replace(/\n+/g, "").trim()}[/${tag}]`
              : full,
        )
        .replace(
          /([^\n])\s*(<(?:h[1-6]|dl|blockquote|img)\b[^>]*>)/gi,
          "$1\n\n$2",
        )
        .replace(/(<\/(?:h[1-6]|dl|blockquote)>)\s*([^\n])/gi, "$1\n\n$2")
        .replace(/(<img\b[^>]*>)\s*(?!<\/(?:a|dt|dl)>)(?=\S)/gi, "$1\n\n")
        .replace(
          /(\[[a-z][a-z0-9-]*(?:[^\]]*)\])\n+(<(?:blockquote|dl|img)\b[^>]*>)/gi,
          "$1$2",
        )
        .replace(
          /(<\/(?:blockquote|dl)>|<img\b[^>]*>)\n+(\[\/[a-z][a-z0-9-]*\])/gi,
          "$1$2",
        )
        .replace(
          /([^\n])(\[([a-z][a-z0-9-]*)(?:[^\]]*)\][\s\S]*?\[\/\3\])/g,
          "$1\n\n$2",
        )
        .replace(
          /(\[([a-z][a-z0-9-]*)(?:[^\]]*)\][\s\S]*?\[\/\2\])([^\n])/g,
          "$1\n\n$3",
        )
        .replace(/([^\n])(<(?:p|ul|ol|li)\b[^>]*>)/gi, "$1\n$2")
        .replace(/(<\/(?:p|ul|ol|li)>)([^\n])/gi, "$1\n$2")
        .replace(/(<(?:dl|dt|a)\b[^>]*>)\n+(<img\b[^>]*>)/gi, "$1$2")
        .replace(/(<img\b[^>]*>)\n+(<\/(?:dt|a|dl)>)/gi, "$1$2")
        .replace(
          /\[([a-z][a-z0-9-]*)([^\]]*)\]([\s\S]*?)\[\/\1\]/gi,
          (_, tag, attrs, content) => {
            content = content.replace(/\n{2,}/g, "\n").trim();
            return /<blockquote\b/i.test(content)
              ? `[${tag}${attrs}]\n${content}\n[/${tag}]`
              : `[${tag}${attrs}]${content}[/${tag}]`;
          },
        )
        .replace(/([,:;.!?\u2026])(<\/a>)/gi, "$2$1")
        .replace(
          /(<a\b[^>]*>[\s\S]*?<\/a>)([,.!?\u2026])((?:<\/(?:strong|em)>)+)/gi,
          "$1$3$2",
        );
    },
    widget(string) {
      return model.attribute
        .scrub(string)
        .replace(/<img\b[^>]*>/gi, (tag) => {
          const src = (tag.match(/\bsrc="([^"]*)"/i) || [, ""])[1];
          const alt = (tag.match(/\balt="([^"]*)"/i) || [, ""])[1];
          return src
            ? `<img class="aligncenter" src="${src}" alt="${alt}" />`
            : tag;
        })
        .replace(/<dl\b[^>]*>/gi, '<dl class="wp-caption aligncenter">');
    },
    breaks(string) {
      return string
        .replace(/\n{3,}/g, "\n\n")
        .replace(/(^|\n)\s*(<li\b)/gi, "$1\t$2")
        .trim();
    },
    images(string) {
      return string.replace(
        /<a\b[^>]*href="https?:\/\/content\.onliner\.by\/news\/large\/[^"]*"[^>]*>\s*(<img\b[^>]*>)\s*<\/a>/gi,
        "$1",
      );
    },
  },
};

model.source = {
  group(items) {
    return items.join("|");
  },
  shortcode(name) {
    return String.raw`\[${name}(?:[^\]]*)\][\s\S]*?\[\/${name}\]`;
  },
  shortcodes(items) {
    return String.raw`\[(?:${model.source.group(items)})(?:[^\]]*)\][\s\S]*?\[\/(?:${model.source.group(items)})\]`;
  },
};

model.pattern = {
  whitespace: {
    nbsp: String.raw`\u00A0|&nbsp;|&#160;`,
  },
  tag: {
    block: model.source.group(model.tag.block),
    inline: model.source.group(model.tag.inline),
    single: model.source.group(model.tag.single),
    shortcode: {
      all: String.raw`\[([a-z][a-z0-9-]*)(?:[^\]]*)\][\s\S]*?\[\/\1\]`,
      onliner: {
        misc: model.source.shortcodes(model.tag.shortcode.onliner.misc),
        widget: model.source.shortcodes(model.tag.shortcode.onliner.widget),
      },
      media: model.source.shortcodes(model.tag.shortcode.media),
    },
  },
  marker: {
    more: model.marker.more,
    end: model.marker.end,
  },
};

model.regex = {
  whitespace: {
    nbsp: new RegExp(model.pattern.whitespace.nbsp, "gi"),
  },
  tag: {
    block: new RegExp(`</?(?:${model.pattern.tag.block})\\b[^>]*>`, "gi"),
    shortcode: {
      all: new RegExp(model.pattern.tag.shortcode.all, "g"),
      onliner: {
        miscMatch: new RegExp(model.pattern.tag.shortcode.onliner.misc, "i"),
        misc: new RegExp(model.pattern.tag.shortcode.onliner.misc, "gi"),
        widget: new RegExp(model.pattern.tag.shortcode.onliner.widget, "gi"),
      },
      media: new RegExp(model.pattern.tag.shortcode.media, "gi"),
    },
  },
  marker: {
    more: new RegExp(model.pattern.marker.more, "gi"),
    end: new RegExp(model.pattern.marker.end, "gi"),
  },
};
const clean = (string) => model.transform.clean(string);
const strip = (string) => model.transform.strip(string);
const protect = (string) => model.transform.protect(string);
const markup = (string) => model.markup.html(string);

model.inline = {
  emphasisPunctuation: "[,.!?\\u2026\\u00BB]",
  speechTail: String.raw`\s+\u2014\s+\p{Ll}`,
  quotedFragment:
    "\\u00AB[^\\u00AB\\u00BB<>\\n]+(?:\\u00BB[.,]|[?!\\u2026]\\u00BB)",
  emphasisMarker: /___EMP\d+___/,
  quoteEnabled: true,

  get speechLine() {
    return new RegExp(
      String.raw`(^|\n)(\u2014[^<\n]+?${model.inline.emphasisPunctuation})(${model.inline.speechTail})`,
      "gu",
    );
  },

  unwrap(string) {
    let snap = "";
    while (string !== snap) {
      snap = string;
      string = string
        .replace(
          /<(em|strong)>([\s\S]*?)<\1>([\s\S]*?)<\/\1>([\s\S]*?)<\/\1>/gi,
          "<$1>$2$3$4</$1>",
        )
        .replace(/<(em|strong)>\s*<\1>/gi, "<$1>")
        .replace(/<\/(em|strong)>\s*<\/\1>/gi, "</$1>");
    }
    return string;
  },

  protect(string) {
    const parts = [];
    return {
      text: string.replace(
        /<strong><em>[\s\S]*?<\/em><\/strong>|<em><strong>[\s\S]*?<\/strong><\/em>|<em>[\s\S]*?<\/em>/gi,
        (part) => {
          const key = `___EMP${parts.length}___`;
          parts.push(part);
          return key;
        },
      ),
      restore: (string) =>
        string.replace(/___EMP(\d+)___/g, (_, index) => parts[+index]),
    };
  },

  emphasizeLine(line) {
    if (model.inline.emphasisMarker.test(line)) return line;
    return line
      .replace(model.inline.speechLine, "$1<em>$2</em>$3")
      .replace(
        new RegExp(String.raw`(:\s*)(${model.inline.quotedFragment})`, "g"),
        "$1<em>$2</em>",
      )
      .replace(
        new RegExp(
          String.raw`^(${model.inline.quotedFragment})(?=\s*\u2014)`,
          "g",
        ),
        "<em>$1</em>",
      );
  },

  quoteView(line) {
    return model.transform
      .strip(line.replace(/<\/?(?:em|strong)\b[^>]*>/gi, ""))
      .replace(/\s+/g, " ")
      .trim();
  },

  quoteBody(line) {
    return line.replace(/<\/?(?:em|strong)\b[^>]*>/gi, "").trim();
  },

  quoteEm(string, strong = false) {
    return strong
      ? `<strong><em>${string}</em></strong>`
      : `<em>${string}</em>`;
  },

  quoteLine(line, strong = false) {
    if (!/^\u2014(?:\s|["\u00AB\u201E]|$)/.test(model.inline.quoteView(line))) {
      return line;
    }
    const body = model.inline.quoteBody(line);
    const split = body.match(
      /^(\u2014[\s\S]*?[,.!?\u2026\u00BB])(\s+\u2014\s+\p{Ll}[\s\S]*?)([,.!?\u2026]\s+\u2014\s+)([\s\S]+)$/u,
    );
    if (split) {
      return `${model.inline.quoteEm(split[1], strong)}${split[2]}${split[3]}${model.inline.quoteEm(split[4])}`;
    }
    const tail = body.match(
      /^(\u2014[\s\S]*?[,.!?\u2026\u00BB])(\s+\u2014\s+\p{Ll}[\s\S]*)$/u,
    );
    if (tail) return `${model.inline.quoteEm(tail[1], strong)}${tail[2]}`;
    return model.inline.quoteEm(body, strong);
  },

  quoteParagraphs(string) {
    if (!model.inline.quoteEnabled) return string;
    return string
      .split("\n")
      .map((line, index, lines) => {
        const current = model.inline.quoteView(line);
        const next = lines
          .slice(index + 1)
          .map((item) => model.inline.quoteView(item))
          .find(Boolean);
        const strong =
          /^\u2014/.test(current) &&
          /\?\s*$/.test(current) &&
          /^\u2014/.test(next || "");
        return model.inline.quoteLine(line, strong);
      })
      .join("\n");
  },

  normalizeParagraphs(string) {
    return string
      .split("\n")
      .map((line) => {
        const emOnly = line.match(/^\s*((?:<em>[\s\S]*?<\/em>|[ \t])+)\s*$/i);
        if (emOnly && /<em>/i.test(emOnly[1])) {
          return `<em>${emOnly[1].replace(/<\/?em>/gi, "")}</em>`;
        }
        const strongOnly = line.match(
          /^\s*((?:<strong>[\s\S]*?<\/strong>|[ \t])+)\s*$/i,
        );
        if (strongOnly && /<strong>/i.test(strongOnly[1])) {
          return `<strong>${strongOnly[1].replace(/<\/?strong>/gi, "")}</strong>`;
        }
        return line;
      })
      .join("\n");
  },

  mergeRuns(line) {
    const merge = (string, tag) =>
      string.replace(
        new RegExp(
          `<${tag}>[\\s\\S]*?<\\/${tag}>(?:[\\u0020\\u0009]*<${tag}>[\\s\\S]*?<\\/${tag}>)+`,
          "gi",
        ),
        (chunk) =>
          `<${tag}>${chunk.replace(new RegExp(`</?${tag}>`, "gi"), "")}</${tag}>`,
      );
    line = merge(line, "em");
    line = merge(line, "strong");
    return line;
  },

  unwrapSingleLine(line) {
    if (/^(?:\s*<em>[\s\S]*?<\/em>\s*)+$/i.test(line)) {
      return `<em>${line.replace(/<\/?em>/gi, "")}</em>`;
    }
    if (/^(?:\s*<strong>[\s\S]*?<\/strong>\s*)+$/i.test(line)) {
      return `<strong>${line.replace(/<\/?strong>/gi, "")}</strong>`;
    }
    return line;
  },

  unwrapNestedSameTag(line) {
    return line.replace(
      /^\s*<(em|strong)>([\s\S]*)<\/\1>\s*$/i,
      (_, tag, body) =>
        `<${tag}>${body.replace(new RegExp(`</?${tag}>`, "gi"), "")}</${tag}>`,
    );
  },

  unwrapSameTagIslands(line) {
    return ["em", "strong"].reduce(
      (result, tag) =>
        result.replace(
          new RegExp(`(?:<${tag}>[\\s\\S]*?<\\/${tag}>\\s*){2,}`, "gi"),
          (chunk) => {
            const space = /\s+$/.test(chunk) ? chunk.match(/\s+$/)[0] : "";
            return `<${tag}>${chunk.replace(new RegExp(`</?${tag}>`, "gi"), "").trimEnd()}</${tag}>${space}`;
          },
        ),
      line,
    );
  },

  repair(line) {
    line = model.inline.unwrapSameTagIslands(line);
    line = model.inline.unwrapNestedSameTag(line);
    line = model.inline.unwrapSingleLine(line);
    let snap = "";
    while (line !== snap) {
      snap = line;
      line = model.inline
        .mergeRuns(line)
        .replace(/<(em|strong)>([\u0020\u0009]+)<\/\1>/gi, "$2")
        .replace(/<(em|strong)>\s*<\/\1>/gi, "")
        .replace(/<\/(em|strong)>([\u0020\u0009]+)<\1>/gi, "$2")
        .replace(/<\/(em|strong)><\1>/gi, "")
        .replace(/([\p{L}]+)<(em|strong)>([\p{L}]+)/gu, "<$2>$1$3")
        .replace(/([\p{L}]+)<\/(em|strong)>([\p{L}]+)/gu, "$1$3</$2>")
        .replace(
          /\s*<\/em>\s+([\u0410-\u042F\u0430-\u044F\u0401\u0451])<em>/gu,
          "$1",
        )
        .replace(/\n+<\/em>/g, "</em>");
    }
    return line;
  },

  normalizeLine(line) {
    return /<\/?em\b/i.test(line) ? model.inline.repair(line) : line;
  },

  normalize(string) {
    return string
      .split("\n")
      .map((line) => model.inline.normalizeLine(line))
      .join("\n");
  },

  normalizeMarkupLine(line) {
    return /<\/?em\b/i.test(line)
      ? line
      : line
          .replace(
            /(^|\n)(\s*)((?:--?|\u2014|\u2013)\s+)((?:<(?!\/)[a-z][a-z0-9]*\b[^>]*>\s*)+)(?=[^<\n])/gi,
            (_, start, indent, dash, tags) => `${start}${indent}${tags}\u2014 `,
          )
          .replace(
            /(<\/a>)([,.!?\u2026])((?:<\/(?:strong|em)>\s*)+)/gi,
            "$1$3$2",
          )
          .replace(
            /((?:<\/(?!a\b)[a-z][a-z0-9]*>\s*)+)([\u00BB\u201D][,.!?\u2026]?)/gi,
            "$2$1",
          );
  },

  markup(string) {
    return string
      .split("\n")
      .map((line) => model.inline.normalizeMarkupLine(line))
      .join("\n");
  },

  apply(string) {
    return model.inline.unwrap(
      string
        .split("\n")
        .map((line) => model.inline.emphasizeLine(line))
        .join("\n"),
    );
  },
};
const inline = (string) => model.inline.normalize(string);
const inlineMarkup = (string) => model.inline.markup(string);
const emphasis = (string) => model.inline.apply(string);
const links = (string) => model.link.clean(string);
const more = (string) => model.marker.applyMore(string);
const breaks = (string) => model.markup.breaks(string);
const images = (string) => model.markup.images(string);
const footer = (string) => model.footer.apply(string);

const process = {
  prepare(string) {
    return text.spaces(string);
  },

  inline(string) {
    string = model.inline.normalizeParagraphs(string);
    string = model.inline.quoteParagraphs(string);
    const emphasized = model.inline.protect(string);
    emphasized.text = model.entity.decode(emphasized.text);
    emphasized.text = emphasis(emphasized.text);
    string = emphasized.restore(emphasized.text);
    string = inlineMarkup(string);
    return model.link.clean(string);
  },

  content(string) {
    string = model.markup.html(string);
    string = process.inline(string);
    string = model.marker.applyMore(string);
    string = model.marker.placeEnd(string);
    return model.footer.apply(string);
  },

  widget(string) {
    string = model.transform.clean(string);
    string = model.markup.widget(string);
    string = process.inline(string);
    return model.footer.remove(model.marker.unmore(model.marker.unend(string)));
  },

  finish(string, embedded) {
    string = model.markup.breaks(string);
    string = widget.transform(string, (value) => rich(value, true));
    const protectedText = model.transform.protect(string);
    return protectedText.restore(
      embedded
        ? text.run(protectedText.text)
        : text.typography(protectedText.text),
    );
  },
};
const rich = (string, embedded = false) => {
  string = process.prepare(string);
  string = embedded ? process.widget(string) : process.content(string);
  return process.finish(string, embedded);
};
const embed = (string) => entity.encode(rich(string, true));
const content = (string) => {
  let result = rich(string);
  if (
    /<a\b[^>]*href="https?:\/\/content\.onliner\.by\/news\/large\/[^"]*"[^>]*>\s*<img\b[^>]*>\s*<\/a>/i.test(
      result,
    ) &&
    confirm(
      "\u041a\u0430\u0440\u0442\u0438\u043d\u043a\u0438 \u0431\u0435\u0437 \u0441\u0441\u044b\u043b\u043e\u043a?",
    )
  ) {
    result = model.markup.images(result);
  }
  return result;
};

const textarea = document.getElementById("content");
  if (!textarea) return;

  const readable = {
    open: "⟦",
    close: "⟧",
  };

  const show = (string) =>
    widget
      .decode(string, clean)
      .replace(
        /("text"\s*:\s*)"((?:\\.|[^"\\])*)"/g,
        (_, before, value) =>
          `${before}${readable.open}${value.replace(/\\"/g, '"')}${readable.close}`,
      )
      .replace(
        /("description"\s*:\s*)"((?:\\.|[^"\\])*)"/g,
        (_, before, value) =>
          `${before}${readable.open}${value.replace(/\\"/g, '"')}${readable.close}`,
      );

  const hide = (string) =>
    widget.encode(
      string
        .replace(
          /("text"\s*:\s*)⟦([\s\S]*?)⟧/g,
          (_, before, value) => `${before}${JSON.stringify(value)}`,
        )
        .replace(
          /("description"\s*:\s*)⟦([\s\S]*?)⟧/g,
          (_, before, value) => `${before}${JSON.stringify(value)}`,
        ),
    );

  const mode = {
    get: () =>
      textarea.dataset.widgetMode ||
      (textarea.value.includes(readable.open) || !widget.encoded(textarea.value)
        ? "decoded"
        : "encoded"),

    set(value) {
      textarea.dataset.widgetMode = value;
    },

    sync() {
      mode.set(
        textarea.value.includes(readable.open) || !widget.encoded(textarea.value)
          ? "decoded"
          : "encoded",
      );
    },
  };

  const emit = () => {
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
    textarea.dispatchEvent(new Event("change", { bubbles: true }));
  };

  const run = (fn) => {
    const source = textarea.value;
    const result = fn(source);
    if (result === source) return;
    textarea.value = result;
    emit();
  };

  const toggle = () => {
    if (mode.get() === "encoded") {
      run(show);
      mode.set("decoded");
      return;
    }

    run(hide);
    mode.set("encoded");
  };

  editor.html();

  setTimeout(() => {
    mode.sync();
    toggle();

    editor.tmce({
      beforeClick: () => {
        if (mode.get() !== "encoded") {
          run(hide);
          mode.set("encoded");
        }
      },
    });
  }, 0);