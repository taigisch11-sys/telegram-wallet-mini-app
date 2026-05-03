import type { ReactNode } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-md border border-line bg-panel/88 p-4 shadow-xl shadow-black/20 ${className}`}>{children}</section>;
}
