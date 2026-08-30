import type { ReactNode } from "react";

export function RevealText({ children, className = "" }: { children: ReactNode; className?: string }) { return <span className={`rebuild-reveal ${className}`}>{children}</span>; }
