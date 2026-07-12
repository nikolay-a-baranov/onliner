import { sanitizer } from "./sanitizer.js";

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
    normalize(value, route = madtest.route.get()) {
      const current = clone(value);
      if (!current || !madtest.model.valid(current, route)) return null;
      const text = (source) => sanitizer.field.normalize(source);
      const html = (source) => sanitizer.field.html(source, {
        trimEnd: true,
        uppercaseFirst: true,
        finalize: true,
      });
      const optional = (source, transform) =>
        typeof source === "string" ? transform(source) : source;
      if (current.preview) {
        current.preview.title = optional(current.preview.title, text);
        current.preview.subtitle = optional(current.preview.subtitle, html);
        current.preview.startButtonText = optional(current.preview.startButtonText, text);
      }
      current.questions?.forEach((question) => {
        question.text = optional(question.text, html);
        question.comment = optional(question.comment, html);
        if (question.annotation) {
          question.annotation.correctAnnotation = optional(
            question.annotation.correctAnnotation,
            html,
          );
          question.annotation.incorrectAnnotation = optional(
            question.annotation.incorrectAnnotation,
            html,
          );
          question.annotation.commonAnnotation = optional(
            question.annotation.commonAnnotation,
            html,
          );
        }
        question.answers?.forEach((answer) => {
          answer.answer = optional(answer.answer, html);
          answer.annotation = optional(answer.annotation, html);
        });
        if (question.otherAnswer) {
          question.otherAnswer.answer = optional(question.otherAnswer.answer, html);
          question.otherAnswer.annotation = optional(question.otherAnswer.annotation, html);
        }
      });
      current.results?.forEach((result) => {
        result.title = optional(result.title, text);
        result.titleShort = optional(result.titleShort, text);
        result.subtitle = optional(result.subtitle, html);
      });
      if (current.branding) {
        current.branding.text = optional(current.branding.text, html);
      }
      if (current.task) {
        current.task.title = optional(current.task.title, text);
        current.task.comment = optional(current.task.comment, html);
      }
      return current;
    },
    capture(value, route = madtest.route.get(), source = trusted.response) {
      const current = clone(value);
      if (!current || !madtest.model.valid(current, route)) return false;
      return madtest.model.write(current, route, source);
    },
  },
  field: {
    resolve(element = null) {
      if (!element?.closest) return element;
      return (
        element.closest("input[name],textarea[name],select[name],[contenteditable='true']") ||
        element
      );
    },
    active(element = null) {
      const current = madtest.field.resolve(element);
      if (!madtest.page.active()) return false;
      if (!current?.matches) return false;
      if (current.matches("[disabled],[readonly]")) return false;
      return Boolean(madtest.field.path(current));
    },
    textual(element = null) {
      const current = madtest.field.resolve(element);
      if (!madtest.page.active()) return false;
      if (!current?.matches) return false;
      if (current.matches("[disabled],[readonly]")) return false;
      return current.matches(
        "input:not([type]),input[type='text'],input[type='url'],textarea,[contenteditable='true']",
      );
    },
    tokens(value = "") {
      return String(value || "")
        .match(/([^[.\]]+)|\[(\d+)\]/g)
        ?.map((item) => item.replace(/^\[(\d+)\]$/, "$1"))
        .filter(Boolean) || [];
    },
    label(element = null) {
      const current = madtest.field.resolve(element);
      const block = current?.closest?.(
        "label,._formGroup_ctv2j_1,._contentBlock_vu34e_1,._spacer_margin_20_yzn1c_20",
      );
      return String(block?.innerText || "")
        .split("\n")
        .map((item) => item.trim())
        .find(Boolean) || "";
    },
    labelKey(value = "") {
      return madtest.field.normalizeText(value).toLocaleLowerCase("ru-RU");
    },
    normalizeText(value = "") {
      return String(value || "")
        .replace(/\u00a0/g, " ")
        .replace(/\s+/g, " ")
        .trim();
    },
    scope(element = null, route = madtest.route.get()) {
      if (!route?.page) return null;
      if (route.page === "main") {
        return {
          base: ["preview"],
          value: madtest.model.read(route)?.preview || null,
        };
      }
      if (!["questions", "results"].includes(route.page)) return null;
      const node = element?.closest?.(`[data-rbd-draggable-id^='${route.page}[']`);
      const id = String(node?.getAttribute?.("data-rbd-draggable-id") || "");
      const index = Number(id.match(/\[(\d+)\]/)?.[1]);
      if (!Number.isInteger(index) || index < 0) return null;
      const model = madtest.model.read(route);
      const value = model?.[route.page]?.[index];
      if (!value || typeof value !== "object") return null;
      return {
        base: [route.page, index],
        value,
      };
    },
    preferred(label = "", route = madtest.route.get()) {
      const map = {
        main: {
          "описание": ["description", "text", "comment"],
        },
        questions: {
          "заголовок вопроса": ["title", "question", "name"],
          "комментарий к вопросу": ["description", "comment", "text"],
          "комментарий к верному ответу": [
            "correctComment",
            "successComment",
            "rightComment",
            "positiveComment",
            "description",
            "comment",
            "text",
          ],
          "комментарий к неверному ответу": [
            "wrongComment",
            "incorrectComment",
            "failureComment",
            "negativeComment",
            "description",
            "comment",
            "text",
          ],
          "комментарий к не верному ответу": [
            "wrongComment",
            "incorrectComment",
            "failureComment",
            "negativeComment",
            "description",
            "comment",
            "text",
          ],
        },
        results: {
          "комментарий к результату": ["description", "comment", "text"],
        },
      };
      return map[route?.page]?.[madtest.field.labelKey(label)] || [];
    },
    strings(value, path = [], depth = 0) {
      if (depth > 4 || !value || typeof value !== "object") return [];
      return Object.entries(value).flatMap(([key, item]) => {
        const next = [...path, key];
        if (typeof item === "string") {
          return [{ path: next, value: item }];
        }
        if (Array.isArray(item) || typeof item === "object") {
          return madtest.field.strings(item, next, depth + 1);
        }
        return [];
      });
    },
    path(element = null, route = madtest.route.get()) {
      const current = madtest.field.resolve(element);
      if (!current?.matches) return [];
      if (current.matches("input[name],textarea[name],select[name]")) {
        return madtest.field.tokens(current.name);
      }
      if (!current.matches("[contenteditable='true']")) return [];
      const scope = madtest.field.scope(current, route);
      if (!scope?.value) return [];
      const value = madtest.field.normalizeText(madtest.field.value(current));
      const label = madtest.field.label(current);
      const preferred = madtest.field.preferred(label, route);
      const strings = madtest.field.strings(scope.value);
      const matched = strings.filter(
        (item) => madtest.field.normalizeText(item.value) === value,
      );
      const preferredMatched = matched.filter((item) =>
        preferred.includes(String(item.path[item.path.length - 1] || "")),
      );
      if (preferredMatched.length === 1) {
        return [...scope.base, ...preferredMatched[0].path];
      }
      if (matched.length === 1) {
        return [...scope.base, ...matched[0].path];
      }
      const preferredOnly = strings.filter((item) =>
        preferred.includes(String(item.path[item.path.length - 1] || "")),
      );
      if (preferredOnly.length === 1) {
        return [...scope.base, ...preferredOnly[0].path];
      }
      return [];
    },
    value(element = null) {
      const current = madtest.field.resolve(element);
      if (!current) return undefined;
      if (current.type === "checkbox") return Boolean(current.checked);
      if (current.type === "radio") return String(current.value || "");
      if (current.isContentEditable) return current.innerText;
      return current.value;
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
      const path = madtest.field.path(element);
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
    replace(input, init = {}, payload) {
      const body = JSON.stringify(payload);
      if (input instanceof Request && init.body === undefined) {
        return {
          input: new Request(input, { body }),
          init,
        };
      }
      return {
        input,
        init: {
          ...init,
          body,
        },
      };
    },
    async save(model) {
      const payload = madtest.model.normalize(model);
      if (!payload) return null;
      const response = await fetch(madtest.request.url(), {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
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
  defer: {
    state() {
      return (madtest.save.state().deferred ??= {});
    },
    active(route = madtest.route.get()) {
      if (!route?.testId) return false;
      return madtest.field.textual(document.activeElement);
    },
    enqueue(route, request, original) {
      const testId = route?.testId || "";
      if (!testId) return original(request.input, request.init);
      const state = madtest.defer.state();
      const item = (state[testId] ??= {
        request,
        original,
        waiters: [],
      });
      item.request = request;
      item.original = original;
      return new Promise((resolve, reject) => {
        item.waiters.push({ resolve, reject });
      });
    },
    async flush(route = madtest.route.get()) {
      const testId = route?.testId || "";
      if (!testId) return false;
      const state = madtest.defer.state();
      const item = state[testId];
      if (!item) return false;
      delete state[testId];
      try {
        const response = await item.original(item.request.input, item.request.init);
        const copies = item.waiters.map(() => response.clone());
        item.waiters.forEach((waiter, index) => waiter.resolve(copies[index]));
      } catch (error) {
        item.waiters.forEach((waiter) => waiter.reject(error));
      }
      return true;
    },
    bind() {
      const focusout = () => {
        const route = madtest.route.get();
        window.setTimeout(() => madtest.defer.flush(route), 0);
      };
      document.addEventListener("focusout", focusout, true);
      return () => document.removeEventListener("focusout", focusout, true);
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
        const route = madtest.route.get();
        const payload = await madtest.request.read(input, init);
        const normalized = payload ? madtest.model.normalize(payload, route) : null;
        if (normalized) madtest.model.capture(normalized, route, trusted.request);
        const request = normalized
          ? madtest.request.replace(input, init, normalized)
          : { input, init };
        const response =
          normalized && madtest.defer.active(route)
            ? await madtest.defer.enqueue(route, request, original)
            : await original(request.input, request.init);
        const url = input instanceof Request ? input.url : String(input || "");
        if (!madtest.request.match(url)) return response;
        try {
          const value = await response.clone().json();
          madtest.model.capture(value, madtest.route.get(), trusted.response);
        } catch {}
        return response;
      };
      madtest.defer.bind();
      window[key.bridge] = true;
      return true;
    },
  },
};

export { madtest };
