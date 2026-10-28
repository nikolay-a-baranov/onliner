import { cms } from "../core/cms.js";
import { field } from "../core/dom.js";
import { llm } from "../core/llm.js";
import { host } from "../core/surface/host.js";
import { icon } from "../core/surface/icon.js";
import { styles as css } from "../core/surface/styles.js";
import { toolbar } from "../core/surface/toolbar.js";
import { ui } from "../core/surface/ui.js";
import { markup as contentMarkup } from "../pipe/markup.js";
import { editsPrompt } from "../prompts/edits.js";
import { auditTarget } from "./audit-target.js";
import { createAudit } from "./audit.js";

export const createEdits = (api = {}, adapters = {}) => {
  const surface = adapters.review || createAudit(api, {
    agentScope: "audit",
    languagetool: false,
    qwen: true,
    reviewOnly: true,
    reviewTitle: "Правки",
  }).audit.text.review;
  const state = {
    session: 0,
    running: false,
    model: "",
  };
  const agent = {
    config: { gemini: true, qwen: true },
    get() {
      if (typeof adapters.provider === "function") return adapters.provider();
      return llm.agent.provider("audit", agent.config, "audit-provider") || "gemini";
    },
  };
  const key = {
    ensure(provider) {
      if (typeof adapters.resolveKey === "function") return adapters.resolveKey(provider);
      const current = llm.key.read(provider);
      if (current) return current;
      const label = llm.key.label(provider);
      const value = prompt(`Вставь API-ключ для ${label}`, "");
      if (value == null || !String(value).trim()) throw new Error(`Нет API-ключа для ${label}`);
      llm.key.write(provider, value);
      return String(value).trim();
    },
  };
  const input = {
    id: "edits-prompt",
    styleId: "edits-prompt-style",
    options: {
      title: "Правки",
      kind: "edits",
      placeholder: "Что изменить в тексте?",
      saveTitle: "Отправить",
    },
    theme() {
      return (
        document.querySelector('.panel[data-ui-surface="toolbar"]')?.dataset
          ?.theme || "dark"
      );
    },
    html(theme, options) {
      const submit = ui.controls.cluster({
        role: "action",
        content: ui.controls.button({
          action: "edits-prompt.submit",
          fluent: "Agents",
          fallback: "People",
          title: options.saveTitle,
          classes: "edits-prompt-submit",
          attrs: ' type="button"',
        }),
        group: {
          classes: "edits-prompt-submit-group",
        },
      });
      const head = ui.shell.frame({
        classes: "edits-prompt-head",
        attrs: ' data-panel-drag-handle="true"',
        pack: "spread",
        left: ui.controls.marker({
          content: ui.controls.icon(icon.emoji("diving-mask", "🤿")),
          button: {
            title: options.title,
            attrs: ` type="button" tabindex="-1" aria-label="${ui.controls.escape(options.title)}"`,
          },
        }),
        main: ui.shell.strip(submit, { classes: "edits-prompt-main" }),
        right: ui.controls.chrome({
          theme,
          themeAction: "edits-prompt.theme",
          closeAction: "edits-prompt.close",
        }),
      });
      const body = `<div class="edits-prompt-field-wrap">${ui.controls.textarea({
        placeholder: options.placeholder,
        classes: "edits-prompt-field",
      })}</div>`;
      return ui.shell.stack(`${head}${body}`);
    },
    sync(root, textarea) {
      const submit = root.querySelector('[data-action="edits-prompt.submit"]');
      if (submit) submit.disabled = !String(textarea.value || "").trim();
    },
    open() {
      if (typeof adapters.prompt === "function") {
        return adapters.prompt(input.options);
      }
      ui.overlay.close(input.id);
      document.getElementById(input.id)?.remove();
      host.mount(input.styleId, css.editsPrompt.panel());
      const theme = input.theme();
      const root = host.create({
        id: input.id,
        html: input.html(theme, input.options),
        draggable: true,
      });
      root.dataset.uiFrame = "capsule";
      root.dataset.toolbarFlow = "stack";
      root.dataset.dock = "floating";
      root.dataset.dockTarget = "floating";
      root.dataset.editsPrompt = "true";
      ui.surface.sync(root, {
        layout: "fullscreen",
        theme,
        surface: "toolbar",
      });
      toolbar.center(root, 16);
      const textarea = root.querySelector(".edits-prompt-field");
      input.sync(root, textarea);
      return new Promise((resolve) => {
        let closed = false;
        const close = (result = null) => {
          if (closed) return;
          closed = true;
          ui.overlay.unregister(input.id);
          root.remove();
          resolve(result);
        };
        const save = () => {
          const value = String(textarea.value || "");
          if (!value.trim()) {
            textarea.focus();
            return false;
          }
          close({ value });
          return true;
        };
        root.addEventListener("click", (event) => {
          const action = event.target.closest("[data-action]")?.dataset?.action;
          if (action === "edits-prompt.close") return close();
          if (action === "edits-prompt.submit") return save();
          if (action !== "edits-prompt.theme") return false;
          const next = root.dataset.theme === "dark" ? "light" : "dark";
          ui.surface.sync(root, {
            layout: "fullscreen",
            theme: next,
            surface: "toolbar",
          });
          ui.controls.chrome.theme(root, {
            theme: next,
            action: "edits-prompt.theme",
          });
          return true;
        });
        root.addEventListener("keydown", (event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            close();
            return;
          }
          if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
            event.preventDefault();
            save();
          }
        });
        textarea.addEventListener("input", () => input.sync(root, textarea));
        ui.overlay.register({
          id: input.id,
          kind: "edits",
          close: () => close(),
          editable: () => textarea,
          sync: () => input.sync(root, textarea),
        });
        textarea.focus();
      });
    },
  };
  const capture = {
    get() {
      if (typeof adapters.capture === "function") return adapters.capture();
      let html = "";
      cms.editor.runContent((current) => {
        html = current;
        return current;
      });
      return {
        html,
        plain: contentMarkup.strip(html),
        snapshot: auditTarget.snapshot(html),
      };
    },
  };
  const proposal = {
    context(value, position, item) {
      const left = item.contextBefore;
      const right = item.contextAfter;
      if (!left && !right) return false;
      if (left && value.slice(Math.max(0, position - left.length), position) !== left) return false;
      const end = position + item.before.length;
      if (right && value.slice(end, end + right.length) !== right) return false;
      return true;
    },
    locate(snapshot, plain, item) {
      const resolved = auditTarget.locate(snapshot, {
        before: item.before,
        after: item.after,
      });
      if (["invalid", "overlarge"].includes(resolved.status)) return resolved;
      const positions = auditTarget.occurrences(plain, item.before);
      if (!positions.length) return { status: "not-found" };
      if (positions.length === 1) {
        if (resolved.status === "ready") return resolved;
        return auditTarget.align(snapshot, plain, {
          before: item.before,
          after: item.after,
          start: positions[0],
        });
      }
      const contextual = positions.filter((position) =>
        proposal.context(plain, position, item),
      );
      if (contextual.length !== 1) return { status: "ambiguous" };
      return auditTarget.align(snapshot, plain, {
        before: item.before,
        after: item.after,
        start: contextual[0],
      });
    },
    map(value, source) {
      const normalized = editsPrompt.normalize(value);
      return normalized.edits.map((item, index) => {
        const located = proposal.locate(source.snapshot, source.plain, item);
        const repeated = auditTarget.occurrences(source.plain, item.before).length > 1;
        const context = `${item.contextBefore}[${item.before}]${item.contextAfter}`;
        const contextNote = repeated && located.status === "ready"
          ? `Контекст: ${context}`
          : "";
        return {
          source: source.provider,
          word: item.before,
          fix: item.after,
          variants: [item.after],
          message: [item.reason, contextNote].filter(Boolean).join(" · "),
          confidence: 1,
          replaceAll: false,
          target: located.target || null,
          targetStatus: located.status,
          proposalId: `edits:${source.session}:${index}`,
          contextBefore: item.contextBefore,
          contextAfter: item.contextAfter,
        };
      });
    },
  };
  const request = {
    run(provider, instruction, source) {
      const run = adapters.runLlm || llm.run;
      return run({
        provider,
        input: source.plain,
        prompt: editsPrompt.build({ instruction, text: source.plain }),
        fallback: JSON.stringify(editsPrompt.empty()),
        resolveKey: key.ensure,
        onDebug() {},
        onModel(model) {
          state.model = model;
        },
      });
    },
  };
  const edits = {
    state,
    input,
    capture,
    proposal,
    request,
    async run() {
      if (state.running) return false;
      const session = ++state.session;
      const result = await input.open();
      const instruction = String(result?.value || "").trim();
      if (!instruction || session !== state.session) return false;
      const captured = capture.get();
      if (!captured?.snapshot?.html || !String(captured.plain || "").trim()) {
        (adapters.alert || field.alert)("В статье нет текста для правок");
        return false;
      }
      const provider = agent.get();
      const source = { ...captured, provider, session };
      state.running = true;
      state.model = "";
      if (!surface.open({
        snapshot: source.snapshot,
        plain: source.plain,
        provider,
        loading: true,
      })) {
        state.running = false;
        return false;
      }
      try {
        const response = await request.run(provider, instruction, source);
        if (session !== state.session) return false;
        const items = proposal.map(response, source);
        return surface.present(items, { model: response?.model || state.model }) !== false;
      } catch (error) {
        if (session === state.session) surface.error(error);
        return false;
      } finally {
        if (session === state.session) state.running = false;
      }
    },
  };
  return { edits };
};
