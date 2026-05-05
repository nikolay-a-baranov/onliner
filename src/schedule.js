import { timezone } from "./core/admin.js";
import { field } from "./core/fields.js";

(() => {
  const hour = 8;
  const side = hour === 7 ? "left" : "right";

  const element = (selector) => document.querySelector(selector);

  element(".edit-visibility").click();
  element("#visibility-radio-public").checked = true;
  element(`input[name="sticky"][value="${side}"]`).checked = true;
  element(".save-post-visibility").click();

  const date = new Date(
    new Date().toLocaleString("en-US", { timeZone: timezone }),
  );
  const pad = (value) => String(value).padStart(2, "0");
  if (date.getHours() >= hour) date.setDate(date.getDate() + 1);
  date.setHours(hour, 0, 0, 0);
  element(".edit-timestamp").click();
  element("#mm").value = pad(date.getMonth() + 1);
  field.dispatch.change(element("#mm"));
  element("#jj").value = pad(date.getDate());
  field.dispatch.change(element("#jj"));
  element("#aa").value = String(date.getFullYear());
  field.dispatch.change(element("#aa"));
  element("#hh").value = pad(hour);
  field.dispatch.change(element("#hh"));
  element("#mn").value = "00";
  field.dispatch.change(element("#mn"));
  element(".save-timestamp").click();

  element("#new-tag-post_tag").value = "Onliner";
  element("#post_tag .tagadd").click();

  const layout = {
    element: [...document.querySelectorAll("select")].find((select) =>
      [...select.options].some((option) => option.value === "longread"),
    ),
    get longread() {
      return this.element.value === "longread";
    },
    get message() {
      return `🚨 Точно ${this.element.options[this.element.selectedIndex].text.toLowerCase()}, не лонгрид? Меняем?`;
    },
  };
  if (!layout.longread && confirm(layout.message)) {
    layout.element.value = "longread";
    field.dispatch.change(layout.element);
  }

  const thumbnail = !!element("#postimagediv #set-post-thumbnail img");
  if (!thumbnail) alert("🛑 Минус мини");

  element("#publish")?.focus();
})();
