import type { HistoryItemDto } from "@wallet/shared";
import { useEffect, useState } from "react";
import { Card } from "../components/common/card";
import { api } from "../lib/api";
import { shortDate } from "../lib/format";

export function HistoryScreen() {
  const [items, setItems] = useState<HistoryItemDto[]>([]);

  useEffect(() => {
    void api
      .history()
      .then(setItems)
      .catch(() => setItems([]));
  }, []);

  return (
    <Card>
      <h2 className="mb-3 text-lg font-extrabold">История</h2>
      {items.length === 0 ? <p className="rounded-md border border-line p-3 text-sm text-slate-400">История появится после первой операции.</p> : null}
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="rounded-md border border-line p-3">
            <div className="flex items-center justify-between gap-3">
              <p className="font-bold">{label(item.type)}</p>
              <span className="text-xs text-slate-500">{shortDate(item.createdAt)}</span>
            </div>
            <pre className="mt-2 whitespace-pre-wrap break-words text-xs text-slate-400">{JSON.stringify(item.payload, null, 2)}</pre>
          </div>
        ))}
      </div>
    </Card>
  );
}

function label(type: string) {
  const labels: Record<string, string> = {
    balance_reconciled: "Корректировка остатков",
    payment_paid: "Платёж выполнен",
    income_received: "Доход получен",
    account_created: "Счёт добавлен",
    account_deleted: "Счёт удалён",
    debt_created: "Долг добавлен",
    debt_deleted: "Долг удалён"
  };
  return labels[type] ?? type;
}
