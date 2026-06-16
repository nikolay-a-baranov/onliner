const byId = {
  editor: {
    title: "Корректор",
    glyph: "Eraser Tool",
    close: "group",
  },
  reader: {
    title: "Чтение",
    glyph: "Glasses",
    close: "group",
  },
  launcher: {
    title: "Onliner",
    logo: "onliner",
    close: "group",
  },
  "launchpad.onliner": {
    title: "Onliner",
    logo: "onliner",
    close: "stay",
  },
  "launchpad.wordpress": {
    title: "WordPress",
    image:
      "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/wordpress/wordpress-plain.svg",
    close: "stay",
  },
  "launchpad.madtest": {
    title: "Madtest",
    logo: "madtest",
    close: "stay",
  },
  cleanup: {
    title: "Зачистка",
    glyph: "Broom",
    close: "stay",
  },
  audit: {
    title: "Аудит",
    glyph: "Predictions",
    close: "stay",
  },
  nbsp: {
    title: "Пробел",
    glyph: "Spacebar",
    hotkeys: ["ArrowDown"],
    close: "stay",
  },
  comma: {
    title: "Запятая",
    glyph: "Comma",
    hotkeys: ["KeyC"],
    close: "stay",
  },
  colon: {
    title: "Двоеточие",
    glyph: "More Vertical",
    close: "stay",
  },
  dash: {
    title: "Тире",
    glyph: "Line Horizontal 1",
    hotkeys: ["Minus", "NumpadMinus"],
    close: "stay",
  },
  punct: {
    title: "Пунктуация",
    glyph: "Sine Wave Dots",
    hotkeys: ["Slash"],
    close: "stay",
  },
  quote: {
    title: "Кавычки",
    glyph: "Text Quote",
    hotkeys: ["Quote"],
    close: "stay",
  },
  qswap: {
    title: "Реплика",
    glyph: "Text Quote Opening",
    close: "stay",
  },
  accent: {
    title: "Ударение",
    glyph: "Gavel",
    hotkeys: ["Backquote"],
    close: "stay",
  },
  symbol: {
    title: "Символы",
    glyph: "Symbols",
    hotkeys: ["KeyS"],
    close: "stay",
  },
  math: {
    title: "Матемша",
    glyph: "Math Symbols",
    hotkeys: ["KeyM"],
    close: "stay",
  },
  home: {
    title: "Старт",
    glyph: "Arrow Bounce",
    close: "stay",
  },
  left: {
    title: "Влево",
    glyph: "Chevron Left",
    hotkeys: ["ArrowLeft"],
    close: "stay",
  },
  right: {
    title: "Вправо",
    glyph: "Chevron Right",
    hotkeys: ["ArrowRight"],
    close: "stay",
  },
  capital: {
    title: "Заглавная",
    glyph: "Text Font Size",
    hotkeys: ["Backslash"],
    close: "stay",
  },
  token: {
    title: "Замена",
    glyph: "Molecule",
    hotkeys: ["ArrowUp", "Equal"],
    close: "stay",
  },
  number: {
    title: "Число",
    glyph: "Text Number Format",
    close: "stay",
  },
  abbr: {
    title: "Аббревиатура",
    glyph: "Arrow Autofit Width",
    close: "stay",
  },
  year: {
    title: "Год",
    glyph: "Calendar Arrow Repeat All",
    close: "stay",
  },
  branch: {
    title: "Варианты",
    glyph: "Branch Compare",
    close: "stay",
  },
  inflect: {
    title: "Падеж",
    glyph: "Channel Share",
    close: "stay",
  },
  block: {
    title: "Блок",
    glyph: "Code Block Edit",
    hotkeys: ["Period"],
    close: "stay",
  },
  inline: {
    title: "Инлайн",
    glyph: "Code",
    hotkeys: ["Comma"],
    close: "stay",
  },
  wrap: {
    title: "Обёртка",
    glyph: "Markdown",
    close: "stay",
  },
  separator: {
    title: "Разделитель",
    glyph: "Line Horizontal 1 Dash Dot Dash",
    hotkeys: ["KeyH"],
    close: "stay",
  },
  italic: {
    title: "Курсив",
    glyph: "Text Italic",
    hotkeys: ["BracketRight"],
    close: "stay",
  },
  bold: {
    title: "Жирный",
    glyph: "Text Bold",
    hotkeys: ["BracketLeft"],
    close: "stay",
  },
  clear: {
    title: "Очистка",
    glyph: "Eraser Small",
    close: "stay",
  },
  note: {
    title: "Примечание",
    glyph: "Note",
    close: "stay",
  },
  list: {
    title: "Список",
    glyph: "Text Bullet List Square",
    hotkeys: ["KeyL"],
    close: "stay",
  },
  google: {
    title: "Google",
    image:
      "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/google/google-original.svg",
    hotkeys: ["KeyG"],
    close: "stay",
  },
  gramota: {
    title: "Грамота",
    logo: "gramota",
    hotkeys: ["KeyU"],
    close: "stay",
  },
  kinopoisk: {
    title: "Кинопоиск",
    logo: "kinopoisk",
    hotkeys: ["KeyR"],
    close: "stay",
  },
  scroll: {
    title: "Перемотка",
    glyph: "Dual Screen Update",
    close: "stay",
  },
  author: {
    title: "Журналист",
    glyph: "Calligraphy Pen",
    close: "group",
  },
  "author.emphasis": {
    title: "Разметка",
    glyph: "Draw Text",
    close: "stay",
  },
  "author.heading": {
    title: "Заголовок",
    glyph: "Channel",
    hotkeys: ["KeyH"],
    close: "stay",
  },
  blockquote: {
    title: "Цитата",
    glyph: "Tooltip Quote",
    close: "stay",
  },
  more: {
    title: "Далее…",
    glyph: "TextBox More",
    close: "stay",
  },
  embed: {
    title: "Встройка",
    glyph: "Clipboard Image",
    hotkeys: ["KeyV"],
    close: "stay",
  },
  photo: {
    title: "Фото",
    glyph: "Camera",
    close: "stay",
  },
  video: {
    title: "Видео",
    glyph: "Video",
    close: "stay",
  },
  "author.more": {
    title: "Далее…",
    glyph: "TextBox More",
    close: "stay",
  },
  "author.embed": {
    title: "Встройка",
    glyph: "Clipboard Image",
    close: "stay",
  },
  "author.readmore": {
    title: "Читайте также",
    glyph: "Book Add",
    close: "stay",
  },
  "author.photo": {
    title: "Фото",
    glyph: "Camera",
    close: "stay",
  },
  "author.video": {
    title: "Видео",
    glyph: "Video",
    close: "stay",
  },
  "author.cleanup": {
    title: "Зачистка",
    glyph: "Text Box Settings",
    close: "stay",
  },
  excerpt: {
    title: "Цитата",
    glyph: "Subtitles",
    hotkeys: ["KeyW"],
    close: "stay",
  },
  titles: {
    title: "Заголовки",
    glyph: "Slide Text Title",
    close: "stay",
  },
  slug: {
    title: "Слаг",
    glyph: "Slide Link",
    close: "stay",
  },
  toc: {
    title: "Содержание",
    glyph: "Compass Northwest",
    close: "group",
  },
  resize: {
    title: "Увеличение",
    glyph: "Resize Image",
    close: "stay",
  },
  interview: {
    title: "Интервью",
    glyph: "Chat Multiple",
    close: "stay",
  },
  "image.caption": {
    title: "Подпись",
    glyph: "Image Alt Text",
    close: "stay",
  },
  "clipboard.link": {
    title: "Ссылка",
    glyph: "Clipboard Link",
    close: "stay",
  },
  wordpress: {
    title: "WordPress",
    image:
      "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/wordpress/wordpress-plain.svg",
    close: "group",
  },
  "madtest.find": {
    title: "Madtest",
    favicon: "madtest.ru",
    close: "group",
  },
  sanitize: {
    title: "Санация",
    glyph: "Sanitize",
    hotkeys: ["KeyQ"],
    close: "group",
  },
  login: {
    title: "Логин",
    glyph: "Lock Closed Key",
    close: "group",
  },
  whoami: {
    title: "Кто я?",
    glyph: "Person Info",
    close: "group",
  },
  plan: {
    title: "План",
    glyph: "Calendar Agenda",
    close: "group",
  },
  dump: {
    title: "Дамп",
    glyph: "Mail Inbox",
    close: "group",
  },
  diff: {
    title: "Дифф",
    glyph: "Scales",
    close: "group",
  },
  feedback: {
    title: "Косяк",
    glyph: "Bug",
    close: "stay",
  },
  widgets: {
    title: "Виджеты",
    glyph: "Puzzle Piece",
    close: "group",
  },
  filter: {
    title: "Фильтр",
    glyph: "Filter",
    close: "group",
  },
  tags: {
    title: "Метки",
    glyph: "Tag Multiple",
    close: "group",
  },
  "tags.suggest": {
    title: "Подбор",
    glyph: "Tag Add",
    close: "stay",
  },
  clone: {
    title: "Клон",
    glyph: "Copy",
    close: "group",
  },
  madtest: {
    title: "Madtest",
    glyph: "",
    close: "group",
  },
  "madtest-find": {
    title: "Madtest Find",
    glyph: "",
    close: "stay",
  },
  "madtest-export": {
    title: "Madtest Export",
    glyph: "",
    close: "group",
  },
  "madtest-cleanup": {
    title: "Madtest Cleanup",
    glyph: "",
    close: "group",
  },
  "madtest-editor": {
    title: "Madtest Editor",
    glyph: "",
    close: "group",
  },
  prepare: {
    title: "Утро",
    glyph: "Calendar Settings",
    close: "stay",
  },
  refresh: {
    title: "Свежак",
    glyph: "Calendar Arrow Repeat All",
    close: "stay",
  },
  "params.time": {
    title: "Время",
    close: "stay",
    states: {
      keep: {
        title: "Оставить",
        glyph: "Play Circle",
      },
      now: {
        title: "Поднять",
        glyph: "Chevron Circle Up",
      },
      eight: {
        title: "08:00",
        glyph: "Number Circle 8",
      },
      seven: {
        title: "07:00",
        glyph: "Number Circle 7",
      },
      custom: {
        title: "Другое",
        glyph: "More Circle",
      },
    },
  },
  "params.sticky": {
    title: "Лепка",
    close: "stay",
    states: {
      none: {
        title: "Не прилеплена",
        glyph: "Panel Top Gallery",
      },
      right: {
        title: "Прилепить справа",
        glyph: "Panel Right Contract",
      },
      left: {
        title: "Прилепить слева",
        glyph: "Panel Left Contract",
      },
    },
  },
  "params.updated": {
    title: "Обнова",
    close: "stay",
    states: {
      off: {
        title: "Не поднимать",
        glyph: "Square",
      },
      on: {
        title: "Поднять",
        glyph: "Arrow Square Up Right",
      },
    },
  },
  "params.visibility": {
    title: "Видимость",
    close: "stay",
    states: {
      public: {
        title: "Открыто",
        glyph: "People Community",
      },
      link: {
        title: "Доступно по ссылке",
        glyph: "Incognito",
      },
    },
  },
  "params.status": {
    title: "Статус",
    close: "stay",
    states: {
      published: {
        title: "Опубликовано",
        glyph: "Eye",
      },
      draft: {
        title: "Черновик",
        glyph: "Eye Off",
      },
    },
  },
  "params.mode": {
    title: "Запуск",
    close: "stay",
    states: {
      draft: {
        title: "Вырубить",
        glyph: "Power",
      },
      save: {
        title: "Сохранить",
        glyph: "Save",
      },
      publish: {
        title: "Опубликовать",
        glyph: "Rocket",
      },
      schedule: {
        title: "Запланировать",
        glyph: "Calendar Clock",
      },
      update: {
        title: "Обновить",
        glyph: "Arrow Sync",
      },
    },
  },
  "params.submit": {
    title: "Запуск",
    glyph: "Patch",
    close: "stay",
  },
};
const list = {
  strings(value) {
    return Array.isArray(value) ? value : [];
  },
};
const command = {
  separator(value) {
    return value?.type === "separator";
  },
  hotkeys(value = {}) {
    if (Array.isArray(value.hotkeys)) return value.hotkeys;
    if (value.hotkey) return [value.hotkey];
    return [];
  },
  access(value = {}) {
    return {
      users: list.strings(value.users),
      userIds: list.strings(value.userIds),
      roles: list.strings(value.roles),
    };
  },
  static(id, value = {}) {
    const meta = commands.meta(id);
    return {
      id,
      toolId: String(value.toolId || id),
      title: String(value.title || meta.title || ""),
      glyph: String(value.glyph || meta.glyph || ""),
      emoji: String(value.emoji || meta.emoji || ""),
      image: String(value.image || meta.image || ""),
      logo: String(value.logo || meta.logo || ""),
      favicon: String(value.favicon || meta.favicon || ""),
      faviconFallback: String(
        value.faviconFallback || meta.faviconFallback || "",
      ),
      close: String(value.close || meta.close || ""),
      hotkeys: command.hotkeys(value).length
        ? command.hotkeys(value)
        : command.hotkeys(meta),
      states: value.states || meta.states || {},
      section: String(value.section || ""),
    };
  },
  normalize(value) {
    if (command.separator(value)) {
      return {
        type: "separator",
        ...command.access(value),
      };
    }
    if (typeof value === "string") {
      return {
        ...command.static(value),
        ...command.access(),
      };
    }
    const id = String(value?.id || "");
    return {
      ...command.static(id, value || {}),
      ...command.access(value),
    };
  },
};
export const commands = {
  byId,
  meta(id) {
    return commands.byId[String(id || "")] || {};
  },
  normalize(value) {
    return command.normalize(value);
  },
};
