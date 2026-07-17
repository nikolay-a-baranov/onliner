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
        return code === 503 || code === 429;
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

export { llm };
