import { BarChart3, CheckSquare2, CreditCard, RefreshCw } from "lucide-react";
import type { Screen } from "../../app/App";

const actions: { label: string; icon: typeof RefreshCw; target: Screen }[] = [
  { label: "Сверить", icon: RefreshCw, target: "accounts" },
  { label: "Счета", icon: CreditCard, target: "accounts" },
  { label: "План", icon: CheckSquare2, target: "plan" },
  { label: "Графики", icon: BarChart3, target: "charts" }
];

export function BalanceHero({
  currentBalance,
  calculatedBalance,
  additionalExpenses,
  freeMoney,
  onNavigate
}: {
  currentBalance: string;
  calculatedBalance: string;
  additionalExpenses: string;
  freeMoney: string;
  onNavigate: (screen: Screen) => void;
}) {
  return (
    <section className="wallet-hero pt-1 text-center">
      <div className="mx-auto mb-14 flex w-fit rounded-full bg-[#2b2b30] p-1 shadow-inner shadow-black/35">
        <button className="rounded-full bg-[#707075] px-6 py-2 text-[16px] font-extrabold text-white shadow-[0_3px_10px_rgba(0,0,0,0.24)]" type="button" onClick={() => onNavigate("wallet")}>
          Баланс
        </button>
        <button className="rounded-full px-7 py-2 text-[16px] font-extrabold text-white/92" type="button" onClick={() => onNavigate("plan")}>
          План
        </button>
      </div>

      <p className="text-[18px] font-extrabold text-white">Свободно сейчас</p>
      <div className="mt-3 text-[56px] font-extrabold leading-none tracking-[-0.06em] text-white">{freeMoney}</div>
      <div className="mt-4 flex items-center justify-center gap-2 text-[16px] font-extrabold">
        <span className="text-[#32d178]">{currentBalance}</span>
        <span className="rounded-full bg-[#174f31] px-2.5 py-1 text-[#32d178]">остаток</span>
        <span className="text-[#9a9aa0]">после плана</span>
      </div>

      <div className="mt-7 grid grid-cols-2 gap-2 text-left">
        <Metric label="Расчётный баланс" value={calculatedBalance} />
        <Metric label="Нераспределено" value={additionalExpenses} danger />
      </div>

      <div className="mt-6 grid grid-cols-4 gap-2">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button key={action.label} className="wallet-action" type="button" onClick={() => onNavigate(action.target)}>
              <Icon size={25} strokeWidth={2.8} />
              <span>{action.label}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function Metric({ label, value, danger = false }: { label: string; value: string; danger?: boolean }) {
  return (
    <div className="rounded-[22px] bg-[#2b2b2f] px-4 py-3">
      <p className="text-[12px] font-semibold text-[#9a9aa0]">{label}</p>
      <p className={`mt-1 text-[16px] font-extrabold ${danger ? "text-[#ff6b73]" : "text-white"}`}>{value}</p>
    </div>
  );
}
