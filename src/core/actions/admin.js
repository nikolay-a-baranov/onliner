import { panel } from "../panel.js";
import { css } from "../css.js";
import { toolbar } from "../toolbar.js";
import { icon } from "../icon.js";
import { ui } from "../ui.js";
import { cms } from "../cms.js";
import { field } from "../dom.js";
import { widget } from "../widget.js";
import { tag } from "../../pipe/tag.js";
import { text } from "../../pipe/text.js";
import { excerpt } from "../../pipe/excerpt.js";

export const createAdmin = () => {
const timer = {
  focusTick: 100,
  focusAttempts: 20,
  advertTick: 150,
  advertAttempts: 40,
  summaryDelay: 150,
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
        return String(value || "").replace(
          /(\[onliner-promo-widget\])({[\s\S]*?})(\[\/onliner-promo-widget\])/g,
          (match, open, json, close) => {
            try {
              const data = JSON.parse(admin.diff.decode(json));
              if (typeof data.text === "string") {
                data.text = admin.diff.decode(data.text);
              }
              return `${open}<pre>${admin.diff.escape(
                JSON.stringify(data, null, 2),
              )}</pre>${close}`;
            } catch {
              return match;
            }
          },
        );
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
        const head = ui.shell.shell({
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
        ].join("\n");
      },
      file(id) {
        const section = location.hostname.split(".")[0];
        return `${admin.dump.date()}_${section}_${id}.txt`;
      },
      data() {
        const tags = admin
          .list("#post_tag .tagchecklist span")
          .map((value) => value.replace(/^X\s*/i, "").trim());
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
      save(filename, text) {
        const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
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
      run() {
        const url = new URL(location.href);
        if (!url.pathname.endsWith("/wp-admin/post.php")) return false;
        const id = admin.text("#post_ID") || String(url.searchParams.get("post") || "").trim();
        if (!id) return false;
        admin.dump.save(admin.dump.file(id), admin.dump.data());
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
          const items = [
            {
              key: "title",
              label: config.title.label,
              limit: config.title.limit,
              get: () => admin.fields.value(config.title.selector),
              set: (value) => admin.fields.set(config.title.selector, value),
            },
          ];
          for (let index = 0; index < Math.max(3, rotations.length); index += 1) {
            const element = rotations[index] || null;
            items.push({
              key: `rotation-${index + 1}`,
              label: `${config.rotation.label} #${index + 1}`,
              limit: config.rotation.limit,
              get: () => String(element?.value || ""),
              set: (value) => {
                if (!element) return false;
                field.input(element, String(value || ""));
                return true;
              },
            });
          }
          return [
            ...items,
            {
              key: "favourite",
              label: config.favourite.label,
              limit: config.favourite.limit,
              get: () => admin.fields.value(config.favourite.selector),
              set: (value) => admin.fields.set(config.favourite.selector, value),
            },
            {
              key: "seo",
              label: config.seo.label,
              limit: config.seo.limit,
              get: () => admin.fields.value(config.seo.selector),
              set: (value) => admin.fields.set(config.seo.selector, value),
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
        commit(value) {
          const text = admin.fields.slug.normalize(value);
          const config = admin.fields.config.slug;
          const panel = field.element("#editable-post-name");
          const edit = field.element("#edit-slug-buttons .edit-slug");
          const input = field.element("#new-post-slug");
          const apply = () => {
            const save = field.element("#edit-slug-buttons .save");
            admin.fields.setAll("#new-post-slug", text);
            admin.fields.setAll('input[name="post_name"]', text);
            admin.fields.setAll("#post_name", text);
            admin.fields.setAll(config.fullSelector, text);
            admin.fields.setAll(config.selector, text);
            if (save && panel && panel.offsetParent !== null) save.click();
          };
          if (edit && (!input || input.offsetParent === null)) {
            edit.click();
            setTimeout(apply, 0);
          } else {
            apply();
          }
          const preview = field.element(config.previewSelector);
          if (preview) preview.textContent = text;
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
      head(feature, { themeAction = "", closeAction = "" } = {}) {
        const theme = feature.state.theme || admin.stack.theme();
        const right = ui.shell.group(
          `${admin.stack.button(themeAction, icon.theme(theme))}${admin.stack.button(closeAction, icon.emoji("❌", "default"))}`,
          { rail: true, classes: "admin-fields-system" },
        );
        return ui.shell.shell({
          classes: "admin-fields-head",
          attrs: ' data-admin-stack-head="true" data-panel-drag-handle="true"',
          left: admin.stack.marker(feature),
          main: admin.stack.counter(feature),
          right,
        });
      },
      shell(feature, body = "") {
        return ui.shell.stack(
          `${feature.head()}<div data-admin-stack-body data-mode="${feature.name}">${body}</div>`,
        );
      },
      syncTheme(feature) {
        const root = document.getElementById(feature.id);
        const node = root?.querySelector(".panel");
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
        const pointerdown = (event) => {
          if (!target(event)) return;
          event.stopPropagation();
        };
        const click = (event) => {
          if (!target(event)) return;
          event.preventDefault();
          event.stopPropagation();
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
          action: ({ name }) => {
            if (name === `${feature.name}-close`) return feature.close();
            if (name === `${feature.name}-theme`) {
              feature.state.theme =
                (feature.state.theme || "dark") === "dark" ? "light" : "dark";
              return admin.stack.syncTheme(feature);
            }
            return action?.(name);
          },
        });
      },
      open(feature) {
        admin.stack.closeOthers(feature);
        feature.close();
        admin.stack.mountStyle();
        feature.state.opener = document.activeElement;
        feature.state.theme = admin.stack.theme();
        feature.state.cleanup = [];
        const root = document.createElement("div");
        root.id = feature.id;
        root.dataset.adminStack = feature.name;
        root.dataset.mode = admin.stack.phone() ? "phone" : "desktop";
        root.tabIndex = -1;
        const node = document.createElement("div");
        node.className = "panel";
        node.dataset.uiFrame = "capsule";
        node.dataset.toolbarFlow = "stack";
        node.dataset.dock = "floating";
        node.dataset.dockTarget = "floating";
        node.style.pointerEvents = "auto";
        ui.surface.sync(node, {
          layout: "fullscreen",
          theme: feature.state.theme,
          surface: "toolbar",
        });
        root.appendChild(node);
        document.body.appendChild(root);
        panel.drag.bind(node);
        admin.stack.bindKeyboard(feature, root);
        feature.render(root);
        root.focus();
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
        input(item) {
          const value = String(item.get() || "");
          const limit = Number(item.limit) || 0;
          const label = admin.fields.label(item.label);
          return `<div class="admin-fields-row">
            <input class="admin-fields-input" data-field-kind="title" data-field-key="${admin.fields.escape(item.key)}" data-field-label="${admin.fields.escape(label)}" data-field-limit="${limit}" type="text" placeholder="${admin.fields.escape(label)}" value="${admin.fields.escape(value)}">
          </div>`;
        },
        body() {
          return admin.titles.headless.items().map(admin.titles.view.input).join("");
        },
        build() {
          return admin.stack.shell(admin.titles, admin.titles.view.body());
        },
        syncCounter(root) {
          admin.stack.syncCounter(admin.titles, root);
        },
        focus(root, key = "") {
          if (!key) return;
          const input = root.querySelector(
            `input[data-field-kind="title"][data-field-key="${key}"]`,
          );
          input?.focus?.();
          input?.select?.();
        },
        render(root, { focusKey = "" } = {}) {
          const node = root?.querySelector(".panel");
          if (!node) return;
          node.innerHTML = admin.titles.view.build();
          admin.titles.bind.fields(root);
          admin.titles.view.syncCounter(root);
          admin.titles.view.focus(root, focusKey);
        },
      },
      bind: {
        field(input, item, root, onPhone) {
          const key = input.dataset.fieldKey || "";
          if (onPhone) {
            input.addEventListener("pointerdown", async (event) => {
              event.preventDefault();
              if (!item) return;
              const result = await ui.popup.open({
                title: admin.fields.label(input.dataset.fieldLabel || "Заг"),
                value: input.value || "",
                limit: Number(input.dataset.fieldLimit) || 0,
              });
              if (!result) return;
              item.set(result.value || "");
              admin.titles.render(root, { focusKey: key });
            });
            return;
          }
          const sync = () => {
            admin.titles.headless.active(input);
            admin.titles.view.syncCounter(root);
          };
          input.addEventListener("focus", sync);
          input.addEventListener("input", () => {
            admin.titles.headless.save(input, item);
            admin.titles.view.syncCounter(root);
          });
        },
        fields(root) {
          const onPhone = admin.stack.phone();
          const items = admin.titles.headless.map();
          root
            .querySelectorAll('input[data-field-kind="title"]')
            .forEach((input) => {
              const key = input.dataset.fieldKey || "";
              admin.titles.bind.field(input, items[key], root, onPhone);
            });
          const key = admin.titles.state.activeKey || "";
          const selected = root.querySelector(
            `input[data-field-kind="title"][data-field-key="${key}"]`,
          ) || root.querySelector('input[data-field-kind="title"]');
          if (!selected) return;
          admin.titles.headless.active(selected);
        },
        actions(root) {
          admin.stack.bindActions(admin.titles, root);
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
          const snap = admin.slug.headless.snapshot(value);
          admin.fields.slug.set(snap.value);
          return snap;
        },
        commit(value = "") {
          return admin.fields.slug.commit(value);
        },
        candidates() {
          return admin.fields.titles.candidates();
        },
        nextCandidate() {
          const list = admin.slug.headless.candidates();
          if (!list.length) return "";
          const index = admin.slug.state.slugCycle % list.length;
          admin.slug.state.slugCycle += 1;
          return list[index] || "";
        },
      },
      view: {
        head() {
          return admin.stack.head(admin.slug, {
            themeAction: "slug-theme",
            closeAction: "slug-close",
          });
        },
        input(value = "", snap = admin.slug.headless.snapshot(value)) {
          return `<div class="admin-fields-row">
            <input class="admin-fields-input admin-fields-input--slug" data-field-kind="slug" data-field-label="Слаг" data-field-limit="${snap.limit}" type="text" placeholder="Слаг" value="${admin.fields.escape(value)}">
          </div>`;
        },
        cycle() {
          return ui.controls.button({
            action: "slug-cycle",
            content: icon.emoji("🔄", "default"),
            attrs: ' type="button" title="Цикл заголовков"',
          });
        },
        preview(snap) {
          return `<div class="admin-fields-row admin-fields-row--slug-cycle">
            <div class="admin-fields-slug-edit">
              <div class="admin-fields-preview admin-fields-preview--slug-live admin-fields-static" data-field-kind="slug-live" title="${admin.fields.escape(snap.value)}">${admin.fields.escape(snap.visible)}</div>
              ${admin.slug.view.cycle()}
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
        render(root) {
          const node = root?.querySelector(".panel");
          if (!node) return;
          node.innerHTML = admin.slug.view.build();
          admin.slug.bind.field(root);
          admin.slug.view.syncCounter(root);
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
          input.addEventListener("focus", sync);
          input.addEventListener("input", () => {
            const snap = admin.slug.headless.saveDraft(input.value || "");
            admin.slug.view.syncPreview(root, snap);
            sync();
          });
          input.addEventListener("blur", () => {
            admin.slug.headless.commit(input.value || "");
          });
          sync();
        },
        actions(root) {
          admin.stack.bindActions(admin.slug, root, (name) => {
            if (name !== "slug-cycle") return;
            const value = admin.slug.headless.nextCandidate();
            if (!value) return;
            const input = root.querySelector('input[data-field-kind="slug"]');
            if (!input) return;
            input.value = value;
            input.dispatchEvent(new Event("input", { bubbles: true }));
            admin.slug.headless.commit(value);
            input.focus();
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
          admin.fields.excerpt.set(value);
          return admin.excerpt.headless.sync(value);
        },
      },
      view: {
        head() {
          return admin.stack.head(admin.excerpt, {
            themeAction: "excerpt-theme",
            closeAction: "excerpt-close",
          });
        },
        input(value = "") {
          const limit = admin.excerpt.headless.limit();
          return `<div class="admin-fields-row">
            <textarea class="admin-fields-input admin-fields-input--excerpt" data-field-kind="excerpt" data-field-label="Цитата" data-field-limit="${limit}" placeholder="Цитата">${admin.fields.escape(value)}</textarea>
          </div>`;
        },
        body() {
          return admin.excerpt.view.input(admin.excerpt.headless.value());
        },
        build() {
          return admin.stack.shell(admin.excerpt, admin.excerpt.view.body());
        },
        syncCounter(root) {
          admin.stack.syncCounter(admin.excerpt, root);
        },
        render(root) {
          const node = root?.querySelector(".panel");
          if (!node) return;
          node.innerHTML = admin.excerpt.view.build();
          admin.excerpt.bind.field(root);
          admin.excerpt.view.syncCounter(root);
        },
      },
      bind: {
        field(root) {
          const input = root?.querySelector('[data-field-kind="excerpt"]');
          if (!input) return;
          const sync = () => {
            admin.excerpt.headless.sync(input.value || "");
            admin.excerpt.view.syncCounter(root);
          };
          input.addEventListener("focus", sync);
          input.addEventListener("input", () => {
            admin.excerpt.headless.saveDraft(input.value || "");
            sync();
          });
          sync();
        },
        actions(root) {
          admin.stack.bindActions(admin.excerpt, root);
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
            ui.shell.shell({
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
          return ui.shell.shell({
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
          const head = ui.shell.shell({
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
    title: {
      normalize(value) {
        let quotes = 0;
        return text.nbsp(
          String(value || "")
            .replace(/\u00A0/g, "\u0020")
            .replace(/\u0022/g, () =>
              quotes++ % 4 < 2
                ? quotes % 2
                  ? "\u00ab"
                  : "\u00bb"
                : quotes % 2
                  ? "\u201e"
                  : "\u201c",
            )
            .replace(/\u0027/g, "\u2019")
            .replace(/\s*[\u002d\u2013\u2014\u2212]\s*/g, "\u0020\u2014\u0020")
            .replace(/[\u0020\u0009]+/g, "\u0020")
            .trim(),
        );
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
        item.style.outline = "";
        if (!record.changed) {
          item.style.backgroundColor = record.background || "";
          return;
        }
        item.style.backgroundColor = admin.sanitize.state().active
          ? "rgba(46, 125, 50, .14)"
          : "rgba(198, 40, 40, .12)";
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
  };
  return {
    admin: {
      diff: admin.diff,
      dump: admin.dump,
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
    },
  };
};
