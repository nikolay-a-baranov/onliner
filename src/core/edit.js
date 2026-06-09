export const edit = {
  field: {
    valid(value) {
      if (!value) return false;
      if (typeof value.value !== "string") return false;
      if (typeof value.selectionStart !== "number") return false;
      if (typeof value.selectionEnd !== "number") return false;
      return true;
    },
    sync(element, value, start, end) {
      if (!edit.field.valid(element)) return false;
      if (value === element.value) return false;
      element.value = value;
      if (typeof start === "number") element.selectionStart = start;
      if (typeof end === "number") element.selectionEnd = end;
      element.focus();
      element.dispatchEvent(new Event("input", { bubbles: true }));
      element.dispatchEvent(new Event("change", { bubbles: true }));
      return true;
    },
  },
  state(element) {
    if (!edit.field.valid(element)) return null;
    return {
      value: element.value,
      start: element.selectionStart,
      end: element.selectionEnd,
    };
  },
  apply(element, run) {
    const value = edit.state(element);
    if (!value || typeof run !== "function") return false;
    const next = run(value);
    if (!next || typeof next.value !== "string") return false;
    const start = typeof next.start === "number" ? next.start : null;
    const end =
      typeof next.end === "number"
        ? next.end
        : typeof start === "number"
          ? start
          : null;
    return edit.field.sync(element, next.value, start, end);
  },
};
