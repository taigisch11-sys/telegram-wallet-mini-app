declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData?: string;
        ready?: () => void;
        expand?: () => void;
        close?: () => void;
        MainButton?: { hide: () => void };
      };
    };
  }
}

export function initTelegram() {
  window.Telegram?.WebApp?.ready?.();
  window.Telegram?.WebApp?.expand?.();
}

export function getTelegramInitData() {
  return window.Telegram?.WebApp?.initData ?? "";
}

export function closeTelegramApp() {
  window.Telegram?.WebApp?.close?.();
}

export function isTelegramWebApp() {
  return Boolean(window.Telegram?.WebApp);
}
