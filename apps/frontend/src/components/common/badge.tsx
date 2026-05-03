import { statusLabel } from "../../lib/format";

export function Badge({ status }: { status: string }) {
  const tone = status.includes("late") || status === "overdue" ? "border-danger text-danger" : status === "delayed" ? "border-amber text-amber" : status.includes("paid") || status.includes("received") ? "border-slate-600 text-slate-400" : "border-mint text-mint";
  return <span className={`rounded border px-2 py-1 text-[11px] font-bold ${tone}`}>{statusLabel(status)}</span>;
}
