globalThis.__BUILD_REGISTRY_LOADS__ =
  (globalThis.__BUILD_REGISTRY_LOADS__ || 0) + 1;
globalThis.__BUILD_REGISTRY_ORDER__ = [
  ...(globalThis.__BUILD_REGISTRY_ORDER__ || []),
  "shared",
];

const shared = {};
const loads = () => globalThis.__BUILD_REGISTRY_LOADS__;

export { loads, shared };
