import { cms } from "../cms.js";
import { field } from "../dom.js";
import { widget } from "../widget.js";

export const createPublication = () => {
  const publication = {
    element(selector) {
      return field.element(selector);
    },
    content() {
      return String(publication.element("#content")?.value || "");
    },
    emit(input) {
      field.emit(input);
    },
    timestamp(hour) {
      const date = new Date(
        new Date().toLocaleString("en-US", {
          timeZone: cms.timezone,
        }),
      );
      if (date.getHours() >= hour) date.setDate(date.getDate() + 1);
      date.setHours(hour, 0, 0, 0);
      return date;
    },
    pad(value) {
      return String(value).padStart(2, "0");
    },
    set(selector, value) {
      field.input(publication.element(selector), value);
    },
    check(selector, value) {
      field.click(publication.element(selector), value);
    },
    visibility(value = {}) {
      publication.element(".edit-visibility")?.click();
      publication.check("#visibility-radio-public", value.access !== "link");
      publication.check("#visibility-radio-private", value.access === "link");
      publication.set(
        "#hidden-post-visibility",
        value.access === "link" ? "private" : "public",
      );
      if (value.access !== "link") {
        publication.set("#post_password", "");
        publication.set("#hidden-post-password", "");
      }
      if (value.sticky === "left" || value.sticky === "right") {
        publication.check(`input[name="sticky"][value="${value.sticky}"]`, true);
      } else {
        publication.check("input[name='sticky'][value='none']", true);
        publication.check("input[name='sticky'][value='off']", true);
      }
      publication.element(".save-post-visibility")?.click();
    },
    stamp(date) {
      return {
        month: publication.pad(date.getMonth() + 1),
        day: publication.pad(date.getDate()),
        year: String(date.getFullYear()),
        hours: publication.pad(date.getHours()),
        minutes: publication.pad(date.getMinutes()),
      };
    },
    time(hour) {
      const value = publication.stamp(publication.timestamp(hour));
      publication.element(".edit-timestamp")?.click();
      [
        ["#mm", value.month],
        ["#jj", value.day],
        ["#aa", value.year],
        ["#hh", value.hours],
        ["#mn", value.minutes],
        ["#hidden_mm", value.month],
        ["#hidden_jj", value.day],
        ["#hidden_aa", value.year],
        ["#hidden_hh", value.hours],
        ["#hidden_mn", value.minutes],
      ].forEach(([selector, current]) => publication.set(selector, current));
      publication.element(".save-timestamp")?.click();
    },
    tag(name) {
      publication.set("#new-tag-post_tag", name);
      publication.element("#post_tag .tagadd")?.click();
    },
    layout() {
      const element = cms.layout.element();
      if (!element || cms.layout.longread(cms.layout.value(element))) return;
      const label =
        element.options[element.selectedIndex]?.text?.toLowerCase() || "";
      if (!field.confirm(`🚨 Точно ${label}, не лонгрид? Меняем?`)) return;
      field.input(element, "longread");
    },
    thumbnail() {
      if (publication.element("#postimagediv #set-post-thumbnail img")) return;
      field.alert("🛑 Минус мини");
    },
    focus() {
      field.focus(publication.element("#publish"));
    },
    evergreen() {
      let found = false;
      widget.block.mapJson(
        publication.content(),
        widget.tag.promo,
        (full, data) => {
          if (!data || typeof data.text !== "string") return full;
          const text = widget.read.raw(data.text).toLowerCase();
          if (text.includes("эта статья уже публиковалась")) found = true;
          return full;
        },
      );
      return found;
    },
    title: {
      normalize(value) {
        let quotes = 0;
        return String(value || "")
          .replace(/\u00A0/g, "\u0020")
          .replace(/\u0022/g, () =>
            quotes++ % 4 < 2
              ? quotes % 2
                ? "\u00ab"
                : "\u00bb"
              : quotes % 2
                ? "\u201e"
                : "\u201c",
          )
          .replace(/\u0027/g, "\u2019")
          .replace(/\s*[\u002d\u2013\u2014\u2212]\s*/g, "\u0020\u2014\u0020")
          .replace(/[\u0020\u0009]+/g, "\u0020")
          .trim();
      },
      fields() {
        return [
          "#title",
          "input[name='rotation_titles[]']",
          "#favourite_title",
          "input[name='seo_title']",
        ].flatMap((selector) => field.elements(selector));
      },
      records() {
        const state = publication.sanitize.state();
        return publication.title.fields().map((item, index) => {
          const id = `${item.id || item.name || "field"}::${index}`;
          const record = (state.records[id] ??= { original: item.value });
          record.field = item;
          record.sanitized = publication.title.normalize(record.original);
          return record;
        });
      },
      sync() {
        publication.title.records().forEach((record) => {
          const value = publication.sanitize.state().active
            ? record.sanitized
            : record.original;
          if (record.field.value !== value) {
            record.field.value = value;
            publication.emit(record.field);
          }
          publication.title.paint(
            record.field,
            record.original !== record.sanitized,
          );
        });
      },
      paint(item, changed) {
        if (!changed) {
          item.style.outline = "";
          return;
        }
        item.style.outline = publication.sanitize.state().active
          ? "2px solid seagreen"
          : "2px solid crimson";
      },
    },
    footer: {
      telegram: {
        remove(value) {
          return value.replace(
            /<p\b[^>]*>\s*(?:<strong>)?\s*Есть о чем рассказать\?[\s\S]*?newsonliner_bot[\s\S]*?(?:<\/strong>)?\s*<\/p>/gi,
            "",
          );
        },
        add() {
          return '<p style="text-align: right;"><strong>Есть о чем рассказать? Пишите в наш <a href="https://t.me/newsonliner_bot" target="_blank">телеграм-бот</a>. Это анонимно и быстро</strong></p>';
        },
      },
      copyright: {
        remove(value) {
          return value.replace(
            /<p\b[^>]*>\s*(?:<span\b[^>]*>)?\s*(?:<strong>)?\s*Перепечатка текста и фотографий[\s\S]*?mailto:ga@onliner\.by[\s\S]*?<\/p>/gi,
            "",
          );
        },
        add() {
          return '<p style="text-align: right;"><span style="font-size: small;"><strong>Перепечатка текста и фотографий Onlíner без разрешения редакции запрещена. <a href="mailto:ga@onliner.by">ga@onliner.by</a></strong></span></p>';
        },
      },
      copyrighted() {
        const element = cms.layout.element();
        return element && !cms.layout.longread(cms.layout.value(element));
      },
      apply(value) {
        const clean = [
          publication.footer.telegram.remove,
          publication.footer.copyright.remove,
        ].reduce((string, fn) => fn(string), value);
        const next = `${clean.trimEnd()}\n${publication.footer.telegram.add()}`;
        return publication.footer.copyrighted()
          ? `${next}\n${publication.footer.copyright.add()}`
          : next;
      },
    },
    sanitize: {
      key: "__sanitizeState",
      state() {
        return (window[publication.sanitize.key] ??= {
          active: false,
          records: {},
        });
      },
      run() {
        const state = publication.sanitize.state();
        if (!state.active) {
          publication.title.records().forEach((record) => {
            record.original = record.field.value;
            record.sanitized = publication.title.normalize(record.original);
          });
        }
        state.active = !state.active;
        publication.title.sync();
        cms.editor.runHtmlBridge((value) => publication.footer.apply(value));
        window.scrollTo({ top: 0, behavior: "smooth" });
        [0, 50, 150].forEach((delay) =>
          setTimeout(publication.title.sync, delay),
        );
        return true;
      },
    },
    prepare() {
      const hour = publication.evergreen() ? 7 : 8;
      const sticky = hour === 7 ? "left" : "right";
      publication.visibility({ access: "public", sticky });
      publication.time(hour);
      publication.tag("Onliner");
      publication.layout();
      publication.thumbnail();
      publication.focus();
      return true;
    },
  };
  return {
    publication: {
      sanitize: {
        run: publication.sanitize.run,
      },
      prepare: {
        run: publication.prepare,
      },
    },
  };
};
