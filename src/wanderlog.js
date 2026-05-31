(() => {
  const app = {
    report: [],
    syncEmail: "",
    async init() {
      this.closeImportedNotices();
      await this.prepareSyncEmail();
      this.closeImportedNotices();
      this.closePanels();
      this.renameSections();
      this.createCompassSection();
      await this.wait(300);
      this.collapseSections();
      await this.wait(700);
      this.closeImportedNotices();
      this.showReport();
    },
    wait(delay) {
      return new Promise((resolve) => setTimeout(resolve, delay));
    },
    getText(element) {
      return (
        element?.innerText ||
        element?.textContent ||
        element?.value ||
        element?.getAttribute("aria-label") ||
        ""
      ).trim();
    },
    getClickables() {
      return [
        ...document.querySelectorAll(
          "button, [role='button'], [role='menuitem'], a",
        ),
      ];
    },
    findClickable(text) {
      const items = this.getClickables();
      return (
        items.find((item) => this.getText(item) === text) ||
        items.find((item) => this.getText(item).includes(text))
      );
    },
    click(element) {
      if (!element) {
        return false;
      }
      element.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
      element.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
      element.click();
      return true;
    },
    async clickText(text, delay = 250) {
      const element = this.findClickable(text);
      const clicked = this.click(element);
      await this.wait(delay);
      return clicked;
    },
    async prepareSyncEmail() {
      const opened = await this.clickText("Reservations and attachments", 350);
      if (!opened && this.getSyncEmail()) {
        this.copySyncEmail();
        return;
      }
      await this.clickText("Other", 300);
      await this.clickText("Lodging", 300);
      await this.clickText("Forward email", 500);
      this.copySyncEmail();
      this.closeModal();
      await this.wait(300);
    },
    copySyncEmail() {
      this.syncEmail = this.getSyncEmail();
      if (!this.syncEmail) {
        this.report.push("Email для пересылки не найден.");
        return;
      }
      navigator.clipboard?.writeText(this.syncEmail).catch(() => {});
      this.report.push(`Email скопирован: ${this.syncEmail}`);
    },
    getPageEmails() {
      const text = document.body?.innerText || "";
      const emails =
        text.match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi) || [];
      return [...new Set(emails)];
    },
    getSyncEmail() {
      const element = document.querySelector(".CopyEmailButton__email");
      const text = this.getText(element);
      const match = text.match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i);
      const emails = this.getPageEmails();
      return (
        match?.[0] ||
        emails.find((email) => /^trip\+\d+@wanderlog\.com$/i.test(email)) ||
        ""
      );
    },

    getSectionByTitle(titles) {
      const input = this.getHeaderInputs().find((input) =>
        titles.includes(input.value.trim()),
      );
      return input?.closest(".SectionComponent") || null;
    },

    getNotesEditor() {
      const section = this.getSectionByTitle(["Notes", "📋"]);
      return section?.querySelector(".ql-editor") || null;
    },

    saveSyncEmailToNotes() {
      if (!this.syncEmail) {
        return;
      }
      const editor = this.getNotesEditor();
      if (!editor) {
        this.report.push("Поле Notes для email не найдено.");
        return;
      }
      const line = `Wanderlog import email: ${this.syncEmail}`;
      const current = editor.innerText.trim();
      if (current.includes(this.syncEmail)) {
        this.report.push("Email уже есть в Notes.");
        return;
      }
      const text = current ? `${current}\n${line}` : line;
      editor.focus();
      editor.innerHTML = text
        .split("\n")
        .map((part) => `<p>${this.escapeHtml(part)}</p>`)
        .join("");
      editor.dispatchEvent(
        new InputEvent("input", {
          bubbles: true,
          inputType: "insertText",
          data: line,
        }),
      );
      editor.dispatchEvent(new Event("change", { bubbles: true }));
      this.report.push("Email добавлен в Notes.");
    },

    escapeHtml(text) {
      return text.replace(
        /[&<>"']/g,
        (symbol) =>
          ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;",
          })[symbol],
      );
    },

    closeModal() {
      document.dispatchEvent(
        new KeyboardEvent("keydown", { bubbles: true, key: "Escape" }),
      );
      ["Close", "Done", "Cancel"].some((label) =>
        this.click(this.findClickable(label)),
      );
    },
    closePanels() {
      const labels = [
        "Close",
        "Dismiss",
        "Not now",
        "Maybe later",
        "No thanks",
      ];
      this.getClickables().forEach((button) => {
        const text = this.getText(button);
        const label = button.getAttribute("aria-label") || "";
        if (labels.includes(text) || labels.includes(label)) {
          this.click(button);
        }
      });
      this.report.push("Лишние панели закрыты.");
    },
    closeImportedNotices() {
      const icons = [
        ...document.querySelectorAll('svg[data-icon="thumbs-up"]'),
      ];
      let count = 0;
      icons.forEach((icon) => {
        const card = icon.closest(
          ".ReservationItemView, .ComponentBreakpoints__container, .d-flex",
        );
        const text = this.getText(card);
        const button = icon.closest("button");
        if (/Successfully imported/i.test(text) && this.click(button)) {
          count += 1;
        }
      });
      if (count) {
        this.report.push(`Закрыто imported-сообщений: ${count}`);
      }
    },
    getHeaderInputs() {
      return [
        ...document.querySelectorAll("input.SectionComponentHeader__input"),
      ];
    },
    setInput(input, value) {
      if (!input || input.value.trim() === value) {
        return false;
      }
      const setter = Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        "value",
      )?.set;
      input.focus();
      setter.call(input, value);
      input.dispatchEvent(
        new InputEvent("input", {
          bubbles: true,
          inputType: "insertText",
          data: value,
        }),
      );
      input.dispatchEvent(new Event("change", { bubbles: true }));
      input.dispatchEvent(
        new KeyboardEvent("keydown", { bubbles: true, key: "Enter" }),
      );
      input.blur();
      return true;
    },
    renameSections() {
      const names = {
        Notes: "📋",
        "Places to visit": "📍",
        Рейсы: "✈️",
        Flights: "✈️",
        "Hotels and lodging": "🛌",
        "Отели и проживание": "🛌",
        Lodging: "🛌",
        "Rental cars": "🚘",
        "Rental car": "🚘",
      };
      let count = 0;
      this.getHeaderInputs().forEach((input) => {
        const value = input.value.trim();
        if (names[value] && this.setInput(input, names[value])) {
          count += 1;
        }
      });
      this.report.push(`Переименовано разделов: ${count}`);
    },
    createCompassSection() {
      const inputs = this.getHeaderInputs();
      const exists = inputs.some((input) => input.value.trim() === "🧭");
      const empty = inputs.find((input) => input.value.trim() === "");
      if (exists) {
        this.report.push("Раздел 🧭 уже есть.");
        return;
      }
      if (!empty) {
        this.report.push("Пустой раздел для 🧭 не найден.");
        return;
      }
      this.setInput(empty, "🧭");
      this.report.push("Раздел 🧭 создан.");
    },
    collapseSections() {
      const direct = this.findClickable("Collapse all sections");
      if (this.click(direct)) {
        this.report.push("Разделы свернуты.");
        return;
      }
      this.click(this.findClickable("Trip settings"));
      setTimeout(() => {
        if (this.click(this.findClickable("Collapse all sections"))) {
          this.report.push("Разделы свернуты через меню.");
        }
      }, 250);
    },
    showReport() {
      alert(this.report.join("\n"));
    },
  };
  app.init();
})();
