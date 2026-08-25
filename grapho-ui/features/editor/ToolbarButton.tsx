"use client";

import type { ReactNode } from "react";
import { motion } from "motion/react";

export function ToolbarButton({ label, icon, onClick, danger = false, disabled = false }: { label: string; icon: ReactNode; onClick?: () => void; danger?: boolean; disabled?: boolean }) {
  return <motion.button type="button" aria-label={label} title={disabled ? `${label} unavailable` : label} onClick={onClick} disabled={disabled} whileHover={disabled ? undefined : { y: -2 }} whileTap={disabled ? undefined : { scale: .92 }} className={`grid size-9 shrink-0 items-center justify-center rounded-xl transition-colors disabled:cursor-not-allowed disabled:opacity-30 ${danger ? "text-red-500 hover:bg-red-500/10" : "text-[var(--grapho-muted)] hover:bg-[var(--grapho-control)] hover:text-[var(--grapho-foreground)]"}`}>{icon}</motion.button>;
}
