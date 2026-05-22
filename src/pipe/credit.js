export const credit = {
  name: /[A-ZА-ЯЁ][A-Za-zА-Яа-яЁё-]+(?:\s+[A-ZА-ЯЁ][A-Za-zА-Яа-яЁё-]+){1,2}/,

  markers: {
    art: /^(.*?)(?:\s*,\s*|\s+)(иллюстрац(?:ия|ии)|коллаж|обложка)\s*[:—-]?\s*(.+)$/i,
    photo: /^(.*?)(?:\s*,\s*|\s+)(фото)\s*[:—-]?\s*(.+)$/i,
    video: /^(.*?)(?:\s*,\s*|\s+)(видео)\s*[:—-]?\s*(.+)$/i,
  },

  clean(value) {
    return String(value || "")
      .trim()
      .replace(/\s+/g, " ")
      .replace(/[.,;:\s]+$/g, "");
  },

  role(label, value) {
    const map = {
      коллаж: "Коллаж",
      иллюстрация: "Иллюстрация",
      иллюстрации: "Иллюстрации",
    };
    const head = map[label.toLowerCase()] || label;
    const tail = this.clean(value);
    return tail ? `${head}: ${tail}` : "";
  },

  splitExplicit(source) {
    const string = this.clean(source);
    if (!string) return null;

    const photo = string.match(this.markers.photo);
    if (photo) {
      const next = {
        source: this.clean(photo[1]),
        photo: this.clean(photo[3]),
      };
      return next.source && next.photo ? next : null;
    }

    const art = string.match(this.markers.art);
    if (art) {
      const next = {
        source: this.clean(art[1]),
        photo: this.role(art[2], art[3]),
      };
      return next.source && next.photo ? next : null;
    }

    return null;
  },

  splitImplicit(source) {
    const string = this.clean(source);
    if (!string) return null;

    const match = string.match(
      new RegExp(`^(${this.name.source})([.,;:]\\s*.+)$`),
    );
    if (!match) return null;

    const next = {
      source: this.clean(match[1]),
      photo: this.clean(match[2].replace(/^[.,;:]\s*/, "")),
    };

    return next.source && next.photo ? next : null;
  },

  split(source) {
    return this.splitExplicit(source) || this.splitImplicit(source);
  },

  merge(current, next) {
    const left = this.clean(current);
    const right = this.clean(next);
    if (!left) return right;
    if (!right || left === right) return left;
    return `${right}. ${left}`;
  },

  normalize(source, photo, video = "") {
    const current = {
      source: this.clean(source),
      photo: this.clean(photo),
      video: this.clean(video),
    };

    const split = this.split(current.source);
    if (!split) {
      return {
        ...current,
        changed:
          current.source !== String(source || "").trim() ||
          current.photo !== String(photo || "").trim() ||
          current.video !== String(video || "").trim(),
      };
    }

    const next = {
      source: split.source,
      photo: this.merge(current.photo, split.photo),
      video: current.video,
    };

    return {
      ...next,
      changed:
        next.source !== String(source || "").trim() ||
        next.photo !== String(photo || "").trim() ||
        next.video !== String(video || "").trim(),
    };
  },
};
