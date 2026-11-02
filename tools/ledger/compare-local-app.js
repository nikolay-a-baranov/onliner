import { ledgerCompare2027 } from "./compare-2027.js";
import { ledgerGroup } from "./group.js";
import { ledgerPayroll } from "./payroll.js";

const state = { index: [], data: null, profile: null, period: "", pace: 100, assignments: {}, result: null };
const sectionNames = { people: "Люди", sport: "Спорт", money: "Кошелёк", auto: "Авто", tech: "Течь", realt: "Недвига" };
const ownerNames = { nikolai: "Николай", "other-duty": "Другой дежурный", unknown: "Не назначено" };

const html = {
  escape(value) {
    return String(value ?? "").replace(/[&<>\"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[char]));
  },
  number(value) {
    return Number.isFinite(Number(value)) ? Number(value).toLocaleString("ru-RU", { maximumFractionDigits: 1 }) : "—";
  },
  money(value) {
    return Number.isFinite(Number(value)) ? `${Math.round(Number(value)).toLocaleString("ru-RU")} р.` : "—";
  },
  duration(value) {
    if (!Number.isFinite(Number(value))) return "нет данных";
    const minutes = Math.round(Number(value));
    return minutes < 60 ? `${minutes} мин` : `${Math.floor(minutes / 60)} ч ${minutes % 60} мин`;
  },
  finish(value) {
    if (!Number.isFinite(Number(value))) return "—";
    const total = 18 * 60 + Math.round(Number(value));
    const day = Math.floor(total / 1440);
    const clock = `${String(Math.floor(total % 1440 / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
    return day ? `${clock} (+${day} д.)` : clock;
  },
  ratio(amount, minutes) {
    if (!Number.isFinite(Number(amount)) || !Number.isFinite(Number(minutes)) || Number(minutes) <= 0) return "—";
    return `${html.money(Number(amount) / (Number(minutes) / 60))}/ч`;
  },
  date(value = "") {
    const match = String(value).match(/^\d{4}-(\d{2})-(\d{2})$/);
    return match ? `${Number(match[2])}.${Number(match[1])}` : value;
  },
  rows(items = []) {
    if (!items.length) return `<span class="muted">нет записей</span>`;
    return `<ul class="records">${items.map((item) => `<li><span>${html.escape(sectionNames[item.section] || item.section)}</span><strong>${html.escape(item.title || item.id)}</strong><small>#${html.escape(item.id)} · ${html.number(item.words)} слов · ${html.escape(item.classification || "без классификации")}${item.owner ? ` · ${html.escape(ownerNames[item.owner] || item.owner)}` : ""}${item.workEvening ? ` · вечер ${html.escape(html.date(item.workEvening))}` : ""}${item.workTiming === "uncertain-weekend" ? " · время не подтверждено" : ""}</small></li>`).join("")}</ul>`;
  },
  stat(label, value, note = "") {
    return `<div class="stat"><span>${html.escape(label)}</span><strong>${html.escape(value)}</strong>${note ? `<small>${html.escape(note)}</small>` : ""}</div>`;
  },
};

const source = {
  allowed() {
    const host = location.hostname.toLowerCase();
    return host === "localhost" || host === "127.0.0.1" || host.endsWith(".local");
  },
  url(value = "") {
    return new URL(value, location.href);
  },
  async index() {
    const response = await fetch(source.url("../../local-data/ledger/index.json"));
    if (!response.ok) throw new Error("Не загрузился локальный индекс Ledger.");
    const data = await response.json();
    state.index = (Array.isArray(data.datasets) ? data.datasets : []).filter((item) => /^2026\d{2}$/.test(String(item.period || "")));
    if (!state.index.length) throw new Error("В локальном индексе нет месяцев 2026 года.");
  },
  async profile() {
    const response = await fetch(source.url("../../local-data/payroll/nb.json"));
    if (!response.ok) return null;
    return response.json();
  },
  async month(period = "") {
    const entry = state.index.find((item) => item.period === period);
    if (!entry) throw new Error(`Нет источника за ${period}.`);
    const response = await fetch(source.url(`../../local-data/ledger/${entry.file}`));
    if (!response.ok) throw new Error(`Не загрузился ${entry.file}.`);
    return response.json();
  },
};

const calculation = {
  actual(data = {}, rows = []) {
    if (!state.profile) return null;
    let overrides = {};
    try {
      overrides = JSON.parse(localStorage.getItem(`onliner-ledger-payroll:nb:${data.period}`) || "{}");
    } catch {
      overrides = {};
    }
    return ledgerPayroll.calculate({ rows, period: data.period, proofreaderId: "nb", profile: state.profile, overrides });
  },
  run() {
    const selected = ledgerGroup.select(state.data, "nb");
    state.result = ledgerCompare2027.compare.get({
      data: state.data,
      actualRows: selected.rows,
      actualPayment: calculation.actual(state.data, selected.rows),
      assignments: state.assignments,
      pace: state.pace,
    });
    render.all();
  },
};

const render = {
  warning() {
    const result = state.result;
    const values = [];
    if (!result.coverage.complete) values.push(`Неполное покрытие источника: ${result.coverage.missing.map((item) => sectionNames[item] || item).join(", ") || "ошибки сбора"}. Сценарная база не подтверждена.`);
    values.push("Фактическая оплата рассчитана локальным профилем и его сохранёнными поправками; это не канонический платёжный ledger.");
    values.push("18:00 и D−1 — сценарные предположения. Время завершения не является наблюдаемым рабочим временем.");
    byId("warnings").innerHTML = values.map((value) => `<div class="warning">${html.escape(value)}</div>`).join("");
  },
  controls() {
    byId("month").innerHTML = state.index.map((item) => `<option value="${item.period}">${item.period.slice(4)} · ${item.period.slice(0, 4)}</option>`).join("");
    byId("month").value = state.period;
    byId("pace").value = String(state.pace);
  },
  rota() {
    const pairs = state.result.rota.pairs;
    byId("rota").innerHTML = pairs.map((item) => `<label class="rota-item"><span>${html.escape(html.date(item.sunday))}–${html.escape(html.date(item.monday))}${item.boundary ? " · граница месяца" : ""}</span><select data-duty="${item.key}"><option value="unknown">Не назначено</option><option value="nikolai">Николай</option><option value="other">Другой корректор</option></select></label>`).join("");
    byId("rota").querySelectorAll("[data-duty]").forEach((select) => { select.value = state.assignments[select.dataset.duty] || "unknown"; });
  },
  actual() {
    const value = state.result.actual;
    const amount = value.payment?.totals?.amount;
    byId("actual").innerHTML = `<h2>Факт · 2026</h2><div class="stats">${html.stat("Лонгриды", html.number(value.summary.count))}${html.stat("Слова", html.number(value.summary.words))}${html.stat("Чтение", html.duration(value.summary.estimatedReadingMinutes), "оценка, не замер")}${html.stat("Оплата", html.money(amount), value.paymentStatus === "missing" ? "нет источника" : "локальный расчёт")}${html.stat("Оплата / оценочный час", html.ratio(amount, value.summary.estimatedReadingMinutes), "не фактическая ставка часа")}</div>${render.actualPayment(value.payment)}`;
  },
  actualPayment(value) {
    if (!value) return `<p class="muted">Платёжный источник отсутствует.</p>`;
    return `<div class="breakdown">${value.lines.map((item) => `<span>${html.escape(item.label)} · ${html.money(item.amount)}</span>`).join("")}</div>`;
  },
  scenario() {
    const value = state.result.scenario;
    const payment = value.payment;
    const sections = Object.entries(value.summary.bySection).map(([section, count]) => `<span>${html.escape(sectionNames[section] || section)} · ${count}</span>`).join("");
    byId("scenario").innerHTML = `<h2>Модель · 2027</h2><div class="stats">${html.stat("Назначенные лонгриды", html.number(value.summary.count))}${html.stat("Слова", html.number(value.summary.words))}${html.stat("Чтение", html.duration(value.summary.estimatedReadingMinutes), "при заданной скорости")}${html.stat("В активный день", html.number(value.summary.averagePerDay), `максимум ${value.summary.maximumPerDay}`)}${html.stat("Идеальное завершение", html.finish(value.summary.estimatedReadingMinutes), "всё готово в 18:00, без пауз и QA")}${html.stat("Подтверждено", html.money(payment.confirmed))}${html.stat("Оплата / оценочный час", html.ratio(payment.confirmed, value.summary.estimatedReadingMinutes), "сценарный показатель")}</div><div class="breakdown">${sections}${payment.events.map((item) => `<span>${html.escape(item.key === "base" ? "База" : "Дежурство")} · ${html.money(item.amount)} · ${html.escape(item.status)}</span>`).join("")}<span>Трафик · 0 р.</span><span>Иллюстрация: ${payment.illustrative.map(html.money).join(" / ")}</span></div><div class="unknowns">${payment.unknowns.map((item) => `<span>${html.escape(item)}</span>`).join("")}${payment.candidates.map((item) => `<span>${html.escape(item.reason)} · #${html.escape(item.id)}</span>`).join("")}</div>`;
  },
  calendar() {
    byId("calendar").innerHTML = state.result.days.map((day) => {
      const empty = !day.actual.length && !day.assigned.length && !day.conditional.length;
      const duplicates = day.duplicates.map((item) => `${sectionNames[item.section] || item.section} ×${item.count}`).join(", ");
      return `<tr><td>${html.escape(html.date(day.date))}</td><td>${day.actual.length}</td><td>${day.assigned.length}</td><td>${day.conditional.length}</td><td>${empty ? `<span class="muted">нет опубликованных лонгридов в выборках</span>` : `<details><summary>Показать${duplicates ? ` · несколько в разделе: ${html.escape(duplicates)}` : ""}</summary><h4>Факт</h4>${html.rows(day.actual)}<h4>Модель · Николай</h4>${html.rows(day.assigned)}<h4>Модель · не назначено</h4>${html.rows(day.conditional)}</details>`}</td></tr>`;
    }).join("");
  },
  coverage() {
    byId("coverage").innerHTML = Object.entries(state.result.coverage.counts).map(([section, count]) => `<span data-missing="${state.result.coverage.missing.includes(section)}">${html.escape(sectionNames[section] || section)} · ${count}</span>`).join("");
  },
  all() {
    render.warning();
    render.controls();
    render.rota();
    render.coverage();
    render.actual();
    render.scenario();
    render.calendar();
  },
};

const file = {
  export() {
    const content = JSON.stringify(state.result, null, 2);
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([content], { type: "application/json;charset=utf-8" }));
    link.download = `nikolai-2026-vs-2027-${state.period}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 0);
  },
};

const byId = (id) => document.getElementById(id);
const app = {
  async load(period = "") {
    state.period = period;
    state.assignments = {};
    state.data = await source.month(period);
    calculation.run();
  },
  events() {
    byId("month").addEventListener("change", (event) => void app.load(event.target.value));
    byId("pace").addEventListener("change", (event) => {
      state.pace = Math.max(1, Number(event.target.value) || ledgerCompare2027.policy.wordsPerMinute);
      calculation.run();
    });
    byId("rota").addEventListener("change", (event) => {
      const key = event.target.dataset.duty;
      if (!key) return;
      state.assignments = { ...state.assignments, [key]: event.target.value };
      calculation.run();
    });
    byId("export").addEventListener("click", file.export);
  },
  async start() {
    if (!source.allowed()) throw new Error("Страница доступна только в локальном окружении.");
    await source.index();
    state.profile = await source.profile();
    app.events();
    await app.load(state.index.at(-1).period);
  },
};

app.start().catch((error) => { byId("app").innerHTML = `<div class="fatal">${html.escape(error.message)}</div>`; });
