import { toolbar } from "./toolbar.js";
import { icon } from "./icon.js";
import { ui } from "./ui.js";
import { delivery } from "./delivery.js";
import { cms } from "./cms.js";
import { excerpt } from "../pipe/excerpt.js";

const glyph = {
  titles: "\u{1F4D4}",
  excerpt: "\u{1F4AD}",
  slug: "\u{1F587}\uFE0F",
  delivery: "\u{1F4EB}",
  exit: "\u274C",
};

export const popup = {
  config: {
    titles: {
      title: {
        key: "title",
        title: "title",
        limit: 130,
      },
      rotation: {
        key: "rotation",
        title: "rotation_titles[]",
        limit: 130,
      },
      favourite: {
        key: "favourite",
        title: "favourite_title",
        limit: 130,
      },
      seo: {
        key: "seo",
        title: "seo_title",
        limit: 65,
      },
    },
    title: {
      selector: "#title",
      label: "title",
    },
    rotation: {
      selector: 'input[name="rotation_titles[]"]',
      label: "rotation_titles[]",
    },
    favourite: {
      selector: '#favourite_title,input[name="favourite_title"]',
      label: "favourite_title",
    },
    seo: {
      selector:
        '#seo_title,#yoast_wpseo_title,input[name="seo_title"],input[name="yoast_wpseo_title"]',
      label: "seo_title",
    },
    excerpt: {
      selector: '#excerpt,textarea[name="excerpt"]',
      label: "excerpt",
      title: "excerpt",
      kind: "excerpt",
      limit: 320,
    },
    slug: {
      selector:
        '#editable-post-name input,#new-post-slug,input[name="post_name"],#post_name',
      fullSelector:
        '#editable-post-name-full,input[name="editable-post-name-full"]',
      previewSelector: "#editable-post-name",
      label: "editable-post-name",
      title: "editable-post-name",
      kind: "slug",
      limit: 120,
    },
  },
  field(selector) {
    if (!selector) return null;
    return document.querySelector(selector);
  },
  fields(selector) {
    if (!selector) return [];
    return [...document.querySelectorAll(selector)];
  },
  fieldValue(selector) {
    const node = popup.field(selector);
    if (!node) return "";
    if ("value" in node) return String(node.value || "");
    return String(node.textContent || "").trim();
  },
  fieldSet(selector, value) {
    const node = popup.field(selector);
    if (!node) return false;
    if ("value" in node) {
      node.value = value;
      node.dispatchEvent(new Event("input", { bubbles: true }));
      node.dispatchEvent(new Event("change", { bubbles: true }));
      return true;
    }
    node.textContent = value;
    return true;
  },
  fieldSetAll(selector, value) {
    const list = popup.fields(selector);
    if (!list.length) return false;
    list.forEach((node) => {
      if ("value" in node) {
        node.value = value;
        node.dispatchEvent(new Event("input", { bubbles: true }));
        node.dispatchEvent(new Event("change", { bubbles: true }));
        return;
      }
      node.textContent = value;
    });
    return true;
  },
  theme() {
    return (
      document.getElementById("reader-panel")?.dataset?.theme ||
      document.querySelector('.panel[data-ui-surface="toolbar"]')?.dataset
        ?.theme ||
      "dark"
    );
  },
  mode(value = "") {
    const next = String(value || "");
    if (
      next === "titles" ||
      next === "excerpt" ||
      next === "slug" ||
      next === "delivery"
    ) {
      return next;
    }
    return "titles";
  },
  open(mode = "titles") {
    popup.fieldsPopupState.mode = popup.mode(mode);
    return popup.fieldsPopupOpen();
  },
  close() {
    return popup.fieldsPopupClose();
  },
  isOpen() {
    return popup.fieldsPopupIsOpen();
  },
  syncTheme() {
    return popup.fieldsPopupSyncTheme();
  },
  fieldsPopupId: "reader-fields-popup",
  fieldsPopupState: {
    mode: "titles",
    theme: "dark",
    dragX: 0,
    dragY: 0,
    lock: null,
    lockPending: false,
    cleanup: [],
    opener: null,
    excerptBase: "",
    excerptLeadBackup: "",
    excerptLeadActive: false,
    excerptLeadSkipReset: false,
    slugCycle: 0,
    counterWidth: "",
    counterShowText: true,
    activeTitleKey: "",
    delivery: {
      hours: "",
      minutes: "",
      date: "",
      left: false,
      right: false,
      visibility: "public",
      update: false,
      timeAction: "time-manual",
      pinAction: "link",
    },
    deliveryDirty: false,
    active: {
      label: "\u0417\u0430\u0433",
      current: 0,
      limit: 105,
    },
  },
  fieldsPopupRules: {
    title: 105,
    rotation: 105,
    favourite: 105,
    seo: 70,
    excerpt: 420,
    slug: 34,
  },
  fieldsPopupButton(action, content, attrs = "") {
    return ui.controls.button({
      action,
      content,
      attrs: ` type="button"${attrs}`,
    });
  },
  fieldsPopupModeItems() {
    return [
      { name: "titles", icon: glyph.titles },
      { name: "excerpt", icon: glyph.excerpt },
      { name: "slug", icon: glyph.slug },
      { name: "delivery", icon: glyph.delivery },
    ];
  },
  fieldsPopupCleanupBind(cleanup) {
    if (typeof cleanup !== "function") return;
    popup.fieldsPopupState.cleanup.push(cleanup);
  },
  fieldsPopupCleanupRun() {
    const list = [...popup.fieldsPopupState.cleanup];
    popup.fieldsPopupState.cleanup = [];
    list.forEach((cleanup) => {
      try {
        cleanup();
      } catch (_) {}
    });
  },
  fieldsPopupFocusMode(popup, mode) {
    const button = popup?.querySelector(
      `[data-action="fields-mode"][data-mode="${mode}"]`,
    );
    if (!button) return;
    button.focus();
  },
  fieldsPopupBindKeyboard(popup) {
    if (!popup) return;
    const onKeydown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        popup.fieldsPopupClose();
        return;
      }
      if (
        event.key !== "ArrowLeft" &&
        event.key !== "ArrowRight" &&
        event.key !== "Home" &&
        event.key !== "End"
      )
        return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (!target.closest('[data-action="fields-mode"]')) return;
      const items = popup.fieldsPopupModeItems();
      if (!items.length) return;
      const mode = target.getAttribute("data-mode") || "";
      const index = items.findIndex((item) => item.name === mode);
      if (index < 0) return;
      let next = index;
      if (event.key === "ArrowLeft")
        next = (index - 1 + items.length) % items.length;
      if (event.key === "ArrowRight") next = (index + 1) % items.length;
      if (event.key === "Home") next = 0;
      if (event.key === "End") next = items.length - 1;
      if (next === index) return;
      event.preventDefault();
      const nextMode = items[next].name;
      popup.fieldsPopupState.mode = nextMode;
      popup.fieldsPopupRender(popup);
      popup.fieldsPopupFocusMode(popup, nextMode);
    };
    popup.addEventListener("keydown", onKeydown);
    popup.fieldsPopupCleanupBind(() => {
      popup.removeEventListener("keydown", onKeydown);
    });
  },
  fieldsPopupTitleItems() {
    const labels = {
      title: "\u0417\u0430\u0433",
      rotation: "\u0420\u043e\u0442\u0430\u0446\u0438\u044f",
      favourite: "\u041a\u0440\u0438\u043a",
    };
    const items = [
      {
        key: "title",
        label: "Заг",
        limit: popup.fieldsPopupRules.title,
        get: () => popup.fieldValue(popup.config.title.selector),
        set: (value) => popup.fieldSet(popup.config.title.selector, value),
      },
    ];
    const rotations = [
      ...document.querySelectorAll('input[name="rotation_titles[]"]'),
    ];
    for (let index = 0; index < Math.max(3, rotations.length); index += 1) {
      const node = rotations[index] || null;
      items.push({
        key: `rotation-${index + 1}`,
        label: `Ротация #${index + 1}`,
        limit: popup.fieldsPopupRules.rotation,
        get: () => String(node?.value || ""),
        set: (value) => {
          if (!node) return false;
          node.value = value;
          node.dispatchEvent(new Event("input", { bubbles: true }));
          node.dispatchEvent(new Event("change", { bubbles: true }));
          return true;
        },
      });
    }
    items.push({
      key: "favourite",
      label: "Крик",
      limit: popup.fieldsPopupRules.favourite,
      get: () => popup.fieldValue(popup.config.favourite.selector),
      set: (value) => popup.fieldSet(popup.config.favourite.selector, value),
    });
    items.push({
      key: "seo",
      label: "SEO",
      limit: popup.fieldsPopupRules.seo,
      get: () => popup.fieldValue(popup.config.seo.selector),
      set: (value) => popup.fieldSet(popup.config.seo.selector, value),
    });
    return items.slice(0, 6);
  },
  fieldsPopupExcerptValue() {
    return popup.fieldValue(popup.config.excerpt.selector);
  },
  fieldsPopupExcerptSet(value) {
    return popup.fieldSet(popup.config.excerpt.selector, value);
  },
  fieldsPopupSlugValue() {
    return (
      popup.fieldValue(popup.config.slug.fullSelector) ||
      popup.fieldValue(popup.config.slug.selector)
    );
  },
  fieldsPopupSlugSet(value) {
    const text = String(value || "");
    const first = popup.fieldSetAll(popup.config.slug.fullSelector, text);
    const second = popup.fieldSetAll(popup.config.slug.selector, text);
    return Boolean(first || second);
  },
  fieldsPopupSlugNormalize(value = "") {
    const map = {
      а: "a",
      б: "b",
      в: "v",
      г: "g",
      д: "d",
      е: "e",
      ё: "e",
      ж: "zh",
      з: "z",
      и: "i",
      й: "y",
      к: "k",
      л: "l",
      м: "m",
      н: "n",
      о: "o",
      п: "p",
      р: "r",
      с: "s",
      т: "t",
      у: "u",
      ф: "f",
      х: "h",
      ц: "ts",
      ч: "ch",
      ш: "sh",
      щ: "sch",
      ъ: "",
      ы: "y",
      ь: "",
      э: "e",
      ю: "yu",
      я: "ya",
    };
    return String(value || "")
      .toLowerCase()
      .split("")
      .map((char) => map[char] ?? char)
      .join("")
      .replace(/&/g, " and ")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .replace(/-{2,}/g, "-");
  },
  fieldsPopupSlugSnapshot(value = "") {
    const normalized = popup.fieldsPopupSlugNormalize(value);
    const chars = Array.from(normalized);
    const limit = popup.fieldsPopupRules.slug || 34;
    const willBeCut = chars.length > limit;
    const visible = willBeCut
      ? `${chars.slice(0, 16).join("")}\u2026${chars.slice(-16).join("")}`
      : chars.join("");
    return {
      value: chars.join(""),
      length: chars.length,
      limit,
      willBeCut,
      visible,
    };
  },
  fieldsPopupSlugCommit(value) {
    const text = popup.fieldsPopupSlugNormalize(value);
    const panel = popup.field("#editable-post-name");
    const edit = popup.field("#edit-slug-buttons .edit-slug");
    const save = popup.field("#edit-slug-buttons .save");
    const slugInput = popup.field("#new-post-slug");
    const apply = () => {
      popup.fieldSetAll("#new-post-slug", text);
      popup.fieldSetAll('input[name="post_name"]', text);
      popup.fieldSetAll("#post_name", text);
      popup.fieldSetAll(popup.config.slug.fullSelector, text);
      popup.fieldSetAll(popup.config.slug.selector, text);
      if (save && panel && panel.offsetParent !== null) save.click();
    };
    if (edit && (!slugInput || slugInput.offsetParent === null)) {
      edit.click();
      setTimeout(apply, 0);
    } else {
      apply();
    }
    const preview = popup.field(popup.config.slug.previewSelector);
    if (preview) preview.textContent = text;
    return true;
  },
  async fieldsPopupPhoneEditTitle({ input, item, popup }) {
    const result = await ui.popup.open({
      title: popup.fieldsPopupLabelFix(input.dataset.fieldLabel || "Заг"),
      kind: "",
      value: input.value || "",
      limit: Number(input.dataset.fieldLimit) || 0,
    });
    if (!result) return;
    item.set(result.value || "");
    popup.fieldsPopupRender(popup);
  },
  fieldsPopupSlugCandidates() {
    return reader
      .fieldsPopupTitleItems()
      .map((item) => String(item.get() || "").trim())
      .filter(Boolean);
  },
  fieldsPopupCounter(value, limit = 0) {
    return ui.controls.counter({
      current: String(value || "").length,
      limit: Number(limit) || 0,
      showText: popup.fieldsPopupState.counterShowText !== false,
    });
  },
  fieldsPopupCounterTop() {
    const active = popup.fieldsPopupState.active || {};
    return ui.shell.group(
      ui.controls.counter({
        current: Number(active.current) || 0,
        limit: Number(active.limit) || 0,
        showText: popup.fieldsPopupState.counterShowText !== false,
        classes: "reader-fields-counter-main",
        attrs: active.label
          ? ` data-label="${String(active.label).replace(/"/g, "&quot;")}"`
          : "",
      }),
      { rail: true, classes: "reader-fields-counter-group ui-counter-group" },
    );
  },
  fieldsPopupDeliveryTop() {
    const text = delivery.summaryTop(popup.fieldsPopupState.delivery || {});
    return ui.shell.group(
      `<div class="reader-fields-delivery-top-text" data-field-kind="delivery-summary-top">${icon.emoji(text, "default")}</div>`,
      {
        rail: true,
        classes: "reader-fields-counter-group reader-fields-delivery-top-group",
      },
    );
  },
  fieldsPopupHeaderMain() {
    const mode = popup.fieldsPopupState.mode || "titles";
    if (mode === "delivery")
      return ui.shell.strip(popup.fieldsPopupDeliveryTop());
    return ui.shell.strip(popup.fieldsPopupCounterTop());
  },
  fieldsPopupDeliveryAction(item = {}) {
    const name = String(item.name || "");
    const content = icon.emoji(item.icon || "", "default");
    return popup.fieldsPopupButton(
      "fields-delivery",
      content,
      ` data-delivery-action="${name}" title="${name}"`,
    );
  },
  fieldsPopupDeliveryApplyState(popup, next = {}) {
    popup.fieldsPopupState.delivery = {
      ...popup.fieldsPopupState.delivery,
      hours: String(next.hours || ""),
      minutes: String(next.minutes || ""),
      date: String(next.date || popup.fieldsPopupState.delivery?.date || ""),
      left: Boolean(next.left),
      right: Boolean(next.right),
      visibility: String(
        next.visibility ||
          popup.fieldsPopupState.delivery?.visibility ||
          "public",
      ),
      update: Boolean(next.update),
      timeAction: String(
        next.timeAction || popup.fieldsPopupState.delivery?.timeAction || "",
      ),
      pinAction: String(
        next.pinAction || popup.fieldsPopupState.delivery?.pinAction || "none",
      ),
    };
    const panel = popup?.querySelector(".panel");
    if (!panel) return;
    const hours = panel.querySelector(
      'input[data-field-kind="delivery-hours"]',
    );
    const minutes = panel.querySelector(
      'input[data-field-kind="delivery-minutes"]',
    );
    if (hours)
      hours.value = String(popup.fieldsPopupState.delivery.hours || "");
    if (minutes)
      minutes.value = String(popup.fieldsPopupState.delivery.minutes || "");
    panel
      .querySelectorAll('[data-field-kind="delivery-summary-top"]')
      .forEach((node) => {
        node.innerHTML = icon.emoji(
          delivery.summaryTop(popup.fieldsPopupState.delivery),
          "default",
        );
      });
    popup.fieldsPopupSetActive({
      label: "delivery",
      value: `${popup.fieldsPopupState.delivery.hours}:${popup.fieldsPopupState.delivery.minutes}`,
      limit: 0,
    });
    popup.fieldsPopupSyncCounterNode(popup);
    popup.fieldsPopupState.deliveryDirty = true;
  },
  fieldsPopupDeliveryReadAdmin() {
    const value = (selector) => String(popup.fieldValue(selector) || "");
    const checked = (selector) => Boolean(popup.field(selector)?.checked);
    const byText = (pattern) =>
      popup.fields('input[name="visibility"]').find((node) => {
        const id = String(node?.id || "");
        const label = id
          ? document.querySelector(`label[for="${id}"]`)?.textContent || ""
          : node?.parentElement?.textContent || "";
        return pattern.test(String(label || "").toLowerCase());
      }) || null;
    const month = value("#mm").padStart(2, "0");
    const day = value("#jj").padStart(2, "0");
    const year = value("#aa");
    const hours = value("#hh").padStart(2, "0");
    const minutes = value("#mn").padStart(2, "0");
    const hasDate =
      /^\d{2}$/u.test(month) && /^\d{2}$/u.test(day) && /^\d{4}$/u.test(year);
    const date = hasDate ? `${year}-${month}-${day}` : "";
    const left = checked('input[name="sticky"][value="left"]');
    const right = checked('input[name="sticky"][value="right"]');
    const update = checked("#updated");
    const visibilityLink =
      Boolean(byText(/доступно по ссылке/u)?.checked) ||
      checked("#visibility-radio-private");
    return {
      ...popup.fieldsPopupState.delivery,
      hours: /^\d{2}$/u.test(hours) ? hours : "",
      minutes: /^\d{2}$/u.test(minutes) ? minutes : "",
      date,
      left,
      right,
      visibility: visibilityLink ? "link" : "public",
      update,
      pinAction: left ? "pin-left" : right ? "pin-right" : "none",
    };
  },
  fieldsPopupDeliverySyncFromAdmin() {
    popup.fieldsPopupState.delivery = popup.fieldsPopupDeliveryReadAdmin();
    if (!popup.fieldsPopupState.delivery.timeAction) {
      popup.fieldsPopupState.delivery.timeAction = "time-manual";
    }
    popup.fieldsPopupState.deliveryDirty = false;
  },
  fieldsPopupDeliveryApplyAdmin() {
    const state = popup.fieldsPopupState.delivery || {};
    const click = (node) => node?.click?.();
    const setChecked = (selector, value) => {
      const node = popup.field(selector);
      if (!node || !("checked" in node)) return;
      if (node.checked !== Boolean(value)) click(node);
      node.checked = Boolean(value);
      node.dispatchEvent(new Event("input", { bubbles: true }));
      node.dispatchEvent(new Event("change", { bubbles: true }));
    };
    const visibilityLinkNode =
      popup.fields('input[name="visibility"]').find((node) => {
        const id = String(node?.id || "");
        const label = id
          ? document.querySelector(`label[for="${id}"]`)?.textContent || ""
          : node?.parentElement?.textContent || "";
        return /доступно по ссылке/u.test(String(label || "").toLowerCase());
      }) ||
      popup.field("#visibility-radio-private") ||
      null;
    click(popup.field(".edit-visibility"));
    setChecked("#visibility-radio-public", state.visibility !== "link");
    if (visibilityLinkNode) {
      if (visibilityLinkNode.id) {
        setChecked(`#${visibilityLinkNode.id}`, state.visibility === "link");
      } else {
        if (
          visibilityLinkNode.checked !== Boolean(state.visibility === "link")
        ) {
          click(visibilityLinkNode);
        }
      }
    }
    if (state.left) {
      setChecked('input[name="sticky"][value="left"]', true);
    } else if (state.right) {
      setChecked('input[name="sticky"][value="right"]', true);
    } else {
      const reset =
        popup.field('input[name="sticky"][value="none"]') ||
        popup.field('input[name="sticky"][value=""]') ||
        reader
          .fields('input[name="sticky"]')
          .find(
            (node) =>
              String(node?.value || "").toLowerCase() !== "left" &&
              String(node?.value || "").toLowerCase() !== "right",
          );
      if (reset)
        setChecked(
          `input[name="sticky"][value="${String(reset.value || "")}"]`,
          true,
        );
    }
    setChecked("#updated", Boolean(state.update));
    click(popup.field(".save-post-visibility"));
    const schedule = delivery.schedule(state);
    if (!schedule) return;
    click(popup.field(".edit-timestamp"));
    const pairs = [
      ["#mm", schedule.month],
      ["#jj", schedule.day],
      ["#aa", schedule.year],
      ["#hh", schedule.hours],
      ["#mn", schedule.minutes],
    ];
    pairs.forEach(([selector, value]) => {
      popup.fieldSet(selector, value);
    });
    click(popup.field(".save-timestamp"));
    popup.fieldsPopupState.deliveryDirty = false;
  },
  fieldsPopupSetActive({ label = "", value = "", limit = 0 } = {}) {
    popup.fieldsPopupState.active = {
      label: popup.fieldsPopupLabelFix(String(label || "")),
      current: Array.from(String(value || "")).length,
      limit: Number(limit) || 0,
    };
  },
  fieldsPopupLabelFix(value = "") {
    const raw = String(value || "");
    const mojibake = [...raw].some((char) => {
      const code = char.charCodeAt(0);
      return code === 208 || code === 209;
    });
    if (!mojibake) return raw;
    try {
      return decodeURIComponent(escape(raw));
    } catch (_) {
      return raw;
    }
  },
  fieldsPopupHtml(value = "") {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  },
  fieldsPopupTokens(value = "") {
    const text = String(value || "");
    return text.match(/\s+|[^\s]+/g) || [text];
  },
  fieldsPopupDiffHtml(before = "", after = "") {
    const left = popup.fieldsPopupTokens(before);
    const right = popup.fieldsPopupTokens(after);
    if (left.join("") === right.join(""))
      return popup.fieldsPopupHtml(left.join(""));
    const rows = left.length + 1;
    const cols = right.length + 1;
    const dp = Array.from({ length: rows }, () => new Array(cols).fill(0));
    for (let i = 1; i < rows; i += 1) {
      for (let j = 1; j < cols; j += 1) {
        if (left[i - 1] === right[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1] + 1;
        } else {
          dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
      }
    }
    const chunks = [];
    let i = left.length;
    let j = right.length;
    while (i > 0 || j > 0) {
      if (i > 0 && j > 0 && left[i - 1] === right[j - 1]) {
        chunks.push({ kind: "same", value: left[i - 1] });
        i -= 1;
        j -= 1;
        continue;
      }
      if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
        chunks.push({ kind: "add", value: right[j - 1] });
        j -= 1;
        continue;
      }
      if (i > 0) {
        chunks.push({ kind: "del", value: left[i - 1] });
        i -= 1;
      }
    }
    const ordered = chunks.reverse();
    const merged = ordered.reduce((result, item) => {
      const last = result[result.length - 1];
      if (last && last.kind === item.kind) {
        last.value += item.value;
        return result;
      }
      result.push({ ...item });
      return result;
    }, []);
    return merged
      .map((item) => {
        const value = popup.fieldsPopupHtml(item.value);
        if (item.kind === "add") {
          return `<mark class="reader-diff reader-diff-add">${value}</mark>`;
        }
        if (item.kind === "del") {
          return `<mark class="reader-diff reader-diff-del">${value}</mark>`;
        }
        return value;
      })
      .join("");
  },
  fieldsPopupSyncCounterNode(popup) {
    const panel = popup?.querySelector(".panel");
    const node = panel?.querySelector(".reader-fields-counter-main");
    if (!node) return;
    node.setAttribute(
      "data-show-text",
      popup.fieldsPopupState.counterShowText !== false ? "true" : "false",
    );
    const active = popup.fieldsPopupState.active || {};
    ui.controls.counterSync(node, {
      current: Number(active.current) || 0,
      limit: Number(active.limit) || 0,
      label: active.label || "",
    });
  },
  fieldsPopupBodyTitles() {
    return reader
      .fieldsPopupTitleItems()
      .map((item) => {
        const value = String(item.get() || "");
        return `
            <div class="reader-fields-row">
              <input class="reader-fields-input" data-field-kind="title" data-field-key="${item.key}" data-field-label="${item.label}" data-field-limit="${Number(item.limit) || 0}" type="text" placeholder="${item.label}" value="${String(value).replace(/"/g, "&quot;")}">
            </div>
          `;
      })
      .join("");
  },
  fieldsPopupBodyExcerpt() {
    const value = popup.fieldsPopupExcerptValue();
    const limit = popup.fieldsPopupRules.excerpt || 0;
    return `
        <div class="reader-fields-row">
          <div class="reader-fields-label">Цитата</div>
          <textarea class="reader-fields-input" data-field-kind="excerpt" data-field-label="Цитата" data-field-limit="${limit}" data-multiline="true" placeholder="Цитата">${String(value || "")}</textarea>
          ${popup.fieldsPopupCounter(value, limit)}
        </div>
        <div class="reader-fields-row reader-fields-row--delivery">
          <div class="reader-fields-preview reader-fields-preview--slug-live reader-fields-static" data-field-kind="delivery-summary">${delivery.summary(state)}</div>
        </div>
      `;
  },
  fieldsPopupBodySlug() {
    const value = popup.fieldsPopupSlugValue();
    const limit = popup.config.slug.limit || 0;
    return `
        <div class="reader-fields-row">
          <div class="reader-fields-label">Slug (текущее)</div>
          <div class="reader-fields-preview">${String(value || "")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")}</div>
          ${popup.fieldsPopupCounter(value, limit)}
        </div>
      `;
  },
  fieldsPopupBody(mode) {
    if (mode === "titles") return popup.fieldsPopupBodyTitlesPlain();
    if (mode === "excerpt") return popup.fieldsPopupBodyExcerptPlain();
    if (mode === "delivery") return popup.fieldsPopupBodyDeliveryPlain();
    return popup.fieldsPopupBodySlugPlain();
  },
  fieldsPopupBodyDeliveryPlain() {
    const state = popup.fieldsPopupState.delivery || {};
    const hours = String(state.hours || "");
    const minutes = String(state.minutes || "");
    const groups = delivery.actions.groups();
    const actions = (kind = "") =>
      (groups.find((group) => group.kind === kind)?.items || [])
        .map((item) => popup.fieldsPopupDeliveryAction(item))
        .join("");
    return `
        <div class="reader-fields-row reader-fields-row--delivery reader-fields-row--delivery-grid">
          <div class="reader-fields-delivery-capsule">
            <div class="reader-fields-delivery-actions reader-fields-delivery-actions--time">${actions("time")}</div>
          </div>
          <div class="reader-fields-delivery-capsule">
            <div class="reader-fields-delivery-time">
              <input class="reader-fields-input reader-fields-input--delivery-time" data-field-kind="delivery-hours" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="2" placeholder="hh" value="${hours.replace(/"/g, "&quot;")}">
              <span class="reader-fields-delivery-sep">:</span>
              <input class="reader-fields-input reader-fields-input--delivery-time" data-field-kind="delivery-minutes" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="2" placeholder="mm" value="${minutes.replace(/"/g, "&quot;")}">
            </div>
          </div>
          <div class="reader-fields-delivery-capsule">
            <div class="reader-fields-delivery-actions">${actions("options")}</div>
          </div>
        </div>
      `;
  },
  fieldsPopupBodyTitlesPlain() {
    return reader
      .fieldsPopupTitleItems()
      .map((item) => {
        const value = String(item.get() || "");
        const limit = Number(item.limit) || 0;
        return `
            <div class="reader-fields-row">
              <input class="reader-fields-input" data-field-kind="title" data-field-key="${item.key}" data-field-label="${popup.fieldsPopupLabelFix(item.label)}" data-field-limit="${limit}" type="text" placeholder="${popup.fieldsPopupLabelFix(item.label)}" value="${String(value).replace(/"/g, "&quot;")}">
            </div>
          `;
      })
      .join("");
  },
  fieldsPopupBodyExcerptPlain() {
    const value = popup.fieldsPopupExcerptValue();
    const base = String(popup.fieldsPopupState.excerptBase || "");
    const limit = popup.fieldsPopupRules.excerpt || 0;
    const diff = popup.fieldsPopupDiffHtml(base, value);
    return `
        <div class="reader-fields-row">
          <div class="reader-fields-excerpt-frame">
            <textarea class="reader-fields-input reader-fields-input--excerpt reader-fields-input--excerpt-plain" data-field-kind="excerpt" data-field-label="\u0426\u0438\u0442\u0430\u0442\u0430" data-field-limit="${limit}" data-multiline="true" placeholder="\u0426\u0438\u0442\u0430\u0442\u0430">${String(value || "")}</textarea>
            <div class="reader-fields-excerpt-divider"><button class="reader-fields-excerpt-divider-mark" type="button" data-action="fields-excerpt-lead" title="Подставить лид">${icon.emoji("\u{1F504}", "default")}</button></div>
            <div class="reader-fields-preview reader-fields-preview--readonly reader-fields-preview--excerpt-plain reader-fields-static" data-field-kind="excerpt-current">${diff}</div>
          </div>
        </div>
      `;
  },
  fieldsPopupBodySlugPlain() {
    const value = popup.fieldsPopupSlugValue();
    const limit = popup.fieldsPopupRules.slug || 0;
    const snap = popup.fieldsPopupSlugSnapshot(value);
    const cycle = ui.controls.button({
      action: "fields-slug-cycle",
      content: icon.emoji("\u{1F504}", "default"),
      attrs:
        ' type="button" title="\u0426\u0438\u043a\u043b \u0437\u0430\u0433\u043e\u043b\u043e\u0432\u043a\u043e\u0432"',
    });
    return `
        <div class="reader-fields-row">
          <input class="reader-fields-input reader-fields-input--slug" data-field-kind="slug" data-field-label="\u0421\u043b\u0430\u0433" data-field-limit="${limit}" type="text" placeholder="\u0421\u043b\u0430\u0433" value="${String(value).replace(/"/g, "&quot;")}">
        </div>
        <div class="reader-fields-row reader-fields-row--slug-cycle">
          <div class="reader-fields-slug-cycle">${cycle}</div>
        </div>
        <div class="reader-fields-row">
          <div class="reader-fields-preview reader-fields-preview--slug-live reader-fields-static" data-field-kind="slug-live" title="${snap.value}">${popup.fieldsPopupHtml(snap.visible)}</div>
        </div>
      `;
  },
  fieldsPopupBuild() {
    const mode = popup.fieldsPopupState.mode || "titles";
    const left = ui.shell.group(
      reader
        .fieldsPopupModeItems()
        .map((item) =>
          popup.fieldsPopupButton(
            "fields-mode",
            icon.emoji(item.icon, "default"),
            ` data-mode="${item.name}"${mode === item.name ? ' data-active="true"' : ""}`,
          ),
        )
        .join(""),
      { rail: true, classes: "reader-fields-modes" },
    );
    const main = popup.fieldsPopupHeaderMain();
    const theme = popup.fieldsPopupState.theme || popup.theme();
    const right = ui.shell.group(
      `${popup.fieldsPopupButton("fields-theme", icon.theme(theme))}${popup.fieldsPopupButton("fields-close", icon.emoji(glyph.exit, "default"))}`,
      { rail: true, stick: "right", classes: "reader-fields-system" },
    );
    return `
        ${ui.shell.shell({ left, main, right, attrs: ' data-fields-header="true"' })}
        <div data-fields-body data-mode="${mode}">${popup.fieldsPopupBody(mode)}</div>
      `;
  },
  fieldsPopupRender(popup, { focusTitleKey = "" } = {}) {
    const node = popup?.querySelector(".panel");
    if (!node) return;
    node.innerHTML = popup.fieldsPopupBuild();
    popup.fieldsPopupBindFields(popup, { focusTitleKey });
    popup.fieldsPopupBindDrag(popup);
    popup.fieldsPopupLockSize(node);
    popup.fieldsPopupSyncHeaderWidths(popup);
  },
  fieldsPopupSyncHeaderWidths(popup) {
    const panel = popup?.querySelector(".panel");
    const shell = panel?.querySelector('[data-fields-header="true"]');
    const left = panel?.querySelector(".reader-fields-modes");
    const right = panel?.querySelector(".reader-fields-system");
    const counter = panel?.querySelector(".reader-fields-counter-group");
    if (!panel || !shell || !left || !right || !counter) return;
    if (popup?.dataset?.mode === "phone") {
      counter.style.removeProperty("--reader-fields-counter-width");
      return;
    }
    const style = getComputedStyle(shell);
    const gap = Number.parseFloat(style.gap || style.columnGap || "0") || 0;
    const leftWidth = Math.ceil(left.getBoundingClientRect().width);
    const rightWidth = Math.ceil(right.getBoundingClientRect().width);
    if (!leftWidth || !rightWidth) return;
    const width = leftWidth + rightWidth + Math.ceil(gap);
    popup.fieldsPopupState.counterWidth = `${width}px`;
    counter.style.setProperty("--reader-fields-counter-width", `${width}px`);
    requestAnimationFrame(() => {
      if (!panel.isConnected) return;
      const nextLeft = Math.ceil(left.getBoundingClientRect().width);
      const nextRight = Math.ceil(right.getBoundingClientRect().width);
      if (!nextLeft || !nextRight) return;
      const next = nextLeft + nextRight + Math.ceil(gap);
      if (next === width) return;
      popup.fieldsPopupState.counterWidth = `${next}px`;
      counter.style.setProperty("--reader-fields-counter-width", `${next}px`);
    });
  },
  fieldsPopupLockSize(panel) {
    if (!panel) return;
    if (popup.fieldsPopupState.lock) {
      ui.surface.lock.apply(panel, popup.fieldsPopupState.lock);
      return;
    }
    if (popup.fieldsPopupState.lockPending) return;
    popup.fieldsPopupState.lockPending = true;
    requestAnimationFrame(() => {
      popup.fieldsPopupState.lockPending = false;
      if (!panel.isConnected || popup.fieldsPopupState.lock) return;
      const lock = ui.surface.lock.measure(panel, {
        bodySelector: "[data-fields-body]",
        minWidth: 420,
        minHeight: 140,
        minBodyHeight: 60,
      });
      if (!lock) return;
      popup.fieldsPopupState.lock = lock;
      ui.surface.lock.apply(panel, lock);
      const popup = panel.closest(`#${popup.fieldsPopupId}`);
      if (popup) popup.fieldsPopupSyncHeaderWidths(popup);
    });
  },
  fieldsPopupBindFields(popup, { focusTitleKey = "" } = {}) {
    const panel = popup?.querySelector(".panel");
    if (!panel) return;
    const mode = popup.fieldsPopupState.mode || "titles";
    if (mode === "titles") {
      const onPhone = popup.phone();
      const dict = Object.fromEntries(
        popup.fieldsPopupTitleItems().map((item) => [item.key, item]),
      );
      panel
        .querySelectorAll('input[data-field-kind="title"]')
        .forEach((input) => {
          const key = input.dataset.fieldKey || "";
          const item = dict[key];
          if (onPhone) {
            input.addEventListener("pointerdown", (event) => {
              event.preventDefault();
              if (!item) return;
              popup.fieldsPopupPhoneEditTitle({ input, item, popup });
            });
            return;
          }
          const sync = () =>
            popup.fieldsPopupSetActive({
              label: input.dataset.fieldLabel || "",
              value: input.value || "",
              limit: Number(input.dataset.fieldLimit) || 0,
            });
          input.addEventListener("focus", () => {
            popup.fieldsPopupState.activeTitleKey = key || "";
            sync();
            popup.fieldsPopupSyncCounterNode(popup);
          });
          input.addEventListener("input", () => {
            if (!item) return;
            popup.fieldsPopupState.activeTitleKey = key || "";
            item.set(input.value || "");
            sync();
            popup.fieldsPopupSyncCounterNode(popup);
          });
        });
      const key = focusTitleKey || popup.fieldsPopupState.activeTitleKey || "";
      const selected =
        panel.querySelector(
          `input[data-field-kind="title"][data-field-key="${key}"]`,
        ) || panel.querySelector('input[data-field-kind="title"]');
      if (selected) {
        popup.fieldsPopupState.activeTitleKey = selected.dataset.fieldKey || "";
        popup.fieldsPopupSetActive({
          label: selected.dataset.fieldLabel || "",
          value: selected.value || "",
          limit: Number(selected.dataset.fieldLimit) || 0,
        });
        popup.fieldsPopupSyncCounterNode(popup);
        if (focusTitleKey && !onPhone) selected.focus();
      }
    }
    if (mode === "excerpt") {
      const input = panel.querySelector('textarea[data-field-kind="excerpt"]');
      if (!input) return;
      const sync = () =>
        popup.fieldsPopupSetActive({
          label: input.dataset.fieldLabel || "Цитата",
          value: input.value || "",
          limit: Number(input.dataset.fieldLimit) || 0,
        });
      input.addEventListener("focus", () => {
        sync();
        popup.fieldsPopupSyncCounterNode(popup);
      });
      input.addEventListener("input", () => {
        if (!popup.fieldsPopupState.excerptLeadSkipReset) {
          popup.fieldsPopupState.excerptLeadBackup = "";
          popup.fieldsPopupState.excerptLeadActive = false;
        }
        popup.fieldsPopupExcerptSet(input.value || "");
        const current = panel.querySelector(
          '[data-field-kind="excerpt-current"]',
        );
        if (current) {
          current.innerHTML = popup.fieldsPopupDiffHtml(
            popup.fieldsPopupState.excerptBase || "",
            input.value || "",
          );
        }
        sync();
        popup.fieldsPopupSyncCounterNode(popup);
      });
      sync();
      popup.fieldsPopupSyncCounterNode(popup);
    }
    if (mode === "slug") {
      const input = panel.querySelector('input[data-field-kind="slug"]');
      if (!input) return;
      const sync = () =>
        (() => {
          const snap = popup.fieldsPopupSlugSnapshot(input.value || "");
          return popup.fieldsPopupSetActive({
            label: input.dataset.fieldLabel || "\u0421\u043b\u0430\u0433",
            value: snap.value,
            limit: Number(input.dataset.fieldLimit) || snap.limit || 0,
          });
        })();
      input.addEventListener("focus", () => {
        sync();
        popup.fieldsPopupSyncCounterNode(popup);
      });
      input.addEventListener("input", () => {
        const snap = popup.fieldsPopupSlugSnapshot(input.value || "");
        popup.fieldsPopupSlugSet(snap.value);
        const live = panel.querySelector('[data-field-kind="slug-live"]');
        if (live) {
          live.textContent = snap.visible;
          live.setAttribute("title", snap.value);
        }
        sync();
        popup.fieldsPopupSyncCounterNode(popup);
      });
      input.addEventListener("blur", () => {
        popup.fieldsPopupSlugCommit(input.value || "");
      });
      sync();
      popup.fieldsPopupSyncCounterNode(popup);
    }
    if (mode === "delivery") {
      const hours = panel.querySelector(
        'input[data-field-kind="delivery-hours"]',
      );
      const minutes = panel.querySelector(
        'input[data-field-kind="delivery-minutes"]',
      );
      const sync = () => {
        const normalize = (value = "", max = 23) => {
          const digits = String(value || "")
            .replace(/\D+/g, "")
            .slice(0, 2);
          if (!digits) return "";
          const number = Math.min(max, Number(digits));
          if (!Number.isFinite(number)) return "";
          return String(number).padStart(2, "0");
        };
        const h = normalize(hours?.value || "", 23);
        const m = normalize(minutes?.value || "", 59);
        if (hours && hours.value !== h && h) hours.value = h;
        if (minutes && minutes.value !== m && m) minutes.value = m;
        popup.fieldsPopupState.delivery = {
          ...popup.fieldsPopupState.delivery,
          hours: h,
          minutes: m,
          date: "",
          timeAction: "time-manual",
        };
        panel
          .querySelectorAll('[data-field-kind="delivery-summary-top"]')
          .forEach((node) => {
            node.innerHTML = icon.emoji(
              delivery.summaryTop(popup.fieldsPopupState.delivery),
              "default",
            );
          });
        popup.fieldsPopupSetActive({
          label: "delivery",
          value: `${h}:${m}`,
          limit: 0,
        });
        popup.fieldsPopupSyncCounterNode(popup);
        popup.fieldsPopupState.deliveryDirty = true;
      };
      [hours, minutes].forEach((input) => {
        if (!input) return;
        input.addEventListener("keydown", (event) => {
          if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
          event.preventDefault();
          const max =
            input.getAttribute("data-field-kind") === "delivery-hours"
              ? 23
              : 59;
          const step = event.key === "ArrowUp" ? 1 : -1;
          const raw = String(input.value || "").replace(/\D+/g, "");
          const current = Number(raw || "0");
          const next = (((current + step) % (max + 1)) + (max + 1)) % (max + 1);
          input.value = String(next).padStart(2, "0");
          sync();
        });
        input.addEventListener("focus", sync);
        input.addEventListener("input", sync);
      });
      sync();
    }
  },
  fieldsPopupBindDrag(popup) {
    if (!popup || popup.dataset.mode === "phone") return;
    const panel = popup.querySelector(".panel");
    const header = panel?.querySelector('[data-fields-header="true"]');
    if (!panel || !header) return;
    let drag = null;
    panel.style.userSelect = "none";
    const apply = () => {
      panel.style.transform = `translate(${popup.fieldsPopupState.dragX}px, ${popup.fieldsPopupState.dragY}px)`;
    };
    const move = (event) => {
      if (!drag) return;
      const x = event.clientX - drag.startX;
      const y = event.clientY - drag.startY;
      popup.fieldsPopupState.dragX = drag.baseX + x;
      popup.fieldsPopupState.dragY = drag.baseY + y;
      apply();
    };
    const up = () => {
      if (!drag) return;
      drag = null;
      popup.dataset.dragging = "false";
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    panel.addEventListener("pointerdown", (event) => {
      if (event.button !== 0) return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (target.closest("[data-fields-body]")) return;
      if (target.closest("[data-action],button,input,textarea,select,a,label"))
        return;
      if (target.closest(".ui-counter-pill")) return;
      drag = {
        startX: event.clientX,
        startY: event.clientY,
        baseX: popup.fieldsPopupState.dragX || 0,
        baseY: popup.fieldsPopupState.dragY || 0,
      };
      event.preventDefault();
      popup.dataset.dragging = "true";
      window.addEventListener("pointermove", move, { passive: true });
      window.addEventListener("pointerup", up, { passive: true });
    });
    popup.fieldsPopupCleanupBind(() => {
      drag = null;
      popup.dataset.dragging = "false";
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    });
    apply();
  },
  fieldsPopupClose() {
    if (popup.fieldsPopupState.deliveryDirty) {
      popup.fieldsPopupDeliveryApplyAdmin();
    }
    popup.fieldsPopupCleanupRun();
    document.getElementById(popup.fieldsPopupId)?.remove();
    const opener = popup.fieldsPopupState.opener;
    if (opener?.isConnected) opener.focus();
    popup.fieldsPopupState.opener = null;
  },
  fieldsPopupIsOpen() {
    return Boolean(document.getElementById(popup.fieldsPopupId));
  },
  fieldsPopupSyncTheme() {
    const popup = document.getElementById(popup.fieldsPopupId);
    const panel = popup?.querySelector(".panel");
    const focusTitleKey =
      popup?.querySelector('input[data-field-kind="title"]:focus')?.dataset
        ?.fieldKey || "";
    if (panel) {
      ui.surface.sync(panel, {
        layout: "fullscreen",
        theme: popup.fieldsPopupState.theme || "dark",
        surface: "toolbar",
      });
    }
    if (popup) popup.fieldsPopupRender(popup, { focusTitleKey });
  },
  fieldsPopupOpen() {
    popup.fieldsPopupClose();
    panel.mount("reader-fields-popup-style", css.ui.popup());
    popup.fieldsPopupState.opener = document.activeElement;
    const phone = popup.phone();
    popup.fieldsPopupState.theme = popup.theme();
    popup.fieldsPopupState.lock = null;
    popup.fieldsPopupState.lockPending = false;
    popup.fieldsPopupState.cleanup = [];
    popup.fieldsPopupState.counterWidth = "";
    popup.fieldsPopupState.excerptBase = popup.fieldsPopupExcerptValue();
    popup.fieldsPopupDeliverySyncFromAdmin();
    const popup = document.createElement("div");
    popup.id = popup.fieldsPopupId;
    popup.dataset.mode = phone ? "phone" : "desktop";
    popup.tabIndex = -1;
    const node = document.createElement("div");
    node.className = "panel";
    node.dataset.uiFrame = "capsule";
    node.dataset.toolbarFlow = "rail";
    node.dataset.dock = "floating";
    node.dataset.dockTarget = "floating";
    node.style.pointerEvents = "auto";
    ui.surface.sync(node, {
      layout: "fullscreen",
      theme: popup.fieldsPopupState.theme,
      surface: "toolbar",
    });
    popup.appendChild(node);
    document.body.appendChild(popup);
    popup.fieldsPopupBindKeyboard(popup);
    const counterToggle = (event) => {
      const node = event.target.closest(".ui-counter-pill");
      if (!node || !popup.contains(node)) return;
      event.preventDefault();
      popup.fieldsPopupState.counterShowText =
        !popup.fieldsPopupState.counterShowText;
      popup
        .querySelectorAll(".ui-counter-pill")
        .forEach((counter) =>
          counter.setAttribute(
            "data-show-text",
            popup.fieldsPopupState.counterShowText ? "true" : "false",
          ),
        );
    };
    popup.addEventListener("click", counterToggle);
    popup.fieldsPopupCleanupBind(() => {
      popup.removeEventListener("click", counterToggle);
    });
    popup.fieldsPopupRender(popup);
    popup.focus();
    toolbar.behavior.actions({
      panel: popup,
      root: popup,
      action: ({ name, button }) => {
        if (name === "fields-close") return popup.fieldsPopupClose();
        if (name === "fields-theme") {
          popup.fieldsPopupState.theme =
            (popup.fieldsPopupState.theme || "dark") === "dark"
              ? "light"
              : "dark";
          return popup.fieldsPopupSyncTheme();
        }
        if (name === "fields-mode") {
          const mode = button?.dataset?.mode || "titles";
          if (mode === "delivery") popup.fieldsPopupDeliverySyncFromAdmin();
          popup.fieldsPopupState.mode = mode;
          return popup.fieldsPopupRender(popup);
        }
        if (name === "fields-slug-cycle") {
          if ((popup.fieldsPopupState.mode || "titles") !== "slug") return;
          const list = popup.fieldsPopupSlugCandidates();
          if (!list.length) return;
          const next = popup.fieldsPopupState.slugCycle % list.length;
          popup.fieldsPopupState.slugCycle += 1;
          const value = list[next];
          const input = popup.querySelector('input[data-field-kind="slug"]');
          if (!input) return;
          input.value = value;
          input.dispatchEvent(new Event("input", { bubbles: true }));
          popup.fieldsPopupSlugCommit(value);
          input.focus();
        }
        if (name === "fields-excerpt-lead") {
          if ((popup.fieldsPopupState.mode || "titles") !== "excerpt") return;
          const input = popup.querySelector(
            'textarea[data-field-kind="excerpt"]',
          );
          if (!input) return;
          if (popup.fieldsPopupState.excerptLeadActive) {
            const restore = String(
              popup.fieldsPopupState.excerptLeadBackup || "",
            );
            popup.fieldsPopupState.excerptLeadSkipReset = true;
            input.value = restore;
            input.dispatchEvent(new Event("input", { bubbles: true }));
            popup.fieldsPopupState.excerptLeadSkipReset = false;
            popup.fieldsPopupState.excerptLeadBackup = "";
            popup.fieldsPopupState.excerptLeadActive = false;
            return;
          }
          const currentValue = String(input.value || "");
          const lead = excerpt
            .lead(popup.fieldValue("#content"))
            .replace(/[.]\s*$/u, "")
            .trim();
          popup.fieldsPopupState.excerptLeadBackup = currentValue;
          popup.fieldsPopupState.excerptLeadActive = true;
          popup.fieldsPopupState.excerptLeadSkipReset = true;
          input.value = lead;
          input.dispatchEvent(new Event("input", { bubbles: true }));
          popup.fieldsPopupState.excerptLeadSkipReset = false;
        }
        if (name === "fields-delivery") {
          if ((popup.fieldsPopupState.mode || "titles") !== "delivery") return;
          const action = button?.dataset?.deliveryAction || "";
          const state = {
            ...popup.fieldsPopupState.delivery,
          };
          const next = delivery.preset(state, action);
          if (next && next !== state) {
            return popup.fieldsPopupDeliveryApplyState(popup, next);
          }
        }
      },
    });
  },
};
