"use client";

import { FileDown, HelpCircle, Menu, Plus, SlidersHorizontal } from "lucide-react";

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
      <button type="button" onClick={onToggleSidebar} aria-label={sidebarOpen ? "Close document library" : "Open document library"} aria-pressed={sidebarOpen}>
        <Menu size={18} />
        <span>Library</span>
      </button>
      <button type="button" onClick={onNewDocument} aria-label="New document">
        <Plus size={18} />
        <span>New</span>
      </button>
      <button type="button" onClick={onExportPdf} disabled={disabled} aria-label="Export PDF">
        <FileDown size={18} />
        <span>PDF</span>
      </button>
      <button type="button" onClick={onOpenStyle} aria-label="Open document style">
        <SlidersHorizontal size={18} />
        <span>Style</span>
      </button>
      <button type="button" onClick={onOpenHelp} aria-label="Open workspace help">
        <HelpCircle size={18} />
        <span>Help</span>
      </button>
    </nav>
  );
}
