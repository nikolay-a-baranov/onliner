const user = {
  superuser: {
    users: ["baranov"],
  },
};
const match = {
  include(list, value) {
    if (!Array.isArray(list) || !list.length) return true;
    return list.includes(value);
  },
  any(list, sample) {
    if (!Array.isArray(sample) || !sample.length) return true;
    if (!Array.isArray(list) || !list.length) return false;
    return sample.some((item) => list.includes(item));
  },
  text(value, sample) {
    if (!Array.isArray(sample) || !sample.length) return true;
    const string = String(value || "").toLowerCase();
    return sample.some((item) => string.includes(String(item).toLowerCase()));
  },
  page(value, sample) {
    if (!Array.isArray(sample) || !sample.length) return true;
    if (typeof value.page === "string") return sample.includes(value.page);
    const page = value.pageFlags || value.page || {};
    const map = {
      longread: page.longread,
      news: page.news,
      photoreport: page.photoreport,
      published: page.published,
      madtest: page.madtest,
    };
    return sample.some((item) => Boolean(map[item]));
  },
  when(when, value, mode) {
    if (!match.include(when.mode, mode)) return false;
    if (!match.include(when.surface, value.surface)) return false;
    if (!match.include(when.madtestPage, value.madtestPage)) return false;
    if (!match.any([value.user], when.user)) return false;
    if (!match.page(value, when.page)) return false;
    if (!match.any(value.role, when.role)) return false;
    if (!match.any(value.status, when.status)) return false;
    if (!match.any(value.type, when.type)) return false;
    if (!match.text(value.path, when.path)) return false;
    if (!match.text(value.title, when.title)) return false;
    if (!match.text(value.classList, when.class)) return false;
    return true;
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
  authors: {
    roles: ["authors"],
  },
  editors: {
    roles: ["editors"],
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
const list = {
  values(value) {
    return Array.isArray(value) ? value : [];
  },
  strings(value) {
    return list.values(value).map((item) => String(item || ""));
  },
};
const as = {
  superuser(id, value = {}) {
    return { id, ...value, ...user.superuser };
  },
  author(id, value = {}) {
    return { id, ...value, ...role.author };
  },
  editor(id, value = {}) {
    return { id, ...value, ...role.editor };
  },
  test(id, value = {}) {
    return { id, ...value, ...role.test, ...audience.test };
  },
  authors(id, value = {}) {
    return { id, ...value, ...role.authors };
  },
  editors(id, value = {}) {
    return { id, ...value, ...role.editors };
  },
  newsroom(id, value = {}) {
    return { id, ...value, ...audience.newsroom };
  },
  service(id, value = {}) {
    return { id, ...value, ...audience.service };
  },
  separator(value = {}) {
    return { type: "separator", ...value };
  },
};
const device = {
  touch() {
    const agent = navigator.userAgent || "";
    if (/Windows NT/.test(agent)) return false;
    if (
      /iPad|iPhone|iPod/.test(agent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
    ) {
      return true;
    }
    return (
      window.matchMedia?.("(pointer: coarse)")?.matches ||
      navigator.maxTouchPoints > 0
    );
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
  projectHome: {
    surface: ["project-home"],
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
  params(wrap) {
    return [
      wrap("params.time"),
      wrap("params.sticky"),
      wrap("params.updated"),
      wrap("params.visibility"),
      wrap("params.status"),
      as.separator(),
      wrap("prepare"),
      wrap("refresh"),
      as.separator(),
      wrap("params.mode"),
    ];
  },
  access(id, value = {}) {
    return {
      id,
      users: list.values(value.users),
      userIds: list.strings(value.userIds),
      roles: list.values(value.roles),
    };
  },
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
  test(id, commands) {
    return {
      id,
      commands,
      ...role.test,
      ...audience.test,
    };
  },
  newsroom(id, commands) {
    return {
      id,
      commands,
      ...audience.newsroom,
    };
  },
  authors(id, commands) {
    return {
      id,
      commands,
      ...role.authors,
    };
  },
  editors(id, commands) {
    return {
      id,
      commands,
      ...role.editors,
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
const ribbon = {
  commands: {
    pinned: {
      author: [
        as.author("sanitize"),
        as.author("inline"),
        as.author("block"),
        as.author("blockquote"),
        as.author("embed"),
        as.author("toc"),
        as.author("proofread"),
      ],
      editor: [
        as.editor("nbsp"),
        as.editor("comma"),
        as.editor("punct"),
        as.editor("quote"),
        as.editor("token"),
        as.editor("inline"),
        as.editor("left"),
        as.editor("right"),
      ],
      authors: [
        as.authors("block"),
        as.authors("inline"),
        as.authors("readmore"),
      ],
      editors: [
        as.editors("cleanup"),
        as.editors("audit"),
        as.editors("reader"),
      ],
    },
    groups: {
      service: [
        as.service("whoami"),
        as.superuser("plan"),
        as.superuser("dump"),
      ],
      crawler: [as.superuser("crawler.tags"), as.superuser("report")],
      test: [as.test("block"), as.test("inline"), as.test("proofread")],
      prep: [
        as.author("sanitize"),
        as.editor("cleanup"),
        as.editor("audit"),
        as.editor("reader"),
      ],
      content: ["more", "embed", "photo", "video", as.superuser("tags")],
      motion: [
        command.access("home", { users: ["baranov"], roles: ["editors"] }),
        command.access("left", { users: ["baranov"], roles: ["editors"] }),
        command.access("right", { users: ["baranov"], roles: ["editors"] }),
      ],
      moves: [as.editor("home"), as.editor("left"), as.editor("right")],
      chars: [
        as.editor("nbsp"),
        as.editor("comma"),
        as.editor("colon"),
        as.editor("dash"),
        as.editor("punct"),
        as.editor("quote"),
        as.editor("qswap"),
        as.editor("accent"),
        as.editor("symbol"),
        as.editor("math"),
      ],
      tokens: [as.editor("capital"), as.editor("token"), as.editor("inflect")],
      markup: [
        as.author("block"),
        as.author("inline"),
        as.author("blockquote"),
        as.author("interview"),
        as.author("clipboard.link"),
        as.author("image.caption"),
        as.author("resize"),
        as.editor("block"),
        as.editor("inline"),
        as.editor("italic"),
        as.editor("bold"),
        as.editor("clear"),
        as.editor("separator"),
        as.author("toc"),
        as.editor("toc"),
        as.editor("interview"),
        as.editor("clipboard.link"),
        as.editor("image.caption"),
        as.editor("resize"),
        as.editor("note"),
        as.editor("list"),
        as.superuser("widgets"),
      ],
      search: [
        as.editor("google"),
        as.editor("gramota"),
        as.editor("kinopoisk"),
      ],
      authors: [
        as.authors("block"),
        as.authors("inline"),
        as.authors("readmore"),
      ],
      editors: [
        as.editors("cleanup"),
        as.editors("audit"),
        as.editors("reader"),
      ],
      fields: ["titles", "excerpt", "slug", "tags.suggest", "tags.normalize"],
      params: command.params,
      feedback(wrap) {
        return [wrap("feedback")];
      },
      submit: ["params.submit"],
    },
  },
  post: [
    { id: "pinned", audience: ["editor"] },
    { id: "feedback", audience: ["newsroom", "authors", "editors"] },
    { id: "service", audience: ["service"] },
    { id: "crawler", audience: ["service"] },
    { id: "test", audience: ["test"] },
    { id: "fields", audience: ["test"] },
    { id: "publish", audience: ["test"] },
    { id: "prep", audience: ["newsroom"] },
    { id: "content", audience: ["newsroom"] },
    { id: "moves", audience: ["editor"] },
    { id: "chars", audience: ["editor"] },
    { id: "tokens", audience: ["editor"] },
    { id: "markup", audience: ["newsroom"] },
    { id: "search", audience: ["editor"] },
    { id: "pinned", audience: ["author"] },
    { id: "pinned", audience: ["authors"] },
    { id: "authors", audience: ["authors"] },
    { id: "publish", audience: ["authors"] },
    { id: "pinned", audience: ["editors"] },
    { id: "editors", audience: ["editors"] },
    { id: "fields", audience: ["editors"] },
    { id: "publish", audience: ["editors"] },
    { id: "fields", audience: ["newsroom"] },
    { id: "publish", audience: ["newsroom"] },
  ],
  reader: [
    { id: "pinned", audience: ["editor"] },
    { id: "content", audience: ["newsroom"] },
    { id: "motion", audience: ["service", "editors"] },
    { id: "moves", audience: ["editor"] },
    { id: "chars", audience: ["editor"] },
    { id: "tokens", audience: ["editor"] },
    { id: "markup", audience: ["newsroom"] },
    { id: "search", audience: ["editor"] },
  ],
  group: {
    service(commands) {
      return group.service(commands);
    },
    crawler(commands) {
      return group.plain("crawler", commands);
    },
    test(commands) {
      return group.test("test", commands);
    },
    pinned(commands, entry = {}) {
      if (entry.audience === "author") return group.author("pinned", commands);
      if (entry.audience === "authors")
        return group.authors("pinned", commands);
      if (entry.audience === "editors")
        return group.editors("pinned", commands);
      return group.editor("pinned", commands);
    },
    prep(commands) {
      return group.newsroom("prep", commands);
    },
    content(commands) {
      return group.newsroom("content", commands);
    },
    motion(commands) {
      return group.plain("motion", commands);
    },
    moves(commands) {
      return group.editor("moves", commands);
    },
    chars(commands) {
      return group.editor("chars", commands);
    },
    tokens(commands) {
      return group.editor("tokens", commands);
    },
    markup(commands) {
      return group.newsroom("markup", commands);
    },
    search(commands) {
      return group.editor("search", commands);
    },
    authors(commands) {
      return group.authors("authors", commands);
    },
    editors(commands) {
      return group.editors("editors", commands);
    },
    fields(commands, entry = {}) {
      if (entry.audience === "test") return group.test("fields", commands);
      if (entry.audience === "editors")
        return group.editors("fields", commands);
      return group.newsroom("fields", commands);
    },
    params(commands, entry = {}) {
      const audience = entry.audience || "newsroom";
      if (audience === "test") return group.test("params", commands);
      if (audience === "authors") return group.authors("params", commands);
      if (audience === "editors") return group.editors("params", commands);
      return group.newsroom("params", commands);
    },
    feedback(commands) {
      return group.plain("feedback", commands);
    },
    submit(commands) {
      return group.plain("submit", commands);
    },
  },
};
const post = {
  entry(value) {
    return typeof value === "string" ? { id: value } : value || {};
  },
  audience(value, fallback = "newsroom") {
    const entry = post.entry(value);
    const list = Array.isArray(entry.audience)
      ? entry.audience
      : entry.audience
        ? [entry.audience]
        : [fallback];
    return list.filter(Boolean);
  },
  wrap(audience = "newsroom") {
    if (audience === "test") return as.test;
    if (audience === "authors") return as.authors;
    if (audience === "editors") return as.editors;
    return as.newsroom;
  },
  omit(value = {}) {
    return {
      content: Array.isArray(value.content) ? value.content : [],
      editor: Array.isArray(value.editor) ? value.editor : [],
      author: Array.isArray(value.author) ? value.author : [],
    };
  },
  current(omit = {}) {
    const value = post.omit(omit);
    return {
      content: command.only(ribbon.commands.groups.content, [
        ...value.content,
        ...value.editor,
        ...value.author,
      ]),
      prep: command.only(ribbon.commands.groups.prep, [
        ...value.editor,
        ...value.author,
      ]),
      pinned: {
        author: command.only(ribbon.commands.pinned.author, value.author),
        editor: command.only(ribbon.commands.pinned.editor, value.editor),
        authors: ribbon.commands.pinned.authors.slice(),
        editors: ribbon.commands.pinned.editors.slice(),
      },
    };
  },
  commands(entry, current, options = {}) {
    const id = entry.id || "";
    if (id === "content") return current.content;
    if (id === "prep") return current.prep;
    if (id === "pinned") {
      return current.pinned[entry.audience || "editor"] || [];
    }
    if (id === "fields") {
      return ribbon.commands.groups.fields.map(post.wrap(entry.audience));
    }
    if (id === "params") {
      return ribbon.commands.groups.params(post.wrap(entry.audience));
    }
    if (id === "feedback") {
      return ribbon.commands.groups.feedback(post.wrap(entry.audience));
    }
    if (id === "submit") {
      return ribbon.commands.groups.submit.map(post.wrap(entry.audience));
    }
    return ribbon.commands.groups[id] || [];
  },
  enabled(entry, options = {}) {
    const id = entry.id || "";
    if (id === "pinned" && entry.audience === "author") {
      return options.showAuthorPinned !== false;
    }
    if (id === "pinned") return options.showEditorPinned !== false;
    return true;
  },
  group(value, current, options = {}) {
    const entry = post.entry(value);
    const id = entry.id || "";
    if (!post.enabled(entry, options)) return null;
    const build = ribbon.group[id];
    if (!build) return null;
    return build(post.commands(entry, current, options), entry);
  },
  publish(value, current, options = {}) {
    const entry = post.entry(value);
    const audience = entry.audience || "newsroom";
    return [
      post.group({ id: "params", audience }, current, options),
      post.group({ id: "submit", audience }, current, options),
    ];
  },
  groupsForAudience(entry, audience, current, options = {}) {
    const value = { ...entry, audience };
    if (value.id === "publish") return post.publish(value, current, options);
    return [post.group(value, current, options)];
  },
  groupsFor(value, current, options = {}) {
    const entry = post.entry(value);
    const fallback = entry.id === "pinned" ? "editor" : "newsroom";
    return post
      .audience(entry, fallback)
      .flatMap((audience) =>
        post.groupsForAudience(entry, audience, current, options),
      );
  },
  list(
    items = [],
    { omit = {}, showAuthorPinned = true, showEditorPinned = true } = {},
  ) {
    const current = post.current(omit);
    const options = { showAuthorPinned, showEditorPinned };
    return (Array.isArray(items) ? items : [])
      .flatMap((value) => post.groupsFor(value, current, options))
      .filter(Boolean)
      .filter((value) => value.commands.length);
  },
  groups({ omit = {}, showAuthorPinned = true, showEditorPinned = true } = {}) {
    return post.list(ribbon.post, {
      omit,
      showAuthorPinned,
      showEditorPinned,
    });
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
  commands() {
    const value = ribbon.commands.pinned.editor.slice();
    const ids = new Set(value.map(command.id).filter(Boolean));
    if (ids.has("capital")) return value;
    return [...value, "capital"];
  },
  group: {
    list() {
      return post.list(ribbon.reader, {
        omit: { content: ["toc"] },
        showAuthorPinned: false,
        showEditorPinned: true,
      });
    },
  },
};
const revision = {
  scenario() {
    return {
      id: "revision",
      title: "Редакции",
      emoji: "bookmark-tabs",
      when: context.revision,
      groups: [
        group.plain("feedback", [
          as.superuser("diff"),
          as.separator(),
          as.superuser("feedback"),
        ]),
      ],
    };
  },
};
const login = {
  scenario() {
    return {
      id: "login",
      title: "Логин",
      emoji: "locked-with-key",
      when: context.login,
      groups: [group.plain("common", ["login", as.separator(), "feedback"])],
    };
  },
};
const onliner = {
  scenario() {
    return {
      id: "onliner",
      title: "Onliner",
      emoji: "fire-extinguisher",
      when: context.onliner,
      groups: [
        group.plain("feedback", [
          "wordpress",
          "madtest.find",
          as.separator(),
          "feedback",
        ]),
      ],
    };
  },
};
const projectHome = {
  scenario() {
    return {
      id: "project-home",
      title: "Это база",
      emoji: "control-knobs",
      when: context.projectHome,
      groups: [
        group.plain("feedback", [
          "project.home.onliner",
          "project.home.wordpress",
          "project.home.madtest",
          as.separator(),
          "feedback",
        ]),
      ],
    };
  },
};
const madtest = {
  scenario() {
    return {
      id: "madtest",
      title: "Тест",
      emoji: "test-tube",
      when: context.madtest,
      groups: [
        group.plain("common", ["madtest-find", as.separator(), "feedback"]),
      ],
    };
  },
};
const madtestSurface = {
  group: {
    pinned() {
      return group.plain(
        "pinned",
        reader
          .commands()
          .map((item) => command.id(item))
          .filter(Boolean),
      );
    },
    moves() {
      return group.plain(
        "motion",
        ribbon.commands.groups.moves
          .map((item) => command.id(item))
          .filter(Boolean),
      );
    },
    chars() {
      return group.plain(
        "chars",
        ribbon.commands.groups.chars
          .map((item) => command.id(item))
          .filter(Boolean),
      );
    },
    tokens() {
      return group.plain(
        "tokens",
        ribbon.commands.groups.tokens
          .map((item) => command.id(item))
          .filter(Boolean),
      );
    },
    search() {
      return group.plain(
        "search",
        ribbon.commands.groups.search
          .map((item) => command.id(item))
          .filter(Boolean),
      );
    },
    feedback() {
      return group.plain("feedback", ["feedback"]);
    },
  },
  loginScenario() {
    return {
      id: "madtest-login",
      title: "Madtest",
      emoji: "test-tube",
      when: {
        ...context.madtest,
        madtestPage: ["login"],
      },
      groups: [madtestSurface.group.feedback()],
    };
  },
  homeScenario() {
    return {
      id: "madtest-home",
      title: "Madtest",
      emoji: "test-tube",
      when: {
        ...context.madtest,
        madtestPage: ["home"],
      },
      groups: [
        group.plain("common", ["madtest-find", as.separator(), "feedback"]),
      ],
    };
  },
  statScenario() {
    return {
      id: "madtest-stat",
      title: "Madtest",
      emoji: "test-tube",
      when: {
        ...context.madtest,
        madtestPage: ["stat", "preview", "app", "test"],
      },
      groups: [madtestSurface.group.feedback()],
    };
  },
  editScenario() {
    return {
      id: "madtest-edit",
      title: "Редактор",
      emoji: "test-tube",
      when: {
        ...context.madtest,
        madtestPage: ["main", "questions", "results"],
      },
      groups: [
        madtestSurface.group.pinned(),
        madtestSurface.group.moves(),
        madtestSurface.group.chars(),
        madtestSurface.group.tokens(),
        madtestSurface.group.search(),
        madtestSurface.group.feedback(),
      ],
    };
  },
};
export const scenarios = {
  access(value = {}) {
    return {
      users: list.values(value.users),
      userIds: list.strings(value.userIds),
      roles: list.values(value.roles),
    };
  },
  pinned: {
    editor() {
      return ribbon.commands.pinned.editor.slice();
    },
  },
  reader: {
    commands() {
      return reader.commands();
    },
  },
  external(config = [], fallback = []) {
    if (!Array.isArray(config)) return [];
    const map = new Map(
      (Array.isArray(fallback) ? fallback : []).map((item) => [item.id, item]),
    );
    return config
      .filter(
        (item) =>
          item &&
          item.id &&
          (Array.isArray(item.tools) || Array.isArray(item.groups)),
      )
      .map((item) => {
        const base = map.get(item.id) || {};
        return {
          id: item.id,
          title: item.title || base.title || item.id,
          emoji: item.emoji || base.emoji || "bookmark",
          image: item.image || base.image || "",
          logo: item.logo || base.logo || "",
          favicon: item.favicon || base.favicon || "",
          when: item.when || base.when || {},
          tools: item.tools,
          groups: item.groups,
        };
      });
  },
  all(config = []) {
    const map = new Map(scenarios.list.map((item) => [item.id, item]));
    scenarios
      .external(config, scenarios.list)
      .forEach((item) => map.set(item.id, item));
    return [...map.values()];
  },
  visible(value, list, mode) {
    return list.filter((item) => match.when(item.when || {}, value, mode));
  },
  resolve(current, list) {
    if (!Array.isArray(list) || !list.length) return null;
    if (list.some((item) => item.id === current)) {
      return list.find((item) => item.id === current);
    }
    return list[0];
  },
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
      emoji: "black-nib",
      when: context.reader,
      groups: reader.group.list(),
    },
    revision.scenario(),
    login.scenario(),
    projectHome.scenario(),
    onliner.scenario(),
    madtestSurface.loginScenario(),
    madtestSurface.homeScenario(),
    madtestSurface.statScenario(),
    madtestSurface.editScenario(),
  ],
};
