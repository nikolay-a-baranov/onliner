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
  line: {
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
      return {
        start: left + 1,
        end,
      };
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
  },
  marker: {
    nearby(value = "", start = 0, match = () => false) {
      const current = block.line.current(value, start);
      return [
        current,
        block.line.previous(value, current),
        block.line.next(value, current),
      ].find((line) => line && match(String(value || "").slice(line.start, line.end))) || null;
    },
    remove(value = "", line = null) {
      if (!line) return null;
      const source = String(value || "");
      const left = source.slice(0, line.start).replace(/[ \t]+$/g, "");
      const right = source.slice(line.end).replace(/^[ \t]+/g, "");
      const before = left.replace(/\n+$/g, "");
      const after = right.replace(/^\n+/g, "");
      const gap = before && after ? "\n\n" : "";
      const next = `${before}${gap}${after}`;
      return {
        value: next,
        start: before.length,
        end: before.length,
      };
    },
  },
  layout: {
    insert(value = "", range = null, content = "", caretOffset = null) {
      if (!range || !content) return null;
      const source = String(value || "");
      const left = source.slice(0, range.end).replace(/[ \t]+$/g, "");
      const rightSource = source.slice(range.end);
      const rightTrimmed = rightSource.replace(/^[ \t]+/g, "");
      const right =
        rightTrimmed && !/^\n\n/.test(rightTrimmed)
          ? rightTrimmed.replace(/^\n+/g, "")
          : rightTrimmed;
      const beforeGap = left ? (/\n\n$/.test(left) ? "" : "\n\n") : "";
      const afterGap = right ? (/^\n\n/.test(rightTrimmed) ? "" : "\n\n") : "";
      const next = `${left}${beforeGap}${content}${afterGap}${right}`;
      const start = left.length + beforeGap.length;
      const caret =
        typeof caretOffset === "number"
          ? start + caretOffset
          : start + content.length;
      return {
        value: next,
        start: caret,
        end: caret,
      };
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
    const result = block.layout.insert(
      element.value,
      range,
      content,
      caretOffset,
    );
    if (!result) return false;
    return block.field.sync(element, result.value, result.start, result.end);
  },
};
