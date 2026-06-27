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
      api.set(element, value.slice(0, data.start) + body + value.slice(data.end));
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
    api.set(
      element,
      value.slice(0, range.start) +
        before +
        string +
        after +
        value.slice(range.end),
    );
    return api.done(
      element,
      Math.min(start + before.length, element.value.length),
    );
  },
  tagPattern(name) {
    return new RegExp(`</?${name}\\b[^>]*>`, "gi");
  },
  clearTag(element, name) {
    const pattern = api.tagPattern(name);
    const next = element.value.replace(pattern, "");
    if (next === element.value) return false;
    const start = element.selectionStart;
    const end = element.selectionEnd;
    api.set(element, next);
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
    api.set(element, next);
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
  listPlain(value, start, end) {
    const text = value.slice(start, end);
    const data = { clean: "", map: [] };
    const tag = /<\/?[^>]+>/y;
    const entity = /&(?:nbsp|#160);/iy;
    let index = 0;
    while (index < text.length) {
      tag.lastIndex = index;
      entity.lastIndex = index;
      const tagged = tag.exec(text);
      const space = entity.exec(text);
      if (tagged) {
        index = tag.lastIndex;
        continue;
      }
      if (space) {
        data.clean += " ";
        data.map.push(start + index);
        index = entity.lastIndex;
        continue;
      }
      data.clean += text[index];
      data.map.push(start + index);
      index += 1;
    }
    return data;
  },
  listItems(value) {
    return [...String(value || "").matchAll(/<li(?:\s[^>]*)?>[\s\S]*?<\/li>/gi)].map(
      (match) => ({
        full: match[0],
        body: match[0]
          .replace(/^<li(?:\s[^>]*)?>/i, "")
          .replace(/<\/li>$/i, ""),
      }),
    );
  },
  listToc(value) {
    const items = api.listItems(value);
    if (!items.length) return false;
    return items.every((item) =>
      /<a\b[^>]*\bhref=(?:"|')#zag\d+(?:"|')[^>]*>[\s\S]*<\/a>/i.test(
        item.body.trim(),
      ),
    );
  },
  listTailPunct(value) {
    const data = api.listPlain(value, 0, value.length);
    let index = data.clean.length - 1;
    while (index >= 0 && /[\s\u00a0]/.test(data.clean[index])) index -= 1;
    if (index < 0 || !/[.,;:!?…]/.test(data.clean[index])) return value;
    const at = data.map[index];
    if (at === undefined) return value;
    return value.slice(0, at) + value.slice(at + 1);
  },
  listLetter(value, upper) {
    return String(value || "").replace(
      /^((?:<[^>]+>|\s|[«„“"'()])+)?([А-Яа-яA-Za-zЁё])/,
      (_, left = "", letter) =>
        `${left}${upper ? letter.toUpperCase() : letter.toLowerCase()}`,
    );
  },
  listLetterPlain(value, upper) {
    const quote = /[«»„“"'`]/;
    let at = -1;
    let index = 0;
    const source = String(value || "");
    while (index < source.length) {
      const tail = source.slice(index);
      const tag = tail.match(/^<\/?[^>]+>/);
      if (tag) {
        index += tag[0].length;
        continue;
      }
      const entity = tail.match(/^&[a-z0-9#]+;/i);
      if (entity) {
        if (!/^&(laquo|raquo|ldquo|rdquo|bdquo|quot|#171|#187|#8220|#8221|#8222|#34);/i.test(entity[0])) break;
        index += entity[0].length;
        continue;
      }
      const char = source[index];
      if (/\s/.test(char) || quote.test(char)) {
        index += 1;
        continue;
      }
      at = /[А-Яа-яA-Za-zЁё]/.test(char) ? index : -1;
      break;
    }
    if (at < 0) return source;
    const letter = source[at];
    const next = upper ? letter.toUpperCase() : letter.toLowerCase();
    if (next === letter) return source;
    return source.slice(0, at) + next + source.slice(at + 1);
  },
  listUnwrapSelection(value, start, end) {
    const source = String(value || "").slice(start, end).trim();
    const match = source.match(/^<(ul|ol)(?:\s[^>]*)?>\s*([\s\S]*?)\s*<\/\1>$/i);
    if (!match) return null;
    const rows = api.listItems(source)
      .map((item) => item.body.trim())
      .filter(Boolean);
    if (!rows.length) return null;
    return {
      start,
      end,
      value: rows.join("\n\n"),
    };
  },
  listSelection(value, start, end) {
    if (start === end) return null;
    const range = api.trim(value, start, end);
    if (range.start === range.end) return null;
    const unwrap = api.listUnwrapSelection(value, range.start, range.end);
    if (unwrap) return unwrap;
    const source = value.slice(range.start, range.end);
    if (/<(?:ul|ol|li)\b/i.test(source)) return null;
    const blocks = [...source.matchAll(/<p(?:\s[^>]*)?>([\s\S]*?)<\/p>/gi)].map(
      (item) => item[1],
    );
    const plainRows = source
      .split(/\r?\n/)
      .map((item) => item.trim())
      .filter(Boolean);
    const rows = (blocks.length ? blocks : plainRows)
      .map((item) =>
        item.replace(/^((?:<[^>]+>\s*)*)(?:[-•●▪◦]|\d+\.)\s+/i, "$1").trim(),
      )
      .filter(Boolean);
    if (!rows.length) return null;
    const items = rows.map((item) => `<li>${item}</li>`).join("\n");
    return {
      start: range.start,
      end: range.end,
      value: `<ul>\n${items}\n</ul>`,
    };
  },
  visualListRange(editor) {
    const body = editor?.getBody?.() || null;
    const range = editor?.selection?.getRng?.() || null;
    if (!body || !range || range.collapsed) return [];
    return [...body.children].filter((node) => {
      if (!node || !node.tagName) return false;
      if (typeof range.intersectsNode === "function") {
        try {
          return range.intersectsNode(node);
        } catch {
          return false;
        }
      }
      return false;
    });
  },
  visualListCurrent(editor) {
    const node = editor?.selection?.getNode?.() || null;
    const item = editor?.dom?.getParent?.(node, "li") || null;
    const list = item?.parentNode || null;
    const tag = String(list?.tagName || "").toLowerCase();
    if (!item || !["ul", "ol"].includes(tag)) return null;
    const items = [...list.children].filter((child) =>
      String(child.tagName || "").toLowerCase() === "li",
    );
    return { list, item, index: Math.max(0, items.indexOf(item)) };
  },
  visualListFake(value = "") {
    const open = String(value || "").match(/<li(?:\s[^>]*)?>/i);
    if (!open || open.index === undefined) return null;
    return {
      value,
      selectionStart: open.index + open[0].length,
      selectionEnd: open.index + open[0].length,
      dispatchEvent() {},
      focus() {},
    };
  },
  visualListCycle(editor, current) {
    const html = current?.list?.outerHTML || "";
    const fake = api.visualListFake(html);
    if (!fake) return false;
    const done = api.list(fake);
    if (!done || fake.value === html) return false;
    const template = editor.getDoc().createElement("div");
    template.innerHTML = fake.value.trim();
    const next = template.querySelector("ul,ol");
    if (!next) return false;
    current.list.innerHTML = next.innerHTML;
    const items = [...current.list.children].filter((child) =>
      String(child.tagName || "").toLowerCase() === "li",
    );
    api.editor.caretEnd(items[current.index] || items[0] || current.list);
    editor.focus?.();
    editor.save?.();
    return true;
  },
  visualListSelection(editor) {
    const blocks = api.visualListRange(editor);
    if (!blocks.length) return false;
    const doc = editor.getDoc?.() || null;
    const first = blocks[0];
    const parent = first?.parentNode || null;
    if (!doc || !parent) return false;
    const list = doc.createElement("ul");
    blocks.forEach((node) => {
      const item = doc.createElement("li");
      item.innerHTML = String(node.innerHTML || "")
        .replace(/^((?:<[^>]+>\s*)*)(?:[-•●▪◦]|\d+\.)\s+/i, "$1")
        .trim();
      if (item.innerHTML) list.appendChild(item);
    });
    if (!list.children.length) return false;
    parent.insertBefore(list, first);
    blocks.forEach((node) => node.parentNode?.removeChild(node));
    api.editor.caretEnd(list.children[0]);
    editor.focus?.();
    editor.save?.();
    return true;
  },
  visualList() {
    const editor = api.editor.tiny();
    if (!editor) return false;
    const current = api.visualListCurrent(editor);
    if (current) return api.visualListCycle(editor, current);
    if (!editor.selection?.isCollapsed?.()) return api.visualListSelection(editor);
    return false;
  },
  list(element) {
    if (!element && api.editor.visual()) return api.visualList();
    if (!element) return false;
    const start = element.selectionStart;
    const end = element.selectionEnd;
    const value = element.value;
    const selection = api.listSelection(value, start, end);
    if (selection) {
      api.set(
        element,
        value.slice(0, selection.start) +
          selection.value +
          value.slice(selection.end),
      );
      return api.done(element, selection.start);
    }
    const html = api.listTag(value, start);
    if (!html) return false;
    const string = value.slice(html.start, html.end);
    const toc = api.listToc(string);
    const semicolon =
      /<\/li>\s*<li/i.test(string) && /;\s*<\/li>/i.test(string);
    const mode = semicolon ? "." : ";";
    const next = string.replace(
      /<li(?:\s[^>]*)?>([\s\S]*?)<\/li>/gi,
      (_, item) => {
        const text = item
          .trim()
          .replace(/^((?:<[^>]+>\s*)*)(?:[-•●▪◦]|\d+\.)\s+/i, "$1");
        const clear = api.listTailPunct(text);
        const letter = toc
          ? api.listLetterPlain(clear, true)
          : api.listLetter(clear, mode === ".");
        return `<li>${letter}${toc ? "" : mode}</li>`;
      },
    );
    const result =
      !toc && mode === ";"
        ? next.replace(/;(<\/li>\s*<\/(?:ul|ol)>)/i, ".$1")
        : next;
    api.set(element, value.slice(0, html.start) + result + value.slice(html.end));
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
    api.set(element, value.slice(0, block.start) + next + value.slice(block.end));
    return api.done(element, start);
  },
  markup: {
    inlineModes: ["plain", "em", "strong", "strong-em"],
    blockModes: ["plain", "h2", "h3", "blockquote"],
    escape(value = "") {
      return String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
    },
    clipboard: {
      async text() {
        try {
          return String(await navigator.clipboard.readText() || "").trim();
        } catch {
          return "";
        }
      },
    },
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
      api.set(element, result.value);
      return api.doneData(element, result);
    },
    interview: {
      run() {
        alert("Интервью пока не собрано");
        return true;
      },
    },
    caption: {
      item(element) {
        const value = element.value;
        const start = element.selectionStart;
        const end = element.selectionEnd;
        return (
          api.markup.image.linked(value, start, end) ||
          api.markup.image.plain(value, start, end)
        );
      },
      text(item = null, value = "") {
        const current = String(value || "").trim();
        if (current && !/^https?:\/\//i.test(current)) return current;
        return prompt("Подпись", api.markup.image.attr(item?.img || "", "alt")) || "";
      },
      wrap(value = "", item = null, caption = "") {
        if (!item || !caption.trim()) return null;
        const source = value.slice(item.start, item.end);
        const text = caption.trim();
        const escaped = api.markup.escape(text);
        const html = `<dl class="wp-caption aligncenter"><dt class="wp-caption-dt">${source}</dt><dd class="wp-caption-dd">${escaped}</dd></dl>`;
        const bodyStart = item.start + html.indexOf(escaped);
        return {
          value: value.slice(0, item.start) + html + value.slice(item.end),
          start: bodyStart,
          end: bodyStart + caption.trim().length,
        };
      },
      async run() {
        const element = api.element();
        if (!element) return false;
        const item = api.markup.caption.item(element);
        if (!item) return false;
        const caption = api.markup.caption.text(
          item,
          await api.markup.clipboard.text(),
        );
        const result = api.markup.caption.wrap(element.value, item, caption);
        if (!result) return false;
        api.set(element, result.value);
        return api.doneData(element, result);
      },
    },
    link: {
      email(value = "") {
        const email = String(value || "")
          .trim()
          .replace(/^mailto:\s*/i, "");
        return /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(email)
          ? email
          : "";
      },
      url(value = "") {
        const url = String(value || "").trim();
        return /^https?:\/\/[^\s"'<>]+$/i.test(url) ? url : "";
      },
      target(value = "") {
        const url = api.markup.link.url(value);
        if (url) return { href: url, blank: true };
        const email = api.markup.link.email(value);
        if (email) return { href: `mailto:${email}`, blank: false };
        return null;
      },
      text(value = "") {
        return String(value || "")
          .replace(/<[^>]*>/g, "")
          .replace(/&nbsp;|&#160;/gi, " ")
          .trim();
      },
      tag(value = "", start = 0) {
        const left = value.lastIndexOf("<", start);
        const right = value.lastIndexOf(">", start);
        return left > right;
      },
      anchor(value = "", start = 0, end = start) {
        return [...String(value || "").matchAll(/<a\b[^>]*>[\s\S]*?<\/a>/gi)]
          .some((match) => api.markup.image.inside(start, end, match.index, match[0].length));
      },
      targetRange(value = "", start = 0, end = start) {
        if (api.markup.link.anchor(value, start, end)) return null;
        if (start !== end) {
          const range = api.trim(value, start, end);
          return api.markup.link.target(api.markup.link.text(value.slice(range.start, range.end)))
            ? range
            : null;
        }
        if (api.markup.link.tag(value, start)) return null;
        const source = String(value || "");
        const pattern = /(?:https?:\/\/[^\s"'<>]+|[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,})/gi;
        for (const match of source.matchAll(pattern)) {
          const from = match.index;
          const to = from + match[0].length;
          if (start >= from && start <= to) return { start: from, end: to };
        }
        return null;
      },
      range(value = "", start = 0, end = start) {
        if (api.markup.link.anchor(value, start, end)) return null;
        if (start !== end) return api.trim(value, start, end);
        if (api.markup.link.tag(value, start)) return null;
        const left = value.slice(0, start).match(/[\p{L}\d_.-]+$/u);
        const right = value.slice(start).match(/^[\p{L}\d_.-]+/u);
        const from = start - (left ? left[0].length : 0);
        const to = start + (right ? right[0].length : 0);
        return from === to ? null : { start: from, end: to };
      },
      wrap(value = "", range = null, target = null) {
        if (!range || !target?.href) return null;
        const body = value.slice(range.start, range.end);
        if (!body.trim()) return null;
        const blank = target.blank ? ' target="_blank"' : "";
        const open = `<a href="${api.markup.escape(target.href)}"${blank}>`;
        const html = `${open}${body}</a>`;
        return {
          value: value.slice(0, range.start) + html + value.slice(range.end),
          start: range.start + open.length,
          end: range.start + open.length + body.length,
        };
      },
      async run() {
        const element = api.element();
        if (!element) return false;
        const value = element.value;
        const start = element.selectionStart;
        const end = element.selectionEnd;
        const directRange = api.markup.link.targetRange(value, start, end);
        const directTarget = directRange
          ? api.markup.link.target(api.markup.link.text(value.slice(directRange.start, directRange.end)))
          : null;
        const range = directRange || api.markup.link.range(value, start, end);
        const target = directTarget || api.markup.link.target(await api.markup.clipboard.text());
        const result = api.markup.link.wrap(value, range, target);
        if (!result) return false;
        api.set(element, result.value);
        return api.doneData(element, result);
      },
    },
    separatorData: {
      marker: "<hr />",
      match(value = "") {
        return /^<hr\s*\/?>$/i.test(String(value || "").trim());
      },
      current(value = "", start = 0) {
        const source = String(value || "");
        const point = Math.max(0, Math.min(start, source.length));
        const left = source.lastIndexOf("\n", Math.max(0, point - 1));
        const right = source.indexOf("\n", point);
        return {
          start: left + 1,
          end: right < 0 ? source.length : right,
        };
      },
      previous(value = "", line = null) {
        if (!line || line.start <= 0) return null;
        const source = String(value || "");
        const end = line.start - 1;
        const left = source.lastIndexOf("\n", Math.max(0, end - 1));
        return { start: left + 1, end };
      },
      next(value = "", line = null) {
        const source = String(value || "");
        if (!line || line.end >= source.length) return null;
        const start = line.end + 1;
        const right = source.indexOf("\n", start);
        return {
          start,
          end: right < 0 ? source.length : right,
        };
      },
      nearby(value = "", start = 0) {
        const current = api.markup.separatorData.current(value, start);
        return [
          current,
          api.markup.separatorData.previous(value, current),
          api.markup.separatorData.next(value, current),
        ].find((line) =>
          line && api.markup.separatorData.match(value.slice(line.start, line.end)),
        ) || null;
      },
      remove(value = "", line = null) {
        if (!line) return null;
        const source = String(value || "");
        let start = line.start;
        let end = line.end;
        if (end < source.length && source[end] === "\n") {
          end += 1;
        } else if (start > 0 && source[start - 1] === "\n") {
          start -= 1;
        }
        return {
          value: source.slice(0, start) + source.slice(end),
          start,
          end: start,
        };
      },
      insert(value = "", line = null) {
        if (!line) return null;
        const source = String(value || "");
        const marker = api.markup.separatorData.marker;
        const text = source.slice(line.start, line.end);
        if (!text.trim()) {
          return {
            value: source.slice(0, line.start) + marker + source.slice(line.end),
            start: line.start,
            end: line.start + marker.length,
          };
        }
        const start = line.end + 1;
        return {
          value: source.slice(0, line.end) + `\n${marker}` + source.slice(line.end),
          start,
          end: start + marker.length,
        };
      },
    },
    separator(element) {
      const value = element.value;
      const current = api.markup.separatorData.current(
        value,
        element.selectionStart,
      );
      const nearby = api.markup.separatorData.nearby(
        value,
        element.selectionStart,
      );
      const result = nearby
        ? api.markup.separatorData.remove(value, nearby)
        : api.markup.separatorData.insert(value, current);
      if (!result || result.value === value) return false;
      api.set(element, result.value);
      return api.doneData(element, result);
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
        api.set(element, value);
        return api.done(element, start, end);
      },
      run(cleanup) {
        if (typeof cleanup !== "function") return false;
        return api.editor.document((state) => {
          const result = cleanup(state.value, {
            start: state.start,
            end: state.end,
          });
          if (!result || typeof result.value !== "string") return null;
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
          api.markup.cleanup.report(api.markup.image.stats(value));
          return {
            value,
            start: Math.min(result.start || 0, value.length),
            end: Math.min(result.end || result.start || 0, value.length),
          };
        }, { focus: false });
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
    inlineStrip(value = "", tags = []) {
      return tags.reduce(
        (current, tag) =>
          current.replace(new RegExp(`</?${tag}\\b[^>]*>`, "gi"), ""),
        String(value || ""),
      );
    },
    inlineClean(value = "", mode = "plain") {
      if (mode === "em") return api.markup.inlineStrip(value, ["em"]);
      if (mode === "strong") return api.markup.inlineStrip(value, ["strong"]);
      if (mode === "strong-em" || mode === "plain") {
        return api.markup.inlineStrip(value, ["strong", "em"]);
      }
      return String(value || "");
    },
    clear: {
      options: [
        { name: "em", question: "Минус косой?" },
        { name: "strong", question: "Минус жирный?" },
      ],
      range(element) {
        const start = element.selectionStart || 0;
        const end = element.selectionEnd || start;
        if (start !== end) return { start, end, selected: true };
        return { start, end: element.value.length, selected: false };
      },
      has(value = "", name = "") {
        return new RegExp(`</?${name}\b[^>]*>`, "i").test(String(value || ""));
      },
      present(value = "") {
        return api.markup.clear.options.filter((item) =>
          api.markup.clear.has(value, item.name),
        );
      },
      warning(range) {
        return range.selected
          ? "Очистить форматирование в выделенном фрагменте?"
          : "Очистить форматирование от курсора до конца материала?";
      },
      confirm(items = [], range = {}) {
        if (!items.length) return [];
        if (!confirm(api.markup.clear.warning(range))) return [];
        return items
          .filter((item) => confirm(item.question))
          .map((item) => item.name);
      },
      clean(value = "", tags = []) {
        return api.markup.inlineStrip(value, tags);
      },
      run(element) {
        if (!element) return false;
        const range = api.markup.clear.range(element);
        const source = element.value || "";
        const fragment = source.slice(range.start, range.end);
        const tags = api.markup.clear.confirm(
          api.markup.clear.present(fragment),
          range,
        );
        if (!tags.length) return false;
        const next = api.markup.clear.clean(fragment, tags);
        if (next === fragment) return false;
        api.set(
          element,
          source.slice(0, range.start) + next + source.slice(range.end),
        );
        const end = range.selected ? range.start + next.length : range.start;
        return api.done(element, range.start, end);
      },
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
    inlineBlockRange(value = "", start = 0) {
      const source = String(value || "");
      const point = Math.max(0, Math.min(start, source.length));
      const pattern = /<\/?(p|h[1-6]|blockquote|li|dt|dd)\b[^>]*>/gi;
      const stack = [];
      let found = null;
      for (const match of source.matchAll(pattern)) {
        const full = match[0];
        const tag = match[1].toLowerCase();
        if (/^<\//.test(full)) {
          const index = stack.map((item) => item.tag).lastIndexOf(tag);
          if (index < 0) continue;
          const item = stack.splice(index, 1)[0];
          if (point >= item.openEnd && point <= match.index) {
            found = { start: item.openEnd, end: match.index };
          }
          continue;
        }
        stack.push({
          tag,
          openEnd: match.index + full.length,
        });
      }
      if (!found) return null;
      const range = api.trim(source, found.start, found.end);
      if (range.start === range.end) return null;
      return range;
    },
    inlineParagraphRange(value, start) {
      const source = String(value || "");
      const point = Math.max(0, Math.min(start, source.length));
      const block = api.markup.inlineBlockRange(source, point);
      if (block) return block;
      const structural = "<\/?(?:ul|ol|li|table|tbody|thead|tr|td|th|figure|dl|dt|dd|script|style|blockquote|h[1-6]|p)\\b[^>]*>|<(?:img|hr|iframe)\\b[^>]*\\/?>";
      const leftBreak = [...source.slice(0, point).matchAll(/\n\s*\n/g)].pop();
      const rightBreak = source.slice(point).match(/\n\s*\n/);
      const leftBlock = [...source.slice(0, point).matchAll(new RegExp(structural, "gi"))].pop();
      const rightBlock = source.slice(point).match(new RegExp(structural, "i"));
      const fromBreak = leftBreak ? leftBreak.index + leftBreak[0].length : 0;
      const fromBlock = leftBlock ? leftBlock.index + leftBlock[0].length : 0;
      const toBreak = rightBreak ? point + rightBreak.index : source.length;
      const toBlock = rightBlock ? point + rightBlock.index : source.length;
      const range = api.trim(
        source,
        Math.max(fromBreak, fromBlock),
        Math.min(toBreak, toBlock),
      );
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
      const clean = api.markup.inlineClean(inner, target);
      const body = api.markup.inlineBuild(clean, target);
      const next = `${frame.lead}${body}${frame.trail}`;
      const open = body.indexOf(clean);
      const from = range.start + frame.lead.length + Math.max(0, open);
      if (range.paragraph && start === end) {
        const bodyStart = Math.max(0, frame.body.indexOf(inner));
        const local = Math.max(
          0,
          Math.min(start - range.start - frame.lead.length - bodyStart, clean.length),
        );
        const point = from + local;
        return {
          value: value.slice(0, range.start) + next + value.slice(range.end),
          start: point,
          end: point,
        };
      }
      return {
        value: value.slice(0, range.start) + next + value.slice(range.end),
        start: from,
        end: from + clean.length,
      };
    },
    visualInlineState(editor, selected = "") {
      const bold = Boolean(editor?.queryCommandState?.("Bold"));
      const italic = Boolean(editor?.queryCommandState?.("Italic"));
      if (bold && italic) return "strong-em";
      if (bold) return "strong";
      if (italic) return "em";
      return api.markup.inlineState(selected);
    },
    visualInlineFlags(mode = "plain") {
      return {
        bold: mode === "strong" || mode === "strong-em",
        italic: mode === "em" || mode === "strong-em",
      };
    },
    visualFormat(editor, name = "", active = false, target = false) {
      if (active === target) return;
      const command = name === "bold" ? "Bold" : "Italic";
      if (editor?.formatter && target) {
        editor.formatter.apply(name);
        return;
      }
      if (editor?.formatter && !target) {
        editor.formatter.remove(name);
        return;
      }
      editor?.execCommand?.(command);
    },
    visualInlineSelection(editor, options = {}) {
      const selected = editor.selection?.getContent?.({ format: "html" }) || "";
      if (!selected) return false;
      const current = api.markup.visualInlineState(editor, selected);
      const target = api.markup.inlineTarget(
        current,
        options.mode || "cycle",
        Boolean(options.reverse),
      );
      const state = api.markup.visualInlineFlags(current);
      const next = api.markup.visualInlineFlags(target);
      api.markup.visualFormat(editor, "bold", state.bold, next.bold);
      api.markup.visualFormat(editor, "italic", state.italic, next.italic);
      editor.focus?.();
      editor.save?.();
      return true;
    },
    visualInlineBlock(editor, options = {}) {
      const node = api.editor.blockNode();
      if (!node) return false;
      const result = api.markup.inlineText(node.innerHTML, {
        start: 0,
        end: 0,
        mode: options.mode || "cycle",
        reverse: Boolean(options.reverse),
      });
      if (!result || typeof result.value !== "string") return false;
      if (node.innerHTML === result.value) return false;
      node.innerHTML = result.value;
      api.editor.caretEnd(node);
      editor.focus?.();
      editor.save?.();
      return true;
    },
    visualInline(options = {}) {
      const editor = api.editor.tiny();
      if (!editor) return false;
      if (!editor.selection?.isCollapsed?.()) {
        return api.markup.visualInlineSelection(editor, options);
      }
      return api.markup.visualInlineBlock(editor, options);
    },
    inlineStateActive(state = "plain", mode = "cycle") {
      if (mode === "italic") return state === "em" || state === "strong-em";
      if (mode === "bold") return state === "strong" || state === "strong-em";
      return state !== "plain";
    },
    inlineActive(element, options = {}) {
      const mode = options.mode || "cycle";
      if (!element && api.editor.visual()) {
        const editor = api.editor.tiny();
        if (!editor) return false;
        const selected = editor.selection?.getContent?.({ format: "html" }) || "";
        const state = api.markup.visualInlineState(editor, selected);
        return api.markup.inlineStateActive(state, mode);
      }
      if (!element) return false;
      const start = element.selectionStart;
      const end = element.selectionEnd;
      const value = element.value;
      const range = api.markup.inlineRange(value, start, end);
      if (!range) return false;
      const source = value.slice(range.start, range.end);
      const frame = api.markup.frame(source);
      if (!frame.body) return false;
      const state = range.paragraph
        ? api.markup.inlineQuoteState(frame.body) || api.markup.inlineState(frame.body)
        : api.markup.inlineState(frame.body);
      return api.markup.inlineStateActive(state, mode);
    },
    inline(element, options = {}) {
      if (!element && api.editor.visual()) return api.markup.visualInline(options);
      const run = (state) => api.markup.inlineText(state.value, {
        start: state.start,
        end: state.end,
        ...options,
      });
      if (!element) return api.editor.document(run);
      const result = run({
        value: element.value,
        start: element.selectionStart,
        end: element.selectionEnd,
      });
      if (!result) return false;
      api.set(element, result.value);
      return api.doneData(element, result);
    },
    blockInnerClean(value = "") {
      return String(value || "").replace(
        /<span\s+style=(["'])\s*font-size:\s*13px;?\s*\1>([\s\S]*?)<\/span>/gi,
        "$2",
      );
    },
    blockLineState(value = "") {
      const body = api.markup.frame(value).body;
      if (/^<h2\b[^>]*>[\s\S]*<\/h2>$/i.test(body)) return "h2";
      if (/^<h3\b[^>]*>[\s\S]*<\/h3>$/i.test(body)) return "h3";
      if (/^<blockquote\b[^>]*>[\s\S]*<\/blockquote>$/i.test(body)) {
        return "blockquote";
      }
      return "plain";
    },
    blockLineInner(value = "") {
      const body = api.markup.frame(value).body;
      const state = api.markup.blockLineState(body);
      if (state === "h2") {
        return api.markup.blockInnerClean(api.markup.unwrap(body, "h2"));
      }
      if (state === "h3") {
        return api.markup.blockInnerClean(api.markup.unwrap(body, "h3"));
      }
      if (state === "blockquote") {
        return api.markup.blockInnerClean(api.markup.unwrap(body, "blockquote"));
      }
      return api.markup.blockInnerClean(body);
    },
    blockOpen(mode = "plain") {
      if (mode === "h2") return "<h2>";
      if (mode === "h3") return "<h3>";
      if (mode === "blockquote") return "<blockquote>";
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
            : state === "blockquote"
              ? body.match(/^<blockquote\b[^>]*>/i)?.[0] || ""
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
            : mode === "blockquote"
              ? `<blockquote>${data.inner}</blockquote>`
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
      if (states.every((state) => state === "blockquote")) return "blockquote";
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
    visualBlock(options = {}) {
      const node = api.editor.blockNode();
      if (!node) return false;
      node.innerHTML = api.markup.blockInnerClean(node.innerHTML);
      const current = api.editor.blockMode(node);
      const target =
        options.mode === "cycle" || !options.mode
          ? api.markup.step(
              api.markup.blockModes,
              current,
              Boolean(options.reverse),
            )
          : api.markup.blockModes.includes(options.mode)
            ? options.mode
            : current;
      return Boolean(api.editor.replaceBlock(node, target));
    },
    blockActive(element) {
      if (!element && api.editor.visual()) {
        return api.editor.blockMode() !== "plain";
      }
      if (!element) return false;
      const start = element.selectionStart;
      const end = element.selectionEnd;
      const value = element.value;
      const range = api.markup.blockRange(value, start, end);
      const source = value.slice(range.start, range.end);
      if (!api.markup.frame(source).body) return false;
      return api.markup.blockState(source) !== "plain";
    },
    block(element, options = {}) {
      if (!element && api.editor.visual()) return api.markup.visualBlock(options);
      const run = (state) => api.markup.blockText(state.value, {
        start: state.start,
        end: state.end,
        ...options,
      });
      if (!element) return api.editor.document(run);
      const result = run({
        value: element.value,
        start: element.selectionStart,
        end: element.selectionEnd,
      });
      if (!result) return false;
      api.set(element, result.value);
      return api.doneData(element, result);
    },
  },
});
