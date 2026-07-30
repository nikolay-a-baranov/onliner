const llmBusy = {
  count: 0,
  step: 0,
  timer: null,
  listeners: new Set(),
  snapshot() {
    return {
      active: llmBusy.count > 0,
      step: llmBusy.step,
    };
  },
  emit() {
    const value = llmBusy.snapshot();
    llmBusy.listeners.forEach((listener) => {
      try {
        listener(value);
      } catch {}
    });
  },
  start() {
    llmBusy.count += 1;
    if (llmBusy.count > 1) {
      llmBusy.emit();
      return;
    }
    llmBusy.step = 1;
    llmBusy.emit();
    llmBusy.timer = setInterval(() => {
      llmBusy.step = (llmBusy.step % 3) + 1;
      llmBusy.emit();
    }, 420);
  },
  stop() {
    llmBusy.count = Math.max(0, llmBusy.count - 1);
    if (llmBusy.count) {
      llmBusy.emit();
      return;
    }
    if (llmBusy.timer) clearInterval(llmBusy.timer);
    llmBusy.timer = null;
    llmBusy.step = 0;
    llmBusy.emit();
  },
  active() {
    return llmBusy.count > 0;
  },
  subscribe(listener) {
    if (typeof listener !== "function") return () => {};
    llmBusy.listeners.add(listener);
    listener(llmBusy.snapshot());
    return () => llmBusy.listeners.delete(listener);
  },
};

