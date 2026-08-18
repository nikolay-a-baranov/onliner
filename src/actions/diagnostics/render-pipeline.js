const renderPipeline = {
  id: "render-pipeline",
  title: "Brain Circuit",
  run(options = {}) {
    const audit = {
      now() {
        return new Date().toISOString();
      },
      mode() {
        if (document.querySelector("#content") || document.body?.classList.contains("wp-admin")) return "post";
        return "onliner";
      },
      text(value = "", limit = 250000) {
        const string = String(value || "");
        return string.length > limit ? `${string.slice(0, limit)}\n...[truncated ${string.length - limit} chars]` : string;
      },
      values(value) {
        return Array.from(value || []);
      },
      attrs(element) {
        return audit.values(element?.attributes).reduce((result, attribute) => {
          if (!attribute?.name?.startsWith?.("data-")) return result;
          return { ...result, [attribute.name]: attribute.value };
        }, {});
      },
      rect(element) {
        const rect = element?.getBoundingClientRect?.();
        if (!rect) return null;
        return {
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        };
      },
      style(element) {
        if (!element) return null;
        const value = getComputedStyle(element);
        return {
          display: value.display,
          position: value.position,
          width: value.width,
          maxWidth: value.maxWidth,
          height: value.height,
          maxHeight: value.maxHeight,
          marginTop: value.marginTop,
          marginRight: value.marginRight,
          marginBottom: value.marginBottom,
          marginLeft: value.marginLeft,
          paddingTop: value.paddingTop,
          paddingRight: value.paddingRight,
          paddingBottom: value.paddingBottom,
          paddingLeft: value.paddingLeft,
          fontFamily: value.fontFamily,
          fontSize: value.fontSize,
          fontWeight: value.fontWeight,
          lineHeight: value.lineHeight,
          objectFit: value.objectFit,
          aspectRatio: value.aspectRatio,
          overflow: value.overflow,
        };
      },
      node(element) {
        return {
          tag: String(element?.tagName || "").toLowerCase(),
          id: String(element?.id || ""),
          className: String(element?.className || ""),
          data: audit.attrs(element),
          rect: audit.rect(element),
          style: audit.style(element),
        };
      },
      resources() {
        return {
          styles: audit.values(document.querySelectorAll('link[rel="stylesheet"][href]')).map((element) => String(element.href || "")),
          scripts: audit.values(document.querySelectorAll("script[src]")).map((element) => String(element.src || "")),
          performance: audit.values(performance.getEntriesByType?.("resource"))
            .map((entry) => String(entry?.name || ""))
            .filter(Boolean),
        };
      },
      stylesheets() {
        return audit.values(document.styleSheets).map((sheet) => {
          let rules = null;
          let error = "";
          try {
            rules = sheet.cssRules?.length ?? 0;
          } catch (caught) {
            error = String(caught?.name || caught || "unavailable");
          }
          return {
            href: String(sheet.href || "inline"),
            disabled: Boolean(sheet.disabled),
            media: String(sheet.media?.mediaText || ""),
            rules,
            error,
          };
        });
      },
      shortcodes(value = "") {
        const matches = [...String(value || "").matchAll(/\[([a-zA-Z0-9_-]+)(?:\s[^\]]*)?\]/g)];
        return matches.reduce((items, match) => {
          const name = String(match[1] || "").toLowerCase();
          if (!name || name.startsWith("/")) return items;
          const current = items.find((item) => item.name === name);
          if (current) {
            current.count += 1;
            if (current.examples.length < 3) current.examples.push(audit.text(match[0], 1000));
            return items;
          }
          return [...items, { name, count: 1, examples: [audit.text(match[0], 1000)] }];
        }, []);
      },
      admin() {
        const field = document.querySelector("#content");
        const editor = window.tinyMCE?.get?.("content") || window.tinymce?.get?.("content") || null;
        let tinyMCE = "";
        try {
          tinyMCE = String(editor?.getContent?.({ format: "raw" }) ?? editor?.getContent?.() ?? "");
        } catch {}
        const source = String(field?.value || "");
        return {
          post: {
            id: String(document.querySelector("#post_ID")?.value || ""),
            type: String(document.querySelector("#post_type")?.value || ""),
            status: String(document.querySelector("#original_post_status")?.value || ""),
          },
          editor: {
            mode: document.querySelector("#content-tmce")?.classList.contains("switch-tmce") ? "visual" : "html",
            textarea: audit.text(source),
            tinyMCE: audit.text(tinyMCE),
            sourceLength: source.length,
            tinyMCELength: tinyMCE.length,
            shortcodes: audit.shortcodes(source),
            encodedTags: {
              escapedOpenTags: (source.match(/&lt;[a-z][^&]*?&gt;/gi) || []).length,
              encodedOpenTags: (source.match(/&#(?:x0*3c|60);/gi) || []).length,
              nonBreakingSpaces: (source.match(/&nbsp;|&#160;|&#x0*a0;/gi) || []).length,
            },
          },
          wordpressAssets: {
            plugins: audit.resources().scripts.concat(audit.resources().styles).filter((url) => url.includes("/wp-content/plugins/")),
            themes: audit.resources().scripts.concat(audit.resources().styles).filter((url) => url.includes("/wp-content/themes/")),
          },
        };
      },
      roots() {
        const selectors = [
          "[itemprop='articleBody']",
          "article",
          "main",
          "[class*='article']",
          "[class*='post']",
          "[class*='news']",
          "[class*='content']",
        ];
        const unique = selectors.flatMap((selector) => audit.values(document.querySelectorAll(selector)))
          .filter((element, index, items) => items.indexOf(element) === index)
          .map((element) => ({ element, area: Math.round((element.getBoundingClientRect().width || 0) * (element.getBoundingClientRect().height || 0)) }))
          .sort((left, right) => right.area - left.area)
          .slice(0, 12);
        return unique.map(({ element, area }) => ({
          ...audit.node(element),
          area,
          childElements: element.querySelectorAll("*").length,
          textLength: String(element.textContent || "").trim().length,
          html: audit.text(element.outerHTML, 250000),
        }));
      },
      signatures() {
        const map = new Map();
        audit.values(document.querySelectorAll("body *")).forEach((element) => {
          const tag = String(element.tagName || "").toLowerCase();
          const classes = audit.values(element.classList).sort().join(".");
          const data = Object.keys(audit.attrs(element)).sort().join(",");
          const key = `${tag}${classes ? `.${classes}` : ""}${data ? `[${data}]` : ""}`;
          map.set(key, (map.get(key) || 0) + 1);
        });
        return [...map.entries()]
          .map(([signature, count]) => ({ signature, count }))
          .sort((left, right) => right.count - left.count)
          .slice(0, 1000);
      },
      media() {
        const images = audit.values(document.images).map((element) => ({
          ...audit.node(element),
          src: String(element.currentSrc || element.src || ""),
          srcset: String(element.srcset || ""),
          sizes: String(element.sizes || ""),
          loading: String(element.loading || ""),
          naturalWidth: element.naturalWidth || 0,
          naturalHeight: element.naturalHeight || 0,
          parent: audit.node(element.parentElement),
          picture: element.closest("picture") ? audit.text(element.closest("picture").outerHTML, 12000) : "",
        }));
        const frames = audit.values(document.querySelectorAll("iframe,video,audio")).map((element) => ({
          ...audit.node(element),
          src: String(element.currentSrc || element.src || ""),
          html: audit.text(element.outerHTML, 12000),
        }));
        return { images, frames };
      },
      components() {
        const pattern = /widget|gallery|promo|poll|rating|catalog|before-after|video|youtube|vote|photo|image/i;
        return audit.values(document.querySelectorAll("body *"))
          .filter((element) => pattern.test(`${element.id || ""} ${element.className || ""} ${Object.keys(audit.attrs(element)).join(" ")}`))
          .slice(0, 300)
          .map((element) => ({
            ...audit.node(element),
            html: audit.text(element.outerHTML, 20000),
          }));
      },
      matchedRules() {
        const rules = [];
        audit.values(document.styleSheets).forEach((sheet) => {
          let values = [];
          try {
            values = audit.values(sheet.cssRules);
          } catch {
            return;
          }
          values.forEach((rule) => {
            const selector = String(rule.selectorText || "");
            if (!selector || rules.length >= 1200) return;
            let match = null;
            try {
              match = document.querySelector(selector);
            } catch {
              return;
            }
            if (!match) return;
            rules.push({
              href: String(sheet.href || "inline"),
              selector,
              cssText: audit.text(rule.cssText, 8000),
            });
          });
        });
        return rules;
      },
      frontend() {
        return {
          roots: audit.roots(),
          signatures: audit.signatures(),
          media: audit.media(),
          components: audit.components(),
          matchedRules: audit.matchedRules(),
          jsonScripts: audit.values(document.querySelectorAll('script[type="application/json"],script[type="application/ld+json"]')).map((element) => audit.text(element.textContent, 100000)),
        };
      },
      identity(options = {}) {
        const value = options.identity || {};
        return {
          realUser: String(value.realUser || ""),
          effectiveUser: String(value.effectiveUser || ""),
          realUserId: String(value.realUserId || ""),
          effectiveUserId: String(value.effectiveUserId || ""),
          feedMode: String(value.feedMode || ""),
          effectiveRole: String(value.effectiveRole || ""),
        };
      },
      build(options = {}) {
        const mode = audit.mode();
        return {
          schema: "onliner.render-pipeline-audit/v1",
          generatedAt: audit.now(),
          mode,
          page: {
            url: location.href,
            origin: location.origin,
            host: location.host,
            path: location.pathname,
            title: document.title,
            readyState: document.readyState,
            bodyClass: String(document.body?.className || ""),
            viewport: { width: innerWidth, height: innerHeight, devicePixelRatio },
          },
          identity: audit.identity(options),
          resources: audit.resources(),
          stylesheets: audit.stylesheets(),
          data: mode === "post" ? audit.admin() : audit.frontend(),
        };
      },
      download(value) {
        const stamp = audit.now().replace(/[:.]/g, "-");
        const blob = new Blob([JSON.stringify(value, null, 2)], { type: "application/json;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `render-pipeline-${value.mode}-${stamp}.json`;
        document.documentElement.append(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      },
      run(options = {}) {
        const value = audit.build(options);
        audit.download(value);
        console.log("Brain Circuit: JSON скачан", value);
        return value;
      },
    };
    return audit.run(options);
  },
};

export { renderPipeline };
