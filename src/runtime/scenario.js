export const scenario = {
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
  pageMatch(value, sample) {
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
  match(when, value, mode) {
    if (!scenario.include(when.mode, mode)) return false;
    if (!scenario.include(when.surface, value.surface)) return false;
    if (!scenario.any([value.user], when.user)) return false;
    if (!scenario.pageMatch(value, when.page)) return false;
    if (!scenario.any(value.role, when.role)) return false;
    if (!scenario.any(value.status, when.status)) return false;
    if (!scenario.any(value.type, when.type)) return false;
    if (!scenario.text(value.path, when.path)) return false;
    if (!scenario.text(value.title, when.title)) return false;
    if (!scenario.text(value.classList, when.class)) return false;
    return true;
  },
  external(config, fallback) {
    if (!Array.isArray(config)) return [];
    const map = new Map(fallback.map((item) => [item.id, item]));
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
          emoji: item.emoji || base.emoji || "🔖",
          image: item.image || base.image || "",
          logo: item.logo || base.logo || "",
          favicon: item.favicon || base.favicon || "",
          when: item.when || base.when || {},
          tools: item.tools,
          groups: item.groups,
        };
      });
  },
  list(fallback, config) {
    const map = new Map(fallback.map((item) => [item.id, item]));
    scenario
      .external(config, fallback)
      .forEach((item) => map.set(item.id, item));
    return [...map.values()];
  },
  visible(value, list, mode) {
    return list.filter((item) => scenario.match(item.when || {}, value, mode));
  },
  resolve(current, list) {
    if (!Array.isArray(list) || !list.length) return null;
    if (list.some((item) => item.id === current)) {
      return list.find((item) => item.id === current);
    }
    return list[0];
  },
};
