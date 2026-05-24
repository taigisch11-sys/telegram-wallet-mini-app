import clsx from "clsx";
import type { LucideIcon } from "lucide-react";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost";

export function Button({
  children,
  className,
  icon: Icon,
  variant = "secondary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { icon?: LucideIcon; variant?: Variant }) {
  return (
    <button {...props} className={clsx("editorial-button", `editorial-button--${variant}`, className)}>
      <span>{children}</span>
      {Icon ? <Icon size={16} strokeWidth={1.8} /> : null}
    </button>
  );
}
