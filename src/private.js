import { dom } from "./core/dom.js";

(() => {
  dom.element(".edit-visibility")?.click();
  dom.click(dom.element("#visibility-radio-private"), true);
  dom.input(dom.element("#hidden-post-visibility"), "private");
  dom.input(dom.element("#post_password"), "");
  dom.input(dom.element("#hidden-post-password"), "");
  dom.click(dom.element("input[name='sticky'][value='off']"), true);
  dom.click(dom.element("#hidden-post-sticky"), false);
  dom.element(".save-post-visibility")?.click();
  dom.text(dom.element("#post-visibility-display"), "Доступно по ссылке");
  dom.focus(dom.element("#save-post") || dom.element("#publish"));
})();
