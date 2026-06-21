export const dom = {
  value: {
    setter(element) {
      if (!element) return null;
      if (element.tagName === "TEXTAREA") {
        return Object.getOwnPropertyDescriptor(
          HTMLTextAreaElement.prototype,
          "value",
        )?.set;
      }
      return Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        "value",
      )?.set;
    },
    set(element, value) {
      if (!element) return false;
      const setter = dom.value.setter(element);
      if (setter) {
        setter.call(element, value);
        return true;
      }
      element.value = value;
      return true;
    },
  },
  element(selector) {
    return document.querySelector(selector);
  },
  elements(selector) {
    return [...document.querySelectorAll(selector)];
  },
  dispatch(element, type) {
    if (!element) return;
    if (type === "input" && typeof InputEvent === "function") {
      element.dispatchEvent(
        new InputEvent("input", {
          bubbles: true,
          inputType: "insertText",
          data: String(element.value ?? ""),
        }),
      );
      return;
    }
    element.dispatchEvent(
      new Event(type, {
        bubbles: true,
      }),
    );
  },
  input(element, value) {
    if (!element) return;
    dom.value.set(element, value);
    dom.dispatch(element, "input");
    dom.dispatch(element, "change");
  },
  select(element, value) {
    if (!element) return;
    dom.value.set(element, value);
    dom.dispatch(element, "change");
  },
  click(element, checked) {
    if (!element) return;
    element.checked = checked;
    dom.dispatch(element, "click");
    dom.dispatch(element, "change");
  },
  text(element, value) {
    if (!element) return;
    element.textContent = value;
  },
  html(element, value) {
    if (!element) return;
    element.innerHTML = value;
  },
  focus(element) {
    if (!element) return;
    element.focus();
  },
  alert(message) {
    return window.alert(message);
  },
  confirm(message) {
    return window.confirm(message);
  },
  capture(schema) {
    return Object.fromEntries(
      Object.entries(schema).map(([name, item]) => [name, item.get()]),
    );
  },
  restore(schema, state) {
    Object.entries(state).forEach(([name, value]) => {
      const item = schema[name];
      if (!item || typeof item.set !== "function") {
        return;
      }
      item.set(value);
    });
  },
};

export const field = {
  element: dom.element,
  elements: dom.elements,
  set(element, value) {
    return dom.value.set(element, value);
  },
  emit(element) {
    dom.dispatch(element, "input");
    dom.dispatch(element, "change");
  },
  input: dom.input,
  select: dom.select,
  click: dom.click,
  text: dom.text,
  html: dom.html,
  focus: dom.focus,
  alert: dom.alert,
  confirm: dom.confirm,
  capture: dom.capture,
  restore: dom.restore,
};
