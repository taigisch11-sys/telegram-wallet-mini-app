import clsx from "clsx";
import type { ReactNode } from "react";

export function SectionTitle({
  action,
  compact = false,
  description,
  eyebrow,
  title
}: {
  action?: ReactNode;
  compact?: boolean;
  description?: string;
  eyebrow: string;
  title: string;
}) {
  return (
    <div className={clsx("section-title", compact && "section-title--compact")}>
      <div>
        <p className="section-title__eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
        {description ? <p className="section-title__description">{description}</p> : null}
      </div>
      {action ? <div>{action}</div> : null}
    </div>
  );
}
