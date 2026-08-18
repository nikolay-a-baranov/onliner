import { commands } from "./commands.js";

const tree = {
  user: {
    superuser: {
      id: "superuser",
      title: "Суперрежим",
      emoji: "ogre",
    },
    service: {
      id: "service",
      title: "Сервис",
      emoji: "hammer-and-wrench",
    },
    diagnostics: {
      id: "diagnostics",
      title: "Диагностика",
      emoji: "adhesive-bandage",
    },
  },
  role: {
    author: {
      id: "author",
      title: "Журналист",
      emoji: "shark",
    },
    editor: {
      id: "editor",
      title: "Корректор",
      emoji: "honeybee",
    },
    authors: {
      id: "authors",
      title: "Журналист",
      logo: "onliner",
    },
    editors: {
      id: "editors",
      title: "Корректор",
      logo: "onliner",
    },
    hack: {
      id: "hack",
      title: "Работаем",
      emoji: "person-juggling",
    },
  },
  workflow: {
    pinned: {
      id: "pinned",
      title: "Закреп",
      emoji: "pushpin",
    },
    "content-type": {
      id: "content-type",
      title: "Content",
      emoji: "",
    },
    roadmap: {
      id: "roadmap",
      title: "Маршрут",
      emoji: "world-map",
    },
    prep: {
      id: "prep",
      title: "Препарация",
      emoji: "firecracker",
    },
    fields: {
      id: "fields",
      title: "Поля",
      emoji: "puzzle-piece",
    },
    params: {
      id: "params",
      title: "Публикация",
      emoji: "loudspeaker",
    },
    crawler: {
      id: "crawler",
      title: "Кроулеры",
      emoji: "pick",
    },
  },
  action: {
    chars: {
      id: "chars",
      title: "Знаки",
      emoji: "pen",
    },
    shift: {
      id: "shift",
      title: "Сдвиг",
      emoji: "skateboard",
    },
    tokens: {
      id: "tokens",
      title: "Токены",
      emoji: "fountain-pen",
    },
    markup: {
      id: "markup",
      title: "Вёрстка",
      emoji: "crayon",
    },
    media: {
      id: "media",
      title: "Медиатека",
      emoji: "framed-picture",
    },
    content: {
      id: "content",
      title: "Контент",
      emoji: "paintbrush",
    },
    search: {
      id: "search",
      title: "Поиск",
      emoji: "globe-with-meridians",
    },
  },
  surface: {
    madtest: {
      id: "madtest",
      title: "Тест",
      emoji: "test-tube",
    },
    common: {
      id: "common",
      title: "Общее",
      emoji: "",
    },
  },
};

const flatten = (value) =>
  Object.values(value).reduce((items, item) => {
    if (!item || typeof item !== "object") return items;
    if (item.id) return [...items, item];
    return [...items, ...flatten(item)];
  }, []);
