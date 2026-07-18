const llm = {
  parse(value) {
    try {
      return JSON.parse(value);
    } catch {
      throw new Error(String(value || "").slice(0, 300));
    }
  },
  clean(value, fallback = "{}") {
    const string = String(value || "")
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();
    const start = string.indexOf("{");
    const end = string.lastIndexOf("}");
    if (start < 0 || end < 0) return fallback;
    return string.slice(start, end + 1);
  },
  empty(model) {
    return {
      error: {
        retry: true,
        message: `${model}: пустой или невалидный ответ`,
      },
      model,
    };
  },
  adapter: {
    gemini: {
      label: "Gemini",
      link(model) {
        return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
      },
      authorize(resolveKey) {
        const key = resolveKey("gemini");
        return {
          "Content-Type": "application/json",
          "x-goog-api-key": key,
        };
      },
      compose(model, prompt) {
        return JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0,
            responseMimeType: "application/json",
          },
        });
      },
      extract(value) {
        return value.candidates?.[0]?.content?.parts?.[0]?.text;
      },
      retry(value) {
        const code = value.error?.code;
        return code === 404 || code === 503 || code === 429;
      },
      describe(value, model) {
        const code = value.error?.code;
        if (code === 503) return `${model}: перегружен`;
        if (code === 429) return `${model}: превышен лимит`;
        if (code === 400) return `${model}: некорректный запрос`;
        return value.error?.message || `${model}: ошибка Gemini API`;
      },
    },
    qwen: {
      label: "Qwen",
      link() {
        return "https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions";
      },
      authorize(resolveKey) {
        const key = resolveKey("qwen");
        return {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        };
      },
      compose(model, prompt) {
        return JSON.stringify({
          model,
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0,
          response_format: { type: "json_object" },
        });
      },
      extract(value) {
        return value.choices?.[0]?.message?.content;
      },
      retry(value) {
        const code = value.error?.code || value.error?.status_code;
        const status = Number(value.statusCode || value.status_code || 0);
        return code === "Throttling" || status === 429 || status === 503;
      },
      describe(value, model) {
        const code = value.error?.code || value.error?.status_code;
        const message = value.error?.message || value.message;
        if (code === "Throttling") return `${model}: превышен лимит`;
        if (code === "InvalidApiKey") return `${model}: неверный API-ключ`;
        if (code === "InvalidParameter") return `${model}: некорректный запрос`;
        return message || `${model}: ошибка Qwen API`;
      },
    },
  },
  decode(adapter, raw, config) {
    config.onDebug({
      source: "llm",
      provider: config.provider,
      model: config.model,
      chunk: config.input,
      raw,
    });
    const value = llm.parse(raw);
    if (value.error) return { error: value.error, model: config.model };
    const string = adapter.extract(value);
    if (!string) return llm.empty(config.model);
    try {
      return {
        ...llm.parse(llm.clean(string, config.fallback)),
        model: config.model,
      };
    } catch {
      return llm.empty(config.model);
    }
  },
  send(adapter, config) {
    return fetch(adapter.link(config.model), {
      method: "POST",
      headers: adapter.authorize(config.resolveKey),
      body: adapter.compose(config.model, config.prompt),
    })
      .then((response) => response.text())
      .then((raw) => llm.decode(adapter, raw, config));
  },
  run(config) {
    const adapter = llm.adapter[config.provider];
    const models = Array.isArray(config.models) ? config.models : [];
    const attempt = (list) => {
      const [model, ...rest] = list;
      if (!adapter) throw new Error(`Провайдер недоступен: ${config.provider}`);
      if (!model) throw new Error(`${adapter.label} недоступен. Попробуй позже.`);
      config.onModel(model);
      return llm
        .send(adapter, {
          ...config,
          model,
        })
        .then((value) => {
          if (!value.error) {
            config.onModel(value.model);
            return value;
          }
          if ((value.error?.retry || adapter.retry(value)) && rest.length) {
            return attempt(rest);
          }
          throw new Error(value.error?.message || adapter.describe(value, model));
        });
    };
    return attempt(models);
  },
};


