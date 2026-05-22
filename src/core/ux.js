const actions = {
  headless: {
    init() {
      return {
        timer: null,
        name: "",
        button: null,
        consumed: false,
        skip: "",
      };
    },
    clear(state) {
      if (!state?.timer) return;
      clearTimeout(state.timer);
      state.timer = null;
    },
    reset(state) {
      actions.headless.clear(state);
      state.name = "";
      state.button = null;
      state.consumed = false;
    },
    recentTouchScroll(panel, now = Date.now()) {
      if (panel?.dataset?.touchScroll === "true") return true;
      const stamp = Number(panel?.dataset?.touchScrollStamp || "0");
      if (!Number.isFinite(stamp) || stamp <= 0) return false;
      return now - stamp < 320;
    },
    held(hold = [], name = "") {
      return hold.includes(String(name || ""));
    },
    shouldSkipClick(state, name = "") {
      return Boolean(state?.skip) && state.skip === String(name || "");
    },
    consumeSkip(state, name = "") {
      if (!actions.headless.shouldSkipClick(state, name)) return false;
      state.skip = "";
      return true;
    },
  },
};

const ux = { actions };

export { ux };