const groupCore = {
  normalizeCommands(list = []) {
    const value = Array.isArray(list) ? list.filter(Boolean) : [];
    const reduced = value.reduce((items, command) => {
      if (!commands.separator(command)) return [...items, command];
      if (!items.length) return items;
      if (commands.separator(items[items.length - 1])) return items;
      return [...items, command];
    }, []);
    if (!reduced.length) return reduced;
    if (commands.separator(reduced[reduced.length - 1])) {
      return reduced.slice(0, -1);
    }
    return reduced;
  },
  meaningfulCommands(list = []) {
    return groupCore
      .normalizeCommands(list)
      .filter((command) => !commands.separator(command));
  },
  rank(id = "") {
    return (
      {
        pinned: 0,
        service: 1,
        fields: 90,
        params: 91,
        submit: 100,
        roadmap: 101,
      }[String(id || "")] ?? 50
    );
  },
  normalize(value) {
    const id = String(value?.id || "");
    const meta = groups.meta(id);
    return {
      id,
      title: String(value?.title || meta.title || ""),
      emoji: String(value?.emoji || meta.emoji || ""),
      logo: String(
        value?.logo || meta.logo || value?.favicon || meta.favicon || "",
      ),
      features: {
        ...(meta.features || {}),
        ...(value?.features || {}),
      },
      ...commands.access(value),
      commands: Array.isArray(value?.commands)
        ? value.commands.map((item) => commands.normalize(item))
        : [],
    };
  },
  normalizeScenario(value, options = {}) {
    const resolvedGroups =
      typeof value?.groups === "function"
        ? value.groups(options)
        : Array.isArray(value?.groups)
          ? value.groups
          : [];
    const currentGroups = Array.isArray(resolvedGroups) ? resolvedGroups : [];
    if (currentGroups.length) {
      return currentGroups.map((item) => groupCore.normalize(item));
    }
    const tools = Array.isArray(value?.tools) ? value.tools : [];
    return [
      groupCore.normalize({
        id: "tools",
        title: "",
        commands: tools,
      }),
    ];
  },
  allow(value, user = "", role = "", userId = "") {
    const id = String(value?.id || "");
    const meta = groups.meta(id);
    if (!commands.allowed(value, user, role, userId)) {
      return {
        id,
        title: String(value?.title || meta.title || ""),
        emoji: String(value?.emoji || meta.emoji || ""),
        logo: String(
        value?.logo || meta.logo || value?.favicon || meta.favicon || "",
      ),
        features: {
          ...(meta.features || {}),
          ...(value?.features || {}),
        },
        commands: [],
      };
    }
    const items = Array.isArray(value?.commands) ? value.commands : [];
    return {
      id,
      title: String(value?.title || meta.title || ""),
      emoji: String(value?.emoji || meta.emoji || ""),
      logo: String(
        value?.logo || meta.logo || value?.favicon || meta.favicon || "",
      ),
      features: {
        ...(meta.features || {}),
        ...(value?.features || {}),
      },
      commands: groupCore.normalizeCommands(
        items.filter((item) => commands.allowed(item, user, role, userId)),
      ),
    };
  },
  merge(list = []) {
    return list.reduce((items, current) => {
      const id = String(current?.id || "");
      const groupCommands = Array.isArray(current?.commands)
        ? current.commands
        : [];
      const existing = items.find((item) => item.id === id);
      if (!existing) {
        return [
          ...items,
          {
            ...current,
            commands: groupCore.normalizeCommands(groupCommands),
          },
        ];
      }
      const ids = new Set(
        existing.commands
          .filter((item) => !commands.separator(item))
          .map((item) => commands.id(item)),
      );
      const next = groupCommands.filter((item) => {
        if (commands.separator(item)) return true;
        const commandId = commands.id(item);
        if (ids.has(commandId)) return false;
        ids.add(commandId);
        return true;
      });
      return items.map((item) =>
        item.id === id
          ? {
              ...item,
              features: {
                ...(item.features || {}),
                ...(current.features || {}),
              },
              commands: groupCore.normalizeCommands([...item.commands, ...next]),
            }
          : item,
      );
    }, []);
  },
  empty(value) {
    return !groupCore.meaningfulCommands(value?.commands).length;
  },
  order(list = []) {
    return (Array.isArray(list) ? list : [])
      .map((entry, index) => ({ entry, index }))
      .sort((left, right) => {
        const leftRank = groupCore.rank(left.entry?.id);
        const rightRank = groupCore.rank(right.entry?.id);
        if (leftRank !== rightRank) return leftRank - rightRank;
        return left.index - right.index;
      })
      .map((item) => item.entry);
  },
  pinned(list = []) {
    return list.find((item) => item.id === "pinned") || null;
  },
  roadmap(list = []) {
    return list.find((item) => item.id === "roadmap") || null;
  },
  submit(list = []) {
    const current = list.find((item) => item.id === "submit") || null;
    if (!groupCore.meaningfulCommands(current?.commands).length) return null;
    return current;
  },
  feedback(list = []) {
    const current = list.find((item) => item.id === "feedback") || null;
    if (!groupCore.meaningfulCommands(current?.commands).length) return null;
    return current;
  },
  without(list = [], ids = []) {
    const hidden = new Set(Array.isArray(ids) ? ids : []);
    return (Array.isArray(list) ? list : []).filter(
      (item) => !hidden.has(item.id),
    );
  },
  commands(list = []) {
    return (Array.isArray(list) ? list : []).flatMap(
      (item) => item.commands || [],
    );
  },
  commandIds(list = []) {
    return groupCore
      .meaningfulCommands(list)
      .map((item) => commands.id(item))
      .filter(Boolean);
  },
  sameCommands(left = [], right = []) {
    const leftIds = groupCore.commandIds(left);
    const rightIds = groupCore.commandIds(right);
    if (leftIds.length !== rightIds.length) return false;
    return leftIds.every((id, index) => id === rightIds[index]);
  },
  suppressRoleDuplicates(list = [], role = "") {
    const duplicateId =
      role === "authors" ? "authors" : role === "editors" ? "editors" : "";
    if (!duplicateId) return list;
    const pinned = groupCore.pinned(list);
    const duplicate = list.find((item) => item.id === duplicateId) || null;
    if (!pinned || !duplicate) return list;
    if (!groupCore.sameCommands(pinned.commands, duplicate.commands)) return list;
    return groupCore.without(list, [duplicateId]);
  },
  hasCommand(list = [], id = "") {
    return groupCore.commands(list).some((item) => commands.id(item) === id);
  },
  hasUsefulCommand(list = []) {
    return groupCore.commands(list).some((item) => {
      const id = commands.id(item);
      return Boolean(id && id !== "whoami");
    });
  },
  omitCommand(list = [], id = "") {
    return (Array.isArray(list) ? list : [])
      .map((item) => ({
        ...item,
        commands: groupCore.normalizeCommands(
          (item.commands || []).filter((command) => commands.id(command) !== id),
        ),
      }))
      .filter((item) => !groupCore.empty(item));
  },
};
export const groups = {
  tree,
  byId: Object.fromEntries(flatten(tree).map((item) => [item.id, item])),
  meta(id) {
    return groups.byId[String(id || "")] || {};
  },
  normalizeCommands(list = []) {
    return groupCore.normalizeCommands(list);
  },
  meaningfulCommands(list = []) {
    return groupCore.meaningfulCommands(list);
  },
  rank(id = "") {
    return groupCore.rank(id);
  },
  normalize(value) {
    return groupCore.normalize(value);
  },
  normalizeScenario(value, options = {}) {
    return groupCore.normalizeScenario(value, options);
  },
  allow(value, user = "", role = "", userId = "") {
    return groupCore.allow(value, user, role, userId);
  },
  merge(list = []) {
    return groupCore.merge(list);
  },
  empty(value) {
    return groupCore.empty(value);
  },
  order(list = []) {
    return groupCore.order(list);
  },
  pinned(list = []) {
    return groupCore.pinned(list);
  },
  roadmap(list = []) {
    return groupCore.roadmap(list);
  },
  submit(list = []) {
    return groupCore.submit(list);
  },
  feedback(list = []) {
    return groupCore.feedback(list);
  },
  without(list = [], ids = []) {
    return groupCore.without(list, ids);
  },
  commands(list = []) {
    return groupCore.commands(list);
  },
  commandIds(list = []) {
    return groupCore.commandIds(list);
  },
  sameCommands(left = [], right = []) {
    return groupCore.sameCommands(left, right);
  },
  suppressRoleDuplicates(list = [], role = "") {
    return groupCore.suppressRoleDuplicates(list, role);
  },
  hasCommand(list = [], id = "") {
    return groupCore.hasCommand(list, id);
  },
  hasUsefulCommand(list = []) {
    return groupCore.hasUsefulCommand(list);
  },
  omitCommand(list = [], id = "") {
    return groupCore.omitCommand(list, id);
  },
};
