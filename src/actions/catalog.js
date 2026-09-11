import { host } from "../core/surface/host.js";
import { toolbar } from "../core/surface/toolbar.js";
import { ui } from "../core/surface/ui.js";
import { ux } from "../core/surface/ux.js";
import { markup as contentMarkup } from "../pipe/markup.js";

export const createCatalog = (api) => {
  const catalog = {
    ids: {
      panel: "catalog-widget-panel",
    },
    endpoint: {
      suggest: "https://images.h1n.ru/widget_api/suggest.php",
      feedback: "https://images.h1n.ru/widget_api/feedback.php",
      widget: "/admin/widget",
    },
    state: {
      inserted: new Set(),
      excluded: new Set(),
      suggestion: null,
      busy: false,
    },
    shortcode: {
      pattern:
        /\n*\[onliner-catalog\b[^\]]*\][\s\S]*?\[\/onliner-catalog\]\n*/gi,
      build(id = "") {
        return `[onliner-catalog id="${String(id || "")}"][/onliner-catalog]`;
      },
      clean(value = "") {
        return String(value || "")
          .replace(catalog.shortcode.pattern, "\n\n")
          .replace(/\n{3,}/g, "\n\n");
      },
    },
    footer: {
      tail: 6000,
      markers: [
        /google\.com\/preferences\/source\?q=/i,
        /перепечатка текста[\s\S]*?mailto:[a-z0-9._%+-]+@onliner\.by/i,
        /перепечатка текста и фотографий onl(?:í|i)ner/i,
        /есть о чем рассказать\?[\s\S]*?newsonliner_bot/i,
      ],
      marker(value = "") {
        const source = String(value || "");
        const start = Math.max(0, source.length - catalog.footer.tail);
        const tail = source.slice(start);
        const indexes = catalog.footer.markers
          .map((pattern) => {
            const match = pattern.exec(tail);
            return match && match.index !== undefined
              ? start + match.index
              : null;
          })
          .filter(Number.isInteger);
        return indexes.length ? Math.min(...indexes) : -1;
      },
      point(value = "") {
        const source = String(value || "");
        const index = catalog.footer.marker(source);
        if (index < 0) return source.length;
        const block = source.lastIndexOf("\n\n", index);
        const paragraph = source.toLowerCase().lastIndexOf("<p", index);
        return Math.max(block >= 0 ? block + 2 : -1, paragraph, 0);
      },
    },
    spacing: {
      left(value = "") {
        return String(value || "")
          .replace(/[ \t]+$/g, "")
          .replace(/\n+$/g, "");
      },
      right(value = "") {
        return String(value || "")
          .replace(/^[ \t]+/g, "")
          .replace(/^\n+/g, "");
      },
      join(left = "", right = "", shortcode = "") {
        const before = left ? "\n\n" : "";
        const after = right ? "\n" : "";
        return `${left}${before}${shortcode}${after}${right}`;
      },
    },
    document: {
      insert(value = "", id = "") {
        const shortcode = catalog.shortcode.build(id);
        const clean = catalog.shortcode.clean(value);
        const point = catalog.footer.point(clean);
        const left = catalog.spacing.left(clean.slice(0, point));
        const right = catalog.spacing.right(clean.slice(point));
        return catalog.spacing.join(left, right, shortcode);
      },
      change(id = "") {
        return (state = {}) => {
          const shortcode = catalog.shortcode.build(id);
          const next = catalog.document.insert(state.value, id);
          if (next === state.value) return null;
          const caret = Math.min(
            next.length,
            next.indexOf(shortcode) + shortcode.length,
          );
          return {
            value: next,
            start: caret,
            end: caret,
          };
        };
      },
    },
    context: {
      site() {
        const host = location.hostname;
        if (host.startsWith("auto.")) return "auto";
        if (host.startsWith("tech.")) return "tech";
        if (host.startsWith("realt.")) return "realt";
        if (host.startsWith("people.")) return "people";
        if (host.startsWith("money.")) return "money";
        if (host.startsWith("sport.")) return "sport";
        return "";
      },
      postId() {
        const url = new URL(location.href);
        const fromUrl = String(url.searchParams.get("post") || "").trim();
        const fromDom = String(
          document.querySelector("#post_ID")?.value ||
            document.querySelector('input[name="post_ID"]')?.value ||
            "",
        ).trim();
        if (/^\d+$/.test(fromUrl)) return fromUrl;
        if (/^\d+$/.test(fromDom)) return fromDom;
        return "";
      },
      url() {
        const id = catalog.context.postId();
        if (!id) return { value: location.href, persistent: false };
        return {
          value: `${location.origin}/wp-admin/post.php?post=${encodeURIComponent(id)}`,
          persistent: true,
        };
      },
      title() {
        return String(
          document.querySelector("#title")?.value ||
            document.querySelector('input[name="post_title"]')?.value ||
            "",
        ).trim();
      },
      special() {
        return Boolean(document.querySelector("#specialArticle")?.checked);
      },
      article() {
        const element = api.editor.sync();
        const html = String(element?.value || "");
        return {
          html,
          text: contentMarkup.strip(html).replace(/\s+/g, " ").trim(),
        };
      },
      build() {
        const article = catalog.context.article();
        const url = catalog.context.url();
        return {
          site: catalog.context.site(),
          url: url.value,
          title: catalog.context.title(),
          text: article.text,
          is_special_project: catalog.context.special(),
          requested_products_count: 2,
          excluded_category_keys: [
            ...catalog.state.inserted,
            ...catalog.state.excluded,
          ],
          avoid_article_category_repeats: url.persistent,
          client_debug: {
            text_source: "editor_sync_markup_strip",
            text_length: article.text.length,
          },
        };
      },
    },
    request: {
      async json(url = "", options = {}) {
        const response = await fetch(url, options);
        const json = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(json?.reason || `HTTP ${response.status}`);
        }
        if (!json) throw new Error("Сервер вернул некорректный JSON");
        return json;
      },
      async suggest() {
        const payload = catalog.context.build();
        if (!payload.site) throw new Error("Не удалось определить раздел Onliner");
        if (!payload.title && !payload.text) {
          throw new Error("Не удалось получить текст статьи");
        }
        const json = await catalog.request.json(catalog.endpoint.suggest, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (json.decision === "skip") return json;
        if (!json.ok) throw new Error(json.reason || "Не удалось подобрать виджет");
        if (json.decision !== "insert" || !json.widget_config) {
          throw new Error("Сервер вернул неизвестный ответ");
        }
        return json;
      },
      async widget(config = {}) {
        const body = new URLSearchParams();
        body.set("type", "catalog");
        body.set("config[type]", "products");
        body.set("config[search_url]", "");
        body.set("config[main_image]", "");
        body.set("config[mobile_image]", "");
        body.set("config[image_alt]", "");
        body.set("config[image_link]", "");
        body.set("config[compare]", config.compare || "0");
        body.set("config[highlight]", config.highlight || "0");
        body.set("config[right_link]", config.right_link || "");
        body.set("config[right_title]", config.right_title || "");
        body.set("config[label]", "");
        body.set("config[title]", "");
        body.set("config[bg_color]", "#FFFFFF");
        body.set("config[super_prices]", "0");
        body.set("config[button_text]", "");
        body.set("config[button_url]", "");
        (config.products || []).forEach((id) => {
          body.append("config[products][]", id);
        });
        const response = await fetch(catalog.endpoint.widget, {
          method: "POST",
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            Accept: "application/json, text/javascript, */*; q=0.01",
            "X-Requested-With": "XMLHttpRequest",
          },
          body,
        });
        const text = await response.text();
        if (!response.ok) {
          throw new Error(`/admin/widget HTTP ${response.status}: ${text.slice(0, 300)}`);
        }
        const json = JSON.parse(text);
        if (json?.error) throw new Error(json.message || "/admin/widget error=true");
        if (!json?.id) throw new Error("/admin/widget не вернул id");
        return json;
      },
      feedback(suggestion = null, event = "", details = {}) {
        const logId = Number(suggestion?.debug?.log_id || 0);
        if (!Number.isInteger(logId) || logId <= 0 || !event) return false;
        fetch(catalog.endpoint.feedback, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          keepalive: true,
          body: JSON.stringify({
            log_id: logId,
            event,
            selected_category_key: String(
              suggestion?.debug?.category_key || "",
            ).trim(),
            details,
          }),
        }).catch(() => false);
        return true;
      },
    },
    insert: {
      visual(id = "") {
        const editor = api.editor.tiny();
        if (!editor || typeof editor.execCommand !== "function") return false;
        try {
          editor.execCommand("insert-onliner-catalog", false, String(id));
          editor.save?.();
          editor.nodeChanged?.();
          return true;
        } catch {
          return false;
        }
      },
      fallback(id = "") {
        return api.editor.document(catalog.document.change(id));
      },
      run(id = "") {
        if (api.editor.visual() && catalog.insert.visual(id)) return true;
        return catalog.insert.fallback(id);
      },
    },
    preview: {
      node() {
        return document.getElementById(catalog.ids.panel);
      },
      close() {
        const root = catalog.preview.node();
        if (!root) return false;
        root.remove();
        return true;
      },
      button(action = "", title = "", fluent = "", fallback = "") {
        return ui.controls.button({
          fluent,
          fallback,
          action: `catalog.${action}`,
          title,
          attrs: ` type="button" aria-label="${ui.controls.escape(title)}"`,
        });
      },
      html(suggestion = null, status = "") {
        const message = ui.controls.escape(
          status || suggestion?.message || suggestion?.reason || "",
        ).replace(/\n/g, "<br>");
        const retry = catalog.preview.button(
          "retry",
          "Подобрать заново",
          "Arrow Sync",
          "Arrow Clockwise",
        );
        const insert = catalog.preview.button(
          "insert",
          "Вставить",
          "Checkmark Circle",
          "Checkmark",
        );
        const close = ui.controls.chrome({
          theme: "dark",
          closeAction: "catalog.cancel",
          closeHotkey: ux.hotkeys.action.close.label(),
        });
        const actions = ui.shell.strip(`${retry}${insert}`, {
          classes: "catalog-widget-actions",
        });
        const head = ui.shell.frame({
          classes: "catalog-widget-head",
          left: ui.controls.message({
            text: "Каталог",
            classes: "catalog-widget-title",
          }),
          main: actions,
          right: close,
          pack: "spread",
        });
        const body = ui.shell.row(
          `<div data-catalog-widget-message="true">${message}</div>`,
          ' data-catalog-widget-body="true"',
        );
        return ui.shell.stack(`${head}${body}`);
      },
      sync(root = catalog.preview.node(), suggestion = null, status = "") {
        if (!root) return false;
        root.innerHTML = catalog.preview.html(suggestion, status);
        root.dataset.busy = catalog.state.busy ? "true" : "false";
        root.querySelectorAll("button").forEach((button) => {
          if (button.dataset.action === "catalog.cancel") return;
          button.disabled = catalog.state.busy || suggestion?.decision !== "insert";
        });
        return true;
      },
      bind(root = catalog.preview.node()) {
        if (!root || root.dataset.catalogBound === "true") return false;
        root.dataset.catalogBound = "true";
        root.addEventListener("click", (event) => {
          const action = event.target?.closest?.("[data-action]")?.dataset?.action;
          if (action === "catalog.cancel") return catalog.cancel();
          if (action === "catalog.retry") return catalog.retry();
          if (action === "catalog.insert") return catalog.apply();
          return false;
        });
        root.addEventListener("keydown", (event) => {
          if (event.key === "Escape") catalog.cancel();
        });
        return true;
      },
      show(suggestion = null, status = "") {
        let root = catalog.preview.node();
        if (!root) {
          root = host.create({
            id: catalog.ids.panel,
            className: "panel catalog-widget-panel",
            html: catalog.preview.html(suggestion, status),
            draggable: true,
          });
          root.dataset.uiSurface = "toolbar";
          root.dataset.uiFrame = "capsule";
          root.dataset.toolbarFlow = "stack";
          root.dataset.theme = "dark";
          root.dataset.panelDragHandle = "true";
          ui.surface.sync(root, {
            layout: "floating",
            theme: "dark",
            surface: "toolbar",
          });
          toolbar.center(root, 16);
          catalog.preview.bind(root);
        } else {
          catalog.preview.sync(root, suggestion, status);
        }
        return root;
      },
    },
    category(suggestion = null) {
      return String(suggestion?.debug?.category_key || "").trim();
    },
    async load() {
      if (catalog.state.busy) return false;
      catalog.state.busy = true;
      catalog.preview.show(catalog.state.suggestion, "Подбираем виджет…");
      try {
        const suggestion = await catalog.request.suggest();
        catalog.state.suggestion = suggestion;
        catalog.state.busy = false;
        catalog.preview.sync(catalog.preview.node(), suggestion);
        return true;
      } catch (error) {
        catalog.state.busy = false;
        catalog.preview.sync(
          catalog.preview.node(),
          null,
          `Ошибка: ${error?.message || error}`,
        );
        return false;
      }
    },
    retry() {
      const suggestion = catalog.state.suggestion;
      const key = catalog.category(suggestion);
      if (key) catalog.state.excluded.add(key);
      catalog.request.feedback(suggestion, "retry");
      catalog.state.suggestion = null;
      return catalog.load();
    },
    cancel() {
      catalog.request.feedback(catalog.state.suggestion, "cancelled");
      catalog.state.suggestion = null;
      catalog.state.excluded.clear();
      return catalog.preview.close();
    },
    async apply() {
      if (catalog.state.busy || catalog.state.suggestion?.decision !== "insert") {
        return false;
      }
      catalog.state.busy = true;
      catalog.preview.sync(
        catalog.preview.node(),
        catalog.state.suggestion,
        "Создаём виджет…",
      );
      try {
        const suggestion = catalog.state.suggestion;
        const created = await catalog.request.widget(suggestion.widget_config);
        const id = String(created.id);
        const inserted = catalog.insert.run(id);
        if (!inserted) {
          throw new Error(`Виджет создан, но не вставлен. ID=${id}`);
        }
        const key = catalog.category(suggestion);
        if (key) catalog.state.inserted.add(key);
        catalog.request.feedback(suggestion, "inserted", { widget_id: id });
        catalog.state.suggestion = null;
        catalog.state.excluded.clear();
        catalog.state.busy = false;
        catalog.preview.close();
        return true;
      } catch (error) {
        catalog.state.busy = false;
        catalog.preview.sync(
          catalog.preview.node(),
          catalog.state.suggestion,
          `Ошибка: ${error?.message || error}`,
        );
        return false;
      }
    },
    run() {
      catalog.state.excluded.clear();
      return catalog.load();
    },
  };
  return catalog;
};
