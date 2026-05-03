import { Card } from "../common/card";

export function BalanceHero({
  currentBalance,
  calculatedBalance,
  additionalExpenses,
  freeMoney
}: {
  currentBalance: string;
  calculatedBalance: string;
  additionalExpenses: string;
  freeMoney: string;
}) {
  return (
    <Card className="bg-gradient-to-br from-panel via-[#142018] to-[#101317]">
      <p className="text-sm text-slate-400">Текущий баланс</p>
      <div className="mt-2 text-4xl font-extrabold leading-tight text-white">{currentBalance}</div>
      <div className="mt-5 grid grid-cols-3 gap-2">
        <Metric label="Расчётный баланс" value={calculatedBalance} />
        <Metric label="Доп. расходы" value={additionalExpenses} />
        <Metric label="Свободно" value={freeMoney} />
      </div>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/8 bg-black/18 p-2">
      <p className="text-[10px] leading-tight text-slate-400">{label}</p>
      <p className="mt-1 break-words text-sm font-bold">{value}</p>
    </div>
  );
}
