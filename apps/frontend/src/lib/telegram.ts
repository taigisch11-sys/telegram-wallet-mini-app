declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData?: string;
        ready?: () => void;
        expand?: () => void;
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
