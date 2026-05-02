export const fields = {
  input(element, value) {
    if (!element) return;
    element.value = value;
    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
  },

  check(element, checked) {
    if (!element) return;
    element.checked = checked;
    element.dispatchEvent(new Event("click", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
  },

  capture(schema) {
    return Object.fromEntries(
      Object.entries(schema).map(([name, field]) => [name, field.get()]),
    );
  },

  restore(schema, state) {
    Object.entries(state).forEach(([name, value]) => {
      const field = schema[name];
      if (field && typeof field.set === "function") field.set(value);
    });
  },
};
