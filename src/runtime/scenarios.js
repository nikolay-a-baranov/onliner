const user = {
  superuser: {
    users: ["baranov"],
  },
};
const role = {
  author: {
    roles: ["author"],
  },
  editor: {
    roles: ["editor"],
  },
  test: {
    roles: ["test"],
  },
};
const audience = {
  newsroom: {
    roles: ["editor", "author"],
  },
  test: {
    userIds: ["35", "146"],
  },
  service: {
    users: ["baranov"],
    userIds: ["35", "146"],
  },
};
const as = {
  author(id, value = {}) {
    return { id, ...value, ...role.author };
  },
  editor(id, value = {}) {
    return { id, ...value, ...role.editor };
  },
  newsroom(id, value = {}) {
    return { id, ...value, ...audience.newsroom };
  },
  test(id, value = {}) {
    return { id, ...value, ...role.test, ...audience.test };
  },
  service(id, value = {}) {
    return { id, ...value, ...audience.service };
  },
  superuser(id, value = {}) {
    return { id, ...value, ...user.superuser };
  },
};
const context = {
  post: {
    page(value) {
      return {
        surface: ["post"],
        page: [value],
      };
    },
  },
  reader: {
    surface: ["reader"],
  },
  revision: {
    surface: ["revision"],
  },
  login: {
    surface: ["login"],
  },
  onliner: {
    surface: ["onliner"],
  },
  madtest: {
    surface: ["madtest"],
  },
};
const command = {
  id(value) {
    return typeof value === "string" ? value : value.id;
  },
  only(commands, exclude = []) {
    return commands.filter((value) => !exclude.includes(command.id(value)));
  },
  pick(commands, ids = []) {
    return commands.filter((value) => ids.includes(command.id(value)));
  },
  author: {
    markup: [
      as.author("author.emphasis"),
      as.author("author.heading"),
      as.author("blockquote"),
      as.author("interview"),
      as.author("clipboard.link"),
      as.author("image.caption"),
      as.author("resize"),
    ],
    prep: [as.author("sanitize")],
  },
  content: {
    blocks: ["more", "embed", "photo", "video", "toc"],
  },
  editor: {
    punct: [
      as.editor("editor.nbsp"),
      as.editor("editor.comma"),
      as.editor("editor.colon"),
      as.editor("editor.dash"),
      as.editor("editor.punct"),
      as.editor("editor.quote"),
      as.editor("editor.qswap"),
      as.editor("editor.accent"),
      as.editor("editor.symbol"),
      as.editor("editor.math"),
    ],
    motion: [
      as.editor("editor.home"),
      as.editor("editor.left"),
      as.editor("editor.right"),
    ],
    tokens: [
      as.editor("editor.letter"),
      as.editor("editor.number"),
      as.editor("editor.branch"),
      as.editor("editor.inflect"),
      as.editor("editor.abbr"),
      as.editor("editor.year"),
    ],
    markup: [
      as.editor("editor.block"),
      as.editor("editor.inline"),
      as.editor("editor.italic"),
      as.editor("editor.bold"),
      as.editor("editor.killem"),
      as.editor("editor.separator"),
      as.editor("interview"),
      as.editor("clipboard.link"),
      as.editor("image.caption"),
      as.editor("resize"),
      as.editor("editor.note"),
      as.editor("editor.list"),
    ],
    search: [
      as.editor("editor.google"),
      as.editor("editor.gramota"),
      as.editor("editor.kinopoisk"),
    ],
    prep: [
      as.editor("cleanup"),
      as.editor("audit"),
      as.newsroom("admin.prepare"),
      as.editor("reader"),
    ],
  },
  fields: {
    publication: [as.newsroom("lead")],
  },
  params: {
    publication: [
      as.newsroom("params.time"),
      as.newsroom("params.sticky"),
      as.newsroom("params.updated"),
      as.newsroom("params.visibility"),
      as.newsroom("params.mode"),
    ],
    test: [
      as.test("params.time"),
      as.test("params.sticky"),
      as.test("params.updated"),
      as.test("params.visibility"),
      as.test("params.mode"),
    ],
    submit: [as.newsroom("params.submit")],
  },
};
const pinned = {
  author: [
    as.author("sanitize"),
    as.author("editor.inline"),
    as.author("editor.block"),
    as.author("blockquote"),
    as.author("embed"),
    as.author("toc"),
  ],
  editor: [
    as.editor("editor.nbsp"),
    as.editor("editor.punct"),
    as.editor("editor.quote"),
    as.editor("editor.left"),
    as.editor("editor.right"),
  ],
};
const group = {
  superuser(commands) {
    return {
      id: "superuser",
      commands,
      ...user.superuser,
    };
  },
  editor(id, commands) {
    return {
      id,
      commands,
      ...role.editor,
    };
  },
  author(id, commands) {
    return {
      id,
      commands,
      ...role.author,
    };
  },
  newsroom(id, commands) {
    return {
      id,
      commands,
      ...audience.newsroom,
    };
  },
  test(id, commands) {
    return {
      id,
      commands,
      ...role.test,
      ...audience.test,
    };
  },
  service(commands) {
    return {
      id: "service",
      commands,
    };
  },
  plain(id, commands) {
    return {
      id,
      commands,
    };
  },
};
const post = {
  omit(value = {}) {
    return {
      content: Array.isArray(value.content) ? value.content : [],
      editor: Array.isArray(value.editor) ? value.editor : [],
      author: Array.isArray(value.author) ? value.author : [],
    };
  },
  commands(omit = {}) {
    const current = post.omit(omit);
    return {
      author: {
        content: command.only(command.content.blocks, [
          ...current.content,
          ...current.author,
        ]),
        pinned: command.only(pinned.author, current.author),
      },
      editor: {
        content: command.only(command.content.blocks, [
          ...current.content,
          ...current.editor,
        ]),
        pinned: command.only(pinned.editor, current.editor),
        prep: command.only(
          [...command.author.prep, ...command.editor.prep],
          [...current.author, ...current.editor],
        ),
      },
    };
  },
  groups({ omit = {}, showAuthorPinned = true, showEditorPinned = true } = {}) {
    const current = post.commands(omit);
    return [
      group.service([
        as.service("whoami"),
        as.superuser("plan"),
        as.superuser("dump"),
        as.superuser("tags"),
        as.superuser("widgets"),
      ]),
      group.test("test", [
        as.test("sanitize"),
        as.test("editor.block"),
        as.test("editor.inline"),
        as.test("embed"),
        as.test("toc"),
      ]),
      group.test("params", command.params.test),
      ...(showEditorPinned
        ? [group.editor("editor", current.editor.pinned)]
        : []),
      group.newsroom("prep", current.editor.prep),
      group.editor("content", current.editor.content),
      group.editor("motion", command.editor.motion),
      group.editor("punct", command.editor.punct),
      group.editor("tokens", command.editor.tokens),
      group.editor("markup", command.editor.markup),
      group.editor("search", command.editor.search),
      ...(showAuthorPinned
        ? [group.author("author", current.author.pinned)]
        : []),
      group.author("markup", command.author.markup),
      group.author("content", current.author.content),
      group.newsroom("fields", command.fields.publication),
      group.newsroom("params", command.params.publication),
      group.plain("submit", command.params.submit),
    ];
  },
  scenario(page, options = {}) {
    return {
      id: `post-${page}`,
      when: context.post.page(page),
      groups: post.groups(options),
    };
  },
};
const reader = {
  command: {
    omit: ["editor", "editor.home", "editor.note", "editor.list"],
  },
  group: {
    ids: ["editor", "motion", "punct", "tokens", "markup", "search"],
    includes(value) {
      return reader.group.ids.includes(String(value?.id || ""));
    },
    allowed(value) {
      return value.roles?.includes("editor") && reader.group.includes(value);
    },
    trim(value) {
      return {
        ...value,
        commands: command.only(value.commands, reader.command.omit),
      };
    },
    list() {
      return post
        .groups({
          omit: {
            content: ["toc"],
          },
          showAuthorPinned: false,
          showEditorPinned: true,
        })
        .filter(reader.group.allowed)
        .map(reader.group.trim)
        .filter((value) => value.commands.length);
    },
  },
};
const revision = {
  scenario() {
    return {
      id: "revision",
      title: "Редакции",
      emoji: "📑",
      when: context.revision,
      groups: [group.plain("common", [as.superuser("diff")])],
    };
  },
};
const login = {
  scenario() {
    return {
      id: "login",
      title: "Логин",
      emoji: "🔐",
      when: context.login,
      groups: [group.plain("common", ["login"])],
    };
  },
};
const onliner = {
  scenario() {
    return {
      id: "onliner",
      title: "Onliner",
      emoji: "\u{1F9EF}",
      when: context.onliner,
      groups: [group.plain("common", ["wordpress", "madtest.find"])],
    };
  },
};
const madtest = {
  scenario() {
    return {
      id: "madtest",
      title: "Тест",
      emoji: "\u2697\uFE0F",
      when: context.madtest,
      groups: [group.plain("common", ["madtest-find"])],
    };
  },
};
export const scenarios = {
  list: [
    post.scenario("longread"),
    post.scenario("news", {
      omit: {
        content: ["toc"],
      },
    }),
    post.scenario("photoreport", {
      omit: {
        content: ["toc"],
      },
    }),
    {
      id: "reader",
      title: "Чтение",
      emoji: "✒️",
      when: context.reader,
      groups: reader.group.list(),
    },
    revision.scenario(),
    login.scenario(),
    onliner.scenario(),
    madtest.scenario(),
  ],
};
