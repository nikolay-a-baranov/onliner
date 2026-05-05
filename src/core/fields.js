export const field = {
  dispatch: {
    input(element) {
      if (!element) return;
      element.dispatchEvent(new Event("input", { bubbles: true }));
    },
    click(element) {
      if (!element) return;
      element.dispatchEvent(new Event("click", { bubbles: true }));
    },
    change(element) {
      if (!element) return;
      element.dispatchEvent(new Event("change", { bubbles: true }));
    },
  },

  input(element, value) {
    if (!element) return;
    element.value = value;
    field.emit(element);
  },

  value(element, value) {
    field.input(element, value);
  },

  emit(element) {
    if (!element) return;
    field.dispatch.input(element);
    field.dispatch.change(element);
  },

  click(element, checked) {
    if (!element) return;
    element.checked = checked;
    field.dispatch.click(element);
    field.dispatch.change(element);
  },

  check(element, checked) {
    field.click(element, checked);
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

