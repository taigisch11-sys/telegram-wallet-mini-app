import type { AlertDto } from "@wallet/shared";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { Card } from "../common/card";

export function AlertsPanel({ alerts }: { alerts: AlertDto[] }) {
  if (!alerts.length) {
    return (
      <Card className="flex items-center gap-3">
        <div className="wallet-token bg-[#1f6f48] text-[#36d985]">
          <CheckCircle2 size={25} />
        </div>
        <div>
          <p className="text-[18px] font-extrabold text-white">Рисков не видно</p>
          <p className="text-[15px] font-semibold text-[#9a9aa0]">План и текущий баланс сходятся.</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {alerts.map((alert) => (
        <Card key={alert.id} className={alert.level === "high" ? "ring-1 ring-[#ff6b73]/45" : "ring-1 ring-[#f2c45d]/45"}>
          <div className="flex gap-3">
            <div className={`wallet-token ${alert.level === "high" ? "bg-[#4a2028] text-[#ff6b73]" : "bg-[#493b1f] text-[#f2c45d]"}`}>
              <AlertTriangle size={25} />
            </div>
            <div>
              <p className="text-[18px] font-extrabold text-white">{alert.title}</p>
              <p className="mt-1 text-[15px] font-semibold text-[#a1a1a7]">{alert.description}</p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
