"use client";

import { useEffect, useState } from "react";
import type { BlockNoteEditor } from "@blocknote/core";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  CheckSquare,
  Image,
  Italic,
  Link2,
  List,
  ListOrdered,
  Smile,
  Strikethrough,
  Underline,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { useActiveEditor } from "@/lib/editorRegistry";
import {
  cycleTextAlignment,
  insertImage,
  insertLink,
  toggleBlockType,
  toggleStyle,
} from "@/lib/format";

function useActiveStyles(editor: BlockNoteEditor | null) {
  const [styles, setStyles] = useState<Record<string, boolean | string>>({});
  useEffect(() => {
    if (!editor) return;
    const update = () => {
      try {
        setStyles(editor.getActiveStyles() as Record<string, boolean | string>);
      } catch {
        /* no active selection */
      }
    };
    const selection = editor.onSelectionChange(update);
    const change = editor.onChange(update);
    return () => {
      selection();
      change();
    };
  }, [editor]);
  return styles;
}

function FmtButton({
  icon: Icon,
  label,
  active,
  onClick,
  iconSize = 15,
}: {
  icon: React.ElementType;
  label: string;
  active?: boolean;
  onClick: () => void;
  iconSize?: number;
}) {
  return (
    <button
      className={cn("format-btn", active && "is-active")}
      onClick={onClick}
      title={label}
      aria-label={label}
      aria-pressed={active}
    >
      <Icon size={iconSize} strokeWidth={1.9} />
    </button>
  );
}

/**
 * The contextual format bar — floats over the top of the document while a
 * note is open. Adobe-style contextual chrome, Notion-sized controls.
 */
export function FormatBar() {
  const editor = useActiveEditor();
  const styles = useActiveStyles(editor);
  const { activeNote, emojiOpen, setEmojiOpen } = useStore();

  if (!editor || !activeNote) return null;

  const alignment =
    (() => {
      try {
        return (editor.getTextCursorPosition().block.props as { textAlignment?: string }).textAlignment ?? "left";
      } catch {
        return "left";
      }
    })();

  const emoji = () => setEmojiOpen(!emojiOpen);

  return (
    <div className="format-bar animate-pop" role="toolbar" aria-label="Formatting">
      <FmtButton icon={Bold} label="Bold" active={Boolean(styles.bold)} onClick={() => toggleStyle(editor, "bold")} />
      <FmtButton icon={Italic} label="Italic" active={Boolean(styles.italic)} onClick={() => toggleStyle(editor, "italic")} />
      <FmtButton icon={Underline} label="Underline" active={Boolean(styles.underline)} onClick={() => toggleStyle(editor, "underline")} />
      <FmtButton icon={Strikethrough} label="Strikethrough" active={Boolean(styles.strike)} onClick={() => toggleStyle(editor, "strike")} />

      <span className="format-sep" />

      <FmtButton
        icon={alignment === "left" ? AlignLeft : alignment === "center" ? AlignCenter : AlignRight}
        label="Text alignment"
        onClick={() => cycleTextAlignment(editor)}
      />
      <FmtButton icon={List} label="Bulleted list" onClick={() => toggleBlockType(editor, "bulletListItem")} />
      <FmtButton icon={ListOrdered} label="Numbered list" onClick={() => toggleBlockType(editor, "numberedListItem")} />
      <FmtButton icon={CheckSquare} label="To-do" onClick={() => toggleBlockType(editor, "checkListItem")} />

      <span className="format-sep" />

      <FmtButton icon={Link2} label="Link" onClick={() => insertLink(editor)} />
      <FmtButton icon={Image} label="Image" onClick={() => insertImage(editor)} />
      <FmtButton icon={Smile} label="Emoji" active={emojiOpen} onClick={emoji} />
    </div>
  );
}
