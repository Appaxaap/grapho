"use client";

import { Modal } from "./Modal";
import { useStore } from "@/lib/store";
import { modKey } from "@/lib/utils";
import { APP_ORIGIN, APP_TAGLINE, SHORTCUTS } from "@/lib/constants";

/**
 * Settings modal — keyboard shortcut reference and the Grapho origin story.
 * Accent style + editor font live in the inspector (Theme Style / Text Editor),
 * so this modal only carries the reference material.
 */
export function SettingsMenu() {
  const { settingsOpen, setSettingsOpen } = useStore();

  return (
    <Modal
      open={settingsOpen}
      onClose={() => setSettingsOpen(false)}
      title="Settings"
      description="Keyboard shortcuts & about Grapho."
      width="max-w-md"
    >
      <div className="space-y-6 px-5 pb-5">
        {/* Shortcuts */}
        <section>
          <h3 className="mb-2 text-[9px] font-semibold uppercase tracking-[0.14em] text-faint">
            Keyboard Shortcuts
          </h3>
          <div className="rounded-[14px] border border-border bg-panel-solid p-3">
            {SHORTCUTS.map((s) => (
              <div
                key={s.action}
                className="flex items-center justify-between gap-3 py-1 text-[12px]"
              >
                <span className="text-muted">{s.action}</span>
                <kbd className="shrink-0 rounded-md border border-border bg-control px-1.5 py-0.5 font-mono text-[9px] text-faint">
                  {s.keys.replace("Cmd/Ctrl", modKey())}
                </kbd>
              </div>
            ))}
          </div>
        </section>

        <section className="border-t border-border pt-4">
          <p className="text-[10px] leading-relaxed text-muted">
            <span className="font-semibold text-foreground/80">{APP_TAGLINE}</span>
            <br />
            {APP_ORIGIN}
            <br />
            <span className="mt-1 inline-block">
              Offline-first · SQLite on your device · No accounts, no tracking.
            </span>
          </p>
        </section>
      </div>
    </Modal>
  );
}
