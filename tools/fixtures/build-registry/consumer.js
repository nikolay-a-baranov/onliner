import { shared } from "./shared.js";

globalThis.__BUILD_REGISTRY_ORDER__ = [
  ...globalThis.__BUILD_REGISTRY_ORDER__,
  "consumer",
];

export { shared as indirect };
