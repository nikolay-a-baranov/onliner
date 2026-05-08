import { vpn } from "./core/admin.js";
import { field } from "./core/fields.js";
import { widget } from "./core/widget.js";
import { excerpt } from "./core/excerpt.js";
import { tag } from "./core/tag.js";

(() => {
  const publish = {
    issues: [],

    element(selector, root = document) {
      return root.querySelector(selector);
    },

    emit(input) {
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
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

    get state() {
      const excerptField = this.element("#excerpt");
      const content = this.element("#content");
      const contentText = content?.value || "";
      const videoAuthor = this.element("#video_author");

      return {
        slug: this.element("#editable-post-name"),
        slugInput:
          this.element("#new-post-slug") ||
          this.element('#edit-slug-box input[type="text"]'),
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

    slug(state) {
      const long = !!state.slug && /…|&hellip;/.test(state.slug.textContent);
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

        if (confirm(`Исправить метки?\n\n${planned}`)) {
          const current = tag.get();
          const results = [];

          for (const name of invalid) {
            results.push(await tag.rename(name));
          }

          tag.apply(state.tagsInput, current, results);

          const report = tag.report(results);
          invalid = tag.invalid();

          if (report.err.length) {
            setTimeout(() => alert(report.message), 0);
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
          if (confirm("⚠️ Видео\n\nОчистить автора?")) {
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

          const seoTitle = this.element(
            'input[name="seo_title"]',
          )?.value.trim();
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
            setTimeout(() => alert("🚧\n\n" + this.issues.join("\n")), 150);
          }

          return;
        }

        if (!details.slug.long || ++attempts > 20) {
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
            setTimeout(() => alert("🚧\n\n" + this.issues.join("\n")), 150);
          }
        }
      }, 100);
    },

    submit(state) {
      const publishButton = this.element("#publish");
      if (!publishButton) return;

      if (state.content?.value.trim()) {
        state.content.value = widget.ensure(state.content.value);
        this.emit(state.content);
      }

      publishButton.click();

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
        } else if (++attempts > 40) {
          clearInterval(waitAdvert);
        }
      }, 150);
    },

    async run() {
      const state = this.state;
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

      this.submit(state);
    },
  };

  vpn
    .ensure()
    .then(() => publish.run())
    .catch((error) => {
      alert(error.message);
    });
})();

