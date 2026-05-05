import { frame } from "./core/panel.js";
import { skin } from "./core/panel.skin.js";

(async () => {
  const TEST_URL =
    "https://money.onliner.by/wp-admin/post.php?post=267075&action=edit";
  const TEST_ID = "267075";
  const KEY = "BML_CLONE_POST_V3";

  const cssEscape = (s) =>
    window.CSS && CSS.escape
      ? CSS.escape(s)
      : String(s).replace(/["\\]/g, "\\$&");

  const clearState = () => {
    if (window.name.startsWith(KEY + ":")) window.name = "";
  };

  const panel = (text, type = "work") => {
    frame.mount("clone-style", skin.clone);
    document.querySelector("#clone-panel")?.remove();

    const box = document.createElement("div");
    box.id = "clone-panel";
    box.className = "panel clone-panel";
    box.dataset.tone = type;
    box.textContent = text;
    document.body.appendChild(box);
  };

  const fail = (text) => {
    clearState();
    panel(text + "\n\n↩ Возвращаюсь в тестовую…", "error");
    alert(text);

    if (location.href.split("#")[0] !== TEST_URL) {
      location.href = TEST_URL;
    }
  };

  const form = document.querySelector("#post");
  const postId = document.querySelector("#post_ID")?.value;
  const here = location.href.split("#")[0];

  if (!form) {
    fail("⛔ Не вижу форму записи");
    return;
  }

  const isStrictEditUrl = (url) => {
    try {
      const u = new URL(String(url || "").trim(), location.href);

      return (
        u.protocol === "https:" &&
        u.pathname === "/wp-admin/post.php" &&
        /^\d+$/.test(u.searchParams.get("post") || "") &&
        u.searchParams.get("action") === "edit"
      );
    } catch (e) {
      return false;
    }
  };

  const toEditUrl = (url, strict = false) => {
    const raw = String(url || "").trim();

    if (strict && !isStrictEditUrl(raw)) {
      throw new Error(
        "В буфере не админская ссылка вида /wp-admin/post.php?post=...&action=edit",
      );
    }

    const u = new URL(raw, location.href);

    if (u.pathname === "/wp-admin/post.php") {
      const id = u.searchParams.get("post");

      if (!/^\d+$/.test(id || "")) {
        throw new Error("В ссылке нет нормального post ID");
      }

      if (u.searchParams.get("action") !== "edit") {
        throw new Error("В ссылке нет action=edit");
      }

      return `${u.origin}/wp-admin/post.php?post=${id}&action=edit`;
    }

    if (strict) {
      throw new Error("В буфере не ссылка на админку редактирования");
    }

    const id = u.searchParams.get("p") || u.searchParams.get("post");

    if (!id || !/^\d+$/.test(id)) {
      throw new Error("Не понял ID записи из ссылки");
    }

    return `${u.origin}/wp-admin/post.php?post=${id}&action=edit`;
  };

  const skip = new Set([
    "_wpnonce",
    "_wp_http_referer",
    "action",
    "originalaction",
    "post_ID",
    "post_author",
    "user_ID",
    "post_status",
    "hidden_post_status",
    "original_post_status",
    "original_publish",
    "publish",
    "save",
    "visibility",
    "hidden_post_visibility",
    "hidden_post_password",
    "hidden_post_sticky",
    "sticky",
    "post_password",
    "aa",
    "mm",
    "jj",
    "hh",
    "mn",
    "ss",
    "hidden_aa",
    "hidden_mm",
    "hidden_jj",
    "hidden_hh",
    "hidden_mn",
    "hidden_ss",
    "cur_aa",
    "cur_mm",
    "cur_jj",
    "cur_hh",
    "cur_mn",
    "cur_ss",
    "autosavenonce",
    "meta-box-order-nonce",
    "closedpostboxesnonce",
    "samplepermalinknonce",
    "active_post_lock",
    "referredby",
  ]);

  const collect = () => {
    const data = {};

    form
      .querySelectorAll("input[name], textarea[name], select[name]")
      .forEach((el) => {
        const name = el.name;

        if (!name || skip.has(name)) return;
        if (["submit", "button", "file", "reset"].includes(el.type)) return;

        if (name.endsWith("[]")) {
          if (!data[name]) data[name] = { type: "array", values: [] };

          data[name].values.push({
            value: el.value,
            checked: el.checked,
            inputType: el.type,
          });

          return;
        }

        if (el.type === "radio") {
          if (el.checked) data[name] = { type: "radio", value: el.value };
          return;
        }

        if (el.type === "checkbox") {
          if (!data[name] || data[name].type !== "checkbox") {
            data[name] = { type: "checkbox", values: [] };
          }

          data[name].values.push({
            value: el.value,
            checked: el.checked,
          });

          return;
        }

        data[name] = {
          type: el.tagName.toLowerCase(),
          value: el.value,
        };
      });

    return data;
  };

  const setPrivate = () => {
    const privateRadio = document.querySelector("#visibility-radio-private");
    const hiddenVisibility = document.querySelector("#hidden-post-visibility");
    const password = document.querySelector("#post_password");
    const hiddenPassword = document.querySelector("#hidden-post-password");
    const stickyOff = document.querySelector(
      "input[name='sticky'][value='off']",
    );
    const hiddenSticky = document.querySelector("#hidden-post-sticky");
    const label = document.querySelector("#post-visibility-display");

    if (privateRadio) privateRadio.checked = true;
    if (hiddenVisibility) hiddenVisibility.value = "private";
    if (password) password.value = "";
    if (hiddenPassword) hiddenPassword.value = "";
    if (stickyOff) stickyOff.checked = true;
    if (hiddenSticky) hiddenSticky.checked = false;
    if (label) label.textContent = "Доступно по ссылке";
  };

  const apply = (data) => {
    let count = 0;

    Object.entries(data).forEach(([name, item]) => {
      const safeName = cssEscape(name);
      const els = document.querySelectorAll(`[name="${safeName}"]`);
      if (!els.length) return;

      if (item.type === "array") {
        item.values.forEach((saved, i) => {
          const el = els[i];
          if (!el) return;

          if (el.type === "checkbox" || el.type === "radio") {
            el.checked = saved.checked;
          } else {
            el.value = saved.value;
          }

          el.dispatchEvent(new Event("input", { bubbles: true }));
          el.dispatchEvent(new Event("change", { bubbles: true }));
          count++;
        });

        return;
      }

      if (item.type === "radio") {
        const safeValue = cssEscape(item.value);
        const el = document.querySelector(
          `[name="${safeName}"][value="${safeValue}"]`,
        );

        if (el) {
          el.checked = true;
          el.dispatchEvent(new Event("change", { bubbles: true }));
          count++;
        }

        return;
      }

      if (item.type === "checkbox") {
        item.values.forEach((saved) => {
          const el = [...els].find((x) => x.value === saved.value);
          if (!el) return;

          el.checked = saved.checked;
          el.dispatchEvent(new Event("change", { bubbles: true }));
          count++;
        });

        return;
      }

      els[0].value = item.value;
      els[0].dispatchEvent(new Event("input", { bubbles: true }));
      els[0].dispatchEvent(new Event("change", { bubbles: true }));
      count++;
    });

    if (data["tax_input[post_tag]"]) {
      const tags = document.querySelector("#tax-input-post_tag");
      if (tags && window.tagBox?.flushTags) {
        tagBox.flushTags(tags.closest(".tagsdiv"));
      }
    }

    setPrivate();
    clearState();

    panel(
      `✅ Готово\nЗаполнено полей: ${count}\nСохранения не было\nВидимость: доступно по ссылке`,
    );
  };

  const isTest = postId === TEST_ID && here === TEST_URL;

  try {
    const packed = window.name.startsWith(KEY + ":")
      ? window.name.slice(KEY.length + 1)
      : "";

    if (isTest && packed) {
      panel("3/3 Применяю данные к тестовой записи…");
      apply(JSON.parse(packed).data);
      return;
    }

    if (isTest) {
      panel("1/3 Проверяю буфер обмена…");

      let donor = "";

      try {
        const clip = (await navigator.clipboard.readText()).trim();
        const donorEditUrlFromClip = toEditUrl(clip, true);

        if (
          confirm(
            `В буфере есть ссылка на донор:\n${donorEditUrlFromClip}\n\nИспользовать ее?`,
          )
        ) {
          donor = clip;
        }
      } catch (e) {}

      if (!donor) {
        donor = prompt("🔁 Ссылка на запись-донор:");
        if (!donor) {
          panel("Отменено");
          clearState();
          return;
        }
      }

      const donorEditUrl = toEditUrl(donor);

      window.name =
        KEY +
        ":" +
        JSON.stringify({
          mode: "go",
          test: TEST_URL,
          donor: donorEditUrl,
        });

      location.href = donorEditUrl;
      return;
    }

    const state = window.name.startsWith(KEY + ":")
      ? JSON.parse(window.name.slice(KEY.length + 1))
      : null;

    if (!state || !state.donor) {
      fail("⛔ Сначала запусти букмарклет на тестовой записи");
      return;
    }

    panel("2/3 Это донор\nСобираю поля и возвращаюсь в тестовую…");

    window.name =
      KEY +
      ":" +
      JSON.stringify({
        mode: "apply",
        from: location.href,
        data: collect(),
      });

    location.href = TEST_URL;
  } catch (e) {
    fail("⛔ Ошибка: " + e.message);
  }
})();

