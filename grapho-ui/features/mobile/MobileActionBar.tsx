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
    <div className="grapho-mobile-tab-capsule">
      {primary("Library", <Menu size={20} />, onToggleSidebar, sidebarOpen)}
      {primary("Write", <Type size={20} />, onFocusEditor, !sidebarOpen && !expanded)}
      {primary("PDF", <FileDown size={20} />, () => { if (!disabled) onExportPdf(); })}
      {primary(expanded ? "Close" : "More", <MoreHorizontal size={20} />, () => setExpanded((value) => !value), expanded)}
    </div>
    <motion.button type="button" whileTap={{ scale: .88 }} onClick={onNewDocument} aria-label="New document" className="grapho-mobile-primary-action"><Plus size={23} /><span>New</span></motion.button>
    <AnimatePresence initial={false}>{expanded && <motion.div className="grapho-mobile-secondary-actions" initial={{ opacity: 0, scale: .78, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: .78, y: 12 }} transition={{ type: "spring", stiffness: 420, damping: 30 }}>
      <motion.button type="button" whileTap={{ scale: 0.9 }} onClick={onOpenStyle} aria-label="Open document style"><SlidersHorizontal size={17} /><span>Style</span></motion.button>
      <motion.button type="button" whileTap={{ scale: 0.9 }} onClick={onOpenHelp} aria-label="Open workspace help"><HelpCircle size={17} /><span>Help</span></motion.button>
    </motion.div>}</AnimatePresence>
  </nav>;
}
