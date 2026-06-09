export const runtimeCommands = {
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
  cleanup: {
    title: "Зачистка",
    glyph: "Broom",
    close: "stay",
  },
  proofread: {
    title: "Вычитка",
    glyph: "Scan Text",
    close: "stay",
  },
  "editor.nbsp": {
    title: "Пробел",
    glyph: "Spacebar",
    hotkeys: ["ArrowDown"],
    close: "stay",
  },
  "editor.comma": {
    title: "Запятая",
    glyph: "Comma",
    close: "stay",
  },
  "editor.colon": {
    title: "Двоеточие",
    glyph: "More Vertical",
    close: "stay",
  },
  "editor.dash": {
    title: "Тире",
    glyph: "Line Horizontal 1",
    hotkeys: ["Minus", "NumpadMinus"],
    close: "stay",
  },
  "editor.punct": {
    title: "Пунктуация",
    glyph: "Sine Wave Dots",
    hotkeys: ["Slash"],
    close: "stay",
  },
  "editor.quote": {
    title: "Кавычки",
    glyph: "Text Quote",
    hotkeys: ["Quote"],
    close: "stay",
  },
  "editor.qswap": {
    title: "Реплика",
    glyph: "Text Quote Opening",
    hotkeys: ["KeyC"],
    close: "stay",
  },
  "editor.accent": {
    title: "Ударение",
    glyph: "Gavel",
    close: "stay",
  },
  "editor.symbol": {
    title: "Символы",
    glyph: "Symbols",
    close: "stay",
  },
  "editor.math": {
    title: "Математики",
    glyph: "Math Symbols",
    close: "stay",
  },
  "editor.home": {
    title: "Стартуем",
    glyph: "Arrow Bounce",
    close: "stay",
  },
  "editor.left": {
    title: "Влево",
    glyph: "Chevron Left",
    hotkeys: ["ArrowLeft"],
    close: "stay",
  },
  "editor.right": {
    title: "Вправо",
    glyph: "Chevron Right",
    hotkeys: ["ArrowRight"],
    close: "stay",
  },
  "editor.letter": {
    title: "Регистр",
    glyph: "Text Font Size",
    hotkeys: ["KeyT"],
    close: "stay",
  },
  "editor.number": {
    title: "Число",
    glyph: "Text Number Format",
    hotkeys: ["KeyN"],
    close: "stay",
  },
  "editor.abbr": {
    title: "Аббревиатура",
    glyph: "Arrow Autofit Width",
    hotkeys: ["ArrowUp", "KeyA"],
    close: "stay",
  },
  "editor.year": {
    title: "Год",
    glyph: "Calendar Arrow Repeat All",
    hotkeys: ["KeyY"],
    close: "stay",
  },
  "editor.branch": {
    title: "Варианты",
    glyph: "Branch Compare",
    hotkeys: ["Equal", "NumpadAdd"],
    close: "stay",
  },
  "editor.inline": {
    title: "Инлайн",
    glyph: "Markdown",
    close: "stay",
  },
  "editor.block": {
    title: "Блок",
    glyph: "Text Header 1",
    close: "stay",
  },
  "editor.wrap": {
    title: "Обёртка",
    glyph: "Markdown",
    close: "stay",
  },
  "editor.em": {
    title: "Косой",
    glyph: "Text Italic",
    hotkeys: ["Comma"],
    close: "stay",
  },
  "editor.strong": {
    title: "Жирный",
    glyph: "Text Bold",
    hotkeys: ["Period"],
    close: "stay",
  },
  "editor.killem": {
    title: "Некосой",
    glyph: "Eraser Small",
    close: "stay",
  },
  "editor.note": {
    title: "Примечание",
    glyph: "Note",
    close: "stay",
  },
  "editor.list": {
    title: "Список",
    glyph: "Text Bullet List Square",
    hotkeys: ["KeyL"],
    close: "stay",
  },
  "editor.google": {
    title: "Google",
    image:
      "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/google/google-original.svg",
    hotkeys: ["KeyZ"],
    close: "stay",
  },
  "editor.gramota": {
    title: "Грамота",
    logo: "gramota",
    hotkeys: ["KeyQ"],
    close: "stay",
  },
  "editor.kinopoisk": {
    title: "Кинопоиск",
    logo: "kinopoisk",
    close: "stay",
  },
  "editor.scroll": {
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
    close: "stay",
  },
  "author.quote": {
    title: "Цитата",
    glyph: "Tooltip Quote",
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
  lead: {
    title: "Цитата",
    glyph: "Comment Text",
    close: "group",
  },
  toc: {
    title: "Содержание",
    glyph: "Compass Northwest",
    close: "group",
  },

  locator: {
    title: "Локатор",
    image:
      "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/wordpress/wordpress-plain.svg",
    close: "group",
  },
  "locator-madtest": {
    title: "Locator Madtest",
    logo: "madtest",
    close: "group",
  },
  sanitize: {
    title: "Санация",
    glyph: "Sparkle Action",
    close: "group",
  },
  login: {
    title: "Логин",
    glyph: "Lock Closed Key",
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
  widgets: {
    title: "Виджеты",
    glyph: "",
    close: "group",
  },
  corpus: {
    title: "Корпус",
    glyph: "Book",
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
  salary: {
    title: "Зарплата",
    glyph: "Money Hand",
    close: "group",
  },
  reset: {
    title: "Сброс",
    glyph: "Arrow Reset",
    close: "group",
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

  "parameters.time": {
    title: "Время",
    close: "stay",
    states: {
      keep: {
        title: "Сразу",
        glyph: "Play Circle",
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
  "parameters.sticky": {
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
  "parameters.updated": {
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
  "parameters.access": {
    title: "Видимость",
    close: "stay",
    states: {
      public: {
        title: "Открыто",
        glyph: "Eye",
      },
      link: {
        title: "Доступно по ссылке",
        glyph: "Incognito",
      },
    },
  },
  "parameters.mode": {
    title: "Запуск",
    close: "stay",
    states: {
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
  "parameters.submit": {
    title: "Запуск",
    glyph: "Production",
    close: "stay",
  },
};
