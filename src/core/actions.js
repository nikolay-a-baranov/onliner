import { transform } from "./transform.js";
import { createShared } from "./actions/shared.js";
import { createChars } from "./actions/chars.js";
import { createMoves } from "./actions/moves.js";
import { createTokens } from "./actions/tokens.js";
import { createMarkup } from "./actions/markup.js";
import { createContent } from "./actions/content.js";
import { createSearch } from "./actions/search.js";
import { createAdmin } from "./actions/admin.js";
import { createAudit } from "./actions/audit.js";
import { createOnliner } from "./actions/onliner.js";
import { createSession } from "./actions/session.js";
import { createFeedback } from "./actions/feedback.js";

const api = {};
const shared = createShared(api);
const chars = createChars(api);
const moves = createMoves(api);
const tokens = createTokens(api);
const markup = createMarkup(api);
const content = createContent(api);
const search = createSearch(api);
const admin = createAdmin(api);
const audit = createAudit(api);
const onliner = createOnliner(api);
const session = createSession(api);
const feedback = createFeedback(api);
Object.assign(
  api,
  shared,
  chars,
  moves,
  tokens,
  markup,
  content,
  search,
  admin,
  audit,
  onliner,
  session,
  feedback,
);

const symbolList = ["°", "′", "″", "$", "€", "Ў", "ў", "І", "і", "í", "…"];
const mathList = ["−", "×", "·", "÷", "≈", "≠", "±", "≤", "≥", "²", "³"];
const editorActions = {
  "nbsp": (element) => api.nbsp(element),
  "comma": (element) => api.punctMark(element, ","),
  "colon": (element) => api.punctMark(element, ":"),
  "dash": (element) => api.punctMark(element, "—"),
  "punct": (element) => api.punct(element),
  "quote": (element) => api.quote(element),
  "qswap": (element) => api.qswap(element),
  "accent": (element) => api.accent(element),
  "symbol": (element) => api.cycle(element, symbolList),
  "math": (element) => api.cycle(element, mathList),
  "home": (element) => api.home(element),
  "left": (element) => api.move(element, -1),
  "right": (element) => api.move(element, 1),
  "capital": (element) => api.capital(element),
  "token": (element) => api.token(element),
  "number": (element) => api.number(element),
  "abbr": (element) => api.abbr(element),
  "year": (element) => api.year(element),
  "branch": (element) => api.branch(element),
  "inflect": (element) => api.inflect(element),
  "separator": (element) => api.markup.separator(element),
  "italic": (element) =>
    api.markup.inline(element, { mode: "italic" }),
  "bold": (element) => api.markup.inline(element, { mode: "bold" }),
  "clear": (element) => api.markup.clear.run(element),
  "note": (element) => api.note(element),
  "list": (element) => api.list(element),
};
const textActions = {
  blockquote: () =>
    api.apply((value) =>
      transform.quote(value.value, {
        start: value.start,
        end: value.end,
      }),
    ),
  cleanup: () => api.markup.cleanup.run(transform.cleanup),
};
const contentActions = {
  more: () => api.content.more.run(),
  toc: () => api.content.toc.run(),
  embed: () => api.content.embed.run(),
  photo: () => api.content.photo.run(),
  video: () => api.content.video.run(),
  widgets: () => api.content.widgets.run(),
};
const searchActions = {
  "google": () => api.search.google.run(),
  "gramota": () => api.search.gramota.run(),
  "kinopoisk": () => api.search.kinopoisk.run(),
};
const fieldActions = {
  excerpt: () => api.admin.excerpt.run(),
};
const markupActions = {
  inline: (options = {}) =>
    api.markup.inline(api.element(), {
      mode: "cycle",
      reverse: Boolean(options.reverse),
    }),
  block: (options = {}) =>
    api.markup.block(api.element(), {
      mode: "cycle",
      reverse: Boolean(options.reverse),
    }),
  resize: () => {
    const element = api.element();
    return element ? api.markup.resize(element) : false;
  },
  interview: () => api.markup.interview.run(),
  "image.caption": () => api.markup.caption.run(),
  "clipboard.link": () => api.markup.link.run(),
};
const auditActions = {
  audit: () => api.audit.text.run(),
};
const adminActions = {
  diff: () => api.admin.diff.run(),
  dump: () => api.admin.dump.run(),
  tags: () => api.admin.tags.run(),
  "tags.suggest": () => api.admin.tags.suggest.run(),
  titles: () => api.admin.titles.run(),
  slug: () => api.admin.slug.run(),
  sanitize: () => api.admin.sanitize.run(),
  prepare: () => api.admin.prepare.run(),
  refresh: () => api.admin.refresh.run(),
  whoami: (options = {}) => api.admin.whoami.run(options),
  plan: () => api.admin.plan.run(),
};
const onlinerActions = {
  wordpress: () => api.onliner.wordpress.run(),
  "madtest.find": () => api.onliner.madtest.find.run(),
};
const launchpadActions = {
  "launchpad.onliner": () =>
    window.open("https://www.onliner.by/", "_blank", "noopener,noreferrer"),
  "launchpad.wordpress": () =>
    window.open(
      "https://people.onliner.by/wp-admin/edit.php",
      "_blank",
      "noopener,noreferrer",
    ),
  "launchpad.madtest": () =>
    window.open("https://madtest.ru/app/", "_blank", "noopener,noreferrer"),
};
const sessionActions = {
  login: () => api.session.login.run(),
};
const feedbackActions = {
  feedback: () => api.feedback.run(),
};
const visualEditorActions = new Set([
  "italic",
  "bold",
  "list",
]);
const actionMap = {
  ...editorActions,
  ...textActions,
  ...contentActions,
  ...markupActions,
  ...searchActions,
  ...fieldActions,
  ...auditActions,
  ...adminActions,
  ...onlinerActions,
  ...launchpadActions,
  ...sessionActions,
  ...feedbackActions,
};
const active = {
  element(run) {
    const element = api.element();
    return element && typeof run === "function" ? run(element) : false;
  },
  editor(run) {
    const element = api.element();
    if (element && typeof run === "function") return run(element);
    if (api.editor?.visual?.() && typeof run === "function") return run(null);
    return false;
  },
};
const activeMap = {
  "nbsp": () => active.element((element) => api.chars.state(element, "nbsp")),
  "comma": () => active.element((element) => api.chars.state(element, "comma")),
  "colon": () => active.element((element) => api.chars.state(element, "colon")),
  "dash": () => active.element((element) => api.chars.state(element, "dash")),
  "quote": () => active.element((element) => api.chars.state(element, "quote")),
  "punct": () => false,
  "token": () => active.element((element) => api.tokenActive(element)),
  "italic": () => active.editor((element) => api.markup.inlineActive(element, { mode: "italic" })),
  "bold": () => active.editor((element) => api.markup.inlineActive(element, { mode: "bold" })),
  inline: () => active.editor((element) => api.markup.inlineActive(element, { mode: "cycle" })),
  block: () => active.editor((element) => api.markup.blockActive(element)),
};

export const actions = {
  ...api,
  has(id) {
    const value = String(id || "");
    return Boolean(actionMap[value]);
  },
  active(id) {
    const value = String(id || "");
    const active = activeMap[value];
    if (active) return Boolean(active());
    return Boolean(api.state()[value]);
  },
  run(id, options = {}) {
    const value = String(id || "");
    const action = actionMap[value];
    if (!action) return false;
    if (editorActions[value]) {
      const element = api.element();
      if (element) return action(element, options);
      if (api.editor?.visual?.() && visualEditorActions.has(value)) {
        return action(null, options);
      }
      return false;
    }
    return action(options);
  },
};
