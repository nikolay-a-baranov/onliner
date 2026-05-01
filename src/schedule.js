import { timezone } from "./core/admin.js";

(() => {
  const hour = 8;
  const side = hour === 7 ? "left" : "right";
  const pad = (value) => String(value).padStart(2, "0");
  const now = () =>
    new Date(new Date().toLocaleString("en-US", { timeZone: timezone }));

  const query = (selector) => document.querySelector(selector);

  query(".edit-visibility").click();
  query("#visibility-radio-public").checked = true;
  query(`input[name="sticky"][value="${side}"]`).checked = true;
  query(".save-post-visibility").click();

  const setDate = (selector, value) => {
    const field = query(selector);
    field.value = value;
    field.dispatchEvent(new Event("change", { bubbles: true }));
  };
  const date = now();
  if (date.getHours() >= hour) date.setDate(date.getDate() + 1);
  date.setHours(hour, 0, 0, 0);
  query(".edit-timestamp").click();
  setDate("#mm", pad(date.getMonth() + 1));
  setDate("#jj", pad(date.getDate()));
  setDate("#aa", String(date.getFullYear()));
  setDate("#hh", pad(hour));
  setDate("#mn", "00");
  query(".save-timestamp").click();

  query("#new-tag-post_tag").value = "Onliner";
  query("#post_tag .tagadd").click();

  const layout = [...document.querySelectorAll("select")].find((select) =>
    [...select.options].some((option) => option.value === "longread"),
  );
  const isLongread = layout && layout.value === "longread";
  if (!isLongread && confirm("Не лонгрид! Меняем?")) {
    layout.value = "longread";
    layout.dispatchEvent(new Event("change", { bubbles: true }));
  }

  const hasThumbnail = !!query("#postimagediv #set-post-thumbnail img");
  if (!hasThumbnail) alert("Минус мини");
})();
