import type { TimeseriesPointDto } from "@wallet/shared";
import { useEffect, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card } from "../components/common/card";
import { api } from "../lib/api";

const periods = ["week", "month", "quarter", "year"] as const;
const periodLabels = {
  week: "Неделя",
  month: "Месяц",
  quarter: "Квартал",
  year: "Год"
};

export function ChartsScreen() {
  const [period, setPeriod] = useState<(typeof periods)[number]>("month");
  const [data, setData] = useState<TimeseriesPointDto[]>([]);

  useEffect(() => {
    void api
      .timeseries(period)
      .then(setData)
      .catch(() => setData([]));
  }, [period]);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-4 gap-1 rounded-md border border-line bg-panel p-1">
        {periods.map((item) => (
          <button key={item} type="button" onClick={() => setPeriod(item)} className={`rounded px-2 py-2 text-xs font-bold ${period === item ? "bg-mint text-ink" : "text-slate-400"}`}>
            {periodLabels[item]}
          </button>
        ))}
      </div>
      <Chart title="Чистый баланс" data={data} keyName="netBalance" color="#5cf0b2" />
      <Chart title="Деньги на счетах" data={data} keyName="accountBalance" color="#f2c45d" />
      <Chart title="Долги" data={data} keyName="debtBalance" color="#ff6b73" />
      <Chart title="Нераспределённые расходы" data={data} keyName="additionalExpenses" color="#8bd3ff" />
    </div>
  );
}

function Chart({ title, data, keyName, color }: { title: string; data: TimeseriesPointDto[]; keyName: keyof TimeseriesPointDto; color: string }) {
  return (
    <Card>
      <h2 className="mb-3 font-extrabold">{title}</h2>
      {data.length === 0 ? (
        <div className="grid h-52 place-items-center rounded-md border border-line px-4 text-center text-sm text-slate-400">Данные появятся после первой корректировки остатков.</div>
      ) : (
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <CartesianGrid stroke="#263140" strokeDasharray="4 4" />
              <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} width={48} />
              <Tooltip contentStyle={{ background: "#121720", border: "1px solid #263140", borderRadius: 6 }} />
              <Area type="monotone" dataKey={keyName} stroke={color} fill={color} fillOpacity={0.16} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}
