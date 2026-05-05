export const tag = {
  exclude: ["-сп", "сп-"],
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
  lower: (value) => /^[\u0430-\u044f\u0451a-z]/u.test(value),
  upper: (value) =>
    value.replace(/^([\u0430-\u044f\u0451a-z])/u, (letter) =>
      letter.toLocaleUpperCase("ru-RU"),
    ),
  ignored(value) {
    const lower = value.toLocaleLowerCase("ru-RU");
    return this.exclude.some((item) => lower.includes(item));
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
  async rename(name) {
    const next = this.upper(name);
    try {
      const html = await fetch(this.search(name), {
        credentials: "same-origin",
      }).then((response) => response.text());
      const doc = this.parse(html);
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
      const response = await fetch(`${this.admin()}admin-ajax.php`, {
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
        "✔️ Исправлено:\n" +
        ok.map((result) => `${result.old} → ${result.next}`).join("\n");
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
