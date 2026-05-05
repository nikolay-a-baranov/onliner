import { field } from "./core/fields.js";

(() => {
  const reset = {
    key: "__bmlResetSnapshot",

    query(selector, root = document) {
      return root.querySelector(selector);
    },

    all(selector, root = document) {
      return [...root.querySelectorAll(selector)];
    },

    press(selector) {
      const element = reset.query(selector);
      if (element) element.click();
    },

    rotation(values) {
      const addButton = reset.query("#rotation-titles-add");
      values.forEach((value, index) => {
        let inputs = reset.all(
          "#rotation-titles-list .rt__item:not([hidden]) .rt__input",
        );
        while (
          inputs.length <= index &&
          addButton &&
          addButton.style.display !== "none"
        ) {
          addButton.click();
          inputs = reset.all(
            "#rotation-titles-list .rt__item:not([hidden]) .rt__input",
          );
        }
        field.input(inputs[index], value);
      });
      reset.all("#rotation-titles-list .rt__item:not([hidden]) .rt__input")
        .slice(values.length)
        .forEach((element) => field.input(element, ""));
    },

    tags() {
      reset
        .all("#post_tag .tagchecklist .ntdelbutton")
        .forEach((button) => button.click());
      field.input(reset.query("#tax-input-post_tag"), "");
      field.input(reset.query("#new-tag-post_tag"), "");
    },

    data: {
      enabled: [
        "titles",
        "meta",
        "status",
        "visibility",
        "timestamp",
        "tags",
        "layout",
        "flags",
      ],
      title:
        '  Тестовый  заголовок – "с неправильными" кавычками -- и лишними   пробелами  ',
      rotation: [
        "  Проверяем -- заголовки  ",
        `  Я - Д'Артаньян  `,
        `  Остальные – "********"  `,
      ],
      favourite: `  Крик -- "тестовый"  `,
      seo: `  SEO -- "тестовый" заголовок  `,
      excerpt: "",
      photoAuthor: `  Фотограф -- "Onliner".  `,
      videoAuthor: `  Видеограф -- "Onliner".  `,
      source: `  Источник -- Команда Каталога Onliner. Иллюстрации: Максим Тарналицкий.  `,
      status: "draft",
      visibility: "private",
      timestamp: {
        mm: "02",
        jj: "20",
        aa: "2002",
        hh: "20",
        mn: "02",
      },
      layout: "news",
      flags: {
        juicyVideo: false,
        updated: false,
      },
    },

    schema: {
      title: {
        get: () => reset.query("#title")?.value || "",
        set: (value) => field.input(reset.query("#title"), value),
      },
      rotation: {
        get: () =>
          reset
            .all("#rotation-titles-list .rt__item:not([hidden]) .rt__input")
            .map((element) => element.value),
        set: (value) => reset.rotation(value),
      },
      favourite: {
        get: () => reset.query("#favourite_title")?.value || "",
        set: (value) => field.input(reset.query("#favourite_title"), value),
      },
      seo: {
        get: () => reset.query('input[name="seo_title"]')?.value || "",
        set: (value) => field.input(reset.query('input[name="seo_title"]'), value),
      },
      excerpt: {
        get: () => reset.query("#excerpt")?.value || "",
        set: (value) => field.input(reset.query("#excerpt"), value),
      },
      photoAuthor: {
        get: () => reset.query("#photo_author")?.value || "",
        set: (value) => field.input(reset.query("#photo_author"), value),
      },
      videoAuthor: {
        get: () => reset.query("#video_author")?.value || "",
        set: (value) => field.input(reset.query("#video_author"), value),
      },
      source: {
        get: () => reset.query("#post_source")?.value || "",
        set: (value) => field.input(reset.query("#post_source"), value),
      },
      status: {
        get: () => reset.query("#post_status")?.value || "",
        set: (value) => {
          reset.press(".edit-post-status");
          field.input(reset.query("#post_status"), value);
          reset.press(".save-post-status");
        },
      },
      visibility: {
        get: () =>
          reset.query('input[name="visibility"]:checked')?.value || "",
        set: (value) => {
          if (!value) return;
          reset.press(".edit-visibility");
          field.click(reset.query(`#visibility-radio-${value}`), true);
          reset.press(".save-post-visibility");
        },
      },
      timestamp: {
        get: () => ({
          mm: reset.query("#mm")?.value || "",
          jj: reset.query("#jj")?.value || "",
          aa: reset.query("#aa")?.value || "",
          hh: reset.query("#hh")?.value || "",
          mn: reset.query("#mn")?.value || "",
        }),
        set: (value) => {
          reset.press(".edit-timestamp");
          Object.entries(value).forEach(([field, current]) => {
            field.input(reset.query(`#${field}`), current);
          });
          reset.press(".save-timestamp");
        },
      },
      tags: {
        get: () => reset.query("#tax-input-post_tag")?.value || "",
        set: (value) => {
          reset.tags();
          field.input(reset.query("#tax-input-post_tag"), value);
        },
      },
      layout: {
        get: () => reset.query("#layout_select")?.value || "",
        set: (value) => field.input(reset.query("#layout_select"), value),
      },
      flags: {
        get: () => ({
          juicyVideo: !!reset.query("#juicyVideo")?.checked,
          updated: !!reset.query("#updated")?.checked,
        }),
        set: (value) => {
          Object.entries(value).forEach(([name, checked]) => {
            field.click(reset.query(`#${name}`), checked);
          });
        },
      },
    },

    blocks: {
      titles() {
        field.input(reset.query("#title"), reset.data.title);
        reset.rotation(reset.data.rotation);
        field.input(reset.query("#favourite_title"), reset.data.favourite);
        field.input(reset.query('input[name="seo_title"]'), reset.data.seo);
      },

      meta() {
        field.input(reset.query("#excerpt"), reset.data.excerpt);
        field.input(reset.query("#photo_author"), reset.data.photoAuthor);
        field.input(reset.query("#video_author"), reset.data.videoAuthor);
        field.input(reset.query("#post_source"), reset.data.source);
      },

      status() {
        reset.press(".edit-post-status");
        field.input(reset.query("#post_status"), reset.data.status);
        reset.press(".save-post-status");
      },

      visibility() {
        reset.press(".edit-visibility");
        field.click(
          reset.query(`#visibility-radio-${reset.data.visibility}`),
          true,
        );
        reset.press(".save-post-visibility");
      },

      timestamp() {
        reset.press(".edit-timestamp");
        Object.entries(reset.data.timestamp).forEach(([field, value]) => {
          field.input(reset.query(`#${field}`), value);
        });
        reset.press(".save-timestamp");
      },

      tags() {
        reset.tags();
      },

      layout() {
        field.input(reset.query("#layout_select"), reset.data.layout);
      },

      flags() {
        Object.entries(reset.data.flags).forEach(([name, checked]) => {
          field.click(reset.query(`#${name}`), checked);
        });
      },
    },

    save() {
      window[reset.key] = field.capture(reset.schema);
    },

    restore() {
      const snapshot = window[reset.key];
      if (!snapshot) return;
      field.restore(reset.schema, snapshot);
      delete window[reset.key];
    },

    run(enabled = reset.data.enabled) {
      enabled.forEach((name) => {
        const block = reset.blocks[name];
        if (typeof block === "function") block();
      });
    },

    toggle() {
      if (window[reset.key]) {
        reset.restore();
        return;
      }
      reset.save();
      reset.run();
    },
  };

  reset.toggle();
})();



