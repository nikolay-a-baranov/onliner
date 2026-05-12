import { cms } from "./core/cms.js";
import { dom } from "./core/dom.js";

(() => {
  const hour = 8;
  const side = hour === 7 ? "left" : "right";
  dom.element(".edit-visibility")?.click();
  dom.click(dom.element("#visibility-radio-public"), true);
  dom.click(dom.element(`input[name="sticky"][value="${side}"]`), true);
  dom.element(".save-post-visibility")?.click();
  const date = new Date(
    new Date().toLocaleString("en-US", {
      timeZone: cms.timezone,
    }),
  );
  if (date.getHours() >= hour) {
    date.setDate(date.getDate() + 1);
  }
  date.setHours(hour, 0, 0, 0);
  dom.element(".edit-timestamp")?.click();
  const pad = (value) => String(value).padStart(2, "0");
  [
    ["#mm", pad(date.getMonth() + 1)],
    ["#jj", pad(date.getDate())],
    ["#aa", String(date.getFullYear())],
    ["#hh", pad(hour)],
    ["#mn", "00"],
  ].forEach(([selector, value]) => dom.input(dom.element(selector), value));
  dom.element(".save-timestamp")?.click();
  dom.input(dom.element("#new-tag-post_tag"), "Onliner");
  dom.element("#post_tag .tagadd")?.click();
  const element = cms.layout.element();
  if (element && !cms.layout.longread(cms.layout.value(element))) {
    const label = element.options[element.selectedIndex].text.toLowerCase();
    if (dom.confirm(`🚨 Точно ${label}, не лонгрид? Меняем?`)) {
      dom.input(element, "longread");
    }
  }
  if (!dom.element("#postimagediv #set-post-thumbnail img")) {
    dom.alert("🛑 Минус мини");
  }
  dom.focus(dom.element("#publish"));
})();
