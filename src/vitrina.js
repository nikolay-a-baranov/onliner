(() => {
  const app = {
    fields: [
      "#jform_title",
      "#jform_com_fields_subtitle",
      "#jform_com_fields_excerpt",
    ],
    init() {
      if (document.readyState !== "complete") {
        return;
      }
      this.normalizeEditor();
      this.normalizeFields();
    },
    normalizeEditor() {
      const field = document.querySelector("#jform_articletext");
      if (!field) {
        return;
      }
      const editor = window.tinymce ? tinymce.get("jform_articletext") : null;
      if (editor) {
        editor.setContent(this.normalizeHtml(editor.getContent()));
        editor.save();
        return;
      }
      field.value = this.normalizeHtml(field.value);
      this.trigger(field);
    },
    normalizeFields() {
      this.fields.forEach((selector) => {
        const field = document.querySelector(selector);
        if (!field) {
          return;
        }
        field.value = this.normalizeText(field.value);
        this.trigger(field);
      });
    },
    normalizeHtml(html) {
      const template = document.createElement("template");
      template.innerHTML = html;
      this.walk(template.content);
      return template.innerHTML;
    },
    walk(node) {
      node.childNodes.forEach((child) => {
        if (child.nodeType === Node.TEXT_NODE) {
          child.nodeValue = this.normalizeText(child.nodeValue);
          return;
        }
        if (child.nodeType === Node.ELEMENT_NODE && !this.isIgnored(child)) {
          this.walk(child);
        }
      });
    },
    isIgnored(element) {
      return ["SCRIPT", "STYLE", "CODE", "PRE"].includes(element.tagName);
    },
    normalizeText(text) {
      return text
        .replace(/\u00a0/g, "\u0020")
        .replace(/[\u0020\u0009]{2,}/g, "\u0020")
        .replace(/\s+([,.!?;:])/g, "$1")
        .replace(/\s*[\u002d\u2013\u2014]\s*/g, "\u00a0\u2013\u0020")
        .replace(/"([^"\n<>]+)"/g, "\u00ab$1\u00bb")
        .replace(
          /\u201e([^\u201e\u201c\u201d\n<>]+)[\u201c\u201d]/g,
          "\u00ab$1\u00bb",
        )
        .replace(/\u201c([^\u201c\u201d\n<>]+)\u201d/g, "\u00ab$1\u00bb");
    },
    trigger(field) {
      field.dispatchEvent(new Event("input", { bubbles: true }));
      field.dispatchEvent(new Event("change", { bubbles: true }));
    },
  };
  app.init();
})();
