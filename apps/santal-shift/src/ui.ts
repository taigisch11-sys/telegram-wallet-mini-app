export function renderAppHtml(): string {
  return `<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <meta name="theme-color" content="#ffffff" />
  <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 64 64%22%3E%3Crect width=%2264%22 height=%2264%22 rx=%2216%22 fill=%22%23ffffff%22/%3E%3Ctext x=%2232%22 y=%2243%22 text-anchor=%22middle%22 font-size=%2238%22 font-family=%22serif%22 font-weight=%22700%22 fill=%22%23111417%22%3ES%3C/text%3E%3C/svg%3E" />
  <title>Санталь Смена</title>
  <script src="https://telegram.org/js/telegram-web-app.js"></script>
  <style>
    @import url("https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=Source+Serif+4:wght@500;600;700&display=swap");
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
    /*
     * Apple x MIT x Nature Medicine visual pass.
     * This override keeps the existing product logic intact and replaces the
     * dashboard-like surfaces with a clinical editorial system.
     */
    :root {
      --bg: #ffffff;
      --surface: #ffffff;
      --surface-2: #f6f8f8;
      --text: #111417;
      --muted: #687179;
      --line: #e6eaed;
      --primary: #0f6158;
      --primary-2: #edf7f4;
      --urgent: #b84a3a;
      --warning: #9d6a18;
      --accent: #a31f34;
      --shadow: 0 1px 2px rgba(17, 20, 23, 0.04), 0 18px 42px rgba(17, 20, 23, 0.08);
      font-family: "IBM Plex Sans", "Aptos", "Segoe UI", sans-serif;
    }
    body {
      background:
        linear-gradient(90deg, rgba(17, 20, 23, 0.026) 1px, transparent 1px) 0 0 / 34px 34px,
        linear-gradient(180deg, rgba(17, 20, 23, 0.022) 1px, transparent 1px) 0 0 / 34px 34px,
        radial-gradient(circle at 88% 5%, rgba(15, 97, 88, 0.055), transparent 18rem),
        #ffffff;
    }
    button:focus-visible, input:focus-visible, select:focus-visible {
      outline: 2px solid rgba(15, 97, 88, 0.42);
      outline-offset: 3px;
    }
    button:disabled {
      cursor: not-allowed;
      opacity: 0.58;
    }
    .app {
      padding: calc(env(safe-area-inset-top) + 20px) 20px calc(env(safe-area-inset-bottom) + 154px);
    }
    .topbar {
      margin-bottom: 16px;
    }
    .brand {
      gap: 11px;
    }
    .brand-mark {
      width: 42px;
      height: 42px;
      border-radius: 14px;
      background:
        linear-gradient(145deg, #ffffff, #f6f8f8),
        #ffffff;
      border: 1px solid var(--line);
      box-shadow: none;
      color: var(--text);
      font-family: "Source Serif 4", Georgia, serif;
      font-size: 24px;
      font-weight: 700;
    }
    .brand h1 {
      font-family: "Source Serif 4", Georgia, serif;
      font-size: 24px;
      font-weight: 700;
      letter-spacing: -0.045em;
    }
    .brand p {
      color: var(--muted);
      font-size: 12px;
      letter-spacing: 0.02em;
    }
    .sync-pill {
      min-height: 34px;
      padding: 7px 10px;
      background: rgba(255, 255, 255, 0.92);
      border-color: var(--line);
      color: var(--text);
      box-shadow: 0 1px 0 rgba(17, 20, 23, 0.02);
      letter-spacing: 0.02em;
      text-transform: uppercase;
    }
    .sync-dot {
      background: var(--warning);
      box-shadow: 0 0 0 3px rgba(157, 106, 24, 0.1);
    }
    .sync-pill[data-connected="true"] .sync-dot {
      background: var(--primary);
      box-shadow: 0 0 0 3px rgba(15, 97, 88, 0.1);
    }
    .hero-card {
      border-radius: 28px;
      padding: 24px;
      background:
        linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(250, 251, 251, 0.96)),
        #ffffff;
      border: 1px solid var(--line);
      box-shadow: var(--shadow);
    }
    .hero-card::after {
      right: 20px;
      top: 18px;
      width: 64px;
      height: 64px;
      border-radius: 20px;
      background:
        linear-gradient(90deg, rgba(163, 31, 52, 0.12) 1px, transparent 1px) 0 0 / 10px 10px,
        linear-gradient(180deg, rgba(15, 97, 88, 0.09) 1px, transparent 1px) 0 0 / 10px 10px;
      opacity: 0.8;
    }
    .hero-label {
      color: var(--muted);
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
    .hero-money {
      font-family: "Source Serif 4", Georgia, serif;
      font-size: 50px;
      line-height: 0.92;
      font-weight: 700;
      letter-spacing: -0.065em;
    }
    .hero-row {
      gap: 12px;
    }
    .metric {
      border-radius: 18px;
      background: #ffffff;
      border-color: var(--line);
      box-shadow: none;
    }
    .metric span {
      color: var(--muted);
      font-size: 11px;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }
    .metric strong {
      color: var(--text);
      font-weight: 700;
    }
    .date-strip, .chip-row, .stories, .segment-row {
      gap: 8px;
      padding-bottom: 14px;
    }
    .date-chip, .filter-chip, .segment {
      background: rgba(255, 255, 255, 0.94);
      border-color: var(--line);
      box-shadow: none;
      color: var(--text);
      font-weight: 600;
    }
    .date-chip {
      width: 54px;
      height: 68px;
      border-radius: 20px;
    }
    .date-chip span {
      color: var(--muted);
      font-size: 11px;
      letter-spacing: 0.04em;
    }
    .date-chip strong {
      font-family: "Source Serif 4", Georgia, serif;
      font-size: 22px;
      font-weight: 700;
    }
    .date-chip.active, .filter-chip.active, .segment.active {
      background: var(--text);
      color: #ffffff;
      border-color: var(--text);
      box-shadow: 0 10px 24px rgba(17, 20, 23, 0.12);
    }
    .filter-chip.active {
      background: #ffffff;
      color: var(--text);
      box-shadow: inset 0 -3px 0 var(--accent);
    }
    .date-chip.active span {
      color: rgba(255, 255, 255, 0.72);
    }
    .story {
      min-width: 136px;
      min-height: 126px;
      border-radius: 22px;
      background: #ffffff;
      border-color: var(--line);
      box-shadow: 0 1px 0 rgba(17, 20, 23, 0.03);
    }
    .story-icon {
      border-radius: 13px;
      background: var(--primary-2);
      color: var(--primary);
      font-family: "Source Serif 4", Georgia, serif;
    }
    .story strong {
      color: var(--text);
      font-weight: 700;
    }
    .section-title {
      margin: 20px 0 13px;
      padding-top: 4px;
      border-top: 1px solid rgba(230, 234, 237, 0.82);
    }
    .section-title h2 {
      font-family: "Source Serif 4", Georgia, serif;
      font-size: 31px;
      font-weight: 700;
      letter-spacing: -0.055em;
    }
    .section-title span {
      color: var(--muted);
      font-size: 12px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
    .shift-card, .list-card, .profile-card {
      border-radius: 24px;
      background: rgba(255, 255, 255, 0.96);
      border-color: var(--line);
      box-shadow: 0 1px 0 rgba(17, 20, 23, 0.03), 0 14px 32px rgba(17, 20, 23, 0.055);
    }
    .shift-card::after, .list-card::after, .profile-card::after {
      content: "";
      position: absolute;
      left: 18px;
      right: 18px;
      top: 0;
      height: 1px;
      background: rgba(255, 255, 255, 0.86);
      pointer-events: none;
    }
    .shift-card.urgent::before {
      top: 17px;
      bottom: 17px;
      width: 4px;
      background: var(--urgent);
    }
    .shift-title {
      font-family: "Source Serif 4", Georgia, serif;
      font-size: 21px;
      font-weight: 700;
      letter-spacing: -0.045em;
    }
    .shift-sub {
      color: var(--muted);
    }
    .pay {
      color: var(--primary);
      font-size: 21px;
      font-weight: 700;
      letter-spacing: -0.035em;
    }
    .divider {
      background: var(--line);
    }
    .time {
      font-size: 24px;
      font-weight: 700;
      letter-spacing: -0.05em;
    }
    .caption {
      color: var(--muted);
      line-height: 1.35;
    }
    .cta {
      min-height: 46px;
      border-radius: 16px;
      background: var(--text);
      color: #ffffff;
      box-shadow: none;
      letter-spacing: -0.01em;
    }
    .cta.secondary {
      background: #ffffff;
      color: var(--text);
      border: 1px solid var(--line);
    }
    .cta.danger {
      background: #ffffff;
      color: var(--urgent);
      border: 1px solid rgba(184, 74, 58, 0.22);
    }
    .badge {
      gap: 7px;
      background: transparent;
      color: var(--primary);
      padding: 0;
      font-size: 12px;
      letter-spacing: 0.03em;
    }
    .badge::before {
      content: "";
      width: 7px;
      height: 7px;
      border-radius: 999px;
      background: currentColor;
      box-shadow: 0 0 0 3px rgba(15, 97, 88, 0.09);
    }
    .badge.urgent {
      background: transparent;
      color: var(--urgent);
    }
    .badge.urgent::before {
      box-shadow: 0 0 0 3px rgba(184, 74, 58, 0.09);
    }
    .board-row {
      border-radius: 18px;
      background: #ffffff;
      border-color: var(--line);
    }
    .risk {
      color: var(--urgent);
    }
    .empty {
      background: rgba(255, 255, 255, 0.84);
      border-color: var(--line);
      color: var(--muted);
      box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.74);
    }
    .empty .assistant-title {
      font-size: 22px;
      line-height: 1.08;
    }
    .empty .assistant-body {
      font-size: 14px;
      line-height: 1.38;
    }
    .bottom-nav {
      width: min(94vw, 498px);
      padding: 7px;
      border-radius: 26px;
      background: rgba(255, 255, 255, 0.9);
      border-color: rgba(230, 234, 237, 0.95);
      box-shadow: 0 1px 0 rgba(255, 255, 255, 0.9) inset, 0 18px 46px rgba(17, 20, 23, 0.12);
    }
    .nav-btn {
      border-radius: 19px;
      color: var(--muted);
      font-size: 10.5px;
      font-weight: 600;
    }
    .nav-btn svg {
      stroke-width: 1.9;
    }
    .nav-btn.active {
      background: var(--surface-2);
      color: var(--text);
      box-shadow: inset 0 3px 0 var(--accent);
    }
    .sheet-alert {
      background: #fff9ed;
      color: #6d4a12;
      border-color: #f1dfbd;
      box-shadow: 0 1px 0 rgba(17, 20, 23, 0.02);
    }
    .modal {
      background: rgba(17, 20, 23, 0.28);
      backdrop-filter: blur(6px);
    }
    .sheet {
      border-radius: 30px 30px 0 0;
      background: #ffffff;
      border: 1px solid var(--line);
      border-bottom: 0;
      box-shadow: 0 -22px 56px rgba(17, 20, 23, 0.18);
    }
    .grabber {
      background: #cfd5d9;
    }
    .detail-cell {
      border-radius: 16px;
      background: var(--surface-2);
      border: 1px solid var(--line);
    }
    .detail-cell span {
      color: var(--muted);
      font-size: 11px;
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }
    .loader {
      color: var(--muted);
    }
    @media (max-width: 380px) {
      .app { padding-inline: 14px; }
      .brand h1 { font-size: 22px; }
      .hero-money { font-size: 41px; }
      .hero-card { padding: 22px; }
      .section-title h2 { font-size: 28px; }
      .time { font-size: 22px; }
      .bottom-nav { width: min(96vw, 498px); }
    }
    .assistant-card {
      margin: 14px 0 18px;
      padding: 18px;
      border-radius: 24px;
      background: #ffffff;
      border: 1px solid var(--line);
      box-shadow: 0 1px 0 rgba(17, 20, 23, 0.03), 0 14px 34px rgba(17, 20, 23, 0.055);
    }
    .assistant-kicker, .fact-label {
      color: var(--muted);
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
    .assistant-title {
      margin-top: 8px;
      font-family: "Source Serif 4", Georgia, serif;
      font-size: 25px;
      line-height: 1.05;
      font-weight: 700;
      letter-spacing: -0.045em;
    }
    .assistant-body {
      margin-top: 8px;
      color: var(--muted);
      font-size: 14px;
      line-height: 1.42;
    }
    .assistant-actions {
      display: flex;
      gap: 10px;
      margin-top: 15px;
      flex-wrap: wrap;
    }
    .assistant-actions .cta {
      flex: 1;
      min-width: 132px;
    }
    .tomorrow-card {
      margin-bottom: 14px;
      padding: 16px;
      border-radius: 22px;
      background: linear-gradient(180deg, #ffffff, #fafbfb);
      border: 1px solid var(--line);
    }
    .fact-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 9px;
      margin-top: 13px;
    }
    .fact {
      padding: 11px 12px;
      border-radius: 16px;
      background: var(--surface-2);
      border: 1px solid var(--line);
    }
    .fact strong {
      display: block;
      margin-top: 4px;
      color: var(--text);
      font-size: 14px;
      line-height: 1.2;
    }
    .timeline {
      display: grid;
      gap: 8px;
      margin-top: 14px;
    }
    .timeline-step {
      display: grid;
      grid-template-columns: 18px 1fr;
      gap: 9px;
      align-items: start;
      color: var(--muted);
      font-size: 13px;
      line-height: 1.3;
    }
    .timeline-dot {
      width: 10px;
      height: 10px;
      margin-top: 3px;
      border-radius: 999px;
      border: 2px solid var(--line);
      background: #ffffff;
    }
    .timeline-step.done .timeline-dot {
      border-color: var(--primary);
      background: var(--primary);
    }
    .message-row {
      display: grid;
      grid-template-columns: 12px 1fr auto;
      gap: 12px;
      align-items: start;
      width: 100%;
      text-align: left;
    }
    .unread-dot {
      width: 8px;
      height: 8px;
      margin-top: 9px;
      border-radius: 999px;
      background: var(--accent);
      box-shadow: 0 0 0 4px rgba(163, 31, 52, 0.08);
    }
    .message-time {
      color: var(--muted);
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }
    .nav-badge {
      position: absolute;
      top: 7px;
      right: 16px;
      min-width: 18px;
      height: 18px;
      padding: 0 5px;
      border-radius: 999px;
      display: grid;
      place-items: center;
      background: var(--accent);
      color: #ffffff;
      font-size: 10px;
      font-weight: 700;
      line-height: 1;
    }
    .nav-btn {
      position: relative;
    }
    .guidance-block {
      margin-top: 14px;
      padding: 14px;
      border-radius: 18px;
      background: #fff9ed;
      border: 1px solid #f1dfbd;
      color: #6d4a12;
      font-size: 13px;
      line-height: 1.35;
      font-weight: 600;
    }
    @media (max-width: 380px) {
      .fact-grid { grid-template-columns: 1fr; }
      .assistant-actions .cta { min-width: 100%; }
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
    const assistant = () => app.data?.state.assistant || { headline: "Санталь Смена", body: "Подберите удобную смену и подтвердите выход.", primaryView: "search", primaryAction: "Найти смену", unreadCount: 0 };
    const myActiveShifts = () => app.data.state.myShifts.filter(({ assignment }) => assignment.status !== "completed" && assignment.status !== "cancelled");
    const tomorrowShift = () => {
      const info = assistant();
      return app.data.state.visibleShifts.find((shift) => shift.id === info.urgentShiftId || shift.date === info.tomorrowDate) || app.data.state.visibleShifts[0];
    };

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
        const message = error.payload?.message || "Не удалось загрузить приложение. Обновите страницу или откройте Mini App из Telegram.";
        const root = document.getElementById("app");
        root.innerHTML = '<div class="empty">' + esc(message) + '</div>';
      }
    }

    function render() {
      renderNav();
      const root = document.getElementById("app");
      root.innerHTML = header() + (app.data.state.sync.connected ? "" : '<div class="sheet-alert">' + app.data.state.sync.message + '</div>') + viewHtml();
    }

    function header() {
      const money = app.data.state.money;
      const info = assistant();
      return '<div class="topbar">' +
        '<div class="brand"><div class="brand-mark">S</div><div><h1>Санталь Смена</h1><p>' + esc(app.data.state.admin.fullName) + '</p></div></div>' +
        '<div class="sync-pill" data-connected="' + app.data.state.sync.connected + '"><span class="sync-dot"></span>' + (app.data.state.sync.connected ? "Sheets" : "Демо") + '</div>' +
      '</div>' +
      '<section class="hero-card">' +
        '<div class="hero-label">Операционный ассистент</div>' +
        '<div class="assistant-title">' + esc(info.headline) + '</div>' +
        '<div class="assistant-body">' + esc(info.body) + '</div>' +
        '<div class="hero-row">' +
          '<div class="metric"><span>Смен в графике</span><strong>' + myActiveShifts().length + '</strong></div>' +
          '<div class="metric"><span>В работе</span><strong>' + fmtMoney(money.pending) + '</strong></div>' +
          '<div class="metric"><span>Начислено</span><strong>' + fmtMoney(money.earned) + '</strong></div>' +
        '</div>' +
        '<div class="assistant-actions"><button class="cta" onclick="setView(\\'' + escAttr(info.primaryView || "search") + '\\')">' + esc(info.primaryAction || "Открыть") + '</button><button class="cta secondary" onclick="setView(\\'chat\\')">Уведомления</button></div>' +
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
        recommendationHtml() +
        storiesHtml("search") +
        '<div class="section-title"><h2>' + (app.selectedDate === "all" ? "Ближайшие смены" : dateTitle(app.selectedDate)) + '</h2><span>' + shifts.length + '</span></div>' +
        (shifts.length ? shifts.map(shiftCard).join("") : emptySearchHtml());
    }

    function dateStrip(dates) {
      return '<div class="date-strip"><button class="date-chip ' + (app.selectedDate === "all" ? "active" : "") + '" onclick="setDate(\\'all\\')"><span>Все</span><strong>∞</strong></button>' +
        dates.map((date) => '<button class="date-chip ' + (app.selectedDate === date ? "active" : "") + '" onclick="setDate(\\'' + date + '\\')"><span>' + weekday(date) + '</span><strong>' + day(date) + '</strong></button>').join("") +
      '</div>';
    }

    function storiesHtml(context = "search") {
      const prefix = context === "chat" ? "Инструкция" : "Подсказка";
      return '<div class="stories">' + app.data.state.stories.map((story, index) =>
        '<button class="story" onclick="openStory(\\'' + escAttr(story.id) + '\\')"><div class="story-icon">' + (index + 1) + '</div><span class="fact-label">' + prefix + '</span><strong>' + esc(story.title) + '</strong></button>'
      ).join("") + '</div>';
    }

    function recommendationHtml() {
      const shift = tomorrowShift();
      if (!shift) return '<div class="assistant-card"><div class="assistant-kicker">Рекомендация</div><div class="assistant-title">Свободных смен пока нет</div><div class="assistant-body">Бот напишет, когда появится подходящая смена по вашим филиалам.</div></div>';
      const branch = branchById(shift.branchId);
      return '<div class="tomorrow-card"><div class="assistant-kicker">' + (shift.urgent ? "Срочная смена" : "Ближайшая возможность") + '</div><div class="shift-head"><div><div class="shift-title">' + esc(shift.title) + '</div><div class="shift-sub">' + dateTitle(shift.date) + ' · ' + esc(branch.name) + '</div></div><div class="pay">' + fmtMoney(shiftPay(shift)) + '</div></div><div class="fact-grid"><div class="fact"><span class="fact-label">Время</span><strong>' + esc(shift.startTime) + '—' + esc(shift.endTime) + '</strong></div><div class="fact"><span class="fact-label">Места</span><strong>' + (shift.requiredCount - shift.assignedCount) + ' свободно</strong></div><div class="fact"><span class="fact-label">Филиал</span><strong>' + esc(branch.name) + '</strong></div></div><div class="assistant-actions"><button class="cta" onclick="openShift(\\'' + escAttr(shift.id) + '\\')">Посмотреть</button><button class="cta secondary" onclick="setView(\\'chat\\')">Напомнить в чат</button></div></div>';
    }

    function emptySearchHtml() {
      return '<div class="empty"><div class="assistant-title">На выбранный период смен нет</div><div class="assistant-body">Сбросьте фильтры или откройте общение: там будут уведомления о новых сменах и срочных заменах.</div><div class="assistant-actions"><button class="cta" onclick="setDate(\\'all\\'); setBranch(\\'all\\')">Показать все</button><button class="cta secondary" onclick="setView(\\'chat\\')">Уведомления</button></div></div>';
    }

    function shiftCard(shift) {
      const branch = branchById(shift.branchId);
      const isFull = shift.assignedCount >= shift.requiredCount;
      const alreadyMine = app.data.state.myShifts.some((item) => item.shift.id === shift.id);
      return '<article class="shift-card ' + (shift.urgent ? "urgent" : "") + '" onclick="openShift(\\'' + escAttr(shift.id) + '\\')">' +
        '<div class="shift-head"><div><div class="shift-title">' + esc(shift.title) + '</div><div class="shift-sub">' + esc(branch.name) + ' · ' + esc(branch.address) + '</div>' + (shift.urgent ? '<span class="badge urgent">Срочно</span>' : '<span class="badge">Подходит вам</span>') + '</div><div class="pay">' + fmtMoney(shiftPay(shift)) + '</div></div>' +
        '<div class="divider"></div>' +
        '<div class="fact-grid"><div class="fact"><span class="fact-label">Время</span><strong>' + esc(shift.startTime) + '—' + esc(shift.endTime) + '</strong></div><div class="fact"><span class="fact-label">Ставка</span><strong>' + fmtMoney(shift.hourlyRate) + '/ч</strong></div><div class="fact"><span class="fact-label">Места</span><strong>' + shift.assignedCount + '/' + shift.requiredCount + '</strong></div></div>' +
        '<div class="divider"></div>' +
        '<div class="shift-foot"><div><div class="time">' + shift.plannedHours + ' ч</div><div class="caption">Координатор: ' + esc(shift.coordinator) + '</div></div>' +
        '<button class="cta ' + (isFull || alreadyMine ? "secondary" : "") + '" onclick="event.stopPropagation(); ' + (alreadyMine ? "setView(\\'mine\\')" : "take(\\'" + escAttr(shift.id) + "\\')") + '" ' + (isFull && !alreadyMine ? "disabled" : "") + '>' + (alreadyMine ? "В моих" : isFull ? "Заполнено" : "Взять") + '</button></div>' +
      '</article>';
    }

    function mineView() {
      const items = app.data.state.myShifts;
      return '<div class="section-title"><h2>Мои смены</h2><span>' + items.length + '</span></div>' +
        (items.length ? items.map(({ assignment, shift }) => {
          const branch = branchById(shift.branchId);
          const nextAction = assignment.status === "assigned" ? ["confirm", "Подтвердить"] : assignment.status === "confirmed" ? ["check-in", "Я на месте"] : assignment.status === "checked_in" ? ["complete", "Завершить"] : null;
          return '<article class="list-card"><div class="shift-head"><div><div class="shift-title">' + esc(shift.title) + '</div><div class="shift-sub">' + esc(branch.name) + ' · ' + dateTitle(shift.date) + '</div><span class="badge">' + statusLabel(assignment.status) + '</span></div><div class="pay">' + fmtMoney(shiftPay(shift)) + '</div></div><div class="timeline">' + timelineHtml(assignment.status) + '</div><div class="divider"></div><div class="shift-foot"><div><div class="time">' + esc(shift.startTime) + '—' + esc(shift.endTime) + '</div><div class="caption">Координатор: ' + esc(shift.coordinator) + '</div></div><div>' + (nextAction ? '<button class="cta" onclick="assignmentAction(\\'' + escAttr(assignment.id) + '\\',\\'' + nextAction[0] + '\\')">' + nextAction[1] + '</button>' : '') + '<button class="cta danger" onclick="assignmentAction(\\'' + escAttr(assignment.id) + '\\',\\'cancel\\')">Отменить</button></div></div></article>';
        }).join("") : '<div class="empty"><div class="assistant-title">Вы пока не зарегистрированы ни на одну смену</div><div class="assistant-body">Это сообщение теперь продублирует и Telegram-бот. Выберите смену в поиске или дождитесь уведомления о подходящей замене.</div><div class="assistant-actions"><button class="cta" onclick="setView(\\'search\\')">Найти смену</button><button class="cta secondary" onclick="setView(\\'chat\\')">Открыть чат</button></div></div>');
    }

    function moneyView() {
      const money = app.data.state.money;
      return '<div class="section-title"><h2>Деньги</h2><span>неделя</span></div>' +
        '<div class="list-card"><div class="shift-title">Сегодня</div><div class="hero-money">' + fmtMoney(money.earned) + '</div><div class="caption">Начислено за завершенные смены</div></div>' +
        '<div class="list-card"><div class="shift-head"><div><div class="shift-title">Баланс</div><div class="shift-sub">Одобрено к выплате</div></div><div class="pay">' + fmtMoney(money.approved) + '</div></div></div>' +
        '<div class="list-card"><div class="shift-head"><div><div class="shift-title">Способ выплаты</div><div class="shift-sub">Настраивается в профиле</div></div><strong>Через СБП</strong></div></div>';
    }

    function chatView() {
      const info = assistant();
      return '<div class="section-title"><h2>Общение</h2><span>инбокс</span></div>' +
        '<div class="assistant-card"><div class="assistant-kicker">Telegram ассистент</div><div class="assistant-title">Уведомления выйдут в чат</div><div class="assistant-body">Бот отвечает на /my, /today, /money и утром напоминает о завтрашней смене. Если смен нет, он мягко вернет вас в поиск.</div><div class="assistant-actions"><button class="cta" onclick="openTelegramHelp()">Команды бота</button><button class="cta secondary" onclick="setView(\\'search\\')">Найти смену</button></div></div>' +
        '<button class="list-card" onclick="setView(\\'' + escAttr(info.primaryView || "search") + '\\')"><div class="message-row"><span class="unread-dot"></span><div><div class="shift-title">' + esc(info.headline) + '</div><div class="shift-sub">' + esc(info.body) + '</div></div><span class="message-time">сейчас</span></div></button>' +
        inboxRowsHtml() +
        storiesHtml("chat");
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
        '<button class="nav-btn ' + (app.view === id ? "active" : "") + '" onclick="setView(\\'' + id + '\\')">' + navBadge(id) + icon + '<span>' + label + '</span></button>'
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
      openModal('<div class="grabber"></div><div class="shift-title">' + esc(shift.title) + '</div><div class="shift-sub">' + esc(branch.name) + ' · ' + esc(branch.address) + '</div><div class="detail-grid"><div class="detail-cell"><span>Дата</span><strong>' + dateTitle(shift.date) + '</strong></div><div class="detail-cell"><span>Время</span><strong>' + esc(shift.startTime) + '—' + esc(shift.endTime) + '</strong></div><div class="detail-cell"><span>Оплата</span><strong>' + fmtMoney(shiftPay(shift)) + '</strong></div><div class="detail-cell"><span>Места</span><strong>' + shift.assignedCount + '/' + shift.requiredCount + '</strong></div></div><p class="shift-sub">' + esc(shift.notes) + '</p><div class="guidance-block">После записи бот пришлет чек смены в Telegram. За день до выхода он напомнит о смене, а в день работы — поможет пройти этапы подтверждения.</div><p class="shift-sub">Координатор: ' + esc(shift.coordinator) + '</p>' + action + '<button class="cta secondary" style="width:100%; margin-top:10px" onclick="closeModal()">Закрыть</button>');
    }

    function openStory(id) {
      const story = app.data.state.stories.find((item) => item.id === id);
      if (!story) return;
      openModal('<div class="grabber"></div><div class="shift-title">' + esc(story.title) + '</div><p class="shift-sub" style="font-size:16px">' + esc(story.body) + '</p><button class="cta" style="width:100%; margin-top:18px" onclick="closeModal()">Понятно</button>');
    }

    function timelineHtml(status) {
      const order = ["assigned", "confirmed", "checked_in", "completed"];
      const labels = {
        assigned: "Смена выбрана",
        confirmed: "Выход подтвержден",
        checked_in: "Отметка на месте",
        completed: "Смена завершена и уйдет в начисления"
      };
      const current = Math.max(0, order.indexOf(status));
      return order.map((step, index) => '<div class="timeline-step ' + (index <= current ? "done" : "") + '"><span class="timeline-dot"></span><span>' + labels[step] + '</span></div>').join("");
    }

    function inboxRowsHtml() {
      const rows = [];
      const info = assistant();
      if (myActiveShifts().length === 0) rows.push(["Вы пока без смен", "Бот напомнит открыть поиск, если график пустой.", "сегодня", "search"]);
      if (info.status === "tomorrow_shift") rows.push(["Завтра смена", "Проверьте время, филиал и подтвердите выход.", "утро", "mine"]);
      if (info.urgentShiftId) rows.push(["Срочная смена", "Есть открытая замена по вашим филиалам.", "важно", "search"]);
      rows.push(["Поддержка", "Команды: /my, /today, /money, /help.", "бот", "chat"]);
      return rows.map(([title, body, time, view]) => '<button class="list-card" onclick="setView(\\'' + view + '\\')"><div class="message-row"><span class="unread-dot"></span><div><div class="shift-title">' + esc(title) + '</div><div class="shift-sub">' + esc(body) + '</div></div><span class="message-time">' + esc(time) + '</span></div></button>').join("");
    }

    function haptic(type) {
      if (tg?.HapticFeedback?.notificationOccurred && tg?.isVersionAtLeast?.("6.1")) {
        tg.HapticFeedback.notificationOccurred(type);
      }
    }

    function navBadge(id) {
      const info = assistant();
      if (id === "mine" && myActiveShifts().length) return '<span class="nav-badge">' + myActiveShifts().length + '</span>';
      if (id === "chat" && info.unreadCount) return '<span class="nav-badge">' + info.unreadCount + '</span>';
      return "";
    }

    function openTelegramHelp() {
      openModal('<div class="grabber"></div><div class="shift-title">Команды Telegram-бота</div><p class="shift-sub">/my — мои смены<br>/today — что актуально сегодня<br>/money — начисления и выплаты<br>/help — помощь</p><div class="guidance-block">Бот сможет писать первым только после того, как сотрудник нажмет /start в чате.</div><button class="cta" style="width:100%; margin-top:14px" onclick="closeModal()">Понятно</button>');
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
        haptic("success");
        await load();
        app.view = "mine";
        render();
        openModal('<div class="grabber"></div><div class="shift-title">Смена добавлена</div><p class="shift-sub">Мы перенесли её в «Мои смены». Следующий шаг — подтвердить выход перед началом.</p><button class="cta" style="width:100%" onclick="closeModal()">Хорошо</button>');
      } catch (error) {
        haptic("error");
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
    window.openTelegramHelp = openTelegramHelp;
    window.closeModal = closeModal;
    window.assignmentAction = assignmentAction;
    load();
  </script>
</body>
</html>`;
}
