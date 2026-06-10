export const createMarkup = (api) => ({
  tag(value, start, name) {
    const before = `<${name}>`;
    const after = `</${name}>`;
    const left = value.slice(0, start);
    const open = left.lastIndexOf(before);
    const close = left.lastIndexOf(after);
    if (open < 0 || open < close) return null;
    const right = value.slice(start);
    const end = right.indexOf(after);
    if (end < 0) return null;
    return {
      start: open,
      end: start + end + after.length,
      bodyStart: open + before.length,
      bodyEnd: start + end,
      before,
      after,
    };
  },
  taggle(element, name) {
    const start = element.selectionStart;
    const end = element.selectionEnd;
    const value = element.value;
    const data = api.tag(value, start, name);
    if (data && start >= data.bodyStart && end <= data.bodyEnd) {
      const body = value.slice(data.bodyStart, data.bodyEnd);
      element.value = value.slice(0, data.start) + body + value.slice(data.end);
      return api.done(
        element,
        Math.max(data.start, start - data.before.length),
      );
    }
    const range = api.range(value, start, end);
    if (range.start === range.end) return false;
    const before = `<${name}>`;
    const after = `</${name}>`;
    const string = value.slice(range.start, range.end);
    element.value =
      value.slice(0, range.start) +
      before +
      string +
      after +
      value.slice(range.end);
    return api.done(
      element,
      Math.min(start + before.length, element.value.length),
    );
  },
  tagPattern(name) {
    return new RegExp(`</?${name}\b[^>]*>`, "gi");
  },
  clearTag(element, name) {
    const pattern = api.tagPattern(name);
    const next = element.value.replace(pattern, "");
    if (next === element.value) return false;
    const start = element.selectionStart;
    const end = element.selectionEnd;
    element.value = next;
    return api.done(
      element,
      Math.min(start, next.length),
      Math.min(end, next.length),
    );
  },
  clearTagAfter(element, name) {
    const start = element.selectionStart;
    const end = element.selectionEnd;
    const before = element.value.slice(0, start);
    const after = element.value.slice(start).replace(api.tagPattern(name), "");
    const next = before + after;
    if (next === element.value) return false;
    element.value = next;
    return api.done(
      element,
      Math.min(start, next.length),
      Math.min(end, next.length),
    );
  },
  listTag(value, start) {
    const left = value.slice(0, start);
    const item = [...left.matchAll(/<li(?:\s[^>]*)?>/gi)].pop();
    if (!item || left.lastIndexOf("</li>") > item.index) return null;
    const list = [...left.matchAll(/<(ul|ol)(?:\s[^>]*)?>/gi)].pop();
    if (!list) return null;
    const tag = list[1].toLowerCase();
    const close = value.slice(start).search(new RegExp(`</${tag}>`, "i"));
    if (close < 0) return null;
    return { start: list.index, end: start + close + `</${tag}>`.length };
  },
  listSelection(value, start, end) {
    if (start === end) return null;
    const range = api.trim(value, start, end);
    if (range.start === range.end) return null;
    const source = value.slice(range.start, range.end);
    if (/<(?:ul|ol|li)\b/i.test(source)) return null;
    const rows = source
      .split(/\r?\n/)
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => item.replace(/^([-•●▪◦]|\d+\.)\s+/i, "").trim())
      .filter(Boolean);
    if (!rows.length) return null;
    return {
      start: range.start,
      end: range.end,
      value: `<ul>\n${rows.map((item) => `<li>${item}</li>`).join("\n")}\n</ul>`,
    };
  },
  list(element) {
    const start = element.selectionStart;
    const end = element.selectionEnd;
    const value = element.value;
    const selection = api.listSelection(value, start, end);
    if (selection) {
      element.value =
        value.slice(0, selection.start) +
        selection.value +
        value.slice(selection.end);
      return api.done(element, selection.start);
    }
    const html = api.listTag(value, start);
    if (!html) return false;
    const string = value.slice(html.start, html.end);
    const semicolon =
      /<\/li>\s*<li/i.test(string) && /;\s*<\/li>/i.test(string);
    const mode = semicolon ? "." : ";";
    const next = string.replace(
      /<li(?:\s[^>]*)?>([\s\S]*?)<\/li>/gi,
      (_, item) => {
        const text = item.trim().replace(/[.,;:!?…]\s*$/u, "");
        return `<li>${text}${mode}</li>`;
      },
    );
    const result =
      mode === ";" ? next.replace(/;(<\/li>\s*<\/(?:ul|ol)>)/i, ".$1") : next;
    element.value = value.slice(0, html.start) + result + value.slice(html.end);
    return api.done(element, start);
  },
  note(element) {
    const start = element.selectionStart;
    const value = element.value;
    const block = api.block(value, start, start);
    const text = value.slice(block.start, block.end);
    const plain = text.replace(/<\/?em>/gi, "");
    const notes = [];
    const prepared = plain.replace(
      /\(([^()]+?)(?:\s+—|,)\s+прим\.\s+([^()]+)\)/gi,
      (_, body, name) => {
        const clear = body.replace(/\s*[.:,]?\s*$/, "");
        const index = notes.push(`(${clear}. — Прим. ${name.trim()})`) - 1;
        return `\u0001NOTE${index}\u0002`;
      },
    );
    if (!notes.length) return false;
    const next = notes.reduce(
      (string, item, index) =>
        string.replace(`\u0001NOTE${index}\u0002`, `</em>${item}<em>`),
      `<em>${prepared}</em>`,
    );
    element.value = value.slice(0, block.start) + next + value.slice(block.end);
    return api.done(element, start);
  },
  markup: {
    inlineModes: ["plain", "em", "strong", "strong-em"],
    blockModes: ["plain", "h2", "h3"],
    image: {
      attr(value = "", name = "") {
        const pattern = new RegExp(`${name}=["']([^"']+)["']`, "i");
        return String(value || "").match(pattern)?.[1] || "";
      },
      largeUrl(value = "") {
        const url = String(value || "").trim();
        const match = url.match(
          /^(https?:\/\/content\.onliner\.by\/news\/)(?:[^/?#]+\/)?([^/?#]+\.(?:jpe?g|png|webp|gif))(.*)$/i,
        );
        return match ? `${match[1]}large/${match[2]}${match[3] || ""}` : "";
      },
      linked(value = "", start = 0, end = start) {
        const source = String(value || "");
        const pattern = /<a\b[^>]*>\s*(<img\b[^>]*>)\s*<\/a>/gi;
        return [...source.matchAll(pattern)]
          .map((match) => ({
            start: match.index,
            end: match.index + match[0].length,
            img: match[1],
            imgStart: match.index + match[0].indexOf(match[1]),
          }))
          .find((item) =>
            api.markup.image.inside(start, end, item.imgStart, item.img.length),
          ) || null;
      },
      plain(value = "", start = 0, end = start) {
        const source = String(value || "");
        const pattern = /<img\b[^>]*>/gi;
        return [...source.matchAll(pattern)]
          .map((match) => ({
            start: match.index,
            end: match.index + match[0].length,
            img: match[0],
          }))
          .find((item) =>
            api.markup.image.inside(start, end, item.start, item.img.length),
          ) || null;
      },
      inside(start = 0, end = start, from = 0, size = 0) {
        const to = from + size;
        if (start === end) return start >= from && start <= to;
        return start < to && end > from;
      },
      wrap(value = "", item = null) {
        if (!item) return null;
        const href = api.markup.image.largeUrl(
          api.markup.image.attr(item.img, "src"),
        );
        if (!href) return null;
        const open = `<a href="${href}" target="_blank">`;
        const next = `${open}${item.img}</a>`;
        return {
          value: value.slice(0, item.start) + next + value.slice(item.end),
          start: item.start + open.length,
          end: item.start + open.length + item.img.length,
        };
      },
      unwrap(value = "", item = null) {
        if (!item) return null;
        return {
          value: value.slice(0, item.start) + item.img + value.slice(item.end),
          start: item.start,
          end: item.start + item.img.length,
        };
      },
      toggle(value = "", start = 0, end = start) {
        const linked = api.markup.image.linked(value, start, end);
        if (linked) return api.markup.image.unwrap(value, linked);
        return api.markup.image.wrap(
          value,
          api.markup.image.plain(value, start, end),
        );
      },
      hash(value = "") {
        const url = String(value || "").trim();
        const match = url.match(
          /\/([^\/?#]+)\.(?:jpe?g|png|webp|gif)(?:[?#].*)?$/i,
        );
        return match ? match[1] : "";
      },
      galleries(value = "") {
        const source = String(value || "");
        const pattern = /(\[onliner-gallery[^\]]*\])([\s\S]*?)(\[\/onliner-gallery\])/gi;
        return [...source.matchAll(pattern)]
          .map((match, index) => {
            let items = [];
            try {
              const data = JSON.parse(match[2].trim());
              items = Array.isArray(data) ? data : [];
            } catch {
              items = [];
            }
            return {
              index,
              start: match.index,
              end: match.index + match[0].length,
              open: match[1],
              body: match[2],
              close: match[3],
              items,
            };
          })
          .filter((item) => item.items.length);
      },
      inlineRecords(value = "") {
        const source = String(value || "");
        return [...source.matchAll(/<img\b[^>]*>/gi)].map((match, index) => {
          const src = api.markup.image.attr(match[0], "src");
          return {
            kind: "inline",
            index,
            img: match[0],
            src,
            hash: api.markup.image.hash(src),
            start: match.index,
            end: match.index + match[0].length,
          };
        });
      },
      galleryRecords(value = "") {
        return api.markup.image.galleries(value).flatMap((gallery) =>
          gallery.items.map((item, itemIndex) => {
            const src = String(item?.src || "");
            return {
              kind: "gallery",
              galleryIndex: gallery.index,
              itemIndex,
              gallerySize: gallery.items.length,
              src,
              hash: api.markup.image.hash(src),
              start: gallery.start,
              end: gallery.end,
            };
          }),
        );
      },
      records(value = "") {
        return [
          ...api.markup.image.inlineRecords(value),
          ...api.markup.image.galleryRecords(value),
        ].sort((left, right) => left.start - right.start || left.end - right.end);
      },
      linkedCount(value = "") {
        return [
          ...String(value || "").matchAll(
            /<a\b[^>]*>\s*<img\b[^>]*>\s*<\/a>/gi,
          ),
        ].length;
      },
      groups(records = []) {
        return records.reduce((data, item) => {
          if (!item.hash) return data;
          data[item.hash] = [...(data[item.hash] || []), item];
          return data;
        }, {});
      },
      duplicates(records = []) {
        return Object.entries(api.markup.image.groups(records))
          .filter(([, items]) => items.length > 1)
          .map(([hash, items]) => ({ hash, count: items.length, items }));
      },
      candidateSafe(record, sizes = {}) {
        if (!record || record.kind !== "gallery") return false;
        const size = sizes[record.galleryIndex] ?? record.gallerySize;
        return size > 2;
      },
      candidateAdd(candidates = [], record = null, sizes = {}) {
        if (!api.markup.image.candidateSafe(record, sizes)) return candidates;
        sizes[record.galleryIndex] = (sizes[record.galleryIndex] ?? record.gallerySize) - 1;
        return [...candidates, record];
      },
      duplicateCandidates(duplicates = []) {
        const sizes = {};
        return duplicates.flatMap((duplicate) => {
          const inline = duplicate.items.filter((item) => item.kind === "inline");
          const galleries = duplicate.items.filter((item) => item.kind === "gallery");
          if (!galleries.length) return [];
          if (inline.length) {
            return galleries.reduce(
              (items, item) => api.markup.image.candidateAdd(items, item, sizes),
              [],
            );
          }
          const keep = [...galleries].sort(
            (left, right) =>
              left.gallerySize - right.gallerySize ||
              left.start - right.start ||
              left.itemIndex - right.itemIndex,
          )[0];
          return galleries
            .filter((item) => item !== keep)
            .sort(
              (left, right) =>
                right.gallerySize - left.gallerySize ||
                right.start - left.start ||
                right.itemIndex - left.itemIndex,
            )
            .reduce(
              (items, item) => api.markup.image.candidateAdd(items, item, sizes),
              [],
            );
        });
      },
      stats(value = "") {
        const records = api.markup.image.records(value);
        const duplicates = api.markup.image.duplicates(records);
        const candidates = api.markup.image.duplicateCandidates(duplicates);
        return {
          total: records.length,
          inline: records.filter((item) => item.kind === "inline").length,
          gallery: records.filter((item) => item.kind === "gallery").length,
          linked: api.markup.image.linkedCount(value),
          duplicates,
          candidates,
        };
      },
      unlinkAll(value = "") {
        return String(value || "").replace(
          /<a\b[^>]*>\s*(<img\b[^>]*>)\s*<\/a>/gi,
          "$1",
        );
      },
      removeGalleryItems(value = "", candidates = []) {
        if (!candidates.length) return String(value || "");
        const remove = candidates.reduce((data, item) => {
          const set = data[item.galleryIndex] || new Set();
          set.add(item.itemIndex);
          data[item.galleryIndex] = set;
          return data;
        }, {});
        return api.markup.image.galleries(value)
          .reverse()
          .reduce((source, gallery) => {
            const set = remove[gallery.index];
            if (!set || !set.size) return source;
            const items = gallery.items.filter((item, index) => !set.has(index));
            if (items.length < 2) return source;
            const next = `${gallery.open}${JSON.stringify(items)}${gallery.close}`;
            return source.slice(0, gallery.start) + next + source.slice(gallery.end);
          }, String(value || ""));
      },
    },
    resize(element) {
      const result = api.markup.image.toggle(
        element.value,
        element.selectionStart,
        element.selectionEnd,
      );
      if (!result) return false;
      element.value = result.value;
      return api.done(element, result.start, result.end);
    },
    cleanup: {
      duplicateText(duplicates = []) {
        return duplicates.map((item) => `${item.hash} — ${item.count}`).join("\n");
      },
      report(stats) {
        if (!stats.duplicates.length) return;
        alert(`⚠️ Дубликаты картинок:

${api.markup.cleanup.duplicateText(stats.duplicates)}`);
      },
      unlink(stats) {
        if (!stats.linked) return false;
        return confirm(
          `Кликабельные картинки: ${stats.linked} / ${stats.total}.
Снять ссылки?`,
        );
      },
      duplicate(stats) {
        if (!stats.candidates.length) return false;
        return confirm(
          `Автоудаляемые дубли в галереях: ${stats.candidates.length}.
Удалить?`,
        );
      },
      sync(element, value, start, end) {
        if (value === element.value) return false;
        element.value = value;
        return api.done(element, start, end);
      },
      run(cleanup) {
        const element = api.element();
        if (!element || typeof cleanup !== "function") return false;
        const result = cleanup(element.value, {
          start: element.selectionStart,
          end: element.selectionEnd,
        });
        if (!result || typeof result.value !== "string") return false;
        const stats = api.markup.image.stats(result.value);
        const unlink = api.markup.cleanup.unlink(stats);
        const dedupe = api.markup.cleanup.duplicate(stats);
        const value = [
          (current) => (unlink ? api.markup.image.unlinkAll(current) : current),
          (current) =>
            dedupe
              ? api.markup.image.removeGalleryItems(current, stats.candidates)
              : current,
        ].reduce((current, step) => step(current), result.value);
        const start = Math.min(result.start || 0, value.length);
        const end = Math.min(result.end || start, value.length);
        const changed = api.markup.cleanup.sync(element, value, start, end);
        api.markup.cleanup.report(api.markup.image.stats(value));
        return changed;
      },
    },
    step(list, current, reverse = false) {
      const index = Math.max(0, list.indexOf(current));
      const delta = reverse ? -1 : 1;
      return list[(index + delta + list.length) % list.length];
    },
    frame(value = "") {
      const string = String(value || "");
      const lead = string.match(/^\s*/)?.[0] || "";
      const trail = string.match(/\s*$/)?.[0] || "";
      return {
        lead,
        trail,
        body: string.slice(lead.length, string.length - trail.length),
      };
    },
    unwrap(value = "", tag = "") {
      const pattern = new RegExp(
        `^<${tag}\\b[^>]*>([\\s\\S]*)<\\/${tag}>$`,
        "i",
      );
      const match = String(value || "").match(pattern);
      return match ? match[1] : null;
    },
    inlineState(value = "") {
      const body = api.markup.frame(value).body;
      if (/^<strong\b[^>]*><em\b[^>]*>[\s\S]*<\/em><\/strong>$/i.test(body))
        return "strong-em";
      if (/^<em\b[^>]*><strong\b[^>]*>[\s\S]*<\/strong><\/em>$/i.test(body))
        return "strong-em";
      if (/^<strong\b[^>]*>[\s\S]*<\/strong>$/i.test(body)) return "strong";
      if (/^<em\b[^>]*>[\s\S]*<\/em>$/i.test(body)) return "em";
      return "plain";
    },
    inlineInner(value = "") {
      const body = api.markup.frame(value).body;
      const state = api.markup.inlineState(body);
      if (state === "strong") return api.markup.unwrap(body, "strong");
      if (state === "em") return api.markup.unwrap(body, "em");
      if (state === "strong-em") {
        const strong = api.markup.unwrap(body, "strong");
        if (strong !== null) return api.markup.unwrap(strong, "em");
        const em = api.markup.unwrap(body, "em");
        if (em !== null) return api.markup.unwrap(em, "strong");
        return null;
      }
      return body;
    },
    inlineBuild(value = "", mode = "plain") {
      if (mode === "em") return `<em>${value}</em>`;
      if (mode === "strong") return `<strong>${value}</strong>`;
      if (mode === "strong-em") return `<strong><em>${value}</em></strong>`;
      return value;
    },
    inlineTarget(current = "plain", mode = "cycle", reverse = false) {
      if (mode === "cycle") {
        return api.markup.step(api.markup.inlineModes, current, reverse);
      }
      if (mode === "italic") {
        return {
          plain: "em",
          em: "plain",
          strong: "strong-em",
          "strong-em": "strong",
        }[current] || "em";
      }
      if (mode === "bold") {
        return {
          plain: "strong",
          strong: "plain",
          em: "strong-em",
          "strong-em": "em",
        }[current] || "strong";
      }
      return api.markup.inlineModes.includes(mode) ? mode : current;
    },
    inlineExpand(value, start, end) {
      let from = start;
      let to = end;
      let changed = true;
      while (changed) {
        changed = false;
        const left = value.slice(0, from);
        const right = value.slice(to);
        [
          { open: "<strong>", close: "</strong>" },
          { open: "<em>", close: "</em>" },
        ].forEach((item) => {
          if (!left.endsWith(item.open)) return;
          if (!right.startsWith(item.close)) return;
          from -= item.open.length;
          to += item.close.length;
          changed = true;
        });
      }
      return { start: from, end: to };
    },
    inlineTag(value, start) {
      const em = api.tag(value, start, "em");
      const strong = api.tag(value, start, "strong");
      const list = [em, strong].filter(Boolean);
      if (!list.length) return null;
      return {
        start: Math.min(...list.map((item) => item.start)),
        end: Math.max(...list.map((item) => item.end)),
      };
    },
    inlineParagraphRange(value, start) {
      const source = String(value || "");
      const left = [...source.slice(0, start).matchAll(/\n\s*\n/g)].pop();
      const right = source.slice(start).match(/\n\s*\n/);
      const from = left ? left.index + left[0].length : 0;
      const to = right ? start + right.index : source.length;
      const range = api.trim(source, from, to);
      if (range.start === range.end) return null;
      return range;
    },
    inlineRange(value, start, end) {
      if (start === end) {
        const tag = api.markup.inlineTag(value, start);
        if (tag) return { ...tag, paragraph: false };
        const paragraph = api.markup.inlineParagraphRange(value, start);
        return paragraph ? { ...paragraph, paragraph: true } : null;
      }
      const range = api.trim(value, start, end);
      if (range.start === range.end) return null;
      return {
        ...api.markup.inlineExpand(value, range.start, range.end),
        paragraph: false,
      };
    },
    inlineQuoteBreak(value = "") {
      return /<\/(?:em|strong)>\s*—[\s\S]*?—\s*<(?:em|strong)\b/i.test(
        String(value || ""),
      );
    },
    inlineQuotePattern() {
      return /<strong\b[^>]*>\s*<em\b[^>]*>[\s\S]*?<\/em>\s*<\/strong>|<em\b[^>]*>\s*<strong\b[^>]*>[\s\S]*?<\/strong>\s*<\/em>|<em\b[^>]*>[\s\S]*?<\/em>|<strong\b[^>]*>[\s\S]*?<\/strong>/gi;
    },
    inlineSegmentData(value = "") {
      const source = String(value || "");
      const inner = api.markup.inlineInner(source);
      if (inner === null) return null;
      const start = source.indexOf(inner);
      if (start < 0) return null;
      return {
        inner,
        state: api.markup.inlineState(source),
        start,
        end: start + inner.length,
      };
    },
    inlineQuoteSegments(value = "") {
      const source = String(value || "");
      if (!api.markup.inlineQuoteBreak(source)) return [];
      return [...source.matchAll(api.markup.inlineQuotePattern())]
        .map((match) => {
          const data = api.markup.inlineSegmentData(match[0]);
          if (!data) return null;
          return {
            absStart: match.index,
            absEnd: match.index + match[0].length,
            source: match[0],
            inner: data.inner,
            state: data.state,
            innerStart: data.start,
            innerEnd: data.end,
          };
        })
        .filter(Boolean);
    },
    inlineQuoteState(value = "") {
      const segments = api.markup.inlineQuoteSegments(value);
      if (!segments.length) return "";
      const states = segments.map((item) => item.state);
      return states.every((state) => state === states[0]) ? states[0] : "plain";
    },
    inlineQuoteText(
      value = "",
      { mode = "plain", start = 0, end = start } = {},
    ) {
      const source = String(value || "");
      const segments = api.markup.inlineQuoteSegments(source);
      if (!segments.length) return null;
      const map = (offset = 0) => {
        const point = Math.max(0, Math.min(offset, source.length));
        let sourceAt = 0;
        let targetAt = 0;
        for (const segment of segments) {
          if (point <= segment.absStart) {
            return targetAt + point - sourceAt;
          }
          targetAt += segment.absStart - sourceAt;
          const body = api.markup.inlineBuild(segment.inner, mode);
          const bodyStart = Math.max(0, body.indexOf(segment.inner));
          if (point <= segment.absEnd) {
            const local = Math.max(
              0,
              Math.min(
                point - segment.absStart - segment.innerStart,
                segment.inner.length,
              ),
            );
            return targetAt + bodyStart + local;
          }
          targetAt += body.length;
          sourceAt = segment.absEnd;
        }
        return targetAt + point - sourceAt;
      };
      const parts = [];
      let at = 0;
      for (const segment of segments) {
        parts.push(source.slice(at, segment.absStart));
        parts.push(api.markup.inlineBuild(segment.inner, mode));
        at = segment.absEnd;
      }
      parts.push(source.slice(at));
      return {
        value: parts.join(""),
        start: map(start),
        end: map(end),
      };
    },
    inlineText(
      value,
      { start = 0, end = start, mode = "cycle", reverse = false } = {},
    ) {
      const range = api.markup.inlineRange(value, start, end);
      if (!range) return null;
      const source = value.slice(range.start, range.end);
      const frame = api.markup.frame(source);
      if (!frame.body) return null;
      const quoteState = range.paragraph
        ? api.markup.inlineQuoteState(frame.body)
        : "";
      const current = quoteState || api.markup.inlineState(frame.body);
      const target = api.markup.inlineTarget(current, mode, reverse);
      if (quoteState) {
        const quote = api.markup.inlineQuoteText(frame.body, {
          mode: target,
          start: Math.max(0, start - range.start - frame.lead.length),
          end: Math.max(0, end - range.start - frame.lead.length),
        });
        if (!quote) return null;
        const next = `${frame.lead}${quote.value}${frame.trail}`;
        return {
          value: value.slice(0, range.start) + next + value.slice(range.end),
          start: range.start + frame.lead.length + quote.start,
          end: range.start + frame.lead.length + quote.end,
        };
      }
      const inner = api.markup.inlineInner(frame.body);
      if (inner === null) return null;
      const body = api.markup.inlineBuild(inner, target);
      const next = `${frame.lead}${body}${frame.trail}`;
      const open = body.indexOf(inner);
      const from = range.start + frame.lead.length + Math.max(0, open);
      return {
        value: value.slice(0, range.start) + next + value.slice(range.end),
        start: from,
        end: from + inner.length,
      };
    },
    inline(element, options = {}) {
      const result = api.markup.inlineText(element.value, {
        start: element.selectionStart,
        end: element.selectionEnd,
        ...options,
      });
      if (!result) return false;
      element.value = result.value;
      return api.done(element, result.start, result.end);
    },
    blockLineState(value = "") {
      const body = api.markup.frame(value).body;
      if (/^<h2\b[^>]*>[\s\S]*<\/h2>$/i.test(body)) return "h2";
      if (/^<h3\b[^>]*>[\s\S]*<\/h3>$/i.test(body)) return "h3";
      return "plain";
    },
    blockLineInner(value = "") {
      const body = api.markup.frame(value).body;
      const state = api.markup.blockLineState(body);
      if (state === "h2") return api.markup.unwrap(body, "h2");
      if (state === "h3") return api.markup.unwrap(body, "h3");
      return body;
    },
    blockOpen(mode = "plain") {
      if (mode === "h2") return "<h2>";
      if (mode === "h3") return "<h3>";
      return "";
    },
    blockLineData(value = "") {
      const frame = api.markup.frame(value);
      const body = frame.body;
      if (!body) return null;
      const state = api.markup.blockLineState(body);
      const inner = api.markup.blockLineInner(body);
      if (inner === null) return null;
      const open =
        state === "h2"
          ? body.match(/^<h2\b[^>]*>/i)?.[0] || ""
          : state === "h3"
            ? body.match(/^<h3\b[^>]*>/i)?.[0] || ""
            : "";
      const bodyStart = frame.lead.length + open.length;
      return {
        frame,
        body,
        state,
        inner,
        bodyStart,
        bodyEnd: bodyStart + inner.length,
      };
    },
    blockLine(value = "", mode = "plain") {
      const data = api.markup.blockLineData(value);
      if (!data) return value;
      const body =
        mode === "h2"
          ? `<h2>${data.inner}</h2>`
          : mode === "h3"
            ? `<h3>${data.inner}</h3>`
            : data.inner;
      return `${data.frame.lead}${body}${data.frame.trail}`;
    },
    blockLineMap(value = "", mode = "plain", offset = 0) {
      const data = api.markup.blockLineData(value);
      if (!data) return Math.max(0, Math.min(offset, value.length));
      const targetStart =
        data.frame.lead.length + api.markup.blockOpen(mode).length;
      const local = Math.max(
        0,
        Math.min(offset - data.bodyStart, data.inner.length),
      );
      if (offset <= data.bodyStart) return targetStart;
      if (offset >= data.bodyEnd) return targetStart + data.inner.length;
      return targetStart + local;
    },
    blockState(value = "") {
      const states = String(value || "")
        .split(/\r?\n/)
        .map((line) => api.markup.frame(line).body)
        .filter(Boolean)
        .map((line) => api.markup.blockLineState(line));
      if (!states.length) return "plain";
      if (states.every((state) => state === "h2")) return "h2";
      if (states.every((state) => state === "h3")) return "h3";
      return "plain";
    },
    blockRange(value, start, end) {
      const from = value.lastIndexOf("\n", Math.max(0, start - 1)) + 1;
      const point = end > start && value[end - 1] === "\n" ? end - 1 : end;
      const right = value.indexOf("\n", Math.max(start, point));
      return {
        start: from,
        end: right < 0 ? value.length : right,
      };
    },
    blockMap(value = "", mode = "plain", offset = 0) {
      const parts = String(value || "").split(/(\r?\n)/);
      let sourceAt = 0;
      let targetAt = 0;
      for (const part of parts) {
        const lineBreak = /\r?\n/.test(part);
        const next = lineBreak ? part : api.markup.blockLine(part, mode);
        const sourceEnd = sourceAt + part.length;
        if (offset <= sourceEnd) {
          const local = Math.max(0, Math.min(offset - sourceAt, part.length));
          if (lineBreak) return targetAt + Math.min(local, next.length);
          return targetAt + api.markup.blockLineMap(part, mode, local);
        }
        sourceAt = sourceEnd;
        targetAt += next.length;
      }
      return targetAt;
    },
    blockText(
      value,
      { start = 0, end = start, mode = "cycle", reverse = false } = {},
    ) {
      const range = api.markup.blockRange(value, start, end);
      const source = value.slice(range.start, range.end);
      if (!api.markup.frame(source).body) return null;
      const current = api.markup.blockState(source);
      const target =
        mode === "cycle"
          ? api.markup.step(api.markup.blockModes, current, reverse)
          : api.markup.blockModes.includes(mode)
            ? mode
            : current;
      const next = source
        .split(/(\r?\n)/)
        .map((line) =>
          /\r?\n/.test(line) ? line : api.markup.blockLine(line, target),
        )
        .join("");
      const localStart = Math.max(
        0,
        Math.min(start - range.start, source.length),
      );
      const localEnd = Math.max(0, Math.min(end - range.start, source.length));
      return {
        value: value.slice(0, range.start) + next + value.slice(range.end),
        start:
          range.start + api.markup.blockMap(source, target, localStart),
        end: range.start + api.markup.blockMap(source, target, localEnd),
      };
    },
    block(element, options = {}) {
      const result = api.markup.blockText(element.value, {
        start: element.selectionStart,
        end: element.selectionEnd,
        ...options,
      });
      if (!result) return false;
      element.value = result.value;
      return api.done(element, result.start, result.end);
    },
  },
});
