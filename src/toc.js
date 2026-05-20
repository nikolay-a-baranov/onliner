(() => {
  const editor = {
    get() {
      if (window.tinyMCE && tinyMCE.get("content")) {
        tinyMCE.triggerSave();
      }
      return document.querySelector("#content");
    },
    set(field, value) {
      field.value = value;
      field.dispatchEvent(new Event("input", { bubbles: true }));
      field.dispatchEvent(new Event("change", { bubbles: true }));
      if (
        window.tinyMCE &&
        tinyMCE.get("content") &&
        !tinyMCE.get("content").isHidden()
      ) {
        tinyMCE.get("content").setContent(value);
      }
    },
  };
  const entity = {
    decode(value) {
      const field = document.createElement("textarea");
      field.innerHTML = value;
      return field.value;
    },
  };
  const heading = {
    skip(tag) {
      return /\sid=(?:"toc"|'toc'|toc)(?:\s|>)/i.test(tag);
    },
    clean(value) {
      return value.replace(
        /^\s*<a\b[^>]*\bname=(?:"zag\d+"|'zag\d+'|zag\d+)[^>]*>\s*<\/a>\s*/i,
        "",
      );
    },
    title(value) {
      return entity.decode(
        value
          .replace(/<[^>]+>/g, "")
          .replace(/\s+/g, " ")
          .trim(),
      );
    },
    tag(value, id) {
      return value.replace(/^<h2\b([^>]*)>/i, (_, attrs) => {
        const clean = attrs.replace(/\s+id=(?:"[^"]*"|'[^']*'|[^\s>]+)/i, "");
        return `<h2${clean} id="${id}">`;
      });
    },
    replace(value, items) {
      return value.replace(/<h2\b[^>]*>[\s\S]*?<\/h2>/gi, (match) => {
        const tag = match.match(/^<h2\b[^>]*>/i)[0];
        if (heading.skip(tag)) return match;
        const id = `zag${items.length}`;
        const inner = match
          .replace(/^<h2\b[^>]*>/i, "")
          .replace(/<\/h2>$/i, "");
        const content = heading.clean(inner);
        items.push({ id, title: heading.title(content) });
        return `${heading.tag(tag, id)}<a name="${id}"></a>${content}</h2>`;
      });
    },
  };
  const toc = {
    build(items) {
      return [
        '<h2 id="toc">О чем эта статья</h2>',
        "<ul>",
        ...items.map(
          (item) => `\t<li><a href="#${item.id}">${item.title}</a></li>`,
        ),
        "</ul>",
      ].join("\n");
    },
    remove(value) {
      return value.replace(
        /\n?\s*<h[23]\b[^>]*>\s*О чем эта статья\s*<\/h[23]>\s*<ul>\s*[\s\S]*?<\/ul>\s*/i,
        "\n",
      );
    },
    insert(value, content) {
      if (!/<!--more-->/i.test(value)) return value;
      return value.replace(/<!--more-->/i, `<!--more-->\n\n${content}\n`);
    },
  };
  const compose = {
    run(value) {
      const items = [];
      const clean = toc.remove(value);
      const content = heading.replace(clean, items);
      if (!items.length) return value;
      return toc.insert(content, toc.build(items));
    },
  };
  const field = editor.get();
  if (!field) return;
  const result = compose.run(field.value);
  if (result === field.value) return;
  editor.set(field, result);
})();
