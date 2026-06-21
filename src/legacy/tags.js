import { cms } from "./core/cms.js";
import { tag } from "./tag.js";

(() => {
  const input = tag.input();
  const current = tag.get();
  const targets = tag.invalid();
  if (!targets.length) {
    alert("✅ Метки норм");
    return;
  }
  const planned = targets
    .map((name) => `${name} → ${tag.upper(name)}`)
    .join("\n");

  if (!confirm(`Поменять метки?\n\n${planned}`)) {
    return;
  }
  cms.vpn
    .ensure("⚠️ VPN")
    .then(async () => {
      const results = [];
      for (const name of targets) {
        results.push(await tag.rename(name));
      }
      tag.apply(input, current, results);
      const report = tag.report(results);
      if (report.ok.length) {
        const openTabs = confirm(
          `${report.message}\n\nОткрыть обновлённые метки?`,
        );
        if (openTabs) {
          report.ok.forEach((result) => {
            window.open(tag.page(result.next), "_blank");
          });
        }
        setTimeout(() => location.reload(), 300);
        return;
      }
      alert(report.message);
    })
    .catch((error) => {
      alert(error.message);
    });
})();
