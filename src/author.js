import { frame } from "./core/panel.js";
import { toolbar } from "./core/toolbar.js";
import { ui } from "./core/ui.js";
import { icon } from "./core/icon.js";
import { design } from "./core/design.js";
import { cms } from "./core/cms.js";
import { hotkeys } from "./core/hotkeys.js";
import { transform } from "./core/transform.js";

(() => {
  const id = "author-panel";
  const debugHotkeys = false;
  if (typeof window.__editorPanelClose === "function") {
    window.__editorPanelClose();
  } else {
    const panel = document.getElementById("editor-panel");
    if (panel) {
      toolbar.destroy(panel);
      panel.remove();
      document.getElementById("editor-panel-style")?.remove();
    }
  }
  const assets = {
    glyph: {
      heading: icon.fluent("Text Font Size"),
      emphasis: icon.fluent("Text Bold"),
      quote: icon.fluent("Comment Quote"),
      more: icon.fluent("More Horizontal"),
      photo: icon.fluent("Image"),
      video: icon.fluent("Video"),
      cleanup: icon.fluent("Eraser"),
    },
    logo: (name) => icon.logo.editorSource(name),
    emoji: (value, scope = "editor") => icon.emoji(value, scope),
    mode: icon.mode.get("editor"),
  };
  const { glyph } = assets;
  const buttons = [
    { action: "heading", label: "Heading", icon: "heading" },
    { action: "emphasis", label: "Emphasis", icon: "emphasis" },
    { action: "quote", label: "Quote", icon: "quote" },
    { action: "more", label: "More", icon: "more" },
    { action: "photo", label: "Photo", icon: "photo" },
    { action: "video", label: "Video", icon: "video" },
    { action: "cleanup", label: "Cleanup", icon: "cleanup" },
  ];
  const metric = {
    touchBottom: design.surface.toolbar.metric.touchBottom,
    desktopBottom: design.surface.toolbar.metric.desktopBottom,
  };
  const state = {
    theme:
      toolbar.state("author-panel-theme") || toolbar.appearance.theme("content"),
  };
  const themeIcon = () => toolbar.appearance.themeToggleIcon(state.theme);
  const systemButtons = () => [
    { action: "theme", label: themeIcon(), emoji: themeIcon() },
    { action: "close", label: "\u274C", emoji: "\u274C" },
  ];
  const options = () => ({
    glyph,
    logo: assets.logo,
    emoji: assets.emoji,
    iconMode: assets.mode,
  });
  const html = () =>
    toolbar.render.shell({
      options: options(),
      primary: buttons,
      system: systemButtons(),
      collapsed: true,
      solo: false,
      launcher: {
        action: "place",
        emoji: "\u{1F988}",
        scope: "launcher",
      },
    });
  if (typeof window.__authorPanelClose === "function") {
    window.__authorPanelClose();
  } else {
    const exists = document.getElementById(id);
    if (exists) {
      toolbar.destroy(exists);
      exists.remove();
    }
  }
  const bar = frame.create({ id, html: html(), place: "right" });
  const author = {
    selectionMemory: new WeakMap(),
    controller: null,
    listening: false,
    clear: [],
    debug(...items) {
      if (!debugHotkeys) return;
      console.log("[author-hotkeys]", ...items);
    },
    theme(value) {
      if (value === undefined) return state.theme;
      if (value !== "dark" && value !== "light") return state.theme;
      state.theme = value;
      toolbar.state("author-panel-theme", value);
      return state.theme;
    },
    content() {
      const element = document.getElementById("content");
      if (!element) return null;
      if (element.tagName !== "TEXTAREA" && element.tagName !== "INPUT") {
        return null;
      }
      return element;
    },
    get() {
      const element = document.activeElement;
      const content = author.content();
      if (!element || !content) return null;
      if (element !== content) return null;
      return content;
    },
    current() {
      return author.get() || author.content();
    },
    contentActive() {
      if (author.mode() === "tmce") {
        const current = author.tiny();
        if (!current) return false;
        if (typeof current.hasFocus === "function" && current.hasFocus()) {
          return true;
        }
        return document.activeElement === current.getBody?.();
      }
      const element = author.get();
      return !!element && element.id === "content";
    },
    mode() {
      return cms.editor.getMode() === "tmce" ? "tmce" : "html";
    },
    tiny() {
      const current =
        window.tinyMCE?.get?.("content") || window.tinyMCE?.activeEditor || null;
      if (!current || typeof current.isHidden === "function" && current.isHidden()) {
        return null;
      }
      return current;
    },
    rememberSelection(element) {
      if (!element) return;
      if (typeof element.selectionStart !== "number") return;
      if (typeof element.selectionEnd !== "number") return;
      author.selectionMemory.set(element, {
        start: element.selectionStart,
        end: element.selectionEnd,
      });
    },
    restoreSelection(element) {
      if (!element) return;
      const saved = author.selectionMemory.get(element);
      if (!saved) return;
      const start = Math.max(0, Math.min(saved.start, element.value.length));
      const end = Math.max(0, Math.min(saved.end, element.value.length));
      element.selectionStart = start;
      element.selectionEnd = end;
    },
    sync(element, value, start, end) {
      if (!element) return false;
      if (value === element.value) return false;
      element.value = value;
      if (typeof start === "number") element.selectionStart = start;
      if (typeof end === "number") element.selectionEnd = end;
      element.focus();
      element.dispatchEvent(new Event("input", { bubbles: true }));
      element.dispatchEvent(new Event("change", { bubbles: true }));
      return true;
    },
    replace(element, next) {
      if (!element || !next) return false;
      const start = element.selectionStart;
      const end = element.selectionEnd;
      const before = element.value.slice(0, start);
      const after = element.value.slice(end);
      const value = `${before}${next}${after}`;
      const caret = before.length + next.length;
      return author.sync(element, value, caret, caret);
    },
    insert(element, next, caretOffset = null) {
      if (!element || !next) return false;
      const start = element.selectionStart;
      const end = element.selectionEnd;
      const before = element.value.slice(0, start);
      const after = element.value.slice(end);
      const value = `${before}${next}${after}`;
      const caret =
        typeof caretOffset === "number"
          ? before.length + caretOffset
          : before.length + next.length;
      return author.sync(element, value, caret, caret);
    },
    select(element, start, end) {
      if (!element) return false;
      const from = Math.max(0, Math.min(start, element.value.length));
      const to = Math.max(0, Math.min(end, element.value.length));
      element.focus();
      element.selectionStart = from;
      element.selectionEnd = to;
      return true;
    },
    selected(element) {
      if (!element) return "";
      const start = element.selectionStart;
      const end = element.selectionEnd;
      return element.value.slice(start, end);
    },
    setRange(element, start, end, next, focusStart, focusEnd = focusStart) {
      if (!element) return false;
      const value =
        element.value.slice(0, start) + next + element.value.slice(end);
      return author.sync(element, value, focusStart, focusEnd);
    },
    scope(element, mode = "block") {
      if (!element) return null;
      const start = element.selectionStart;
      const end = element.selectionEnd;
      if (mode === "selection" && start !== end) {
        return {
          start,
          end,
          text: element.value.slice(start, end),
        };
      }
      return transform.scope.block(element.value, start, end);
    },
    apply(element, result) {
      if (!element || !result) return false;
      const start = typeof result.start === "number" ? result.start : null;
      const end =
        typeof result.end === "number"
          ? result.end
          : typeof start === "number"
            ? start
            : null;
      return author.sync(element, result.value, start, end);
    },
    heading(element) {
      return author.apply(
        element,
        transform.heading(element.value, {
          start: element.selectionStart,
          end: element.selectionEnd,
        }),
      );
    },
    emphasis(element) {
      return author.apply(
        element,
        transform.emphasis(element.value, {
          start: element.selectionStart,
          end: element.selectionEnd,
        }),
      );
    },
    quote(element) {
      return author.apply(
        element,
        transform.quote(element.value, {
          start: element.selectionStart,
          end: element.selectionEnd,
        }),
      );
    },
    tinyHeadingCleanHtml(value = "") {
      return String(value || "").replace(/<\/?(?:strong|em)\b[^>]*>/gi, "");
    },
    tinyBlockTag(node) {
      return String(node?.nodeName || "").toLowerCase();
    },
    tinyParagraph(node, doc, html = "") {
      const paragraph = doc.createElement("p");
      paragraph.innerHTML = html;
      return paragraph;
    },
    tinyBodyParagraph(current) {
      const body = current.getBody?.();
      const range = current.selection?.getRng?.();
      if (!body || !range) return null;
      const blockPattern = /^(p|div|li|blockquote|h[1-6])$/i;
      const startNode =
        range.startContainer?.nodeType === 1
          ? range.startContainer.childNodes[range.startOffset] ||
            range.startContainer.childNodes[range.startOffset - 1] ||
            range.startContainer
          : range.startContainer;
      let seed = startNode;
      while (seed && seed.parentNode && seed.parentNode !== body) {
        seed = seed.parentNode;
      }
      if (!seed || seed === body) seed = body.firstChild;
      if (!seed) return null;
      if (seed.nodeType === 1 && blockPattern.test(seed.nodeName)) {
        return { kind: "block", node: seed, body };
      }
      if (seed.nodeType === 1 && /^br$/i.test(seed.nodeName)) {
        seed = seed.nextSibling || seed.previousSibling || seed;
      }
      let first = seed;
      while (first?.previousSibling) {
        const prev = first.previousSibling;
        if (prev.nodeType === 1 && (/^br$/i.test(prev.nodeName) || blockPattern.test(prev.nodeName))) {
          break;
        }
        first = prev;
      }
      let last = seed;
      while (last?.nextSibling) {
        const next = last.nextSibling;
        if (next.nodeType === 1 && (/^br$/i.test(next.nodeName) || blockPattern.test(next.nodeName))) {
          break;
        }
        last = next;
      }
      const nodes = [];
      let cursor = first;
      while (cursor) {
        nodes.push(cursor);
        if (cursor === last) break;
        cursor = cursor.nextSibling;
      }
      if (!nodes.length) return null;
      return { kind: "body", body, nodes };
    },
    tinyContentHtml(node) {
      const onlyElement =
        node?.children?.length === 1 &&
        node.children[0] &&
        !String(node.textContent || "").replace(/\s+/g, "");
      if (onlyElement) {
        return node.children[0].innerHTML || "";
      }
      return node?.innerHTML || "";
    },
    tinyReplaceNode(current, node, next) {
      if (!current || !node || !next) return false;
      node.replaceWith(next);
      author.tinyCursor(current, next, 0);
      current.nodeChanged?.();
      return true;
    },
    tinyReplaceBodyParagraph(current, data, next) {
      if (!current || !data?.nodes?.length || !next) return false;
      const first = data.nodes[0];
      if (!first?.parentNode) return false;
      const parent = first.parentNode;
      parent.insertBefore(next, first);
      data.nodes.forEach((node) => node.remove());
      author.tinyCursor(current, next, 0);
      current.nodeChanged?.();
      return true;
    },
    tinyHeading() {
      const current = author.tiny();
      if (!current) return false;
      const doc = current.getDoc?.() || document;
      const data = author.tinyBodyParagraph(current);
      if (!data) return false;
      if (data.kind === "block") {
        const node = data.node;
        const tag = author.tinyBlockTag(node);
        const clean = author.tinyHeadingCleanHtml(author.tinyContentHtml(node));
        const nextTag = tag === "h2" ? "h3" : tag === "h3" ? "p" : "h2";
        const next = doc.createElement(nextTag);
        next.innerHTML = clean;
        return author.tinyReplaceNode(current, node, next);
      }
      const wrap = doc.createElement("div");
      data.nodes.forEach((node) => wrap.appendChild(node.cloneNode(true)));
      const clean = author.tinyHeadingCleanHtml(wrap.innerHTML);
      const next = doc.createElement("h2");
      next.innerHTML = clean;
      return author.tinyReplaceBodyParagraph(current, data, next);
    },
    tinyQuote() {
      const current = author.tiny();
      if (!current) return false;
      const doc = current.getDoc?.() || document;
      const quote = current.selection?.getNode?.()?.closest?.("blockquote") || null;
      if (quote) {
        const next = author.tinyParagraph(quote, doc, author.tinyContentHtml(quote));
        return author.tinyReplaceNode(current, quote, next);
      }
      const data = author.tinyBodyParagraph(current);
      if (!data) return false;
      if (data.kind === "block") {
        if (author.tinyBlockTag(data.node) === "blockquote") {
          const next = author.tinyParagraph(data.node, doc, author.tinyContentHtml(data.node));
          return author.tinyReplaceNode(current, data.node, next);
        }
        const next = doc.createElement("blockquote");
        next.innerHTML = data.node.outerHTML;
        return author.tinyReplaceNode(current, data.node, next);
      }
      const paragraph = author.tinyParagraph(null, doc, "");
      data.nodes.forEach((node) => paragraph.appendChild(node.cloneNode(true)));
      const next = doc.createElement("blockquote");
      next.appendChild(paragraph);
      return author.tinyReplaceBodyParagraph(current, data, next);
    },
    clean(element) {
      return author.apply(
        element,
        transform.cleanup(element?.value, {
          start: element?.selectionStart || 0,
          end: element?.selectionEnd || 0,
        }),
      );
    },
    scrollClamp(panel) {
      const line = panel?.querySelector?.("[data-line]");
      if (!line) return;
      const maxX = Math.max(0, line.scrollWidth - line.clientWidth);
      const maxY = Math.max(0, line.scrollHeight - line.clientHeight);
      if (line.scrollLeft > maxX) line.scrollLeft = maxX;
      if (line.scrollTop > maxY) line.scrollTop = maxY;
      if (line.scrollLeft < 0) line.scrollLeft = 0;
      if (line.scrollTop < 0) line.scrollTop = 0;
    },
    scrollStep(panel) {
      const strip = panel.querySelector(".ui-strip");
      const first = strip ? strip.querySelector(".ui-button") : null;
      if (!first) return 0;
      const rect = first.getBoundingClientRect();
      const parent = strip || first.parentElement;
      const style = parent ? getComputedStyle(parent) : null;
      const gap = style ? parseFloat(style.columnGap || style.gap || "0") : 0;
      const base =
        rect.width ||
        parseFloat(
          getComputedStyle(panel).getPropertyValue("--surface-button-size") ||
            "0",
        ) ||
        0;
      if (!base) return 0;
      const extra = parseFloat(
        getComputedStyle(panel).getPropertyValue(
          "--surface-scroll-step-extra",
        ) || "0",
      );
      const value =
        base +
        (Number.isFinite(gap) ? gap : 0) +
        (Number.isFinite(extra) ? extra : 0);
      return value > 0 ? value : 0;
    },
    more(element) {
      if (!element) return false;
      const token = "<!--more-->";
      const index = element.value.indexOf(token);
      if (index >= 0) {
        return author.select(element, index, index + token.length);
      }
      return author.insert(element, token);
    },
    blockInsert(element, content, caretOffset = null) {
      if (!element || !content) return false;
      const range = transform.scope.block(
        element.value,
        element.selectionStart,
        element.selectionEnd,
      );
      if (!range) return false;
      const source = element.value;
      const left = source.slice(0, range.end).replace(/[ \t]+$/g, "");
      const rightSource = source.slice(range.end);
      const rightTrimmed = rightSource.replace(/^[ \t]+/g, "");
      const right =
        rightTrimmed && !/^\n\n/.test(rightTrimmed)
          ? rightTrimmed.replace(/^\n+/g, "")
          : rightTrimmed;
      const beforeGap = left ? (/\n\n$/.test(left) ? "" : "\n\n") : "";
      const afterGap = right ? (/^\n\n/.test(rightTrimmed) ? "" : "\n\n") : "";
      const next = `${left}${beforeGap}${content}${afterGap}${right}`;
      const start = left.length + beforeGap.length;
      const caret =
        typeof caretOffset === "number"
          ? start + caretOffset
          : start + content.length;
      return author.sync(element, next, caret, caret);
    },
    photo(element) {
      if (!element) return false;
      return author.blockInsert(element, "\u0424\u041E\u0422\u041E ", 5);
    },
    video(element) {
      if (!element) return false;
      return author.blockInsert(element, "[video][/video]", 7);
    },
    photoTmce() {
      return author.tinyInsertBlock("\u0424\u041E\u0422\u041E ", 5);
    },
    videoTmce() {
      return author.tinyInsertBlock("[video][/video]", 7);
    },
    tinyBlockParent(current) {
      const node =
        current.selection && typeof current.selection.getNode === "function"
          ? current.selection.getNode()
          : null;
      return node && current.dom && typeof current.dom.getParent === "function"
        ? current.dom.getParent(
            node,
            "p,div,li,blockquote,h1,h2,h3,h4,h5,h6",
          )
        : null;
    },
    tinyNextNode(node, root) {
      if (!node || !root) return null;
      if (node.firstChild) return node.firstChild;
      let current = node;
      while (current && current !== root) {
        if (current.nextSibling) return current.nextSibling;
        current = current.parentNode;
      }
      return null;
    },
    tinyBodyAnchor(current) {
      const body = current.getBody?.();
      const range = current.selection?.getRng?.();
      if (!body || !range) return { parent: body, ref: null };
      const child =
        range.startContainer?.nodeType === 1
          ? range.startContainer.childNodes[range.startOffset] ||
            range.startContainer.childNodes[range.startOffset - 1] ||
            range.startContainer
          : range.startContainer;
      let node = child && body.contains(child) ? child : body.firstChild;
      while (node) {
        if (node.nodeType === 1 && /^br$/i.test(node.nodeName)) {
          let next = node.nextSibling;
          while (next && next.nodeType === 1 && /^br$/i.test(next.nodeName)) {
            next = next.nextSibling;
          }
          return { parent: node.parentNode || body, ref: next };
        }
        if (
          node !== child &&
          node.nodeType === 1 &&
          /^(p|div|li|blockquote|h[1-6])$/i.test(node.nodeName)
        ) {
          return { parent: node.parentNode || body, ref: node };
        }
        node = author.tinyNextNode(node, body);
      }
      return { parent: body, ref: null };
    },
    tinyCursor(current, node, offset = null) {
      if (!current || !node) return;
      current.focus?.();
      if (
        node.firstChild &&
        typeof offset === "number" &&
        current.selection &&
        typeof current.selection.setCursorLocation === "function"
      ) {
        current.selection.setCursorLocation(
          node.firstChild,
          Math.max(0, Math.min(offset, node.firstChild.nodeValue.length)),
        );
        return;
      }
      if (
        current.selection &&
        typeof current.selection.select === "function" &&
        typeof current.selection.collapse === "function"
      ) {
        current.selection.select(node, true);
        current.selection.collapse(false);
      }
    },
    tinyInsertBlock(content, caretOffset = null) {
      const current = author.tiny();
      if (!current) return false;
      const body = current.getBody?.();
      const doc = body?.ownerDocument || document;
      if (!body) return false;
      const insert = () => {
        const paragraph = doc.createElement("p");
        paragraph.textContent = content;
        const block = author.tinyBlockParent(current);
        if (block && block.parentNode) {
          block.parentNode.insertBefore(paragraph, block.nextSibling);
          author.tinyCursor(current, paragraph, caretOffset);
          current.nodeChanged?.();
          return true;
        }
        const anchor = author.tinyBodyAnchor(current);
        const parent = anchor.parent || body;
        parent.insertBefore(paragraph, anchor.ref || null);
        author.tinyCursor(current, paragraph, caretOffset);
        current.nodeChanged?.();
        return true;
      };
      if (current.undoManager?.transact) {
        let done = false;
        current.undoManager.transact(() => {
          done = insert();
        });
        return done;
      }
      return insert();
    },
    axis(panel) {
      const side = panel.dataset.dock || "floating";
      return side === "left" || side === "right" ? "y" : "x";
    },
    place(panel) {
      const touch = toolbar.mobile();
      const layout = touch ? "bottom" : "fullscreen";
      ui.surface.sync(panel, {
        layout,
        theme: author.theme(),
        surface: "toolbar",
      });
      panel.dataset.mobile = touch ? "true" : "false";
      const screen = toolbar.screen();
      const rect = document.getElementById("content")?.getBoundingClientRect();
      const edge = toolbar.rail.dock.edge;
      const min = 280;
      panel.style.setProperty("width", "fit-content", "important");
      panel.style.setProperty("max-width", "none", "important");
      const naturalWidth = toolbar.measureWidth(panel);
      const viewportMax = Math.max(min, screen.width - edge * 2);
      const fieldMax = rect ? Math.max(min, rect.width) : viewportMax;
      const maxWidth = Math.min(viewportMax, fieldMax);
      const width = Math.min(
        Math.max(min, naturalWidth),
        maxWidth,
      );
      const center = rect
        ? rect.left + rect.width / 2
        : screen.offsetLeft + screen.width / 2;
      const minLeft = screen.offsetLeft + edge;
      const maxLeft = screen.offsetLeft + screen.width - width - edge;
      const left = Math.min(maxLeft, Math.max(minLeft, center - width / 2));
      toolbar.appearance.place(panel, {
        layout,
        touch,
        fit: { left, width, maxWidth, rect },
        touchBottom: metric.touchBottom,
        desktopBottom: metric.desktopBottom,
      });
      author.scrollClamp(panel);
    },
    hotkeyHtml(name = "") {
      if (!author.contentActive()) return false;
      return !!author.action(name);
    },
    hotkeyTiny(name = "") {
      if (author.mode() !== "tmce") return false;
      if (!author.tiny()) return false;
      return !!author.action(name);
    },
    listen() {
      if (author.listening) return;
      author.listening = true;
      const map = {
        KeyH: "heading",
        KeyB: "emphasis",
        KeyQ: "quote",
        KeyM: "more",
        KeyP: "photo",
        KeyV: "video",
        KeyC: "cleanup",
      };
      const tinyKeys = hotkeys.bindTiny({
        getEditor: () => author.tiny(),
        map,
        run: (name) => author.hotkeyTiny(name),
        active: () => author.mode() === "tmce" && !!author.tiny(),
        debug: debugHotkeys,
      });
      author.clear.push(() => tinyKeys.destroy());
      toolbar.listen(bar, document, "selectionchange", () => {
        const element = author.current();
        if (!element) return;
        author.rememberSelection(element);
      });
      author.clear.push(
        hotkeys.bind({
          target: document,
          map,
          run: (name) => author.hotkeyHtml(name),
          active: () => author.mode() !== "tmce" && author.contentActive(),
          debug: debugHotkeys,
          source: "html",
        }),
      );
      toolbar.listen(bar, document, "focusin", () => tinyKeys.sync());
      toolbar.listen(bar, document, "click", () => tinyKeys.sync());
      const tmceTab = document.getElementById("content-tmce");
      if (tmceTab) {
        toolbar.listen(bar, tmceTab, "click", () => {
          setTimeout(() => tinyKeys.sync(), 0);
          setTimeout(() => tinyKeys.sync(), 60);
        });
      }
      tinyKeys.sync();
    },
    close() {
      author.controller?.behavior.destroy();
      author.controller = null;
      author.clear.forEach((run) => {
        try {
          run();
        } catch {}
      });
      author.clear = [];
      if (window.__authorPanelClose) delete window.__authorPanelClose;
      bar.remove();
    },
    action(name) {
      const mode = author.mode();
      if (mode === "tmce") {
        if (name === "theme") {
          author.theme(author.theme() === "dark" ? "light" : "dark");
          toolbar.reflow(bar, () => author.place(bar));
          return true;
        }
        if (name === "close") {
          author.close();
          return true;
        }
        if (name === "place") {
          author.place(bar);
          return true;
        }
        if (name === "heading") return author.tinyHeading();
        if (name === "quote") return author.tinyQuote();
        if (name === "photo") return author.photoTmce();
        if (name === "video") return author.videoTmce();
        return false;
      }
      const element = author.current();
      if (name === "theme") {
        author.theme(author.theme() === "dark" ? "light" : "dark");
        toolbar.reflow(bar, () => author.place(bar));
        return true;
      }
      if (name === "close") {
        author.close();
        return true;
      }
      if (name === "place") {
        author.place(bar);
        return true;
      }
      if (!element) return false;
      author.restoreSelection(element);
      author.rememberSelection(element);
      if (name === "heading") return author.heading(element);
      if (name === "emphasis") return author.emphasis(element);
      if (name === "quote") return author.quote(element);
      if (name === "more") return author.more(element);
      if (name === "photo") return author.photo(element);
      if (name === "video") return author.video(element);
      if (name === "cleanup") return author.clean(element);
      return false;
    },
  };
  author.controller = toolbar.creature({
    panel: bar,
    ...toolbar.presets.singleRowDocked("content"),
    theme: () => author.theme(),
    observe: { scroll: false },
    place: () => author.place(bar),
    actions: {
      keepFocus: true,
      action({ name }) {
        author.action(name);
      },
    },
    drag: {
      ...toolbar.presets.singleRowDocked("content").drag,
      onEnd({ moved } = {}) {
        if (!moved) return;
        const rect = bar.getBoundingClientRect();
        const dock = toolbar.behavior.dock({
          panel: bar,
          snap: toolbar.rail.dock.snap,
        });
        toolbar.behavior.dockApply({
          panel: bar,
          dock,
          value: { left: rect.left, top: rect.top },
          margin: toolbar.rail.dock.margin,
          edge: toolbar.rail.dock.edge,
          normalize(node, side, previous) {
            toolbar.behavior.dockNormalize({
              panel: node,
              side,
              previous,
              line: "[data-line]",
            });
          },
        });
        const line = bar.querySelector("[data-line]");
        if (line) line.dispatchEvent(new Event("scroll"));
      },
      onMove() {
        const rect = bar.getBoundingClientRect();
        toolbar.hint.update(bar, {
          dock: toolbar.behavior.dock({
            panel: bar,
            snap: toolbar.rail.dock.snap,
          }),
          value: { left: rect.left, top: rect.top },
          margin: toolbar.rail.dock.margin,
          edge: toolbar.rail.dock.edge,
          floating: bar.dataset.dock === "left" || bar.dataset.dock === "right",
        });
      },
    },
  });
  toolbar.behavior.line({
    panel: bar,
    strip: "[data-line]",
    canRun: () => {
      const layout = bar.dataset.layout;
      return layout === "fullscreen" || layout === "bottom";
    },
    axis: () => author.axis(bar),
    step: () => author.scrollStep(bar),
    count: () => 0,
    onRefresh: () => {
      if (bar.isConnected) author.place(bar);
    },
  });
  author.place(bar);
  author.controller.behavior.bind({ sync: false });
  window.__authorPanelClose = () => author.close();
  author.listen();
  setTimeout(() => {
    if (bar.isConnected) author.place(bar);
  }, 60);
})();
