import { panel } from "../core/surface/panel.js";
import { css } from "../core/surface/css.js";
import { toolbar } from "../core/surface/toolbar.js";
import { icon } from "../core/surface/icon.js";
import { ui } from "../core/surface/ui.js";
import { cms } from "../core/cms.js";
import { field } from "../core/dom.js";
import { widget } from "../core/widget.js";
import { sanitizer } from "../core/sanitizer.js";
import { content as contentPipe } from "../pipe/content.js";
import { markup as contentMarkup } from "../pipe/markup.js";
import { text } from "../pipe/text.js";

export const createAdmin = () => {
const timer = {
  focusTick: 100,
  focusAttempts: 20,
  advertTick: 150,
  advertAttempts: 40,
  summaryDelay: 150,
};
const tag = {
  exclude: ["-\u0441\u043f", "\u0441\u043f-", "-sp", "sp-"],
  input: (root = document) => root.querySelector("#tax-input-post_tag"),
  admin: () => `${location.origin}/wp-admin/`,
  parse: (html) => new DOMParser().parseFromString(html, "text/html"),
  emit(input) {
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  },
  get(root = document) {
    return (this.input(root)?.value || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  },
  normalizeName(value) {
    return String(value || "")
      .toLocaleLowerCase("ru-RU")
      .replace(/\u0451/g, "\u0435")
      .replace(/\s+/g, " ")
      .trim();
  },
  unique(values) {
    const seen = new Set();
    return values.filter((value) => {
      const current = String(value || "").replace(/\s+/g, " ").trim();
      const key = this.normalizeName(current);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  },
  checklistItems(root = document) {
    return [...root.querySelectorAll("#post_tag .tagchecklist span")];
  },
  itemName(item) {
    if (!item) return "";
    const clone = item.cloneNode(true);
    clone.querySelectorAll?.(".ntdelbutton").forEach((button) => button.remove());
    return String(clone.textContent || "")
      .replace(/[\u00a0\t\r\n]+/g, " ")
      .replace(/^[x\u00D7]\s*/i, "")
      .trim();
  },
  checklist(root = document) {
    return this.checklistItems(root)
      .map((item) => this.itemName(item))
      .filter(Boolean);
  },
  selected(root = document) {
    return this.unique([...this.get(root), ...this.checklist(root)]);
  },
  has(name, root = document) {
    const key = this.normalizeName(name);
    if (!key) return false;
    return this.selected(root).some((value) => this.normalizeName(value) === key);
  },
  lower: (value) => /^[\u0430-\u044f\u0451a-z]/u.test(value),
  upper: (value) =>
    value.replace(/^([\u0430-\u044f\u0451a-z])/u, (letter) =>
      letter.toLocaleUpperCase("ru-RU"),
    ),
  ignored(value) {
    const lower = value.toLocaleLowerCase("ru-RU");
    return this.exclude.some((item) => lower.includes(item));
  },
  suggestable(value) {
    const lower = this.normalizeName(value);
    if (!lower || this.ignored(lower)) return false;
    return !/(^|[\s_-])\u0441\u043f($|[\s_-])/iu.test(lower);
  },
  invalid(root = document) {
    return [
      ...new Set(
        this.get(root).filter(
          (value) => this.lower(value) && !this.ignored(value),
        ),
      ),
    ];
  },
  search(name) {
    return (
      `${this.admin()}edit-tags.php?taxonomy=post_tag&post_type=post&s=` +
      encodeURIComponent(name)
    );
  },
  page(name) {
    return `${this.search(name)}`;
  },
  rowName(row) {
    return (
      row.querySelector(".row-title")?.textContent ||
      row.querySelector(".column-name strong")?.textContent ||
      ""
    ).trim();
  },
  rows(doc) {
    return Array.from(doc.querySelectorAll("tr[id^='tag-']"));
  },
  escape(value) {
    return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  },
  match(row, name) {
    const title = this.normalizeName(this.rowName(row));
    const current = this.normalizeName(name);
    if (!title || !current) return false;
    if (title === current) return true;
    return new RegExp(`(^|\\s)${this.escape(current)}(\\s|$)`, "u").test(title);
  },
  async autocomplete(name) {
    const body = new URLSearchParams({
      action: "ajax-tag-search",
      tax: "post_tag",
      q: name,
    });
    const response = await fetch(`${this.admin()}admin-ajax.php`, {
      method: "POST",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });
    if (!response.ok) return [];
    return (await response.text())
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);
  },
  async findByAutocomplete(name) {
    const items = await this.autocomplete(name);
    const current = this.normalizeName(name);
    const exact = items.find((item) => this.normalizeName(item) === current);
    const partial = items.find((item) => this.matchName(item, name));
    const title = exact || partial || "";
    return title ? { name: title } : null;
  },
  matchName(title, name) {
    const value = this.normalizeName(title);
    const current = this.normalizeName(name);
    if (!value || !current) return false;
    if (value === current) return true;
    return new RegExp(`(^|\\s)${this.escape(current)}(\\s|$)`, "u").test(value);
  },
  async findByPage(name) {
    const html = await fetch(this.search(name), {
      credentials: "same-origin",
    }).then((response) => response.text());
    const doc = this.parse(html);
    const row = this.rows(doc).find((item) => this.match(item, name));
    if (!row) return null;
    const title = this.rowName(row);
    return title ? { name: title } : null;
  },
  async find(name) {
    return (await this.findByAutocomplete(name)) || (await this.findByPage(name));
  },
  add(name, root = document) {
    const input = root.querySelector("#new-tag-post_tag");
    const button = root.querySelector("#post_tag .tagadd");
    if (!input || !button) return false;
    input.value = name;
    this.emit(input);
    button.click();
    return true;
  },
  remove(name, root = document) {
    const key = this.normalizeName(name);
    if (!key) return false;
    const item = this.checklistItems(root).find(
      (element) => this.normalizeName(this.itemName(element)) === key,
    );
    const button = item?.querySelector(".ntdelbutton");
    if (button) {
      button.click();
      return true;
    }
    const input = this.input(root);
    const current = this.get(root);
    const next = current.filter((value) => this.normalizeName(value) !== key);
    if (!input || next.length === current.length) return false;
    input.value = next.join(", ");
    this.emit(input);
    return true;
  },
  toggle(name, root = document) {
    return this.has(name, root) ? this.remove(name, root) : this.add(name, root);
  },
  async rename(name) {
    const next = this.upper(name);
    try {
      const html = await fetch(this.search(name), {
        credentials: "same-origin",
      }).then((response) => response.text());
      const doc = this.parse(html);
      const rows = this.rows(doc);
      const row = rows.find((item) => this.match(item, name));
      if (!row) throw new Error("\u043d\u0435 \u043d\u0430\u0439\u0434\u0435\u043d\u0430");
      const id = row.id.match(/\d+/)?.[0];
      const slug = row.querySelector(".column-slug")?.textContent.trim() || "";
      const nonce = doc.querySelector("#_inline_edit")?.value;
      if (!id || !nonce) throw new Error("\u043d\u0435\u0442 id/nonce");
      const body = new URLSearchParams({
        action: "inline-save-tax",
        tax_ID: id,
        taxonomy: "post_tag",
        post_type: "post",
        name: next,
        slug,
        _inline_edit: nonce,
      });
      const response = await fetch(`${this.admin()}admin-ajax.php`, {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body,
      });
      const result = await response.text();
      if (!response.ok || /error|\u043e\u0448\u0438\u0431\u043a\u0430/i.test(result)) {
        throw new Error("\u043d\u0435 \u0441\u043e\u0445\u0440\u0430\u043d\u0438\u043b\u0430\u0441\u044c");
      }
      return { status: "ok", old: name, next };
    } catch (error) {
      return { status: "error", name, error: error.message };
    }
  },
  apply(input, current, results) {
    const updated = new Map(
      results
        .filter((result) => result.status === "ok")
        .map((result) => [result.old, result.next]),
    );
    if (!input) return;
    input.value = current.map((name) => updated.get(name) || name).join(", ");
    this.emit(input);
  },
  report(results) {
    const ok = results.filter((result) => result.status === "ok");
    const err = results.filter((result) => result.status === "error");
    let message = "";
    if (ok.length) {
      message +=
        "\u2714\uFE0F \u0418\u0441\u043f\u0440\u0430\u0432\u043b\u0435\u043d\u043e:\n" +
        ok.map((result) => `${result.old} \u2192 ${result.next}`).join("\n");
    }
    if (err.length) {
      if (message) message += "\n\n";
      message +=
        "\u274C \u041E\u0448\u0438\u0431\u043a\u0438:\n" +
        err.map((result) => `${result.name} \u2014 ${result.error}`).join("\n");
    }
    return {
      ok,
      err,
      message: message || "\u041E\u043a",
    };
  },
};
const excerpt = {
  limit: 444,
  threshold: 125,
  lead(string) {
    const source = String(string || "");
    const beforeMore = source.split(/<!--more-->/i)[0] || source;
    const firstParagraph = beforeMore.match(/<p\b[^>]*>[\s\S]*?<\/p>/i)?.[0];
    const firstBlock =
      firstParagraph ||
      beforeMore
        .split(/\n\s*\n/)
        .find((part) => contentMarkup.strip(part).trim()) ||
      "";
    const stripped = contentMarkup
      .strip(firstBlock)
      .replace(/\s*\n+\s*/g, " ")
      .trim();
    return text.nbsp(text.whitespace(stripped));
  },
  percent(value, max = excerpt.limit) {
    return Math.round((((value || "").trim().length || 0) / max) * 100);
  },
  empty(value) {
    return !(value || "").trim();
  },
  long(value, threshold = excerpt.threshold, max = excerpt.limit) {
    return excerpt.percent(value, max) > threshold;
  },
  message(value, max = excerpt.limit) {
    const percent = excerpt.percent(value, max);
    if (percent <= 100) {
      return `\u0426\u0438\u0442\u0430\u0442\u0430 \u0438 \u0442\u0430\u043a \u0445\u043e\u0440\u043e\u0448\u0430 (${percent}%)`;
    }
    if (percent <= excerpt.threshold) {
      return `\u0426\u0438\u0442\u0430\u0442\u0430 \u0442\u0430\u043a \u0441\u0435\u0431\u0435 (${percent}%)`;
    }
    return `\u0426\u0438\u0442\u0430\u0442\u0430 \u0441\u043e\u0432\u0441\u0435\u043c \u043f\u043b\u043e\u0445\u0430 (${percent}%)`;
  },
  state(value, contentValue, threshold = excerpt.threshold, max = excerpt.limit) {
    const current = (value || "").trim();
    const lead = excerpt.lead(contentValue);
    const percent = excerpt.percent(current, max);
    const empty = !current;
    const long = percent > threshold;
    return {
      current,
      lead,
      percent,
      empty,
      long,
      invalid: empty || long,
      message: excerpt.message(current, max),
    };
  },
  style(field, max = excerpt.limit) {
    if (!field) return null;
    let counter = document.getElementById("excerpt-counter");
    if (!counter) {
      counter = document.createElement("div");
      counter.id = "excerpt-counter";
      counter.style.cssText = [
        "margin-top:5px",
        "font:10px Consolas,Monaco,monospace",
        "text-align:right",
        "white-space:nowrap",
        "padding:0",
        "box-sizing:border-box",
      ].join(";");
      field.insertAdjacentElement("afterend", counter);
    }
    const paint = () => {
      const value = field.value || "";
      const percent = excerpt.percent(value, max);
      const ratio = percent / 100;
      const tone =
        ratio <= 1
          ? `hsl(${220 - 100 * Math.max(0, Math.min((ratio - 0.75) / 0.25, 1))} 60% 45%)`
          : `hsl(${120 - 120 * Math.max(0, Math.min((ratio - 1) / 0.25, 1))} 75% 45%)`;
      const width =
        (1 + Math.max(0, 1 - Math.abs(ratio - 1) / 0.1)).toFixed(2) + "px";
      field.style.outlineWidth = width;
      field.style.outlineStyle = "solid";
      field.style.outlineColor = tone;
      field.style.transition = "outline-color .2s ease, outline-width .2s ease";
      counter.style.color = tone;
      counter.style.width = field.offsetWidth + "px";
      counter.textContent = `${value.length}/${max} \u00B7 ${percent}%`;
    };
    field.removeEventListener("input", field._excerptPaint);
    field._excerptPaint = paint;
    field.addEventListener("input", paint);
    paint();
    return paint;
  },
};
const submit = {
  issues: [],
  running: false,
  element(selector, root = document) {
    return root === document
      ? field.element(selector)
      : root.querySelector(selector);
  },
  emit(input) {
    field.emit(input);
  },
  mark(container, input) {
    if (container) {
      container.style.outline = "2px solid red";
      container.style.background = "#ffffe1";
    }
    if (input) {
      input.style.outline = "1px solid red";
      input.style.background = "#ffffe1";
    }
  },
  state() {
    const excerptField = this.element("#excerpt");
    const content = this.element("#content");
    const contentText = content?.value || "";
    const videoAuthor = this.element("#video_author");
    return {
      slug: this.element("#editable-post-name"),
      slugInput:
        this.element("#new-post-slug") ||
        this.element('#edit-slug-box input[type="text"]'),
      seoTitle: this.element('input[name="seo_title"]'),
      thumbnail: this.element("#set-post-thumbnail img"),
      excerptField,
      content,
      contentText,
      tagsInput: tag.input(),
      video: this.element("#juicyVideo"),
      videoAuthor,
      filledVideoAuthor: !!videoAuthor && !!videoAuthor.value.trim(),
    };
  },
  seo(state) {
    return state?.seoTitle || null;
    const seoTitle = state.seoTitle;
    if (!seoTitle?.value.trim()) return;
    if (field.confirm("Есть SEO-заг. Выпиливаем?")) {
      seoTitle.value = "";
      this.emit(seoTitle);
    }
  },
  slug(state) {
    const long =
      !!state.slug && /…|&hellip;|&#8230;/i.test(state.slug.textContent || "");
    const opened = !!state.slugInput;
    if (long || opened) {
      this.issues.push("⚠️ Слаг");
      if (long) this.element("#edit-slug-buttons .edit-slug")?.click();
    }
    return { long, opened };
  },
  excerpt(state) {
    excerpt.style(state.excerptField);
    const initial = excerpt.state(
      state.excerptField?.value || "",
      state.contentText,
    );
    if (initial.empty && state.excerptField && initial.lead) {
      state.excerptField.value = initial.lead;
      this.emit(state.excerptField);
    }
    const current = excerpt.state(
      state.excerptField?.value || "",
      state.contentText,
    );
    if (current.invalid) {
      this.issues.push("⚠️ Цитата");
      this.mark(null, state.excerptField);
    }
    return current;
  },
  thumbnail(state) {
    const empty = !state.thumbnail;
    if (empty) {
      this.issues.push("⚠️ Миниатюра");
      this.mark(this.element("#postimagediv"));
    }
    return { empty };
  },
  async tags(state) {
    let invalid = tag.invalid();
    if (invalid.length && state.tagsInput) {
      const planned = invalid
        .map((name) => `${name} → ${tag.upper(name)}`)
        .join("\n");
      if (field.confirm(`Исправить метки?\n\n${planned}`)) {
        const current = tag.get();
        const results = [];
        for (const name of invalid) {
          results.push(await tag.rename(name));
        }
        tag.apply(state.tagsInput, current, results);
        const report = tag.report(results);
        invalid = tag.invalid();
        if (report.err.length) {
          setTimeout(() => field.alert(report.message), 0);
        }
      }
    }
    if (invalid.length) {
      this.issues.push(`⚠️ Метки: ${invalid.join(", ")}`);
      this.mark(this.element("#tagsdiv-post_tag"), state.tagsInput);
    }
    return { invalid };
  },
  video(state) {
    if (state.video) {
      const checked = /\[video\]|\[\/video\]|<iframe[^>]*youtube/i.test(
        state.contentText,
      );
      if (state.video.checked !== checked) {
        state.video.checked = checked;
        this.emit(state.video);
      }
    }
    const has =
      /\[video\][\s\S]*?(youtube\.com|youtu\.be)[\s\S]*?\[\/video\]/i.test(
        state.contentText,
      ) || /<iframe[^>]*youtube/i.test(state.contentText);
    if (state.filledVideoAuthor && !has) {
      this.issues.push("⚠️ Видео");
      this.mark(null, state.videoAuthor);
      setTimeout(() => {
        if (field.confirm("⚠️ Видео\n\nОчистить автора?")) {
          state.videoAuthor.value = "";
          this.emit(state.videoAuthor);
        }
      }, 0);
    }
    return { has };
  },
  focus(details) {
    let attempts = 0;
    const focusIssues = setInterval(() => {
      const slugInput =
        this.element("#new-post-slug") ||
        this.element('#edit-slug-box input[type="text"]');
      if ((details.slug.long || details.slug.opened) && slugInput) {
        clearInterval(focusIssues);
        const seoTitle = this.element('input[name="seo_title"]')?.value.trim();
        const title = this.element("#title")?.value.trim();
        const slugSource = seoTitle || title;
        if (slugSource && (details.slug.long || !seoTitle)) {
          slugInput.value = slugSource;
          this.emit(slugInput);
        }
        this.mark(null, slugInput);
        slugInput.focus();
        slugInput.select();
        slugInput.scrollIntoView({ block: "center", behavior: "smooth" });
        if (this.issues.length > 1) {
          setTimeout(
            () => field.alert("🚧\n\n" + this.issues.join("\n")),
            timer.summaryDelay,
          );
        }
        return;
      }
      if (!details.slug.long || ++attempts > timer.focusAttempts) {
        clearInterval(focusIssues);
        const first = details.slug.long
          ? this.element("#edit-slug-box")
          : details.thumbnail.empty
            ? this.element("#postimagediv")
            : details.excerpt.invalid
              ? details.state.excerptField
              : details.tags.invalid.length
                ? this.element("#tagsdiv-post_tag")
                : details.state.videoAuthor?.closest(".layout-field") ||
                  details.state.videoAuthor?.parentElement;
        first?.scrollIntoView({ block: "center", behavior: "smooth" });
        if (
          !details.slug.long &&
          details.excerpt.invalid &&
          details.state.excerptField
        ) {
          details.state.excerptField.focus();
          details.state.excerptField.select();
        }
        if (
          !details.slug.long &&
          !details.excerpt.invalid &&
          details.tags.invalid.length &&
          details.state.tagsInput
        ) {
          details.state.tagsInput.focus();
          details.state.tagsInput.select();
        }
        if (
          !details.slug.long &&
          !details.excerpt.invalid &&
          !details.tags.invalid.length &&
          details.state.filledVideoAuthor &&
          !details.video.has &&
          details.state.videoAuthor
        ) {
          details.state.videoAuthor.focus();
          details.state.videoAuthor.select();
        }
        if (this.issues.length > 1) {
          setTimeout(
            () => field.alert("🚧\n\n" + this.issues.join("\n")),
            timer.summaryDelay,
          );
        }
      }
    }, timer.focusTick);
  },
  guard() {
    const layout = cms.layout.element();
    if (!layout || !cms.layout.longread(cms.layout.value(layout))) return true;
    const sticky = this.element("input[name='sticky']:checked")?.value || "";
    const stickySide = sticky === "left" || sticky === "right";
    const hour = Number(
      this.element("#hh")?.value || this.element("#hidden_hh")?.value || NaN,
    );
    const scheduled = hour === 7 || hour === 8;
    if (stickySide || scheduled) return true;
    return field.confirm("⚠️ Лонгрид\n\nСтавим?");
  },
  click(action) {
    if (action === "save") return cms.editor.save({ click: true });
    return cms.editor.publish({ click: true });
  },
  afterPublish() {
    let attempts = 0;
    const waitAdvert = setInterval(() => {
      const advertPopup = this.element("#advert");
      const advertButton = this.element("#post-advert");
      if (
        advertPopup &&
        getComputedStyle(advertPopup).display !== "none" &&
        advertButton
      ) {
        clearInterval(waitAdvert);
        advertButton.click();
      } else if (++attempts > timer.advertAttempts) {
        clearInterval(waitAdvert);
      }
    }, timer.advertTick);
  },
  submit(state, action) {
    if (!this.guard()) return;
    if (state.content?.value.trim()) {
      state.content.value = widget.ensure(state.content.value);
      this.emit(state.content);
    }
    const button = this.click(action);
    if (!button) return;
    if (action === "publish") {
      this.afterPublish();
    }
  },
  async execute(action = "publish") {
    if (this.running) return;
    this.running = true;
    this.issues = [];
    try {
      const state = this.state();
      this.seo(state);
      const slug = this.slug(state);
      const excerptState = this.excerpt(state);
      const thumbnail = this.thumbnail(state);
      const tagsState = await this.tags(state);
      const videoState = this.video(state);
      if (this.issues.length) {
        this.focus({
          state,
          slug,
          excerpt: excerptState,
          thumbnail,
          tags: tagsState,
          video: videoState,
        });
        return;
      }
      this.submit(state, action);
    } finally {
      this.running = false;
    }
  },
  run(action = "publish") {
    return cms.vpn
      .ensure()
      .then(() => this.execute(action))
      .catch((error) => {
        field.alert(error.message);
      });
  },
};

  const admin = {
    diff: {
      ids: {
        style: "diff-style",
        panel: "diff-panel",
        inlineBox: "diff-inline-box",
      },
      legacy: {
        styles: ["odi-style", "diff-panel-style"],
        panels: ["odi-panel"],
        inlineBox: "odi-inline-box",
      },
      state: {
        panelSnapshot: null,
      },
      tables() {
        return [...document.querySelectorAll("table.diff")].filter((table) =>
          table.querySelector(".diff-deletedline,.diff-addedline,.diff-context"),
        );
      },
      decode(value) {
        const textarea = document.createElement("textarea");
        textarea.innerHTML = String(value || "");
        return textarea.value;
      },
      unwrap(value) {
        return String(value || "").replace(/<\/?(ins|del)[^>]*>/gi, "");
      },
      analyze(value) {
        return admin.diff.decode(admin.diff.unwrap(value));
      },
      visible(value) {
        return admin.diff
          .analyze(value)
          .replace(/<[^>]*>/g, "")
          .replace(/\s+/g, " ")
          .trim();
      },
      skeleton(value) {
        return (admin.diff.analyze(value).match(/<\/?[a-z][^>]*>/gi) || [])
          .map((tag) => tag.replace(/\s+/g, " ").toLowerCase())
          .join("\n");
      },
      escape(value) {
        return String(value || "")
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;");
      },
      payloads(value) {
        const source = String(value || "");
        const patch = {
          "onliner-promo-widget"(data) {
            if (typeof data.text === "string") {
              data.text = admin.diff.decode(data.text);
            }
            return data;
          },
          "onliner-vote"(data) {
            const next = { ...data };
            next.variants = Array.isArray(data?.variants)
              ? data.variants.map((item) => ({
                ...item,
                description: typeof item?.description === "string"
                  ? admin.diff.decode(item.description)
                  : item?.description,
              }))
              : data?.variants;
            return next;
          },
        };
        return widget.tag.list.reduce((result, tag) =>
          result.replace(
            new RegExp(`(\\[${tag}\\])({[\\s\\S]*?})(\\[\\/${tag}\\])`, "g"),
            (match, open, json, close) => {
              try {
                const data = JSON.parse(admin.diff.decode(json));
                const current = patch[tag] ? patch[tag](data) : data;
                return `${open}<pre>${admin.diff.escape(
                  JSON.stringify(current, null, 2),
                )}</pre>${close}`;
              } catch {
                return match;
              }
            },
          ), source);
      },
      display(value) {
        return admin.diff.payloads(value);
      },
      classify(deleted, added) {
        const deletedHtml = deleted ? deleted.innerHTML : "";
        const addedHtml = added ? added.innerHTML : "";
        if (!deleted || !added) {
          const html = deleted ? deletedHtml : addedHtml;
          return {
            text: Boolean(admin.diff.visible(html)),
            markup: Boolean(admin.diff.skeleton(html)),
          };
        }
        return {
          text: admin.diff.visible(deletedHtml) !== admin.diff.visible(addedHtml),
          markup:
            admin.diff.skeleton(deletedHtml) !== admin.diff.skeleton(addedHtml),
        };
      },
      stats(tables) {
        const stats = {
          inserted: 0,
          deleted: 0,
          addedLines: 0,
          deletedLines: 0,
          text: 0,
          markup: 0,
          mixed: 0,
          warnings: [],
        };
        tables.forEach((table) => {
          stats.inserted += table.querySelectorAll("ins").length;
          stats.deleted += table.querySelectorAll("del").length;
          stats.addedLines += table.querySelectorAll(".diff-addedline").length;
          stats.deletedLines += table.querySelectorAll(".diff-deletedline").length;
          table.querySelectorAll("tr").forEach((row) => {
            const deleted = row.querySelector(".diff-deletedline");
            const added = row.querySelector(".diff-addedline");
            if (!deleted && !added) return;
            const type = admin.diff.classify(deleted, added);
            if (type.text) stats.text += 1;
            if (type.markup) stats.markup += 1;
            if (type.text && type.markup) stats.mixed += 1;
          });
        });
        if (stats.deletedLines > 20) stats.warnings.push("много удалённых строк");
        if (stats.addedLines > 20) stats.warnings.push("много добавленных строк");
        if (stats.markup > 10) stats.warnings.push("много правок разметки");
        if (stats.mixed > 10) stats.warnings.push("много смешанных строк");
        return stats;
      },
      theme() {
        return (
          document.querySelector('.panel[data-ui-surface="toolbar"]')?.dataset
            ?.theme ||
          document.getElementById("reader-panel")?.dataset?.theme ||
          "light"
        );
      },
      mode: {
        get() {
          return document.body.dataset.diffMode || document.body.dataset.odiMode || "";
        },
        set(value) {
          document.body.dataset.diffMode = value;
          document.body.dataset.diffTheme = admin.diff.themeValue();
          delete document.body.dataset.odiMode;
        },
        clear() {
          delete document.body.dataset.diffMode;
          delete document.body.dataset.diffTheme;
          delete document.body.dataset.diffOrder;
          delete document.body.dataset.odiMode;
        },
      },
      order: {
        get() {
          return document.body.dataset.diffOrder === "deleted-first"
            ? "deleted-first"
            : "added-first";
        },
        toggle() {
          const next = admin.diff.order.get() === "added-first"
            ? "deleted-first"
            : "added-first";
          document.body.dataset.diffOrder = next;
          return next;
        },
        clear() {
          delete document.body.dataset.diffOrder;
        },
      },
      themeValue() {
        const value = document.body.dataset.diffTheme || admin.diff.theme();
        return value === "dark" ? "dark" : "light";
      },
      themeSet(value) {
        const next = value === "dark" ? "dark" : "light";
        document.body.dataset.diffTheme = next;
        const element = document.getElementById(admin.diff.ids.panel);
        if (!element) return next;
        ui.surface.sync(element, { theme: next, surface: "toolbar" });
        ui.controls.panelActionsSync(element, {
          theme: next,
          themeAction: "diff.theme",
        });
        return next;
      },
      themeToggle() {
        return admin.diff.themeSet(
          admin.diff.themeValue() === "dark" ? "light" : "dark",
        );
      },
      style() {
        panel.mount(admin.diff.ids.style, css.diff.panel());
      },
      markers() {
        document
          .querySelectorAll("td.diff-deletedline,td.diff-addedline,td.diff-context")
          .forEach((cell) => {
            const marker = cell.previousElementSibling;
            if (
              marker &&
              marker.tagName === "TD" &&
              /^[+\-\s\u00a0]*$/.test(marker.textContent)
            ) {
              marker.dataset.diffMarker = "1";
              marker.dataset.diffDisplay = marker.style.display || "";
              marker.style.display = "none";
            }
          });
      },
      restoreMarkers() {
        document.querySelectorAll("[data-diff-marker],[data-odi-marker]").forEach((marker) => {
          marker.style.display =
            marker.dataset.diffDisplay || marker.dataset.odiDisplay || "";
          marker.removeAttribute("data-diff-marker");
          marker.removeAttribute("data-diff-display");
          marker.removeAttribute("data-odi-marker");
          marker.removeAttribute("data-odi-display");
        });
      },
      cells() {
        document
          .querySelectorAll("td.diff-deletedline,td.diff-addedline,td.diff-context")
          .forEach((cell) => {
            if (cell.dataset.diffHtml || cell.dataset.odiHtml) return;
            cell.dataset.diffHtml = cell.innerHTML;
            cell.innerHTML = admin.diff.display(cell.innerHTML);
          });
      },
      restoreCells() {
        document.querySelectorAll("[data-diff-html],[data-odi-html]").forEach((cell) => {
          cell.innerHTML = cell.dataset.diffHtml || cell.dataset.odiHtml || "";
          cell.removeAttribute("data-diff-html");
          cell.removeAttribute("data-odi-html");
        });
      },
      sourceCell(row, kind) {
        if (kind === "deleted") return row.querySelector(".diff-deletedline");
        if (kind === "added") return row.querySelector(".diff-addedline");
        const list = [...row.querySelectorAll(".diff-context")];
        if (!list.length) return null;
        return kind === "right" ? list[list.length - 1] : list[0];
      },
      sourceValue(cell) {
        if (!cell) return "";
        return admin.diff.analyze(cell.innerHTML).replace(/\s+$/g, "");
      },
      sourceLine(row) {
        const deleted = admin.diff.sourceCell(row, "deleted");
        const added = admin.diff.sourceCell(row, "added");
        const left = deleted || admin.diff.sourceCell(row, "left");
        const right = added || admin.diff.sourceCell(row, "right");
        return {
          left: admin.diff.sourceValue(left),
          right: admin.diff.sourceValue(right),
        };
      },
      source(tables) {
        const rows = tables.flatMap((table) => [...table.querySelectorAll("tr")]);
        const lines = rows.map(admin.diff.sourceLine);
        return {
          left: lines.map((line) => line.left).join("\n"),
          right: lines.map((line) => line.right).join("\n"),
          origin: "table",
        };
      },
      revision: {
        cache: {},
        selected(name) {
          return String(
            document.querySelector(`#post-revisions input[name="${name}"]:checked`)
              ?.value || "",
          );
        },
        selectedPair() {
          return {
            leftId: admin.diff.revision.selected("left"),
            rightId: admin.diff.revision.selected("right"),
          };
        },
        row(id) {
          const value = String(id || "");
          if (!value) return null;
          return document
            .querySelector(`#post-revisions input[value="${value}"]`)
            ?.closest("tr") || null;
        },
        target(id) {
          const value = String(id || "");
          const row = admin.diff.revision.row(value);
          const link = row?.querySelector('a[href*="action=edit"]');
          return {
            id: value,
            found: Boolean(row),
            url: link?.href || "",
            label: String(row?.textContent || "").replace(/\s+/g, " ").trim(),
          };
        },
        url(id) {
          return admin.diff.revision.target(id).url;
        },
        contentInfo(documentNode) {
          const selectors = [
            "#content",
            "textarea[name='content']",
            "textarea[name='post_content']",
            ".wp-editor-area",
            "#post_content",
            "textarea",
          ];
          const matches = selectors.flatMap((selector) =>
            [...documentNode.querySelectorAll(selector)].map((element) => {
              const value = String(element.value || element.textContent || "");
              return {
                selector,
                tag: String(element.tagName || "").toLowerCase(),
                id: element.id || "",
                name: element.getAttribute("name") || "",
                length: value.length,
                value,
              };
            }),
          );
          const seen = new Set();
          const unique = matches.filter((item) => {
            const key = [item.selector, item.tag, item.id, item.name, item.length]
              .join("::");
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });
          const picked = unique.find((item) => item.id === "content") ||
            unique.find((item) => item.name === "content") ||
            unique.find((item) => item.name === "post_content") ||
            unique.find((item) => item.length > 200) ||
            unique[0] ||
            null;
          return {
            selector: picked?.selector || "",
            tag: picked?.tag || "",
            id: picked?.id || "",
            name: picked?.name || "",
            length: picked?.length || 0,
            value: picked?.value || "",
            candidates: unique.map(({ value, ...item }) => item),
          };
        },
        content(documentNode) {
          return admin.diff.revision.contentInfo(documentNode).value;
        },
        sample(value, limit = 1400) {
          const current = String(value || "").replace(/\r\n?/g, "\n");
          if (current.length <= limit) return current;
          return `${current.slice(0, limit)}\n…`;
        },
        attr(element, name) {
          return String(element?.getAttribute?.(name) || "");
        },
        formInfo(documentNode) {
          return [...documentNode.querySelectorAll("form")].map((form, index) => ({
            index,
            id: form.id || "",
            name: admin.diff.revision.attr(form, "name"),
            action: admin.diff.revision.attr(form, "action"),
            method: admin.diff.revision.attr(form, "method"),
            text: admin.diff.revision.sample(form.textContent, 220),
          }));
        },
        hiddenInfo(documentNode) {
          return [...documentNode.querySelectorAll('input[type="hidden"]')]
            .slice(0, 80)
            .map((input) => ({
              id: input.id || "",
              name: input.name || "",
              value: admin.diff.revision.sample(input.value, 220),
            }));
        },
        markerInfo(html) {
          const value = String(html || "");
          return {
            content: /post_content|name=["']content["']|id=["']content["']/i.test(value),
            textarea: /<textarea/i.test(value),
            revision: /revision/i.test(value),
            diff: /table[^>]+class=["'][^"']*diff/i.test(value),
            login: /wp-login|loginform|user_login/i.test(value),
          };
        },
        documentInfo(documentNode, html, response) {
          return {
            responseUrl: response?.url || "",
            title: documentNode.title || "",
            htmlLength: String(html || "").length,
            bodyText: admin.diff.revision.sample(documentNode.body?.textContent || ""),
            forms: admin.diff.revision.formInfo(documentNode),
            hidden: admin.diff.revision.hiddenInfo(documentNode),
            markers: admin.diff.revision.markerInfo(html),
          };
        },
        emptyInspect(target, error) {
          return {
            ...target,
            ok: false,
            status: 0,
            error,
            content: admin.diff.revision.contentInfo(document),
            document: admin.diff.revision.documentInfo(document, document.documentElement?.outerHTML || ""),
          };
        },
        async inspect(id) {
          const target = admin.diff.revision.target(id);
          if (!target.id || !target.url) {
            return admin.diff.revision.emptyInspect(
              target,
              target.id ? "edit link not found" : "revision id not selected",
            );
          }
          if (Object.hasOwn(admin.diff.revision.cache, target.id)) {
            return admin.diff.revision.cache[target.id];
          }
          try {
            const response = await fetch(target.url, {
              credentials: "same-origin",
              cache: "no-store",
            });
            const html = await response.text();
            const documentNode = new DOMParser().parseFromString(html, "text/html");
            const content = admin.diff.revision.contentInfo(documentNode);
            const info = admin.diff.revision.documentInfo(documentNode, html, response);
            const result = {
              ...target,
              ok: response.ok && Boolean(content.value),
              status: response.status,
              htmlLength: html.length,
              title: info.title,
              content,
              document: info,
              error: response.ok
                ? content.value ? "" : "content not found"
                : `http ${response.status}`,
            };
            admin.diff.revision.cache[target.id] = result;
            return result;
          } catch (error) {
            const result = admin.diff.revision.emptyInspect(
              target,
              error.message || "revision fetch failed",
            );
            admin.diff.revision.cache[target.id] = result;
            return result;
          }
        },
        async fetch(id) {
          return (await admin.diff.revision.inspect(id)).content.value;
        },
        async source() {
          const pair = admin.diff.revision.selectedPair();
          const [left, right] = await Promise.all([
            admin.diff.revision.fetch(pair.leftId),
            admin.diff.revision.fetch(pair.rightId),
          ]);
          if (!left || !right) return null;
          return {
            left,
            right,
            origin: "revision",
          };
        },
      },
      async fullSource(tables) {
        return (await admin.diff.revision.source()) || admin.diff.source(tables);
      },
      token(value, index) {
        const raw = String(value || "");
        const word = /^[\p{L}\p{N}_-]+$/u.test(raw);
        const html = /^<[^>]+>$/u.test(raw);
        const comment = /^<!--[\s\S]*-->$/u.test(raw);
        const widget = /^\[onliner-/u.test(raw);
        const space = /^\s+$/u.test(raw);
        const breakable = /\n/u.test(raw);
        const symbol = !word && !html && !comment && !widget && !space;
        const lower = raw.toLocaleLowerCase("ru-RU");
        return {
          value: raw,
          key: word ? lower : raw,
          index,
          word,
          html,
          comment,
          widget,
          space,
          breakable,
          symbol,
          anchor: !space && (html || comment || widget || word && lower.length > 2),
        };
      },
      tokenize(value) {
        const source = String(value || "").replace(/\r\n?/g, "\n");
        const pattern = /\[onliner-[\s\S]*?\[\/onliner-[^\]]+\]|<!--[\s\S]*?-->|<\/?[^>]+>|&[a-z0-9#]+;|[\p{L}\p{N}_-]+|\n+|[ \t]+|[^\s]/giu;
        return (source.match(pattern) || []).map(admin.diff.token);
      },
      anchorIndex(tokens, range) {
        const result = {};
        tokens.slice(range.start, range.end).forEach((token, offset) => {
          if (!token.anchor) return;
          const list = result[token.key] || [];
          list.push(range.start + offset);
          result[token.key] = list;
        });
        Object.keys(result).forEach((key) => {
          if (result[key].length > 32) delete result[key];
        });
        return result;
      },
      tokenIndex(tokens) {
        return admin.diff.anchorIndex(tokens, {
          start: 0,
          end: tokens.length,
        });
      },
      tokenMatch(left, right, index, range) {
        let best = {
          left: range.leftStart,
          right: range.rightStart,
          size: 0,
        };
        let previous = new Map();
        for (let leftIndex = range.leftStart; leftIndex < range.leftEnd; leftIndex += 1) {
          const token = left[leftIndex];
          const positions = token.anchor ? index[token.key] || [] : [];
          const current = new Map();
          positions.forEach((rightIndex) => {
            if (rightIndex < range.rightStart || rightIndex >= range.rightEnd) return;
            const size = (previous.get(rightIndex - 1) || 0) + 1;
            current.set(rightIndex, size);
            if (size <= best.size) return;
            best = {
              left: leftIndex - size + 1,
              right: rightIndex - size + 1,
              size,
            };
          });
          previous = current;
        }
        return best;
      },
      tokenEqual(left, right) {
        if (!left || !right) return false;
        if (left.space && right.space) return left.breakable === right.breakable;
        return left.key === right.key;
      },
      tokenExact(left, right) {
        const limit = 70000;
        if (!left.length || !right.length || left.length * right.length > limit) {
          return [
            { type: "deleted", tokens: left },
            { type: "added", tokens: right },
          ].filter((item) => item.tokens.length);
        }
        const width = right.length + 1;
        const score = new Uint16Array((left.length + 1) * width);
        for (let leftIndex = left.length - 1; leftIndex >= 0; leftIndex -= 1) {
          for (let rightIndex = right.length - 1; rightIndex >= 0; rightIndex -= 1) {
            const index = leftIndex * width + rightIndex;
            if (admin.diff.tokenEqual(left[leftIndex], right[rightIndex])) {
              score[index] = score[(leftIndex + 1) * width + rightIndex + 1] + 1;
            } else {
              score[index] = Math.max(
                score[(leftIndex + 1) * width + rightIndex],
                score[leftIndex * width + rightIndex + 1],
              );
            }
          }
        }
        const result = [];
        let leftIndex = 0;
        let rightIndex = 0;
        while (leftIndex < left.length && rightIndex < right.length) {
          if (admin.diff.tokenEqual(left[leftIndex], right[rightIndex])) {
            result.push({ type: "context", tokens: [left[leftIndex]] });
            leftIndex += 1;
            rightIndex += 1;
          } else if (
            score[(leftIndex + 1) * width + rightIndex] >=
            score[leftIndex * width + rightIndex + 1]
          ) {
            result.push({ type: "deleted", tokens: [left[leftIndex]] });
            leftIndex += 1;
          } else {
            result.push({ type: "added", tokens: [right[rightIndex]] });
            rightIndex += 1;
          }
        }
        if (leftIndex < left.length) {
          result.push({ type: "deleted", tokens: left.slice(leftIndex) });
        }
        if (rightIndex < right.length) {
          result.push({ type: "added", tokens: right.slice(rightIndex) });
        }
        return admin.diff.tokenMerge(result);
      },
      tokenDiffRange(left, right, index, range) {
        const match = admin.diff.tokenMatch(left, right, index, range);
        if (!match.size) {
          return admin.diff.tokenExact(
            left.slice(range.leftStart, range.leftEnd),
            right.slice(range.rightStart, range.rightEnd),
          );
        }
        return [
          ...admin.diff.tokenDiffRange(left, right, index, {
            leftStart: range.leftStart,
            leftEnd: match.left,
            rightStart: range.rightStart,
            rightEnd: match.right,
          }),
          {
            type: "context",
            tokens: left.slice(match.left, match.left + match.size),
          },
          ...admin.diff.tokenDiffRange(left, right, index, {
            leftStart: match.left + match.size,
            leftEnd: range.leftEnd,
            rightStart: match.right + match.size,
            rightEnd: range.rightEnd,
          }),
        ];
      },
      tokenMerge(list) {
        return list.reduce((result, item) => {
          if (!item.tokens.length) return result;
          const last = result[result.length - 1];
          if (last && last.type === item.type) {
            last.tokens = [...last.tokens, ...item.tokens];
            return result;
          }
          result.push({ ...item });
          return result;
        }, []);
      },
      tokenFine(left, right) {
        const index = admin.diff.tokenIndex(right);
        return admin.diff.tokenMerge(
          admin.diff.tokenDiffRange(left, right, index, {
            leftStart: 0,
            leftEnd: left.length,
            rightStart: 0,
            rightEnd: right.length,
          }),
        );
      },
      blockTokens(tokens) {
        const blocks = [[]];
        tokens.forEach((token) => {
          blocks[blocks.length - 1].push(token);
          if (!token.breakable || !/\n\s*\n/u.test(token.value)) return;
          blocks.push([]);
        });
        return blocks.filter((block) => block.length);
      },
      blockText(tokens) {
        return tokens
          .filter((token) => !token.space)
          .map((token) => token.key)
          .join("\n");
      },
      blockDiff(left, right) {
        const leftBlocks = admin.diff.blockTokens(admin.diff.tokenize(left));
        const rightBlocks = admin.diff.blockTokens(admin.diff.tokenize(right));
        if (leftBlocks.length < 2 || rightBlocks.length < 2) {
          return admin.diff.tokenFine(admin.diff.tokenize(left), admin.diff.tokenize(right));
        }
        const leftKeys = leftBlocks.map(admin.diff.blockText);
        const rightKeys = rightBlocks.map(admin.diff.blockText);
        const result = [];
        let leftIndex = 0;
        let rightIndex = 0;
        while (leftIndex < leftBlocks.length || rightIndex < rightBlocks.length) {
          if (
            leftIndex < leftBlocks.length &&
            rightIndex < rightBlocks.length &&
            leftKeys[leftIndex] === rightKeys[rightIndex]
          ) {
            result.push({ type: "context", tokens: leftBlocks[leftIndex] });
            leftIndex += 1;
            rightIndex += 1;
            continue;
          }
          const nextLeft = rightIndex < rightBlocks.length
            ? leftKeys.indexOf(rightKeys[rightIndex], leftIndex + 1)
            : -1;
          const nextRight = leftIndex < leftBlocks.length
            ? rightKeys.indexOf(leftKeys[leftIndex], rightIndex + 1)
            : -1;
          if (nextLeft > -1 && (nextRight < 0 || nextLeft - leftIndex <= nextRight - rightIndex)) {
            result.push(...admin.diff.tokenFine(
              leftBlocks.slice(leftIndex, nextLeft).flat(),
              rightBlocks.slice(rightIndex, rightIndex + 1).flat(),
            ));
            leftIndex = nextLeft;
            rightIndex += 1;
            continue;
          }
          if (nextRight > -1) {
            result.push(...admin.diff.tokenFine(
              leftBlocks.slice(leftIndex, leftIndex + 1).flat(),
              rightBlocks.slice(rightIndex, nextRight).flat(),
            ));
            leftIndex += 1;
            rightIndex = nextRight;
            continue;
          }
          if (leftIndex < leftBlocks.length && rightIndex < rightBlocks.length) {
            result.push(...admin.diff.tokenFine(leftBlocks[leftIndex], rightBlocks[rightIndex]));
            leftIndex += 1;
            rightIndex += 1;
            continue;
          }
          if (leftIndex < leftBlocks.length) {
            result.push({ type: "deleted", tokens: leftBlocks[leftIndex] });
            leftIndex += 1;
            continue;
          }
          result.push({ type: "added", tokens: rightBlocks[rightIndex] });
          rightIndex += 1;
        }
        return admin.diff.tokenMerge(result);
      },
      tokenDiff(left, right) {
        return admin.diff.blockDiff(left, right);
      },
      tokenHtml(tokens) {
        return tokens.map((token) => admin.diff.escape(token.value)).join("\n");
      },
      inlineToken(type, token) {
        const value = admin.diff.escape(token.value);
        if (type === "context") return value;
        if (token.space || token.symbol) return value;
        return `<span class="diff-inline-token" data-diff-token="${type}">${value}</span>`;
      },
      inlineTokens(item) {
        return item.tokens
          .map((token) => admin.diff.inlineToken(item.type, token))
          .join("\n");
      },
      inlineHtml(items) {
        return items.map(admin.diff.inlineTokens).join("\n");
      },
      stat(label, value, tone = "neutral") {
        return `<div class="diff-stat" data-diff-tone="${tone}"><span class="diff-stat-label">${label}</span><span class="diff-stat-value">${value}</span></div>`;
      },
      statCluster(label, value, tone = "neutral") {
        return ui.controls.cluster({
          content: admin.diff.stat(label, value, tone),
          group: {
            classes: "diff-stat-cluster",
          },
        });
      },
      statRow(items, classes = "") {
        const value = items.join("");
        const className = ["diff-stat-row", classes].filter(Boolean).join(" ");
        return `<div class="${className}">${value}</div>`;
      },
      modeTitle(value = admin.diff.mode.get()) {
        if (value === "fit") return "Исходный";
        if (value === "inline") return "Инлайн";
        if (value === "split" || value === "reader") return "Слева / справа";
        return "Дифф";
      },
      actionButton({ action = "", title = "", fluent = "", fallback = "", active = false } = {}) {
        return ui.controls.button({
          fluent,
          fallback,
          action,
          title,
          attrs: ` type="button" data-diff-mode-button="true"${active ? ' data-active="true"' : ""}`,
        });
      },
      marker() {
        return ui.controls.marker({
          button: {
            glyph: "⚖️",
            attrs: ' type="button" tabindex="-1" aria-label="Дифф"',
          },
        });
      },
      modeToggle(mode) {
        const inline = mode === "inline";
        return ui.controls.button({
          fluent: inline ? "Column Single Compare" : "Column Double Compare",
          fallback: inline ? "Column Single Compare" : "Column Double Compare",
          action: inline ? "diff.split" : "diff.inline",
          title: inline ? "Полотно" : "Столбы",
          attrs: ' type="button" data-diff-mode-button="true"',
        });
      },
      snapshot() {
        const element = document.getElementById(admin.diff.ids.panel);
        if (!element) return null;
        const rect = element.getBoundingClientRect();
        return {
          left: rect.left,
          top: rect.top,
        };
      },
      restore(element, snapshot = admin.diff.state.panelSnapshot) {
        if (!element || !snapshot) return;
        element.style.position = "fixed";
        element.style.left = `${Math.round(snapshot.left)}px`;
        element.style.top = `${Math.round(snapshot.top)}px`;
        element.style.right = "auto";
        element.style.bottom = "auto";
      },
      scrollSnapshot() {
        const canvas = document.querySelector(".diff-reader-list");
        return {
          top: canvas ? canvas.scrollTop : window.scrollY,
        };
      },
      scrollRestore(snapshot) {
        if (!snapshot) return;
        requestAnimationFrame(() => {
          const canvas = document.querySelector(".diff-reader-list");
          if (canvas) {
            canvas.scrollTop = snapshot.top;
            return;
          }
          window.scrollTo(0, snapshot.top);
        });
      },
      panel(stats) {
        const theme = admin.diff.themeValue();
        const mode = admin.diff.mode.get();
        const head = ui.shell.frame({
          classes: "diff-head",
          attrs: ' data-panel-drag-handle="true"',
          left: admin.diff.marker(),
          main: admin.diff.modeToggle(mode),
          right: ui.controls.panelActions({
            theme,
            themeAction: "diff.theme",
            closeAction: "diff.clear",
          }),
        });
        const changes = admin.diff.statRow([
          admin.diff.statCluster("Вставки", `${stats.inserted} / ${stats.addedLines}`, "add"),
          admin.diff.statCluster("Удаления", `${stats.deleted} / ${stats.deletedLines}`, "del"),
        ], "diff-stat-row-primary");
        const types = admin.diff.statRow([
          admin.diff.statCluster("Текст", stats.text),
          admin.diff.statCluster("HTML", stats.markup),
          admin.diff.statCluster("Микс", stats.mixed),
        ], "diff-stat-row-secondary");
        const element = panel.create({
          id: admin.diff.ids.panel,
          html: ui.shell.stack(`${head}${changes}${types}`),
          draggable: true,
        });
        element.dataset.uiSurface = "toolbar";
        element.dataset.uiFrame = "capsule";
        element.dataset.toolbarFlow = "stack";
        ui.surface.sync(element, { theme, surface: "toolbar" });
        element.addEventListener("click", admin.diff.click);
        ui.controls.panelActionsSync(element, {
          theme,
          themeAction: "diff.theme",
        });
        admin.diff.restore(element);
        admin.diff.state.panelSnapshot = null;
      },
      async click(event) {
        const action = event.target.closest("[data-action]")?.dataset?.action;
        if (action === "diff.clear") {
          admin.diff.clear();
          admin.diff.mode.clear();
          return;
        }
        if (action === "diff.theme") {
          admin.diff.themeToggle();
          return;
        }
        if (action === "diff.split") {
          admin.diff.switch("split");
          return;
        }
        if (action === "diff.inline") {
          admin.diff.switch("inline");
          return;
        }
        if (action === "diff.order") {
          const mode = admin.diff.mode.get();
          const scroll = admin.diff.scrollSnapshot();
          admin.diff.order.toggle();
          await admin.diff.switch(mode === "inline" ? "inline" : "split");
          admin.diff.scrollRestore(scroll);
        }
      },
      lineLabel(kind) {
        return {
          added: "Стало",
          deleted: "Было",
          context: "Контекст",
        }[kind] || "";
      },
      linePart(kind, value) {
        return `<div class="diff-line-part" data-diff-part="${kind}"><div class="diff-line-content">${admin.diff.display(value)}</div></div>`;
      },
      cell(kind, value = "") {
        const empty = value ? "" : ' data-diff-empty="true"';
        return `<div class="diff-cell" data-diff-cell="${kind}"${empty}>${
          value ? admin.diff.display(value) : ""
        }</div>`;
      },
      splitLine(row) {
        const deleted = row.querySelector(".diff-deletedline");
        const added = row.querySelector(".diff-addedline");
        const context = row.querySelector(".diff-context");
        if (deleted && added) {
          return `<div class="diff-row" data-diff-row="change">${admin.diff.cell(
            "deleted",
            deleted.innerHTML,
          )}${admin.diff.cell("added", added.innerHTML)}</div>`;
        }
        if (added) {
          return `<div class="diff-row" data-diff-row="added">${admin.diff.cell(
            "deleted",
          )}${admin.diff.cell("added", added.innerHTML)}</div>`;
        }
        if (deleted) {
          return `<div class="diff-row" data-diff-row="deleted">${admin.diff.cell(
            "deleted",
            deleted.innerHTML,
          )}${admin.diff.cell("added")}</div>`;
        }
        if (context) {
          return `<div class="diff-row" data-diff-row="context">${admin.diff.cell(
            "context",
            context.innerHTML,
          )}</div>`;
        }
        return "";
      },
      inlinePart(kind, value) {
        return `<span class="diff-inline-part" data-diff-part="${kind}">${admin.diff.display(value)}</span>`;
      },
      pretty(value) {
        return admin.diff.display(value).replace(
          /(&lt;\/?[^&]*?&gt;|&lt;!--[\s\S]*?--&gt;)/g,
          (match) => `<span class="diff-html-token">${match}</span>`,
        );
      },
      changeGlyph(kind) {
        return `<div class="diff-change-glyph" data-diff-glyph="${kind}">${ui.controls.icon(
          ui.controls.glyph("Text Paragraph Direction", 16),
        )}</div>`;
      },
      changeSide(kind, value = "", options = {}) {
        const empty = value ? "" : ' data-diff-empty="true"';
        const glyph = options.glyph ? admin.diff.changeGlyph(kind) : "";
        return `<div class="diff-change-side" data-diff-side="${kind}"${empty}>${glyph}<div class="diff-change-content">${value ? admin.diff.pretty(value) : ""}</div></div>`;
      },
      changePair(deleted, added) {
        return `<div class="diff-change-card" data-diff-change="pair">${admin.diff.changeSide(
          "deleted",
          deleted ? deleted.innerHTML : "",
        )}${admin.diff.changeSide("added", added ? added.innerHTML : "")}</div>`;
      },
      changeSingle(kind, value = "") {
        return `<div class="diff-change-card" data-diff-change="${kind}">${admin.diff.changeSide(
          kind,
          value,
        )}</div>`;
      },
      changeContext(value = "") {
        return `<div class="diff-change-card" data-diff-change="context"><div class="diff-change-content">${admin.diff.pretty(value)}</div></div>`;
      },
      splitCell(kind, value = "", options = {}) {
        const empty = value ? "" : ' data-diff-empty="true"';
        const glyph = options.glyph ? admin.diff.changeGlyph(kind) : "";
        return `<div class="diff-change-side" data-diff-side="${kind}"${empty}>${glyph}<div class="diff-change-content">${value ? admin.diff.pretty(value) : ""}</div></div>`;
      },
      splitContext(row) {
        const left = admin.diff.sourceCell(row, "left");
        const right = admin.diff.sourceCell(row, "right");
        const value = left?.innerHTML || right?.innerHTML || "";
        if (!value) return "";
        return `<div class="diff-change-card" data-diff-change="context"><div class="diff-change-content">${admin.diff.pretty(value)}</div></div>`;
      },
      splitSides(deleted = "", added = "", options = {}) {
        const deletedCell = admin.diff.splitCell("deleted", deleted, {
          glyph: options.deletedGlyph,
        });
        const addedCell = admin.diff.splitCell("added", added, {
          glyph: options.addedGlyph,
        });
        return admin.diff.order.get() === "deleted-first"
          ? `${deletedCell}${addedCell}`
          : `${addedCell}${deletedCell}`;
      },
      splitGroup(group) {
        const deletedCount = group.deleted.filter(Boolean).length;
        const addedCount = group.added.filter(Boolean).length;
        const reflow = group.rows === 2 && (
          deletedCount === 2 && addedCount === 1 ||
          deletedCount === 1 && addedCount === 2
        );
        if (reflow) {
          const deleted = group.deleted.filter(Boolean).join("\n");
          const added = group.added.filter(Boolean).join("\n");
          return `<div class="diff-change-card" data-diff-change="paragraph">${admin.diff.splitSides(
            deleted,
            added,
            {
              deletedGlyph: Boolean(deleted),
              addedGlyph: Boolean(added),
            },
          )}</div>`;
        }
        return group.deleted.map((deleted, index) => {
          const added = group.added[index] || "";
          if (!deleted && !added) return "";
          const type = deleted && added ? "pair" : added ? "added" : "deleted";
          return `<div class="diff-change-card" data-diff-change="${type}">${admin.diff.splitSides(
            deleted,
            added,
          )}</div>`;
        }).filter(Boolean).join("\n");
      },
      splitChangeRows(table) {
        const result = [];
        let group = { deleted: [], added: [], rows: 0 };
        const flush = () => {
          const html = admin.diff.splitGroup(group);
          if (html) result.push(html);
          group = { deleted: [], added: [], rows: 0 };
        };
        [...table.querySelectorAll("tr")].forEach((row) => {
          const deleted = row.querySelector(".diff-deletedline");
          const added = row.querySelector(".diff-addedline");
          if (!deleted && !added) {
            flush();
            const context = admin.diff.splitContext(row);
            if (context) result.push(context);
            return;
          }
          group.deleted.push(deleted ? deleted.innerHTML : "");
          group.added.push(added ? added.innerHTML : "");
          group.rows += 1;
        });
        flush();
        return result.join("\n");
      },
      inlineChangeData(row) {
        const deleted = row.querySelector(".diff-deletedline");
        const added = row.querySelector(".diff-addedline");
        if (!deleted && !added) return null;
        return {
          deleted: deleted ? deleted.innerHTML : "",
          added: added ? added.innerHTML : "",
        };
      },
      inlineGroup(group) {
        const deleted = group.deleted.filter(Boolean).join("\n");
        const added = group.added.filter(Boolean).join("\n");
        const sides = [
          deleted ? admin.diff.changeSide("deleted", deleted) : "",
          added ? admin.diff.changeSide("added", added) : "",
        ].join("\n");
        if (!sides) return "";
        return `<div class="diff-change-card" data-diff-change="inline">${sides}</div>`;
      },
      inlineChangeRows(table) {
        const result = [];
        let group = { deleted: [], added: [] };
        const flush = () => {
          const html = admin.diff.inlineGroup(group);
          if (html) result.push(html);
          group = { deleted: [], added: [] };
        };
        [...table.querySelectorAll("tr")].forEach((row) => {
          const data = admin.diff.inlineChangeData(row);
          if (!data) {
            flush();
            return;
          }
          group.deleted.push(data.deleted);
          group.added.push(data.added);
        });
        flush();
        return result.join("\n");
      },
      changeRows(table, mode = "inline") {
        if (mode === "inline") return admin.diff.inlineChangeRows(table);
        return admin.diff.splitChangeRows(table);
      },
      changeBox(table, index, mode = "inline") {
        const rows = admin.diff.changeRows(table, mode);
        if (!rows) return "";
        const titleAction = mode === "split" ? ' data-action="diff.order" title="Поменять стороны"' : "";
        return `<section class="diff-change-section" data-diff-section="${mode}"><button class="diff-change-title" type="button"${titleAction}>${admin.diff.escape(
          admin.diff.tableTitle(table, index),
        )}</button><div class="diff-change-list">${rows}</div></section>`;
      },
      inlineLine(row) {
        return admin.diff.inlineChangeRow(row);
      },
      tableTitle(table, index) {
        const title = table
          .closest(".postbox,section,article,div")
          ?.querySelector("h2,h3,.hndle")
          ?.textContent;
        const value = String(title || "").replace(/\s+/g, " ").trim();
        const names = ["Текст", "Цитата"];
        return value || names[index] || `Фрагмент ${index + 1}`;
      },
      box(table, index, mode = "split") {
        const rows = admin.diff.changeBox(table, index, "split");
        return `<div class="${admin.diff.ids.inlineBox}" data-diff-box="true" data-diff-view="${mode}">${rows}</div>`;
      },
      inlineBox(tables) {
        const boxes = tables
          .map((table, index) => admin.diff.changeBox(table, index, "inline"))
          .filter(Boolean)
          .join("\n");
        const body = boxes || `<div class="diff-box-title">Изменения не найдены</div>`;
        return `<div class="${admin.diff.ids.inlineBox}" data-diff-box="true" data-diff-view="inline" data-diff-source="table"><div class="diff-inline-flow">${body}</div></div>`;
      },
      hideTables(tables) {
        tables.forEach((table) => {
          table.dataset.diffHidden = "1";
          table.dataset.diffDisplay = table.style.display || "";
          table.style.display = "none";
        });
      },
      fit() {
        const tables = admin.diff.tables();
        if (!tables.length) {
          alert("Diff-таблицы не найдены");
          return false;
        }
        admin.diff.mode.set("fit");
        return true;
      },
      async view(value = "split") {
        const mode = value === "inline" ? "inline" : "split";
        const tables = admin.diff.tables();
        if (!tables.length) {
          alert("Diff-таблицы не найдены");
          return false;
        }
        const html = mode === "inline"
          ? admin.diff.inlineBox(tables)
          : tables.map((table, index) => admin.diff.box(table, index, mode)).join("\n");
        admin.diff.hideTables(tables);
        tables[0].insertAdjacentHTML(
          "beforebegin",
          `<div class="diff-reader-list" data-diff-view="${mode}">${html}</div>`,
        );
        tables[0].previousElementSibling?.addEventListener("click", admin.diff.click);
        admin.diff.mode.set(mode);
        admin.diff.panel(admin.diff.stats(tables));
        return true;
      },
      async split() {
        return admin.diff.view("split");
      },
      async reader() {
        return admin.diff.split();
      },
      async inline() {
        return admin.diff.view("inline");
      },
      async switch(value) {
        admin.diff.state.panelSnapshot = admin.diff.snapshot();
        admin.diff.clear();
        admin.diff.style();
        if (value === "fit") return admin.diff.fit();
        if (value === "inline") return admin.diff.inline();
        return admin.diff.split();
      },
      clear() {
        document.getElementById(admin.diff.ids.style)?.remove();
        document.getElementById(admin.diff.ids.panel)?.remove();
        admin.diff.legacy.styles.forEach((id) => document.getElementById(id)?.remove());
        admin.diff.legacy.panels.forEach((id) => document.getElementById(id)?.remove());
        document
          .querySelectorAll(
            `.diff-reader-list,.${admin.diff.ids.inlineBox},.${admin.diff.legacy.inlineBox}`,
          )
          .forEach((box) => box.remove());
        document.querySelectorAll("[data-diff-hidden],[data-odi-hidden]").forEach((table) => {
          table.style.display =
            table.dataset.diffDisplay || table.dataset.odiDisplay || "";
          table.removeAttribute("data-diff-hidden");
          table.removeAttribute("data-diff-display");
          table.removeAttribute("data-odi-hidden");
          table.removeAttribute("data-odi-display");
        });
        admin.diff.restoreCells();
        admin.diff.restoreMarkers();
      },
      async run() {
        const mode = admin.diff.mode.get();
        admin.diff.state.panelSnapshot = mode === "inline" ? null : admin.diff.snapshot();
        admin.diff.clear();
        if (mode === "inline") {
          admin.diff.mode.clear();
          return true;
        }
        admin.diff.style();
        if (mode === "fit") return admin.diff.split();
        if (mode === "split" || mode === "reader") return admin.diff.inline();
        return admin.diff.fit();
      },
    },
    element(selector) {
      return field.element(selector);
    },
    emit(input) {
      field.emit(input);
    },
    text(selector) {
      const element = document.querySelector(selector);
      return element ? String(element.value || element.textContent || "").trim() : "";
    },
    list(selector) {
      return [...document.querySelectorAll(selector)]
        .map((element) => String(element.value || element.textContent || "").trim())
        .filter(Boolean);
    },
    picked(selector) {
      return [...document.querySelectorAll(selector)]
        .filter((element) => element.checked)
        .map((element) =>
          String(
            element.closest("li")?.querySelector("label")?.textContent || "",
          )
            .replace(/\s+/g, " ")
            .trim(),
        )
        .filter(Boolean);
    },
    set(selector, value) {
      field.input(admin.element(selector), value);
    },
    check(selector, value) {
      field.click(admin.element(selector), value);
    },
    content() {
      return String(admin.element("#content")?.value || "");
    },
    now() {
      return new Date(
        new Date().toLocaleString("en-US", {
          timeZone: cms.timezone,
        }),
      );
    },
    pad(value) {
      return String(value).padStart(2, "0");
    },
    stamp(date) {
      return {
        month: admin.pad(date.getMonth() + 1),
        day: admin.pad(date.getDate()),
        year: String(date.getFullYear()),
        hours: admin.pad(date.getHours()),
        minutes: admin.pad(date.getMinutes()),
      };
    },
    timestamp(hour) {
      const date = admin.now();
      if (date.getHours() >= hour) date.setDate(date.getDate() + 1);
      date.setHours(hour, 0, 0, 0);
      return admin.stamp(date);
    },
    visibility(value = {}) {
      admin.element(".edit-visibility")?.click();
      admin.check("#visibility-radio-public", value.access !== "link");
      admin.check("#visibility-radio-private", value.access === "link");
      admin.set(
        "#hidden-post-visibility",
        value.access === "link" ? "private" : "public",
      );
      if (value.access !== "link") {
        admin.set("#post_password", "");
        admin.set("#hidden-post-password", "");
      }
      if (value.sticky === "left" || value.sticky === "right") {
        admin.check(`input[name="sticky"][value="${value.sticky}"]`, true);
      } else {
        admin.check("input[name='sticky'][value='none']", true);
        admin.check("input[name='sticky'][value='off']", true);
      }
      admin.element(".save-post-visibility")?.click();
    },
    timestampFields(value) {
      return [
        ["#mm", value.month],
        ["#jj", value.day],
        ["#aa", value.year],
        ["#hh", value.hours],
        ["#mn", value.minutes],
      ];
    },
    applyTimestamp(value) {
      admin.element(".edit-timestamp")?.click();
      admin.timestampFields(value).forEach(([selector, current]) => {
        admin.set(selector, current);
      });
      admin.element(".save-timestamp")?.click();
    },
    time(hour) {
      admin.applyTimestamp(admin.timestamp(hour));
    },
    updated(value) {
      admin.check("#updated", value);
    },
    refresh: {
      run() {
        admin.applyTimestamp(admin.stamp(admin.now()));
        admin.updated(true);
        field.focus(admin.element("#updated"));
        return true;
      },
    },
    tag(name) {
      admin.set("#new-tag-post_tag", name);
      admin.element("#post_tag .tagadd")?.click();
    },
    layout() {
      const element = cms.layout.element();
      if (!element || cms.layout.longread(cms.layout.value(element))) return;
      const label = element.options[element.selectedIndex]?.text?.toLowerCase() || "";
      if (!field.confirm(`🚨 Точно ${label}, не лонгрид? Меняем?`)) return;
      field.input(element, "longread");
    },
    thumbnail() {
      if (admin.element("#postimagediv #set-post-thumbnail img")) return;
      field.alert("🛑 Минус мини");
    },
    focus() {
      field.focus(admin.element("#publish"));
    },
    evergreen() {
      let found = false;
      widget.block.mapJson(admin.content(), widget.tag.promo, (full, data) => {
        if (!data || typeof data.text !== "string") return full;
        const text = widget.read.raw(data.text).toLowerCase();
        if (text.includes("эта статья уже публиковалась")) found = true;
        return full;
      });
      return found;
    },
    dump: {
      mark(label, value) {
        return `[${label}]\n${value || "—"}`;
      },
      date() {
        const date = new Date();
        return [
          date.getFullYear(),
          String(date.getMonth() + 1).padStart(2, "0"),
          String(date.getDate()).padStart(2, "0"),
        ].join("-");
      },
      section() {
        return String(location.hostname.split(".")[0] || "post").trim() || "post";
      },
      postId() {
        const url = new URL(location.href);
        return (
          admin.text("#post_ID") || String(url.searchParams.get("post") || "").trim() || "unknown"
        );
      },
      file(kind, ext = "txt") {
        return `${admin.dump.section()}_post_${admin.dump.postId()}_${kind}_${admin.dump.date()}.${ext}`;
      },
      tags() {
        return admin
          .list("#post_tag .tagchecklist span")
          .map((value) => value.replace(/^X\s*/i, "").trim());
      },
      data() {
        const tags = admin.dump.tags();
        return [
          admin.dump.mark("slug", admin.text("#editable-post-name-full")),
          admin.dump.mark("title", admin.text("#title")),
          admin.dump.mark(
            "rotation-titles",
            admin.list('input[name="rotation_titles[]"]').join("\n"),
          ),
          admin.dump.mark("favourite_title", admin.text("#favourite_title")),
          admin.dump.mark("seo_title", admin.text('input[name="seo_title"]')),
          admin.dump.mark("content", admin.text("#content")),
          admin.dump.mark("excerpt", admin.text("#excerpt")),
          admin.dump.mark(
            "categories",
            admin.picked("#categorychecklist input[type='checkbox']").join("\n"),
          ),
          admin.dump.mark("tags", tags.join("\n")),
        ].join("\n\n");
      },
      save(filename, text, type = "text/plain;charset=utf-8") {
        const blob = new Blob([text], { type });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        setTimeout(() => {
          URL.revokeObjectURL(link.href);
          link.remove();
        }, 1000);
      },
      debug() {
        return JSON.stringify(
          {
            section: admin.dump.section(),
            postId: admin.dump.postId(),
            slug: admin.text("#editable-post-name-full"),
            title: admin.text("#title"),
            favourite_title: admin.text("#favourite_title"),
            seo_title: admin.text('input[name="seo_title"]'),
            categories: admin.picked("#categorychecklist input[type='checkbox']"),
            tags: admin.dump.tags(),
          },
          null,
          2,
        );
      },
      all() {
        return JSON.stringify(
          {
            section: admin.dump.section(),
            postId: admin.dump.postId(),
            date: admin.dump.date(),
            text: admin.dump.data(),
            debug: JSON.parse(admin.dump.debug()),
          },
          null,
          2,
        );
      },
      download() {
        admin.dump.save(admin.dump.file("text"), admin.dump.data());
        admin.dump.save(
          admin.dump.file("debug", "json"),
          admin.dump.debug(),
          "application/json;charset=utf-8",
        );
        admin.dump.save(
          admin.dump.file("all", "json"),
          admin.dump.all(),
          "application/json;charset=utf-8",
        );
      },
      run() {
        const url = new URL(location.href);
        if (!url.pathname.endsWith("/wp-admin/post.php")) return false;
        if (!admin.dump.postId()) return false;
        admin.dump.download();
        return true;
      },
    },
    fieldState: {
      key: "__adminFieldState",
      state() {
        return (window[admin.fieldState.key] ??= {
          backgrounds: new WeakMap(),
          timers: new WeakMap(),
        });
      },
      remember(element = null) {
        if (!element) return false;
        const state = admin.fieldState.state();
        if (!state.backgrounds.has(element)) {
          state.backgrounds.set(element, element.style.backgroundColor || "");
        }
        return true;
      },
      color(tone = "positive") {
        return tone === "negative"
          ? "rgba(198, 40, 40, .12)"
          : "rgba(46, 125, 50, .14)";
      },
      paint(element = null, tone = "positive") {
        if (!element) return false;
        admin.fieldState.remember(element);
        element.style.outline = "";
        element.style.backgroundColor = admin.fieldState.color(tone);
        return true;
      },
      restore(element = null) {
        if (!element) return false;
        const state = admin.fieldState.state();
        clearTimeout(state.timers.get(element));
        state.timers.delete(element);
        element.style.outline = "";
        element.style.backgroundColor = state.backgrounds.get(element) || "";
        return true;
      },
      flash(element = null, tone = "positive", delay = 1200) {
        if (!element) return false;
        const state = admin.fieldState.state();
        clearTimeout(state.timers.get(element));
        admin.fieldState.paint(element, tone);
        state.timers.set(element, setTimeout(() => {
          admin.fieldState.restore(element);
        }, delay));
        return true;
      },
    },
    fields: {
      config: {
        title: {
          selector: "#title",
          label: "Заг",
          limit: 105,
        },
        rotation: {
          selector: 'input[name="rotation_titles[]"]',
          label: "Ротация",
          limit: 105,
        },
        favourite: {
          selector: '#favourite_title,input[name="favourite_title"]',
          label: "Крик",
          limit: 105,
        },
        seo: {
          selector:
            '#seo_title,#yoast_wpseo_title,input[name="seo_title"],input[name="yoast_wpseo_title"]',
          label: "SEO",
          limit: 70,
        },
        excerpt: {
          selector: '#excerpt,textarea[name="excerpt"]',
          label: "Цитата",
          limit: 420,
        },
        slug: {
          selector:
            '#editable-post-name input,#new-post-slug,input[name="post_name"],#post_name',
          fullSelector:
            '#editable-post-name-full,input[name="editable-post-name-full"]',
          previewSelector: "#editable-post-name",
          label: "Слаг",
          limit: 34,
        },
      },
      value(selector) {
        const element = field.element(selector);
        if (!element) return "";
        if ("value" in element) return String(element.value || "");
        return String(element.textContent || "").trim();
      },
      set(selector, value) {
        const element = field.element(selector);
        if (!element) return false;
        if ("value" in element) {
          field.input(element, String(value || ""));
          return true;
        }
        element.textContent = String(value || "");
        return true;
      },
      setAll(selector, value) {
        const list = field.elements(selector);
        if (!list.length) return false;
        list.forEach((element) => {
          if ("value" in element) {
            field.input(element, String(value || ""));
            return;
          }
          element.textContent = String(value || "");
        });
        return true;
      },
      escape(value = "") {
        return String(value || "")
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;");
      },
      label(value = "") {
        const raw = String(value || "");
        const mojibake = [...raw].some((char) => {
          const code = char.charCodeAt(0);
          return code === 208 || code === 209;
        });
        if (!mojibake) return raw;
        try {
          return decodeURIComponent(escape(raw));
        } catch {
          return raw;
        }
      },
      titles: {
        items() {
          const config = admin.fields.config;
          const rotations = field.elements(config.rotation.selector);
          const rotationItems = rotations
            .map((element, sourceIndex) => ({
              element,
              sourceIndex,
              row: element?.closest?.(".rt__item") || null,
            }));
          const visibleRotations = rotationItems.filter((item) => !item.row?.hidden);
          const hiddenRotations = rotationItems.filter((item) => item.row?.hidden);
          const items = [
            {
              key: "title",
              kind: "title",
              label: config.title.label,
              limit: config.title.limit,
              get: () => admin.fields.value(config.title.selector),
              set: (value) => admin.fields.set(config.title.selector, value),
              add: () => true,
            },
          ];
          const pushRotation = ({ element = null, row = null, sourceIndex = -1 } = {}, index = 0) => {
            const keyIndex = sourceIndex >= 0 ? sourceIndex : index;
            items.push({
              key: `rotation-${keyIndex + 1}`,
              kind: "rotation",
              index,
              sourceIndex,
              element,
              label: `${config.rotation.label} #${index + 1}`,
              limit: config.rotation.limit,
              get: () => String(element?.value || ""),
              set: (value) => {
                if (!element || row?.hidden) return false;
                field.input(element, String(value || ""));
                return true;
              },
              hidden: () => !element || Boolean(row?.hidden),
              add: () => {
                const current = element;
                const currentRow = current?.closest?.(".rt__item") || row;
                if (current && !currentRow?.hidden) return current;
                const button = field.element("#rotation-titles-add");
                if (!button) return false;
                const target = current || hiddenRotations[0]?.element || null;
                button.click();
                return target || { kind: "rotation", index };
              },
            });
          };
          visibleRotations.forEach((item, index) => pushRotation(item, index));
          if (visibleRotations.length < 3 && hiddenRotations.length) {
            pushRotation(hiddenRotations[0], visibleRotations.length);
          }
          return [
            ...items,
            {
              key: "favourite",
              kind: "favourite",
              label: config.favourite.label,
              limit: config.favourite.limit,
              get: () => admin.fields.value(config.favourite.selector),
              set: (value) => admin.fields.set(config.favourite.selector, value),
              add: () => true,
            },
            {
              key: "seo",
              kind: "seo",
              label: config.seo.label,
              limit: config.seo.limit,
              get: () => admin.fields.value(config.seo.selector),
              set: (value) => admin.fields.set(config.seo.selector, value),
              add: () => true,
            },
          ].slice(0, 6);
        },
        candidates() {
          return admin.fields.titles.items()
            .map((item) => String(item.get() || "").trim())
            .filter(Boolean);
        },
      },
      excerpt: {
        value() {
          return admin.fields.value(admin.fields.config.excerpt.selector);
        },
        set(value) {
          return admin.fields.set(admin.fields.config.excerpt.selector, value);
        },
      },
      slug: {
        value() {
          const config = admin.fields.config.slug;
          return admin.fields.value(config.fullSelector) || admin.fields.value(config.selector);
        },
        set(value) {
          const config = admin.fields.config.slug;
          const first = admin.fields.setAll(config.fullSelector, value);
          const second = admin.fields.setAll(config.selector, value);
          return Boolean(first || second);
        },
        normalize(value = "") {
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
        snapshot(value = "") {
          const normalized = admin.fields.slug.normalize(value);
          const chars = Array.from(normalized);
          const limit = admin.fields.config.slug.limit || 34;
          const willBeCut = chars.length > limit;
          const visible = willBeCut
            ? `${chars.slice(0, 16).join("")}…${chars.slice(-16).join("")}`
            : chars.join("");
          return {
            value: chars.join(""),
            length: chars.length,
            limit,
            willBeCut,
            visible,
          };
        },
        commit(value, done = null) {
          const text = admin.fields.slug.normalize(value);
          const config = admin.fields.config.slug;
          const edit = field.element("#edit-slug-buttons .edit-slug");
          const input = field.element("#new-post-slug");
          const finish = (ok = true) => {
            const preview = field.element(config.previewSelector);
            if (preview) preview.textContent = text;
            done?.(ok, text);
          };
          const apply = (attempt = 0) => {
            const liveInput = field.element("#new-post-slug");
            if (!liveInput && attempt < 8) {
              setTimeout(() => apply(attempt + 1), 25);
              return;
            }
            const save = field.element("#edit-slug-buttons .save");
            admin.fields.setAll("#new-post-slug", text);
            admin.fields.setAll('input[name="post_name"]', text);
            admin.fields.setAll("#post_name", text);
            admin.fields.setAll(config.fullSelector, text);
            admin.fields.setAll(config.selector, text);
            if (save) save.click();
            finish(true);
          };
          if (edit && (!input || input.offsetParent === null)) {
            edit.click();
            setTimeout(() => apply(), 25);
            return true;
          }
          apply();
          return true;
        },
      },
    },
    stack: {
      style: "admin-stack-style",
      theme() {
        return (
          document.querySelector('.panel[data-ui-surface="toolbar"]')?.dataset
            ?.theme || "dark"
        );
      },
      touch() {
        const agent = navigator.userAgent || "";
        if (/Windows NT/.test(agent)) return false;
        if (
          /iPad|iPhone|iPod/.test(agent) ||
          (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
        ) {
          return true;
        }
        return (
          window.matchMedia?.("(pointer: coarse)")?.matches ||
          navigator.maxTouchPoints > 0
        );
      },
      phone() {
        if (!admin.stack.touch()) return false;
        const width = window.visualViewport?.width || window.innerWidth || 0;
        const height = window.visualViewport?.height || window.innerHeight || 0;
        const short = Math.min(width, height);
        return short > 0 && short < 700;
      },
      button(action, content, attrs = "") {
        return ui.controls.button({
          action,
          content,
          attrs: ` type="button"${attrs}`,
        });
      },
      mountStyle() {
        panel.mount(admin.stack.style, css.admin.stack());
      },
      cleanup(feature, cleanup) {
        if (typeof cleanup !== "function") return;
        feature.state.cleanup.push(cleanup);
      },
      clear(feature) {
        const list = [...feature.state.cleanup];
        feature.state.cleanup = [];
        list.forEach((cleanup) => {
          try {
            cleanup();
          } catch (_) {}
        });
      },
      close(feature) {
        admin.stack.clear(feature);
        document.getElementById(feature.id)?.remove();
        const opener = feature.state.opener;
        if (opener?.isConnected) opener.focus();
        feature.state.opener = null;
      },
      features() {
        return [admin.titles, admin.slug, admin.excerpt].filter(Boolean);
      },
      closeOthers(feature) {
        admin.stack.features().forEach((item) => {
          if (item === feature) return;
          item.close();
        });
      },
      counter(feature) {
        const active = feature.state.active || {};
        return ui.controls.counter({
          current: Number(active.current) || 0,
          limit: Number(active.limit) || 0,
          label: active.label || "",
          showText: feature.state.counterShowText === true,
          showLabel: feature.state.counterShowLabel === true,
          classes: "admin-stack-counter",
          attrs: `${active.label
            ? ` data-label="${admin.fields.escape(active.label)}"`
            : ""} role="button" tabindex="0"`,
        });
      },
      syncCounter(feature, root) {
        const node = root?.querySelector(".ui-counter-pill");
        if (!node) return;
        const active = feature.state.active || {};
        node.setAttribute(
          "data-show-text",
          feature.state.counterShowText === true ? "true" : "false",
        );
        ui.controls.counterSync(node, {
          current: Number(active.current) || 0,
          limit: Number(active.limit) || 0,
          label: active.label || "",
          showLabel: feature.state.counterShowLabel === true,
        });
      },
      marker(feature) {
        if (!feature.marker) return "";
        return ui.controls.marker({
          button: {
            glyph: feature.marker,
            title: feature.title || "",
            attrs: ` type="button" tabindex="-1" aria-label="${admin.fields.escape(
              feature.title || "",
            )}"`,
          },
        });
      },
      head(feature, { themeAction = "", closeAction = "", mainAfter = "" } = {}) {
        const theme = feature.state.theme || admin.stack.theme();
        const right = ui.shell.group(
          `${admin.stack.button(themeAction, icon.theme(theme))}${admin.stack.button(closeAction, icon.emoji("❌", "default"))}`,
          { rail: true, classes: "admin-fields-system" },
        );
        const main = mainAfter
          ? `<div class="admin-stack-main">${admin.stack.counter(feature)}${mainAfter}</div>`
          : admin.stack.counter(feature);
        return ui.shell.frame({
          classes: "admin-fields-head",
          attrs: ' data-admin-stack-head="true" data-panel-drag-handle="true"',
          left: admin.stack.marker(feature),
          main,
          right,
        });
      },
      shell(feature, body = "") {
        return ui.shell.stack(
          `${feature.head()}<div data-admin-stack-body data-mode="${feature.name}">${body}</div>`,
        );
      },
      node(root) {
        if (!root) return null;
        if (root.classList?.contains("panel")) return root;
        return root.querySelector(".panel");
      },
      syncTheme(feature) {
        const root = document.getElementById(feature.id);
        const node = admin.stack.node(root);
        if (node) {
          ui.surface.sync(node, {
            layout: "fullscreen",
            theme: feature.state.theme || "dark",
            surface: "toolbar",
          });
        }
        if (root) feature.render(root);
      },
      bindKeyboard(feature, root) {
        const keydown = (event) => {
          if (event.key !== "Escape") return;
          event.preventDefault();
          feature.close();
        };
        root.addEventListener("keydown", keydown);
        admin.stack.cleanup(feature, () => root.removeEventListener("keydown", keydown));
      },
      toggleCounter(feature, root) {
        feature.state.counterShowText = !feature.state.counterShowText;
        admin.stack.syncCounter(feature, root);
      },
      bindCounter(feature, root) {
        const target = (event) => {
          const node = event.target.closest(".ui-counter-pill");
          return node && root.contains(node) ? node : null;
        };
        const markTouch = () => {
          if (!root?.dataset) return;
          root.dataset.adminCounterTouch = "true";
          setTimeout(() => {
            if (root?.dataset) delete root.dataset.adminCounterTouch;
          }, 420);
        };
        const pointerdown = (event) => {
          if (!target(event)) return;
          event.stopPropagation();
          if (event.pointerType !== "touch") return;
          event.preventDefault();
          markTouch();
          admin.stack.toggleCounter(feature, root);
        };
        const click = (event) => {
          if (!target(event)) return;
          event.preventDefault();
          event.stopPropagation();
          if (root?.dataset?.adminCounterTouch === "true") return;
          admin.stack.toggleCounter(feature, root);
        };
        const keydown = (event) => {
          if (event.key !== "Enter" && event.key !== " ") return;
          if (!target(event)) return;
          event.preventDefault();
          event.stopPropagation();
          admin.stack.toggleCounter(feature, root);
        };
        root.addEventListener("pointerdown", pointerdown, true);
        root.addEventListener("click", click, true);
        root.addEventListener("keydown", keydown, true);
        admin.stack.cleanup(feature, () => root.removeEventListener("pointerdown", pointerdown, true));
        admin.stack.cleanup(feature, () => root.removeEventListener("click", click, true));
        admin.stack.cleanup(feature, () => root.removeEventListener("keydown", keydown, true));
      },
      bindActions(feature, root, action) {
        admin.stack.bindCounter(feature, root);
        toolbar.behavior.actions({
          panel: root,
          root,
          action: ({ name, button, event, kind }) => {
            if (name === `${feature.name}-close`) return feature.close();
            if (name === `${feature.name}-theme`) {
              feature.state.theme =
                (feature.state.theme || "dark") === "dark" ? "light" : "dark";
              return admin.stack.syncTheme(feature);
            }
            return action?.(name, { button, event, kind });
          },
        });
      },
      flashApply(button = null) {
        const target = button?.querySelector?.(".ui-icon-content");
        if (!target) return false;
        const previous = target.innerHTML;
        target.innerHTML = ui.controls.glyph("Document Ribbon", 22, "Document");
        clearTimeout(button._adminApplyFlashTimer);
        button._adminApplyFlashTimer = setTimeout(() => {
          target.innerHTML = previous;
        }, 1000);
        return true;
      },
      scroll() {
        const element = document.scrollingElement || document.documentElement;
        return {
          left: window.scrollX || element?.scrollLeft || 0,
          top: window.scrollY || element?.scrollTop || 0,
        };
      },
      restoreScroll(snapshot) {
        if (!snapshot) return;
        const element = document.scrollingElement || document.documentElement;
        if (element) {
          element.scrollLeft = snapshot.left || 0;
          element.scrollTop = snapshot.top || 0;
        }
        window.scrollTo(snapshot.left || 0, snapshot.top || 0);
      },
      keepScroll(snapshot) {
        if (!snapshot) return;
        admin.stack.restoreScroll(snapshot);
        requestAnimationFrame(() => admin.stack.restoreScroll(snapshot));
        setTimeout(() => admin.stack.restoreScroll(snapshot), 80);
        setTimeout(() => admin.stack.restoreScroll(snapshot), 260);
        setTimeout(() => admin.stack.restoreScroll(snapshot), 520);
      },
      focusInput(input) {
        if (!input) return;
        const scroll = admin.stack.scroll();
        try {
          input.focus({ preventScroll: true });
        } catch {
          input.focus?.();
        }
        input.setSelectionRange?.(0, 0);
        admin.stack.keepScroll(scroll);
      },
      screen() {
        const viewport = window.visualViewport;
        if (!viewport) {
          return {
            left: 0,
            top: 0,
            width: window.innerWidth,
            height: window.innerHeight,
          };
        }
        return {
          left: viewport.offsetLeft,
          top: viewport.offsetTop,
          width: viewport.width,
          height: viewport.height,
        };
      },
      place(root, edge = 16) {
        if (!root?.isConnected) return;
        if (root.dataset.panelDragging === "true") return;
        const screen = admin.stack.screen();
        const width = root.offsetWidth || root.getBoundingClientRect().width || 0;
        const height = root.offsetHeight || root.getBoundingClientRect().height || 0;
        const left = screen.left + (screen.width - width) / 2;
        const top = screen.top + edge;
        const minLeft = screen.left + edge;
        const maxLeft = screen.left + screen.width - width - edge;
        const minTop = screen.top + edge;
        const maxTop = screen.top + screen.height - height - edge;
        const safeLeft = minLeft > maxLeft
          ? screen.left + (screen.width - width) / 2
          : Math.min(maxLeft, Math.max(minLeft, left));
        const safeTop = minTop > maxTop
          ? screen.top + edge
          : Math.min(maxTop, Math.max(minTop, top));
        root.dataset.tight = screen.height <= 640 ? "true" : "false";
        root.dataset.snap = "top";
        root.style.setProperty("left", `${Math.round(safeLeft)}px`, "important");
        root.style.setProperty("top", `${Math.round(safeTop)}px`, "important");
        root.style.setProperty("right", "auto", "important");
        root.style.setProperty("bottom", "auto", "important");
        root.style.setProperty("transform", "none", "important");
      },
      bindViewport(feature, root) {
        const place = () => {
          if (root.dataset.panelDragging === "true") return;
          admin.stack.place(root, admin.stack.phone() ? 10 : 16);
          feature.view?.fit?.(root);
        };
        window.addEventListener("resize", place, { passive: true });
        window.visualViewport?.addEventListener("resize", place, { passive: true });
        window.visualViewport?.addEventListener("scroll", place, { passive: true });
        admin.stack.cleanup(feature, () => window.removeEventListener("resize", place));
        admin.stack.cleanup(feature, () => window.visualViewport?.removeEventListener("resize", place));
        admin.stack.cleanup(feature, () => window.visualViewport?.removeEventListener("scroll", place));
        requestAnimationFrame(place);
        setTimeout(place, 260);
        setTimeout(place, 520);
      },
      open(feature) {
        admin.stack.closeOthers(feature);
        feature.close();
        admin.stack.mountStyle();
        feature.state.opener = document.activeElement;
        feature.state.theme = admin.stack.theme();
        feature.state.cleanup = [];
        const root = panel.create({
          id: feature.id,
          html: "",
          draggable: {
            handle: false,
            snap: true,
          },
        });
        root.dataset.adminStack = feature.name;
        root.dataset.mode = admin.stack.phone() ? "phone" : "desktop";
        root.dataset.tight = admin.stack.screen().height <= 640 ? "true" : "false";
        root.dataset.uiFrame = "capsule";
        root.dataset.toolbarFlow = "stack";
        root.dataset.dock = "floating";
        root.dataset.dockTarget = "floating";
        root.style.pointerEvents = "auto";
        root.tabIndex = -1;
        ui.surface.sync(root, {
          layout: "fullscreen",
          theme: feature.state.theme,
          surface: "toolbar",
        });
        admin.stack.bindKeyboard(feature, root);
        root.addEventListener("pointerdown", () => toolbar.bringToFront(root), { capture: true });
        root.addEventListener("focusin", () => toolbar.bringToFront(root), { capture: true });
        root.addEventListener("touchmove", (event) => {
          if (event.target?.closest?.("input,textarea,select,[data-field-resize-edge]")) return;
          if (event.cancelable) event.preventDefault();
        }, { passive: false, capture: true });
        const scroll = admin.stack.scroll();
        feature.render(root);
        admin.stack.keepScroll(scroll);
        admin.stack.place(root, admin.stack.phone() ? 10 : 16);
        admin.stack.bindViewport(feature, root);
        toolbar.bringToFront(root);
        requestAnimationFrame(() => {
          if (!root.isConnected) return;
          feature.view?.focus?.(root);
          admin.stack.place(root, admin.stack.phone() ? 10 : 16);
          admin.stack.keepScroll(scroll);
        });
        return root;
      },
    },
    titles: {
      id: "admin-titles-stack",
      name: "titles",
      title: "Заголовки",
      marker: "📔",
      state: {
        theme: "dark",
        cleanup: [],
        opener: null,
        activeKey: "",
        counterShowText: false,
        titleAddUnlocked: {},
        titleClearArmed: {},
        titleClearSnapshot: {},
        titleCommandTimer: 0,
        titleFocusedKey: "",
        active: {
          label: "Заг",
          current: 0,
          limit: 105,
        },
      },
      headless: {
        items() {
          return admin.fields.titles.items();
        },
        map() {
          return Object.fromEntries(
            admin.titles.headless.items().map((item) => [item.key, item]),
          );
        },
        index(key = "") {
          const items = admin.titles.headless.items();
          const value = String(key || admin.titles.state.activeKey || "");
          const index = items.findIndex((item) => item.key === value);
          return index >= 0 ? index : 0;
        },
        touchItem() {
          const items = admin.titles.headless.items();
          if (!items.length) return null;
          return items[admin.titles.headless.index()];
        },
        unlocked(item = null) {
          if (!item) return true;
          if (String(item.get?.() || "").trim()) return true;
          if (admin.titles.headless.clearSnapshot(item)) {
            return admin.titles.state.titleFocusedKey === item.key;
          }
          if (item.kind === "rotation" && item.element && !item.hidden?.()) return true;
          return admin.titles.state.titleAddUnlocked[item.key] === true;
        },
        unlock(item = null) {
          if (!item?.key) return false;
          admin.titles.state.titleAddUnlocked[item.key] = true;
          return true;
        },
        clearable(item = null) {
          if (!item) return false;
          if (admin.titles.headless.clearSnapshot(item)) return true;
          if (String(item.get?.() || "").trim()) return true;
          return item.kind === "rotation" && item.element && !item.hidden?.();
        },
        clearSnapshot(item = null) {
          return item?.key ? admin.titles.state.titleClearSnapshot[item.key] || null : null;
        },
        resetClear(item = null) {
          if (item?.key) {
            delete admin.titles.state.titleClearArmed[item.key];
            delete admin.titles.state.titleClearSnapshot[item.key];
          } else {
            admin.titles.state.titleClearArmed = {};
            admin.titles.state.titleClearSnapshot = {};
          }
          return true;
        },
        clear(item = null, done = null) {
          if (!item) return false;
          const snapshot = admin.titles.headless.clearSnapshot(item);
          if (snapshot) {
            const restore = () => {
              const current = admin.titles.headless.map()[item.key] || item;
              current.set?.(snapshot.value || "");
              admin.titles.headless.resetClear(current);
              admin.titles.state.titleAddUnlocked[current.key || item.key] = true;
              admin.titles.state.activeKey = current.key || item.key;
              done?.(current.key || item.key);
            };
            if (item.kind === "rotation" && item.hidden?.()) {
              item.add?.();
              requestAnimationFrame(() => setTimeout(restore, 0));
              return true;
            }
            restore();
            return true;
          }
          const value = String(item.get?.() || "");
          if (!value.trim() && item.kind !== "rotation") return false;
          admin.titles.state.titleClearSnapshot[item.key] = { kind: item.kind, value };
          admin.titles.state.titleAddUnlocked[item.key] = true;
          item.set?.("");
          done?.(item.key);
          return true;
        },
        removeEmpty(item = null) {
          if (!item || item.kind !== "rotation") return false;
          if (String(item.get?.() || "").trim()) return false;
          const row = item.element?.closest?.(".rt__item") || null;
          const remove = row?.querySelector?.(".rt__remove") || null;
          if (!remove || row?.hidden) return false;
          remove.click();
          admin.titles.state.titleAddUnlocked[item.key] = false;
          return true;
        },
        step(delta = 0) {
          const items = admin.titles.headless.items();
          if (!items.length) return null;
          const index = admin.titles.headless.index();
          const next = (index + delta + items.length) % items.length;
          admin.titles.state.activeKey = items[next].key;
          return items[next];
        },
        active(input = null) {
          if (!input) return admin.titles.state.active;
          admin.titles.state.activeKey = input.dataset.fieldKey || "";
          admin.titles.state.active = {
            label: admin.fields.label(input.dataset.fieldLabel || ""),
            current: Array.from(String(input.value || "")).length,
            limit: Number(input.dataset.fieldLimit) || 0,
          };
          return admin.titles.state.active;
        },
        save(input = null, item = null) {
          if (!input || !item) return false;
          admin.titles.state.activeKey = input.dataset.fieldKey || "";
          item.set(input.value || "");
          admin.titles.headless.active(input);
          return true;
        },
      },
      view: {
        head() {
          return admin.stack.head(admin.titles, {
            themeAction: "titles-theme",
            closeAction: "titles-close",
          });
        },
        input(item, { touch = false } = {}) {
          const value = String(item.get() || "");
          const limit = Number(item.limit) || 0;
          const label = admin.fields.label(item.label);
          const fieldControl = touch ? ui.controls.textarea : ui.controls.input;
          const empty = !value.trim();
          const unlocked = admin.titles.headless.unlocked(item);
          const lockAttrs = unlocked
            ? ""
            : ' readonly tabindex="-1" aria-readonly="true"';
          const input = fieldControl({
            value,
            placeholder: "",
            classes: "admin-fields-input",
            attrs: ` data-field-kind="title" data-field-key="${admin.fields.escape(item.key)}" data-field-label="${admin.fields.escape(label)}" data-field-limit="${limit}"${lockAttrs}`,
          });
          const add = empty && !unlocked
            ? ui.controls.button({
                action: "titles-add",
                fluent: "Remix Add",
                fallback: "Add Circle",
                title: "Добавить",
                classes: "admin-title-add",
                attrs: ' type="button"',
              })
            : "";
          const clearable = admin.titles.headless.clearable(item);
          const clearSnapshot = admin.titles.headless.clearSnapshot(item);
          const clear = clearable
            ? ui.controls.button({
                action: "titles-clear",
                fluent: clearSnapshot ? "Group Return" : "Eraser Medium",
                fallback: clearSnapshot ? "Return" : "Erase",
                title: clearSnapshot ? "Вернуть" : "Очистить",
                classes: "admin-title-clear",
                attrs: ` type="button" data-title-clear-restore="${clearSnapshot ? "true" : "false"}"`,
              })
            : "";
          const touchAdd = touch ? add : "";
          const touchClear = touch ? clear : "";
          const touchTools = touch && touchClear
            ? `<div class="admin-title-touch-tools">${touchClear}</div>`
            : "";
          const contentAdd = touch ? touchAdd : add;
          const entryFlags = [
            contentAdd ? 'data-title-has-add="true"' : "",
            add ? 'data-title-empty="true" data-title-locked="true"' : "",
            clear ? 'data-title-clearable="true"' : "",
          ].filter(Boolean).join(" ");
          const content = `<div class="admin-title-entry"${entryFlags ? ` ${entryFlags}` : ""}>${contentAdd}${input}${touch ? "" : clear}</div>`;
          const actions = touch
            ? `${ui.controls.button({
                action: "titles-prev",
                fluent: "Chevron Up",
                fallback: "Chevron Up",
                title: "Предыдущий заголовок",
                classes: "admin-title-cycle",
                attrs: ' type="button"',
              })}${ui.controls.button({
                action: "titles-next",
                fluent: "Chevron Down",
                fallback: "Chevron Down",
                title: "Следующий заголовок",
                classes: "admin-title-cycle",
                attrs: ' type="button"',
              })}${touchTools}`
            : "";
          return `<div class="admin-fields-row">
            ${ui.controls.fieldBox({
              label,
              content,
              actions,
              attrs: touch
                ? ' data-field-label="true" data-title-touch="true"'
                : ' data-field-label="true"',
            })}
          </div>`;
        },
        body() {
          if (admin.stack.touch()) {
            const item = admin.titles.headless.touchItem();
            return item ? admin.titles.view.input(item, { touch: true }) : "";
          }
          return admin.titles.headless.items().map((item) => admin.titles.view.input(item)).join("");
        },
        build() {
          return admin.stack.shell(admin.titles, admin.titles.view.body());
        },
        syncCounter(root) {
          admin.stack.syncCounter(admin.titles, root);
        },
        fitTouch(root) {
          const input = root?.querySelector?.('textarea[data-field-kind="title"]');
          if (!input) return;
          const min = 78;
          const max = 106;
          input.style.height = `${min}px`;
          const next = Math.max(min, Math.min(max, input.scrollHeight + 2));
          input.style.height = `${Math.round(next)}px`;
          input.style.overflowY = input.scrollHeight > next + 1 ? "auto" : "hidden";
        },
        focus(root, key = "") {
          const selector = key
            ? `:is(input,textarea)[data-field-kind="title"][data-field-key="${key}"]`
            : ':is(input,textarea)[data-field-kind="title"]';
          const input = root.querySelector(selector) || root.querySelector(':is(input,textarea)[data-field-kind="title"]');
          admin.stack.focusInput(input);
        },
        render(root, { focusKey = "", focus = true } = {}) {
          const node = admin.stack.node(root);
          if (!node) return;
          node.innerHTML = admin.titles.view.build();
          admin.titles.bind.fields(root);
          admin.titles.view.syncCounter(root);
          admin.titles.view.fitTouch(root);
          if (focus) admin.titles.view.focus(root, focusKey || admin.titles.state.activeKey || "");
        },
      },
      bind: {
        field(input, item, root) {
          const sync = () => {
            admin.titles.headless.active(input);
            admin.titles.view.syncCounter(root);
          };
          const normalize = ({ trimEnd = false, uppercaseFirst = false } = {}) => {
            const raw = String(input.value || "");
            const normalized = admin.title.typography(raw, { trimEnd, uppercaseFirst });
            if (normalized === raw) return false;
            const start = input.selectionStart;
            const end = input.selectionEnd;
            const delta = normalized.length - raw.length;
            input.value = normalized;
            if (Number.isInteger(start)) {
              const from = Math.max(0, Math.min(normalized.length, start + delta));
              const to = Number.isInteger(end)
                ? Math.max(0, Math.min(normalized.length, end + delta))
                : from;
              input.setSelectionRange?.(from, to);
            }
            return true;
          };
          const save = () => {
            admin.titles.headless.save(input, item);
            admin.titles.view.syncCounter(root);
          };
          input.addEventListener("focus", () => {
            const node = admin.stack.node(root);
            if (node) node.dataset.excerptEditing = "true";
            admin.titles.state.titleFocusedKey = input.dataset.fieldKey || "";
            admin.titles.view.fitTouch(root);
            admin.edit.history(input);
            admin.edit.capture(input, save);
            sync();
          });
          input.addEventListener("keydown", (event) => {
            admin.edit.shortcut(event, input, save);
          });
          input.addEventListener("input", () => {
            if (String(input.value || "").trim()) admin.titles.headless.resetClear(item);
            normalize();
            admin.titles.view.fitTouch(root);
            admin.edit.track(input);
            save();
          });
          input.addEventListener("blur", () => {
            admin.edit.release(input);
            normalize({ trimEnd: true, uppercaseFirst: true });
            admin.titles.state.titleFocusedKey = "";
            const empty = !String(input.value || "").trim();
            const snapshot = admin.titles.headless.clearSnapshot(item);
            if (empty && snapshot) {
              admin.titles.state.titleAddUnlocked[item.key] = false;
              save();
              requestAnimationFrame(() => admin.titles.render(root, { focus: false }));
            }
            admin.titles.view.fitTouch(root);
            admin.edit.track(input);
            save();
          });
        },
        saveCurrent(root) {
          const input = root?.querySelector?.(':is(input,textarea)[data-field-kind="title"]');
          if (!input) return false;
          const items = admin.titles.headless.map();
          const item = items[input.dataset.fieldKey || ""];
          return admin.titles.headless.save(input, item);
        },
        muteFocus(root) {
          const target = root || admin.titles.state.opener || null;
          if (!target?.dataset) return;
          clearTimeout(admin.titles.state.titleCommandTimer);
          target.dataset.adminTitleCommanding = "true";
          admin.titles.state.titleCommandTimer = setTimeout(() => {
            if (target?.dataset) delete target.dataset.adminTitleCommanding;
          }, 360);
        },
        add(root, button = null) {
          admin.titles.bind.muteFocus(root);
          const scope = button?.closest?.(".ui-field-box") || root;
          const input = scope?.querySelector?.(':is(input,textarea)[data-field-kind="title"]');
          if (!input) return false;
          const item = admin.titles.headless.map()[input.dataset.fieldKey || ""];
          const added = item?.add?.();
          if (!added) return false;
          const resolve = () => {
            const list = admin.titles.headless.items();
            const target = added instanceof HTMLElement
              ? added
              : added?.kind === "rotation"
                ? field.elements(admin.fields.config.rotation.selector)[added.index]
                : item.element || null;
            const nextItem = target
              ? list.find((entry) => entry.element === target)
              : list.find((entry) => entry.key === item.key);
            const current = nextItem || item;
            const key = current?.key || item.key;
            admin.titles.headless.unlock(current);
            admin.titles.state.titleFocusedKey = key;
            admin.titles.state.activeKey = key;
            admin.titles.render(root, { focusKey: key });
          };
          if (added?.kind === "rotation") {
            requestAnimationFrame(() => setTimeout(resolve, 0));
            return true;
          }
          resolve();
          return true;
        },
        clear(root, button = null) {
          admin.titles.bind.muteFocus(root);
          const scope = button?.closest?.(".admin-title-entry") || button?.closest?.(".ui-field-box") || root;
          const input = scope?.querySelector?.(':is(input,textarea)[data-field-kind="title"]');
          if (!input) return false;
          const item = admin.titles.headless.map()[input.dataset.fieldKey || ""];
          if (!item || !admin.titles.headless.clearable(item)) return false;
          const setButton = (restore = false) => {
            if (!button) return;
            const fluent = restore ? "Group Return" : "Eraser Medium";
            const fallback = restore ? "Return" : "Erase";
            const title = restore ? "Вернуть" : "Очистить";
            button.dataset.titleClearRestore = restore ? "true" : "false";
            button.title = title;
            button.setAttribute("aria-label", title);
            button.innerHTML = ui.controls.glyph(fluent, 18, fallback);
          };
          const removeAdd = () => {
            const entry = scope?.querySelector?.(".admin-title-entry") || input.closest?.(".admin-title-entry") || scope;
            scope?.querySelector?.('[data-action="titles-add"]')?.remove?.();
            entry?.removeAttribute?.("data-title-has-add");
            entry?.removeAttribute?.("data-title-empty");
            entry?.removeAttribute?.("data-title-locked");
          };
          const sync = () => {
            admin.titles.headless.active(input);
            admin.titles.view.syncCounter(root);
            admin.titles.view.fitTouch(root);
          };
          const focus = () => {
            input.focus?.();
            const end = String(input.value || "").length;
            input.setSelectionRange?.(end, end);
          };
          const snapshot = admin.titles.headless.clearSnapshot(item);
          if (snapshot) {
            if (item.kind === "rotation" && item.hidden?.()) {
              const render = (key = item.key) => requestAnimationFrame(() => admin.titles.render(root, { focusKey: key }));
              return admin.titles.headless.clear(item, render);
            }
            const value = String(snapshot.value || "");
            input.value = value;
            item.set?.(value);
            admin.titles.headless.resetClear(item);
            admin.titles.state.titleAddUnlocked[item.key] = true;
            admin.titles.state.activeKey = item.key;
            removeAdd();
            setButton(false);
            sync();
            focus();
            return true;
          }
          const value = String(input.value || item.get?.() || "");
          if (!value.trim() && item.kind !== "rotation") return false;
          admin.titles.state.titleClearSnapshot[item.key] = { kind: item.kind, value };
          admin.titles.state.titleAddUnlocked[item.key] = true;
          input.value = "";
          item.set?.("");
          admin.titles.state.activeKey = item.key;
          setButton(true);
          sync();
          focus();
          return true;
        },
        cycle(root, delta = 0) {
          admin.titles.bind.saveCurrent(root);
          const item = admin.titles.headless.step(delta);
          if (!item) return false;
          admin.titles.render(root, { focusKey: item.key });
          return true;
        },
        fields(root) {
          const items = admin.titles.headless.map();
          root
            .querySelectorAll(':is(input,textarea)[data-field-kind="title"]')
            .forEach((input) => {
              const key = input.dataset.fieldKey || "";
              admin.titles.bind.field(input, items[key], root);
            });
          const key = admin.titles.state.activeKey || "";
          const selected = root.querySelector(
            `:is(input,textarea)[data-field-kind="title"][data-field-key="${key}"]`,
          ) || root.querySelector(':is(input,textarea)[data-field-kind="title"]');
          if (!selected) return;
          admin.titles.headless.active(selected);
        },
        actions(root) {
          const clearButton = (event) => {
            const button = event.target.closest?.('[data-action="titles-clear"]');
            return button && root.contains(button) ? button : null;
          };
          const clearPointer = (event) => {
            const button = clearButton(event);
            if (!button) return;
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation?.();
            admin.titles.bind.clear(root, button);
          };
          const clearClick = (event) => {
            const button = clearButton(event);
            if (!button) return;
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation?.();
          };
          root.addEventListener("pointerdown", clearPointer, true);
          root.addEventListener("click", clearClick, true);
          admin.stack.cleanup(admin.titles, () => {
            root.removeEventListener("pointerdown", clearPointer, true);
            root.removeEventListener("click", clearClick, true);
          });
          admin.stack.bindActions(admin.titles, root, (name, meta = {}) => {
            if (name === "titles-add") return admin.titles.bind.add(root, meta.button);
            if (name === "titles-prev") return admin.titles.bind.cycle(root, -1);
            if (name === "titles-next") return admin.titles.bind.cycle(root, 1);
            return false;
          });
        },
      },
      run() {
        return admin.titles.open();
      },
      active(input = null) {
        return admin.titles.headless.active(input);
      },
      head() {
        return admin.titles.view.head();
      },
      render(root, options = {}) {
        return admin.titles.view.render(root, options);
      },
      close() {
        admin.stack.close(admin.titles);
      },
      open() {
        const root = admin.stack.open(admin.titles);
        admin.titles.bind.actions(root);
        return true;
      },
    },
    slug: {
      id: "admin-slug-stack",
      name: "slug",
      title: "Слаг",
      marker: "🖇️",
      state: {
        theme: "dark",
        cleanup: [],
        opener: null,
        counterShowText: false,
        slugCycle: 0,
        original: "",
        applied: "",
        candidate: "",
        swapDraft: "",
        applyingSwap: false,
        skipCycleClickUntil: 0,
        active: {
          label: "Слаг",
          current: 0,
          limit: 34,
        },
      },
      headless: {
        value() {
          return admin.fields.slug.value();
        },
        original() {
          return String(admin.slug.state.original || "");
        },
        resetOriginal(value = admin.slug.headless.value()) {
          const snap = admin.slug.headless.snapshot(value);
          admin.slug.state.original = snap.value;
          admin.slug.state.applied = snap.value;
          admin.slug.state.candidate = "";
          admin.slug.state.swapDraft = "";
          admin.slug.state.slugCycle = 0;
          admin.slug.state.applyingSwap = false;
          return admin.slug.state.original;
        },
        normalize(value = "") {
          return admin.fields.slug.snapshot(value).value;
        },
        same(left = "", right = "") {
          return admin.slug.headless.normalize(left) === admin.slug.headless.normalize(right);
        },
        snapshot(value = admin.slug.headless.value()) {
          return admin.fields.slug.snapshot(value);
        },
        counter(value = "") {
          const snap = admin.slug.headless.snapshot(value);
          return {
            label: "Слаг",
            current: snap.length,
            limit: snap.limit,
          };
        },
        sync(value = "") {
          const snap = admin.slug.headless.snapshot(value);
          admin.slug.state.active = admin.slug.headless.counter(value);
          return snap;
        },
        saveDraft(value = "") {
          return admin.slug.headless.sync(value);
        },
        commit(value = "", done = null) {
          const snap = admin.slug.headless.snapshot(value);
          return admin.fields.slug.commit(snap.value, (ok) => {
            if (ok) {
              admin.slug.state.applied = snap.value;
              admin.slug.state.slugCycle = 0;
              admin.slug.state.candidate = "";
              admin.slug.state.swapDraft = "";
            }
            done?.(ok, snap);
          });
        },
        candidates() {
          const config = admin.fields.config;
          const values = [
            admin.fields.value(config.title.selector),
            ...field.elements(config.rotation.selector).map((element) => String(element?.value || "")),
            admin.fields.value(config.favourite.selector),
            admin.fields.value(config.seo.selector),
          ];
          const seen = new Set();
          return values
            .map((value) => String(value || "").trim())
            .filter((value) => {
              const key = value.toLowerCase();
              if (!admin.slug.headless.normalize(value)) return false;
              if (seen.has(key)) return false;
              seen.add(key);
              return true;
            });
        },
        cycleValues() {
          const seen = new Set();
          return [
            admin.slug.headless.original(),
            ...admin.slug.headless.candidates(),
            admin.slug.state.applied,
            admin.slug.state.swapDraft,
          ].map((value) => String(value || "").trim())
            .filter((value) => {
              const key = value.toLowerCase();
              if (!admin.slug.headless.normalize(value)) return false;
              if (seen.has(key)) return false;
              seen.add(key);
              return true;
            });
        },
        rememberDraft(value = "") {
          if (admin.slug.state.applyingSwap) return false;
          const text = String(value || "").trim();
          const key = admin.slug.headless.normalize(text);
          if (!key) return false;
          if (admin.slug.headless.same(text, admin.slug.headless.original())) return false;
          if (admin.slug.state.applied && admin.slug.headless.same(text, admin.slug.state.applied)) return false;
          if (admin.slug.headless.candidates().some((value) => admin.slug.headless.same(text, value))) return false;
          admin.slug.state.swapDraft = text;
          return true;
        },
        swapValue(current = "") {
          const text = String(current || "").trim();
          admin.slug.headless.rememberDraft(text);
          const list = admin.slug.headless.cycleValues();
          if (!list.length) return "";
          const exactIndex = list.findIndex((value) => value === text);
          const index = exactIndex >= 0
            ? exactIndex
            : list.findIndex((value) => admin.slug.headless.same(text, value));
          const nextIndex = index >= 0 ? (index + 1) % list.length : 0;
          const next = list[nextIndex];
          const candidates = admin.slug.headless.candidates();
          admin.slug.state.slugCycle = nextIndex;
          admin.slug.state.candidate =
            candidates.find((value) => value === next) ||
            candidates.find((value) => admin.slug.headless.same(next, value)) ||
            "";
          return next;
        },
      },
      view: {
        head() {
          return admin.stack.head(admin.slug, {
            themeAction: "slug-theme",
            closeAction: "slug-close",
            mainAfter: admin.slug.view.apply(),
          });
        },
        input(value = "", snap = admin.slug.headless.snapshot(value)) {
          return `<div class="admin-fields-row">
            ${ui.controls.fieldBox({
              content: `${ui.controls.input({
                value,
                placeholder: "Слаг",
                classes: "admin-fields-input admin-fields-input--slug",
                attrs: ` data-field-kind="slug" data-field-label="Слаг" data-field-limit="${snap.limit}"`,
              })}${admin.slug.view.stateBadge(value)}`,
              corner: admin.slug.view.cycle(),
              attrs: ' data-field-corner="true" data-slug-field="true"',
            })}
          </div>`;
        },
        cycle() {
          return ui.controls.corner({
            action: "slug-cycle",
            fluent: "Arrow Swap",
            fallback: "Arrow Sync",
            title: "Свапнуть",
            classes: "admin-fields-corner admin-fields-cycle admin-slug-cycle",
            attrs: ' type="button"',
          });
        },
        apply() {
          return ui.shell.group(
            admin.stack.button(
              "slug-apply",
              ui.controls.glyph("Ribbon Star", 22, "Apply"),
              ' title="Применить" aria-label="Применить"',
            ),
            { rail: true, classes: "admin-fields-apply-group admin-slug-apply-group" },
          );
        },
        state(value = admin.slug.headless.value()) {
          const text = admin.slug.headless.normalize(value);
          if (admin.slug.headless.same(text, admin.slug.headless.original())) {
            return {
              name: "original",
              title: "Исходный",
              fluent: "Person Edit",
              fallback: "Person",
            };
          }
          if (admin.slug.headless.candidates().some((value) => admin.slug.headless.same(text, value))) {
            return {
              name: "candidate",
              title: "Кандидат",
              fluent: "Comment Edit",
              fallback: "Comment",
            };
          }
          return {
            name: "draft",
            title: "Норм",
            fluent: "Code Text Edit",
            fallback: "Code Text",
          };
        },
        stateBadge(value = admin.slug.headless.value()) {
          const state = admin.slug.view.state(value);
          return `<span class="admin-slug-state-badge" data-slug-state="${state.name}" title="${admin.fields.escape(state.title)}" aria-label="${admin.fields.escape(state.title)}">${ui.controls.glyph(state.fluent, 18, state.fallback)}</span>`;
        },
        preview(snap) {
          return `<div class="admin-fields-row admin-fields-row--slug-cycle">
            <div class="admin-fields-slug-edit">
              <div class="admin-fields-static admin-fields-static--slug-live" data-field-kind="slug-live" title="${admin.fields.escape(snap.value)}">${admin.fields.escape(snap.visible)}</div>
            </div>
          </div>`;
        },
        body() {
          const value = admin.slug.headless.value();
          const snap = admin.slug.headless.snapshot(value);
          return `${admin.slug.view.input(value, snap)}${admin.slug.view.preview(snap)}`;
        },
        build() {
          return admin.stack.shell(admin.slug, admin.slug.view.body());
        },
        syncCounter(root) {
          admin.stack.syncCounter(admin.slug, root);
        },
        syncPreview(root, snap) {
          const live = root?.querySelector?.('[data-field-kind="slug-live"]');
          if (!live) return;
          live.textContent = snap.visible;
          live.setAttribute("title", snap.value);
        },
        focus(root) {
          const input = root?.querySelector?.('input[data-field-kind="slug"]');
          admin.stack.focusInput(input);
        },
        render(root) {
          const node = admin.stack.node(root);
          if (!node) return;
          node.innerHTML = admin.slug.view.build();
          admin.slug.bind.field(root);
          admin.slug.view.syncCounter(root);
          admin.slug.view.focus(root);
        },
      },
      bind: {
        field(root) {
          const input = root?.querySelector('input[data-field-kind="slug"]');
          if (!input) return;
          const sync = () => {
            const snap = admin.slug.headless.sync(input.value || "");
            admin.slug.view.syncCounter(root);
            return snap;
          };
          const syncState = () => {
            const control = input.closest?.(".ui-field-control");
            const badge = control?.querySelector?.(".admin-slug-state-badge");
            if (!badge) return;
            const state = admin.slug.view.state(input.value || "");
            badge.dataset.slugState = state.name;
            badge.title = state.title;
            badge.setAttribute("aria-label", state.title);
            badge.innerHTML = ui.controls.glyph(state.fluent, 18, state.fallback);
          };
          input.addEventListener("focus", () => {
            admin.edit.history(input);
            admin.edit.capture(input, () => {
              const snap = admin.slug.headless.saveDraft(input.value || "");
              admin.slug.view.syncPreview(root, snap);
              sync();
              syncState();
            });
            sync();
            syncState();
          });
          input.addEventListener("keydown", (event) => {
            admin.edit.shortcut(event, input, () => {
              const snap = admin.slug.headless.saveDraft(input.value || "");
              admin.slug.view.syncPreview(root, snap);
              sync();
              syncState();
            });
          });
          input.addEventListener("input", () => {
            admin.slug.headless.rememberDraft(input.value || "");
            admin.edit.track(input);
            const snap = admin.slug.headless.saveDraft(input.value || "");
            admin.slug.view.syncPreview(root, snap);
            sync();
            syncState();
          });
          input.addEventListener("blur", () => {
            const node = admin.stack.node(root);
            if (node) delete node.dataset.excerptEditing;
            admin.edit.release(input);
            sync();
          });
          sync();
          syncState();
        },
        resize(root) {
          const input = root?.querySelector?.('[data-field-kind="excerpt"]');
          const edge = root?.querySelector?.('[data-field-resize-edge="true"]');
          if (!input || !edge || edge.dataset.bound === "true") return;
          edge.dataset.bound = "true";
          let state = null;
          const clear = (event) => {
            if (!state) return;
            edge.releasePointerCapture?.(event?.pointerId);
            window.removeEventListener("pointermove", move, true);
            window.removeEventListener("pointerup", clear, true);
            window.removeEventListener("pointercancel", clear, true);
            delete root.dataset.fieldResizing;
            state = null;
          };
          const move = (event) => {
            if (!state) return;
            event.preventDefault();
            event.stopPropagation();
            const delta = event.clientY - state.y;
            const height = Math.max(state.min, Math.min(state.max, state.height + delta));
            input.style.height = `${Math.round(height)}px`;
            input.style.overflowY = "auto";
          };
          edge.addEventListener("pointerdown", (event) => {
            if (event.button !== undefined && event.button !== 0) return;
            event.preventDefault();
            event.stopPropagation();
            const rect = input.getBoundingClientRect();
            const panelRect = root.getBoundingClientRect();
            const screen = window.visualViewport || { height: window.innerHeight, offsetTop: 0 };
            root.dataset.fieldResizing = "true";
            state = {
              y: event.clientY,
              height: rect.height,
              min: 96,
              max: Math.max(140, screen.offsetTop + screen.height - panelRect.top - 132),
            };
            edge.setPointerCapture?.(event.pointerId);
            window.addEventListener("pointermove", move, true);
            window.addEventListener("pointerup", clear, true);
            window.addEventListener("pointercancel", clear, true);
          });
        },
        actions(root) {
          admin.stack.bindActions(admin.slug, root, (name, meta = {}) => {
            const input = root.querySelector('input[data-field-kind="slug"]');
            if (!input) return false;
            if (name === "slug-cycle") {
              const now = Date.now();
              const eventType = meta.event?.type || "";
              if (eventType === "click" && now < (admin.slug.state.skipCycleClickUntil || 0)) {
                return true;
              }
              if (eventType === "touchend") {
                admin.slug.state.skipCycleClickUntil = now + 650;
              }
              const value = admin.slug.headless.swapValue(input.value || "");
              if (!value) return false;
              admin.slug.state.applyingSwap = true;
              input.value = value;
              input.dispatchEvent(new Event("input", { bubbles: true }));
              admin.slug.state.applyingSwap = false;
              input.focus();
              return true;
            }
            if (name === "slug-apply") {
              admin.stack.flashApply(meta.button);
              const value = input.value || "";
              const snap = admin.slug.headless.snapshot(value);
              const hasHellip =
                snap.willBeCut ||
                admin.slug.headless.normalize(value).length > snap.limit ||
                /…|&hellip;|&#8230;/i.test(value);
              if (hasHellip && !window.confirm("Задлинно!! Всё равно тебе??")) return true;
              admin.slug.headless.commit(value, (ok, applied) => {
                if (!ok) return;
                admin.slug.state.applyingSwap = true;
                input.value = applied.value;
                input.dispatchEvent(new Event("input", { bubbles: true }));
                admin.slug.state.applyingSwap = false;
                const next = admin.slug.headless.saveDraft(input.value || "");
                admin.slug.view.syncPreview(root, next);
                admin.slug.view.syncCounter(root);
                input.focus();
              });
              return true;
            }
            return false;
          });
        },
      },
      run() {
        return admin.slug.open();
      },
      active(value = "") {
        return admin.slug.headless.sync(value);
      },
      head() {
        return admin.slug.view.head();
      },
      render(root) {
        return admin.slug.view.render(root);
      },
      close() {
        admin.stack.close(admin.slug);
      },
      open() {
        admin.slug.headless.resetOriginal();
        const root = admin.stack.open(admin.slug);
        admin.slug.bind.actions(root);
        return true;
      },
    },
    excerpt: {
      id: "admin-excerpt-stack",
      name: "excerpt",
      title: "Цитата",
      marker: "💭",
      state: {
        theme: "dark",
        cleanup: [],
        opener: null,
        counterShowText: false,
        titleAddUnlocked: {},
        original: "",
        applied: "",
        draft: "",
        swapDraft: "",
        applyingSwap: false,
        active: {
          label: "Цитата",
          current: 0,
          limit: 420,
        },
      },
      headless: {
        value() {
          return admin.fields.excerpt.value();
        },
        original() {
          return String(admin.excerpt.state.original || "");
        },
        resetOriginal(value = admin.excerpt.headless.value()) {
          admin.excerpt.state.original = String(value || "");
          admin.excerpt.state.applied = admin.excerpt.state.original;
          admin.excerpt.state.draft = admin.excerpt.state.original;
          admin.excerpt.state.swapDraft = "";
          admin.excerpt.state.applyingSwap = false;
          return admin.excerpt.state.original;
        },
        shorten(value = "", limit = 90) {
          const text = String(value || "");
          const chars = Array.from(text);
          if (chars.length <= limit) return text;
          const head = Math.max(8, Math.floor(limit * 0.55));
          const tail = Math.max(8, limit - head - 1);
          return `${chars.slice(0, head).join("")}…${chars.slice(-tail).join("")}`;
        },
        diffTokens(value = "") {
          const text = String(value || "");
          return text.match(/\s+|[\p{L}\p{N}]+|[^\s\p{L}\p{N}]+/gu) || [];
        },
        diffKey(token = "") {
          return /^\s+$/.test(token) ? " " : token;
        },
        diffWeight(value = "") {
          return Array.from(String(value || "").replace(/\s+/g, "")).length;
        },
        diffOps(before = "", after = "") {
          const oldTokens = admin.excerpt.headless.diffTokens(before);
          const newTokens = admin.excerpt.headless.diffTokens(after);
          const same = (left, right) => admin.excerpt.headless.diffKey(left) ===
            admin.excerpt.headless.diffKey(right);
          const ops = [];
          const push = (type, text) => {
            if (!text) return;
            const last = ops[ops.length - 1];
            if (last?.type === type) {
              last.text += text;
              return;
            }
            ops.push({ type, text });
          };
          const width = newTokens.length + 1;
          const size = (oldTokens.length + 1) * width;
          if (!oldTokens.length || !newTokens.length || size > 90000) {
            push("remove", oldTokens.join(""));
            push("add", newTokens.join(""));
            return ops;
          }
          const score = new Uint16Array(size);
          for (let oldIndex = oldTokens.length - 1; oldIndex >= 0; oldIndex -= 1) {
            for (let newIndex = newTokens.length - 1; newIndex >= 0; newIndex -= 1) {
              const index = oldIndex * width + newIndex;
              if (same(oldTokens[oldIndex], newTokens[newIndex])) {
                score[index] = score[(oldIndex + 1) * width + newIndex + 1] + 1;
              } else {
                score[index] = Math.max(
                  score[(oldIndex + 1) * width + newIndex],
                  score[oldIndex * width + newIndex + 1],
                );
              }
            }
          }
          let oldIndex = 0;
          let newIndex = 0;
          while (oldIndex < oldTokens.length && newIndex < newTokens.length) {
            if (same(oldTokens[oldIndex], newTokens[newIndex])) {
              push("equal", newTokens[newIndex]);
              oldIndex += 1;
              newIndex += 1;
              continue;
            }
            if (
              score[(oldIndex + 1) * width + newIndex] >=
              score[oldIndex * width + newIndex + 1]
            ) {
              push("remove", oldTokens[oldIndex]);
              oldIndex += 1;
              continue;
            }
            push("add", newTokens[newIndex]);
            newIndex += 1;
          }
          push("remove", oldTokens.slice(oldIndex).join(""));
          push("add", newTokens.slice(newIndex).join(""));
          return ops.filter((op) => op.text);
        },
        diffSimilarity(ops = [], before = "", after = "") {
          const equal = ops
            .filter((op) => op.type === "equal")
            .map((op) => op.text)
            .join("");
          const total = Math.max(
            admin.excerpt.headless.diffWeight(before),
            admin.excerpt.headless.diffWeight(after),
            1,
          );
          return admin.excerpt.headless.diffWeight(equal) / total;
        },
        diffChangeRatio(ops = [], before = "", after = "") {
          const removed = ops
            .filter((op) => op.type === "remove")
            .map((op) => op.text)
            .join("");
          const added = ops
            .filter((op) => op.type === "add")
            .map((op) => op.text)
            .join("");
          const changed = Math.max(
            admin.excerpt.headless.diffWeight(removed),
            admin.excerpt.headless.diffWeight(added),
          );
          const total = Math.max(
            admin.excerpt.headless.diffWeight(before),
            admin.excerpt.headless.diffWeight(after),
            1,
          );
          return changed / total;
        },
        diffIsReplacement(ops = [], before = "", after = "") {
          const oldWeight = admin.excerpt.headless.diffWeight(before);
          const newWeight = admin.excerpt.headless.diffWeight(after);
          if (Math.min(oldWeight, newWeight) < 80) return false;
          const similarity = admin.excerpt.headless.diffSimilarity(ops, before, after);
          const changed = admin.excerpt.headless.diffChangeRatio(ops, before, after);
          return similarity < 0.34 || changed > 0.72;
        },
        diffHtml(ops = []) {
          return ops.map((op) => {
            const value = admin.fields.escape(op.text);
            if (op.type === "add") {
              return `<span class="admin-excerpt-diff-part admin-excerpt-diff-add">${value}</span>`;
            }
            if (op.type === "remove") {
              return `<span class="admin-excerpt-diff-part admin-excerpt-diff-remove">${value}</span>`;
            }
            return `<span class="admin-excerpt-diff-part admin-excerpt-diff-equal">${value}</span>`;
          }).join("");
        },
        diffReplacementHtml(before = "", after = "") {
          return `<span class="admin-excerpt-diff-replacement">${[
            `<span class="admin-excerpt-diff-block admin-excerpt-diff-remove">${admin.fields.escape(before)}</span>`,
            `<span class="admin-excerpt-diff-block admin-excerpt-diff-add">${admin.fields.escape(after)}</span>`,
          ].join("")}</span>`;
        },
        diff(before = "", after = "") {
          const oldText = admin.excerpt.headless.normalize(before);
          const newText = admin.excerpt.headless.normalize(after);
          if (oldText === newText) {
            const icon = ui.controls.glyph("Equal Circle", 18, "Equal Circle");
            return {
              text: "",
              icon: `<span class="admin-excerpt-equal-pair" title="Без изменений" aria-label="Без изменений"><span class="admin-excerpt-equal-part admin-excerpt-equal-remove">${icon}</span><span class="admin-excerpt-equal-part admin-excerpt-equal-add">${icon}</span></span>`,
              state: "same",
            };
          }
          const ops = admin.excerpt.headless.diffOps(oldText, newText);
          const replace = admin.excerpt.headless.diffIsReplacement(ops, oldText, newText);
          return {
            text: "Изменено",
            html: replace
              ? admin.excerpt.headless.diffReplacementHtml(oldText, newText)
              : admin.excerpt.headless.diffHtml(ops),
            state: replace ? "replace" : "diff",
          };
        },
        limit() {
          return admin.fields.config.excerpt.limit || 420;
        },
        counter(value = admin.excerpt.headless.value()) {
          return {
            label: "Цитата",
            current: Array.from(String(value || "")).length,
            limit: admin.excerpt.headless.limit(),
          };
        },
        sync(value = "") {
          admin.excerpt.state.active = admin.excerpt.headless.counter(value);
          return admin.excerpt.state.active;
        },
        saveDraft(value = "") {
          admin.excerpt.state.draft = String(value || "");
          return admin.excerpt.headless.sync(value);
        },
        commit(value = "") {
          const text = String(value || "");
          admin.fields.excerpt.set(text);
          admin.excerpt.state.applied = text;
          admin.excerpt.state.draft = text;
          return admin.excerpt.headless.sync(text);
        },
        content() {
          try {
            cms.editor.syncToTextarea?.();
            return String(field.element("#content")?.value || "");
          } catch {
            return "";
          }
        },
        clean() {
          try {
            return excerpt.lead(admin.excerpt.headless.content());
          } catch {
            return "";
          }
        },
        normalize(value = "") {
          return String(value || "")
            .replace(/\s+/g, " ")
            .trim();
        },
        note(value = admin.excerpt.headless.value()) {
          const current = String(value || "").trim();
          const currentText = admin.excerpt.headless.normalize(current);
          if (!currentText) {
            return { text: "Пусто", state: "empty" };
          }
          return admin.excerpt.headless.diff(admin.excerpt.headless.original(), current);
        },
        leadMatch(value = admin.excerpt.headless.value()) {
          const currentText = admin.excerpt.headless.normalize(value);
          if (!currentText) return false;
          if (admin.excerpt.headless.diff(admin.excerpt.headless.original(), value).state !== "same") return false;
          const cleanText = admin.excerpt.headless.normalize(admin.excerpt.headless.clean());
          return Boolean(cleanText && currentText === cleanText);
        },
        same(left = "", right = "") {
          return admin.excerpt.headless.normalize(left) ===
            admin.excerpt.headless.normalize(right);
        },
        rememberDraft(value = "") {
          if (admin.excerpt.state.applyingSwap) return false;
          const text = String(value || "");
          if (!admin.excerpt.headless.normalize(text)) return false;
          const original = admin.excerpt.headless.original();
          const clean = admin.excerpt.headless.clean();
          if (admin.excerpt.headless.same(text, original)) return false;
          if (clean && admin.excerpt.headless.same(text, clean)) return false;
          admin.excerpt.state.swapDraft = text;
          return true;
        },
        swapValue(current = "") {
          const original = admin.excerpt.headless.original();
          const clean = admin.excerpt.headless.clean();
          const draft = String(admin.excerpt.state.swapDraft || "");
          if (!clean && !original && !draft) return "";
          if (admin.excerpt.headless.same(current, original)) return clean || draft;
          if (clean && admin.excerpt.headless.same(current, clean)) {
            return draft || original;
          }
          if (draft && admin.excerpt.headless.same(current, draft)) return original || clean;
          admin.excerpt.headless.rememberDraft(current);
          return clean || original || draft;
        },
        copy(value = "") {
          const text = String(value || "");
          if (!text || !navigator.clipboard?.writeText) return false;
          navigator.clipboard.writeText(text).catch(() => {});
          return true;
        },
        replace(input = null) {
          if (!input) return false;
          const previous = String(input.value || "");
          admin.excerpt.headless.rememberDraft(previous);
          const next = admin.excerpt.headless.swapValue(previous);
          if (!next || admin.excerpt.headless.same(previous, next)) return false;
          admin.excerpt.headless.copy(previous);
          admin.excerpt.state.applyingSwap = true;
          input.value = next;
          input.dispatchEvent(new Event("input", { bubbles: true }));
          admin.excerpt.state.applyingSwap = false;
          input.focus?.();
          return true;
        },
      },
      view: {
        head() {
          return admin.stack.head(admin.excerpt, {
            themeAction: "excerpt-theme",
            closeAction: "excerpt-close",
            mainAfter: admin.excerpt.view.apply(),
          });
        },
        input(value = "") {
          const limit = admin.excerpt.headless.limit();
          return `<div class="admin-fields-row">
            ${ui.controls.fieldBox({
              content: `${ui.controls.textarea({
                value,
                placeholder: "Цитата",
                classes: "admin-fields-input admin-fields-input--excerpt",
                attrs: ` data-field-kind="excerpt" data-field-label="Цитата" data-field-limit="${limit}"`,
              })}${admin.excerpt.view.stateBadge(value)}`,
              corner: admin.excerpt.view.replace(),
              note: admin.excerpt.view.note(value),
              resize: true,
              attrs: ' data-field-corner="true" data-field-resize="vertical" data-field-fade="true"',
            })}
          </div>`;
        },
        state(value = admin.excerpt.headless.value()) {
          try {
            const text = String(value || "");
            const clean = admin.excerpt.headless.clean();
          if (admin.excerpt.headless.same(text, admin.excerpt.headless.original())) {
            return {
              name: "original",
              title: "Автор",
              fluent: "Person Edit",
              fallback: "Person",
            };
          }
          if (clean && admin.excerpt.headless.same(text, clean)) {
            return {
              name: "lead",
              title: "Лид",
              fluent: "Comment Edit",
              fallback: "Comment",
            };
          }
          } catch {}
          return {
            name: "draft",
            title: "Норм",
            fluent: "Code Text Edit",
            fallback: "Code Text",
          };
        },
        stateBadge(value = admin.excerpt.headless.value()) {
          const state = admin.excerpt.view.state(value);
          return `<span class="admin-excerpt-state-badge" data-excerpt-state="${state.name}" title="${admin.fields.escape(state.title)}" aria-label="${admin.fields.escape(state.title)}">${ui.controls.glyph(state.fluent, 18, state.fallback)}</span>`;
        },
        note(value = admin.excerpt.headless.value()) {
          try {
            return admin.excerpt.headless.note(value);
          } catch {
            return { text: "", state: "" };
          }
        },
        replace() {
          return ui.controls.corner({
            action: "excerpt-replace",
            fluent: "Arrow Swap",
            fallback: "Arrow Sync",
            title: "Свапнуть",
            classes: "admin-fields-corner admin-fields-replace",
            attrs: ' type="button"',
          });
        },
        apply() {
          return ui.shell.group(
            admin.stack.button(
              "excerpt-apply",
              ui.controls.glyph("Ribbon Star", 22, "Apply"),
              ' title="Применить" aria-label="Применить"',
            ),
            { rail: true, classes: "admin-fields-apply-group admin-excerpt-apply-group" },
          );
        },
        body() {
          return admin.excerpt.view.input(admin.excerpt.state.draft);
        },
        build() {
          return admin.stack.shell(admin.excerpt, admin.excerpt.view.body());
        },
        syncCounter(root) {
          admin.stack.syncCounter(admin.excerpt, root);
        },
        syncNote(root) {
          const input = root?.querySelector?.('[data-field-kind="excerpt"]');
          const note = root?.querySelector?.('.ui-field-note');
          if (!input || !note) return;
          const value = admin.excerpt.view.note(input.value || "");
          const text = String(value?.text || "");
          note.dataset.empty = text ? "false" : "true";
          if (value?.state) {
            note.dataset.noteState = value.state;
          } else {
            delete note.dataset.noteState;
          }
          const html = value?.html || admin.fields.escape(text);
          root.dataset.excerptDiff = value?.state === "diff" || value?.state === "replace" ? "true" : "false";
          const control = input.closest?.(".ui-field-control");
          const existingBadge = control?.querySelector?.(".admin-excerpt-state-badge");
          const badge = admin.excerpt.view.stateBadge(input.value || "");
          if (control && existingBadge) {
            const state = admin.excerpt.view.state(input.value || "");
            existingBadge.dataset.excerptState = state.name;
            existingBadge.title = state.title;
            existingBadge.setAttribute("aria-label", state.title);
            existingBadge.innerHTML = ui.controls.glyph(state.fluent, 18, state.fallback);
          } else if (control && badge) {
            control.insertAdjacentHTML("beforeend", badge);
          }
          note.innerHTML = `${value?.icon ? `<span class="ui-field-note-icon">${value.icon}</span>` : ""}<span class="ui-field-note-text">${html}</span>`;
        },
        fit(root) {
          const input = root?.querySelector?.('[data-field-kind="excerpt"]');
          if (!input) return;
          input.style.height = "auto";
          const screen = window.visualViewport || { height: window.innerHeight, offsetTop: 0 };
          const bottom = screen.offsetTop + screen.height;
          const panelRect = root.getBoundingClientRect();
          const inputRect = input.getBoundingClientRect();
          const chrome = Math.max(0, panelRect.height - inputRect.height);
          const min = root?.dataset?.tight === "true" ? 82 : 110;
          const max = Math.max(72, bottom - panelRect.top - chrome - 22);
          const floor = Math.min(min, max);
          const next = Math.max(floor, Math.min(max, input.scrollHeight + 2));
          input.style.height = `${Math.round(next)}px`;
        },
        focus(root) {
          const input = root?.querySelector?.('[data-field-kind="excerpt"]');
          admin.stack.focusInput(input);
        },
        render(root) {
          const node = admin.stack.node(root);
          if (!node) return;
          node.innerHTML = admin.excerpt.view.build();
          admin.excerpt.bind.field(root);
          admin.excerpt.bind.resize(root);
          admin.excerpt.view.syncCounter(root);
          admin.excerpt.view.syncNote(root);
          admin.excerpt.view.fit(root);
          admin.excerpt.view.focus(root);
        },
      },
      bind: {
        field(root) {
          const input = root?.querySelector('[data-field-kind="excerpt"]');
          if (!input) return;
          const sync = () => {
            admin.excerpt.headless.sync(input.value || "");
            admin.excerpt.view.syncCounter(root);
            admin.excerpt.view.syncNote(root);
            admin.excerpt.view.fit(root);
          };
          const save = () => {
            admin.excerpt.headless.saveDraft(input.value || "");
            sync();
          };
          input.addEventListener("focus", () => {
            const node = admin.stack.node(root);
            if (node) node.dataset.excerptEditing = "true";
            admin.titles.view.fitTouch(root);
            admin.edit.history(input);
            admin.edit.capture(input, save);
            sync();
          });
          input.addEventListener("keydown", (event) => {
            admin.edit.shortcut(event, input, save);
          });
          input.addEventListener("input", () => {
            admin.excerpt.headless.rememberDraft(input.value || "");
            admin.edit.track(input);
            save();
          });
          input.addEventListener("blur", () => {
            const node = admin.stack.node(root);
            if (node) delete node.dataset.excerptEditing;
            admin.edit.release(input);
            sync();
          });
          sync();
        },
        resize(root) {
          const input = root?.querySelector?.('[data-field-kind="excerpt"]');
          const edge = root?.querySelector?.('[data-field-resize-edge="true"]');
          if (!input || !edge || edge.dataset.bound === "true") return;
          edge.dataset.bound = "true";
          let state = null;
          const clear = (event) => {
            if (!state) return;
            edge.releasePointerCapture?.(event?.pointerId);
            window.removeEventListener("pointermove", move, true);
            window.removeEventListener("pointerup", clear, true);
            window.removeEventListener("pointercancel", clear, true);
            delete root.dataset.fieldResizing;
            state = null;
          };
          const move = (event) => {
            if (!state) return;
            event.preventDefault();
            event.stopPropagation();
            const delta = event.clientY - state.y;
            const height = Math.max(state.min, Math.min(state.max, state.height + delta));
            input.style.height = `${Math.round(height)}px`;
            input.style.overflowY = "auto";
          };
          edge.addEventListener("pointerdown", (event) => {
            if (event.button !== undefined && event.button !== 0) return;
            event.preventDefault();
            event.stopPropagation();
            const rect = input.getBoundingClientRect();
            const panelRect = root.getBoundingClientRect();
            const screen = window.visualViewport || { height: window.innerHeight, offsetTop: 0 };
            root.dataset.fieldResizing = "true";
            state = {
              y: event.clientY,
              height: rect.height,
              min: 96,
              max: Math.max(140, screen.offsetTop + screen.height - panelRect.top - 132),
            };
            edge.setPointerCapture?.(event.pointerId);
            window.addEventListener("pointermove", move, true);
            window.addEventListener("pointerup", clear, true);
            window.addEventListener("pointercancel", clear, true);
          });
        },
        actions(root) {
          admin.stack.bindActions(admin.excerpt, root, (name, meta = {}) => {
            const input = root?.querySelector?.('[data-field-kind="excerpt"]');
            if (!input) return false;
            if (name === "excerpt-replace") {
              if (!admin.excerpt.headless.replace(input)) return false;
              admin.excerpt.view.syncCounter(root);
              admin.excerpt.view.syncNote(root);
              admin.excerpt.view.fit(root);
              return true;
            }
            if (name === "excerpt-apply") {
              const value = input.value || "";
              const length = Array.from(String(value || "")).length;
              const limit = admin.excerpt.headless.limit();
              if (limit && length >= Math.ceil(limit * 1.11) && !window.confirm("Реально такой лапоть сунешь??")) {
                return true;
              }
              admin.stack.flashApply(meta.button);
              admin.excerpt.headless.commit(value);
              admin.excerpt.view.syncCounter(root);
              admin.excerpt.view.syncNote(root);
              admin.excerpt.view.fit(root);
              input.focus?.();
              return true;
            }
            return false;
          });
        },
      },
      run() {
        return admin.excerpt.open();
      },
      head() {
        return admin.excerpt.view.head();
      },
      render(root) {
        return admin.excerpt.view.render(root);
      },
      close() {
        admin.stack.close(admin.excerpt);
      },
      open() {
        admin.excerpt.headless.resetOriginal();
        const root = admin.stack.open(admin.excerpt);
        admin.excerpt.bind.actions(root);
        return true;
      },
    },

    crawler: {
      tags: {
        state: {
          running: false,
        },
        decode(value) {
          const textarea = document.createElement("textarea");
          textarea.innerHTML = String(value || "");
          return textarea.value;
        },
        plain(value) {
          return admin.crawler.tags.decode(value)
            .replace(/\[onliner-[\s\S]*?\[\/onliner-[^\]]+\]/g, " ")
            .replace(/\[[^\]]+\]/g, " ")
            .replace(/<[^>]+>/g, " ")
            .replace(/[\u00a0\t\r\n]+/g, " ")
            .replace(/\s+/g, " ")
            .trim();
        },
        split(value) {
          const source = String(value || "").replace(/\s+/g, " ").trim();
          if (!source || /меток нет/i.test(source)) return [];
          return source
            .split(/[,;]+/)
            .map((item) => item.replace(/^[×x]\s*/i, "").trim())
            .filter(Boolean);
        },
        row(element) {
          const id = String(element?.id || "").match(/\d+/)?.[0] || "";
          const title = element?.querySelector(".row-title") || null;
          const edit = title?.href || element?.querySelector('a[href*="action=edit"]')?.href || "";
          const tagsText = element?.querySelector(".tags")?.textContent || "";
          return {
            id,
            title: admin.crawler.tags.plain(title?.textContent || ""),
            edit,
            tags: admin.crawler.tags.split(tagsText),
          };
        },
        rows(doc) {
          return [...doc.querySelectorAll("#the-list tr[id^='post-']")]
            .map(admin.crawler.tags.row)
            .filter((item) => item.id && item.edit);
        },
        next(doc) {
          const link = doc.querySelector(".tablenav-pages .next-page:not(.disabled)");
          if (!link || link.classList.contains("disabled")) return "";
          const href = link.getAttribute("href") || "";
          return href ? new URL(href, location.href).href : "";
        },
        stamp() {
          const date = new Date();
          const pad = (value) => String(value).padStart(2, "0");
          return [
            date.getFullYear(),
            pad(date.getMonth() + 1),
            pad(date.getDate()),
            pad(date.getHours()),
            pad(date.getMinutes()),
            pad(date.getSeconds()),
          ].join("");
        },
        download(records) {
          const payload = JSON.stringify(records, null, 2);
          const blob = new Blob([payload], { type: "application/json;charset=utf-8" });
          const link = document.createElement("a");
          link.href = URL.createObjectURL(blob);
          link.download = `onliner-tags-dataset-${admin.crawler.tags.stamp()}.json`;
          document.body.append(link);
          link.click();
          setTimeout(() => {
            URL.revokeObjectURL(link.href);
            link.remove();
          }, 1000);
        },
        async load(url) {
          const response = await fetch(url, {
            credentials: "include",
            cache: "no-store",
          });
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          const html = await response.text();
          return new DOMParser().parseFromString(html, "text/html");
        },
        detailTags(doc) {
          return [...doc.querySelectorAll("#post_tag .tagchecklist span")]
            .map((item) => item.textContent || "")
            .flatMap(admin.crawler.tags.split);
        },
        detail(row, doc) {
          const title = admin.crawler.tags.plain(doc.querySelector("#title")?.value || row.title);
          const content = doc.querySelector("#content")?.value || "";
          const tags = admin.crawler.tags.detailTags(doc);
          return {
            ...row,
            title,
            text: admin.crawler.tags.plain(content),
            tags: tags.length ? tags : row.tags,
            url: doc.querySelector("#sample-permalink a")?.href || "",
          };
        },
        async collect(startUrl, limit) {
          const records = [];
          let url = startUrl;
          for (let page = 1; url && page <= limit; page += 1) {
            document.title = `Кроулер меток: ${page}/${limit}`;
            const doc = await admin.crawler.tags.load(url);
            const rows = admin.crawler.tags.rows(doc);
            for (const [index, row] of rows.entries()) {
              document.title = `Кроулер меток: ${page}/${limit} · ${index + 1}/${rows.length}`;
              const detail = await admin.crawler.tags.load(row.edit);
              records.push(admin.crawler.tags.detail(row, detail));
            }
            url = admin.crawler.tags.next(doc);
          }
          return records;
        },
        limit() {
          const value = prompt("Сколько страниц кроулить?", "1");
          const limit = Number.parseInt(value, 10);
          if (!Number.isFinite(limit) || limit < 1) return 0;
          return Math.min(limit, 20);
        },
        async run() {
          if (admin.crawler.tags.state.running) return false;
          const limit = admin.crawler.tags.limit();
          if (!limit) return false;
          admin.crawler.tags.state.running = true;
          const title = document.title;
          try {
            const records = await admin.crawler.tags.collect(location.href, limit);
            admin.crawler.tags.download(records);
            alert(`Готово: ${records.length}`);
            return true;
          } catch (error) {
            alert(error.message || "Ошибка кроулера меток");
            return false;
          } finally {
            document.title = title;
            admin.crawler.tags.state.running = false;
          }
        },
      },
      report: {
        state: {
          running: false,
        },
        rules: [
          {
            name: "vacancies",
            keywords: [
              "\u0432\u0430\u043a\u0430\u043d\u0441\u0438\u044f",
              "\u0440\u0430\u0431\u043e\u0442\u0430",
              "\u0437\u0430\u0440\u043f\u043b\u0430\u0442\u0430",
              "\u043e\u0444\u0438\u0441",
              "\u0440\u0435\u0437\u044e\u043c\u0435",
            ],
          },
          {
            name: "politics",
            keywords: [
              "\u0437\u0430\u043a\u043e\u043d",
              "\u043c\u0438\u043d\u0438\u0441\u0442\u0440",
              "\u043f\u0440\u0435\u0437\u0438\u0434\u0435\u043d\u0442",
              "\u0433\u043e\u0441\u0434\u0443\u043c\u0430",
            ],
          },
        ],
        text(title, content) {
          return admin.crawler.tags
            .plain(`${title} ${content}`)
            .toLocaleLowerCase("ru-RU");
        },
        score(rule, text) {
          let score = 0;
          for (const keyword of rule.keywords) {
            if (text.includes(keyword)) score += 1;
          }
          return score;
        },
        analyze(text) {
          return admin.crawler.report.rules
            .map((rule) => ({
              tag: rule.name,
              score: admin.crawler.report.score(rule, text),
            }))
            .filter((item) => item.score > 0)
            .sort((left, right) => right.score - left.score)
            .map((item) => item.tag);
        },
        detail(row, doc) {
          const title = admin.crawler.tags.plain(
            doc.querySelector("#title")?.value || row.title,
          );
          const content = doc.querySelector("#content")?.value || "";
          const text = admin.crawler.report.text(title, content);
          return {
            ...row,
            title,
            text,
            tags: admin.crawler.report.analyze(text),
            url: doc.querySelector("#sample-permalink a")?.href || "",
          };
        },
        dataset(records = []) {
          return records.map((item) => ({
            id: item.id,
            title: item.title,
            text: item.text,
            tags: item.tags,
          }));
        },
        download(records = []) {
          const payload = {
            records,
            dataset: admin.crawler.report.dataset(records),
          };
          const blob = new Blob([JSON.stringify(payload, null, 2)], {
            type: "application/json;charset=utf-8",
          });
          const link = document.createElement("a");
          link.href = URL.createObjectURL(blob);
          link.download = `onliner-report-dataset-${admin.crawler.tags.stamp()}.json`;
          document.body.append(link);
          link.click();
          setTimeout(() => {
            URL.revokeObjectURL(link.href);
            link.remove();
          }, 1000);
        },
        limit() {
          const value = prompt(
            "\u0421\u043a\u043e\u043b\u044c\u043a\u043e \u0441\u0442\u0440\u0430\u043d\u0438\u0446 \u043a\u0440\u043e\u0443\u043b\u0438\u0442\u044c?",
            "1",
          );
          const limit = Number.parseInt(value, 10);
          if (!Number.isFinite(limit) || limit < 1) return 0;
          return Math.min(limit, 20);
        },
        stop() {
          return Boolean(window.reportStop);
        },
        async collect(startUrl, limit) {
          const records = [];
          let url = startUrl;
          for (let page = 1; url && page <= limit; page += 1) {
            if (admin.crawler.report.stop()) break;
            document.title = `\u041e\u0442\u0447\u0451\u0442: ${page}/${limit}`;
            const doc = await admin.crawler.tags.load(url);
            const rows = admin.crawler.tags.rows(doc);
            for (const [index, row] of rows.entries()) {
              if (admin.crawler.report.stop()) break;
              document.title =
                `\u041e\u0442\u0447\u0451\u0442: ${page}/${limit} \u00b7 ${index + 1}/${rows.length}`;
              const detail = await admin.crawler.tags.load(row.edit);
              records.push(admin.crawler.report.detail(row, detail));
            }
            url = admin.crawler.tags.next(doc);
          }
          return records;
        },
        async run() {
          if (admin.crawler.report.state.running) return false;
          const limit = admin.crawler.report.limit();
          if (!limit) return false;
          admin.crawler.report.state.running = true;
          window.reportStop = false;
          const title = document.title;
          try {
            const records = await admin.crawler.report.collect(location.href, limit);
            admin.crawler.report.download(records);
            alert(`\u0413\u043e\u0442\u043e\u0432\u043e: ${records.length}`);
            return true;
          } catch (error) {
            alert(error.message || "\u041e\u0448\u0438\u0431\u043a\u0430 \u043e\u0442\u0447\u0451\u0442\u0430");
            return false;
          } finally {
            document.title = title;
            admin.crawler.report.state.running = false;
          }
        },
      },
    },

    tags: {
      suggest: {
        ids: {
          panel: "tags-suggest-panel",
        },
        state: {
          theme: "",
          observer: null,
          suggestions: [],
        },
        themeValue() {
          return admin.tags.suggest.state.theme || admin.diff.theme();
        },
        snapshot() {
          const element = document.getElementById(admin.tags.suggest.ids.panel);
          if (!element) return null;
          const rect = element.getBoundingClientRect();
          return {
            left: rect.left,
            top: rect.top,
            width: rect.width,
          };
        },
        restore(element, snapshot) {
          if (!element || !snapshot) return;
          element.style.position = "fixed";
          element.style.left = `${Math.round(snapshot.left)}px`;
          element.style.top = `${Math.round(snapshot.top)}px`;
          element.style.right = "auto";
          element.style.bottom = "auto";
          element.style.width = `${Math.ceil(snapshot.width)}px`;
          element.style.minWidth = `${Math.ceil(snapshot.width)}px`;
        },
        size(element) {
          if (!element) return;
          element.style.width = "340px";
          element.style.minWidth = "340px";
        },
        stop: new Set([
          "был", "была", "были", "было", "будет", "будут", "весь", "всех",
          "где", "для", "его", "еще", "или", "как", "над", "нас", "она",
          "они", "под", "при", "про", "так", "там", "тут", "уже", "что",
          "это", "этот", "этого", "этом", "этой", "этим", "свой", "свои",
          "после", "перед", "очень", "можно", "нужно", "только", "когда",
          "который", "которая", "которые", "которых", "беларуси", "минске",
          "onliner", "фото", "номер", "strong", "em", "nbsp", "https", "http",
        ]),
        decode(value) {
          const textarea = document.createElement("textarea");
          textarea.innerHTML = String(value || "");
          return textarea.value;
        },
        plain(value) {
          return admin.tags.suggest.decode(value)
            .replace(/\[onliner-[\s\S]*?\[\/onliner-[^\]]+\]/g, " ")
            .replace(/\[[^\]]+\]/g, " ")
            .replace(/<[^>]+>/g, " ")
            .replace(/[\u00a0\t\r\n]+/g, " ")
            .replace(/ё/g, "е")
            .toLocaleLowerCase("ru-RU");
        },
        words(value) {
          return admin.tags.suggest.plain(value)
            .match(/[a-zа-яеіў]{4,32}/giu) || [];
        },
        clean(value) {
          const word = String(value || "").toLocaleLowerCase("ru-RU");
          if (admin.tags.suggest.stop.has(word)) return "";
          if (/^\d+$/.test(word)) return "";
          return word;
        },
        stem(value) {
          const word = admin.tags.suggest.clean(value);
          if (word.length < 6) return word;
          const endings = [
            "иями", "ями", "ами", "ого", "ему", "ыми", "ими", "ая", "яя",
            "ое", "ее", "ые", "ие", "ой", "ей", "ом", "ем", "ам", "ям",
            "ах", "ях", "ов", "ев", "ия", "ий", "ый", "ого", "его", "а",
            "я", "ы", "и", "е", "у", "ю", "ом", "ем",
          ];
          const ending = endings.find((item) => word.endsWith(item));
          if (!ending || word.length - ending.length < 4) return word;
          return word.slice(0, -ending.length);
        },
        unique(values) {
          const seen = new Set();
          return values.filter((value) => {
            const current = String(value || "").replace(/\s+/g, " ").trim();
            const key = tag.normalizeName(current);
            if (!key || seen.has(key)) return false;
            seen.add(key);
            return true;
          });
        },
        phrases(words) {
          return words
            .slice(0, 8)
            .flatMap((word, index, list) => {
              const next = list[index + 1] || "";
              return next ? [`${word} ${next}`] : [];
            });
        },
        frequent(words) {
          const scores = words.reduce((result, word) => {
            const current = admin.tags.suggest.stem(word);
            if (!current) return result;
            result[current] = (result[current] || 0) + 1;
            return result;
          }, {});
          return Object.entries(scores)
            .sort((left, right) => right[1] - left[1])
            .map(([word]) => word);
        },
        candidates() {
          const title = admin.text("#title");
          const content = admin.text("#content");
          const titleWords = admin.tags.suggest.words(title)
            .map(admin.tags.suggest.clean)
            .filter(Boolean);
          const contentWords = admin.tags.suggest.words(content);
          return admin.tags.suggest.unique([
            ...admin.tags.suggest.phrases(titleWords),
            ...titleWords.map(admin.tags.suggest.stem).filter(Boolean),
            ...admin.tags.suggest.frequent(contentWords),
          ]).slice(0, 30);
        },
        selected() {
          return new Set(tag.selected().map((name) => tag.normalizeName(name)));
        },
        selectedName(name) {
          return admin.tags.suggest.selected().has(tag.normalizeName(name));
        },
        textSource() {
          const title = admin.text("#title");
          const content = admin.text("#content");
          const plain = admin.tags.suggest.plain(content);
          return {
            title: admin.tags.suggest.plain(title),
            lead: plain.slice(0, 900),
            content: plain,
          };
        },
        score(name, source = admin.tags.suggest.textSource()) {
          const value = tag.normalizeName(name);
          if (!value) return 0;
          const words = value.split(/\s+/).filter(Boolean);
          let score = 0;
          if (source.title.includes(value)) score += 12;
          if (source.lead.includes(value)) score += 8;
          if (source.content.includes(value)) score += 5;
          words.forEach((word) => {
            const stem = admin.tags.suggest.stem(word);
            if (!stem || stem.length < 4) return;
            if (source.title.includes(stem)) score += 4;
            const count = source.content.split(stem).length - 1;
            score += Math.min(6, Math.max(0, count));
          });
          if (words.length === 1 && value.length < 6) score -= 3;
          return score;
        },
        async lookup(candidates, update = () => {}) {
          const found = [];
          const names = new Set();
          for (const [index, candidate] of candidates.entries()) {
            update(index + 1, candidates.length, candidate);
            let result = null;
            try {
              result = await tag.find(candidate);
            } catch {}
            const name = result?.name || "";
            const key = tag.normalizeName(name);
            if (!tag.suggestable(name) || names.has(key)) continue;
            names.add(key);
            found.push(name);
          }
          const source = admin.tags.suggest.textSource();
          return found
            .map((name, index) => ({
              name,
              index,
              score: admin.tags.suggest.score(name, source),
            }))
            .sort((left, right) => right.score - left.score || left.index - right.index)
            .map((item) => item.name)
            .slice(0, 5);
        },
        buttonState(name) {
          const added = admin.tags.suggest.selectedName(name);
          return {
            added,
            fluent: added ? "Checkmark Square" : "Add Square",
            title: added ? "Метка добавлена" : "Добавить метку",
          };
        },
        addButton(name) {
          const state = admin.tags.suggest.buttonState(name);
          return ui.controls.button({
            fluent: state.fluent,
            fallback: state.added ? "Checkmark" : "Add",
            action: "tags.suggest.add",
            title: state.title,
            attrs: ` type="button" data-tag-suggest="${encodeURIComponent(name)}" data-tags-suggest-added="${state.added ? "true" : "false"}"${state.added ? " disabled" : ""}`,
          });
        },
        syncButton(button) {
          const name = decodeURIComponent(button?.dataset?.tagSuggest || "");
          if (!name) return;
          const state = admin.tags.suggest.buttonState(name);
          button.disabled = state.added;
          button.dataset.tagsSuggestAdded = state.added ? "true" : "false";
          button.title = state.title;
          button.innerHTML = ui.controls.icon(
            ui.controls.glyph(state.fluent, 18, state.added ? "Checkmark" : "Add"),
          );
        },
        syncButtons() {
          document
            .getElementById(admin.tags.suggest.ids.panel)
            ?.querySelectorAll('[data-action="tags.suggest.add"]')
            .forEach(admin.tags.suggest.syncButton);
        },
        observeSelected() {
          if (admin.tags.suggest.state.observer) return;
          const root = document.querySelector("#post_tag");
          if (!root || typeof MutationObserver !== "function") return;
          const observer = new MutationObserver(() => admin.tags.suggest.syncButtons());
          observer.observe(root, {
            childList: true,
            subtree: true,
            attributes: true,
            characterData: true,
          });
          admin.tags.suggest.state.observer = observer;
        },
        item(name) {
          const button = admin.tags.suggest.addButton(name);
          return ui.shell.group(
            ui.shell.frame({
              classes: "ui-row",
              attrs: ' data-tags-suggest-row="true"',
              left: ui.controls.message({ rawIcon: ui.controls.glyph("Tag", 18) }),
              main: admin.diff.escape(name),
              right: button,
            }),
            { rail: true, stretch: true },
          );
        },
        body(value) {
          return ui.shell.group(
            ui.controls.message({
              text: admin.diff.escape(value),
            }),
            { rail: true, stretch: true },
          );
        },
        status({ text = "", current = 0, total = 0 } = {}) {
          const counter = total
            ? ui.controls.counter({ current, limit: total })
            : "";
          return ui.shell.frame({
            attrs: ' data-tags-suggest-status="true"',
            left: ui.controls.message({ text: admin.diff.escape(text) }),
            right: counter,
          });
        },
        list(suggestions) {
          return ui.shell.stack(suggestions.map(admin.tags.suggest.item).join(""));
        },
        marker() {
          return ui.controls.marker({
            button: {
              glyph: "🏷️",
              action: "tags.suggest.marker",
              attrs: ' type="button" tabindex="-1" aria-label="Метки"',
            },
          });
        },
        panel({
          title = "",
          body = "",
          suggestions = [],
          current = 0,
          total = 0,
        } = {}) {
          const snapshot = admin.tags.suggest.snapshot();
          const theme = admin.tags.suggest.themeValue();
          const head = ui.shell.frame({
            classes: "ui-head",
            attrs: ' data-panel-drag-handle="true" data-tags-suggest-head="true"',
            left: admin.tags.suggest.marker(),
            right: ui.controls.panelActions({
              theme,
              themeAction: "tags.suggest.theme",
              closeAction: "tags.suggest.close",
            }),
          });
          if (suggestions.length) admin.tags.suggest.state.suggestions = suggestions;
          const content = suggestions.length
            ? admin.tags.suggest.list(suggestions)
            : admin.tags.suggest.status({ text: body, current, total });
          let element = document.getElementById(admin.tags.suggest.ids.panel);
          if (element) {
            element.innerHTML = ui.shell.stack(`${head}${content}`);
          } else {
            element = panel.create({
              id: admin.tags.suggest.ids.panel,
              html: ui.shell.stack(`${head}${content}`),
              place: "right",
              draggable: true,
            });
            element.addEventListener("click", admin.tags.suggest.click);
          }
          element.dataset.uiSurface = "toolbar";
          element.dataset.uiFrame = "capsule";
          element.dataset.toolbarFlow = "stack";
          admin.tags.suggest.size(element);
          ui.surface.sync(element, { theme, surface: "toolbar" });
          admin.tags.suggest.restore(element, snapshot);
          panel.drag.bind(element);
          admin.tags.suggest.observeSelected();
          admin.tags.suggest.syncButtons();
          ui.controls.panelActionsSync(element, {
            theme,
            themeAction: "tags.suggest.theme",
          });
          return element;
        },
        theme() {
          const element = document.getElementById(admin.tags.suggest.ids.panel);
          if (!element) return;
          const next = element.dataset.theme === "dark" ? "light" : "dark";
          admin.tags.suggest.state.theme = next;
          ui.surface.sync(element, { theme: next, surface: "toolbar" });
          ui.controls.panelActionsSync(element, {
            theme: next,
            themeAction: "tags.suggest.theme",
          });
        },
        click(event) {
          const button = event.target.closest("[data-action]");
          const action = button?.dataset?.action || "";
          if (action === "tags.suggest.close") {
            document.getElementById(admin.tags.suggest.ids.panel)?.remove();
            admin.tags.suggest.state.observer?.disconnect?.();
            admin.tags.suggest.state.observer = null;
            return;
          }
          if (action === "tags.suggest.theme") {
            admin.tags.suggest.theme();
            return;
          }
          if (action !== "tags.suggest.add") return;
          const name = decodeURIComponent(button.dataset.tagSuggest || "");
          if (!name || admin.tags.suggest.selectedName(name) || !tag.add(name)) return;
          admin.tags.suggest.syncButtons();
          setTimeout(admin.tags.suggest.syncButtons, 120);
        },
        async run() {
          admin.tags.suggest.panel({ body: "Ищем" });
          if (!tag.input() || !document.querySelector("#new-tag-post_tag")) {
            admin.tags.suggest.panel({ body: "Поле меток не найдено" });
            return false;
          }
          try {
            const candidates = admin.tags.suggest.candidates();
            if (!candidates.length) {
              admin.tags.suggest.panel({ body: "Кандидаты не найдены" });
              return true;
            }
            const update = (current, total, candidate) => {
              admin.tags.suggest.panel({
                body: "Ищем",
                current,
                total,
              });
            };
            const suggestions = await admin.tags.suggest.lookup(candidates, update);
            admin.tags.suggest.panel({
              body: "Не найдено",
              suggestions,
            });
            return true;
          } catch (error) {
            admin.tags.suggest.panel({ body: error.message || "Ошибка поиска меток" });
            return false;
          }
        },
      },
      async run() {
        const input = tag.input();
        const current = tag.get();
        const targets = tag.invalid();
        if (!targets.length) {
          alert("✔️ Метки норм");
          return true;
        }
        const planned = targets
          .map((name) => `${name} → ${tag.upper(name)}`)
          .join("\n");
        if (!confirm(`Поменять метки?\n\n${planned}`)) return true;
        try {
          await cms.vpn.ensure("⚠️ VPN");
          const results = [];
          for (const name of targets) {
            results.push(await tag.rename(name));
          }
          tag.apply(input, current, results);
          const report = tag.report(results);
          if (!report.ok.length) {
            alert(report.message);
            return true;
          }
          if (confirm(`${report.message}\n\nОткрыть обновлённые метки?`)) {
            report.ok.forEach((result) => {
              window.open(tag.page(result.next), "_blank");
            });
          }
          setTimeout(() => location.reload(), 300);
          return true;
        } catch (error) {
          alert(error.message);
          return false;
        }
      },
    },
    edit: {
      state: new WeakMap(),
      limit: 80,
      history(input = null) {
        if (!input) return null;
        const current = String(input.value || "");
        if (!admin.edit.state.has(input)) {
          admin.edit.state.set(input, { undo: [], redo: [], value: current });
        }
        return admin.edit.state.get(input);
      },
      track(input = null) {
        const history = admin.edit.history(input);
        if (!history) return false;
        const value = String(input.value || "");
        if (history.value === value) return false;
        history.undo.push(history.value);
        if (history.undo.length > admin.edit.limit) history.undo.shift();
        history.redo = [];
        history.value = value;
        return true;
      },
      select(input = null, position = 0) {
        if (!input?.setSelectionRange) return false;
        const next = Math.max(0, Math.min(String(input.value || "").length, position));
        input.setSelectionRange(next, next);
        return true;
      },
      range(input = null) {
        if (!input) return null;
        const start = input.selectionStart;
        const end = input.selectionEnd;
        if (!Number.isInteger(start) || !Number.isInteger(end)) return null;
        const value = String(input.value || "");
        return {
          value,
          start: Math.max(0, Math.min(value.length, start)),
          end: Math.max(0, Math.min(value.length, end)),
        };
      },
      replace(input = null, replacement = "", selectStart = null, selectEnd = null) {
        const range = admin.edit.range(input);
        if (!range) return false;
        const next = `${range.value.slice(0, range.start)}${replacement}${range.value.slice(range.end)}`;
        input.value = next;
        const start = Number.isInteger(selectStart)
          ? range.start + selectStart
          : range.start + String(replacement).length;
        const end = Number.isInteger(selectEnd) ? range.start + selectEnd : start;
        input.setSelectionRange?.(
          Math.max(0, Math.min(next.length, start)),
          Math.max(0, Math.min(next.length, end)),
        );
        admin.edit.track(input);
        return true;
      },
      toggleNbsp(input = null) {
        const range = admin.edit.range(input);
        if (!range) return false;
        const selected = range.value.slice(range.start, range.end);
        if (selected) {
          const hasPlain = /[ \t]/.test(selected);
          const replacement = hasPlain
            ? selected.replace(/[ \t\u00a0]+/g, "\u00a0")
            : selected.replace(/\u00a0/g, " ");
          return admin.edit.replace(input, replacement);
        }
        const before = range.value.charAt(range.start - 1);
        const after = range.value.charAt(range.start);
        const toggle = (char) => (char === "\u00a0" ? " " : "\u00a0");
        if (before === " " || before === "\u00a0") {
          input.value = `${range.value.slice(0, range.start - 1)}${toggle(before)}${range.value.slice(range.start)}`;
          input.setSelectionRange?.(range.start, range.start);
          admin.edit.track(input);
          return true;
        }
        if (after === " " || after === "\u00a0") {
          input.value = `${range.value.slice(0, range.start)}${toggle(after)}${range.value.slice(range.start + 1)}`;
          input.setSelectionRange?.(range.start, range.start);
          admin.edit.track(input);
          return true;
        }
        return admin.edit.replace(input, "\u00a0");
      },
      restore(input = null, direction = "undo") {
        const history = admin.edit.history(input);
        if (!history) return false;
        const source = direction === "redo" ? history.redo : history.undo;
        const target = direction === "redo" ? history.undo : history.redo;
        if (!source.length) return false;
        const current = String(input.value || "");
        const value = source.pop();
        target.push(current);
        history.value = String(value || "");
        input.value = history.value;
        admin.edit.select(input, history.value.length);
        return true;
      },
      cutBefore(input = null) {
        const history = admin.edit.history(input);
        if (!input || !history) return false;
        const value = String(input.value || "");
        const start = input.selectionStart;
        const end = input.selectionEnd;
        if (!Number.isInteger(start) || !Number.isInteger(end)) return false;
        const line = value.lastIndexOf("\n", Math.max(0, start - 1)) + 1;
        const next = `${value.slice(0, line)}${value.slice(end)}`;
        if (next === value) return false;
        input.value = next;
        admin.edit.select(input, line);
        admin.edit.track(input);
        return true;
      },
      apple() {
        return (
          /Mac|iPhone|iPad|iPod/.test(navigator.platform) ||
          (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
        );
      },
      launcherMod(event) {
        if (admin.edit.apple()) {
          return event.altKey && event.ctrlKey && !event.metaKey;
        }
        return event.altKey && !event.ctrlKey && !event.metaKey;
      },
      launcherCommand(event) {
        if (!admin.edit.launcherMod(event)) return "";
        const code = String(event.code || "");
        const map = {
          ArrowDown: "nbsp",
          Quote: "quote",
          Minus: "dash",
          NumpadMinus: "dash",
          KeyC: "comma",
          KeyU: "clear-before",
          Backslash: "capital",
        };
        return map[code] || "";
      },
      applyCommand(input = null, command = "") {
        const range = admin.edit.range(input);
        if (!range) return false;
        const selected = range.value.slice(range.start, range.end);
        if (command === "quote") {
          if (selected) return admin.edit.replace(input, `«${selected}»`);
          return admin.edit.replace(input, "«»", 1, 1);
        }
        if (command === "dash") return admin.edit.replace(input, " — ");
        if (command === "nbsp") return admin.edit.toggleNbsp(input);
        if (command === "comma") return admin.edit.replace(input, ", ");
        if (command === "clear-before") return admin.edit.cutBefore(input);
        if (command === "capital") {
          if (!selected) return false;
          return admin.edit.replace(input, selected.charAt(0).toUpperCase() + selected.slice(1));
        }
        return false;
      },
      handled(event, sync = null) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation?.();
        sync?.();
        return true;
      },
      shortcut(event, input = null, sync = null) {
        const key = String(event.key || "").toLowerCase();
        const modified = event.metaKey || event.ctrlKey;
        const restore = (direction) => {
          if (!admin.edit.restore(input, direction)) return false;
          return admin.edit.handled(event, sync);
        };
        if (modified && key === "z") return restore(event.shiftKey ? "redo" : "undo");
        if (modified && key === "y") return restore("redo");
        if (event.ctrlKey && !event.metaKey && !event.altKey && !event.shiftKey && key === "u") {
          if (!admin.edit.cutBefore(input)) return false;
          return admin.edit.handled(event, sync);
        }
        const command = admin.edit.launcherCommand(event);
        if (command && admin.edit.applyCommand(input, command)) {
          return admin.edit.handled(event, sync);
        }
        return false;
      },
      capture(input = null, sync = null) {
        const history = admin.edit.history(input);
        if (!input || !history || history.capture) return false;
        history.capture = (event) => {
          if (event.target !== input) return;
          admin.edit.shortcut(event, input, sync);
        };
        window.addEventListener("keydown", history.capture, true);
        return true;
      },
      release(input = null) {
        const history = admin.edit.history(input);
        if (!history?.capture) return false;
        window.removeEventListener("keydown", history.capture, true);
        history.capture = null;
        return true;
      },
    },
    title: {
      typography(value, { trimEnd = false, uppercaseFirst = false } = {}) {
        return sanitizer.field.typography(value, {
          trimEnd,
          uppercaseFirst,
        });
      },
      normalize(value) {
        return sanitizer.field.normalize(value);
      },
      selector() {
        return [
          "#title",
          "input[name='rotation_titles[]']",
          "#favourite_title",
          "input[name='favourite_title']",
          "#seo_title",
          "#yoast_wpseo_title",
          "input[name='seo_title']",
          "input[name='yoast_wpseo_title']",
        ].join(",");
      },
      apply(element = null) {
        if (!element || !("value" in element)) return false;
        const value = String(element.value || "");
        const normalized = admin.title.normalize(value);
        if (value === normalized) return false;
        field.input(element, normalized);
        admin.fieldState.paint(element, "positive");
        return true;
      },
      defaults: {
        key: "__adminTitleDefaultsBound",
        bind() {
          if (window[admin.title.defaults.key]) return false;
          window[admin.title.defaults.key] = true;
          document.addEventListener("blur", (event) => {
            const element = event.target;
            if (!element?.matches?.(admin.title.selector())) return;
            admin.title.apply(element);
          }, true);
          return true;
        },
      },
      fields() {
        return [
          "#title",
          "input[name='rotation_titles[]']",
          "#favourite_title",
          "input[name='seo_title']",
        ].flatMap((selector) => field.elements(selector));
      },
      key(item, index) {
        return `${item.id || item.name || "field"}::${index}`;
      },
      record(item, index) {
        const records = admin.sanitize.state().records;
        const id = admin.title.key(item, index);
        const record = (records[id] ??= {
          original: item.value,
          sanitized: admin.title.normalize(item.value),
          background: item.style.backgroundColor || "",
        });
        record.field = item;
        record.changed = record.original !== record.sanitized;
        return record;
      },
      records() {
        return admin.title.fields().map(admin.title.record);
      },
      snapshot(active) {
        admin.title.records().forEach((record) => {
          const value = record.field.value;
          if (active && value === record.sanitized) return;
          record.original = value;
          record.sanitized = admin.title.normalize(value);
          record.changed = record.original !== record.sanitized;
        });
      },
      paint(record) {
        const item = record.field;
        if (!record.changed) {
          admin.fieldState.restore(item);
          return;
        }
        admin.fieldState.paint(item, admin.sanitize.state().active ? "positive" : "negative");
      },
      sync() {
        admin.title.records().forEach((record) => {
          const value = admin.sanitize.state().active
            ? record.sanitized
            : record.original;
          if (record.field.value !== value) {
            record.field.value = value;
            admin.emit(record.field);
          }
          admin.title.paint(record);
        });
      },
    },
    footer: {
      telegram: {
        remove(value) {
          return value.replace(
            /<p\b[^>]*>\s*(?:<strong>)?\s*Есть о чем рассказать\?[\s\S]*?newsonliner_bot[\s\S]*?(?:<\/strong>)?\s*<\/p>/gi,
            "",
          );
        },
        add() {
          return '<p style="text-align: right;"><strong>Есть о чем рассказать? Пишите в наш <a href="https://t.me/newsonliner_bot" target="_blank">телеграм-бот</a>. Это анонимно и быстро</strong></p>';
        },
      },
      copyright: {
        remove(value) {
          return value.replace(
            /<p\b[^>]*>\s*(?:<span\b[^>]*>)?\s*(?:<strong>)?\s*Перепечатка текста и фотографий[\s\S]*?mailto:[a-z0-9._%+-]+@onliner\.by[\s\S]*?<\/p>/gi,
            "",
          );
        },
        add() {
          const email = cms.chief.email();
          return `<p style="text-align: right;"><span style="font-size: small;"><strong>Перепечатка текста и фотографий Onlíner без разрешения редакции запрещена. <a href="mailto:${email}">${email}</a></strong></span></p>`;
        },
      },
      layoutValue() {
        const element = cms.layout.element();
        if (!element) return "";
        return [
          cms.layout.value(element),
          element.options?.[element.selectedIndex]?.text || "",
        ].join("\n");
      },
      copyrighted() {
        const value = admin.footer.layoutValue();
        return (
          cms.layout.longread(value) ||
          /photo[-_\s]?report|photoreport|фоторепортаж/iu.test(value)
        );
      },
      apply(value) {
        const clean = [
          admin.footer.telegram.remove,
          admin.footer.copyright.remove,
        ].reduce((string, fn) => fn(string), value);
        const next = `${clean.trimEnd()}\n${admin.footer.telegram.add()}`;
        return admin.footer.copyrighted()
          ? `${next}\n${admin.footer.copyright.add()}`
          : next;
      },
    },
    sanitize: {
      key: "__sanitizeState",
      state() {
        return (window[admin.sanitize.key] ??= {
          active: false,
          records: {},
        });
      },
      run() {
        const state = admin.sanitize.state();
        admin.title.snapshot(state.active);
        state.active = !state.active;
        admin.title.sync();
        admin.title.snapshot(state.active);
        cms.editor.runHtmlBridge((value) => admin.footer.apply(value));
        window.scrollTo({ top: 0, behavior: "smooth" });
        [0, 50, 150].forEach((delay) =>
          setTimeout(() => {
            admin.title.snapshot(state.active);
            admin.title.sync();
          }, delay),
        );
        return true;
      },
    },
    whoami: {
      text(value) {
        return String(value || "").trim();
      },
      lower(value) {
        return admin.whoami.text(value).toLowerCase().replace(/^@/, "");
      },
      meta(name) {
        return document.querySelector(`meta[name="${name}"]`)?.content || "";
      },
      username() {
        return admin.whoami.lower(
          document.querySelector("#wp-admin-bar-user-info .username")
            ?.textContent ||
            admin.whoami.meta("user:login") ||
            admin.whoami.meta("user:username") ||
            "",
        );
      },
      displayName() {
        return admin.whoami.text(
          document.querySelector("#wp-admin-bar-user-info .display-name")
            ?.textContent ||
            document.querySelector("#wp-admin-bar-my-account .display-name")
              ?.textContent ||
            window.userSettings?.displayName ||
            admin.whoami.meta("user:display-name") ||
            admin.whoami.meta("user:display_name") ||
            "",
        );
      },
      userId() {
        const html = document.documentElement?.innerHTML || "";
        return admin.whoami.text(
          document.querySelector("#user_ID")?.value ||
            window.userSettings?.uid ||
            document.body?.className?.match(/\buser-id-(\d+)\b/)?.[1] ||
            html.match(/"uid"\s*:\s*"?(\d+)"?/i)?.[1] ||
            html.match(/"user_id"\s*:\s*"?(\d+)"?/i)?.[1] ||
            html.match(/user_id["']?\s*[:=]\s*["']?(\d+)/i)?.[1] ||
            "",
        );
      },
      read() {
        return {
          user_ID: admin.whoami.userId(),
          username: admin.whoami.username(),
          "display-name": admin.whoami.displayName(),
        };
      },
      format(value) {
        return JSON.stringify(value, null, 2);
      },
      async copy(value, options = {}) {
        const text = admin.whoami.format(value);
        try {
          await navigator.clipboard.writeText(text);
          if (!options.silent) alert(`Скопировано:\n\n${text}`);
        } catch {
          if (!options.silent) prompt("Whoami", text);
        }
        return true;
      },
      run(options = {}) {
        admin.whoami.copy(admin.whoami.read(), options);
        return true;
      },
    },
    plan: {
      url: "https://disk.yandex.ru/edit/d/XK4EauZVJqcws15FpXE4oSPegnqahzm72s0qoIz-cKg6VGNKZjliTXBFZw",
      run() {
        window.open(admin.plan.url, "_blank", "noopener");
        return true;
      },
    },
    prepare: {
      run() {
        const hour = admin.evergreen() ? 7 : 8;
        const sticky = hour === 7 ? "left" : "right";
        admin.visibility({ access: "public", sticky });
        admin.time(hour);
        admin.tag("Onliner");
        admin.layout();
        admin.thumbnail();
        admin.focus();
        return true;
      },
    },
    clean: {
      fields: {
        selectors: [
          "#title",
          "input[name='rotation_titles[]']",
          "#favourite_title",
          "input[name='seo_title']",
          "#post_source",
          "#photo_author",
          "#video_author",
          "#excerpt",
        ],
        apply(element, transform) {
          if (!element || typeof transform !== "function") return false;
          const before = element.value;
          const after = transform(before);
          if (before === after) return false;
          field.input(element, after);
          return true;
        },
        run(transform) {
          return admin.clean.fields.selectors
            .flatMap((selector) => field.elements(selector))
            .map((element) => admin.clean.fields.apply(element, transform))
            .some(Boolean);
        },
      },
      credits: {
        name: /[A-ZА-ЯЁ][A-Za-zА-Яа-яЁё-]+(?:\s+[A-ZА-ЯЁ][A-Za-zА-Яа-яЁё-]+){1,2}/,
        markers: {
          art: /^(.*?)(?:\s*,\s*|\s+)(иллюстрац(?:ия|ии)|коллаж|обложка)\s*[:—-]?\s*(.+)$/i,
          photo: /^(.*?)(?:\s*,\s*|\s+)(фото)\s*[:—-]?\s*(.+)$/i,
        },
        clean(value) {
          return String(value || "")
            .trim()
            .replace(/\s+/g, " ")
            .replace(/[.,;:\s]+$/g, "");
        },
        role(label, value) {
          const map = {
            коллаж: "Коллаж",
            иллюстрация: "Иллюстрация",
            иллюстрации: "Иллюстрации",
          };
          const head = map[label.toLowerCase()] || label;
          const tail = admin.clean.credits.clean(value);
          return tail ? `${head}: ${tail}` : "";
        },
        splitExplicit(source) {
          const string = admin.clean.credits.clean(source);
          if (!string) return null;
          const photo = string.match(admin.clean.credits.markers.photo);
          if (photo) {
            const next = {
              source: admin.clean.credits.clean(photo[1]),
              photo: admin.clean.credits.clean(photo[3]),
            };
            return next.source && next.photo ? next : null;
          }
          const art = string.match(admin.clean.credits.markers.art);
          if (art) {
            const next = {
              source: admin.clean.credits.clean(art[1]),
              photo: admin.clean.credits.role(art[2], art[3]),
            };
            return next.source && next.photo ? next : null;
          }
          return null;
        },
        splitImplicit(source) {
          const string = admin.clean.credits.clean(source);
          if (!string) return null;
          const match = string.match(
            new RegExp(`^(${admin.clean.credits.name.source})([.,;:]\\s*.+)$`),
          );
          if (!match) return null;
          const next = {
            source: admin.clean.credits.clean(match[1]),
            photo: admin.clean.credits.clean(
              match[2].replace(/^[.,;:]\s*/, ""),
            ),
          };
          return next.source && next.photo ? next : null;
        },
        split(source) {
          return admin.clean.credits.splitExplicit(source) ||
            admin.clean.credits.splitImplicit(source);
        },
        merge(current, next) {
          const left = admin.clean.credits.clean(current);
          const right = admin.clean.credits.clean(next);
          if (!left) return right;
          if (!right || left === right) return left;
          return `${right}. ${left}`;
        },
        normalize(source, photo, video = "") {
          const current = {
            source: admin.clean.credits.clean(source),
            photo: admin.clean.credits.clean(photo),
            video: admin.clean.credits.clean(video),
          };
          const split = admin.clean.credits.split(current.source);
          if (!split) {
            return {
              ...current,
              changed:
                current.source !== String(source || "").trim() ||
                current.photo !== String(photo || "").trim() ||
                current.video !== String(video || "").trim(),
            };
          }
          const next = {
            source: split.source,
            photo: admin.clean.credits.merge(current.photo, split.photo),
            video: current.video,
          };
          return {
            ...next,
            changed:
              next.source !== String(source || "").trim() ||
              next.photo !== String(photo || "").trim() ||
              next.video !== String(video || "").trim(),
          };
        },
        run() {
          const source = field.element("#post_source");
          const photo = field.element("#photo_author");
          const video = field.element("#video_author");
          if (!source || !photo) return false;
          const next = admin.clean.credits.normalize(
            source.value,
            photo.value,
            video?.value || "",
          );
          if (!next.changed) return false;
          field.input(source, next.source);
          field.input(photo, next.photo);
          if (video) field.input(video, next.video);
          return true;
        },
      },
      submit: {
        lock: false,
        pass: "cleanupSubmitPass",
        mark: "cleanupSubmitGuard",
        encode() {
          const mode = widget.mode.create();
          cms.editor.runContent((value) => mode.encoded(value));
        },
        async vpn() {
          await cms.vpn.ensure("🛑 VPN");
        },
        allowed(button) {
          return button.dataset[admin.clean.submit.pass] === "1";
        },
        open(button) {
          button.dataset[admin.clean.submit.pass] = "1";
          button.click();
          delete button.dataset[admin.clean.submit.pass];
        },
        async guard(event, button) {
          if (admin.clean.submit.allowed(button)) return;
          event.preventDefault();
          event.stopImmediatePropagation();
          if (admin.clean.submit.lock) return;
          admin.clean.submit.lock = true;
          admin.clean.submit.encode();
          try {
            await admin.clean.submit.vpn();
            admin.clean.submit.lock = false;
            admin.clean.submit.open(button);
            return;
          } catch (error) {
            field.alert(error.message);
          }
          admin.clean.submit.lock = false;
        },
        bind(selector) {
          const button = field.element(selector);
          if (!button || button.dataset[admin.clean.submit.mark] === "1") {
            return;
          }
          button.dataset[admin.clean.submit.mark] = "1";
          button.addEventListener(
            "click",
            (event) => admin.clean.submit.guard(event, button),
            true,
          );
        },
        run() {
          admin.clean.submit.bind("#save-post");
          admin.clean.submit.bind("#publish");
          return true;
        },
      },
      editor: {
        mark: "cleanupTmceGuard",
        encode() {
          const mode = widget.mode.create();
          cms.editor.runContent((value) => mode.encoded(value));
        },
        bind() {
          const button = document.querySelector("#content-tmce");
          if (!button || button.dataset[admin.clean.editor.mark] === "1") {
            return false;
          }
          button.dataset[admin.clean.editor.mark] = "1";
          button.addEventListener("mousedown", admin.clean.editor.encode, true);
          button.addEventListener("click", admin.clean.editor.encode, true);
          return true;
        },
      },
      tool() {
        cms.admin.lazyTool({
          id: "reader-button",
          icon: icon.emoji("🕶️", "reader"),
          html: true,
          from: "launchpad.js",
          to: "reader.js",
          exists: ["onliner-reader-button"],
        });
        return true;
      },
      contentField(value) {
        return text.nbsp(text.finalize(contentPipe(value)));
      },
      run() {
        const editorMode = cms.editor.getMode();
        admin.clean.fields.run(text.run);
        cms.editor.runHtmlBridge((value) => admin.clean.contentField(value), {
          mode: editorMode,
        });
        admin.clean.credits.run();
        admin.clean.tool();
        admin.clean.editor.bind();
        admin.clean.submit.run();
        return true;
      },
    },
  };
  admin.title.defaults.bind();
  return {
    admin: {
      diff: admin.diff,
      dump: admin.dump,
      crawler: admin.crawler,
      tags: admin.tags,
      sanitize: admin.sanitize,
      prepare: admin.prepare,
      refresh: admin.refresh,
      whoami: admin.whoami,
      plan: admin.plan,
      submit,
      fields: admin.fields,
      titles: admin.titles,
      slug: admin.slug,
      excerpt: admin.excerpt,
      clean: admin.clean,
    },
  };
};
