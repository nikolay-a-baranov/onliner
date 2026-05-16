(() => {
  const app = {
    keepTexts: [
      "About",
      "Experience",
      "Education",
      "Skills",
      "Licenses & certifications",
      "Projects",
      "Volunteer experience",
      "Recommendations",
    ],
    init() {
      this.addStatus();
      this.expand();
      this.apply();
      setTimeout(() => this.apply(), 1000);
      setTimeout(() => this.apply(), 2500);
    },
    addStatus() {
      const status = document.createElement("div");
      status.textContent = "Snapshot mode";
      status.style.position = "fixed";
      status.style.top = "12px";
      status.style.right = "12px";
      status.style.zIndex = "999999";
      status.style.padding = "8px 12px";
      status.style.background = "#111";
      status.style.color = "#fff";
      status.style.borderRadius = "8px";
      status.style.fontSize = "14px";
      document.body.appendChild(status);
    },
    expand() {
      document.querySelectorAll("button, a").forEach((element) => {
        const text = element.textContent.trim();
        const label = element.getAttribute("aria-label") || "";
        const value = `${text} ${label}`;
        if (/show all|see all|показать все|ещё|more/i.test(value)) {
          element.click();
        }
      });
    },
    apply() {
      this.hideNoise();
      this.keepSections();
      this.cleanActions();
      this.fixLayout();
    },
    hideNoise() {
      const selectors = [
        "aside",
        "footer",
        ".global-nav",
        ".msg-overlay-list-bubble",
        ".scaffold-layout__aside",
        ".profile-right-rail",
      ];
      selectors.forEach((selector) => {
        document.querySelectorAll(selector).forEach((element) => {
          element.style.display = "none";
        });
      });
    },
    keepSections() {
      document.querySelectorAll("section").forEach((section) => {
        const text = section.textContent.trim();
        const hasTitle = this.keepTexts.some((title) => text.startsWith(title));
        const hasName = Boolean(section.querySelector("h1"));
        if (!hasTitle && !hasName) {
          section.style.display = "none";
        }
      });
    },
    cleanActions() {
      document.querySelectorAll("button, a").forEach((element) => {
        const label = element.getAttribute("aria-label") || "";
        if (/add|edit|message|connect|follow|save|more|open/i.test(label)) {
          element.style.display = "none";
        }
      });
    },
    fixLayout() {
      const selectors = [
        "main",
        ".scaffold-layout",
        ".scaffold-layout__main",
        ".pv-profile-card",
        ".artdeco-card",
      ];
      selectors.forEach((selector) => {
        document.querySelectorAll(selector).forEach((element) => {
          element.style.width = "100%";
          element.style.maxWidth = "100%";
          element.style.marginLeft = "0";
          element.style.marginRight = "0";
        });
      });
      document.body.style.background = "#fff";
      document.body.style.overflowX = "hidden";
    },
  };
  app.init();
})();
