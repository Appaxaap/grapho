"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

/**
 * Emoji-mart picker panel (searchable, categorized, skin tones, recents).
 *
 * emoji-mart is a web-component library that is not SSR-safe, so it is loaded
 * imperatively on the client — the same pattern BlockNote itself uses. The
 * module is code-split so the ~1MB picker only loads when first opened.
 */

export interface EmojiSelectEvent {
  /** The rendered character(s), already skin-tone resolved. */
  native: string;
  shortcodes?: string;
  skin?: number;
}

interface EmojiPickerProps {
  theme: "light" | "dark";
  onEmojiSelect: (emoji: EmojiSelectEvent) => void;
}

let loadPromise: Promise<typeof import("emoji-mart")> | null = null;

function loadEmojiMart(): Promise<typeof import("emoji-mart")> {
  loadPromise ??= Promise.all([
    import("emoji-mart"),
    import("@emoji-mart/data"),
  ]).then(async ([emojiMart, dataModule]) => {
    // Initialize the search index once; the Picker reuses it.
    await emojiMart.init({ data: dataModule.default });
    return emojiMart;
  });
  return loadPromise;
}

export function EmojiPicker({ theme, onEmojiSelect }: EmojiPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void loadEmojiMart()
      .then(async (emojiMart) => {
        if (cancelled) return;
        const dataModule = await import("@emoji-mart/data");
        const picker = new emojiMart.Picker({
          data: dataModule.default,
          theme,
          perLine: 9,
          emojiSize: 22,
          maxFrequentRows: 1,
          previewPosition: "none",
          navPosition: "top",
          onEmojiSelect: (e: EmojiSelectEvent) => onEmojiSelect(e),
          ref: containerRef,
        });
        setLoaded(true);
        // The Picker appends itself into containerRef.current; keep it alive.
        // emoji-mart keeps an internal store; nothing else to dispose.
        void picker;
      })
      .catch(() => {
        if (!cancelled) setLoaded(false);
      });
    const el = containerRef.current;
    return () => {
      cancelled = true;
      if (el) el.innerHTML = "";
    };
    // Rebuild only on mount — theme changes are applied by the Picker's own
    // update() when the `theme` prop changes below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Apply theme changes without rebuilding the picker (emoji-mart reacts to
  // the prop via its internal attribute observer).
  useEffect(() => {
    const el = containerRef.current?.firstElementChild as
      | (HTMLElement & { theme?: string })
      | null;
    el?.setAttribute?.("theme", theme);
  }, [theme]);

  return (
    <div
      ref={containerRef}
      className="emoji-picker-host w-[352px] overflow-hidden rounded-2xl"
      role="dialog"
      aria-label="Emoji picker"
    >
      {!loaded && (
        <div className="flex h-40 items-center justify-center text-faint">
          <Loader2 className="size-5 animate-spin" />
        </div>
      )}
    </div>
  );
}
