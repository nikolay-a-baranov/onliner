import { host } from "../core/surface/host.js";
import { styles as css } from "../core/surface/styles.js";
import { toolbar } from "../core/surface/toolbar.js";
import { icon } from "../core/surface/icon.js";
import { ui } from "../core/surface/ui.js";
import { cms } from "../core/cms.js";
import { field } from "../core/dom.js";
import { widget } from "../core/widget.js";
import { sanitizer } from "../core/sanitizer.js";
import { content as contentPipe, finalize as contentFinalize } from "../pipe/content.js";
import { markup as contentMarkup } from "../pipe/markup.js";
import { text } from "../pipe/text.js";
import { attachCrawler } from "./tools/crawler.js";
import { attachPost } from "./admin/post.js";
import { attachRevision } from "./admin/revision.js";

export const createAdmin = (api = {}) => {
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
    field.emit(input);
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
  case: {
    candidate(value) {
      const name = String(value || "").replace(/\s+/g, " ").trim();
      const next = tag.upper(name);
      if (!name || next === name) return null;
      if (!tag.lower(name) || tag.ignored(name)) return null;
      return {
        old: name,
        next,
        key: tag.normalizeName(name),
      };
    },
    targets(root = document) {
      return tag.unique(tag.get(root))
        .map((name) => tag.case.candidate(name))
        .filter(Boolean);
    },
    label(item) {
      return `${item.old} → ${item.next}`;
    },
    lineKey(value) {
      const line = String(value || "").trim();
      return tag.normalizeName(line.split("→")[0]);
    },
    choose(targets = []) {
      if (!targets.length) return [];
      const planned = targets
        .map(tag.case.label)
        .join("\n");
      const value = prompt(
        "Нормализовать метки?\nУдалите строки, которые надо оставить как есть.",
        planned,
      );
      if (value === null) return [];
      const selected = new Set(
        String(value || "")
          .split("\n")
          .map(tag.case.lineKey)
          .filter(Boolean),
      );
      return targets.filter((item) => selected.has(item.key));
    },
  },
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
    return this.case.targets(root)
      .map((item) => item.old);
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
    field.input(input, name);
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
    field.input(input, next.join(", "));
    return true;
  },
  toggle(name, root = document) {
    return this.has(name, root) ? this.remove(name, root) : this.add(name, root);
  },
  async rename(name, next = this.upper(name)) {
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
        .filter((result) => result.status === "ok" && result.type !== "add")
        .map((result) => [result.old, result.next]),
    );
    const added = results
      .filter((result) => result.status === "ok" && result.type === "add")
      .map((result) => result.next);
    if (!input) return;
    const values = this.unique([
      ...current.map((name) => updated.get(name) || name),
      ...added,
    ]);
    field.input(input, values.join(", "));
  },
  report(results) {
    const ok = results.filter((result) => result.status === "ok");
    const renamed = ok.filter((result) => result.type !== "add");
    const added = ok.filter((result) => result.type === "add");
    const err = results.filter((result) => result.status === "error");
    let message = "";
    if (renamed.length) {
      message +=
        "✔️ Исправлено:\n" +
        renamed.map((result) => `${result.old} → ${result.next}`).join("\n");
    }
    if (added.length) {
      if (message) message += "\n\n";
      message +=
        "✔️ Добавлено:\n" +
        added.map((result) => result.next).join("\n");
    }
    if (err.length) {
      if (message) message += "\n\n";
      message +=
        "❌ Ошибки:\n" +
        err.map((result) => `${result.name} — ${result.error}`).join("\n");
    }
    return {
      ok,
      err,
      message: message || "Ок",
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
  pass: "launchpadSubmitPass",
  mark: "launchpadSubmitGuard",
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
      field.input(seoTitle, "");
    }
  },
  slug(state, action = "publish") {
    const long =
      !!state.slug && /…|&hellip;|&#8230;/i.test(state.slug.textContent || "");
    const opened = !!state.slugInput;
    const invalid = long || opened;
    const blocking = action === "publish" && invalid;
    if (blocking) this.issues.push("⚠️ Слаг");
    return { long, opened, invalid, blocking };
  },
  slugOpen(details) {
    if (!details?.long || details.opened) return false;
    const button = this.element("#edit-slug-buttons .edit-slug");
    if (!button) return false;
    button.click();
    details.opened = true;
    return true;
  },
  slugOverride(details) {
    if (!details?.invalid) return false;
    return field.confirm("Реально такая длинная ссылка будет??");
  },
  slugAllow(details) {
    if (!this.slugOverride(details)) return false;
    this.issues = this.issues.filter((issue) => issue !== "⚠️ Слаг");
    details.long = false;
    details.opened = false;
    details.invalid = false;
    details.blocking = false;
    return true;
  },
  excerpt(state) {
    excerpt.style(state.excerptField);
    const initial = excerpt.state(
      state.excerptField?.value || "",
      state.contentText,
    );
    if (initial.empty && state.excerptField && initial.lead) {
      field.input(state.excerptField, initial.lead);
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
  thumbnail(state, action = "publish") {
    const empty = !state.thumbnail;
    const blocking = action === "publish" && empty;
    if (blocking) {
      this.issues.push("⚠️ Миниатюра");
      this.mark(this.element("#postimagediv"));
    }
    return { empty, blocking };
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
          field.input(state.videoAuthor, "");
        }
      }, 0);
    }
    return { has };
  },
  toc(state) {
    const tool = api.content?.toc || null;
    const content = state?.content || null;
    const value = String(content?.value || "");
    if (!content || !value.trim() || !tool?.stale?.(value)) {
      return { stale: false, updated: false };
    }
    const next = typeof tool.compose === "function" ? tool.compose(value) : value;
    if (next && next !== value) {
      field.input(content, next);
      state.contentText = next;
      return { stale: true, updated: true };
    }
    return { stale: true, updated: false };
  },
  focus(details) {
    let attempts = 0;
    const focusIssues = setInterval(() => {
      const slugInput =
        this.element("#new-post-slug") ||
        this.element('#edit-slug-box input[type="text"]');
      if (details.slug.blocking && slugInput) {
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
      if (!details.slug.blocking || ++attempts > timer.focusAttempts) {
        clearInterval(focusIssues);
        const first = details.slug.blocking
          ? this.element("#edit-slug-box")
          : details.thumbnail.blocking
            ? this.element("#postimagediv")
            : details.excerpt.invalid
              ? details.state.excerptField
              : details.tags.invalid.length
                ? this.element("#tagsdiv-post_tag")
                : details.toc.stale && !details.toc.updated
                  ? details.state.content
                  : details.state.videoAuthor?.closest(".layout-field") ||
                    details.state.videoAuthor?.parentElement;
        first?.scrollIntoView({ block: "center", behavior: "smooth" });
        if (
          !details.slug.blocking &&
          details.excerpt.invalid &&
          details.state.excerptField
        ) {
          details.state.excerptField.focus();
          details.state.excerptField.select();
        }
        if (
          !details.slug.blocking &&
          !details.excerpt.invalid &&
          details.tags.invalid.length &&
          details.state.tagsInput
        ) {
          details.state.tagsInput.focus();
          details.state.tagsInput.select();
        }
        if (
          !details.slug.blocking &&
          !details.excerpt.invalid &&
          !details.tags.invalid.length &&
          details.toc.stale &&
          !details.toc.updated &&
          details.state.content
        ) {
          details.state.content.focus();
        }
        if (
          !details.slug.blocking &&
          !details.excerpt.invalid &&
          !details.tags.invalid.length &&
          !(details.toc.stale && !details.toc.updated) &&
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
    const button = this.element(action === "save" ? "#save-post" : "#publish");
    if (!button) return null;
    button.dataset.launchpadSubmitPass = "1";
    button.click();
    delete button.dataset.launchpadSubmitPass;
    return button;
  },
  allowed(button = null) {
    return button?.dataset?.launchpadSubmitPass === "1";
  },
  action(button = null) {
    return button?.id === "save-post" ? "save" : "publish";
  },
  guardClick(event, button = null) {
    if (this.allowed(button)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    this.run(this.action(button));
  },
  bindButton(selector) {
    const button = this.element(selector);
    if (!button || button.dataset.launchpadSubmitGuard === "1") return false;
    button.dataset.launchpadSubmitGuard = "1";
    button.addEventListener(
      "click",
      (event) => this.guardClick(event, button),
      true,
    );
    return true;
  },
  bind() {
    this.bindButton("#save-post");
    this.bindButton("#publish");
    return true;
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
      const slug = this.slug(state, action);
      const excerptState = this.excerpt(state);
      const thumbnail = this.thumbnail(state, action);
      const tagsState = await this.tags(state);
      const tocState = this.toc(state);
      const videoState = this.video(state);
      if (this.issues.length && slug.blocking) {
        if (!this.slugAllow(slug)) this.slugOpen(slug);
      }
      if (this.issues.length) {
        this.focus({
          state,
          slug,
          excerpt: excerptState,
          thumbnail,
          tags: tagsState,
          toc: tocState,
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
    postLayout: {
      value() {
        const element = cms.layout.element();
        if (!element) return "";
        return [
          cms.layout.value(element),
          element.options?.[element.selectedIndex]?.text || "",
        ].join("\n");
      },
      onliner() {
        const value = admin.postLayout.value();
        return (
          cms.layout.longread(value) ||
          /photo[-_\s]?report|photoreport|фоторепортаж/iu.test(value)
        );
      },
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
    fieldDiff: {
      id: "launchpad-field-diff-popover",
      styleId: "launchpad-field-diff-style",
      state() {
        return (window.__adminFieldDiffState ??= {
          histories: new WeakMap(),
          snapshots: new WeakMap(),
          owner: null,
          closeTimer: 0,
          restoring: null,
        });
      },
      label(element = null) {
        if (!element) return "Поле";
        const id = String(element.id || "");
        const name = String(element.name || "");
        if (id === "title") return "Заголовок";
        if (name === "rotation_titles[]") return "Ротация";
        if (id === "favourite_title" || name === "favourite_title") return "Крик";
        if (/seo/i.test(id) || /seo/i.test(name)) return "SEO";
        if (id === "excerpt" || name === "excerpt") return "Цитата";
        return element.closest?.("label")?.textContent?.trim() || "Поле";
      },
      style() {
        host.mount(admin.fieldDiff.styleId, css.admin.popover(admin.fieldDiff.id));
        return true;
      },
      visible(value = "", preserveSpaces = false) {
        const escaped = admin.fields.escape(String(value || ""));
        if (!preserveSpaces) return escaped;
        return escaped.replace(/[ \u00A0]/g, "\u00A0");
      },
      diffTokens(value = "") {
        return String(value || "").match(/[ \u00A0]+|[\u0022\u00ab\u00bb\u201c\u201d\u201e]|[^ \u00A0\u0022\u00ab\u00bb\u201c\u201d\u201e]+/g) || [];
      },
      diffOps(before = "", after = "") {
        const oldTokens = admin.fieldDiff.diffTokens(before);
        const newTokens = admin.fieldDiff.diffTokens(after);
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
            if (oldTokens[oldIndex] === newTokens[newIndex]) {
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
          if (oldTokens[oldIndex] === newTokens[newIndex]) {
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
      commonPrefix(left = "", right = "") {
        const limit = Math.min(left.length, right.length);
        let index = 0;
        while (index < limit && left[index] === right[index]) index += 1;
        return left.slice(0, index);
      },
      commonSuffix(left = "", right = "") {
        const limit = Math.min(left.length, right.length);
        let index = 0;
        while (index < limit && left[left.length - index - 1] === right[right.length - index - 1]) index += 1;
        return left.slice(left.length - index);
      },
      normalizePair(remove = "", add = "") {
        const prefix = admin.fieldDiff.commonPrefix(remove, add);
        const left = remove.slice(prefix.length);
        const right = add.slice(prefix.length);
        const suffix = admin.fieldDiff.commonSuffix(left, right);
        return [
          { type: "equal", text: prefix },
          { type: "remove", text: left.slice(0, left.length - suffix.length) },
          { type: "add", text: right.slice(0, right.length - suffix.length) },
          { type: "equal", text: suffix },
        ].filter((op) => op.text);
      },
      normalizeOps(ops = []) {
        const normalized = [];
        let index = 0;
        const isSpace = (op) => /^[ \u00A0]+$/u.test(op?.text || "");
        const hasNbsp = (op) => /\u00A0/u.test(op?.text || "");
        const plainSpace = (value = "") => String(value || "").replace(/\u00A0/g, " ");
        const push = (op) => {
          if (!op?.text) return;
          const last = normalized[normalized.length - 1];
          if (last?.type === op.type) {
            last.text += op.text;
            return;
          }
          normalized.push({ type: op.type, text: op.text });
        };
        while (index < ops.length) {
          const current = ops[index];
          const next = ops[index + 1];
          if (
            current?.type === "remove" &&
            next?.type === "add" &&
            isSpace(current) &&
            isSpace(next) &&
            !hasNbsp(current) &&
            hasNbsp(next) &&
            plainSpace(current.text) === plainSpace(next.text)
          ) {
            push({ type: "add", text: next.text });
            index += 2;
            continue;
          }
          if (
            current?.type === "remove" &&
            next?.type === "add" &&
            isSpace(current) &&
            isSpace(next) &&
            !hasNbsp(current) &&
            !hasNbsp(next)
          ) {
            push({ type: "remove", text: current.text.slice(next.text.length) });
            index += 2;
            continue;
          }
          if (current?.type === "remove" && next?.type === "add") {
            admin.fieldDiff.normalizePair(current.text, next.text).forEach(push);
            index += 2;
            continue;
          }
          push(current);
          index += 1;
        }
        return normalized.filter((op) => op.text);
      },
      theme() {
        return (
          document.getElementById("launchpad-panel")?.dataset?.theme ||
          document.querySelector(`.panel[data-ui-surface="toolbar"]:not(#${admin.fieldDiff.id})`)?.dataset?.theme ||
          "dark"
        );
      },
      copy: {
        title: "\u0412\u0435\u0440\u043d\u0443\u0442\u044c",
        empty: "\u2014",
      },
      view: {
        part(op = {}) {
          const changed = op.type === "add" || op.type === "remove";
          const value = admin.fieldDiff.visible(op.text || "", changed);
          if (op.type === "add") {
            return `<span class="launchpad-popover-diff-part launchpad-popover-diff-add">${value}</span>`;
          }
          if (op.type === "remove") {
            return `<span class="launchpad-popover-diff-part launchpad-popover-diff-remove">${value}</span>`;
          }
          return `<span class="launchpad-popover-diff-part launchpad-popover-diff-equal">${value}</span>`;
        },
        restore() {
          return `<button class="launchpad-popover-action" data-action="field-diff-restore" type="button" title="${admin.fieldDiff.copy.title}" aria-label="${admin.fieldDiff.copy.title}">${ui.controls.glyph("Group Return", 18, "Return")}</button>`;
        },
        html(item = {}) {
          const body =
            admin.fieldDiff.diffHtml(item.before || "", item.after || "") ||
            admin.fieldDiff.visible(item.after || "");
          return `<div class="launchpad-popover"><div class="launchpad-popover-row"><div class="launchpad-popover-body">${body || admin.fieldDiff.copy.empty}</div><div class="launchpad-popover-actions">${admin.fieldDiff.view.restore()}</div></div></div>`;
        },
      },
      diffHtml(before = "", after = "") {
        const ops = admin.fieldDiff.normalizeOps(admin.fieldDiff.diffOps(before, after));
        if (!ops.length) return "";
        return ops.map(admin.fieldDiff.view.part).join("");
      },
      node() {
        let node = document.getElementById(admin.fieldDiff.id);
        if (node) return node;
        node = document.createElement("div");
        node.id = admin.fieldDiff.id;
        node.className = "panel";
        node.dataset.uiSurface = "toolbar";
        node.dataset.theme = admin.fieldDiff.theme();
        node.dataset.uiFrame = "popover";
        node.dataset.open = "false";
        node.addEventListener("mouseenter", admin.fieldDiff.cancelClose);
        node.addEventListener("mouseleave", admin.fieldDiff.deferClose);
        node.addEventListener("pointerenter", admin.fieldDiff.cancelClose);
        node.addEventListener("pointerleave", admin.fieldDiff.deferClose);
        node.addEventListener("pointerdown", admin.fieldDiff.keepFocus, true);
        node.addEventListener("mousedown", admin.fieldDiff.keepFocus, true);
        node.addEventListener("touchstart", admin.fieldDiff.keepFocus, { passive: false, capture: true });
        node.addEventListener("click", admin.fieldDiff.click, true);
        document.body.appendChild(node);
        return node;
      },
      place(node = null, element = null) {
        if (!node || !element?.isConnected) return false;
        const rect = element.getBoundingClientRect();
        const gap = 4;
        const width = node.offsetWidth || 420;
        const height = node.offsetHeight || 120;
        const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 0;
        const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
        const below = rect.bottom + gap + height <= viewportHeight;
        const top = below ? rect.bottom + gap : Math.max(gap, rect.top - height - gap);
        const left = Math.max(gap, Math.min(viewportWidth - width - gap, rect.left));
        node.style.left = `${left.toFixed(2)}px`;
        node.style.top = `${top.toFixed(2)}px`;
        return true;
      },
      item(element = null) {
        if (!element) return null;
        const history = admin.fieldDiff.state().histories.get(element) || null;
        const steps = Array.isArray(history?.steps) ? history.steps : [];
        const step = steps[steps.length - 1] || null;
        if (!step) return null;
        return {
          before: step.before,
          after: step.after,
          steps,
          label: admin.fieldDiff.label(element),
        };
      },
      mark(element = null, value = true) {
        if (!element?.dataset) return false;
        if (value) {
          element.dataset.launchpadFieldNormalized = "true";
          return true;
        }
        delete element.dataset.launchpadFieldNormalized;
        return true;
      },
      snapshot(element = null) {
        if (!element) return false;
        admin.fieldDiff.state().snapshots.set(element, String(element.value || ""));
        return true;
      },
      bind(element = null) {
        if (!element || element.dataset.launchpadFieldDiffBound === "true") return false;
        element.dataset.launchpadFieldDiffBound = "true";
        element.addEventListener("focus", admin.fieldDiff.enter, true);
        element.addEventListener("blur", admin.fieldDiff.leave, true);
        element.addEventListener("click", admin.fieldDiff.enter, true);
        return true;
      },
      render(node = null, element = null, item = null) {
        if (!node || !element || !item) return false;
        node.__launchpadField = element;
        node.dataset.theme = admin.fieldDiff.theme();
        node.innerHTML = admin.fieldDiff.view.html(item);
        admin.fieldDiff.state().owner = element;
        admin.fieldDiff.place(node, element);
        requestAnimationFrame(() => {
          node.dataset.open = "true";
        });
        return true;
      },
      show(element = null) {
        const item = admin.fieldDiff.item(element);
        if (!item) return false;
        admin.fieldDiff.cancelClose();
        admin.fieldDiff.style();
        const node = admin.fieldDiff.node();
        node.dataset.open = "false";
        return admin.fieldDiff.render(node, element, item);
      },
      hide() {
        const state = admin.fieldDiff.state();
        const node = document.getElementById(admin.fieldDiff.id);
        if (node) {
          node.dataset.open = "false";
          node.__launchpadField = null;
        }
        state.owner = null;
        return true;
      },
      cancelClose() {
        const state = admin.fieldDiff.state();
        clearTimeout(state.closeTimer);
        state.closeTimer = 0;
      },
      deferClose() {
        const state = admin.fieldDiff.state();
        clearTimeout(state.closeTimer);
        state.closeTimer = setTimeout(admin.fieldDiff.hide, 220);
      },
      enter(event) {
        return admin.fieldDiff.show(event.currentTarget || event.target);
      },
      leave(event) {
        if (event?.pointerType === "touch") return;
        admin.fieldDiff.deferClose();
      },
      restoreFocus(element = null) {
        if (!element?.isConnected) return false;
        const value = String(element.value || "");
        element.focus?.({ preventScroll: true });
        admin.edit.select(element, value.length);
        return true;
      },
      keepFocus(event) {
        const action = event.target?.closest?.(".launchpad-popover-action");
        if (!action) return;
        event.preventDefault();
        event.stopPropagation?.();
        event.stopImmediatePropagation?.();
      },
      steps(before = "", after = "") {
        const source = String(before || "");
        const target = String(after || "");
        if (source === target) return [];
        const ops = admin.fieldDiff.normalizeOps(admin.fieldDiff.diffOps(source, target));
        const steps = [];
        let current = source;
        let index = 0;
        const push = (from, remove, add) => {
          const next = `${current.slice(0, from)}${add}${current.slice(from + remove.length)}`;
          if (next === current) return false;
          steps.push({ before: current, after: next });
          current = next;
          return true;
        };
        for (let offset = 0; offset < ops.length; offset += 1) {
          const op = ops[offset];
          if (!op?.text) continue;
          if (op.type === "equal") {
            index += op.text.length;
            continue;
          }
          if (op.type === "remove") {
            const next = ops[offset + 1];
            const add = next?.type === "add" ? next.text || "" : "";
            push(index, op.text, add);
            index += add.length;
            if (next?.type === "add") offset += 1;
            continue;
          }
          if (op.type === "add") {
            push(index, "", op.text);
            index += op.text.length;
          }
        }
        if (steps.length && steps[steps.length - 1].after === target) return steps;
        return [{ before: source, after: target }];
      },
      restoreStep(element = null) {
        const item = admin.fieldDiff.item(element);
        if (!element?.isConnected || !item) return null;
        const steps = Array.isArray(item.steps) ? item.steps : [];
        if (!steps.length) return null;
        const step = steps.pop();
        const value = String(step?.before ?? "");
        const state = admin.fieldDiff.state();
        state.restoring = element;
        element.dataset.launchpadSanitizerBypass = "true";
        try {
          field.set(element, value);
          const edit = admin.edit.history(element);
          if (edit) edit.value = value;
        } finally {
          state.restoring = null;
          delete element.dataset.launchpadSanitizerBypass;
          element.dataset.launchpadSanitizerSkipBlur = "true";
        }
        if (steps.length) {
          state.histories.set(element, { steps });
          admin.fieldDiff.mark(element, true);
        } else {
          state.histories.delete(element);
          admin.fieldDiff.mark(element, false);
        }
        return { value, remaining: steps.length };
      },
      restore(element = null) {
        admin.fieldDiff.cancelClose();
        const result = admin.fieldDiff.restoreStep(element);
        if (!result) return false;
        if (result.remaining > 0) {
          const node = document.getElementById(admin.fieldDiff.id);
          const item = admin.fieldDiff.item(element);
          if (node && item) admin.fieldDiff.render(node, element, item);
        } else {
          admin.fieldDiff.hide();
        }
        admin.fieldDiff.restoreFocus(element);
        return true;
      },
      clear(element = null) {
        if (!element) return false;
        const state = admin.fieldDiff.state();
        state.histories.delete(element);
        admin.fieldDiff.mark(element, false);
        if (state.owner === element) admin.fieldDiff.hide();
        return true;
      },
      close() {
        return admin.fieldDiff.hide();
      },
      click(event) {
        const action = event.target.closest?.("[data-action]")?.dataset?.action || "";
        if (!action) return;
        event.preventDefault();
        event.stopPropagation?.();
        event.stopImmediatePropagation?.();
        const node = document.getElementById(admin.fieldDiff.id);
        const element = node?.__launchpadField || admin.fieldDiff.state().owner || null;
        if (action === "field-diff-restore") return admin.fieldDiff.restore(element);
      },
      capture(element = null, before = "", after = "", item = {}) {
        if (!element || before === after) return false;
        const state = admin.fieldDiff.state();
        const current = state.histories.get(element) || null;
        const steps = Array.isArray(current?.steps) ? current.steps.slice() : [];
        const previous = steps[steps.length - 1] || null;
        const nextSteps = item.atomic === true
          ? [{ before, after }]
          : admin.fieldDiff.steps(before, after);
        nextSteps.forEach((step) => {
          const last = steps[steps.length - 1] || previous;
          if (!last || last.before !== step.before || last.after !== step.after) {
            steps.push(step);
          }
        });
        admin.fieldDiff.style();
        state.histories.set(element, { steps });
        admin.fieldDiff.mark(element, true);
        admin.fieldDiff.bind(element);
        admin.fieldDiff.show(element);
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
        fit(value = "", limit = admin.fields.config.slug.limit || 34) {
          return Array.from(String(value || ""))
            .slice(0, limit)
            .join("")
            .replace(/-+$/g, "");
        },
        snapshot(value = "") {
          const normalized = admin.fields.slug.normalize(value);
          const limit = admin.fields.config.slug.limit || 34;
          const fitted = admin.fields.slug.fit(normalized, limit);
          const chars = Array.from(fitted);
          const rawChars = Array.from(normalized);
          const willBeCut = rawChars.length > chars.length;
          const visible = willBeCut
            ? `${rawChars.slice(0, 16).join("")}…${rawChars.slice(-16).join("")}`
            : chars.join("");
          return {
            value: chars.join(""),
            length: rawChars.length,
            limit,
            willBeCut,
            visible,
            full: normalized,
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
      syncGlyph(target, html = "", key = "") {
        if (!target) return false;
        const nextKey = String(key || "");
        const currentKey = String(target.dataset.adminGlyphKey || "");
        const apply = () => {
          target.innerHTML = html;
          target.dataset.adminGlyphKey = nextKey;
          target.style.opacity = "1";
          target.style.transform = "scale(1)";
        };
        if (!currentKey) {
          apply();
          return true;
        }
        if (currentKey === nextKey) {
          target.innerHTML = html;
          return true;
        }
        clearTimeout(target._adminGlyphTimer);
        target.style.transition = "opacity 220ms ease, transform 280ms ease";
        target.style.opacity = "0.38";
        target.style.transform = "scale(0.94)";
        target._adminGlyphTimer = setTimeout(apply, 180);
        return true;
      },
      mountStyle() {
        host.mount(admin.stack.style, css.admin.stack());
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
          content: ui.controls.icon(icon.emoji(feature.marker)),
          button: {
            title: feature.title || "",
            attrs: ` type="button" tabindex="-1" aria-label="${admin.fields.escape(
              feature.title || "",
            )}"`,
          },
        });
      },
      head(feature, { themeAction = "", closeAction = "", mainAfter = "" } = {}) {
        const theme = feature.state.theme || admin.stack.theme();
        const right = ui.controls.chrome({
          theme,
          themeAction,
          closeAction,
          group: {
            classes: "admin-fields-system",
          },
        });
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
      flashApply(button = null, restore = null) {
        const target = button?.querySelector?.(".ui-icon-content");
        if (!target) return false;
        const previous = target.innerHTML;
        clearTimeout(button._adminApplyFlashTimer);
        target.style.transition = "opacity 140ms ease, transform 180ms ease";
        target.style.opacity = "0.38";
        target.style.transform = "scale(0.92)";
        const swap = (html = "") => {
          target.innerHTML = html;
          target.style.opacity = "1";
          target.style.transform = "scale(1)";
        };
        window.setTimeout(() => {
          swap(ui.controls.glyph("Document Ribbon", 22, "Document"));
        }, 120);
        button._adminApplyFlashTimer = setTimeout(() => {
          target.style.opacity = "0.38";
          target.style.transform = "scale(0.92)";
          window.setTimeout(() => {
            if (typeof restore === "function") {
              restore(target, button);
              return;
            }
            swap(previous);
          }, 120);
        }, 860);
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
        const root = host.create({
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
      marker: "notebook-with-decorative-cover",
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
      marker: "linked-paperclips",
      copy: {
        input: {
          placeholder: "Слаг",
          label: "Слаг",
        },
        action: {
          cycle: "Свапнуть",
          apply: "Применить",
        },
        state: {
          original: "Исходный",
          candidate: "Заголовок",
          draft: "Норм",
        },
        confirm: {
          long: "Задлинно!! Всё равно тебе??",
        },
      },
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
            label: admin.slug.copy.input.label,
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
                placeholder: admin.slug.copy.input.placeholder,
                classes: "admin-fields-input admin-fields-input--slug",
                attrs: ` data-field-kind="slug" data-field-label="${admin.slug.copy.input.label}" data-field-limit="${snap.limit}"`,
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
            title: admin.slug.copy.action.cycle,
            classes: "admin-fields-corner admin-fields-cycle admin-slug-cycle",
            attrs: ' type="button"',
          });
        },
        apply() {
          const state = admin.slug.view.applyState();
          return ui.shell.group(
            admin.stack.button(
              "slug-apply",
              admin.slug.view.applyGlyph(state),
              ` title="${admin.fields.escape(admin.slug.view.applyTitle(state))}" aria-label="${admin.fields.escape(admin.slug.view.applyTitle(state))}"`,
            ),
            { rail: true, classes: "admin-fields-apply-group admin-slug-apply-group" },
          );
        },
        state(value = admin.slug.headless.value()) {
          const text = admin.slug.headless.normalize(value);
          if (admin.slug.headless.same(text, admin.slug.headless.original())) {
            return {
              name: "original",
              title: admin.slug.copy.state.original,
              fluent: "Person Edit",
              fallback: "Person",
            };
          }
          if (admin.slug.headless.candidates().some((value) => admin.slug.headless.same(text, value))) {
            return {
              name: "candidate",
              title: admin.slug.copy.state.candidate,
              fluent: "Comment Edit",
              fallback: "Comment",
            };
          }
          return {
            name: "draft",
            title: admin.slug.copy.state.draft,
            fluent: "Code Text Edit",
            fallback: "Code Text",
          };
        },
        stateBadge(value = admin.slug.headless.value()) {
          const state = admin.slug.view.state(value);
          return `<span class="admin-slug-state-badge" data-slug-state="${state.name}" title="${admin.fields.escape(state.title)}" aria-label="${admin.fields.escape(state.title)}">${ui.controls.glyph(state.fluent, 18, state.fallback)}</span>`;
        },
        applyState(value = admin.slug.headless.value()) {
          if (!admin.slug.headless.same(value, admin.slug.state.applied)) {
            return {
              name: "pending",
              title: admin.slug.copy.action.apply,
              fluent: "Ribbon Star",
              fallback: "Apply",
            };
          }
          return {
            name: "applied",
            title: "Применено",
            fluent: "Document Ribbon",
            fallback: "Document",
          };
        },
        applyGlyph(state = admin.slug.view.applyState()) {
          return ui.controls.glyph(
            state.fluent || "Ribbon Star",
            22,
            state.fallback || "Apply",
          );
        },
        applyTitle(state = admin.slug.view.applyState()) {
          return state.title || admin.slug.copy.action.apply;
        },
        preview(snap) {
          return `<div class="admin-fields-row admin-fields-row--slug-cycle">
            <div class="admin-fields-slug-edit">
              <div class="admin-fields-static admin-fields-static--slug-live" data-field-kind="slug-live" title="${admin.fields.escape(snap.full || snap.value)}">${admin.fields.escape(snap.visible)}</div>
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
        syncApply(root, value = admin.slug.headless.value()) {
          const button = root?.querySelector?.('[data-action="slug-apply"]');
          const target = button?.querySelector?.(".ui-icon-content");
          if (!button || !target) return;
          const state = admin.slug.view.applyState(value);
          admin.stack.syncGlyph(
            target,
            admin.slug.view.applyGlyph(state),
            state.name,
          );
          const title = admin.slug.view.applyTitle(state);
          button.dataset.applyState = state.name || "";
          button.title = title;
          button.setAttribute("aria-label", title);
        },
        syncPreview(root, snap) {
          const live = root?.querySelector?.('[data-field-kind="slug-live"]');
          if (!live) return;
          live.textContent = snap.visible;
          live.setAttribute("title", snap.full || snap.value);
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
          admin.slug.view.syncApply(root);
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
            admin.slug.view.syncApply(root, input.value || "");
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
              const value = input.value || "";
              const snap = admin.slug.headless.snapshot(value);
              const hasHellip =
                snap.willBeCut ||
                admin.slug.headless.normalize(value).length > snap.limit ||
                /…|&hellip;|&#8230;/i.test(value);
              if (hasHellip && !window.confirm(admin.slug.copy.confirm.long)) return true;
              admin.slug.headless.commit(value, (ok, applied) => {
                if (!ok) return;
                admin.slug.state.applyingSwap = true;
                input.value = applied.value;
                input.dispatchEvent(new Event("input", { bubbles: true }));
                admin.slug.state.applyingSwap = false;
                const next = admin.slug.headless.saveDraft(input.value || "");
                admin.slug.view.syncPreview(root, next);
                admin.slug.view.syncCounter(root);
                admin.slug.view.syncApply(root, input.value || "");
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
      marker: "thought-balloon",
      copy: {
        input: {
          placeholder: "Цитата",
          label: "Цитата",
        },
        action: {
          replace: "Свапнуть",
          apply: "Применить",
        },
        state: {
          original: "Автор",
          lead: "Лид",
          draft: "Норм",
          same: "Без изменений",
          changed: "Изменено",
          empty: "Пусто",
        },
        confirm: {
          long: "Реально такой лапоть сунешь??",
        },
      },
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
              icon: `<span class="admin-excerpt-equal-pair" title="${admin.excerpt.copy.state.same}" aria-label="${admin.excerpt.copy.state.same}"><span class="admin-excerpt-equal-part admin-excerpt-equal-remove">${icon}</span><span class="admin-excerpt-equal-part admin-excerpt-equal-add">${icon}</span></span>`,
              state: "same",
            };
          }
          const ops = admin.excerpt.headless.diffOps(oldText, newText);
          const replace = admin.excerpt.headless.diffIsReplacement(ops, oldText, newText);
          return {
            text: admin.excerpt.copy.state.changed,
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
            return { text: admin.excerpt.copy.state.empty, state: "empty" };
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
                placeholder: admin.excerpt.copy.input.placeholder,
                classes: "admin-fields-input admin-fields-input--excerpt",
                attrs: ` data-field-kind="excerpt" data-field-label="${admin.excerpt.copy.input.label}" data-field-limit="${limit}"`,
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
              title: admin.excerpt.copy.state.original,
              fluent: "Person Edit",
              fallback: "Person",
            };
          }
          if (clean && admin.excerpt.headless.same(text, clean)) {
            return {
              name: "lead",
              title: admin.excerpt.copy.state.lead,
              fluent: "Comment Edit",
              fallback: "Comment",
            };
          }
          } catch {}
          return {
            name: "draft",
            title: admin.excerpt.copy.state.draft,
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
            title: admin.excerpt.copy.action.replace,
            classes: "admin-fields-corner admin-fields-replace",
            attrs: ' type="button"',
          });
        },
        apply() {
          const state = admin.excerpt.view.applyState();
          return ui.shell.group(
            admin.stack.button(
              "excerpt-apply",
              admin.excerpt.view.applyGlyph(state),
              ` title="${admin.fields.escape(admin.excerpt.view.applyTitle(state))}" aria-label="${admin.fields.escape(admin.excerpt.view.applyTitle(state))}"`,
            ),
            { rail: true, classes: "admin-fields-apply-group admin-excerpt-apply-group" },
          );
        },
        applyState(value = admin.excerpt.headless.value()) {
          if (!admin.excerpt.headless.same(value, admin.excerpt.state.applied)) {
            return {
              name: "pending",
              title: admin.excerpt.copy.action.apply,
              fluent: "Ribbon Star",
              fallback: "Apply",
            };
          }
          return {
            name: "applied",
            title: "Применено",
            fluent: "Document Ribbon",
            fallback: "Document",
          };
        },
        applyGlyph(state = admin.excerpt.view.applyState()) {
          return ui.controls.glyph(
            state.fluent || "Ribbon Star",
            22,
            state.fallback || "Apply",
          );
        },
        applyTitle(state = admin.excerpt.view.applyState()) {
          return state.title || admin.excerpt.copy.action.apply;
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
        syncApply(root, value = admin.excerpt.headless.value()) {
          const button = root?.querySelector?.('[data-action="excerpt-apply"]');
          const target = button?.querySelector?.(".ui-icon-content");
          if (!button || !target) return;
          const state = admin.excerpt.view.applyState(value);
          admin.stack.syncGlyph(
            target,
            admin.excerpt.view.applyGlyph(state),
            state.name,
          );
          const title = admin.excerpt.view.applyTitle(state);
          button.dataset.applyState = state.name || "";
          button.title = title;
          button.setAttribute("aria-label", title);
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
          admin.excerpt.view.syncApply(root);
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
            admin.excerpt.view.syncApply(root, input.value || "");
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
              if (limit && length >= Math.ceil(limit * 1.11) && !window.confirm(admin.excerpt.copy.confirm.long)) {
                return true;
              }
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


    tags: {
      suggest: {
        ids: {
          panel: "tags-suggest-panel",
        },
        state: {
          theme: "",
          observer: null,
          suggestions: [],
          names: [],
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
          element.style.transform = "none";
          element.style.width = `${Math.ceil(snapshot.width)}px`;
          element.style.minWidth = `${Math.ceil(snapshot.width)}px`;
        },
        resetPosition(element) {
          if (!element) return;
          element.style.left = "";
          element.style.top = "";
          element.style.right = "";
          element.style.bottom = "";
          element.style.transform = "";
          delete element.dataset.panelSnapX;
          delete element.dataset.panelSnapY;
          delete element.dataset.panelSnapMargin;
        },
        size(element) {
          if (!element) return;
          element.style.width = "220px";
          element.style.minWidth = "220px";
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
        requiredLayoutNames() {
          return admin.postLayout.onliner() ? ["Onliner"] : [];
        },
        requiredNames() {
          return admin.tags.suggest.unique([
            ...admin.tags.suggest.requiredLayoutNames(),
          ]);
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
            fluent: added ? "Tag" : "Tag Off",
            fallback: added ? "Tag" : "Tag Off",
            title: added ? "Убрать" : "Добавить",
          };
        },
        addButton(name) {
          const state = admin.tags.suggest.buttonState(name);
          return ui.controls.button({
            fluent: state.fluent,
            fallback: state.fallback,
            action: "tags.suggest.toggle",
            title: state.title,
            attrs: ` type="button" data-tag-suggest="${encodeURIComponent(name)}" data-tags-suggest-added="${state.added ? "true" : "false"}"`,
          });
        },
        syncButton(button) {
          const name = decodeURIComponent(button?.dataset?.tagSuggest || "");
          if (!name) return;
          const state = admin.tags.suggest.buttonState(name);
          const added = state.added ? "true" : "false";
          if (button.dataset.tagsSuggestAdded === added && button.title === state.title) return;
          button.disabled = false;
          button.dataset.tagsSuggestAdded = added;
          button.title = state.title;
          button.innerHTML = ui.controls.icon(
            ui.controls.glyph(state.fluent, 18, state.fallback),
          );
        },
        syncButtons() {
          document
            .getElementById(admin.tags.suggest.ids.panel)
            ?.querySelectorAll('[data-action="tags.suggest.toggle"]')
            .forEach(admin.tags.suggest.syncButton);
        },
        nameKeys() {
          return admin.tags.suggest.state.names.map(tag.normalizeName).join("\n");
        },
        renderList() {
          const element = document.getElementById(admin.tags.suggest.ids.panel);
          if (!element) return;
          const current = element.querySelector(
            '[data-tags-suggest-list="true"], [data-tags-suggest-status="true"]',
          );
          const next = admin.tags.suggest.list();
          if (current) {
            current.outerHTML = next;
          } else {
            element.querySelector(".ui-stack")?.insertAdjacentHTML("beforeend", next);
          }
          admin.tags.suggest.syncButtons();
        },
        syncSelected() {
          const before = admin.tags.suggest.nameKeys();
          admin.tags.suggest.mergeNames([
            ...tag.selected(),
            ...admin.tags.suggest.requiredNames(),
          ]);
          const after = admin.tags.suggest.nameKeys();
          if (before !== after) {
            admin.tags.suggest.renderList();
            return;
          }
          admin.tags.suggest.syncButtons();
        },
        observeSelected() {
          if (admin.tags.suggest.state.observer) return;
          const root = document.querySelector("#post_tag");
          if (!root || typeof MutationObserver !== "function") return;
          const observer = new MutationObserver(() => admin.tags.suggest.syncSelected());
          observer.observe(root, {
            childList: true,
            subtree: true,
          });
          admin.tags.suggest.state.observer = observer;
        },
        item(name) {
          const button = admin.tags.suggest.addButton(name);
          return ui.shell.group(
            ui.shell.frame({
              classes: "ui-row",
              attrs: ' data-tags-suggest-row="true"',
              left: button,
              main: admin.diff.escape(name),
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
        status({ text = "" } = {}) {
          return ui.shell.frame({
            attrs: ' data-tags-suggest-status="true"',
            left: ui.controls.message({ text: admin.diff.escape(text) }),
          });
        },
        sortNames(values) {
          return admin.tags.suggest.unique(values).sort((left, right) =>
            tag.normalizeName(left).localeCompare(tag.normalizeName(right), "ru-RU"),
          );
        },
        resetNames() {
          admin.tags.suggest.state.suggestions = [];
          admin.tags.suggest.state.names = admin.tags.suggest.sortNames([
            ...tag.selected(),
            ...admin.tags.suggest.requiredNames(),
          ]);
        },
        mergeNames(values = []) {
          admin.tags.suggest.state.names = admin.tags.suggest.sortNames([
            ...admin.tags.suggest.state.names,
            ...values,
          ]);
        },
        counter(current = 0, total = 0) {
          if (!total) return "";
          return ui.controls.counter({
            current,
            limit: total,
            classes: "tags-suggest-counter",
            attrs: ' data-tags-suggest-counter="true"',
          });
        },
        syncCounter(current = 0, total = 0) {
          const element = document.getElementById(admin.tags.suggest.ids.panel);
          const counter = element?.querySelector('[data-tags-suggest-counter="true"]');
          if (!counter || !total) return;
          ui.controls.counterSync(counter, {
            current,
            limit: total,
          });
        },
        list() {
          const names = admin.tags.suggest.state.names;
          if (!names.length) return admin.tags.suggest.status({ text: "Метки не найдены" });
          return ui.shell.stack(
            names.map(admin.tags.suggest.item).join(""),
            ' data-tags-suggest-list="true"',
          );
        },
        marker() {
          return ui.controls.marker({
            content: icon.emoji("label"),
            button: {
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
            attrs: ' data-tags-suggest-head="true"',
            left: admin.tags.suggest.marker(),
            main: admin.tags.suggest.counter(current, total),
            right: ui.controls.chrome({
              theme,
              themeAction: "tags.suggest.theme",
              closeAction: "tags.suggest.close",
            }),
          });
          if (suggestions.length) admin.tags.suggest.state.suggestions = suggestions;
          admin.tags.suggest.mergeNames([
            ...tag.selected(),
            ...admin.tags.suggest.requiredNames(),
            ...suggestions,
          ]);
          const content = admin.tags.suggest.state.names.length
            ? admin.tags.suggest.list()
            : admin.tags.suggest.status({ text: body });
          let element = document.getElementById(admin.tags.suggest.ids.panel);
          if (element) {
            element.innerHTML = ui.shell.stack(`${head}${content}`);
          } else {
            element = host.create({
              id: admin.tags.suggest.ids.panel,
              html: ui.shell.stack(`${head}${content}`),
              place: "center",
              draggable: { handle: false },
            });
            element.addEventListener("click", admin.tags.suggest.click);
          }
          element.dataset.uiSurface = "toolbar";
          element.dataset.uiFrame = "capsule";
          element.dataset.toolbarFlow = "stack";
          admin.tags.suggest.size(element);
          ui.surface.sync(element, { theme, surface: "toolbar" });
          admin.tags.suggest.restore(element, snapshot);
          host.drag.bind(element, { handle: false });
          admin.tags.suggest.observeSelected();
          admin.tags.suggest.syncButtons();
          ui.controls.chrome.theme(element, {
            theme,
            action: "tags.suggest.theme",
          });
          return element;
        },
        theme() {
          const element = document.getElementById(admin.tags.suggest.ids.panel);
          if (!element) return;
          const next = element.dataset.theme === "dark" ? "light" : "dark";
          admin.tags.suggest.state.theme = next;
          ui.surface.sync(element, { theme: next, surface: "toolbar" });
          ui.controls.chrome.theme(element, {
            theme: next,
            action: "tags.suggest.theme",
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
          if (action === "tags.suggest.marker") {
            admin.tags.suggest.resetPosition(document.getElementById(admin.tags.suggest.ids.panel));
            return;
          }
          if (action !== "tags.suggest.toggle") return;
          const name = decodeURIComponent(button.dataset.tagSuggest || "");
          if (!name || !tag.toggle(name)) return;
          admin.tags.suggest.syncButtons();
          setTimeout(admin.tags.suggest.syncButtons, 120);
        },
        async run() {
          admin.tags.suggest.resetNames();
          if (!tag.input() || !document.querySelector("#new-tag-post_tag")) {
            admin.tags.suggest.panel({ body: "Поле меток не найдено" });
            return false;
          }
          try {
            const candidates = admin.tags.suggest.candidates();
            admin.tags.suggest.panel({ body: "Метки не найдены", current: 0, total: candidates.length });
            if (!candidates.length) return true;
            const update = (current, total) => {
              admin.tags.suggest.syncCounter(current, total);
            };
            const suggestions = await admin.tags.suggest.lookup(candidates, update);
            admin.tags.suggest.panel({
              body: "Метки не найдены",
              suggestions,
              current: candidates.length,
              total: candidates.length,
            });
            return true;
          } catch (error) {
            admin.tags.suggest.panel({ body: error.message || "Ошибка поиска меток" });
            return false;
          }
        },
      },
      normalize: {
        targets() {
          return tag.case.targets();
        },
        choose(targets = []) {
          return tag.case.choose(targets);
        },
        async apply(targets = []) {
          const results = [];
          for (const item of targets) {
            results.push({
              ...(await tag.rename(item.old, item.next)),
              type: "rename",
            });
          }
          return results;
        },
        async run() {
          const input = tag.input();
          const current = tag.get();
          const targets = admin.tags.normalize.targets();
          if (!targets.length) {
            alert("✔️ Метки норм");
            return true;
          }
          const selected = admin.tags.normalize.choose(targets);
          if (!selected.length) return true;
          try {
            await cms.vpn.ensure("⚠️ VPN");
            const results = await admin.tags.normalize.apply(selected);
            tag.apply(input, current, results);
            const report = tag.report(results);
            if (!report.ok.length) {
              alert(report.message);
              return true;
            }
            if (confirm(`${report.message}

Открыть обновлённые метки?`)) {
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
      run() {
        return admin.tags.normalize.run();
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
    inputSanitizer: {
      key: "__adminInputSanitizerCleanup",
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
          "#excerpt",
          "textarea[name='excerpt']",
        ].join(",");
      },
      editable(element = null) {
        if (!element?.matches) return false;
        if (element.closest?.("#launchpad-panel,.panel")) return false;
        if (element.dataset.launchpadSanitizerBypass === "true") return false;
        if (element.id === "content" || element.name === "content") return false;
        return element.matches(admin.inputSanitizer.selector());
      },
      commit(element = null, before = "", after = "", item = {}) {
        return admin.fieldDiff.capture(element, before, after, { ...item, atomic: true });
      },
      reset(element = null, data = {}) {
        if (admin.fieldDiff.state().restoring === element) return false;
        if (element?.dataset?.launchpadSanitizerBypass === "true") {
          delete element.dataset.launchpadSanitizerBypass;
        }
        if (data.reason === "input") {
          delete element.dataset.launchpadSanitizerSkipBlur;
          delete element.dataset.launchpadSanitizerSkippedBlur;
          return false;
        }
        if (data.reason === "blur" && element?.dataset?.launchpadSanitizerSkipBlur === "true") {
          element.dataset.launchpadSanitizerSkippedBlur = "true";
          return "skip";
        }
        if (data.reason === "focus") {
          if (element?.dataset?.launchpadSanitizerSkippedBlur === "true") {
            delete element.dataset.launchpadSanitizerSkipBlur;
            delete element.dataset.launchpadSanitizerSkippedBlur;
          }
          return admin.fieldDiff.snapshot(element);
        }
        return false;
      },
      stop() {
        const cleanup = window[admin.inputSanitizer.key];
        if (typeof cleanup !== "function") return false;
        cleanup();
        window[admin.inputSanitizer.key] = null;
        return true;
      },
      run() {
        admin.inputSanitizer.stop();
        const cleanup = sanitizer.field.bind(document, {
          allow: (element) => admin.inputSanitizer.editable(element),
          uppercaseFirst: true,
          live: false,
          focus: true,
          commit: admin.inputSanitizer.commit,
          reset: admin.inputSanitizer.reset,
        });
        window[admin.inputSanitizer.key] = () => {
          cleanup();
        };
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
        if (element.dataset?.launchpadSanitizerBypass === "true") return false;
        if (element.dataset?.launchpadSanitizerSkipBlur === "true") return false;
        const value = String(element.value || "");
        const normalized = admin.title.normalize(value);
        if (value === normalized) return false;
        field.input(element, normalized);
        admin.fieldDiff.capture(element, value, normalized, { atomic: true });
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
          return cms.footer.telegram.html();
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
          return cms.footer.copyright.html();
        },
      },
      copyrighted() {
        return admin.postLayout.onliner();
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
          return button.dataset[admin.clean.submit.pass] === "1" ||
            button.dataset[submit.pass] === "1";
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
        run() {
          admin.clean.fields.run(text.run);
          const editorMode = cms.editor.getMode();
          cms.editor.runHtmlBridge((value) => admin.clean.contentField(value), {
            mode: editorMode,
          });
          admin.clean.author.steps().forEach((step) => step());
          admin.clean.credits.run();
          admin.clean.tool();
          admin.clean.editor.bind();
          admin.clean.submit.run();
          return true;
        },
      },
      tool() {
        cms.admin.lazyTool({
          id: "reader-button",
          icon: icon.emoji("sunglasses"),
          html: true,
          from: "launchpad.js",
          to: "reader.js",
          exists: ["onliner-reader-button"],
        });
        return true;
      },
      contentField(value) {
        return contentFinalize(contentPipe(value));
      },
      footer: {
        run() {
          const editorMode = cms.editor.getMode();
          cms.editor.runHtmlBridge((value) => admin.footer.apply(value), {
            mode: editorMode,
          });
          return true;
        },
      },
      author: {
        steps() {
          return [
            () => api.content.more.run(),
            admin.clean.footer.run,
          ];
        },
        run() {
          return admin.clean.author.steps().map((step) => step()).some(Boolean);
        },
      },
      run() {
        return admin.clean.editor.run();
      },
    },
  };
  attachPost(admin, { field, tag, contentMarkup });
  attachRevision(admin, { host, css, ui });
  attachCrawler(admin);
  admin.title.defaults.bind();
  submit.bind();
  admin.draft.restore();
  admin.crawler.sections.worker();
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
      inputSanitizer: admin.inputSanitizer,
      fields: admin.fields,
      titles: admin.titles,
      slug: admin.slug,
      excerpt: admin.excerpt,
      clean: admin.clean,
      draft: admin.draft,
    },
  };
};
