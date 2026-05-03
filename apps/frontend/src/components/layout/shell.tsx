import { BarChart3, CreditCard, Home, ListChecks, MoreHorizontal, Plus, ReceiptText, WalletCards } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import type { Screen } from "../../app/App";
import { isTelegramWebApp } from "../../lib/telegram";

const items: { id: Screen; label: string; icon: typeof Home }[] = [
  { id: "wallet", label: "Финансы", icon: Home },
  { id: "plan", label: "План", icon: ListChecks },
  { id: "accounts", label: "Счета", icon: CreditCard },
  { id: "charts", label: "Графики", icon: BarChart3 },
  { id: "menu", label: "Меню", icon: MoreHorizontal }
];

const quickActions: { label: string; hint: string; target: Screen; icon: typeof Home }[] = [
  { label: "Счёт", hint: "Карта, вклад или наличные", target: "accounts", icon: CreditCard },
  { label: "Долговой счёт", hint: "Кредитка, кредит или рассрочка", target: "accounts", icon: WalletCards },
  { label: "Доход", hint: "Поступление в план", target: "plan", icon: Plus },
  { label: "Платёж", hint: "Обязательство или график", target: "plan", icon: ReceiptText }
];

export function Shell({ active, onNavigate, children }: { active: Screen; onNavigate: (screen: Screen) => void; children: ReactNode }) {
  const inTelegram = isTelegramWebApp();
  const periodLabel = currentPeriodLabel();
  const [quickOpen, setQuickOpen] = useState(false);

  function navigateQuick(target: Screen) {
    setQuickOpen(false);
    onNavigate(target);
  }

  return (
    <main className={`wallet-shell ${inTelegram ? "wallet-shell--telegram pt-4" : "max-w-md pt-7"} mx-auto flex min-h-screen w-full flex-col px-5 pb-[calc(8.5rem+env(safe-area-inset-bottom))] text-slate-50`}>
      <header className="relative mb-5 flex min-h-[46px] items-center justify-between gap-3">
        <div
          className="inline-flex items-center gap-1 rounded-full bg-[#2b2b30] px-4 py-2 text-[15px] font-extrabold text-white shadow-inner shadow-white/5"
          aria-label="Текущий месяц"
        >
          {periodLabel}
        </div>
        <button
          className="grid h-11 w-11 place-items-center rounded-full bg-[#2f8cff] text-white shadow-[0_12px_28px_rgba(47,140,255,0.32)]"
          type="button"
          aria-expanded={quickOpen}
          aria-label="Открыть быстрые действия"
          onClick={() => setQuickOpen((value) => !value)}
        >
          <Plus size={24} strokeWidth={3} />
        </button>
        {quickOpen ? (
          <div className="absolute right-0 top-14 z-30 w-[min(82vw,292px)] rounded-[26px] border border-white/10 bg-[#252529]/95 p-2 shadow-[0_22px_55px_rgba(0,0,0,0.55)] backdrop-blur-xl">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.label}
                  aria-label={action.label}
                  className="flex w-full items-center gap-3 rounded-[20px] px-3 py-3 text-left transition hover:bg-white/8"
                  type="button"
                  onClick={() => navigateQuick(action.target)}
                >
                  <span className="grid h-10 w-10 flex-none place-items-center rounded-full bg-[#2f8cff]/18 text-[#55a7ff]">
                    <Icon size={20} strokeWidth={2.7} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[15px] font-extrabold text-white">{action.label}</span>
                    <span className="block text-[12px] font-semibold leading-snug text-[#9a9aa0]">{action.hint}</span>
                  </span>
                </button>
              );
            })}
          </div>
        ) : null}
      </header>

      <div className="flex-1">{children}</div>

      <nav className="fixed inset-x-0 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-20 mx-auto w-[min(94vw,396px)] rounded-[30px] border border-white/10 bg-[#2b2b30]/88 p-1.5 shadow-[0_18px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl">
        <div className="grid grid-cols-5 gap-1">
          {items.map((item) => {
            const Icon = item.icon;
            const selected = active === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`flex min-h-[58px] flex-col items-center justify-center rounded-[24px] px-0.5 text-[10px] font-semibold transition ${
                  selected ? "bg-[#3f3f46] text-[#4fa1ff] shadow-inner shadow-white/8" : "text-white/82 hover:bg-white/8"
                }`}
                aria-label={item.label}
                type="button"
              >
                <Icon className={selected ? "text-[#4fa1ff]" : "text-white/86"} size={21} strokeWidth={2.5} />
                <span className="mt-1">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </main>
  );
}

function currentPeriodLabel() {
  const value = new Intl.DateTimeFormat("ru-RU", { month: "long", year: "numeric" }).format(new Date());
  return value.charAt(0).toUpperCase() + value.slice(1);
}