const llmPromptRules = {
  slug: {
    lines() {
      return [
        "Предложи готовый слаг записи: латиница в нижнем регистре, слова разделены одиночными дефисами.",
        "34 символа с учетом дефисов — только абсолютный максимум, а не целевая длина.",
        "Приоритет — самый короткий конкретный вариант, который однозначно передает основную тему материала. Не добавляй детали только ради длины.",
        "Сначала составь короткую смысловую формулировку на русском из слов и понятий исходного текста. Затем только транслитерируй ее латиницей.",
        "Не переводи русские слова на английский. Английские слова разрешены только когда они уже есть в исходном тексте как имя, бренд или устойчивый термин.",
        "Если в результате появился английский перевод русского слова, замени его русской транслитерацией.",
        "Если короткий конкретный вариант уже получился, не расширяй его уточнениями, датами, местами, числами и второстепенными признаками.",
        "Слаг должен отражать основной объект или устойчивую тему записи и не быть слишком общим вроде news, story, article, interview.",
        "Допустимы короткие назывные конструкции; не сохраняй вопросительные слова и синтаксис заголовка, если они не нужны для смысла.",
        "Не используй даты, кликбейт, кавычки, URL, email, имена файлов, код, служебные слова и повторяющиеся дефисы.",
        "Если уверенного конкретного варианта нет, верни пустую строку.",
      ];
    },
  },
  excerpt: {
    fit(value = "", limit = 420) {
      const text = String(value || "")
        .replace(/\s+/g, " ")
        .trim();
      if (text.length <= limit) return text;
      const complete = text.slice(0, limit + 1).match(/^.*[.!?…](?=\s|$)/u)?.[0]?.trim() || "";
      if (complete.length >= 320) return complete;
      const cut = text
        .slice(0, limit - 1)
        .replace(/\s+\S*$/, "")
        .replace(/[,:;\-–—]+$/u, "")
        .trim();
      return cut ? `${cut}.` : "";
    },
    lines(limit = 420) {
      return [
        `Сформируй excerpt для WordPress: ориентир 400 символов с пробелами, абсолютный максимум ${limit}. Ответ длиннее ${limit} символов запрещен.`,
        "Передай только общую идею материала: основной объект, главное событие или действие и его ключевой смысл. Не перечисляй подробности.",
        "Используй формулировки первого смыслового абзаца как основу. Сокращай его удалением второстепенного, а не переписывай заново.",
        "Сохраняй исходную лексику, порядок основной мысли и тон первого смыслового абзаца. Не заменяй формулировки синонимами ради выразительности.",
        "Удаляй даты, числа, имена второстепенных участников, географические уточнения, примеры, перечисления, причины второго порядка и другие детали, если без них сохраняется главный смысл.",
        "Не добавляй новую подачу, выводы, оценки, образность, связки и факты, которых нет в первом смысловом абзаце.",
        `Если первый смысловой абзац длиннее ${limit} символов, продолжай удалять подробности, пока текст не станет примерно 380–400 символов и не превысит ${limit}.`,
        "При сокращении обязательно сохрани субъект, основное действие или событие и главный результат либо проблему. Допускается только минимальная грамматическая склейка оставшихся частей.",
        "Не используй следующие абзацы, если первый смысловой абзац уже передает общую идею. Добавить один факт из следующего абзаца можно только когда без него основной смысл непонятен.",
        `Перед ответом пересчитай символы с пробелами. Цель — около 400, максимум — ${limit}. Если получилось больше ${limit}, удаляй детали повторно.`,
        "Excerpt должен быть на русском, обычным завершенным текстом без HTML, markdown, кавычек-оберток, ссылок, подписей и служебных формул.",
        "Если корректный excerpt по этим правилам не получается, верни пустую строку.",
      ];
    },

  },
};

const llmPrompt = {
  slug: {
    build(value) {
      return [
        "Прочитай русский текст записи и верни только JSON-объект без markdown.",
        ...llmPromptRules.slug.lines(),
        'Формат: {"slug":{"text":"готовый латинский slug до 34 символов или пустая строка"}}',
        "Текст:",
        value,
      ].join("\n\n");
    },
    normalize(value) {
      const source = value && typeof value === "object" ? value : {};
      const slug = source.slug && typeof source.slug === "object" ? source.slug : {};
      return {
        slug: {
          text: String(slug.text || slug.summary || ""),
        },
      };
    },
    empty() {
      return {
        slug: {
          text: "",
        },
      };
    },
  },
  excerpt: {
    build(value, options = {}) {
      const limit = Number(options.limit) || 420;
      return [
        "Прочитай русский текст записи и верни только JSON-объект без markdown.",
        ...llmPromptRules.excerpt.lines(limit),
        `Формат: {"excerpt":{"text":"русский обычный текст до ${limit} символов или пустая строка"}}`,
        "Текст:",
        value,
      ].join("\n\n");
    },
    normalize(value) {
      const source = value && typeof value === "object" ? value : {};
      const excerpt = source.excerpt && typeof source.excerpt === "object" ? source.excerpt : {};
      return {
        excerpt: {
          text: llmPromptRules.excerpt.fit(excerpt.text || "", 420),
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
        ...(slug ? llmPromptRules.slug.lines() : ["Не предлагай вариант слага."]),
        ...(excerpt ? llmPromptRules.excerpt.lines(excerptLimit) : ["Поле excerpt верни пустым."]),
        "Верни только валидный JSON-объект без markdown.",
        "Формат:",
        `{"edits":[{"before":"точная подстрока из текста","after":"минимальная замена","reason":"кратко","confidence":0.95}],"slug":{"text":"готовый латинский slug до 34 символов или пустая строка"},"excerpt":{"text":"обычный текст оптимально около 400 и не больше ${excerptLimit} символов или пустая строка"}}`,
        "Правила:",
        "- before должен полностью совпадать с фрагментом исходного текста;",
        "- after должен содержать только замену для before;",
        "- confidence от 0 до 1;",
        "- если уверенность ниже 0.9 — не добавляй правку;",
        '- если ошибок нет, верни {"edits":[],"slug":{"text":""},"excerpt":{"text":""}} или заполни слаг и excerpt только при наличии уверенного хорошего варианта;',
        slug
          ? "- slug.text должен быть готовым латинским слагом в нижнем регистре, с дефисами и длиной не больше 34 символов; если уверенного варианта нет, верни пустую строку."
          : '- slug.text должен быть пустой строкой.',
        excerpt
          ? `- excerpt.text должен быть обычный текст, на русском, оптимально около 400 и не длиннее ${excerptLimit} символов; если уверенного варианта нет, верни пустую строку.`
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
          text: String(slug.text || slug.summary || ""),
        },
        excerpt: {
          text: llmPromptRules.excerpt.fit(excerpt.text || "", 420),
        },
      };
    },
    empty() {
      return {
        edits: [],
        slug: {
          text: "",
        },
        excerpt: {
          text: "",
        },
      };
    },
  },
};

export { llm, llmPrompt };
