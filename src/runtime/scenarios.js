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
  source: {
    surface: ["source", "telegram"],
  },
  telegram: {
    surface: ["telegram"],
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
    return command.paramsItems().map((item) =>
      item?.type === "separator" ? item : wrap(item),
    );
  },
  paramsItems() {
    return [
      "params.time",
      "params.sticky",
      "params.visibility",
      "params.status",
      "params.updated",
      as.separator(),
      "prepare",
      "params.date",
      as.separator(),
      "params.mode",
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
  audience(id, commands, audience = "newsroom") {
    if (audience === "author") return group.author(id, commands);
    if (audience === "editor") return group.editor(id, commands);
    if (audience === "authors") return group.authors(id, commands);
    if (audience === "editors") return group.editors(id, commands);
    if (audience === "test") return group.test(id, commands);
    return group.newsroom(id, commands);
  },
};
const ribbon = {
  commands: {
    pinned: {
      author: [
        "block",
        "inline",
        "embed",
      ],
      editor: [
        "punct",
        "left",
        "right",
        "capital",
        "list",
      ],
      authors: [
        "block",
        "inline",
        "embed",
      ],
      editors: ["punct", "left", "right", "capital", "list"],
    },
    role: {
      author: {
        available: [
          "block",
          "inline",
          "readmore",
          "promo",
          "promo.vote",
          "toc",
          "media.insert",
          "media.image",
          "media.gallery",
          "image.caption",
          "image.search",
          "embed",
          "media.upload",
          "excerpt",
          "author.cleanup",
          "tags.suggest",
        ],
      },
      editor: {
        available: ["cleanup", "audit", "reader", "list", "toc"],
      },
      authors: {
        available: [
          "block",
          "inline",
          "readmore",
          "promo",
          "promo.vote",
          "toc",
          "media.insert",
          "media.image",
          "media.gallery",
          "image.caption",
          "image.search",
          "embed",
          "media.upload",
          "excerpt",
          "author.cleanup",
          "tags.suggest",
        ],
      },
      editors: {
        available: ["cleanup", "audit", "reader", "list", "toc"],
      },
    },
    roleGroups: {
      content: {
        commands: ["author.cleanup", "readmore", "promo", "promo.vote"],
      },
      fields: {
        commands: ["excerpt", "tags.suggest"],
      },
      prep: {
        commands: ["cleanup", "audit", "reader"],
      },
      markup: {
        commands: ["block", "inline", "list", "toc"],
        variants: {
          authors: [{ userIds: ["35", "146"] }],
          editors: [],
        },
      },
      media: {
        commands: [
          "media.image",
          "media.gallery",
          "image.caption",
          "image.search",
          "embed",
        ],
      },
    },
    groups: {
      service: [
        as.service("whoami"),
        as.superuser("plan"),
        as.superuser("dump"),
      ],
      crawler: [
        as.superuser("crawler.tags"),
        as.superuser("report"),
        as.superuser("report.sections"),
      ],
      test: [as.test("block"), as.test("inline"), as.test("proofread")],
      prep: {
        commands: [
          as.author("sanitize"),
          as.editor("cleanup"),
          as.editor("audit"),
          as.editor("reader"),
          as.superuser("mirror"),
        ],
        variants: [
          {
            when: { surface: ["reader"] },
            remove: ["reader"],
          },
        ],
      },
      content: {
        commands: [
          "author.cleanup",
          "readmore",
          "promo",
          "promo.vote",
          "more",
          "photo",
          "video",
          as.superuser("tags"),
        ],
        variants: [],
      },
      media: [
        as.author("media.image"),
        as.author("media.gallery"),
        as.author("image.caption"),
        as.author("image.search"),
        as.author("embed"),
      ],
      roadmap: {
        author: {
          commands: [
            as.author("author.cleanup"),
            as.author("media.insert"),
            as.author("excerpt"),
            as.author("params.submit"),
          ],
        },
        editor: {
          commands: [
            as.editor("cleanup"),
            as.editor("audit"),
            as.editor("reader"),
            as.editor("excerpt"),
            "prepare",
            as.editor("params.submit"),
          ],
          variants: [
            {
              when: { page: ["longread"] },
              commands: [
                as.editor("cleanup"),
                as.editor("audit"),
                as.editor("reader"),
                as.editor("excerpt"),
                "prepare",
                as.editor("params.submit"),
              ],
            },
            {
              when: { page: ["news"] },
              commands: [
                as.editor("cleanup"),
                as.editor("audit"),
                as.editor("reader"),
                as.editor("excerpt"),
                "refresh",
                as.editor("params.submit"),
              ],
            },
          ],
        },
        authors: {
          commands: [
            as.authors("author.cleanup"),
            as.authors("media.insert"),
            as.authors("excerpt"),
            as.authors("params.submit"),
          ],
        },
        editors: {
          commands: [
            as.editors("cleanup"),
            as.editors("audit"),
            as.editors("reader"),
          ],
        },
      },
      shift: {
        editor: [
          as.editor("home"),
          as.editor("left"),
          as.editor("right"),
          as.editor("cursor"),
        ],
        service: [
          command.access("home", { users: ["baranov"], roles: ["editors"] }),
          command.access("left", { users: ["baranov"], roles: ["editors"] }),
          command.access("right", { users: ["baranov"], roles: ["editors"] }),
          command.access("cursor", {
            users: ["baranov"],
            roles: ["editors"],
          }),
        ],
      },
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
        as.editor("yandex"),
        as.editor("gramota"),
        as.editor("kinopoisk"),
      ],
      fields: {
        commands: ["titles", "excerpt", "slug", "tags.normalize"],
        variants: [
          {
            when: { surface: ["reader"] },
            remove: ["tags.normalize"],
          },
        ],
      },
      params: {
        commands: command.paramsItems(),
        variants: [
          {
            when: { surface: ["reader"], page: ["news"] },
            commands: [
              "params.time",
              "params.sticky",
              "params.visibility",
              "params.status",
              "params.updated",
              "params.mode",
              as.separator(),
              "refresh",
              "params.date",
            ],
          },
          {
            when: { surface: ["reader"] },
            commands: [
              "params.time",
              "params.sticky",
              "params.visibility",
              "params.status",
              "params.updated",
              "params.mode",
              as.separator(),
              "prepare",
              "params.date",
            ],
          },
          {
            when: { page: ["news"] },
            commands: [
              "params.time",
              "params.sticky",
              "params.visibility",
              "params.status",
              "params.updated",
              as.separator(),
              "refresh",
              "params.date",
              as.separator(),
              "params.mode",
            ],
          },
        ],
      },
      feedback(wrap) {
        return [wrap("feedback")];
      },
      submit: ["params.submit"],
    },
  },
  post: {
    modes: {
      author: [
        { id: "service", audience: ["service"] },
        { id: "crawler", audience: ["service"] },
        { id: "feedback", audience: ["author"] },
        { id: "pinned", audience: ["author"] },
        { id: "role", audience: ["author"] },
        { id: "publish", audience: ["author"] },
        { id: "roadmap", audience: ["author"] },
      ],
      editor: [
        { id: "service", audience: ["service"] },
        { id: "crawler", audience: ["service"] },
        { id: "feedback", audience: ["editor"] },
        { id: "roadmap", audience: ["editor"] },
        { id: "pinned", audience: ["editor"] },
        { id: "role", audience: ["editor"] },
        { id: "fields", audience: ["editor"] },
        { id: "publish", audience: ["editor"] },
      ],
      authors: [
        { id: "prep", audience: ["author"] },
        { id: "content", audience: ["author"] },
        { id: "markup", audience: ["author"] },
        { id: "media", audience: ["author"] },
        { id: "fields", audience: ["author"] },
        { id: "params", audience: ["author"] },
      ],
      editors: [
        { id: "prep", audience: ["editor"] },
        { id: "shift", audience: ["editor"] },
        { id: "chars", audience: ["editor"] },
        { id: "tokens", audience: ["editor"] },
        { id: "markup", audience: ["editor"] },
        { id: "search", audience: ["editor"] },
        { id: "fields", audience: ["editor"] },
        { id: "params", audience: ["editor"] },
      ],
      test: [
        { id: "service", audience: ["service"] },
        { id: "crawler", audience: ["service"] },
        { id: "test", audience: ["test"] },
        { id: "fields", audience: ["test"] },
        { id: "publish", audience: ["test"] },
      ],
      newsroom: [
        { id: "service", audience: ["service"] },
        { id: "crawler", audience: ["service"] },
        { id: "feedback", audience: ["newsroom"] },
        { id: "prep", audience: ["newsroom"] },
        { id: "content", audience: ["newsroom"] },
        { id: "shift", audience: ["editor"] },
        { id: "chars", audience: ["editor"] },
        { id: "tokens", audience: ["editor"] },
        { id: "markup", audience: ["newsroom"] },
        { id: "media", audience: ["newsroom"] },
        { id: "search", audience: ["editor"] },
        { id: "fields", audience: ["newsroom"] },
        { id: "publish", audience: ["newsroom"] },
      ],
    },
  },
  reader: [
    { id: "pinned", audience: ["editor"] },
    { id: "shift", audience: ["editor"] },
    { id: "shift", audience: ["service", "editors"] },
    { id: "prep", audience: ["newsroom"] },
    { id: "chars", audience: ["editor"] },
    { id: "tokens", audience: ["editor"] },
    { id: "markup", audience: ["newsroom"] },
    { id: "media", audience: ["newsroom", "authors"] },
    { id: "search", audience: ["editor"] },
    { id: "fields", audience: ["newsroom"] },
    { id: "params", audience: ["newsroom"] },
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
    prep(commands, entry = {}) {
      return group.audience("prep", commands, entry.audience);
    },
    content(commands, entry = {}) {
      return group.audience("content", commands, entry.audience);
    },
    media(commands, entry = {}) {
      return group.audience("media", commands, entry.audience);
    },
    roadmap(commands, entry = {}) {
      if (entry.audience === "authors") return group.authors("roadmap", commands);
      if (entry.audience === "editors") return group.editors("roadmap", commands);
      return group.plain("roadmap", commands);
    },
    shift(commands, entry = {}) {
      if (entry.audience === "editor") return group.editor("shift", commands);
      return group.plain("shift", commands);
    },
    chars(commands) {
      return group.editor("chars", commands);
    },
    tokens(commands) {
      return group.editor("tokens", commands);
    },
    markup(commands, entry = {}) {
      return group.audience("markup", commands, entry.audience);
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
      return group.audience("fields", commands, entry.audience);
    },
    params(commands, entry = {}) {
      return group.audience("params", commands, entry.audience);
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
    if (audience === "author") return as.author;
    if (audience === "editor") return as.editor;
    if (audience === "authors") return as.authors;
    if (audience === "editors") return as.editors;
    return as.newsroom;
  },
  feed: {
    mode(identity = {}) {
      return String(identity?.feedMode || identity?.effectiveRole || "newsroom");
    },
    entries(role = "") {
      const modes = ribbon.post.modes || {};
      return list.values(modes[role] || modes.newsroom);
    },
  },
  role: {
    config(id = "") {
      const value = ribbon.commands.roleGroups[id];
      if (Array.isArray(value)) {
        return {
          commands: value,
          variants: {},
        };
      }
      return {
        commands: Array.isArray(value?.commands) ? value.commands : [],
        variants: value?.variants || {},
      };
    },
    variant(audience = "", id = "", sample = {}) {
      const variants = post.role.config(id).variants?.[audience];
      if (!Array.isArray(variants)) return null;
      if (!variants.length) return { enabled: false };
      const user = String(sample.user || "");
      const userId = String(sample.userId || "");
      return (
        variants.find((item) => {
          const users = list.values(item?.users);
          const userIds = list.strings(item?.userIds);
          if (users.length && !users.includes(user)) return false;
          if (userIds.length && !userIds.includes(userId)) return false;
          return true;
        }) || { enabled: false }
      );
    },
    commands(audience = "", id = "", sample = {}) {
      const config = post.role.config(id);
      const variant = post.role.variant(audience, id, sample);
      if (variant?.enabled === false) return [];
      const base = Array.isArray(variant?.commands)
        ? variant.commands
        : config.commands;
      const remove = new Set(list.strings(variant?.remove));
      return [
        ...base.filter((item) => !remove.has(command.id(item))),
        ...list.values(variant?.add),
      ];
    },
    meta(audience = "") {
      return ribbon.commands.role[audience] || { available: [] };
    },
    pinnedIds(audience = "") {
      return ribbon.commands.pinned[audience]
        .map(command.id)
        .filter(Boolean);
    },
    ids(audience = "") {
      return new Set([
        ...post.role.meta(audience).available,
        ...post.role.pinnedIds(audience),
      ]);
    },
    pinned(audience = "") {
      const wrap = post.wrap(audience);
      const items = ribbon.commands.pinned[audience] || [];
      return items.map((item) =>
        item?.type === "separator" ? item : wrap(item),
      );
    },
    group(audience = "", id = "", commands = []) {
      return group.audience(id, commands, audience);
    },
    groups(audience = "", sample = {}) {
      const wrap = post.wrap(audience);
      const ids = post.role.ids(audience);
      return Object.entries(ribbon.commands.roleGroups)
        .map(([id]) =>
          post.role.group(
            audience,
            id,
            post.role
              .commands(audience, id, sample)
              .filter((item) =>
                item?.type === "separator" || ids.has(command.id(item)),
              )
              .map((item) =>
                item?.type === "separator" ? item : wrap(item),
              ),
          ),
        )
        .filter((value) => value.commands.length);
    },
  },
  roadmap: {
    config(audience = "") {
      const value = ribbon.commands.groups.roadmap[audience];
      if (Array.isArray(value)) {
        return {
          commands: value,
          variants: [],
        };
      }
      return {
        commands: Array.isArray(value?.commands) ? value.commands : [],
        variants: Array.isArray(value?.variants) ? value.variants : [],
      };
    },
    variant(audience = "", sample = {}) {
      const variants = post.roadmap.config(audience).variants;
      if (!variants.length) return null;
      const user = String(sample.user || "");
      const userId = String(sample.userId || "");
      return (
        variants.find((item) => {
          if (!match.when(item?.when || {}, sample, "")) return false;
          const users = list.values(item?.users);
          const userIds = list.strings(item?.userIds);
          if (users.length && !users.includes(user)) return false;
          if (userIds.length && !userIds.includes(userId)) return false;
          return true;
        }) || null
      );
    },
    commands(audience = "", sample = {}) {
      const config = post.roadmap.config(audience);
      const variant = post.roadmap.variant(audience, sample);
      if (variant?.enabled === false) return [];
      const base = Array.isArray(variant?.commands)
        ? variant.commands
        : config.commands;
      const remove = new Set(list.strings(variant?.remove));
      return [
        ...base.filter((item) => !remove.has(command.id(item))),
        ...list.values(variant?.add),
      ];
    },
  },
  omit(value = {}) {
    return {
      content: Array.isArray(value.content) ? value.content : [],
      editor: Array.isArray(value.editor) ? value.editor : [],
      author: Array.isArray(value.author) ? value.author : [],
    };
  },
  sample(audience = "", options = {}) {
    const contextValue = options?.contextValue || {};
    return {
      ...contextValue,
      audience: String(audience || ""),
      user: String(options?.identity?.realUser || contextValue.user || ""),
      userId: String(
        options?.identity?.realUserId || contextValue.userId || "",
      ),
      role: Array.isArray(contextValue.role) ? contextValue.role : [],
      surface: String(contextValue.surface || ""),
    };
  },
  groupConfig(id = "") {
    const value = ribbon.commands.groups[id];
    if (Array.isArray(value)) {
      return {
        commands: value,
        variants: [],
      };
    }
    return {
      commands: Array.isArray(value?.commands) ? value.commands : [],
      variants: Array.isArray(value?.variants) ? value.variants : [],
    };
  },
  groupCommands(id = "", sample = {}, omit = []) {
    const config = post.groupConfig(id);
    const override = config.variants.find((item) =>
      Array.isArray(item?.commands) && match.when(item?.when || {}, sample, ""),
    );
    const matched = config.variants.filter((item) =>
      match.when(item?.when || {}, sample, ""),
    );
    const base = Array.isArray(override?.commands)
      ? override.commands
      : config.commands;
    const remove = new Set([
      ...list.strings(omit),
      ...matched.flatMap((item) => list.strings(item?.remove)),
    ]);
    return [
      ...base.filter((item) => !remove.has(command.id(item))),
      ...matched.flatMap((item) => list.values(item?.add)),
    ];
  },
  current(omit = {}, options = {}) {
    const value = post.omit(omit);
    const sample = post.sample("newsroom", options);
    return {
      content: post.groupCommands("content", sample, [
        ...value.content,
        ...value.editor,
        ...value.author,
      ]),
      prep: post.groupCommands("prep", sample, [
        ...value.editor,
        ...value.author,
      ]),
      pinned: {
        author: command.only(ribbon.commands.pinned.author, value.author),
        editor: command.only(ribbon.commands.pinned.editor, value.editor),
        authors: post.role.pinned("authors"),
        editors: post.role.pinned("editors"),
      },
    };
  },
  command: {
    identity(options = {}) {
      return {
        user: String(options?.identity?.realUser || options?.contextValue?.user || ""),
        userId: String(
          options?.identity?.realUserId || options?.contextValue?.userId || "",
        ),
      };
    },
    wrap(entry = {}, items = [], options = {}) {
      const wrap = post.wrap(entry.audience);
      return list
        .values(items)
        .map((item) =>
          item?.type === "separator" || typeof item !== "string"
            ? item
            : wrap(item),
        );
    },
    current(entry = {}, current = {}) {
      const id = entry.id || "";
      if (id === "content") return current.content;
      if (id === "prep") return current.prep;
      if (id === "pinned") {
        return current.pinned[entry.audience || "editor"] || [];
      }
      return null;
    },
    variant(entry = {}, options = {}) {
      const id = entry.id || "";
      if (id !== "fields" && id !== "params") return null;
      const items = post.groupCommands(id, post.sample(entry.audience, options));
      const next =
        id === "params" && entry.audience === "editor"
          ? [...items, as.separator(), "params.submit"]
          : items;
      return post.command.wrap(
        entry,
        next,
        options,
      );
    },
    roadmap(entry = {}, options = {}) {
      if (entry.id !== "roadmap") return null;
      return post.roadmap.commands(
        entry.audience || "authors",
        post.command.identity(options),
      );
    },
    shift(entry = {}) {
      if (entry.id !== "shift") return null;
      if (entry.audience === "editor") return ribbon.commands.groups.shift.editor;
      return ribbon.commands.groups.shift.service;
    },
    feedback(entry = {}) {
      if (entry.id !== "feedback") return null;
      return ribbon.commands.groups.feedback(post.wrap(entry.audience));
    },
    submit(entry = {}) {
      if (entry.id !== "submit") return null;
      return ribbon.commands.groups.submit.map(post.wrap(entry.audience));
    },
    fallback(entry = {}) {
      return ribbon.commands.groups[entry.id || ""] || [];
    },
    list(entry = {}, current = {}, options = {}) {
      return [
        post.command.current,
        post.command.roadmap,
        post.command.shift,
        post.command.variant,
        post.command.feedback,
        post.command.submit,
        post.command.fallback,
      ].reduce((items, resolve) => {
        if (items !== null) return items;
        return resolve(entry, current, options);
      }, null);
    },
  },
  enabled(entry, options = {}) {
    const id = entry.id || "";
    if (id === "pinned" && entry.audience === "author") {
      return options.showAuthorPinned !== false;
    }
    if (id === "pinned") return options.showEditorPinned !== false;
    return true;
  },
  section: {
    direct(entry = {}, options = {}) {
      if (!Array.isArray(entry.commands)) return null;
      return group.audience(
        entry.id || "commands",
        post.command.wrap(entry, entry.commands, options),
        entry.audience,
      );
    },
    group(value, current, options = {}) {
      const entry = post.entry(value);
      const id = entry.id || "";
      if (!post.enabled(entry, options)) return null;
      const direct = post.section.direct(entry, options);
      if (direct) return direct;
      const build = ribbon.group[id];
      if (!build) return null;
      return build(post.command.list(entry, current, options), entry);
    },
    publish(value, current, options = {}) {
      const entry = post.entry(value);
      const audience = entry.audience || "newsroom";
      const action =
        audience === "editor"
          ? group.plain(
              "submit",
              post.command.wrap({ audience }, ["params.mode"], options),
            )
          : post.section.group({ id: "submit", audience }, current, options);
      return [
        post.section.group({ id: "params", audience }, current, options),
        action,
      ];
    },
    role(entry = {}, audience = "", options = {}) {
      return post.role.groups(audience, {
        user: String(options?.identity?.realUser || options?.contextValue?.user || ""),
        userId: String(
          options?.identity?.realUserId || options?.contextValue?.userId || "",
        ),
      });
    },
    audience(entry, audience, current, options = {}) {
      const value = { ...entry, audience };
      if (value.id === "publish") return post.section.publish(value, current, options);
      if (value.id === "role") return post.section.role(value, audience, options);
      return [post.section.group(value, current, options)];
    },
    list(value, current, options = {}) {
      const entry = post.entry(value);
      const fallback = entry.id === "pinned" ? "editor" : "newsroom";
      return post
        .audience(entry, fallback)
        .flatMap((audience) =>
          post.section.audience(entry, audience, current, options),
        );
    },
  },
  list(
    items = [],
    {
      omit = {},
      showAuthorPinned = true,
      showEditorPinned = true,
      contextValue = null,
      identity = null,
    } = {},
  ) {
    const options = {
      showAuthorPinned,
      showEditorPinned,
      contextValue,
      identity,
    };
    const current = post.current(omit, options);
    return (Array.isArray(items) ? items : [])
      .flatMap((value) => post.section.list(value, current, options))
      .filter(Boolean)
      .filter((value) => value.commands.length);
  },
  groups({
    omit = {},
    showAuthorPinned = true,
    showEditorPinned = true,
    contextValue = null,
    identity = null,
  } = {}) {
    return post.list(post.feed.entries(post.feed.mode(identity)), {
      omit,
      showAuthorPinned,
      showEditorPinned,
      contextValue,
      identity,
    });
  },
  scenario(page, options = {}) {
    return {
      id: `post-${page}`,
      when: context.post.page(page),
      groups(runtime = {}) {
        return post.groups({
          ...options,
          contextValue: runtime.contextValue || null,
          identity: runtime.identity || null,
        });
      },
    };
  },
  adminScenario() {
    return {
      id: "post-admin",
      title: "Админка Onliner",
      logo: "wordpress-logo",
      when: {
        surface: ["post-admin"],
      },
      groups: [
        group.plain("pinned", [
          as.superuser("editorial.draft"),
          as.superuser("report.sections"),
        ]),
      ],
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
    list(runtime = {}) {
      return post.list(ribbon.reader, {
        omit: { editor: ["toc"] },
        showAuthorPinned: false,
        showEditorPinned: true,
        contextValue: runtime.contextValue || null,
        identity: runtime.identity || null,
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
          as.superuser("capture"),
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
const source = {
  scenario() {
    return {
      id: "source",
      title: "Иношапотяне",
      when: context.source,
      groups: [],
    };
  },
};
const telegram = {
  scenario() {
    return {
      id: "telegram",
      title: "Телега",
      when: context.telegram,
      groups: [],
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
        "shift",
        ribbon.commands.groups.shift.editor
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
    post.scenario("news"),
    post.scenario("photoreport"),
    post.adminScenario(),
    {
      id: "reader",
      title: "Чтение",
      emoji: "black-nib",
      when: context.reader,
      groups(runtime = {}) {
        return reader.group.list(runtime);
      },
    },
    revision.scenario(),
    login.scenario(),
    projectHome.scenario(),
    source.scenario(),
    onliner.scenario(),
    madtestSurface.loginScenario(),
    madtestSurface.homeScenario(),
    madtestSurface.statScenario(),
    madtestSurface.editScenario(),
  ],
};
