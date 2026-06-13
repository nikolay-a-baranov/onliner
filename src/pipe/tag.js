export const tag = {
  exclude: ["-сп", "сп-", "-sp", "sp-"],
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
      .replace(/ё/g, "е")
      .replace(/\s+/g, " ")
      .trim();
  },
  selected(root = document) {
    const checklist = [...root.querySelectorAll("#post_tag .tagchecklist span")]
      .map((item) => item.textContent.replace(/^X\s*/i, "").trim())
      .filter(Boolean);
    return [...new Set([...this.get(root), ...checklist])];
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
  async rename(name) {
    const next = this.upper(name);
    try {
      const html = await fetch(this.search(name), {
        credentials: "same-origin",
      }).then((response) => response.text());
      const doc = this.parse(html);
      const rows = this.rows(doc);
      const row = rows.find((item) => this.match(item, name));
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
