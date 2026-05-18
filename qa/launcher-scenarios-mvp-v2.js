(() => {
  const users = {
    owners: ["baranov"],
    editors: ["editor1", "editor2"],
  };

  const access = {
    owner: ["proofreadLongread", "proofreadNews", "revision", "fix", "author"],
    editor: ["proofreadLongread", "proofreadNews", "revision"],
    author: ["author"],
  };

  const tools = {
    cleanup: { title: "Cleanup" },
    toc: { title: "TOC" },
    lead: { title: "Lead" },
    schedule: { title: "Schedule" },
    publish: { title: "Publish" },
    reader: { title: "Reader" },
    editor: { title: "Editor" },
    diff: { title: "Diff" },
    locator: { title: "Locator" },
    update: { title: "Update" },
    readmore: { title: "Readmore" },
  };

  const scenarios = {
    proofreadLongread: {
      title: "Вычитка: лонгрид",
      surfaces: ["adminPost"],
      tools: [
        "cleanup",
        "toc",
        "lead",
        "schedule",
        "publish",
        "reader",
        "editor",
      ],
    },

    proofreadNews: {
      title: "Вычитка: новость",
      surfaces: ["adminPost"],
      tools: ["cleanup", "lead", "update", "publish", "reader", "editor"],
    },

    revision: {
      title: "Ревизия",
      surfaces: ["adminPost"],
      tools: ["diff", "reader"],
    },

    fix: {
      title: "Поправка",
      surfaces: ["adminPost"],
      tools: ["locator", "update", "publish", "reader", "editor"],
    },

    author: {
      title: "Автор",
      surfaces: ["adminPost"],
      tools: ["readmore", "toc", "update", "publish"],
    },

    publicRead: {
      title: "Статья",
      surfaces: ["publicArticle"],
      tools: ["reader", "locator"],
    },
  };

  const surface = {
    get() {
      if (
        document.body.classList.contains("wp-admin") &&
        document.querySelector("#content")
      ) {
        return "adminPost";
      }

      if (
        location.hostname.endsWith("onliner.by") &&
        document.querySelector("article")
      ) {
        return "publicArticle";
      }

      if (location.hostname.endsWith("onliner.by")) {
        return "publicPage";
      }

      return "unsupported";
    },
  };

  const account = {
    get() {
      return document
        .querySelector("#wp-admin-bar-user-info .username")
        ?.textContent?.trim()
        ?.replace(/^@/, "");
    },
  };

  const profile = {
    get(username) {
      if (users.owners.includes(username)) return "owner";
      if (users.editors.includes(username)) return "editor";
      return "author";
    },
  };

  const launcher = {
    getScenarios(role, currentSurface) {
      return access[role]
        .map((key) => scenarios[key])
        .filter(Boolean)
        .filter((scenario) => scenario.surfaces.includes(currentSurface));
    },

    render(role, currentSurface, availableScenarios) {
      const panel = document.createElement("div");

      panel.style.position = "fixed";
      panel.style.top = "16px";
      panel.style.right = "16px";
      panel.style.zIndex = "999999";
      panel.style.padding = "12px";
      panel.style.background = "#111";
      panel.style.color = "#fff";
      panel.style.font = "13px sans-serif";
      panel.style.borderRadius = "12px";
      panel.style.maxWidth = "320px";

      if (currentSurface === "unsupported") {
        panel.textContent = "Unsupported page";
        document.body.append(panel);
        return;
      }

      panel.innerHTML = [
        `<div><strong>${role}</strong></div>`,
        `<div>${currentSurface}</div>`,
        ...availableScenarios.map((scenario) => {
          const items = scenario.tools
            .map((key) => tools[key]?.title)
            .filter(Boolean)
            .join(" · ");

          return `
            <div style="margin-top:12px">
              <strong>${scenario.title}</strong>
              <div>${items}</div>
            </div>
          `;
        }),
      ].join("");

      document.body.append(panel);
    },

    run() {
      const username = account.get();
      const role = profile.get(username);
      const currentSurface = surface.get();
      const availableScenarios = launcher.getScenarios(role, currentSurface);

      launcher.render(role, currentSurface, availableScenarios);
    },
  };

  launcher.run();
})();
