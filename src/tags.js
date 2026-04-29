(async () => {
  const admin = `${location.origin}/wp-admin/`;

  const upper = (value) =>
    value.replace(/^([а-яёa-z])/u, (letter) =>
      letter.toLocaleUpperCase("ru-RU"),
    );

  const isLowerTag = (value) => /^[а-яёa-z]/u.test(value);

  const tagsInput = document.querySelector("#tax-input-post_tag");

  const originalTags = (tagsInput?.value || "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);

  const targets = [...new Set(originalTags.filter(isLowerTag))];

  if (!targets.length) {
    alert("✅ Метки норм");
    return;
  }

  const parse = (html) => new DOMParser().parseFromString(html, "text/html");

  const updateTag = async (name) => {
    const next = upper(name);

    if (!confirm(`Поменять метку?\n\n${name} → ${next}`)) {
      return { status: "skip", name };
    }

    try {
      const searchUrl =
        `${admin}edit-tags.php?taxonomy=post_tag&post_type=post&s=` +
        encodeURIComponent(name);

      const html = await fetch(searchUrl, {
        credentials: "same-origin",
      }).then((r) => r.text());

      const doc = parse(html);

      const rows = Array.from(doc.querySelectorAll("tr[id^='tag-']"));

      const row = rows.find((item) => {
        const title =
          item.querySelector(".row-title")?.textContent ||
          item.querySelector(".column-name strong")?.textContent ||
          "";

        return (
          title.trim().toLocaleLowerCase("ru-RU") ===
          name.toLocaleLowerCase("ru-RU")
        );
      });

      if (!row) throw new Error("не найдена");

      const id = row.id.match(/\d+/)?.[0];
      const slug = row.querySelector(".column-slug")?.textContent.trim() || "";
      const nonce = doc.querySelector("#_inline_edit")?.value;

      if (!id || !nonce) throw new Error("нет id/nonce");

      const body = new URLSearchParams({
        action: "inline-save-tax",
        tax_ID: id,
        taxonomy: "post_tag",
        post_type: "post",
        name: next,
        slug,
        _inline_edit: nonce,
      });

      const response = await fetch(`${admin}admin-ajax.php`, {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body,
      });

      const result = await response.text();

      if (!response.ok || /error|ошибка/i.test(result)) {
        throw new Error("не сохранилась");
      }

      // вкладка проверки
      window.open(
        `${admin}edit-tags.php?taxonomy=post_tag&post_type=post&s=${encodeURIComponent(next)}`,
        "_blank",
      );

      return { status: "ok", old: name, next };
    } catch (e) {
      return { status: "error", name, error: e.message };
    }
  };

  const results = [];

  for (const tag of targets) {
    results.push(await updateTag(tag));
  }

  // 🔥 обновляем поле ОДИН раз
  if (tagsInput) {
    tagsInput.value = originalTags
      .map((tag) => {
        const r = results.find((x) => x.old === tag && x.status === "ok");
        return r ? r.next : tag;
      })
      .join(", ");
  }

  // отчёт
  const ok = results.filter((r) => r.status === "ok");
  const skip = results.filter((r) => r.status === "skip");
  const err = results.filter((r) => r.status === "error");

  let msg = "";

  if (ok.length) {
    msg +=
      "✅ Исправлено:\n" +
      ok.map((r) => `${r.old} → ${r.next}`).join("\n") +
      "\n\n";
  }

  if (skip.length) {
    msg += "⏭️ Пропущено:\n" + skip.map((r) => r.name).join("\n") + "\n\n";
  }

  if (err.length) {
    msg += "⚠️ Ошибки:\n" + err.map((r) => `${r.name} — ${r.error}`).join("\n");
  }

  alert(msg || "Ок");
})();
