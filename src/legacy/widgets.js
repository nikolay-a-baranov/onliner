import { cms } from "./core/cms.js";
import { entity } from "./core/escape.js";
import { widget } from "./core/widget.js";

(() => {
  const textarea = document.getElementById("content");
  if (!textarea) return;
  const helper = {
    parse(value) {
      if (!value) return {};
      try {
        return JSON.parse(value);
      } catch {
        return {};
      }
    },
    append(rows, meta, marker) {
      if (!Object.keys(meta).length) return rows;
      rows.push(marker, JSON.stringify(meta), "");
      return rows;
    },
    block: {
      start(tag) {
        return [`[${tag}]`, ""];
      },
      finish(rows, tag) {
        rows.push(`[/${tag}]`);
        return rows.join("\n");
      },
      field(rows, marker, value, transform = (item) => item) {
        const current = value || "";
        if (!current.trim()) return rows;
        rows.push(marker, transform(current), "");
        return rows;
      },
    },
    patch: {
      from(base, meta, patch) {
        return widget.restore(base, meta, patch);
      },
      text(patch, data, key) {
        if (data[key] === undefined) return patch;
        patch[key] = entity.decode(widget.text.widget(data[key]));
        return patch;
      },
      value(patch, data, key) {
        if (data[key] === undefined) return patch;
        patch[key] = data[key];
        return patch;
      },
    },
    cycle(entry) {
      entry.show = (string) => {
        entry.cache = [];
        return widget.block.mapJson(string, entry.tag, (full, data) => {
          if (!data) {
            entry.cache.push({});
            return full;
          }
          entry.cache.push(data || {});
          return entry.wrap(data);
        });
      };
      entry.hide = (string) => {
        let index = 0;
        return widget.block.each(string, entry.tag, (full, body) => {
          if (widget.block.jsonBody(body)) return full;
          const data = entry.unwrap(body, index);
          index += 1;
          return widget.block.stringify(entry.tag, data);
        });
      };
      return entry;
    },
  };
  const promo = helper.cycle({
    tag: widget.tag.promo,
    cache: [],
    editable: widget.form.promo.editable,
    marker: widget.form.promo.marker,
    wrap(data = {}) {
      const rows = helper.block.start(promo.tag);
      helper.append(
        rows,
        widget.frame(data, promo.editable),
        promo.marker.meta,
      );
      helper.block.field(rows, promo.marker.title, data.title || "");
      helper.block.field(
        rows,
        promo.marker.text,
        data.text || "",
        widget.text.readable,
      );
      helper.block.field(rows, promo.marker.label, data.label || "");
      return helper.block.finish(rows, promo.tag);
    },
    unwrap(body, index) {
      const base = promo.cache[index] || {};
      const data = widget.read.markers(body, promo.marker);
      const patch = {};
      helper.patch.value(patch, data, "title");
      helper.patch.text(patch, data, "text");
      helper.patch.value(patch, data, "label");
      return helper.patch.from(base, helper.parse(data.meta), patch);
    },
  });
  const vote = helper.cycle({
    tag: widget.tag.vote,
    cache: [],
    editable: widget.form.vote.editable,
    variantEditable: widget.form.vote.variantEditable,
    marker: widget.form.vote.marker,
    wrap(data = {}) {
      const rows = helper.block.start(vote.tag);
      const variants = data.variants || [];
      helper.append(rows, widget.frame(data, vote.editable), vote.marker.meta);
      rows.push(vote.marker.variants, "");
      variants.forEach((item, index) => {
        const data = item || {};
        const title = (data.title || "").trim();
        const description = (data.description || "").trim();
        const meta = widget.frame(data, vote.variantEditable);
        if (!title && !description && !Object.keys(meta).length) return;
        rows.push(`${vote.marker.item}${index + 1}`, "");
        helper.append(rows, meta, vote.marker.meta);
        helper.block.field(rows, vote.marker.title, title);
        helper.block.field(
          rows,
          vote.marker.description,
          description,
          widget.text.readable,
        );
      });
      return helper.block.finish(rows, vote.tag);
    },
    unwrap(body, index) {
      const base = vote.cache[index] || {};
      const data = widget.read.vote(body, vote.marker);
      const next = widget.restore(base, data.meta, {});
      const variants = Array.isArray(base.variants)
        ? base.variants.map((variant) => ({ ...variant }))
        : [];
      data.chunks
        .slice()
        .sort((left, right) => left.index - right.index)
        .forEach((chunk) => {
          if (chunk.index < 0) return;
          if (!variants[chunk.index]) variants[chunk.index] = {};
          const patch = {};
          if (chunk.title.trim()) patch.title = chunk.title.trim();
          if (chunk.description.trim())
            patch.description = entity.decode(
              widget.text.widget(chunk.description.trim()),
            );
          variants[chunk.index] = widget.restore(
            variants[chunk.index],
            chunk.meta,
            patch,
          );
        });
      next.variants = variants;
      return next;
    },
  });
  const show = (string) =>
    vote.show(promo.show(widget.decode.raw(string, (value) => value)));
  const hide = (string) => {
    const normalized = widget.transform.raw(
      vote.hide(promo.hide(string)),
      (value) => value,
    );
    let value = normalized;
    let snap;
    do {
      snap = value;
      value = value.replace(/&#38;&#35;(\d+);/g, "&#$1;");
    } while (value !== snap);
    return value;
  };
  const mode = {
    detect(value = textarea.value) {
      if (widget.readable(value)) return "readable";
      if (widget.encoded(value)) return "encoded";
      return "raw";
    },
    encoded(value) {
      const current = mode.detect(value);
      if (current === "encoded") return value;
      if (current === "readable") return hide(value);
      return widget.encode(value);
    },
    raw(value) {
      const current = mode.detect(value);
      if (current === "raw") return value;
      if (current === "readable")
        return widget.decode.raw(hide(value), (item) => item);
      return widget.decode.raw(value, (item) => item);
    },
    readable(value) {
      return mode.detect(value) === "readable" ? value : show(value);
    },
    next(value) {
      const current = mode.detect(value);
      if (current === "encoded") return mode.raw(value);
      if (current === "raw") return mode.readable(value);
      return mode.encoded(value);
    },
    pick(value, key) {
      if (/^e/i.test(key)) return mode.encoded(value);
      if (/^r$/i.test(key)) return mode.raw(value);
      if (/^w|^read/i.test(key)) return mode.readable(value);
      return mode.next(value);
    },
  };
  cms.editor.html();
  const choice = prompt("Widgets mode: e=encoded, r=raw, w=readable");
  cms.editor.runContent((value) => mode.pick(value, (choice || "").trim()));
})();
