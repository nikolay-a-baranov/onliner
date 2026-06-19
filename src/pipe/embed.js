export const contentEmbed = {
  url: {
    parse(value) {
      try {
        return new URL(String(value || "").trim());
      } catch {
        return null;
      }
    },
    clean(value) {
      const clean = new URL(value.toString());
      clean.search = "";
      clean.hash = "";
      return clean.toString();
    },
    link(value = "") {
      const parsed = contentEmbed.url.parse(
        String(value).replace(/&amp;/gi, "&"),
      );
      if (!parsed) return "";
      return contentEmbed.url.clean(parsed);
    },
  },
  template: {
    instagram(value) {
      return `[instagram]\n<blockquote class="instagram-media" data-instgrm-version="14" data-instgrm-permalink="${value}"><a href="${value}">Instagram</a></blockquote>\n[/instagram]`;
    },
    threads(value) {
      return `[threads]\n<blockquote class="text-post-media" data-text-post-version="0" data-text-post-permalink="${value}"><a href="${value}">Threads</a></blockquote>\n[/threads]`;
    },
    tiktok(value) {
      const match = value.match(/\/video\/(\d+)/);
      if (!match) return "";
      return `[tiktok]\n<blockquote class="tiktok-embed" data-video-id="${match[1]}" cite="${value}"><section>TikTok</section></blockquote>\n[/tiktok]`;
    },
    tweet(value) {
      return `[tweet]\n<blockquote class="twitter-tweet"><a href="${value}">X</a></blockquote>\n[/tweet]`;
    },
    telegram(value) {
      const path = value.replace(/^https?:\/\/t\.me\//, "").replace(/^s\//, "");
      return `[telegram]${path}[/telegram]`;
    },
  },
  service: {
    get(value) {
      const host = value.hostname.replace(/^www\./, "");
      if (host === "instagram.com") return contentEmbed.template.instagram;
      if (host === "threads.com" || host === "threads.net") {
        return contentEmbed.template.threads;
      }
      if (host === "tiktok.com") return contentEmbed.template.tiktok;
      if (host === "x.com" || host === "twitter.com") {
        return contentEmbed.template.tweet;
      }
      if (host === "t.me") return contentEmbed.template.telegram;
      return null;
    },
  },
  build(value) {
    const parsedUrl = contentEmbed.url.parse(value);
    if (!parsedUrl) return "";
    const cleanUrl = contentEmbed.url.clean(parsedUrl);
    const builder = contentEmbed.service.get(parsedUrl);
    if (!builder) return "";
    return builder(cleanUrl);
  },
  normalize: {
    video(value) {
      return value.replace(/\[video\][\s\S]*?\[\/video\]/gi, (full) => {
        const link = full.match(
          /src="([^"]*youtube\.com\/embed\/[^"]*)"/i,
        )?.[1];
        const clean = contentEmbed.url.link(link);
        if (!clean) return full;
        const match = clean.match(/youtube\.com\/embed\/([^/?#&"]+)/i);
        if (!match) return full;
        return full.replace(
          /src="[^"]*youtube\.com\/embed\/[^"]*"/i,
          `src="https://www.youtube.com/embed/${match[1]}"`,
        );
      });
    },
    duplicatedClosing(value) {
      return value.replace(
        /(\[\/(instagram|threads|telegram|tiktok|tweet)\])(\s*\[\/\2\])+/g,
        "$1",
      );
    },
    instagram(value) {
      return value.replace(/\[instagram\][\s\S]*?\[\/instagram\]/gi, (full) => {
        const link =
          full.match(/data-instgrm-permalink="([^"]+)"/i)?.[1] ||
          full.match(/href="([^"]*instagram\.com[^"]*)"/i)?.[1];
        const clean = contentEmbed.url.link(link);
        if (!clean) return full;
        return contentEmbed.template.instagram(clean);
      });
    },
    threads(value) {
      return value.replace(/\[threads\][\s\S]*?\[\/threads\]/gi, (full) => {
        const link =
          full.match(/data-text-post-permalink="([^"]+)"/i)?.[1] ||
          full.match(/href="([^"]*threads\.(com|net)[^"]*)"/i)?.[1];
        const clean = contentEmbed.url.link(link);
        if (!clean) return full;
        return contentEmbed.template.threads(clean);
      });
    },
    tweet(value) {
      return value.replace(/\[tweet\][\s\S]*?\[\/tweet\]/gi, (full) => {
        const link = full.match(
          /href="([^"]*(x\.com|twitter\.com)[^"]*)"/i,
        )?.[1];
        const clean = contentEmbed.url.link(link);
        if (!clean) return full;
        return contentEmbed.template.tweet(clean);
      });
    },
    tiktok(value) {
      return value.replace(/\[tiktok\][\s\S]*?\[\/tiktok\]/gi, (full) => {
        const link =
          full.match(/cite="([^"]+)"/i)?.[1] ||
          full.match(/href="([^"]*tiktok\.com[^"]*)"/i)?.[1] ||
          full.match(/https?:\/\/(?:www\.)?tiktok\.com\/[^\s"'<>]+/i)?.[0];
        const clean = contentEmbed.url.link(link);
        if (!clean) return full;
        return contentEmbed.template.tiktok(clean) || full;
      });
    },
    run(value) {
      return [
        contentEmbed.normalize.video,
        contentEmbed.normalize.duplicatedClosing,
        contentEmbed.normalize.instagram,
        contentEmbed.normalize.threads,
        contentEmbed.normalize.tweet,
        contentEmbed.normalize.tiktok,
      ].reduce((state, step) => step(state), value);
    },
  },
};
