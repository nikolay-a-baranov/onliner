const limit = {
  before: 500,
  after: 500,
  context: 32,
};
const hash = (value = "") => Array.from(String(value || "")).reduce(
  (result, char) => Math.imul(result ^ char.codePointAt(0), 16777619) >>> 0,
  2166136261,
).toString(36);
const freeze = (value) => {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.values(value).forEach(freeze);
  return Object.freeze(value);
};
const source = {
  occurrences(value = "", needle = "") {
    const positions = [];
    if (!needle) return positions;
    const string = String(value || "");
    let position = string.indexOf(needle);
    while (position >= 0) {
      positions.push(position);
      position = string.indexOf(needle, position + 1);
    }
    return positions;
  },
  split(value = "", maximum = 8000) {
    const chunks = [];
    const limit = Math.max(1, Number(maximum) || 8000);
    let rest = String(value || "");
    let offset = 0;
    while (rest.length > limit) {
      let cut = rest.lastIndexOf("\n\n", limit);
      if (cut < limit * 0.5) cut = rest.lastIndexOf("\n", limit);
      if (cut < limit * 0.5) cut = rest.lastIndexOf(" ", limit);
      if (cut < limit * 0.5) cut = limit;
      chunks.push({ text: rest.slice(0, cut), start: offset });
      const next = rest.slice(cut);
      const whitespace = next.match(/^\s+/)?.[0]?.length || 0;
      rest = next.slice(whitespace);
      offset += cut + whitespace;
    }
    if (rest) chunks.push({ text: rest, start: offset });
    return chunks;
  },
  tagEnd(value, start) {
    let quote = "";
    for (let index = start + 1; index < value.length; index += 1) {
      const char = value[index];
      if (quote) {
        if (char === quote) quote = "";
        continue;
      }
      if (char === '"' || char === "'") {
        quote = char;
        continue;
      }
      if (char === ">") return index + 1;
    }
    return value.length;
  },
  protectedEnd(value, start) {
    const rest = value.slice(start);
    if (rest.startsWith("<!--")) {
      const end = value.indexOf("-->", start + 4);
      return end < 0 ? value.length : end + 3;
    }
    const raw = rest.match(/^<(script|style)\b/i)?.[1];
    if (raw) {
      const close = new RegExp(`<\\/${raw}\\s*>`, "ig");
      close.lastIndex = source.tagEnd(value, start);
      const match = close.exec(value);
      return match ? match.index + match[0].length : value.length;
    }
    if (rest.startsWith("<")) return source.tagEnd(value, start);
    const shortcode = rest.match(/^\[([a-z][a-z0-9-]*)(?:\s[^\]]*)?\]/i);
    if (!shortcode) return start;
    const tokenEnd = start + shortcode[0].length;
    if (/\/\]$/.test(shortcode[0])) return tokenEnd;
    const close = `[/${shortcode[1]}]`;
    const closeStart = value.toLowerCase().indexOf(close.toLowerCase(), tokenEnd);
    return closeStart < 0 ? tokenEnd : closeStart + close.length;
  },
  entity(value = "") {
    const named = {
      amp: "&",
      apos: "'",
      gt: ">",
      lt: "<",
      nbsp: "\u00A0",
      quot: '"',
    };
    const body = value.slice(1, -1).toLowerCase();
    if (named[body] !== undefined) return named[body];
    const radix = body.startsWith("#x") ? 16 : 10;
    const digits = body.replace(/^#x?/, "");
    const number = Number.parseInt(digits, radix);
    if (!Number.isInteger(number) || number < 0 || number > 0x10ffff) return value;
    try {
      return String.fromCodePoint(number);
    } catch {
      return value;
    }
  },
  decode(value = "", offset = 0) {
    const units = [];
    let text = "";
    for (let index = 0; index < value.length;) {
      const entity = value.slice(index).match(/^&(?:#x[0-9a-f]+|#\d+|nbsp|amp|lt|gt|quot|apos);/i)?.[0] || "";
      const raw = entity || value[index];
      const decoded = entity ? source.entity(entity) : raw;
      const start = offset + index;
      const end = start + raw.length;
      text += decoded;
      for (let unit = 0; unit < decoded.length; unit += 1) units.push({ start, end });
      index += raw.length;
    }
    return { text, units };
  },
  segment(value, start, end, index) {
    const decoded = source.decode(value.slice(start, end), start);
    return freeze({
      index,
      rawStart: start,
      rawEnd: end,
      text: decoded.text,
      units: decoded.units,
    });
  },
  project(segment) {
    const units = [];
    let text = "";
    for (let index = 0; index < segment.text.length;) {
      const whitespace = /[\u0009\u0020\u00A0]/u.test(segment.text[index]);
      let end = index + 1;
      if (whitespace) {
        while (end < segment.text.length && /[\u0009\u0020\u00A0]/u.test(segment.text[end])) end += 1;
      }
      const value = whitespace ? " " : segment.text.slice(index, end);
      text += value;
      for (let unit = 0; unit < value.length; unit += 1) units.push({ start: index, end });
      index = end;
    }
    return { text, units };
  },
  create(value = "", parent = null) {
    const html = String(value || "");
    const segments = [];
    let start = 0;
    let cursor = 0;
    const push = (end) => {
      if (end <= start) return;
      segments.push(source.segment(html, start, end, segments.length));
    };
    while (cursor < html.length) {
      const protectedEnd = source.protectedEnd(html, cursor);
      if (protectedEnd <= cursor) {
        cursor += 1;
        continue;
      }
      push(cursor);
      cursor = protectedEnd;
      start = cursor;
    }
    push(html.length);
    const key = hash(html);
    const lineage = parent?.key
      ? [...(parent.lineage || []), { key: parent.key, html: parent.html }]
      : [];
    return freeze({
      key,
      html,
      lineage,
      segments,
      text: segments.map((segment) => segment.text).join(""),
    });
  },
};
const proposal = {
  validate(value = {}) {
    if (!value || typeof value !== "object") return { status: "invalid" };
    if (typeof value.before !== "string" || typeof value.after !== "string") {
      return { status: "invalid" };
    }
    if (!value.before || value.before === value.after) return { status: "invalid" };
    if (value.before.length > limit.before || value.after.length > limit.after) {
      return { status: "overlarge" };
    }
    if (value.occurrence !== undefined && (!Number.isInteger(value.occurrence) || value.occurrence < 0)) {
      return { status: "invalid" };
    }
    return { status: "valid" };
  },
  candidate(snapshot, segment, start, occurrence, before) {
    const end = start + before.length;
    const first = segment.units[start];
    const last = segment.units[end - 1];
    if (!first || !last) return null;
    const target = {
      id: `${snapshot.key}:${segment.index}:${start}:${end}`,
      sourceKey: snapshot.key,
      segment: segment.index,
      start,
      end,
      rawStart: first.start,
      rawEnd: last.end,
      occurrence,
      before,
      left: segment.text.slice(Math.max(0, start - limit.context), start),
      right: segment.text.slice(end, end + limit.context),
    };
    Object.defineProperty(target, "sourceHtml", { value: snapshot.html });
    return freeze(target);
  },
  candidates(snapshot, before) {
    const values = [];
    snapshot.segments.forEach((segment) => {
      let cursor = 0;
      let position = segment.text.indexOf(before, cursor);
      while (position >= 0) {
        const target = proposal.candidate(snapshot, segment, position, values.length, before);
        if (target) values.push(target);
        cursor = position + 1;
        position = segment.text.indexOf(before, cursor);
      }
    });
    return values;
  },
  locate(snapshot, value = {}) {
    if (!snapshot || !Array.isArray(snapshot.segments)) return { status: "invalid" };
    const validation = proposal.validate(value);
    if (validation.status !== "valid") return validation;
    const candidates = proposal.candidates(snapshot, value.before);
    if (!candidates.length) {
      return { status: snapshot.text.includes(value.before) ? "unsupported" : "not-found" };
    }
    if (value.occurrence !== undefined) {
      const target = candidates[value.occurrence];
      return target ? { status: "ready", target } : { status: "not-found" };
    }
    if (candidates.length !== 1) return { status: "ambiguous", candidates };
    return { status: "ready", target: candidates[0] };
  },
  align(snapshot, analysis = "", value = {}) {
    if (!snapshot || !Array.isArray(snapshot.segments)) return { status: "invalid" };
    const validation = proposal.validate(value);
    if (validation.status !== "valid") return validation;
    const start = Number(value.start);
    if (!Number.isInteger(start) || start < 0) return { status: "invalid" };
    if (analysis.slice(start, start + value.before.length) !== value.before) {
      return { status: "not-found" };
    }
    const candidates = proposal.candidates(snapshot, value.before).filter((target) => {
      const segment = snapshot.segments[target.segment];
      const projected = source.project(segment);
      const projectedStart = projected.units.findIndex((unit) => unit.start === target.start);
      const projectedEnd = projected.units.reduce(
        (end, unit, index) => unit.end === target.end ? index + 1 : end,
        0,
      );
      if (projectedStart < 0 || projectedEnd <= projectedStart) return false;
      if (projected.text.slice(projectedStart, projectedEnd) !== value.before) return false;
      const contextStart = Math.max(0, projectedStart - limit.context);
      const contextEnd = Math.min(projected.text.length, projectedEnd + limit.context);
      const context = projected.text.slice(contextStart, contextEnd);
      const offset = projectedStart - contextStart;
      let position = analysis.indexOf(context);
      let matched = false;
      while (position >= 0) {
        if (position + offset === start) {
          if (matched) return false;
          matched = true;
        }
        position = analysis.indexOf(context, position + Math.max(1, context.length));
      }
      return matched;
    });
    if (!candidates.length) {
      const normalized = snapshot.text.replace(/\u00A0/g, " ");
      return { status: normalized.includes(value.before) ? "unsupported" : "not-found" };
    }
    if (candidates.length !== 1) return { status: "ambiguous", candidates };
    return { status: "ready", target: candidates[0] };
  },
  match(target, candidate) {
    return candidate.segment === target.segment &&
      candidate.before === target.before &&
      candidate.left.endsWith(target.left) &&
      candidate.right.startsWith(target.right);
  },
  resolve(snapshot, target) {
    if (!snapshot || !Array.isArray(snapshot.segments)) return { status: "invalid" };
    if (!target || typeof target !== "object") return { status: "invalid" };
    const trusted = (target.sourceKey === snapshot.key && target.sourceHtml === snapshot.html) ||
      snapshot.lineage.some((item) => item.key === target.sourceKey && item.html === target.sourceHtml);
    if (!trusted) return { status: "stale" };
    if (target.sourceKey === snapshot.key && target.sourceHtml === snapshot.html) {
      const segment = snapshot.segments[target.segment];
      if (segment?.text.slice(target.start, target.end) !== target.before) return { status: "stale" };
      return { status: "ready", target };
    }
    const candidates = proposal.candidates(snapshot, target.before).filter((candidate) =>
      proposal.match(target, candidate),
    );
    if (!candidates.length) return { status: "stale" };
    if (candidates.length !== 1) return { status: "ambiguous" };
    return { status: "ready", target: candidates[0] };
  },
  overlap(left, right) {
    if (!left || !right || left.sourceKey !== right.sourceKey) return false;
    return left.rawStart < right.rawEnd && right.rawStart < left.rawEnd;
  },
  conflicts(targets = []) {
    return targets.flatMap((left, index) =>
      targets.slice(index + 1).flatMap((right) =>
        proposal.overlap(left, right) ? [[left.id, right.id]] : [],
      ),
    );
  },
};
const edit = {
  encode(value = "") {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  },
  apply({ snapshot, current, target, after, pending = [] } = {}) {
    if (!snapshot || typeof snapshot.html !== "string") return { status: "invalid" };
    const validation = proposal.validate({ before: target?.before, after });
    if (validation.status !== "valid") return validation;
    if (String(current ?? "") !== snapshot.html) return { status: "stale" };
    const resolved = proposal.resolve(snapshot, target);
    if (resolved.status !== "ready") return resolved;
    const pendingTargets = pending
      .filter((item) => item !== target)
      .map((item) => proposal.resolve(snapshot, item))
      .filter((item) => item.status === "ready")
      .map((item) => item.target);
    if (pendingTargets.some((item) => proposal.overlap(resolved.target, item))) {
      return { status: "conflict" };
    }
    const replacement = edit.encode(after);
    const html = snapshot.html.slice(0, resolved.target.rawStart) +
      replacement +
      snapshot.html.slice(resolved.target.rawEnd);
    if (html === snapshot.html) return { status: "unchanged", snapshot };
    return {
      status: "applied",
      html,
      snapshot: source.create(html, snapshot),
      target: resolved.target,
      range: {
        start: resolved.target.rawStart,
        end: resolved.target.rawStart + replacement.length,
      },
    };
  },
  restore({ before, after, current } = {}) {
    if (!before || !after || typeof before.html !== "string" || typeof after.html !== "string") {
      return { status: "invalid" };
    }
    if (String(current ?? "") !== after.html) return { status: "stale" };
    return { status: "restored", html: before.html, snapshot: before };
  },
};
const auditTarget = {
  source,
  proposal,
  edit,
  snapshot: source.create,
  occurrences: source.occurrences,
  split: source.split,
  locate: proposal.locate,
  align: proposal.align,
  resolve: proposal.resolve,
  conflicts: proposal.conflicts,
  apply: edit.apply,
  restore: edit.restore,
};

export { auditTarget };
