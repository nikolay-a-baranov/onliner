import { diagnosticsConfig } from "../core/diagnostics.js";
import { thumbnailContent } from "./diagnostics/thumbnail-content.js";

const diagnosticsRegistry = {
  [thumbnailContent.id]: thumbnailContent,
};

export const createDiagnostics = () => {
  const diagnostics = {
    tool(options = {}) {
      const scriptId = String(options.scriptId || "");
      return diagnosticsConfig.tools?.find?.((tool) =>
        tool?.enabled !== false &&
        String(tool?.scriptId || "") === scriptId
      ) || diagnostics.fallback();
    },
    developer(options = {}) {
      const tool = diagnostics.tool(options);
      const user = String(
        tool?.developer ||
          options.identity?.realUser ||
          options.identity?.effectiveUser ||
          "",
      );
      return diagnosticsConfig.developers?.[user] || null;
    },
    fallback() {
      return diagnosticsConfig.tools?.find?.((tool) => tool?.enabled !== false) || null;
    },
    current(options = {}) {
      const scriptId = String(options.scriptId || diagnostics.fallback()?.scriptId || "");
      return diagnosticsRegistry[scriptId] || null;
    },
    run(options = {}) {
      if (!diagnosticsConfig.enabled) return false;
      const script = diagnostics.current(options);
      if (!script?.run) {
        alert("Диагностика не настроена");
        return false;
      }
      script.run({
        ...options,
        developer: diagnostics.developer(options),
      });
      return true;
    },
  };
  return { diagnostics };
};
