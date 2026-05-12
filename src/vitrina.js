(() => {
  const app = {
    fields: [
      "#jform_title",
      "#jform_com_fields_subtitle",
      "#jform_com_fields_excerpt",
    ],
    init() {
      this.normalize.editor();
      this.normalize.fields();
    },
    normalize: {
      editor() {
        const editor = window.tinymce ? tinymce.get("jform_articletext") : null;
        const field = document.querySelector("#jform_articletext");
        if (editor) {
          editor.setContent(app.normalize.html(editor.getContent()));
          editor.save();
          return;
        }
        if (!field) {
          return;
        }
        field.value = app.normalize.html(field.value);
        app.trigger(field);
      },
      fields() {
        app.fields.forEach((selector) => {
          const field = document.querySelector(selector);
          if (!field) {
            return;
          }
          field.value = app.normalize.text(field.value);
          app.trigger(field);
        });
      },
      html(html) {
        const template = document.createElement("template");
        template.innerHTML = html;
        app.walk(template.content);
        return template.innerHTML;
      },
      text(text) {
        return [
          app.normalize.spaces,
          app.normalize.dash,
          app.normalize.nested,
          app.normalize.quotes,
        ].reduce((value, method) => {
          return method(value);
        }, text);
      },
      spaces(text) {
        return text
          .replace(/\u00a0/g, "\u0020")
          .replace(/[\u0020\u0009]{2,}/g, "\u0020")
          .replace(/\s+([,.!?;:])/g, "$1");
      },
      dash(text) {
        return text
          .replace(
            /(^|[\u0020\n\r\t])[\u002d\u2013\u2014]([\u0020\n\r\t]|$)/g,
            "$1\u2013$2",
          )
          .replace(
            /([\u0020\n\r\t])\u2013([\u0020\n\r\t])/g,
            "\u0020\u2013\u0020",
          );
      },
      nested(text) {
        return text
          .replace(
            /\u00ab([^"\u00ab\u00bb\n<>]+)\u00bb([^"\u00ab\u00bb\n<>]+)""/g,
            "\u00ab$1\u201e$2\u201c\u00bb",
          )
          .replace(
            /\u00ab([^"\u00ab\u00bb\n<>]+)\u00bb([^"\u00ab\u00bb\n<>]+)"(?=$|[\u0020\n\r\t,.!?;:])/g,
            "\u00ab$1\u201e$2\u201c\u00bb",
          );
      },
      quotes(text) {
        return text
          .replace(
            /(^|[\u0020\n\r\t])"([^"\n<>]+)"(?=$|[\u0020\n\r\t,.!?;:])/g,
            "$1\u00ab$2\u00bb",
          )
          .replace(
            /\u00ab([^"\u00ab\u00bb\n<>]+)"(?=$|[\u0020\n\r\t,.!?;:])/g,
            "\u00ab$1\u00bb",
          )
          .replace(/"([^"\u00ab\u00bb\n<>]+)\u00bb/g, "\u00ab$1\u00bb")
          .replace(
            /\u201e([^\u201e\u201c\u201d\n<>]+)[\u201c\u201d]/g,
            "\u00ab$1\u00bb",
          )
          .replace(/\u201c([^\u201c\u201d\n<>]+)\u201d/g, "\u00ab$1\u00bb");
      },
    },
    walk(node) {
      node.childNodes.forEach((child) => {
        if (child.nodeType === Node.TEXT_NODE) {
          child.nodeValue = this.normalize.text(child.nodeValue);
          return;
        }

        if (child.nodeType === Node.ELEMENT_NODE && !this.ignored(child)) {
          this.walk(child);
        }
      });
    },
    ignored(element) {
      return ["SCRIPT", "STYLE", "CODE", "PRE"].includes(element.tagName);
    },
    trigger(field) {
      field.dispatchEvent(new Event("input", { bubbles: true }));
      field.dispatchEvent(new Event("change", { bubbles: true }));
    },
  };
  app.init();
})();
