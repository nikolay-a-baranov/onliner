const syntax = {
  tag: {
    groups: {
      link: ["a"],
      image: ["img"],
      list: ["li"],
      definition: ["dl"],
    },
    classify(name = "") {
      return Object.entries(syntax.tag.groups)
        .find(([, names]) => names.includes(name))?.[0] || "markup";
    },
  },
  shortcode: {
    groups: {
      image: ["onliner-gallery"],
      social: ["instagram", "intagram", "threads", "telegram", "tiktok", "tweet"],
      widget: ["onliner-catalog"],
    },
    classify(name = "") {
      return Object.entries(syntax.shortcode.groups)
        .find(([, names]) => names.includes(name))?.[0] || "";
    },
    read(value = "", lower = "", index = 0) {
      const opening = value.slice(index).match(/^\[([a-z][a-z0-9-]*)(?:\s[^\]\r\n]*)?\]/i);
      if (!opening) return null;
      const name = opening[1].toLowerCase();
      const kind = syntax.shortcode.classify(name);
      if (!kind) return null;
      const tokenEnd = index + opening[0].length;
      const closing = `[/${name}]`;
      const closeStart = lower.indexOf(closing, tokenEnd);
      return {
        end: closeStart < 0 ? tokenEnd : closeStart + closing.length,
        kind,
      };
    },
  },
  tokenize(value = "") {
    const source = String(value || "");
    const result = [];
    const append = (content, kind = "") => {
      if (!content) return;
      const last = result[result.length - 1];
      if (last && last.kind === kind) last.text += content;
      else result.push({ text: content, kind });
    };
    let index = 0;
    let plainStart = 0;
    let inWidget = false;
    let metaNext = false;
    const lower = source.toLowerCase();
    while (index < source.length) {
      const character = source[index];
      if (inWidget && (index === 0 || source[index - 1] === "\n")) {
        const end = source.indexOf("\n", index);
        const lineEnd = end < 0 ? source.length : end;
        const line = source.slice(index, lineEnd);
        if (metaNext && line) {
          append(source.slice(plainStart, index));
          append(line, "widget");
          metaNext = false;
          index = lineEnd;
          plainStart = lineEnd;
          continue;
        }
        if (metaNext && !line) metaNext = false;
        const marker = line.match(/^(\s*)(@(?:title|text|label|variants|item\d*|description|meta))\s*$/i);
        if (marker) {
          append(source.slice(plainStart, index));
          append(marker[1]);
          append(line.slice(marker[1].length), "widget");
          metaNext = /^@meta$/i.test(marker[2]);
          index = lineEnd;
          plainStart = lineEnd;
          continue;
        }
      }
      if (character === "<" && /[a-zA-Z!/?]/.test(source[index + 1] || "")) {
        let end = index + 1;
        let quote = "";
        const comment = source.startsWith("<!--", index);
        if (comment) {
          const close = source.indexOf("-->", index + 4);
          end = close < 0 ? -1 : close + 3;
        } else {
          while (end < source.length) {
            const current = source[end];
            if (quote) {
              if (current === quote) quote = "";
            } else if (current === "\"" || current === "'") quote = current;
            else if (current === ">") { end++; break; }
            end++;
          }
          if (end > source.length || source[end - 1] !== ">") end = -1;
        }
        if (end > index) {
          append(source.slice(plainStart, index));
          const content = source.slice(index, end);
          const name = /^<\s*\/?\s*([\w-]+)/.exec(content)?.[1]?.toLowerCase();
          append(content, syntax.tag.classify(name));
          index = end;
          plainStart = end;
          continue;
        }
      }
      if (character === "[") {
        const shortcode = syntax.shortcode.read(source, lower, index);
        if (shortcode) {
          append(source.slice(plainStart, index));
          append(source.slice(index, shortcode.end), shortcode.kind);
          index = shortcode.end;
          plainStart = shortcode.end;
          continue;
        }
      }
      if (character === "[" && /^\[\/?onliner-(?:promo-widget|vote)\]/.test(source.slice(index))) {
        const end = source.indexOf("]", index) + 1;
        append(source.slice(plainStart, index));
        const content = source.slice(index, end);
        append(content, "widget");
        inWidget = !content.startsWith("[/");
        metaNext = false;
        index = end;
        plainStart = end;
        continue;
      }
      index++;
    }
    append(source.slice(plainStart));
    return result;
  },
};

export { syntax };
