export const attachPost = (admin, deps = {}) => {
  const field = deps.field;
  const tag = deps.tag;
  const contentMarkup = deps.contentMarkup;
  const post = {
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
    draft: {
      key: "launchpad-editorial-draft-json",
      transferKey: "launchpad-editorial-draft-transfer",
      transferTtl: 10 * 60 * 1000,
      routeMode: "test",
      testSection: "gomelnews",
      routeModeValue(value = {}) {
        const text = String(value.route_mode || value.target?.route_mode || value.target?.routeMode || "").trim().toLocaleLowerCase("ru-RU");
        return text === "live" || text === "test" ? text : admin.draft.routeMode;
      },
      sectionHosts: {
        people: "people.onliner.by",
        auto: "auto.onliner.by",
        tech: "tech.onliner.by",
        realt: "realt.onliner.by",
        money: "money.onliner.by",
        sport: "sport.onliner.by",
        gomelnews: "gomelnews.onliner.by",
      },
      newUrl() {
        return `${location.origin}/wp-admin/post-new.php`;
      },
      onNewPost() {
        const path = new URL(location.href).pathname;
        return path.endsWith("/wp-admin/post-new.php");
      },
      host(root = document) {
        const view = root?.defaultView || window;
        return String(view.location?.hostname || location.hostname || "").replace(/^www\./i, "");
      },
      section(value = {}) {
        const text = String(value.target?.section || "").trim().toLocaleLowerCase("ru-RU");
        return Object.prototype.hasOwnProperty.call(admin.draft.sectionHosts, text) ? text : "";
      },
      routeSection(value = {}) {
        const section = admin.draft.section(value);
        if (!section) return "";
        return admin.draft.routeModeValue(value) === "test" ? admin.draft.testSection : section;
      },
      sectionUrl(section = "") {
        const host = admin.draft.sectionHosts[String(section || "")];
        return host ? `https://${host}/wp-admin/post-new.php?launchpadDraft=1` : "";
      },
      routeUrl(value = {}) {
        return admin.draft.sectionUrl(admin.draft.routeSection(value));
      },
      routeNeeded(value = {}, root = document) {
        const section = admin.draft.routeSection(value);
        if (!section) return false;
        return admin.draft.host(root) !== admin.draft.sectionHosts[section];
      },
      routeMessage(value = {}, root = document) {
        const section = admin.draft.section(value);
        const route = admin.draft.routeSection(value);
        if (!section || admin.draft.routeModeValue(value) !== "test") return false;
        if (admin.draft.host(root) !== admin.draft.sectionHosts[route]) return false;
        if (section === route) return false;
        admin.draft.notice(root, [
          "Тестовый режим Launchpad.",
          "",
          `Правильный раздел по taxonomy: ${section}.`,
          `Черновик открыт здесь для теста: ${route}.`,
        ].join("\n"));
        return true;
      },
      validate(value) {
        if (!value || typeof value !== "object") {
          throw new Error("draft.json не прочитан");
        }
        if (value.schema !== "draft.v1") {
          throw new Error("Нужен draft.v1");
        }
        if (String(value.fields?.title || "").trim() === "") {
          throw new Error("В draft.json нет fields.title");
        }
        if (String(value.fields?.content_html || "").trim() === "") {
          throw new Error("В draft.json нет fields.content_html");
        }
        return value;
      },
      read(file) {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            try {
              resolve(admin.draft.validate(JSON.parse(String(reader.result || ""))));
            } catch (error) {
              reject(error);
            }
          };
          reader.onerror = () => reject(new Error("Не удалось прочитать draft.json"));
          reader.readAsText(file);
        });
      },
      choose() {
        return new Promise((resolve) => {
          const input = document.createElement("input");
          input.type = "file";
          input.accept = "application/json,.json";
          input.hidden = true;
          input.addEventListener("change", () => resolve(input.files?.[0] || null), { once: true });
          document.body.appendChild(input);
          input.click();
          setTimeout(() => input.remove(), 1000);
        });
      },
      store(value) {
        const raw = JSON.stringify(value);
        sessionStorage.setItem(admin.draft.key, raw);
        localStorage.setItem(admin.draft.key, raw);
      },
      peek() {
        const raw = sessionStorage.getItem(admin.draft.key) || localStorage.getItem(admin.draft.key) || "";
        if (!raw) return null;
        return admin.draft.validate(JSON.parse(raw));
      },
      clear() {
        sessionStorage.removeItem(admin.draft.key);
        localStorage.removeItem(admin.draft.key);
        return true;
      },
      transferPayload(value) {
        return JSON.stringify({
          source: "launchpad",
          type: admin.draft.transferKey,
          created: Date.now(),
          draft: admin.draft.validate(value),
        });
      },
      transferSet(view = window, value) {
        if (!view) return false;
        view.name = admin.draft.transferPayload(value);
        return true;
      },
      transferRead(view = window) {
        const raw = String(view.name || "");
        if (!raw.includes(admin.draft.transferKey)) return null;
        const value = JSON.parse(raw);
        if (value?.source !== "launchpad" || value?.type !== admin.draft.transferKey) return null;
        if (Date.now() - Number(value.created || 0) > admin.draft.transferTtl) return null;
        return admin.draft.validate(value.draft);
      },
      transferClear(view = window) {
        try {
          if (admin.draft.transferRead(view)) view.name = "";
        } catch {
          view.name = "";
        }
        return true;
      },
      transferTake(view = window) {
        const value = admin.draft.transferRead(view);
        if (!value) return null;
        admin.draft.transferClear(view);
        return value;
      },
      route(value, target = null) {
        const url = admin.draft.routeUrl(value);
        if (!url) return false;
        if (target && !target.closed) {
          try {
            admin.draft.transferSet(target, value);
            target.location.href = url;
            target.focus?.();
            return true;
          } catch {}
        }
        admin.draft.transferSet(window, value);
        location.href = url;
        return true;
      },
      take() {
        const value = admin.draft.peek();
        if (!value) return null;
        admin.draft.clear();
        return value;
      },
      visualReady(root = document) {
        const wrap = root.querySelector("#wp-content-wrap");
        if (!wrap?.classList?.contains?.("tmce-active")) return true;
        const view = root?.defaultView || window;
        const editor =
          view.tinyMCE?.get?.("content") || view.tinyMCE?.activeEditor || null;
        if (!editor) return false;
        if (typeof editor.isHidden === "function") return !editor.isHidden();
        return true;
      },
      ready(root = document) {
        if (!root.querySelector("#title") || !root.querySelector("#content")) {
          return false;
        }
        if ((root.readyState || "").toLowerCase() !== "complete") return false;
        return admin.draft.visualReady(root);
      },
      notice(root = document, message = "") {
        const view = root?.defaultView || window;
        view.alert?.(message);
        return true;
      },
      emit(element) {
        const view = element?.ownerDocument?.defaultView || window;
        element.dispatchEvent(new view.Event("input", { bubbles: true }));
        element.dispatchEvent(new view.Event("change", { bubbles: true }));
      },
      setter(element) {
        const view = element?.ownerDocument?.defaultView || window;
        if (!element || !view) return null;
        if (element.tagName === "TEXTAREA") {
          return Object.getOwnPropertyDescriptor(
            view.HTMLTextAreaElement?.prototype,
            "value",
          )?.set;
        }
        if (element.tagName === "SELECT") {
          return Object.getOwnPropertyDescriptor(
            view.HTMLSelectElement?.prototype,
            "value",
          )?.set;
        }
        return Object.getOwnPropertyDescriptor(
          view.HTMLInputElement?.prototype,
          "value",
        )?.set;
      },
      write(element, value = "") {
        if (!element) return false;
        const setter = admin.draft.setter(element);
        if (setter) {
          setter.call(element, String(value || ""));
          return true;
        }
        element.value = String(value || "");
        return true;
      },
      refresh(element) {
        const view = element?.ownerDocument?.defaultView || window;
        element.dispatchEvent(new view.Event("keyup", { bubbles: true }));
        admin.draft.emit(element);
      },
      focus(element) {
        if (!element) return false;
        element.focus?.();
        return true;
      },
      input(element, value = "") {
        if (!element) return false;
        admin.draft.write(element, value);
        admin.draft.emit(element);
        return true;
      },
      title(value = "", root = document) {
        const text = String(value || "").trim();
        const target = root.querySelector("#title");
        if (!text || !target) return false;
        admin.draft.focus(target);
        admin.draft.input(target, text);
        admin.draft.refresh(target);
        admin.draft.focus(target);
        return true;
      },
      click(element) {
        element?.click?.();
        return Boolean(element);
      },
      check(element, value = true) {
        if (!element) return false;
        if (element.checked !== Boolean(value)) admin.draft.click(element);
        element.checked = Boolean(value);
        admin.draft.emit(element);
        return true;
      },
      set(selector, value, root = document) {
        const text = String(value || "").trim();
        const target = root.querySelector(selector);
        if (!text || !target) return false;
        admin.draft.input(target, text);
        return true;
      },
      slugValue(value = "") {
        return admin.fields.slug.snapshot(value).value;
      },
      slug(value = "", root = document) {
        const text = admin.draft.slugValue(value);
        if (!text) return false;
        const input = root.querySelector("input[name='post_name'],#post_name");
        const visible = root.querySelector("#editable-post-name");
        const full = root.querySelector("#editable-post-name-full");
        if (input) admin.draft.input(input, text);
        if (visible) {
          visible.textContent = text;
          visible.title = text;
        }
        if (full) full.textContent = text;
        return Boolean(input || visible || full);
      },
      rotation(values = [], root = document) {
        const list = values
          .map((value) => String(value || "").trim())
          .filter(Boolean)
          .slice(0, 3);
        if (!list.length) return false;
        while (root.querySelectorAll('input[name="rotation_titles[]"]').length < list.length) {
          const before = root.querySelectorAll('input[name="rotation_titles[]"]').length;
          root.querySelector("#rotation-titles-add")?.click();
          if (root.querySelectorAll('input[name="rotation_titles[]"]').length === before) break;
        }
        [...root.querySelectorAll('input[name="rotation_titles[]"]')]
          .slice(0, list.length)
          .forEach((input, index) => admin.draft.input(input, list[index]));
        return true;
      },
      async tag(name = "", root = document) {
        const value = String(name || "").trim();
        if (!value) return null;
        if (tag.has(value, root)) return { status: "present", name: value };
        const found = await tag.find(value);
        if (!found?.name) return { status: "missed", name: value };
        if (tag.has(found.name, root)) return { status: "present", name: found.name };
        const input = root.querySelector("#new-tag-post_tag");
        const button = root.querySelector("#post_tag .tagadd");
        if (!input || !button) return { status: "missed", name: value };
        admin.draft.input(input, found.name);
        admin.draft.click(button);
        return { status: "applied", name: found.name, source: value };
      },
      async tags(values = [], root = document) {
        const list = tag.unique(
          values.map((value) => String(value || "").trim()).filter(Boolean),
        );
        const result = { applied: [], missed: [] };
        for (const name of list) {
          const current = await admin.draft.tag(name, root);
          if (["applied", "present"].includes(current?.status)) result.applied.push(current.name);
          if (current?.status === "missed") result.missed.push(current.name);
        }
        return result;
      },
      category(name = "", root = document) {
        const value = String(name || "").trim().toLocaleLowerCase("ru-RU");
        if (!value) return false;
        const item = [...root.querySelectorAll("#categorychecklist label")]
          .find((label) => String(label.textContent || "").trim().toLocaleLowerCase("ru-RU") === value);
        const input = item?.querySelector?.('input[type="checkbox"]') || item?.closest?.("li")?.querySelector?.('input[type="checkbox"]');
        if (!input) return false;
        admin.draft.check(input, true);
        return true;
      },
      categories(values = [], root = document) {
        const list = [].concat(values || [])
          .map((value) => String(value || "").trim())
          .filter(Boolean);
        const missed = list.filter((name) => !admin.draft.category(name, root));
        return { selected: list.length - missed.length, missed };
      },
      layout(value = "", root = document) {
        const select = root.querySelector("#layout_select");
        if (!select) return false;
        const target = String(value || "news").trim();
        if (![...select.options].some((option) => option.value === target)) return false;
        admin.draft.input(select, target);
        return true;
      },
      syncContent(root = document, value = "") {
        const view = root?.defaultView || window;
        const editor =
          view.tinyMCE?.get?.("content") || view.tinyMCE?.activeEditor || null;
        if (!editor) return false;
        if (typeof editor.isHidden === "function" && editor.isHidden()) {
          return false;
        }
        editor.setContent?.(String(value || ""));
        editor.save?.();
        return true;
      },
      content(value, layout = "news", root = document) {
        const html = contentMarkup
          .process(String(value || ""), false, layout)
          .trim();
        const target = root.querySelector("#content");
        if (!target) return false;
        admin.draft.input(target, html);
        admin.draft.syncContent(root, html);
        return true;
      },
      boolean(value) {
        if (value === true || value === false) return value;
        const text = String(value ?? "").trim().toLocaleLowerCase("ru-RU");
        if (["1", "true", "on", "yes", "да"].includes(text)) return true;
        if (["0", "false", "off", "no", "нет"].includes(text)) return false;
        return null;
      },
      optionMap: {
        enableComments: "#enableComments",
        enableReactions: "#enableReactions",
        includeDzen: "#includeDzen",
        juicyVideo: "#juicyVideo",
        updated: "#updated",
        livecast: "#livecast",
        mainPageFavorite: "#mainPageFavorite",
        mark_on_list_page: "#mark_on_list_page",
        markOnListPage: "#mark_on_list_page",
        specialArticle: "#specialArticle",
        show_title_under_photo: "#show_title_under_photo",
        showTitleUnderPhoto: "#show_title_under_photo",
        enable_parallax: "#enable_parallax",
        enableParallax: "#enable_parallax",
      },
      options(values = {}, root = document) {
        const missed = [];
        Object.entries(admin.draft.optionMap).forEach(([name, selector]) => {
          if (!Object.prototype.hasOwnProperty.call(values || {}, name)) return;
          const value = admin.draft.boolean(values[name]);
          if (value === null) return;
          const input = root.querySelector(selector);
          if (!input) {
            missed.push(name);
            return;
          }
          admin.draft.check(input, value);
        });
        return { missed };
      },
      auditLine(value) {
        if (!value) return "";
        if (typeof value !== "object") return String(value || "").trim();
        const label = String(value.label || value.title || value.name || "").trim();
        const url = String(value.url || value.href || value.link || "").trim();
        if (label && url) return `${label} — ${url}`;
        if (url) return url;
        if (label) return label;
        try {
          return JSON.stringify(value);
        } catch {
          return "";
        }
      },
      audit(value = {}, root = document) {
        const audit = value.audit || {};
        const notes = [
          ...[].concat(audit.source_links || []),
          ...[].concat(audit.fact_check_notes || []),
          ...[].concat(audit.risk_notes || []),
          ...[].concat(audit.editor_todo || []),
        ]
          .map(admin.draft.auditLine)
          .filter(Boolean);
        if (!notes.length) return false;
        admin.draft.notice(root, `Проверить перед публикацией:\n\n${notes.join("\n")}`);
        return true;
      },
      async apply(value, root = document) {
        const draft = admin.draft.validate(value);
        const fields = draft.fields || {};
        const target = draft.target || {};
        const layout = String(target.layout || "news");
        const categories = [].concat(target.categories || target.section || []);
        admin.draft.layout(layout, root);
        admin.draft.routeMessage(draft, root);
        const categoryResult = admin.draft.categories(categories, root);
        const optionResult = admin.draft.options(draft.options || {}, root);
        admin.draft.title(fields.title, root);
        admin.draft.slug(fields.slug, root);
        admin.draft.rotation(fields.rotation_titles || [], root);
        admin.draft.set('#seo_title,#yoast_wpseo_title,input[name="seo_title"],input[name="yoast_wpseo_title"]', fields.seo_title, root);
        admin.draft.set('#excerpt,textarea[name="excerpt"]', fields.excerpt || fields.lead, root);
        admin.draft.content(fields.content_html, layout, root);
        const tagResult = await admin.draft.tags(fields.tags || [], root);
        admin.draft.audit(draft, root);
        if (categoryResult.missed.length) {
          admin.draft.notice(root, ["Рубрики не найдены:", "", ...categoryResult.missed].join("\n"));
        }
        if (tagResult.missed.length) {
          admin.draft.notice(root, ["Метки не найдены в разделе:", "", ...tagResult.missed].join("\n"));
        }
        if (optionResult.missed.length) {
          admin.draft.notice(root, ["Опции не найдены:", "", ...optionResult.missed].join("\n"));
        }
        return true;
      },
      popup() {
        try {
          return window.open(admin.draft.newUrl(), "_blank");
        } catch {
          return null;
        }
      },
      async applyWindow(value, target, attempts = 80) {
        if (!target || target.closed) {
          admin.draft.store(value);
          location.href = admin.draft.newUrl();
          return true;
        }
        try {
          const root = target.document;
          if (root?.location?.pathname?.endsWith("/wp-admin/post-new.php") && admin.draft.ready(root)) {
            const applied = await admin.draft.apply(value, root);
            if (applied) admin.draft.clear();
            target.focus?.();
            return true;
          }
        } catch {}
        if (attempts <= 0) {
          admin.draft.store(value);
          target.location.href = admin.draft.newUrl();
          target.focus?.();
          return true;
        }
        setTimeout(() => admin.draft.applyWindow(value, target, attempts - 1), 250);
        return true;
      },
      async open(value, target = null) {
        const draft = admin.draft.validate(value);
        admin.draft.store(draft);
        if (admin.draft.onNewPost()) {
          const applied = await admin.draft.apply(draft, document);
          if (applied) admin.draft.clear();
          return applied;
        }
        if (admin.draft.routeNeeded(draft, document)) return admin.draft.route(draft, target);
        if (target && !target.closed) {
          try {
            admin.draft.transferSet(target, draft);
            target.location.href = admin.draft.newUrl();
            target.focus?.();
            return true;
          } catch {}
        }
        location.href = admin.draft.newUrl();
        return true;
      },
      async restore(attempts = 30) {
        if (!admin.draft.onNewPost()) return false;
        try {
          const transferred = admin.draft.transferTake();
          if (transferred) admin.draft.store(transferred);
          const value = admin.draft.peek();
          if (!value) return false;
          if (!admin.draft.ready(document)) {
            if (attempts <= 0) return false;
            setTimeout(() => admin.draft.restore(attempts - 1), 250);
            return true;
          }
          const applied = await admin.draft.apply(value, document);
          if (applied) admin.draft.clear();
          return applied;
        } catch (error) {
          admin.draft.clear();
          admin.draft.transferClear();
          field.alert(error.message);
          return false;
        }
      },
      async run() {
        try {
          if (await admin.draft.restore()) return true;
          const file = await admin.draft.choose();
          if (!file) return false;
          const value = await admin.draft.read(file);
          const target = admin.draft.onNewPost() ? null : admin.draft.popup();
          return admin.draft.open(value, target);
        } catch (error) {
          field.alert(error.message);
          return false;
        }
      },
    },
  };
  admin.dump = post.dump;
  admin.draft = post.draft;
};
