import { llmPromptRules } from "./llm.prompt.rules.js";

const llmPrompt = {
  slug: {
    build(value) {
      return [
        "Read the Russian article text and return only a JSON object.",
        ...llmPromptRules.slug.lines(),
        'Format: {"slug":{"summary":"short russian phrase or empty string"}}',
        "Text:",
        value,
      ].join("\n\n");
    },
    normalize(value) {
      const source = value && typeof value === "object" ? value : {};
      const slug = source.slug && typeof source.slug === "object" ? source.slug : {};
      return {
        slug: {
          summary: String(slug.summary || ""),
        },
      };
    },
    empty() {
      return {
        slug: {
          summary: "",
        },
      };
    },
  },
  excerpt: {
    build(value, options = {}) {
      const limit = Number(options.limit) || 420;
      return [
        "Read the Russian article text and return only a JSON object.",
        ...llmPromptRules.excerpt.lines(limit),
        `Format: {"excerpt":{"text":"plain text up to ${limit} chars or empty string"}}`,
        "Text:",
        value,
      ].join("\n\n");
    },
    normalize(value) {
      const source = value && typeof value === "object" ? value : {};
      const excerpt = source.excerpt && typeof source.excerpt === "object" ? source.excerpt : {};
      return {
        excerpt: {
          text: String(excerpt.text || ""),
        },
      };
    },
    empty() {
      return {
        excerpt: {
          text: "",
        },
      };
    },
  },
  audit: {
    build(value, options = {}) {
      const slug = options.slug !== false;
      const excerpt = options.excerpt !== false;
      const excerptLimit = Number(options.excerptLimit) || 420;
      return [
        "Ты второй слой аудита после LanguageTool.",
        "Проверь русский редакционный текст и верни только машинно-применимые точечные правки.",
        "Не переписывай текст целиком и не объясняй результат вне JSON.",
        "Разрешено отмечать только:",
        "- явные опечатки;",
        "- явные орфографические ошибки;",
        "- явные грамматические ошибки;",
        "- явные ошибки согласования;",
        "- явные повторы слов или фраз;",
        "- очевидно лишнее слово;",
        "- грубые пунктуационные опечатки.",
        "Строго запрещено:",
        "- улучшать стиль без ошибки;",
        "- менять авторский тон;",
        "- заменять разговорные формулировки на нейтральные;",
        "- править HTML-теги, shortcode, JSON, URL, email, имена файлов и технические маркеры;",
        "- предлагать правку, если before не является точной подстрокой текста;",
        "- предлагать правку, если after не является минимальной заменой before;",
        "- предлагать несколько вариантов одной правки.",
        ...(slug ? llmPromptRules.slug.lines() : ["Не предлагай идею для slug."]),
        ...(excerpt ? llmPromptRules.excerpt.lines(excerptLimit) : ["Поле excerpt верни пустым."]),
        "Верни только валидный JSON-объект без markdown.",
        "Формат:",
        `{"edits":[{"before":"точная подстрока из текста","after":"минимальная замена","reason":"кратко","confidence":0.95}],"slug":{"summary":"короткая русская фраза или пустая строка"},"excerpt":{"text":"plain text до ${excerptLimit} символов или пустая строка"}}`,
        "Правила:",
        "- before должен полностью совпадать с фрагментом исходного текста;",
        "- after должен содержать только замену для before;",
        "- confidence от 0 до 1;",
        "- если уверенность ниже 0.9 — не добавляй правку;",
        '- если ошибок нет, верни {"edits":[],"slug":{"summary":""},"excerpt":{"text":""}} или заполни slug/excerpt только при наличии уверенной хорошей идеи;',
        slug
          ? "- slug.summary должен быть коротким, внятным и на русском; если уверенной идеи нет, верни пустую строку."
          : '- slug.summary должен быть пустой строкой.',
        excerpt
          ? `- excerpt.text должен быть plain text, на русском и не длиннее ${excerptLimit} символов; если уверенного варианта нет, верни пустую строку.`
          : '- excerpt.text должен быть пустой строкой.',
        "Текст:",
        value,
      ].join("\n\n");
    },
    normalize(value) {
      const source = value && typeof value === "object" ? value : {};
      const edits = Array.isArray(source.edits) ? source.edits : [];
      const slug = source.slug && typeof source.slug === "object" ? source.slug : {};
      const excerpt = source.excerpt && typeof source.excerpt === "object" ? source.excerpt : {};
      return {
        edits,
        slug: {
          summary: String(slug.summary || ""),
        },
        excerpt: {
          text: String(excerpt.text || ""),
        },
      };
    },
    empty() {
      return {
        edits: [],
        slug: {
          summary: "",
        },
        excerpt: {
          text: "",
        },
      };
    },
  },
};

export { llmPrompt };
