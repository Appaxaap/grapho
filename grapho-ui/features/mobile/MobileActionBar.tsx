"use client";

import { useState } from "react";
import { FileDown, HelpCircle, Menu, MoreHorizontal, Plus, SlidersHorizontal, Type } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

type MobileActionBarProps = {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  onNewDocument: () => void;
  onFocusEditor: () => void;
  onExportPdf: () => void;
  onOpenStyle: () => void;
  onOpenHelp: () => void;
  disabled?: boolean;
};

export function MobileActionBar({ sidebarOpen, onToggleSidebar, onNewDocument, onFocusEditor, onExportPdf, onOpenStyle, onOpenHelp, disabled = false }: MobileActionBarProps) {
  const [expanded, setExpanded] = useState(false);
  const primary = (label: string, icon: React.ReactNode, onClick: () => void, active = false) => <motion.button type="button" whileTap={{ scale: 0.9 }} onClick={onClick} aria-label={label} aria-pressed={active}>{active && <motion.span layoutId="mobile-action-active" className="grapho-mobile-action-active" transition={{ type: "spring", stiffness: 420, damping: 30 }} />}{icon}<span>{label}</span></motion.button>;
  return <nav className={`grapho-mobile-action-bar ${expanded ? "is-expanded" : ""}`} aria-label="Mobile workspace navigation">
    {primary("Library", <Menu size={18} />, onToggleSidebar, sidebarOpen)}
    {primary("Write", <Type size={18} />, onFocusEditor, !sidebarOpen && !expanded)}
    {primary("New", <Plus size={18} />, onNewDocument)}
    <AnimatePresence initial={false}>{expanded && <motion.div className="grapho-mobile-secondary-actions" initial={{ opacity: 0, scale: .8, x: 16 }} animate={{ opacity: 1, scale: 1, x: 0 }} exit={{ opacity: 0, scale: .8, x: 16 }} transition={{ type: "spring", stiffness: 420, damping: 30 }}>
      <motion.button type="button" whileTap={{ scale: 0.9 }} onClick={onExportPdf} disabled={disabled} aria-label="Export PDF"><FileDown size={17} /><span>PDF</span></motion.button>
      <motion.button type="button" whileTap={{ scale: 0.9 }} onClick={onOpenStyle} aria-label="Open document style"><SlidersHorizontal size={17} /><span>Style</span></motion.button>
      <motion.button type="button" whileTap={{ scale: 0.9 }} onClick={onOpenHelp} aria-label="Open workspace help"><HelpCircle size={17} /><span>Help</span></motion.button>
    </motion.div>}</AnimatePresence>
    {primary(expanded ? "Close" : "More", <MoreHorizontal size={18} />, () => setExpanded((value) => !value), expanded)}
  </nav>;
}
