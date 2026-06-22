import { cms } from "./cms.js";
import { field } from "./dom.js";
import { widget } from "./widget.js";
import { excerpt } from "../excerpt.js";
import { tag } from "../tag.js";

const timer = {
  focusTick: 100,
  focusAttempts: 20,
  advertTick: 150,
  advertAttempts: 40,
  summaryDelay: 150,
};
const submit = {
  issues: [],
  running: false,
  element(selector, root = document) {
    return root === document
      ? field.element(selector)
      : root.querySelector(selector);
  },
  emit(input) {
    field.emit(input);
  },
  mark(container, input) {
    if (container) {
      container.style.outline = "2px solid red";
      container.style.background = "#ffffe1";
    }
    if (input) {
      input.style.outline = "1px solid red";
      input.style.background = "#ffffe1";
    }
  },
  state() {
    const excerptField = this.element("#excerpt");
    const content = this.element("#content");
    const contentText = content?.value || "";
    const videoAuthor = this.element("#video_author");
    return {
      slug: this.element("#editable-post-name"),
      slugInput:
        this.element("#new-post-slug") ||
        this.element('#edit-slug-box input[type="text"]'),
      seoTitle: this.element('input[name="seo_title"]'),
      thumbnail: this.element("#set-post-thumbnail img"),
      excerptField,
      content,
      contentText,
      tagsInput: tag.input(),
      video: this.element("#juicyVideo"),
      videoAuthor,
      filledVideoAuthor: !!videoAuthor && !!videoAuthor.value.trim(),
    };
  },
  seo(state) {
    return state?.seoTitle || null;
    const seoTitle = state.seoTitle;
    if (!seoTitle?.value.trim()) return;
    if (field.confirm("Есть SEO-заг. Выпиливаем?")) {
      seoTitle.value = "";
      this.emit(seoTitle);
    }
  },
  slug(state) {
    const long =
      !!state.slug && /…|&hellip;|&#8230;/i.test(state.slug.textContent || "");
    const opened = !!state.slugInput;
    if (long || opened) {
      this.issues.push("⚠️ Слаг");
      if (long) this.element("#edit-slug-buttons .edit-slug")?.click();
    }
    return { long, opened };
  },
  excerpt(state) {
    excerpt.style(state.excerptField);
    const initial = excerpt.state(
      state.excerptField?.value || "",
      state.contentText,
    );
    if (initial.empty && state.excerptField && initial.lead) {
      state.excerptField.value = initial.lead;
      this.emit(state.excerptField);
    }
    const current = excerpt.state(
      state.excerptField?.value || "",
      state.contentText,
    );
    if (current.invalid) {
      this.issues.push("⚠️ Цитата");
      this.mark(null, state.excerptField);
    }
    return current;
  },
  thumbnail(state) {
    const empty = !state.thumbnail;
    if (empty) {
      this.issues.push("⚠️ Миниатюра");
      this.mark(this.element("#postimagediv"));
    }
    return { empty };
  },
  async tags(state) {
    let invalid = tag.invalid();
    if (invalid.length && state.tagsInput) {
      const planned = invalid
        .map((name) => `${name} → ${tag.upper(name)}`)
        .join("\n");
      if (field.confirm(`Исправить метки?\n\n${planned}`)) {
        const current = tag.get();
        const results = [];
        for (const name of invalid) {
          results.push(await tag.rename(name));
        }
        tag.apply(state.tagsInput, current, results);
        const report = tag.report(results);
        invalid = tag.invalid();
        if (report.err.length) {
          setTimeout(() => field.alert(report.message), 0);
        }
      }
    }
    if (invalid.length) {
      this.issues.push(`⚠️ Метки: ${invalid.join(", ")}`);
      this.mark(this.element("#tagsdiv-post_tag"), state.tagsInput);
    }
    return { invalid };
  },
  video(state) {
    if (state.video) {
      const checked = /\[video\]|\[\/video\]|<iframe[^>]*youtube/i.test(
        state.contentText,
      );
      if (state.video.checked !== checked) {
        state.video.checked = checked;
        this.emit(state.video);
      }
    }
    const has =
      /\[video\][\s\S]*?(youtube\.com|youtu\.be)[\s\S]*?\[\/video\]/i.test(
        state.contentText,
      ) || /<iframe[^>]*youtube/i.test(state.contentText);
    if (state.filledVideoAuthor && !has) {
      this.issues.push("⚠️ Видео");
      this.mark(null, state.videoAuthor);
      setTimeout(() => {
        if (field.confirm("⚠️ Видео\n\nОчистить автора?")) {
          state.videoAuthor.value = "";
          this.emit(state.videoAuthor);
        }
      }, 0);
    }
    return { has };
  },
  focus(details) {
    let attempts = 0;
    const focusIssues = setInterval(() => {
      const slugInput =
        this.element("#new-post-slug") ||
        this.element('#edit-slug-box input[type="text"]');
      if ((details.slug.long || details.slug.opened) && slugInput) {
        clearInterval(focusIssues);
        const seoTitle = this.element('input[name="seo_title"]')?.value.trim();
        const title = this.element("#title")?.value.trim();
        const slugSource = seoTitle || title;
        if (slugSource && (details.slug.long || !seoTitle)) {
          slugInput.value = slugSource;
          this.emit(slugInput);
        }
        this.mark(null, slugInput);
        slugInput.focus();
        slugInput.select();
        slugInput.scrollIntoView({ block: "center", behavior: "smooth" });
        if (this.issues.length > 1) {
          setTimeout(
            () => field.alert("🚧\n\n" + this.issues.join("\n")),
            timer.summaryDelay,
          );
        }
        return;
      }
      if (!details.slug.long || ++attempts > timer.focusAttempts) {
        clearInterval(focusIssues);
        const first = details.slug.long
          ? this.element("#edit-slug-box")
          : details.thumbnail.empty
            ? this.element("#postimagediv")
            : details.excerpt.invalid
              ? details.state.excerptField
              : details.tags.invalid.length
                ? this.element("#tagsdiv-post_tag")
                : details.state.videoAuthor?.closest(".layout-field") ||
                  details.state.videoAuthor?.parentElement;
        first?.scrollIntoView({ block: "center", behavior: "smooth" });
        if (
          !details.slug.long &&
          details.excerpt.invalid &&
          details.state.excerptField
        ) {
          details.state.excerptField.focus();
          details.state.excerptField.select();
        }
        if (
          !details.slug.long &&
          !details.excerpt.invalid &&
          details.tags.invalid.length &&
          details.state.tagsInput
        ) {
          details.state.tagsInput.focus();
          details.state.tagsInput.select();
        }
        if (
          !details.slug.long &&
          !details.excerpt.invalid &&
          !details.tags.invalid.length &&
          details.state.filledVideoAuthor &&
          !details.video.has &&
          details.state.videoAuthor
        ) {
          details.state.videoAuthor.focus();
          details.state.videoAuthor.select();
        }
        if (this.issues.length > 1) {
          setTimeout(
            () => field.alert("🚧\n\n" + this.issues.join("\n")),
            timer.summaryDelay,
          );
        }
      }
    }, timer.focusTick);
  },
  guard() {
    const layout = cms.layout.element();
    if (!layout || !cms.layout.longread(cms.layout.value(layout))) return true;
    const sticky = this.element("input[name='sticky']:checked")?.value || "";
    const stickySide = sticky === "left" || sticky === "right";
    const hour = Number(
      this.element("#hh")?.value || this.element("#hidden_hh")?.value || NaN,
    );
    const scheduled = hour === 7 || hour === 8;
    if (stickySide || scheduled) return true;
    return field.confirm("⚠️ Лонгрид не на утро??\n\nСтавим??");
  },
  click(action) {
    if (action === "save") return cms.editor.save({ click: true });
    return cms.editor.publish({ click: true });
  },
  afterPublish() {
    let attempts = 0;
    const waitAdvert = setInterval(() => {
      const advertPopup = this.element("#advert");
      const advertButton = this.element("#post-advert");
      if (
        advertPopup &&
        getComputedStyle(advertPopup).display !== "none" &&
        advertButton
      ) {
        clearInterval(waitAdvert);
        advertButton.click();
      } else if (++attempts > timer.advertAttempts) {
        clearInterval(waitAdvert);
      }
    }, timer.advertTick);
  },
  submit(state, action) {
    if (!this.guard()) return;
    if (state.content?.value.trim()) {
      state.content.value = widget.ensure(state.content.value);
      this.emit(state.content);
    }
    const button = this.click(action);
    if (!button) return;
    if (action === "publish") {
      this.afterPublish();
    }
  },
  async execute(action = "publish") {
    if (this.running) return;
    this.running = true;
    this.issues = [];
    try {
      const state = this.state();
      this.seo(state);
      const slug = this.slug(state);
      const excerptState = this.excerpt(state);
      const thumbnail = this.thumbnail(state);
      const tagsState = await this.tags(state);
      const videoState = this.video(state);
      if (this.issues.length) {
        this.focus({
          state,
          slug,
          excerpt: excerptState,
          thumbnail,
          tags: tagsState,
          video: videoState,
        });
        return;
      }
      this.submit(state, action);
    } finally {
      this.running = false;
    }
  },
  run(action = "publish") {
    return cms.vpn
      .ensure()
      .then(() => this.execute(action))
      .catch((error) => {
        field.alert(error.message);
      });
  },
};

export { submit };
