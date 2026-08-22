export const createSnapshot = (api, archive) => {
  const snapshot = {
    state: {
      running: false,
    },
    pad(value, length = 2) {
      return String(value).padStart(length, "0");
    },
    stamp(date = new Date()) {
      return [
        date.getFullYear(),
        snapshot.pad(date.getMonth() + 1),
        snapshot.pad(date.getDate()),
        "_",
        snapshot.pad(date.getHours()),
        snapshot.pad(date.getMinutes()),
        snapshot.pad(date.getSeconds()),
      ].join("");
    },
    safe(value = "") {
      return String(value || "")
        .replace(/^https?:\/\//i, "")
        .replace(/[^a-z0-9._-]+/gi, "_")
        .replace(/^_+|_+$/g, "") || "page";
    },
    name(date = new Date()) {
      return `snapshot-${snapshot.safe(location.hostname)}-${snapshot.stamp(date)}`;
    },
    doctype() {
      if (!document.doctype) return "<!DOCTYPE html>";
      return `<!DOCTYPE ${document.doctype.name}>`;
    },
    html() {
      return `${snapshot.doctype()}\n${document.documentElement.outerHTML}`;
    },
    content() {
      const textarea = document.querySelector("textarea#content");
      if (!textarea) return null;
      const editor = window.tinyMCE?.get?.("content");
      const value = editor?.getContent?.();
      return typeof value === "string" ? value : textarea.value;
    },
    meta(date = new Date()) {
      return {
        schema: "launchpad-snapshot/v1",
        capturedAt: date.toISOString(),
        page: {
          url: location.href,
          title: document.title,
          host: location.hostname,
          path: location.pathname,
        },
        runtime: {
          mode: window.__ONLINER_LAUNCHPAD_RUNTIME__?.mode || "production",
        },
        content: {
          included: snapshot.content() !== null,
        },
        warning: "Снэпшот может содержать авторизованный контент, значения форм, nonce, токены и персональные данные. Храните архив локально.",
      };
    },
    files(date = new Date()) {
      const content = snapshot.content();
      return [
        archive.textFile("page.html", snapshot.html(), "text/html;charset=utf-8"),
        archive.textFile("meta.json", JSON.stringify(snapshot.meta(date), null, 2), "application/json;charset=utf-8"),
        content === null ? null : archive.textFile("content.html", content, "text/html;charset=utf-8"),
      ].filter(Boolean);
    },
    async capture() {
      const date = new Date();
      const name = snapshot.name(date);
      const files = snapshot.files(date);
      archive.downloadBlob(`${name}.zip`, await archive.zipBlob(files, name));
      return true;
    },
    async run() {
      if (snapshot.state.running) return false;
      snapshot.state.running = true;
      try {
        return await snapshot.capture();
      } catch (error) {
        console.error("[Launchpad Snapshot]", error);
        window.alert(`Снэпшот: ${String(error?.message || error || "не удалось собрать архив")}`);
        return false;
      } finally {
        snapshot.state.running = false;
      }
    },
  };
  return { snapshot };
};
