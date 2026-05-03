import type { UpcomingEventDto } from "@wallet/shared";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { money, shortDate } from "../../lib/format";
import { Badge } from "../common/badge";
import { Card } from "../common/card";

export function UpcomingList({ items }: { items: UpcomingEventDto[] }) {
  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-extrabold">Ближайшие события</h2>
        <span className="text-xs text-slate-500">{items.length}</span>
      </div>
      {items.length === 0 ? <p className="rounded-md border border-line p-3 text-sm text-slate-400">Событий пока нет.</p> : null}
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-3">
            <div className={`grid h-9 w-9 place-items-center rounded-md ${item.kind === "income" ? "bg-mint/12 text-mint" : "bg-danger/12 text-danger"}`}>
              {item.kind === "income" ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-bold">{item.title}</p>
              <p className="text-xs text-slate-500">{shortDate(item.date)}</p>
            </div>
            <div className="text-right">
              <p className="font-bold">{money(item.amount)}</p>
              <Badge status={item.status} />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
