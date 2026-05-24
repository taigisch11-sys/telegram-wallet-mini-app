import { CircleSlash2 } from "lucide-react";
import { Card } from "./card";

export function EmptyState({
  description,
  title,
  tone = "default"
}: {
  description: string;
  title: string;
  tone?: "default" | "success";
}) {
  return (
    <Card className={`empty-card ${tone === "success" ? "empty-card--success" : ""}`}>
      <span className="empty-card__icon">
        <CircleSlash2 size={16} />
      </span>
      <div>
        <strong>{title}</strong>
        <p>{description}</p>
      </div>
    </Card>
  );
}
