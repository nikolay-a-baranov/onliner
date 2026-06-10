(() => {
  const url = new URL(location.href);
  if (!url.pathname.endsWith("/wp-admin/post.php")) return;

  const section = location.hostname.split(".")[0];
  const get = (selector) => {
    const element = document.querySelector(selector);
    return element ? (element.value || element.textContent || "").trim() : "";
  };
  const all = (selector) => {
    return Array.from(document.querySelectorAll(selector))
      .map((element) => (element.value || element.textContent || "").trim())
      .filter(Boolean);
  };
  const picked = (selector) => {
    return Array.from(document.querySelectorAll(selector))
      .filter((element) => element.checked)
      .map((element) =>
        (
          element.closest("li")?.querySelector("label")?.textContent || ""
        ).replace(/\s+/g, " ").trim(),
      )
      .filter(Boolean);
  };
  const mark = (label, value) => `[${label}]\n${value || "—"}`;

  const id = get("#post_ID") || (url.searchParams.get("post") || "").trim();
  if (!id) return;

  const slug = get("#editable-post-name-full");
  const title = get("#title");
  const rotation = all('input[name="rotation_titles[]"]');
  const favourite = get("#favourite_title");
  const seo = get('input[name="seo_title"]');
  const content = get("#content");
  const excerpt = get("#excerpt");
  const categories = picked("#categorychecklist input[type='checkbox']");
  const tags = all("#post_tag .tagchecklist span").map((value) =>
    value.replace(/^X\s*/i, "").trim(),
  );

  const result = [
    mark("slug", slug),
    mark("title", title),
    mark("rotation-titles", rotation.length ? rotation.join("\n") : ""),
    mark("favourite_title", favourite),
    mark("seo_title", seo),
    mark("content", content),
    mark("excerpt", excerpt),
    mark("categories", categories.length ? categories.join("\n") : ""),
    mark("tags", tags.length ? tags.join("\n") : ""),
  ].join("\n\n");

  const date = new Date();
  const today =
    date.getFullYear() +
    String(date.getMonth() + 1).padStart(2, "0") +
    String(date.getDate()).padStart(2, "0");
  const filename = `${today}_${section}_${id}.txt`;
  const blob = new Blob([result], { type: "text/plain;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    URL.revokeObjectURL(link.href);
    link.remove();
  }, 1000);
})();
