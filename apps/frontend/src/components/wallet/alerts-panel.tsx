import type { AlertDto } from "@wallet/shared";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { Card } from "../common/card";

export function AlertsPanel({ alerts }: { alerts: AlertDto[] }) {
  if (!alerts.length) {
    return (
      <Card className="flex items-center gap-3">
        <CheckCircle2 className="text-mint" size={20} />
        <div>
          <p className="font-bold">Рисков не видно</p>
          <p className="text-sm text-slate-400">План и текущий баланс сходятся.</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {alerts.map((alert) => (
        <Card key={alert.id} className={alert.level === "high" ? "border-danger/60" : "border-amber/60"}>
          <div className="flex gap-3">
            <AlertTriangle className={alert.level === "high" ? "text-danger" : "text-amber"} size={20} />
            <div>
              <p className="font-bold">{alert.title}</p>
              <p className="mt-1 text-sm text-slate-400">{alert.description}</p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
