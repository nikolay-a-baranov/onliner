import { loads, shared as direct } from "./shared.js";
import "./first.js";
import { indirect } from "./consumer.js";
import "./second.js";

globalThis.__BUILD_REGISTRY_RESULT__ = {
  loads: loads(),
  order: globalThis.__BUILD_REGISTRY_ORDER__.join(","),
  singleton: direct === indirect,
};
