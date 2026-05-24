import clsx from "clsx";
import { Card } from "./card";

export function Metric({
  hint,
  label,
  tone = "default",
  value
}: {
  hint: string;
  label: string;
  tone?: "default" | "accent" | "danger" | "success";
  value: string;
}) {
  return (
    <Card className={clsx("metric-card", tone !== "default" && `metric-card--${tone}`)}>
      <p className="metric-card__label">{label}</p>
      <strong>{value}</strong>
      <p className="metric-card__hint">{hint}</p>
    </Card>
  );
}