const llm = {
  busy: llmBusy,
  agent: {
    values: [
      { id: "gemini", provider: "gemini", label: "Gemini", logo: "gemini" },
      { id: "qwen", provider: "qwen", label: "Qwen", logo: "qwen" },
    ],
    storageKey(scope = "default") {
      return `llm-agent-${scope}`;
    },
    items(config = {}) {
      return llm.agent.values.filter((item) => config[item.provider] !== false);
    },
    get(value = "", config = {}) {
      const items = llm.agent.items(config);
      return (
        items.find((item) => item.id === value || item.provider === value) ||
        items[0] ||
        null
      );
    },
    saved(scope = "default", config = {}, legacy = "") {
      try {
        const value = localStorage.getItem(llm.agent.storageKey(scope));
        const agent = llm.agent.get(value, config);
        if (agent && value) return agent;
        const previous = legacy ? localStorage.getItem(legacy) : "";
        return llm.agent.get(previous, config);
      } catch {
        return llm.agent.get("", config);
      }
    },
    current(scope = "default", config = {}, legacy = "") {
      return llm.agent.saved(scope, config, legacy) || llm.agent.get("", config);
    },
    provider(scope = "default", config = {}, legacy = "") {
      return llm.agent.current(scope, config, legacy)?.provider || "";
    },
    set(scope = "default", value = "", config = {}) {
      const agent = llm.agent.get(value, config);
      if (!agent) return null;
      try {
        localStorage.setItem(llm.agent.storageKey(scope), agent.id);
      } catch {
        void 0;
      }
      return agent;
    },
    cycle(scope = "default", config = {}) {
      const items = llm.agent.items(config);
      if (!items.length) return null;
      const current = llm.agent.current(scope, config);
      const index = Math.max(0, items.findIndex((item) => item.id === current?.id));
      return llm.agent.set(scope, items[(index + 1) % items.length]?.id, config);
    },
  },
  key: {
    prefix: "llm-key-",
    legacyPrefix: "audit-key-",
    legacyProofreadPrefix: "proofread-key-",
    legacyQwen: "proofread-qwen-key",
    build(provider = "") {
      return `${llm.key.prefix}${provider}`;
    },
    legacy(provider = "") {
      return [
        `${llm.key.legacyPrefix}${provider}`,
        `${llm.key.legacyProofreadPrefix}${provider}`,
        provider === "qwen" ? llm.key.legacyQwen : "",
      ].filter(Boolean);
    },
    read(provider = "") {
      try {
        const value = localStorage.getItem(llm.key.build(provider));
        if (value) return value;
        return llm.key.legacy(provider)
          .map((key) => localStorage.getItem(key))
          .find(Boolean) || "";
      } catch {
        return "";
      }
    },
    write(provider = "", value = "") {
      try {
        localStorage.setItem(llm.key.build(provider), String(value || "").trim());
      } catch {
        void 0;
      }
    },
    page(provider = "") {
      return {
        gemini: "https://aistudio.google.com/u/2/api-keys",
        qwen: "https://dashscope.console.aliyun.com/apiKey",
      }[provider] || "";
    },
    label(provider = "") {
      return (
        llm.agent.values.find((item) => item.provider === provider || item.id === provider)?.label ||
        provider
      );
    },
  },
  model: {
    defaults: {
      qwen: ["qwen3.5-flash"],
    },
    cache: {
      key: "",
      expires: 0,
      models: [],
      pending: null,
    },
    normalize(value) {
      return String(value || "").replace(/^models\//, "");
    },
    configured(value) {
      return Array.from(
        new Set(
          (Array.isArray(value) ? value : [])
            .map(llm.model.normalize)
            .filter(Boolean),
        ),
      );
    },
    supports(value) {
      return Array.isArray(value?.supportedGenerationMethods)
        && value.supportedGenerationMethods.includes("generateContent");
    },
    generic(value) {
      return /^gemini-\d+(?:\.\d+)*-flash(?:-lite)?$/i.test(value || "");
    },
    version(value) {
      return (String(value || "").match(/^gemini-(\d+(?:\.\d+)*)-/i)?.[1] || "0")
        .split(".")
        .map((number) => Number(number) || 0);
    },
    compare(left, right) {
      const leftVersion = llm.model.version(left);
      const rightVersion = llm.model.version(right);
      const length = Math.max(leftVersion.length, rightVersion.length);
      for (let index = 0; index < length; index += 1) {
        const difference = (rightVersion[index] || 0) - (leftVersion[index] || 0);
        if (difference) return difference;
      }
      return Number(/-lite$/i.test(left)) - Number(/-lite$/i.test(right));
    },
    select(value) {
      const available = Array.from(
        new Set(
          (Array.isArray(value) ? value : [])
            .filter(llm.model.supports)
            .map((item) => llm.model.normalize(item.name))
            .filter(Boolean),
        ),
      );
      return available.filter(llm.model.generic).sort(llm.model.compare);
    },
    list(resolveKey) {
      const key = resolveKey("gemini");
      const cache = llm.model.cache;
      const current = Date.now();
      if (cache.key === key && cache.expires > current && cache.models.length) {
        return Promise.resolve(cache.models);
      }
      if (cache.key === key && cache.pending) return cache.pending;
      const url = "https://generativelanguage.googleapis.com/v1beta/models?pageSize=1000";
      const pending = fetch(url, {
        headers: {
          "x-goog-api-key": key,
        },
      })
        .then((response) => response.text())
        .then((raw) => {
          const value = llm.parse(raw);
          if (value.error) {
            throw new Error(value.error.message || "Не удалось получить модели Gemini");
          }
          return Array.isArray(value.models) ? value.models : [];
        })
        .then((models) => {
          cache.key = key;
          cache.expires = Date.now() + 60 * 60 * 1000;
          cache.models = models;
          cache.pending = null;
          return models;
        })
        .catch((error) => {
          cache.pending = null;
          throw error;
        });
      cache.key = key;
      cache.pending = pending;
      return pending;
    },
    resolve(provider, configured, resolveKey) {
      const models = llm.model.configured(configured);
      if (provider !== "gemini") {
        return Promise.resolve(models.length ? models : llm.model.defaults[provider] || []);
      }
      return llm.model.list(resolveKey).then((available) => {
        const selected = llm.model.select(available);
        if (selected.length) return selected;
        throw new Error("Для этого API-ключа нет подходящей Gemini Flash модели.");
      });
    },
  },
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
    const attempt = (list, errors = []) => {
      const [model, ...rest] = list;
      if (!adapter) throw new Error(`Провайдер недоступен: ${config.provider}`);
      if (!model) {
        const message = errors.length
          ? errors.join("\n")
          : `${adapter.label} недоступен. Попробуй позже.`;
        throw new Error(message);
      }
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
          const error = adapter.describe(value, model);
          const nextErrors = [...errors, error];
          if ((value.error?.retry || adapter.retry(value)) && rest.length) {
            return attempt(rest, nextErrors);
          }
          throw new Error(nextErrors.join("\n"));
        });
    };
    llm.busy.start();
    return Promise.resolve()
      .then(() => llm.model.resolve(
        config.provider,
        config.models,
        config.resolveKey,
      ))
      .then((models) => attempt(models))
      .finally(() => llm.busy.stop());
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
        `Сформируй excerpt для WordPress на русском языке. Абсолютный максимум — ${limit} символов с пробелами.`,
        "Excerpt должен выглядеть как текст, подготовленный редактором на основе исходного материала, а не как отдельный пересказ, аннотация или ответ языковой модели.",
        "Под первым смысловым абзацем понимай первый полноценный абзац основного текста, который сообщает содержание материала. Не считай им заголовок, подпись, рубрику, короткую служебную строку или отдельную вводную фразу.",
        "Сначала оцени первый смысловой абзац.",
        "Если он сам по себе достаточно раскрывает тему материала, сформируй excerpt преимущественно из него, максимально сохраняя его формулировки, лексику, порядок мысли, синтаксис и нейтральный тон.",
        "Если первый смысловой абзац слишком короткий, формальный или не передает основные моменты материала, используй его как основу и редакторски дополни главными сведениями из остального текста.",
        "При дополнении не пересказывай материал последовательно и не собирай перечень фактов. Выбери только основные моменты, необходимые для целостного понимания темы.",
        `Предпочтительный объем — примерно 80–100% от лимита ${limit} символов, но не расширяй полностью переданную мысль ради заполнения длины.`,
        "Передай общую идею и основные моменты материала без лишних подробностей.",
        "Если исходный фрагмент слишком длинный, сокращай его смысловым редактированием, а не механическим обрезанием.",
        "В первую очередь удаляй даты, точное время, числа, адреса, должности, второстепенные имена, географические уточнения, примеры, перечисления и технические подробности.",
        "Удаляй несущественные определения, повторы, вводные конструкции, пояснения в скобках и уточняющие придаточные предложения, если без них основной смысл сохраняется.",
        "Сохраняй конкретную деталь только тогда, когда без нее меняется основная тема, субъект или смысл сообщения.",
        "Не заменяй содержательное сокращение общими словами и не делай текст более абстрактным, чем исходный материал.",
        "Не добавляй выводы, оценки, причины, последствия, связки и факты, которых нет в исходном тексте.",
        "Не используй служебные конструкции вроде «в материале рассказывается», «стало известно», «речь идет о».",
        "Используй одно или два завершенных предложения.",
        `Перед ответом проверь длину. Если текст превышает ${limit} символов, убери наименее важные уточнения, сохранив естественную грамматику и редакторскую цельность.`,
        "Верни обычный текст без HTML, markdown, ссылок, подписей и кавычек-оберток.",
        "Если основную тему материала нельзя определить достоверно, верни пустую строку.",
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
        `{"edits":[{"before":"точная подстрока из текста","after":"минимальная замена","reason":"кратко","confidence":0.95}],"slug":{"text":"готовый латинский slug до 34 символов или пустая строка"},"excerpt":{"text":"обычный русский текст не больше ${excerptLimit} символов или пустая строка"}}`,
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
          ? `- excerpt.text должен быть обычным русским текстом не длиннее ${excerptLimit} символов; если уверенного варианта нет, верни пустую строку.`
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
