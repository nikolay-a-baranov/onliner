export const createCapture = (api = {}) => {
  const capture = {
    schema: "launchpad.capture.v1",
    selectors: [
      ".news-container",
      "[data-post-id]",
      "article",
      "main article",
      "main",
    ],
    styles: [
      "display",
      "position",
      "box-sizing",
      "width",
      "height",
      "margin-top",
      "margin-right",
      "margin-bottom",
      "margin-left",
      "padding-top",
      "padding-right",
      "padding-bottom",
      "padding-left",
      "font-family",
      "font-size",
      "font-weight",
      "line-height",
      "letter-spacing",
      "text-align",
      "color",
      "background-color",
      "border-top-width",
      "border-right-width",
      "border-bottom-width",
      "border-left-width",
      "border-radius",
      "overflow",
      "object-fit",
      "aspect-ratio",
      "grid-template-columns",
      "gap",
    ],
    root() {
      return capture.selectors
        .map((selector) => document.querySelector(selector))
        .find((element) => element && element.getBoundingClientRect().height > 0) || document.body;
    },
    selector(element) {
      if (!(element instanceof Element)) return "";
      if (element.id) return `#${CSS.escape(element.id)}`;
      const classes = [...element.classList].slice(0, 3).map((value) => `.${CSS.escape(value)}`).join("");
      const name = element.tagName.toLowerCase();
      const parent = element.parentElement;
      if (!parent) return `${name}${classes}`;
      const siblings = [...parent.children].filter((value) => value.tagName === element.tagName);
      const position = siblings.length > 1 ? `:nth-of-type(${siblings.indexOf(element) + 1})` : "";
      return `${name}${classes}${position}`;
    },
    attributes(element) {
      const allowed = ["id", "class", "role", "href", "src", "alt", "title", "type", "name", "data-post-id"];
      return allowed.reduce((result, name) => {
        const value = element.getAttribute(name);
        return value === null ? result : { ...result, [name]: value };
      }, {});
    },
    computed(element) {
      const style = window.getComputedStyle(element);
      return capture.styles.reduce((result, name) => ({ ...result, [name]: style.getPropertyValue(name) }), {});
    },
    rect(element) {
      const value = element.getBoundingClientRect();
      return {
        x: Math.round(value.x),
        y: Math.round(value.y),
        width: Math.round(value.width),
        height: Math.round(value.height),
      };
    },
    text(element) {
      return String(element.innerText || element.textContent || "").replace(/\s+/g, " ").trim().slice(0, 500);
    },
    node(element, index = 0) {
      return {
        index,
        tag: element.tagName.toLowerCase(),
        selector: capture.selector(element),
        attributes: capture.attributes(element),
        rect: capture.rect(element),
        styles: capture.computed(element),
        text: capture.text(element),
        childCount: element.children.length,
      };
    },
    blocks(root) {
      return [...root.children]
        .filter((element) => element.getBoundingClientRect().height > 0)
        .map((element, index) => capture.node(element, index));
    },
    media(root) {
      return [...root.querySelectorAll("img, picture, video, iframe")].map((element, index) => ({
        ...capture.node(element, index),
        currentSrc: element.currentSrc || "",
        naturalWidth: Number(element.naturalWidth || 0),
        naturalHeight: Number(element.naturalHeight || 0),
      }));
    },
    interactions(root) {
      const selector = "a, button, input, select, textarea, [role='button'], [tabindex]";
      return [...root.querySelectorAll(selector)]
        .filter((element) => element.getBoundingClientRect().height > 0)
        .map((element, index) => capture.node(element, index));
    },
    metadata(root) {
      const meta = (name, attribute = "name") => document.querySelector(`meta[${attribute}="${name}"]`)?.content || "";
      return {
        url: location.href,
        title: document.title,
        language: document.documentElement.lang || "",
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
          ratio: window.devicePixelRatio,
        },
        scroll: {
          x: Math.round(window.scrollX),
          y: Math.round(window.scrollY),
          width: document.documentElement.scrollWidth,
          height: document.documentElement.scrollHeight,
        },
        postId: root.getAttribute("data-post-id") || document.querySelector("[data-post-id]")?.getAttribute("data-post-id") || "",
        description: meta("description"),
        ogType: meta("og:type", "property"),
        ogTitle: meta("og:title", "property"),
      };
    },
    build() {
      const root = capture.root();
      return {
        schema: capture.schema,
        capturedAt: new Date().toISOString(),
        metadata: capture.metadata(root),
        root: capture.node(root),
        blocks: capture.blocks(root),
        media: capture.media(root),
        interactions: capture.interactions(root),
      };
    },
    filename(data) {
      const stamp = data.capturedAt.replace(/[:.]/g, "-");
      const post = data.metadata.postId ? `-${data.metadata.postId}` : "";
      return `onliner-capture${post}-${stamp}.json`;
    },
    save(data) {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = capture.filename(data);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      return data;
    },
    run() {
      try {
        return [capture.build, capture.save].reduce((value, fn) => fn(value), undefined) && true;
      } catch (error) {
        console.error("[Launchpad Capture]", error);
        window.alert("Capture: не удалось собрать диагностический артефакт.");
        return true;
      }
    },
  };
  return { capture };
};
