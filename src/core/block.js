import { transform } from "./transform.js";
import { field } from "./dom.js";

export const block = {
  field: {
    valid(value) {
      if (!value) return false;
      if (typeof value.value !== "string") return false;
      if (typeof value.selectionStart !== "number") return false;
      if (typeof value.selectionEnd !== "number") return false;
      return true;
    },
    sync(element, value, start, end) {
      if (!block.field.valid(element)) return false;
      if (value === element.value) return false;
      field.set(element, value);
      if (typeof start === "number") element.selectionStart = start;
      if (typeof end === "number") element.selectionEnd = end;
      element.focus();
      field.emit(element);
      return true;
    },
  },
  insert(element, content, caretOffset = null) {
    if (!block.field.valid(element) || !content) return false;
    const range = transform.scope.block(
      element.value,
      element.selectionStart,
      element.selectionEnd,
    );
    if (!range) return false;
    const source = element.value;
    const left = source.slice(0, range.end).replace(/[ \t]+$/g, "");
    const rightSource = source.slice(range.end);
    const rightTrimmed = rightSource.replace(/^[ \t]+/g, "");
    const right =
      rightTrimmed && !/^\n\n/.test(rightTrimmed)
        ? rightTrimmed.replace(/^\n+/g, "")
        : rightTrimmed;
    const beforeGap = left ? (/\n\n$/.test(left) ? "" : "\n\n") : "";
    const afterGap = right ? (/^\n\n/.test(rightTrimmed) ? "" : "\n\n") : "";
    const value = `${left}${beforeGap}${content}${afterGap}${right}`;
    const start = left.length + beforeGap.length;
    const caret =
      typeof caretOffset === "number"
        ? start + caretOffset
        : start + content.length;
    return block.field.sync(element, value, caret, caret);
  },
};
