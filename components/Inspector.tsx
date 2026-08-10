"use client";

import { useEffect, useState } from "react";
import type { BlockNoteEditor } from "@blocknote/core";
import { AlignLeft, Bold, Check, Image, Italic, Link2, List, Rows3, Smile, Strikethrough, Type, Underline } from "lucide-react";
import { useStore } from "@/lib/store";
import { ACCENTS, FONTS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { insertIntoActiveEditor, useActiveEditor } from "@/lib/editorRegistry";
import { cycleDocSize, cycleDocSpacing, useDocState } from "@/lib/docState";
import { EmojiPicker, type EmojiSelectEvent } from "./EmojiPicker";

function RoundControl({ icon: Icon, label, active, disabled, onClick }: {
  icon: React.ElementType;
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <button className={cn("round-control", active && "is-active")} onClick={onClick} disabled={disabled} aria-label={label} aria-pressed={active}>
        <Icon className="size-4" />
      </button>
      <span className="text-[8px] text-faint">{label}</span>
    </div>
  );
}

function useStyles(editor: BlockNoteEditor | null) {
  const [styles, setStyles] = useState<Record<string, boolean | string>>({});
  useEffect(() => {
    if (!editor) return;
    const update = () => {
      try { setStyles(editor.getActiveStyles() as Record<string, boolean | string>); } catch { /* no text selection */ }
    };
    const selection = editor.onSelectionChange(update);
    const change = editor.onChange(update);
    return () => { selection(); change(); };
  }, [editor]);
  return styles;
}

export function Inspector() {
  const editor = useActiveEditor();
  const styles = useStyles(editor);
  const doc = useDocState();
  const { settings, setSettings, activeNote, emojiOpen, setEmojiOpen } = useStore();
  const [fontOpen, setFontOpen] = useState(false);

  const font = FONTS.find((item) => item.id === settings.font) ?? FONTS[1];

  const toggle = (style: "bold" | "italic" | "underline" | "strike") => {
    if (!editor) return;
    editor.toggleStyles({ [style]: true } as never);
    editor.focus();
  };

  const align = () => {
    if (!editor) return;
    const block = editor.getTextCursorPosition().block;
    const current = (block.props as { textAlignment?: string }).textAlignment ?? "left";
    const order = ["left", "center", "right"] as const;
    const next = order[(order.indexOf(current as typeof order[number]) + 1) % order.length];
    editor.updateBlock(block, { props: { textAlignment: next } } as never);
    editor.focus();
  };

  const bullets = () => {
    if (!editor) return;
    const block = editor.getTextCursorPosition().block;
    editor.updateBlock(block, { type: block.type === "bulletListItem" ? "paragraph" : "bulletListItem" } as never);
    editor.focus();
  };

  const link = () => {
    if (!editor) return;
    const url = window.prompt("Link URL", editor.getSelectedLinkUrl() ?? "https://");
    if (!url) return;
    const selected = editor.getSelectedText().trim();
    if (selected) editor.createLink(url);
    else {
      const text = window.prompt("Link text", "Link");
      if (text) editor.createLink(url, text);
    }
    editor.focus();
  };

  const image = () => {
    if (!editor) return;
    const url = window.prompt("Image URL");
    if (!url) return;
    editor.insertBlocks([{ type: "image", props: { url } } as never], editor.getTextCursorPosition().block, "after");
    editor.focus();
  };

  const emoji = (event: EmojiSelectEvent) => {
    insertIntoActiveEditor(`${event.native} `);
    setEmojiOpen(false);
  };

  return (
    <aside className="floating-panel relative flex h-full min-h-0 flex-col overflow-y-auto px-5 py-5">
      <section>
        <h3 className="inspector-heading">Theme Style</h3>
        <div className="mt-3 flex gap-2">
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
                <span className="font-editor-georgia text-[13px] text-foreground">Aa</span>
                {active && <Check className="absolute right-1 top-1 size-3 text-foreground" />}
              </button>
            );
          })}
        </div>
      </section>

      <div className="section-rule" />

      <section>
        <h3 className="inspector-heading">Text Editor</h3>
        <div className="mt-3 flex gap-3">
          <div className="relative">
            <button onClick={() => setFontOpen(!fontOpen)} disabled={!editor} className="font-selector">
              <span className={cn("text-[27px] leading-none", font.className)}>Aa</span>
              <span className="mt-auto block text-[9px] font-medium">Customize font</span>
              <span className="block text-[8px] text-faint">{font.label}</span>
            </button>
            {fontOpen && (
              <>
                <button className="fixed inset-0 z-40 cursor-default" onClick={() => setFontOpen(false)} aria-label="Close font menu" />
                <div className="font-menu absolute left-0 top-full z-50 mt-2 w-40 p-1">
                  {FONTS.map((item) => (
                    <button key={item.id} onClick={() => { setSettings({ font: item.id }); setFontOpen(false); }} className="font-menu-row">
                      <span className={item.className}>Aa</span><span>{item.label}</span>
                      {settings.font === item.id && <Check className="ml-auto size-3" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          <RoundControl icon={Strikethrough} label="Strike" active={Boolean(styles.strike)} disabled={!editor} onClick={() => toggle("strike")} />
          <RoundControl icon={AlignLeft} label="Alignment" disabled={!editor} onClick={align} />
        </div>

        <div className="mt-4 grid grid-cols-5 gap-2">
          <RoundControl icon={Bold} label="Bold" active={Boolean(styles.bold)} disabled={!editor} onClick={() => toggle("bold")} />
          <RoundControl icon={Italic} label="Italic" active={Boolean(styles.italic)} disabled={!editor} onClick={() => toggle("italic")} />
          <RoundControl icon={Underline} label="Underline" active={Boolean(styles.underline)} disabled={!editor} onClick={() => toggle("underline")} />
          <RoundControl icon={Type} label={doc.sizeLabel} disabled={!editor} onClick={cycleDocSize} />
          <RoundControl icon={Rows3} label={doc.spacingLabel} disabled={!editor} onClick={cycleDocSpacing} />
        </div>
      </section>

      <div className="section-rule" />

      <section>
        <h3 className="inspector-heading">Others</h3>
        <div className="mt-3 grid grid-cols-4 gap-3">
          <RoundControl icon={Image} label="Image" disabled={!editor} onClick={image} />
          <RoundControl icon={Link2} label="Link" disabled={!editor} onClick={link} />
          <RoundControl icon={List} label="Bullets" disabled={!editor} onClick={bullets} />
          <RoundControl icon={Smile} label="Emoji" active={emojiOpen} disabled={!activeNote} onClick={() => setEmojiOpen(!emojiOpen)} />
        </div>
      </section>

      {emojiOpen && (
        <>
          <button className="fixed inset-0 z-40 cursor-default" onClick={() => setEmojiOpen(false)} aria-label="Close emoji picker" />
          <div className="absolute bottom-20 right-4 z-50 overflow-hidden rounded-xl border border-border bg-panel-solid shadow-(--shadow)">
            <EmojiPicker theme="light" onEmojiSelect={emoji} />
          </div>
        </>
      )}
    </aside>
  );
}
