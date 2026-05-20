export function renderAppHtml(): string {
  return `<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <meta name="theme-color" content="#f7faf8" />
  <title>Санталь Смена</title>
  <script src="https://telegram.org/js/telegram-web-app.js"></script>
  <style>
    @import url("https://fonts.googleapis.com/css2?family=Onest:wght@400;500;600;700;800&display=swap");
    :root {
      --bg: #f7faf8;
      --surface: #ffffff;
      --surface-2: #eef6f1;
      --text: #1e2824;
      --muted: #7a8580;
      --line: rgba(31, 122, 90, 0.14);
      --primary: #1f7a5a;
      --primary-2: #dff3ea;
      --urgent: #f26d5b;
      --warning: #f4b24d;
      --shadow: 0 18px 48px rgba(37, 49, 45, 0.12);
      color-scheme: light;
      font-family: "Onest", "Manrope", "Segoe UI", sans-serif;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      background:
        radial-gradient(circle at 18% -8%, rgba(31, 122, 90, 0.16), transparent 32rem),
        radial-gradient(circle at 95% 8%, rgba(242, 109, 91, 0.12), transparent 24rem),
        var(--bg);
      color: var(--text);
    }
    button, input, select { font: inherit; }
    button { border: 0; cursor: pointer; }
    .app {
      width: min(100%, 520px);
      min-height: 100vh;
      margin: 0 auto;
      padding: calc(env(safe-area-inset-top) + 18px) 18px calc(env(safe-area-inset-bottom) + 172px);
    }
    .topbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 14px;
      margin-bottom: 18px;
    }
    .brand { display: flex; align-items: center; gap: 12px; }
    .brand-mark {
      width: 46px;
      height: 46px;
      border-radius: 16px;
      display: grid;
      place-items: center;
      background: linear-gradient(145deg, #1f7a5a, #28b487);
      box-shadow: 0 12px 26px rgba(31, 122, 90, 0.24);
      color: white;
      font-weight: 800;
      letter-spacing: -0.04em;
    }
    .brand h1 { margin: 0; font-size: 26px; line-height: 1; letter-spacing: -0.05em; }
    .brand p { margin: 4px 0 0; color: var(--muted); font-size: 13px; }
    .sync-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 10px;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.76);
      border: 1px solid var(--line);
      color: var(--primary);
      font-size: 12px;
      font-weight: 700;
    }
    .sync-dot {
      width: 8px;
      height: 8px;
      border-radius: 999px;
      background: var(--warning);
    }
    .sync-pill[data-connected="true"] .sync-dot { background: var(--primary); }
    .hero-card {
      border-radius: 34px;
      padding: 24px;
      background: linear-gradient(145deg, #ffffff, #ebf6f0);
      box-shadow: var(--shadow);
      border: 1px solid rgba(255,255,255,0.7);
      overflow: hidden;
      position: relative;
      margin-bottom: 18px;
    }
    .hero-card::after {
      content: "";
      position: absolute;
      right: -44px;
      top: -48px;
      width: 160px;
      height: 160px;
      border-radius: 999px;
      background: rgba(31, 122, 90, 0.12);
    }
    .hero-label { color: var(--muted); font-weight: 600; font-size: 14px; }
    .hero-money { margin-top: 8px; font-size: 44px; line-height: 0.95; font-weight: 800; letter-spacing: -0.07em; }
    .hero-row { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 18px; }
    .metric {
      flex: 1;
      min-width: 132px;
      padding: 13px 14px;
      border-radius: 22px;
      background: rgba(255,255,255,0.72);
      border: 1px solid var(--line);
    }
    .metric span { color: var(--muted); font-size: 12px; font-weight: 600; }
    .metric strong { display: block; margin-top: 5px; font-size: 18px; }
    .date-strip, .chip-row, .stories, .segment-row {
      display: flex;
      gap: 10px;
      overflow-x: auto;
      scrollbar-width: none;
      padding: 2px 1px 12px;
      margin-inline: -1px;
    }
    .date-strip::-webkit-scrollbar, .chip-row::-webkit-scrollbar, .stories::-webkit-scrollbar, .segment-row::-webkit-scrollbar { display: none; }
    .date-chip, .filter-chip, .segment {
      flex: 0 0 auto;
      border-radius: 999px;
      padding: 10px 14px;
      background: var(--surface);
      color: var(--text);
      border: 1px solid var(--line);
      box-shadow: 0 8px 20px rgba(37,49,45,0.06);
      font-weight: 700;
    }
    .date-chip {
      width: 58px;
      height: 72px;
      display: grid;
      place-items: center;
      gap: 4px;
      padding: 8px;
      border-radius: 24px;
    }
    .date-chip span { color: var(--muted); font-size: 12px; text-transform: uppercase; }
    .date-chip strong { font-size: 20px; }
    .date-chip.active, .filter-chip.active, .segment.active {
      background: var(--text);
      color: white;
      border-color: var(--text);
    }
    .date-chip.active span { color: rgba(255,255,255,0.72); }
    .story {
      min-width: 142px;
      min-height: 136px;
      padding: 16px;
      border-radius: 26px;
      background: var(--surface);
      border: 1px solid var(--line);
      box-shadow: 0 10px 28px rgba(37,49,45,0.08);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .story-icon {
      width: 38px;
      height: 38px;
      border-radius: 15px;
      display: grid;
      place-items: center;
      background: var(--primary-2);
      color: var(--primary);
      font-weight: 800;
    }
    .story strong { font-size: 15px; line-height: 1.15; }
    .section-title {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      margin: 18px 0 12px;
    }
    .section-title h2 { margin: 0; font-size: 30px; line-height: 1; letter-spacing: -0.06em; }
    .section-title span { color: var(--muted); font-weight: 700; }
    .shift-card, .list-card, .profile-card {
      width: 100%;
      padding: 18px;
      border-radius: 28px;
      background: rgba(255,255,255,0.88);
      border: 1px solid var(--line);
      box-shadow: 0 12px 34px rgba(37,49,45,0.08);
      margin-bottom: 12px;
      text-align: left;
      color: var(--text);
      position: relative;
      overflow: hidden;
    }
    .shift-card.urgent::before {
      content: "";
      position: absolute;
      left: 0;
      top: 18px;
      bottom: 18px;
      width: 5px;
      border-radius: 999px;
      background: var(--urgent);
    }
    .shift-head {
      display: flex;
      gap: 12px;
      justify-content: space-between;
      align-items: flex-start;
      padding-left: 4px;
    }
    .shift-title { font-size: 19px; font-weight: 800; letter-spacing: -0.03em; line-height: 1.15; }
    .shift-sub { margin-top: 5px; color: var(--muted); font-size: 14px; line-height: 1.35; }
    .pay { color: var(--primary); font-size: 22px; font-weight: 800; white-space: nowrap; }
    .divider { height: 1px; background: rgba(37,49,45,0.1); margin: 14px 0; }
    .shift-foot { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
    .time { font-size: 21px; font-weight: 700; letter-spacing: -0.03em; white-space: nowrap; }
    .caption { color: var(--muted); font-size: 13px; margin-top: 2px; }
    .cta {
      border-radius: 18px;
      padding: 12px 15px;
      background: var(--primary);
      color: white;
      font-weight: 800;
      box-shadow: 0 12px 22px rgba(31, 122, 90, 0.22);
    }
    .cta.secondary { background: var(--primary-2); color: var(--primary); box-shadow: none; }
    .cta.danger { background: rgba(242,109,91,0.12); color: var(--urgent); box-shadow: none; }
    .badge {
      display: inline-flex;
      align-items: center;
      padding: 6px 9px;
      border-radius: 999px;
      background: var(--primary-2);
      color: var(--primary);
      font-size: 12px;
      font-weight: 800;
      margin-top: 10px;
    }
    .badge.urgent { background: rgba(242,109,91,0.14); color: var(--urgent); }
    .board {
      display: grid;
      gap: 10px;
    }
    .board-row {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 10px;
      align-items: center;
      padding: 13px 14px;
      border-radius: 20px;
      background: var(--surface);
      border: 1px solid var(--line);
    }
    .risk { color: var(--urgent); font-weight: 800; }
    .empty {
      padding: 28px 20px;
      border-radius: 28px;
      background: rgba(255,255,255,0.72);
      border: 1px dashed rgba(31,122,90,0.22);
      text-align: center;
      color: var(--muted);
      font-weight: 600;
    }
    .bottom-nav {
      position: fixed;
      left: 50%;
      bottom: calc(env(safe-area-inset-bottom) + 12px);
      transform: translateX(-50%);
      width: min(94vw, 500px);
      padding: 8px;
      border-radius: 28px;
      background: rgba(255,255,255,0.82);
      border: 1px solid rgba(31,122,90,0.16);
      box-shadow: 0 18px 44px rgba(37,49,45,0.18);
      backdrop-filter: blur(18px);
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 4px;
      z-index: 10;
    }
    .nav-btn {
      min-height: 56px;
      border-radius: 21px;
      background: transparent;
      color: var(--muted);
      display: grid;
      place-items: center;
      gap: 2px;
      font-size: 11px;
      font-weight: 700;
    }
    .nav-btn svg { width: 22px; height: 22px; stroke-width: 2.2; }
    .nav-btn.active { background: var(--primary-2); color: var(--primary); }
    .sheet-alert {
      margin: 12px 0;
      padding: 13px 14px;
      border-radius: 20px;
      background: rgba(244,178,77,0.13);
      color: #825610;
      border: 1px solid rgba(244,178,77,0.22);
      font-size: 13px;
      line-height: 1.35;
      font-weight: 600;
    }
    .modal {
      position: fixed;
      inset: 0;
      z-index: 20;
      background: rgba(16, 22, 19, 0.32);
      display: none;
      align-items: flex-end;
    }
    .modal.open { display: flex; }
    .sheet {
      width: min(100%, 520px);
      margin: 0 auto;
      background: var(--surface);
      border-radius: 34px 34px 0 0;
      padding: 20px 18px calc(env(safe-area-inset-bottom) + 24px);
      box-shadow: 0 -18px 54px rgba(37,49,45,0.18);
      max-height: 88vh;
      overflow: auto;
    }
    .grabber {
      width: 44px;
      height: 5px;
      border-radius: 999px;
      background: rgba(37,49,45,0.16);
      margin: 0 auto 18px;
    }
    .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 16px 0; }
    .detail-cell { padding: 13px; border-radius: 18px; background: var(--surface-2); }
    .detail-cell span { display: block; color: var(--muted); font-size: 12px; margin-bottom: 5px; }
    .detail-cell strong { font-size: 16px; }
    .loader {
      min-height: 70vh;
      display: grid;
      place-items: center;
      color: var(--muted);
      font-weight: 700;
    }
    @media (max-width: 380px) {
      .app { padding-inline: 12px; }
      .hero-money { font-size: 38px; }
      .section-title h2 { font-size: 26px; }
      .shift-foot { align-items: flex-start; flex-direction: column; }
      .cta { width: 100%; }
    }
  </style>
</head>
<body>
  <main id="app" class="app"><div class="loader">Загружаем смены...</div></main>
  <nav id="nav" class="bottom-nav"></nav>
  <div id="modal" class="modal" role="dialog" aria-modal="true"></div>
  <script>
    const tg = window.Telegram?.WebApp;
    tg?.ready();
    tg?.expand();

    const icons = {
      search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="11" cy="11" r="7"/><path d="m16.5 16.5 4 4"/></svg>',
      tasks: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M8 6h13"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="m3 6 1 1 2-2"/><path d="m3 12 1 1 2-2"/><path d="m3 18 1 1 2-2"/></svg>',
      money: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="6" width="18" height="12" rx="3"/><path d="M7 10h5"/><path d="M17 14h.01"/></svg>',
      chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M21 12a8 8 0 0 1-8 8H7l-4 2 1.5-4A8 8 0 1 1 21 12Z"/></svg>',
      profile: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="8" r="4"/><path d="M5 21a7 7 0 0 1 14 0"/></svg>'
    };
    const tabs = [
      ["search", "Поиск", icons.search],
      ["mine", "Мои смены", icons.tasks],
      ["money", "Деньги", icons.money],
      ["chat", "Общение", icons.chat],
      ["profile", "Профиль", icons.profile]
    ];
    let app = { view: "search", selectedDate: "all", selectedBranch: "all", data: null, busy: false };

    const fmtMoney = (value) => new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(value || 0) + " ₽";
    const weekday = (date) => new Intl.DateTimeFormat("ru-RU", { weekday: "short" }).format(new Date(date + "T00:00:00"));
    const day = (date) => new Date(date + "T00:00:00").getDate();
    const dateTitle = (date) => new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", weekday: "long" }).format(new Date(date + "T00:00:00"));
    const branchById = (id) => app.data?.state.branches.find((branch) => branch.id === id);
    const shiftPay = (shift) => Math.round(shift.hourlyRate * shift.plannedHours * shift.holidayMultiplier + shift.bonusAmount);

    async function api(path, options = {}) {
      const headers = {
        "Content-Type": "application/json",
        "X-Telegram-Init-Data": tg?.initData || "",
        ...(tg?.initData ? {} : { "X-Demo-Admin-Id": "admin_nikita" }),
        ...(options.headers || {})
      };
      const response = await fetch(path, { ...options, headers });
      const payload = await response.json();
      if (!response.ok) throw Object.assign(new Error(payload.message || "Ошибка запроса"), { payload, status: response.status });
      return payload;
    }

    async function load() {
      try {
        app.data = await api("/api/bootstrap");
        render();
      } catch (error) {
        document.getElementById("app").innerHTML = '<div class="empty">Не удалось загрузить приложение. Обновите страницу или откройте Mini App из Telegram.</div>';
      }
    }

    function render() {
      renderNav();
      const root = document.getElementById("app");
      root.innerHTML = header() + (app.data.state.sync.connected ? "" : '<div class="sheet-alert">' + app.data.state.sync.message + '</div>') + viewHtml();
    }

    function header() {
      const money = app.data.state.money;
      return '<div class="topbar">' +
        '<div class="brand"><div class="brand-mark">S</div><div><h1>Санталь Смена</h1><p>' + esc(app.data.state.admin.fullName) + '</p></div></div>' +
        '<div class="sync-pill" data-connected="' + app.data.state.sync.connected + '"><span class="sync-dot"></span>' + (app.data.state.sync.connected ? "Sheets" : "Демо") + '</div>' +
      '</div>' +
      '<section class="hero-card">' +
        '<div class="hero-label">Ожидаемый доход</div>' +
        '<div class="hero-money">' + fmtMoney(money.expected) + '</div>' +
        '<div class="hero-row">' +
          '<div class="metric"><span>В работе</span><strong>' + fmtMoney(money.pending) + '</strong></div>' +
          '<div class="metric"><span>Начислено</span><strong>' + fmtMoney(money.earned) + '</strong></div>' +
        '</div>' +
      '</section>';
    }

    function viewHtml() {
      if (app.view === "mine") return mineView();
      if (app.view === "money") return moneyView();
      if (app.view === "chat") return chatView();
      if (app.view === "profile") return profileView();
      return searchView();
    }

    function searchView() {
      const dates = unique(app.data.state.visibleShifts.map((shift) => shift.date));
      const branches = app.data.state.branches;
      let shifts = app.data.state.visibleShifts;
      if (app.selectedDate !== "all") shifts = shifts.filter((shift) => shift.date === app.selectedDate);
      if (app.selectedBranch !== "all") shifts = shifts.filter((shift) => shift.branchId === app.selectedBranch);
      return dateStrip(dates) +
        '<div class="chip-row">' +
          '<button class="filter-chip ' + (app.selectedBranch === "all" ? "active" : "") + '" onclick="setBranch(\\'all\\')">Все филиалы</button>' +
          branches.map((branch) => '<button class="filter-chip ' + (app.selectedBranch === branch.id ? "active" : "") + '" onclick="setBranch(\\'' + escAttr(branch.id) + '\\')">' + esc(branch.name) + '</button>').join("") +
        '</div>' +
        storiesHtml() +
        '<div class="section-title"><h2>' + (app.selectedDate === "all" ? "Ближайшие смены" : dateTitle(app.selectedDate)) + '</h2><span>' + shifts.length + '</span></div>' +
        (shifts.length ? shifts.map(shiftCard).join("") : '<div class="empty">На выбранный период смен нет. Можно сменить филиал или дату.</div>');
    }

    function dateStrip(dates) {
      return '<div class="date-strip"><button class="date-chip ' + (app.selectedDate === "all" ? "active" : "") + '" onclick="setDate(\\'all\\')"><span>Все</span><strong>∞</strong></button>' +
        dates.map((date) => '<button class="date-chip ' + (app.selectedDate === date ? "active" : "") + '" onclick="setDate(\\'' + date + '\\')"><span>' + weekday(date) + '</span><strong>' + day(date) + '</strong></button>').join("") +
      '</div>';
    }

    function storiesHtml() {
      return '<div class="stories">' + app.data.state.stories.map((story, index) =>
        '<button class="story" onclick="openStory(\\'' + escAttr(story.id) + '\\')"><div class="story-icon">' + (index + 1) + '</div><strong>' + esc(story.title) + '</strong></button>'
      ).join("") + '</div>';
    }

    function shiftCard(shift) {
      const branch = branchById(shift.branchId);
      const isFull = shift.assignedCount >= shift.requiredCount;
      const alreadyMine = app.data.state.myShifts.some((item) => item.shift.id === shift.id);
      return '<article class="shift-card ' + (shift.urgent ? "urgent" : "") + '" onclick="openShift(\\'' + escAttr(shift.id) + '\\')">' +
        '<div class="shift-head"><div><div class="shift-title">' + esc(shift.title) + '</div><div class="shift-sub">' + esc(branch.name) + ' · ' + esc(branch.address) + '</div>' + (shift.urgent ? '<span class="badge urgent">Срочно</span>' : '<span class="badge">Подходит вам</span>') + '</div><div class="pay">' + fmtMoney(shiftPay(shift)) + '</div></div>' +
        '<div class="divider"></div>' +
        '<div class="shift-foot"><div><div class="time">' + shift.startTime + '—' + shift.endTime + '</div><div class="caption">' + shift.plannedHours + ' ч · ' + fmtMoney(shift.hourlyRate) + '/час · мест ' + shift.assignedCount + '/' + shift.requiredCount + '</div></div>' +
        '<button class="cta ' + (isFull || alreadyMine ? "secondary" : "") + '" onclick="event.stopPropagation(); ' + (alreadyMine ? "setView(\\'mine\\')" : "take(\\'" + escAttr(shift.id) + "\\')") + '" ' + (isFull && !alreadyMine ? "disabled" : "") + '>' + (alreadyMine ? "В моих" : isFull ? "Заполнено" : "Взять") + '</button></div>' +
      '</article>';
    }

    function mineView() {
      const items = app.data.state.myShifts;
      return '<div class="section-title"><h2>Мои смены</h2><span>' + items.length + '</span></div>' +
        (items.length ? items.map(({ assignment, shift }) => {
          const branch = branchById(shift.branchId);
          const nextAction = assignment.status === "assigned" ? ["confirm", "Подтвердить"] : assignment.status === "confirmed" ? ["check-in", "Я на месте"] : assignment.status === "checked_in" ? ["complete", "Завершить"] : null;
          return '<article class="list-card"><div class="shift-head"><div><div class="shift-title">' + esc(shift.title) + '</div><div class="shift-sub">' + esc(branch.name) + ' · ' + dateTitle(shift.date) + '</div><span class="badge">' + statusLabel(assignment.status) + '</span></div><div class="pay">' + fmtMoney(shiftPay(shift)) + '</div></div><div class="divider"></div><div class="shift-foot"><div><div class="time">' + esc(shift.startTime) + '—' + esc(shift.endTime) + '</div><div class="caption">Координатор: ' + esc(shift.coordinator) + '</div></div><div>' + (nextAction ? '<button class="cta" onclick="assignmentAction(\\'' + escAttr(assignment.id) + '\\',\\'' + nextAction[0] + '\\')">' + nextAction[1] + '</button>' : '') + '<button class="cta danger" onclick="assignmentAction(\\'' + escAttr(assignment.id) + '\\',\\'cancel\\')">Отменить</button></div></div></article>';
        }).join("") : '<div class="empty">Вы пока не взяли смены. Подходящие варианты находятся во вкладке «Поиск».</div>');
    }

    function moneyView() {
      const money = app.data.state.money;
      return '<div class="section-title"><h2>Деньги</h2><span>неделя</span></div>' +
        '<div class="list-card"><div class="shift-title">Сегодня</div><div class="hero-money">' + fmtMoney(money.earned) + '</div><div class="caption">Начислено за завершенные смены</div></div>' +
        '<div class="list-card"><div class="shift-head"><div><div class="shift-title">Баланс</div><div class="shift-sub">Одобрено к выплате</div></div><div class="pay">' + fmtMoney(money.approved) + '</div></div></div>' +
        '<div class="list-card"><div class="shift-head"><div><div class="shift-title">Способ выплаты</div><div class="shift-sub">Настраивается в профиле</div></div><strong>Через СБП</strong></div></div>';
    }

    function chatView() {
      return '<div class="section-title"><h2>Общение</h2><span>центр</span></div>' + storiesHtml() +
        '<button class="list-card"><div class="shift-title">Поддержка</div><div class="shift-sub">Быстрые вопросы по смене, выплатам и отменам</div></button>' +
        '<button class="list-card"><div class="shift-title">Чаты с филиалами</div><div class="shift-sub">Контакты координаторов подтягиваются из таблицы</div></button>' +
        '<button class="list-card"><div class="shift-title">Правила и обучение</div><div class="shift-sub">Как отметиться, что делать при опоздании, как получить выплату</div></button>';
    }

    function profileView() {
      const admin = app.data.state.admin;
      return '<div class="section-title"><h2>' + esc(admin.fullName.split(" ")[0]) + '</h2><span>профиль</span></div>' +
        '<div class="profile-card"><div class="shift-title">' + roleLabel(admin.role) + '</div><div class="shift-sub">Допущен к ' + admin.branchIds.length + ' филиалам</div><div class="hero-row"><div class="metric"><span>Надежность</span><strong>' + admin.reliabilityScore + '</strong></div><div class="metric"><span>Статус</span><strong>' + statusLabel(admin.status) + '</strong></div></div></div>' +
        '<button class="list-card"><div class="shift-title">Мои документы</div><div class="shift-sub">Паспорт, самозанятость, реквизиты</div></button>' +
        '<button class="list-card"><div class="shift-title">Избранные филиалы</div><div class="shift-sub">Влияет на подбор смен и уведомления</div></button>' +
        '<button class="list-card"><div class="shift-title">О приложении</div><div class="shift-sub">Версия 1.0 · Санталь Смена</div></button>';
    }

    function renderNav() {
      document.getElementById("nav").innerHTML = tabs.map(([id, label, icon]) =>
        '<button class="nav-btn ' + (app.view === id ? "active" : "") + '" onclick="setView(\\'' + id + '\\')">' + icon + '<span>' + label + '</span></button>'
      ).join("");
    }

    function openShift(id) {
      const shift = app.data.state.visibleShifts.find((item) => item.id === id);
      if (!shift) return;
      const branch = branchById(shift.branchId);
      const alreadyMine = app.data.state.myShifts.some((item) => item.shift.id === shift.id);
      const isFull = shift.assignedCount >= shift.requiredCount;
      const action = alreadyMine
        ? '<button class="cta" style="width:100%; margin-top:14px" onclick="closeModal(); setView(\\'mine\\')">Уже в моих сменах</button>'
        : isFull
          ? '<button class="cta secondary" style="width:100%; margin-top:14px" disabled>Мест нет</button>'
          : '<button class="cta" style="width:100%; margin-top:14px" onclick="take(\\'' + escAttr(shift.id) + '\\')">Взять смену</button>';
      openModal('<div class="grabber"></div><div class="shift-title">' + esc(shift.title) + '</div><div class="shift-sub">' + esc(branch.name) + ' · ' + esc(branch.address) + '</div><div class="detail-grid"><div class="detail-cell"><span>Дата</span><strong>' + dateTitle(shift.date) + '</strong></div><div class="detail-cell"><span>Время</span><strong>' + esc(shift.startTime) + '—' + esc(shift.endTime) + '</strong></div><div class="detail-cell"><span>Оплата</span><strong>' + fmtMoney(shiftPay(shift)) + '</strong></div><div class="detail-cell"><span>Места</span><strong>' + shift.assignedCount + '/' + shift.requiredCount + '</strong></div></div><p class="shift-sub">' + esc(shift.notes) + '</p><p class="shift-sub">Координатор: ' + esc(shift.coordinator) + '</p>' + action + '<button class="cta secondary" style="width:100%; margin-top:10px" onclick="closeModal()">Закрыть</button>');
    }

    function openStory(id) {
      const story = app.data.state.stories.find((item) => item.id === id);
      if (!story) return;
      openModal('<div class="grabber"></div><div class="shift-title">' + esc(story.title) + '</div><p class="shift-sub" style="font-size:16px">' + esc(story.body) + '</p><button class="cta" style="width:100%; margin-top:18px" onclick="closeModal()">Понятно</button>');
    }

    function openModal(content) {
      document.getElementById("modal").innerHTML = '<div class="sheet">' + content + '</div>';
      document.getElementById("modal").classList.add("open");
    }
    function closeModal() { document.getElementById("modal").classList.remove("open"); }
    document.getElementById("modal").addEventListener("click", (event) => { if (event.target.id === "modal") closeModal(); });

    async function take(shiftId) {
      if (app.busy) return;
      app.busy = true;
      try {
        await api("/api/shifts/take", { method: "POST", body: JSON.stringify({ shiftId, initData: tg?.initData || "" }) });
        tg?.HapticFeedback?.notificationOccurred("success");
        await load();
        app.view = "mine";
        render();
        openModal('<div class="grabber"></div><div class="shift-title">Смена добавлена</div><p class="shift-sub">Мы перенесли её в «Мои смены». Следующий шаг — подтвердить выход перед началом.</p><button class="cta" style="width:100%" onclick="closeModal()">Хорошо</button>');
      } catch (error) {
        tg?.HapticFeedback?.notificationOccurred("error");
        openModal('<div class="grabber"></div><div class="shift-title">Не удалось взять смену</div><p class="shift-sub">' + (error.payload?.message || "Смену уже взяли или она пересекается с вашим графиком.") + '</p><button class="cta" style="width:100%" onclick="closeModal()">Понятно</button>');
      } finally {
        app.busy = false;
      }
    }

    async function assignmentAction(id, action) {
      try {
        await api("/api/assignments/" + id + "/" + action, { method: "POST", body: JSON.stringify({ initData: tg?.initData || "" }) });
        await load();
      } catch (error) {
        openModal('<div class="grabber"></div><div class="shift-title">Действие не выполнено</div><p class="shift-sub">' + (error.payload?.message || "Попробуйте еще раз.") + '</p><button class="cta" style="width:100%" onclick="closeModal()">Понятно</button>');
      }
    }

    function setDate(date) { app.selectedDate = date; render(); }
    function setBranch(branch) { app.selectedBranch = branch; render(); }
    function setView(view) { app.view = view; render(); window.scrollTo({ top: 0, behavior: "smooth" }); }
    function unique(values) { return [...new Set(values)].sort(); }
    function statusLabel(status) {
      return ({
        active: "Активен",
        assigned: "Назначена",
        confirmed: "Подтверждена",
        checked_in: "На месте",
        completed: "Завершена",
        cancelled: "Отменена"
      })[status] || status;
    }
    function roleLabel(role) {
      return ({
        admin: "Администратор",
        doctor_assistant: "Помощник врача"
      })[role] || role;
    }
    function esc(value) {
      return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
    }
    function escAttr(value) {
      return esc(value).replace(new RegExp(String.fromCharCode(96), "g"), "&#96;");
    }
    window.setDate = setDate;
    window.setBranch = setBranch;
    window.setView = setView;
    window.take = take;
    window.openShift = openShift;
    window.openStory = openStory;
    window.closeModal = closeModal;
    window.assignmentAction = assignmentAction;
    load();
  </script>
</body>
</html>`;
}
