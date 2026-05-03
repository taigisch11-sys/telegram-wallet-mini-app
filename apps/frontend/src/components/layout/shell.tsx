import { BarChart3, Clock3, CreditCard, Home, ListChecks } from "lucide-react";
import type { ReactNode } from "react";
import type { Screen } from "../../app/App";

const items: { id: Screen; label: string; icon: typeof Home }[] = [
  { id: "wallet", label: "Кошелёк", icon: Home },
  { id: "plan", label: "План", icon: ListChecks },
  { id: "accounts", label: "Счета", icon: CreditCard },
  { id: "charts", label: "Графики", icon: BarChart3 },
  { id: "history", label: "История", icon: Clock3 }
];

export function Shell({ active, onNavigate, children }: { active: Screen; onNavigate: (screen: Screen) => void; children: ReactNode }) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 pb-24 pt-5 text-slate-50">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-mint">Финансы</p>
          <h1 className="text-xl font-extrabold">Кошелёк</h1>
        </div>
        <div className="rounded-md border border-line bg-panel px-3 py-2 text-right text-xs text-slate-300">
          <span className="block text-slate-500">Мини-приложение</span>
          <span>Телеграм</span>
        </div>
      </header>
      <div className="flex-1">{children}</div>
      <nav className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-md border-t border-line bg-ink/95 px-2 py-2 backdrop-blur">
        <div className="grid grid-cols-5 gap-1">
          {items.map((item) => {
            const Icon = item.icon;
            const selected = active === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`flex min-h-14 flex-col items-center justify-center rounded-md text-[11px] transition ${
                  selected ? "bg-mint text-ink" : "text-slate-400 hover:bg-panel hover:text-slate-100"
                }`}
                aria-label={item.label}
              >
                <Icon size={18} />
                <span className="mt-1">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </main>
  );
}
