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
  choice: {
    items(values = [], config = {}) {
      return values.filter((item) => !item.provider || config[item.provider] !== false);
    },
    get(value = "", values = [], config = {}) {
      const current = String(value || "");
      const items = llm.choice.items(values, config);
      return (
        items.find((item) => item.id === current || item.provider === current) ||
        items[0] ||
        null
      );
    },
    read(key = "") {
      if (!key) return "";
      try {
        return String(localStorage.getItem(key) || "");
      } catch {
        return "";
      }
    },
    write(key = "", value = "") {
      if (!key) return false;
      try {
        localStorage.setItem(key, String(value || ""));
        return true;
      } catch {
        return false;
      }
    },
    current({
      key = "",
      values = [],
      config = {},
      legacy = "",
      current = "",
    } = {}) {
      const active = llm.choice.get(current, values, config);
      if (active && current) return active;
      const stored = llm.choice.read(key);
      const selected = llm.choice.get(stored, values, config);
      if (selected && stored) return selected;
      const previous = llm.choice.get(llm.choice.read(legacy), values, config);
      if (previous && legacy) return previous;
      return llm.choice.get("", values, config);
    },
    set({
      key = "",
      value = "",
      values = [],
      config = {},
    } = {}) {
      const selected = llm.choice.get(value, values, config);
      if (!selected) return null;
      llm.choice.write(key, selected.id);
      return selected;
    },
    cycle({
      key = "",
      value = "",
      values = [],
      config = {},
    } = {}) {
      const items = llm.choice.items(values, config);
      if (!items.length) return null;
      const current = llm.choice.current({ key, values, config, current: value });
      const index = Math.max(0, items.findIndex((item) => item.id === current?.id));
      return llm.choice.set({
        key,
        value: items[(index + 1) % items.length]?.id,
        values,
        config,
      });
    },
  },
  agent: {
    values: [
      { id: "gemini", provider: "gemini", label: "Gemini", logo: "gemini" },
      { id: "qwen", provider: "qwen", label: "Qwen", logo: "qwen" },
    ],
    storageKey(scope = "default") {
      return `llm-agent-${scope}`;
    },
    items(config = {}) {
      return llm.choice.items(llm.agent.values, config);
    },
    get(value = "", config = {}) {
      return llm.choice.get(value, llm.agent.values, config);
    },
    saved(scope = "default", config = {}, legacy = "") {
      return llm.choice.current({
        key: llm.agent.storageKey(scope),
        values: llm.agent.values,
        config,
        legacy,
      });
    },
    current(scope = "default", config = {}, legacy = "") {
      return llm.agent.saved(scope, config, legacy) || llm.agent.get("", config);
    },
    provider(scope = "default", config = {}, legacy = "") {
      return llm.agent.current(scope, config, legacy)?.provider || "";
    },
    set(scope = "default", value = "", config = {}) {
      return llm.choice.set({
        key: llm.agent.storageKey(scope),
        value,
        values: llm.agent.values,
        config,
      });
    },
    cycle(scope = "default", config = {}) {
      return llm.choice.cycle({
        key: llm.agent.storageKey(scope),
        values: llm.agent.values,
        config,
      });
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

export { llm };
