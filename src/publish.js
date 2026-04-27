import { encode, encoded, map } from "./core/escape.js";

(() => {
  const element = (selector, root = document) => root.querySelector(selector);
  const emit = (input) =>
    input.dispatchEvent(new Event("change", { bubbles: true }));
  const encodeTags = (value) =>
    map(value, (text) => (encoded(text) ? text : encode(text)));

  const controller = new AbortController();
  setTimeout(() => controller.abort(), 1500);

  fetch(location.origin + "/wp-admin/admin-ajax.php", {
    method: "GET",
    credentials: "same-origin",
    cache: "no-store",
    signal: controller.signal,
  })
    .then((response) => {
      if (!response.ok) {
        alert("⚠️ VPN");
        return;
      }

      const marked = [];
      const issues = [];

      const mark = (container, input) => {
        if (container) {
          marked.push(container);
          container.style.outline = "2px solid red";
          container.style.background = "#ffffe1";
        }
        if (input) {
          marked.push(input);
          input.style.outline = "1px solid red";
          input.style.background = "#ffffe1";
        }
      };

      const slug = element("#editable-post-name");
      const slugInputOpened =
        element("#new-post-slug") ||
        element('#edit-slug-box input[type="text"]');
      const longSlug = slug && /…|&hellip;/.test(slug.textContent);

      if (longSlug || slugInputOpened) {
        issues.push("⚠️ Слаг");
        if (longSlug) element("#edit-slug-buttons .edit-slug")?.click();
      }

      const thumbnail = element("#set-post-thumbnail img");
      const noThumbnail = !thumbnail;

      if (noThumbnail) {
        issues.push("⚠️ Миниатюра");
        mark(element("#postimagediv"));
      }

      const excerpt = element("#excerpt");
      const content = element("#content");
      const contentText = content?.value || "";
      const lead = (contentText.split(/\n\s*\n/)[0] || "").trim();
      const emptyExcerpt = !excerpt || !excerpt.value.trim();

      if (emptyExcerpt && excerpt && lead) {
        const temp = document.createElement("div");
        temp.innerHTML = lead;
        excerpt.value = temp.textContent.trim();
        emit(excerpt);
      }

      if (emptyExcerpt) {
        issues.push("⚠️ Цитата");
        mark(null, excerpt);
      }

      const video = element("#juicyVideo");
      if (video) {
        const checked = /\[video\]|\[\/video\]|<iframe[^>]*youtube/i.test(
          contentText,
        );
        if (video.checked !== checked) {
          video.checked = checked;
          emit(video);
        }
      }

      const hasVideo =
        /\[video\][\s\S]*?(youtube\.com|youtu\.be)[\s\S]*?\[\/video\]/i.test(
          contentText,
        ) || /<iframe[^>]*youtube/i.test(contentText);

      const videoAuthor = element("#video_author");
      const filledVideoAuthor = !!videoAuthor && !!videoAuthor.value.trim();

      if (filledVideoAuthor && !hasVideo) {
        issues.push("⚠️ Видео");
        mark(null, videoAuthor);
        setTimeout(() => {
          if (confirm("⚠️ Видео\n\nОчистить автора?")) {
            videoAuthor.value = "";
            emit(videoAuthor);
          }
        }, 0);
      }
      if (issues.length) {
        let attempts = 0;
        const focusIssues = setInterval(() => {
          const slugInput =
            element("#new-post-slug") ||
            element('#edit-slug-box input[type="text"]');
          if ((longSlug || slugInputOpened) && slugInput) {
            clearInterval(focusIssues);
            const seoTitle = element('input[name="seo_title"]')?.value.trim();
            const title = element("#title")?.value.trim();
            const slugSource = seoTitle || title;
            if (slugSource && (longSlug || !seoTitle)) {
              slugInput.value = slugSource;
              emit(slugInput);
            }
            mark(null, slugInput);
            slugInput.focus();
            slugInput.select();
            slugInput.scrollIntoView({ block: "center", behavior: "smooth" });
            if (issues.length > 1) {
              setTimeout(() => alert("🚧\n\n" + issues.join("\n")), 150);
            }
            return;
          }
          if (!longSlug || ++attempts > 20) {
            clearInterval(focusIssues);
            const first = longSlug
              ? element("#edit-slug-box")
              : noThumbnail
                ? element("#postimagediv")
                : emptyExcerpt
                ? excerpt
                  : videoAuthor?.closest(".layout-field") ||
                    videoAuthor?.parentElement;
            first?.scrollIntoView({ block: "center", behavior: "smooth" });
            if (!longSlug && emptyExcerpt && excerpt) {
              excerpt.focus();
              excerpt.select();
            }
            if (
              !longSlug &&
              !emptyExcerpt &&
              filledVideoAuthor &&
              !hasVideo &&
              videoAuthor
            ) {
              videoAuthor.focus();
              videoAuthor.select();
            }
            if (issues.length > 1) {
              setTimeout(() => alert("🚧\n\n" + issues.join("\n")), 150);
            }
          }
        }, 100);
        return;
      }
      const publishButton = element("#publish");
      if (!publishButton) return;
      if (content?.value.trim()) {
        content.value = encodeTags(content.value);
        emit(content);
      }
      publishButton.click();
      let attempts = 0;
      const waitAdvert = setInterval(() => {
        const advertPopup = element("#advert");
        const advertButton = element("#post-advert");
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
    })
    .catch(() => {
      alert("⚠️ VPN");
    });
})();
