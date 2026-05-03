import type { UpcomingEventDto } from "@wallet/shared";
import { ArrowDownLeft, ArrowUpRight, ChevronRight } from "lucide-react";
import { money, shortDate } from "../../lib/format";
import { Badge } from "../common/badge";

export function UpcomingList({ items, onNavigatePlan }: { items: UpcomingEventDto[]; onNavigatePlan: () => void }) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between px-6">
        <h2 className="text-[21px] font-extrabold text-[#8f8f95]">Ближайшее</h2>
        <button type="button" className="text-[16px] font-semibold text-action" onClick={onNavigatePlan}>
          Все
        </button>
      </div>
      <div className="space-y-3">
        {items.length === 0 ? (
          <button className="wallet-row w-full text-left" type="button" onClick={onNavigatePlan}>
            <div className="wallet-token bg-[#34343a] text-[#a1a1a7]">
              <ChevronRight size={24} />
            </div>
            <div>
              <p className="text-[18px] font-extrabold text-white">Событий пока нет</p>
              <p className="text-[15px] font-semibold text-[#9a9aa0]">Добавьте доходы и платежи в плане.</p>
            </div>
          </button>
        ) : null}

        {items.map((item) => (
          <button key={item.id} className="wallet-row w-full text-left" type="button" onClick={onNavigatePlan}>
            <div className={`wallet-token ${item.kind === "income" ? "wallet-token--positive" : "wallet-token--danger"}`}>
              {item.kind === "income" ? <ArrowDownLeft size={24} /> : <ArrowUpRight size={24} />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="break-words text-[18px] font-extrabold leading-snug text-white">{item.title}</p>
              <p className="text-[15px] font-semibold text-[#9a9aa0]">{shortDate(item.date)}</p>
            </div>
            <div className="text-right">
              <p className="text-[17px] font-bold text-white">{money(item.amount)}</p>
              <Badge status={item.status} />
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
