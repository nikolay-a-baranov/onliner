const runtime = {
  baseUrl() {
    const current = document.currentScript;
    if (current && current.src) return new URL(".", current.src);
    const fallback = [...document.querySelectorAll("script[src]")].find(
      (script) => /\/dist\/launchpad\.js(?:\?|$)/.test(script.src),
    );
    return new URL(".", fallback?.src || location.href);
  },
  manifestTarget() {
    try {
      return new URL("manifest.json", runtime.baseUrl());
    } catch {
      return null;
    }
  },
  localHttp(value) {
    let url = null;
    try {
      url = new URL(value, location.href);
    } catch {
      return "";
    }
    const localHost =
      url.hostname === "localhost" ||
      url.hostname === "127.0.0.1" ||
      /^10\./.test(url.hostname) ||
      /^192\.168\./.test(url.hostname) ||
      /^172\.(1[6-9]|2\d|3[0-1])\./.test(url.hostname);
    if (!localHost || url.protocol !== "https:") return "";
    return `http://${url.host}${url.pathname}${url.search}${url.hash}`;
  },
  mount(url) {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = url;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(url));
      (document.head || document.body || document.documentElement).append(
        script,
      );
    });
  },
  load(src) {
    return runtime.mount(src).catch(() => {
      const fallback = runtime.localHttp(src);
      if (!fallback) throw new Error(src);
      return runtime.mount(fallback);
    });
  },
  version(file, manifest) {
    if (manifest && manifest[file] && manifest[file].version) {
      return manifest[file].version;
    }
    return String(Date.now());
  },
  toolUrl(file, manifest) {
    return new URL(
      `${file}?v=${runtime.version(file, manifest)}`,
      runtime.baseUrl(),
    ).href;
  },
  files({ files, manifest }) {
    return manifest()
      .then((value) =>
        files.reduce(
          (chain, file) =>
            chain.then(() => runtime.load(runtime.toolUrl(file, value))),
          Promise.resolve(),
        ),
      )
      .catch(() => {});
  },
  create({
    getManifestCache = () => null,
    setManifestCache = () => null,
    tools = [],
  } = {}) {
    const loader = {
      manifest() {
        const cached = getManifestCache();
        if (cached) return Promise.resolve(cached);
        const target = runtime.manifestTarget();
        if (!target || target.origin !== location.origin) {
          setManifestCache({});
          return Promise.resolve(getManifestCache());
        }
        return fetch(target.href, { cache: "no-store" })
          .then((response) => {
            if (!response.ok) throw new Error("manifest");
            return response.json();
          })
          .then((data) => {
            setManifestCache(data || {});
            return getManifestCache();
          })
          .catch(() => {
            setManifestCache({});
            return getManifestCache();
          });
      },
      runTool(id) {
        const tool = tools.find((item) => item.id === id);
        if (!tool) return;
        return runtime.files({
          files: [tool.file],
          manifest: loader.manifest,
        });
      },
    };
    return loader;
  },
};

export const launchpadLoader = runtime;
