import { transform } from "./core/transform.js";
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
import { createProofread } from "./actions/proofread.js";
import { createMedia } from "./actions/media.js";
import { createEditorial } from "./actions/editorial.js";

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
const proofread = createProofread(api);
const media = createMedia(api);
const editorial = createEditorial(api);
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
  proofread,
  media,
);
api.current?.bind?.();
editorial.bind?.();

const symbolList = ["°", "′", "″", "$", "€", "Ў", "ў", "І", "і", "í", "…"];
const mathList = ["−", "×", "·", "÷", "≈", "≠", "±", "≤", "≥", "²", "³"];
const editorActions = {
  "nbsp": (element) => api.nbsp(element),
  "comma": (element) => api.punctMark(element, ","),
  "colon": (element) => api.punctMark(element, ":"),
  "dash": (element) => api.punctMark(element, "—"),
  "punct": (element) => api.punct(element),
  "quote": (element) => api.cycle(element, ["«", "»"]),
  "qswap": (element) => api.qswap(element),
  "accent": (element) => api.accent(element),
  "symbol": (element) => api.cycle(element, symbolList),
  "math": (element) => api.cycle(element, mathList),
  "home": (element) => api.home(element),
  "left": (element) => api.move(element, -1),
  "right": (element) => api.move(element, 1),
  "cursor": (element) => api.cursor.collapse(element),
  "backspace": (element) => api.erase.word.back(element),
  "undo": (element) => api.undo.run(element),
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
};
editorActions.quote = (element) => api.quote(element);
const contentActions = {
  more: () => api.content.more.run(),
  readmore: () => api.content.readmore.run(),
  toc: () => api.content.toc.run(),
  embed: () => api.content.embed.run(),
  promo: () => api.content.promo.run(),
  photo: () => api.content.photo.run(),
  video: () => api.content.video.run(),
  widgets: () => api.content.widgets.run(),
};
const searchActions = {
  "google": () => api.search.google.run(),
  "yandex": () => api.search.yandex.run(),
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
const cleanupActions = {
  cleanup: () => api.admin.clean.run(),
  "author.cleanup": () => api.admin.clean.author.run(),
  "footer.normalize": () => api.admin.clean.author.run(),
};
const adminActions = {
  diff: () => api.admin.diff.run(),
  dump: () => api.admin.dump.run(),
  "submit.save": () => api.admin.submit.run("save"),
  tags: () => api.admin.tags.run(),
  report: () => api.admin.crawler.report.run(),
  "report.sections": () => api.admin.crawler.sections.run(),
  "crawler.tags": () => api.admin.crawler.tags.run(),
  "tags.normalize": () => api.admin.tags.normalize.run(),
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
const projectHomeActions = {
  "project.home.onliner": () =>
    window.open("https://www.onliner.by/", "_blank", "noopener,noreferrer"),
  "project.home.wordpress": () =>
    window.open(
      "https://people.onliner.by/wp-admin/edit.php",
      "_blank",
      "noopener,noreferrer",
    ),
  "project.home.madtest": () =>
    window.open("https://madtest.ru/app/", "_blank", "noopener,noreferrer"),
};
const sessionActions = {
  login: () => api.session.login.run(),
};
const feedbackActions = {
  feedback: () => api.feedback.run(),
};
const proofreadActions = {
  proofread: () => api.proofread.run(),
};
const mediaActions = {
  thumb: () => api.media.thumb.run(),
  "image.search": () => api.media.search.run(),
  "media.upload": () => api.media.upload.run(),
  "media.gallery": () => api.media.gallery.run(),
  "media.insert": () => api.media.upload.run(),
};
const editorialActions = {
  "editorial.source": () => editorial.source(),
  "editorial.agent": () => editorial.agent(),
  "editorial.draft": () => api.admin.draft.run(),
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
  ...cleanupActions,
  ...adminActions,
  ...onlinerActions,
  ...projectHomeActions,
  ...sessionActions,
  ...feedbackActions,
  ...proofreadActions,
  ...mediaActions,
  ...editorialActions,
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
  "media.upload": () => api.media.upload.active(),
  "nbsp": () => active.element((element) => api.chars.state(element, "nbsp")),
  "comma": () => active.element((element) => api.chars.state(element, "comma")),
  "colon": () => active.element((element) => api.chars.state(element, "colon")),
  "dash": () => active.element((element) => api.chars.state(element, "dash")),
  "quote": () => active.element((element) => api.chars.state(element, "quote")),
  "symbol": () => active.element((element) => api.chars.state(element, "symbol")),
  "math": () => active.element((element) => api.chars.state(element, "math")),
  "punct": () => active.element((element) => api.chars.state(element, "punct")),
  "token": () => active.element((element) => api.tokenActive(element)),
  "italic": () => active.editor((element) => api.markup.inlineActive(element, { mode: "italic" })),
  "bold": () => active.editor((element) => api.markup.inlineActive(element, { mode: "bold" })),
  inline: () => active.editor((element) => api.markup.inlineActive(element, { mode: "cycle" })),
  block: () => active.editor((element) => api.markup.blockActive(element)),
};
const cycleDoneMap = {
  "symbol": () => active.element((element) => api.chars.cycleDone(element, "symbol")),
  "math": () => active.element((element) => api.chars.cycleDone(element, "math")),
  "punct": () => active.element((element) => api.chars.punctCycleDone(element)),
};



// === separate bridge (minimal) ===
api.separate = {
  handlers: {},
  register(type, fn) {
    this.handlers[type] = fn;
  },
  run(type, payload) {
    const handler = this.handlers[type];
    if (!handler) return false;
    return handler(payload);
  },
};

window.addEventListener("message", (event) => {
  const data = event.data;
  if (!data || typeof data !== "object") return;
  return api.separate.run(data.type, data.payload);
});

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
  cycleDone(id) {
    const value = String(id || "");
    const run = cycleDoneMap[value];
    if (!run) return null;
    return Boolean(run());
  },
  run(id, options = {}) {
    const value = String(id || "");
    const action = actionMap[value];
    if (!action) return false;
    const track = value !== "undo";
    const snapshot = track ? api.undo.capture(api.element()) : null;
    if (editorActions[value]) {
      const element = api.element();
      if (element) {
        const done = action(element, options);
        if (done && track) api.undo.commit(element, snapshot);
        return done;
      }
      if (api.editor?.visual?.() && visualEditorActions.has(value)) {
        return action(null, options);
      }
      return false;
    }
    const done = action(options);
    if (done && track) api.undo.commit(api.element(), snapshot);
    return done;
  },
};
