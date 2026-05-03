import type { AlertDto } from "@wallet/shared";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { Card } from "../common/card";

export function AlertsPanel({ alerts }: { alerts: AlertDto[] }) {
  if (!alerts.length) {
    return (
      <Card className="flex items-center gap-3">
        <div className="wallet-token wallet-token--positive">
          <CheckCircle2 size={25} />
        </div>
        <div>
          <p className="text-[18px] font-extrabold text-white">Рисков не видно</p>
          <p className="text-[15px] font-semibold text-[#9a9aa0]">Критичных просрочек и кассового разрыва не видно.</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {alerts.map((alert) => (
        <Card key={alert.id} className={alert.level === "high" ? "ring-1 ring-danger/45" : "ring-1 ring-amber/45"}>
          <div className="flex gap-3">
            <div className={`wallet-token ${alert.level === "high" ? "wallet-token--danger" : "wallet-token--warning"}`}>
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
