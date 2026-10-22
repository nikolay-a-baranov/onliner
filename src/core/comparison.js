const order = {
  get(value = "") {
    return value === "deleted-first" ? "deleted-first" : "added-first";
  },
  toggle(value = "") {
    return order.get(value) === "added-first" ? "deleted-first" : "added-first";
  },
  arrange(deleted, added, value = "") {
    return order.get(value) === "deleted-first"
      ? [deleted, added]
      : [added, deleted];
  },
};

export const comparison = {
  order,
};
