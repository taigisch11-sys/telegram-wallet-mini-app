import type { ReactNode } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-[28px] bg-[#2b2b2f] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] ${className}`}>{children}</section>;
}
