"use client";

import { useEffect, useRef, useState } from "react";
import {
  Check,
  ChevronDown,
  Image,
  Link2,
  List,
  ListOrdered,
  Minus,
  Plus,
  Smile,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { ACCENTS, FONTS, THEMES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useActiveEditor } from "@/lib/editorRegistry";
import { cycleDocSize, cycleDocSpacing, useDocState } from "@/lib/docState";
import {
  cycleTextAlignment,
  insertImage,
  insertLink,
  toggleBlockType,
} from "@/lib/format";

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="insp-section">
      <span className="insp-label">{label}</span>
      {children}
    </section>
  );
}

function InspControl({
  icon: Icon,
  label,
  active,
  disabled,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={cn("insp-control", active && "is-active")}
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
    >
      <Icon size={14} strokeWidth={1.9} className="shrink-0 text-faint" />
      <span className="min-w-0 flex-1 truncate">{label}</span>
    </button>
  );
}

/**
 * Floating style studio — appears over the right edge of the workspace.
 * Theme accent, typography, and structure tools in one quiet surface.
 */
export function Inspector() {
  const editor = useActiveEditor();
  const doc = useDocState();
  const { settings, setSettings, activeNote, emojiOpen, setEmojiOpen } = useStore();
  const [fontOpen, setFontOpen] = useState(false);
  const fontWrapRef = useRef<HTMLDivElement>(null);
  const fontBtnRef = useRef<HTMLButtonElement>(null);

  /* Escape + outside-click dismissal with focus return to the trigger. A
     fixed backdrop would be trapped by the panel's backdrop-filter, so the
     menu closes from a document-level pointer listener instead. */
  useEffect(() => {
    if (!fontOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setFontOpen(false);
        fontBtnRef.current?.focus();
      }
    };
    const onPointerDown = (e: PointerEvent) => {
      if (fontWrapRef.current && !fontWrapRef.current.contains(e.target as Node)) {
        setFontOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [fontOpen]);

  const font = FONTS.find((item) => item.id === settings.font) ?? FONTS[1];

  return (
    <aside className="floating-panel inspector animate-slide-left">
      <Section label="Appearance">
        <div className="seg" role="group" aria-label="Theme">
          {THEMES.map((mode) => (
            <button
              key={mode.id}
              onClick={() => setSettings({ theme: mode.id })}
              className={cn(settings.theme === mode.id && "is-active")}
              aria-pressed={settings.theme === mode.id}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </Section>

      <Section label="Accent">
        <div className="flex gap-2">
          {ACCENTS.map((accent) => {
            const active = settings.accent === accent.id;
            return (
              <button
                key={accent.id}
                onClick={() => setSettings({ accent: accent.id })}
                className={cn("theme-swatch", active && "is-active")}
                style={{ backgroundColor: accent.swatch }}
                aria-label={accent.label}
                aria-pressed={active}
              >
                <span className="font-editor-georgia text-[12px]">Aa</span>
                {active && <Check className="absolute right-1 top-1 size-2.5" />}
              </button>
            );
          })}
        </div>
      </Section>

      <span className="insp-rule" aria-hidden />

      <Section label="Typography">
        <div className="relative" ref={fontWrapRef}>
          <button
            ref={fontBtnRef}
            onClick={() => setFontOpen(!fontOpen)}
            disabled={!editor}
            className="font-selector"
            aria-label="Editor font"
            aria-expanded={fontOpen}
          >
            <span className={cn("text-[30px] leading-none", font.className)}>Aa</span>
            <span className="flex w-full items-center justify-between">
              <span className="text-[11px] font-medium text-foreground">{font.label}</span>
              <ChevronDown size={13} className="text-faint" />
            </span>
          </button>
          {fontOpen && (
            <div className="animate-menu absolute left-0 top-full z-50 mt-2 w-full overflow-hidden rounded-[10px] border border-border bg-panel-solid p-1 shadow-(--shadow-floating)">
              {FONTS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setSettings({ font: item.id });
                    setFontOpen(false);
                    fontBtnRef.current?.focus();
                  }}
                  className={cn("insp-control w-full", settings.font === item.id && "is-active")}
                >
                  <span className={cn("text-[15px]", item.className)}>Aa</span>
                  <span className="flex-1 text-left">{item.label}</span>
                  {settings.font === item.id && <Check size={12} />}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="mt-1 grid grid-cols-2 gap-2">
          <button
            className="insp-control"
            onClick={cycleDocSize}
            disabled={!editor}
            aria-label="Text size"
          >
            <Minus size={13} className="shrink-0 text-faint" />
            <span className="min-w-0 flex-1 truncate text-left">{doc.sizeLabel}</span>
            <Plus size={13} className="shrink-0 text-faint" />
          </button>
          <button
            className="insp-control"
            onClick={cycleDocSpacing}
            disabled={!editor}
            aria-label="Line spacing"
          >
            <span className="min-w-0 flex-1 truncate text-left">Spacing</span>
            <span className="text-[10px] text-faint">{doc.spacingLabel}</span>
          </button>
        </div>

        <button
          className="insp-control"
          onClick={() => editor && cycleTextAlignment(editor)}
          disabled={!editor}
          aria-label="Text alignment"
        >
          <span className="min-w-0 flex-1 truncate text-left">Alignment</span>
        </button>
      </Section>

      <span className="insp-rule" aria-hidden />

      <Section label="Structure">
        <div className="flex flex-col gap-1">
          <InspControl
            icon={List}
            label="Bulleted list"
            disabled={!editor}
            onClick={() => editor && toggleBlockType(editor, "bulletListItem")}
          />
          <InspControl
            icon={ListOrdered}
            label="Numbered list"
            disabled={!editor}
            onClick={() => editor && toggleBlockType(editor, "numberedListItem")}
          />
          <InspControl icon={Link2} label="Link" disabled={!editor} onClick={() => editor && insertLink(editor)} />
          <InspControl icon={Image} label="Image" disabled={!editor} onClick={() => editor && insertImage(editor)} />
          <InspControl
            icon={Smile}
            label="Emoji"
            active={emojiOpen}
            disabled={!activeNote}
            onClick={() => setEmojiOpen(!emojiOpen)}
          />
        </div>
      </Section>
    </aside>
  );
}
