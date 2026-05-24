import clsx from "clsx";
import type { LucideIcon } from "lucide-react";

type NavItem<T extends string> = {
  id: T;
  label: string;
  icon: LucideIcon;
};

export function BottomNav<T extends string>({
  active,
  items,
  onChange
}: {
  active: T;
  items: NavItem<T>[];
  onChange: (id: T) => void;
}) {
  return (
    <nav className="bottom-nav" aria-label="Основная навигация">
      {items.map((item) => {
        const Icon = item.icon;
        const selected = active === item.id;
        return (
          <button key={item.id} className={clsx("bottom-nav__item", selected && "bottom-nav__item--active")} type="button" onClick={() => onChange(item.id)} aria-label={item.label}>
            <Icon size={18} strokeWidth={1.8} />
            <span>{item.label}</span>
            <i />
          </button>
        );
      })}
    </nav>
  );
}
