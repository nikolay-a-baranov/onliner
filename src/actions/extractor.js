export const createExtractor = (api, archive) => {
  const extractor = {
    allowed: {
      host: "images.h1n.ru",
      paths: ["/transcription/", "/photo-resizer/"],
    },
    state: {
      running: false,
    },
    pad(value, length = 2) {
      return String(value).padStart(length, "0");
    },
    stamp(date = new Date()) {
      return [
        date.getFullYear(),
        extractor.pad(date.getMonth() + 1),
        extractor.pad(date.getDate()),
        "_",
        extractor.pad(date.getHours()),
        extractor.pad(date.getMinutes()),
        extractor.pad(date.getSeconds()),
      ].join("");
    },
    path() {
      const value = String(location.pathname || "/").toLowerCase();
      return value.endsWith("/") ? value : `${value}/`;
    },
    available() {
      return location.hostname.toLowerCase() === extractor.allowed.host
        && extractor.allowed.paths.includes(extractor.path());
    },
    safe(value = "") {
      return String(value || "")
        .replace(/^https?:\/\//i, "")
        .replace(/[^a-z0-9._-]+/gi, "_")
        .replace(/^_+|_+$/g, "") || "page";
    },
    baseName(date = new Date()) {
      return `${extractor.safe(location.hostname + extractor.path())}-${extractor.stamp(date)}`;
    },
    attributes(element) {
      return Array.from(element.attributes || []).reduce((result, item) => ({
        ...result,
        [item.name]: item.value,
      }), {});
    },
    scriptName(url = "", index = 0) {
      let basename = "script.js";
      try {
        basename = new URL(url, location.href).pathname.split("/").pop() || basename;
      } catch {}
      const name = extractor.safe(basename.replace(/\.m?js$/i, ""));
      return `scripts/external/${extractor.pad(index + 1, 3)}-${name}.js`;
    },
    inlineName(index = 0, type = "") {
      const extension = String(type || "").toLowerCase().includes("json") ? "json" : "js";
      return `scripts/inline/${extractor.pad(index + 1, 3)}.${extension}`;
    },
    scripts() {
      return Array.from(document.querySelectorAll("script"));
    },
    inlineFiles(scripts = []) {
      return scripts
        .filter((element) => !element.src && String(element.textContent || "").trim())
        .map((element, index) => ({
          file: archive.textFile(
            extractor.inlineName(index, element.type),
            element.textContent,
            element.type?.includes("json")
              ? "application/json;charset=utf-8"
              : "text/javascript;charset=utf-8",
          ),
          manifest: {
            kind: "inline",
            file: extractor.inlineName(index, element.type),
            type: element.type || "text/javascript",
            bytes: new TextEncoder().encode(element.textContent || "").length,
            attributes: extractor.attributes(element),
          },
        }));
    },
    async externalFile(element, index = 0) {
      const url = new URL(element.src, location.href).href;
      const file = extractor.scriptName(url, index);
      const base = {
        kind: "external",
        url,
        file,
        type: element.type || "text/javascript",
        attributes: extractor.attributes(element),
      };
      if (["blob:", "data:"].includes(new URL(url).protocol)) {
        return {
          manifest: {
            ...base,
            ok: false,
            skipped: true,
            error: "Unsupported script URL protocol",
          },
        };
      }
      try {
        const response = await fetch(url, {
          cache: "no-store",
          credentials: "same-origin",
        });
        const text = await response.text();
        const manifest = {
          ...base,
          ok: response.ok,
          status: response.status,
          statusText: response.statusText,
          contentType: response.headers.get("content-type") || "",
          bytes: new TextEncoder().encode(text).length,
        };
        if (!response.ok) return { manifest };
        return {
          file: archive.textFile(file, text, "text/javascript;charset=utf-8"),
          manifest,
        };
      } catch (error) {
        return {
          manifest: {
            ...base,
            ok: false,
            status: 0,
            error: String(error?.message || error || "Fetch failed"),
          },
        };
      }
    },
    async externalFiles(scripts = []) {
      const elements = scripts.filter((element) => Boolean(element.src));
      return Promise.all(elements.map((element, index) => extractor.externalFile(element, index)));
    },
    manifest(date, inline = [], external = []) {
      return {
        schema: "launchpad-page-extract/v1",
        capturedAt: date.toISOString(),
        page: {
          url: location.href,
          title: document.title,
          host: location.hostname,
          path: location.pathname,
        },
        warning: "The captured HTML may contain authenticated content, form values, nonces, tokens, and personal data. Keep the archive local.",
        resources: [...inline.map((item) => item.manifest), ...external.map((item) => item.manifest)],
      };
    },
    async capture() {
      const date = new Date();
      const name = extractor.baseName(date);
      const html = document.documentElement.outerHTML;
      const scripts = extractor.scripts();
      const inline = extractor.inlineFiles(scripts);
      const external = await extractor.externalFiles(scripts);
      const manifest = extractor.manifest(date, inline, external);
      const files = [
        archive.textFile("page.html", html, "text/html;charset=utf-8"),
        archive.textFile("manifest.json", JSON.stringify(manifest, null, 2), "application/json;charset=utf-8"),
        ...inline.map((item) => item.file),
        ...external.map((item) => item.file).filter(Boolean),
      ];
      archive.downloadBlob(`${name}.html`, new Blob([html], { type: "text/html;charset=utf-8" }));
      archive.downloadBlob(`${name}.zip`, await archive.zipBlob(files, name));
      return true;
    },
    async run() {
      if (!extractor.available() || extractor.state.running) return false;
      extractor.state.running = true;
      try {
        return await extractor.capture();
      } catch (error) {
        console.error("[Launchpad Extractor]", error);
        alert(`Экстрактор: ${String(error?.message || error || "не удалось собрать архив")}`);
        return false;
      } finally {
        extractor.state.running = false;
      }
    },
  };
  return { extractor };
};
