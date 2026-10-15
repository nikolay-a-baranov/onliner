const lead = {
  boundary(value = "") {
    const source = String(value || "");
    const marker = /<!--more-->/i.exec(source);
    return marker?.index ?? source.length;
  },
  text(value = "", strip = (source) => source) {
    return String(strip(String(value || "")) || "")
      .replace(/\s+/g, " ")
      .trim();
  },
  space(value = "", start = 0, end = value.length) {
    const source = String(value || "").slice(start, end);
    const match = source.match(/^(?:\s+|<!--(?!more\b)[\s\S]*?-->)+/i);
    return start + (match?.[0]?.length || 0);
  },
  ignored(value = "") {
    const source = String(value || "");
    const patterns = [
      /^<(h[1-6])\b[^>]*>[\s\S]*?<\/\1>/i,
      /^<(dl|figure)\b[^>]*>[\s\S]*?<\/\1>/i,
      /^<a\b[^>]*>\s*<img\b[^>]*\/?\s*>\s*<\/a>/i,
      /^<img\b[^>]*\/?\s*>/i,
      /^\[([a-z][a-z0-9-]*)(?:\s[^\]]*)?\][\s\S]*?\[\/\1\]/i,
      /^\[(?:onliner-gallery|gallery|instagram|tweet|tiktok)\b[^\]]*\]/i,
    ];
    return patterns
      .map((pattern) => source.match(pattern)?.[0] || "")
      .find(Boolean) || "";
  },
  locate(value = "", strip = (source) => source) {
    const source = String(value || "");
    const boundary = lead.boundary(source);
    let start = 0;
    while (start < boundary) {
      start = lead.space(source, start, boundary);
      if (start >= boundary) return null;
      const current = source.slice(start, boundary);
      const paragraph = current.match(/^<p\b[^>]*>[\s\S]*?<\/p>/i)?.[0] || "";
      if (paragraph) {
        const text = lead.text(paragraph, strip);
        if (text) {
          return {
            start,
            end: start + paragraph.length,
            html: paragraph,
            text,
          };
        }
        start += paragraph.length;
        continue;
      }
      const ignored = lead.ignored(current);
      if (ignored) {
        start += ignored.length;
        continue;
      }
      if (/^(?:<|\[)/.test(current)) return null;
      const block = current.match(/^[\s\S]*?(?=\n\s*\n|$)/)?.[0] || "";
      const text = lead.text(block, strip);
      if (!block || !text) return null;
      return {
        start,
        end: start + block.length,
        html: block,
        text,
      };
    }
    return null;
  },
  capture(value = "", strip = (source) => source) {
    const documentSource = String(value || "");
    const fragment = lead.locate(documentSource, strip);
    if (!fragment) return null;
    return {
      documentSource,
      fragmentStart: fragment.start,
      fragmentEnd: fragment.end,
      fragmentSource: fragment.html,
    };
  },
  replace(snapshot = null, draft = "", current = "") {
    const value = String(draft || "");
    if (!snapshot) {
      return { ok: false, reason: "missing", value: String(current || "") };
    }
    if (!value.trim()) {
      return { ok: false, reason: "empty", value: snapshot.documentSource };
    }
    const source = String(current || "");
    if (source !== snapshot.documentSource) {
      return { ok: false, reason: "stale", value: source };
    }
    const fragment = source.slice(snapshot.fragmentStart, snapshot.fragmentEnd);
    if (fragment !== snapshot.fragmentSource) {
      return { ok: false, reason: "fragment", value: source };
    }
    return {
      ok: true,
      reason: value === fragment ? "same" : "changed",
      value:
        source.slice(0, snapshot.fragmentStart) +
        value +
        source.slice(snapshot.fragmentEnd),
    };
  },
};

export { lead };
