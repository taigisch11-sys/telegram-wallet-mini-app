import { BarChart3, CreditCard, Home, ListChecks, MoreHorizontal, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";
import type { Screen } from "../../app/App";
import { closeTelegramApp, isTelegramWebApp } from "../../lib/telegram";

const items: { id: Screen; label: string; icon: typeof Home }[] = [
  { id: "wallet", label: "Финансы", icon: Home },
  { id: "plan", label: "План", icon: ListChecks },
  { id: "accounts", label: "Счета", icon: CreditCard },
  { id: "charts", label: "Графики", icon: BarChart3 },
  { id: "menu", label: "Меню", icon: MoreHorizontal }
];

export function Shell({ active, onNavigate, children }: { active: Screen; onNavigate: (screen: Screen) => void; children: ReactNode }) {
  const inTelegram = isTelegramWebApp();

  return (
    <main className={`wallet-shell ${inTelegram ? "wallet-shell--telegram pt-4" : "max-w-md pt-7"} mx-auto flex min-h-screen w-full flex-col px-5 pb-28 text-slate-50`}>
      {!inTelegram ? (
        <header className="relative mb-5 grid min-h-[68px] grid-cols-[72px_1fr_72px] items-start">
          <button className="pt-2 text-left text-[17px] font-medium text-[#55a7ff]" type="button" onClick={closeTelegramApp}>
            Закрыть
          </button>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1.5">
              <h1 className="text-[22px] font-extrabold leading-tight tracking-[-0.03em]">Финансы</h1>
              <ShieldCheck className="fill-[#2f8cff] text-[#2f8cff]" size={21} />
            </div>
            <p className="text-[13px] font-semibold text-[#8f8f95]">мини-приложение</p>
          </div>
          <div className="flex justify-end pt-1">
            <button
              className="grid h-9 w-9 place-items-center rounded-full border border-[#2f8cff]/70 text-[#58a6ff]"
              type="button"
              aria-label="Открыть меню"
              onClick={() => onNavigate("menu")}
            >
              <MoreHorizontal size={23} />
            </button>
          </div>
        </header>
      ) : null}

      <div className="flex-1">{children}</div>

      <nav className="fixed inset-x-0 bottom-4 z-20 mx-auto w-[min(94vw,396px)] rounded-[30px] border border-white/10 bg-[#2b2b30]/88 p-1.5 shadow-[0_18px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl">
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
