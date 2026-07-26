import { diagnosticsConfig } from "../core/diagnostics.js";
import { thumbnailContent } from "./diagnostics/thumbnail-content.js";

const diagnosticsRegistry = {
  [thumbnailContent.id]: thumbnailContent,
};

export const createDiagnostics = () => {
  const diagnostics = {
    current() {
      return diagnosticsRegistry[diagnosticsConfig.scriptId] || null;
    },
    run() {
      if (!diagnosticsConfig.enabled) return false;
      const script = diagnostics.current();
      if (!script?.run) {
        alert("Диагностика не настроена");
        return false;
      }
      script.run();
      return true;
    },
  };
  return { diagnostics };
};
