export const createChain = (api) => {
  const chain = {
    running: false,
    allowed(options = {}) {
      const identity = options.identity || {};
      const context = options.context || {};
      const mode = String(identity.feedMode || identity.effectiveRole || "");
      return (
        String(identity.realUserId || "") === "35" &&
        mode === "editor" &&
        context.surface === "post" &&
        ["news", "longread", "photoreport"].includes(context.page)
      );
    },
    async run(options = {}) {
      if (chain.running || !chain.allowed(options)) return false;
      chain.running = true;
      try {
        const cleaned = await api.admin.clean.run();
        if (!cleaned) return false;
        if (options.context.page === "longread") {
          const scheduled = await options.schedule?.run?.();
          if (!scheduled) return false;
        }
        const reader = await options.reader?.run?.();
        if (!reader) return false;
        const audited = await api.audit.text.run({
          backgroundSources: ["languagetool"],
          sources: ["gemini"],
          closeEmpty: true,
          waitForChecks: true,
          waitForReview: true,
        });
        if (!audited) return false;
        return Boolean(api.admin.lead.run());
      } catch {
        return false;
      } finally {
        chain.running = false;
      }
    },
  };
  return { chain };
};
