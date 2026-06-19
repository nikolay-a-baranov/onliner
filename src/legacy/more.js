export const more = {
  token: "<!--more-->",
  field: {
    valid(value) {
      if (!value) return false;
      if (typeof value.value !== "string") return false;
      if (typeof value.selectionStart !== "number") return false;
      if (typeof value.selectionEnd !== "number") return false;
      return true;
    },
    sync(element, value, start, end) {
      if (!more.field.valid(element)) return false;
      if (value === element.value) return false;
      element.value = value;
      if (typeof start === "number") element.selectionStart = start;
      if (typeof end === "number") element.selectionEnd = end;
      element.focus();
      element.dispatchEvent(new Event("input", { bubbles: true }));
      element.dispatchEvent(new Event("change", { bubbles: true }));
      return true;
    },
    insert(element, next) {
      if (!more.field.valid(element) || !next) return false;
      const start = element.selectionStart;
      const end = element.selectionEnd;
      const before = element.value.slice(0, start);
      const after = element.value.slice(end);
      const value = `${before}${next}${after}`;
      const caret = before.length + next.length;
      return more.field.sync(element, value, caret, caret);
    },
    select(element, start, end) {
      if (!more.field.valid(element)) return false;
      const from = Math.max(0, Math.min(start, element.value.length));
      const to = Math.max(0, Math.min(end, element.value.length));
      element.focus();
      element.selectionStart = from;
      element.selectionEnd = to;
      return true;
    },
  },
  run(element) {
    if (!more.field.valid(element)) return false;
    const index = element.value.indexOf(more.token);
    if (index >= 0) {
      return more.field.select(element, index, index + more.token.length);
    }
    return more.field.insert(element, more.token);
  },
};
