export const createSnapshot = (api, file) => {
  const snapshot = {
    pad(value, length = 2) {
      return String(value).padStart(length, "0");
    },
    stamp(date = new Date()) {
      return [
        date.getFullYear(),
        snapshot.pad(date.getMonth() + 1),
        snapshot.pad(date.getDate()),
        "_",
        snapshot.pad(date.getHours()),
        snapshot.pad(date.getMinutes()),
        snapshot.pad(date.getSeconds()),
      ].join("");
    },
    name(date = new Date()) {
      const post = document.querySelector("[data-post-id]")?.getAttribute("data-post-id") || "";
      return `onliner-snapshot${post ? `-${post}` : ""}-${snapshot.stamp(date)}.html`;
    },
    html() {
      return document.documentElement.outerHTML;
    },
    save(value) {
      file.downloadBlob(
        snapshot.name(),
        new Blob([value], { type: "text/html;charset=utf-8" }),
      );
      return true;
    },
    run() {
      try {
        return [snapshot.html, snapshot.save].reduce((value, fn) => fn(value), undefined);
      } catch (error) {
        console.error("[Launchpad Snapshot]", error);
        return false;
      }
    },
  };
  return { snapshot };
};
