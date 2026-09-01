"use client";

import { FileDown, HelpCircle, Menu, Plus, SlidersHorizontal } from "lucide-react";
import { motion } from "motion/react";

type MobileActionBarProps = {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  onNewDocument: () => void;
  onExportPdf: () => void;
  onOpenStyle: () => void;
  onOpenHelp: () => void;
  disabled?: boolean;
};

export function MobileActionBar({ sidebarOpen, onToggleSidebar, onNewDocument, onExportPdf, onOpenStyle, onOpenHelp, disabled = false }: MobileActionBarProps) {
  return (
    <nav className="grapho-mobile-action-bar" aria-label="Mobile workspace actions">
      <motion.button type="button" whileTap={{ scale: 0.9 }} onClick={onToggleSidebar} aria-label={sidebarOpen ? "Close document library" : "Open document library"} aria-pressed={sidebarOpen}>
        {sidebarOpen && <motion.span layoutId="mobile-action-active" className="grapho-mobile-action-active" transition={{ type: "spring", stiffness: 420, damping: 30 }} />}
        <Menu size={18} />
        <span>Library</span>
      </motion.button>
      <motion.button type="button" whileTap={{ scale: 0.9 }} onClick={onNewDocument} aria-label="New document">
        <Plus size={18} />
        <span>New</span>
      </motion.button>
      <motion.button type="button" whileTap={{ scale: 0.9 }} onClick={onExportPdf} disabled={disabled} aria-label="Export PDF">
        <FileDown size={18} />
        <span>PDF</span>
      </motion.button>
      <motion.button type="button" whileTap={{ scale: 0.9 }} onClick={onOpenStyle} aria-label="Open document style">
        <SlidersHorizontal size={18} />
        <span>Style</span>
      </motion.button>
      <motion.button type="button" whileTap={{ scale: 0.9 }} onClick={onOpenHelp} aria-label="Open workspace help">
        <HelpCircle size={18} />
        <span>Help</span>
      </motion.button>
    </nav>
  );
}
