export const tracker = {
  base(key, value) {
    const stored = localStorage.getItem(key);
    if (stored !== null) return stored;
    localStorage.setItem(key, value);
    return value;
  },
  count(base, value) {
    if (base === value) return 0;
    let start = 0;
    while (
      start < base.length &&
      start < value.length &&
      base[start] === value[start]
    ) {
      start++;
    }
    let end = 0;
    while (
      end + start < base.length &&
      end + start < value.length &&
      base[base.length - 1 - end] === value[value.length - 1 - end]
    ) {
      end++;
    }
    return Math.max(base.length - start - end, value.length - start - end);
  },
  label(count) {
    if (!count) return "0";
    return `±${count}`;
  },
};
