const tabs = await (await fetch("http://127.0.0.1:9233/json/list")).json();
const tab = tabs.find((item) => item.type === "page" && item.url.includes("/sandbox/"));
const socket = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((resolve) => {
  socket.onopen = resolve;
});
let sequence = 0;
const call = (method, params = {}) => new Promise((resolve, reject) => {
  const id = ++sequence;
  socket.send(JSON.stringify({ id, method, params }));
  const handle = (event) => {
    const message = JSON.parse(event.data);
    if (message.id !== id) return;
    socket.removeEventListener("message", handle);
    if (message.error) reject(message.error);
    else resolve(message.result);
  };
  socket.addEventListener("message", handle);
});
const expression = `(async () => {
  const wait = (delay) => new Promise((resolve) => setTimeout(resolve, delay));
  const content = document.querySelector("#content");
  const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value").set;
  setter.call(content, "<p>Первый абзац для проверки геометрии.</p><p>Второй.</p>");
  content.dispatchEvent(new Event("input", { bubbles: true }));
  [...document.querySelectorAll("button")].find((button) => button.title === "Чтение")?.click();
  await wait(900);
  [...document.querySelectorAll('[data-action="group"]')].find((button) => button.title === "Поля")?.click();
  await wait(150);
  [...document.querySelectorAll('[data-action="tool"]')].find((button) => button.title === "Лид")?.click();
  await wait(180);
  const results = [];
  for (let index = 0; index < 4; index += 1) {
    const root = document.querySelector("[data-admin-stack]");
    const head = root?.querySelector("[data-admin-stack-head]");
    const rect = (node) => node ? {
      left: Math.round(node.getBoundingClientRect().left * 10) / 10,
      width: Math.round(node.getBoundingClientRect().width * 10) / 10,
    } : null;
    const apply = root?.querySelector(".admin-fields-apply-slot");
    results.push({
      kind: root?.dataset.adminStack || "",
      mode: root?.dataset.headMode || "",
      head: rect(head),
      marker: rect(head?.firstElementChild),
      main: rect(root?.querySelector(".admin-stack-main")),
      counter: rect(root?.querySelector(".admin-stack-counter")),
      apply: rect(apply),
      applyPosition: apply ? getComputedStyle(apply).position : "",
      system: rect(head?.lastElementChild),
    });
    root?.querySelector('[data-action$="-marker"]')?.click();
    await wait(180);
  }
  return JSON.stringify(results);
})()`;
const result = await call("Runtime.evaluate", {
  expression,
  returnByValue: true,
  awaitPromise: true,
});
console.log(result.exceptionDetails?.exception?.description || result.result.value);
socket.close();
