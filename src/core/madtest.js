const key = {
  bridge: "__madtestBridgeInstalled",
  fetch: "__madtestFetchOriginal",
  save: "__madtestSaveState",
  source: "madtest:model",
};
const trusted = {
  request: "request",
  response: "response",
};

const clone = (value) => {
  if (!value || typeof value !== "object") return null;
  if (typeof structuredClone === "function") {
    try {
      return structuredClone(value);
    } catch {}
  }
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return null;
  }
};

const madtest = {
  route: {
    get(value = location.href) {
      const url = value instanceof URL ? value : new URL(value, location.origin);
      const match = url.pathname.match(/^\/app\/tests\/(\d+)\/([^/]+)/i);
      if (!match) return null;
      return {
        testId: match[1],
        page: String(match[2] || "").toLowerCase(),
      };
    },
    edit(value = location.href) {
      const route = madtest.route.get(value);
      if (!route) return null;
      if (!["main", "questions", "results"].includes(route.page)) return null;
      return route;
    },
  },
  page: {
    active(value = location.href) {
      return Boolean(madtest.route.edit(value));
    },
  },
  model: {
    valid(value, route = madtest.route.get()) {
      if (!value || typeof value !== "object") return false;
      if (!route?.testId) return false;
      if (String(value.id || "") !== String(route.testId)) return false;
      if (typeof value.externalId !== "string") return false;
      return (
        Array.isArray(value.questions) ||
        Array.isArray(value.results) ||
        typeof value.preview === "object"
      );
    },
    key(route = madtest.route.get()) {
      if (!route?.testId) return "";
      return `${key.source}:${route.testId}`;
    },
    read(route = madtest.route.get()) {
      const storageKey = madtest.model.key(route);
      if (!storageKey) return null;
      try {
        const value = sessionStorage.getItem(storageKey);
        if (!value) return null;
        const parsed = JSON.parse(value);
        const payload = parsed?.payload;
        const source = String(parsed?.source || "");
        if (!Object.values(trusted).includes(source)) return null;
        return madtest.model.valid(payload, route) ? payload : null;
      } catch {
        return null;
      }
    },
    write(value, route = madtest.route.get(), source = trusted.response) {
      if (!madtest.model.valid(value, route)) return false;
      if (!Object.values(trusted).includes(source)) return false;
      const storageKey = madtest.model.key(route);
      if (!storageKey) return false;
      try {
        sessionStorage.setItem(
          storageKey,
          JSON.stringify({
            source,
            payload: value,
          }),
        );
        return true;
      } catch {
        return false;
      }
    },
    runtime: {
      branch(value, seen, depth = 0) {
        if (!value || typeof value !== "object") return [];
        if (seen.has(value)) return [];
        seen.add(value);
        if (depth > 2) return [];
        const direct = Array.isArray(value)
          ? value
          : Object.values(value).filter((item) => item && typeof item === "object");
        return direct.flatMap((item) => [item, ...madtest.model.runtime.branch(item, seen, depth + 1)]);
      },
      read(route = madtest.route.get()) {
        if (!route?.testId) return null;
        const roots = Object.getOwnPropertyNames(window)
          .map((name) => {
            try {
              return window[name];
            } catch {
              return null;
            }
          })
          .filter((value) => value && typeof value === "object");
        const values = roots.flatMap((value) =>
          [value, ...madtest.model.runtime.branch(value, new WeakSet(), 0)],
        );
        const found = values.find((value) => madtest.model.valid(value, route));
        return clone(found);
      },
    },
    resolve(route = madtest.route.get()) {
      return madtest.model.read(route);
    },
    capture(value, route = madtest.route.get(), source = trusted.response) {
      const current = clone(value);
      if (!current || !madtest.model.valid(current, route)) return false;
      return madtest.model.write(current, route, source);
    },
  },
  field: {
    active(element = null) {
      if (!madtest.page.active()) return false;
      if (!element?.matches) return false;
      if (element.matches("[disabled],[readonly]")) return false;
      if (!element.matches("input[name],textarea[name],select[name]")) return false;
      return typeof element.name === "string" && Boolean(element.name.trim());
    },
    tokens(value = "") {
      return String(value || "")
        .match(/([^[.\]]+)|\[(\d+)\]/g)
        ?.map((item) => item.replace(/^\[(\d+)\]$/, "$1"))
        .filter(Boolean) || [];
    },
    value(element = null) {
      if (!element) return undefined;
      if (element.type === "checkbox") return Boolean(element.checked);
      if (element.type === "radio") return String(element.value || "");
      if (element.isContentEditable) return element.innerText;
      return element.value;
    },
    assign(target, path = [], value) {
      if (!target || typeof target !== "object" || !path.length) return false;
      const steps = path.map((item) => (/^\d+$/.test(item) ? Number(item) : item));
      let current = target;
      for (let index = 0; index < steps.length - 1; index += 1) {
        const step = steps[index];
        const next = steps[index + 1];
        if (current[step] === undefined || current[step] === null) {
          current[step] = typeof next === "number" ? [] : {};
        }
        current = current[step];
        if (!current || typeof current !== "object") return false;
      }
      const last = steps[steps.length - 1];
      current[last] = value;
      return true;
    },
    patch(model, element = null) {
      if (!madtest.field.active(element)) return null;
      const path = madtest.field.tokens(element.name);
      if (!path.length) return null;
      const next = clone(model);
      if (!next) return null;
      const changed = madtest.field.assign(next, path, madtest.field.value(element));
      return changed ? next : null;
    },
  },
  request: {
    url() {
      return `${location.origin}/api/admin/tests`;
    },
    match(value = "") {
      try {
        const url = new URL(String(value || ""), location.origin);
        return url.origin === location.origin && url.pathname === "/api/admin/tests";
      } catch {
        return false;
      }
    },
    parse(value) {
      if (!value) return null;
      if (typeof value === "string") {
        try {
          return JSON.parse(value);
        } catch {
          return null;
        }
      }
      if (value instanceof URLSearchParams) return null;
      if (value instanceof FormData) return null;
      if (typeof value === "object") return value;
      return null;
    },
    async read(input, init = {}) {
      const request = input instanceof Request ? input : null;
      const url = request?.url || String(input || "");
      if (!madtest.request.match(url)) return null;
      if (init.body !== undefined) return madtest.request.parse(init.body);
      if (!request?.clone) return null;
      try {
        return madtest.request.parse(await request.clone().text());
      } catch {
        return null;
      }
    },
    async save(model) {
      const response = await fetch(madtest.request.url(), {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(model),
      });
      if (!response.ok) return null;
      try {
        return await response.json();
      } catch {
        return null;
      }
    },
  },
  save: {
    state() {
      return (window[key.save] ??= {
        timers: {},
        pending: {},
      });
    },
    clear(route = madtest.route.get()) {
      const testId = route?.testId || "";
      if (!testId) return false;
      const state = madtest.save.state();
      if (state.timers[testId]) {
        window.clearTimeout(state.timers[testId]);
        delete state.timers[testId];
      }
      return true;
    },
    async run(element = null, route = madtest.route.get()) {
      if (!madtest.field.active(element)) return false;
      const model = madtest.model.read(route);
      if (!model) return false;
      const next = madtest.field.patch(model, element);
      if (!next) return false;
      const state = madtest.save.state();
      const testId = route?.testId || "";
      if (!testId) return false;
      const pending = state.pending[testId] || Promise.resolve();
      state.pending[testId] = pending
        .catch(() => null)
        .then(async () => {
          const response = await madtest.request.save(next);
          if (!response) return false;
          madtest.model.capture(response, route, trusted.response);
          return true;
        });
      return state.pending[testId];
    },
    schedule(element = null, { delay = 700 } = {}) {
      if (!madtest.field.active(element)) return false;
      const route = madtest.route.get();
      const testId = route?.testId || "";
      if (!testId) return false;
      const state = madtest.save.state();
      madtest.save.clear(route);
      state.timers[testId] = window.setTimeout(() => {
        delete state.timers[testId];
        madtest.save.run(element, route);
      }, delay);
      return true;
    },
  },
  bridge: {
    install() {
      if (!madtest.page.active()) return false;
      if (window[key.bridge]) return true;
      const original = window.fetch;
      if (typeof original !== "function") return false;
      window[key.fetch] = original;
      window.fetch = async (input, init = {}) => {
        const payload = await madtest.request.read(input, init);
        if (payload) madtest.model.capture(payload, madtest.route.get(), trusted.request);
        const response = await original(input, init);
        const url = input instanceof Request ? input.url : String(input || "");
        if (!madtest.request.match(url)) return response;
        try {
          const value = await response.clone().json();
          madtest.model.capture(value, madtest.route.get(), trusted.response);
        } catch {}
        return response;
      };
      window[key.bridge] = true;
      return true;
    },
  },
};

export { madtest };
