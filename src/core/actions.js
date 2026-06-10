import { transform } from "./transform.js";
import { createShared } from "./actions/shared.js";
import { createPunctuation } from "./actions/punctuation.js";
import { createMotion } from "./actions/motion.js";
import { createTokens } from "./actions/tokens.js";
import { createMarkup } from "./actions/markup.js";
import { createContent } from "./actions/content.js";
import { createSearch } from "./actions/search.js";
import { createFields } from "./actions/fields.js";
import { createAdmin } from "./actions/admin.js";
import { createOnliner } from "./actions/onliner.js";
import { createSession } from "./actions/session.js";

const api = {};
const shared = createShared(api);
const punctuation = createPunctuation(api);
const motion = createMotion(api);
const tokens = createTokens(api);
const markup = createMarkup(api);
const content = createContent(api);
const search = createSearch(api);
const fields = createFields(api);
const admin = createAdmin(api);
const onliner = createOnliner(api);
const session = createSession(api);
Object.assign(
  api,
  shared,
  punctuation,
  motion,
  tokens,
  markup,
  content,
  search,
  fields,
  admin,
  onliner,
  session,
);

const symbolList = ["°", "′", "″", "$", "€", "Ў", "ў", "І", "і", "í", "…"];
const mathList = ["−", "×", "·", "÷", "≈", "≠", "±", "≤", "≥", "²", "³"];
const editorActions = {
  "editor.nbsp": (element) => api.nbsp(element),
  "editor.comma": (element) => api.punctMark(element, ","),
  "editor.colon": (element) => api.punctMark(element, ":"),
  "editor.dash": (element) => api.punctMark(element, "—"),
  "editor.punct": (element) => api.punct(element),
  "editor.quote": (element) => api.quote(element),
  "editor.qswap": (element) => api.qswap(element),
  "editor.accent": (element) => api.accent(element),
  "editor.symbol": (element) => api.cyclePick(element, symbolList),
  "editor.math": (element) => api.cyclePick(element, mathList),
  "editor.home": (element) => api.home(element),
  "editor.left": (element) => api.move(element, -1),
  "editor.right": (element) => api.move(element, 1),
  "editor.letter": (element) => api.letter(element),
  "editor.number": (element) => api.number(element),
  "editor.abbr": (element) => api.abbr(element),
  "editor.year": (element) => api.year(element),
  "editor.branch": (element) => api.branch(element),
  "editor.inline": (element, options = {}) =>
    api.markup.inline(element, {
      mode: "cycle",
      reverse: Boolean(options.reverse),
    }),
  "editor.block": (element, options = {}) =>
    api.markup.block(element, {
      mode: "cycle",
      reverse: Boolean(options.reverse),
    }),
  "editor.italic": (element) =>
    api.markup.inline(element, { mode: "italic" }),
  "editor.bold": (element) => api.markup.inline(element, { mode: "bold" }),
  "editor.killem": (element) => api.clearTagAfter(element, "em"),
  "editor.note": (element) => api.note(element),
  "editor.list": (element) => api.list(element),
};
const authorActions = {
  "author.heading": () =>
    api.apply((value) =>
      transform.heading(value.value, {
        start: value.start,
        end: value.end,
      }),
    ),
  "author.emphasis": () =>
    api.apply((value) =>
      transform.emphasis(value.value, {
        start: value.start,
        end: value.end,
      }),
    ),
  "author.quote": () =>
    api.apply((value) =>
      transform.quote(value.value, {
        start: value.start,
        end: value.end,
      }),
    ),
  "author.cleanup": () => api.markup.cleanup.run(transform.cleanup),
};
const contentActions = {
  more: () => api.content.more.run(),
  toc: () => api.content.toc.run(),
  embed: () => api.content.embed.run(),
  photo: () => api.content.photo.run(),
  video: () => api.content.video.run(),
  widgets: () => api.content.widgets.run(),
  "author.more": () => api.content.more.run(),
  "author.embed": () => api.content.embed.run(),
  "author.photo": () => api.content.photo.run(),
  "author.video": () => api.content.video.run(),
};
const searchActions = {
  "editor.google": () => api.search.google.run(),
  "editor.gramota": () => api.search.gramota.run(),
  "editor.kinopoisk": () => api.search.kinopoisk.run(),
};
const fieldActions = {
  lead: () => api.fields.excerpt.run(),
};
const markupActions = {
  resize: () => {
    const element = api.element();
    return element ? api.markup.resize(element) : false;
  },
};
const adminActions = {
  diff: () => api.admin.diff.run(),
  dump: () => api.admin.dump.run(),
  tags: () => api.admin.tags.run(),
  sanitize: () => api.admin.sanitize.run(),
  "admin.prepare": () => api.admin.prepare.run(),
  whoami: (options = {}) => api.admin.whoami.run(options),
};
const onlinerActions = {
  wordpress: () => api.onliner.wordpress.run(),
  "madtest.find": () => api.onliner.madtest.find.run(),
};
const sessionActions = {
  login: () => api.session.login.run(),
};
const actionMap = {
  ...editorActions,
  ...authorActions,
  ...contentActions,
  ...markupActions,
  ...searchActions,
  ...fieldActions,
  ...adminActions,
  ...onlinerActions,
  ...sessionActions,
};

export const actions = {
  ...api,
  has(id) {
    const value = String(id || "");
    return Boolean(actionMap[value]);
  },
  active(id) {
    return Boolean(api.state()[String(id || "")]);
  },
  run(id, options = {}) {
    const action = actionMap[String(id || "")];
    if (!action) return false;
    if (String(id || "").startsWith("editor.")) {
      const element = api.element();
      return element ? action(element, options) : false;
    }
    return action(options);
  },
};
