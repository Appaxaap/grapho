import type { Block } from "@blocknote/core";
import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
  pdf,
} from "@react-pdf/renderer";
import type { Style } from "@react-pdf/types";
import type { ExportSettings, Note } from "./types";
import { MARGIN_PRESETS } from "./constants";
import { formatDate } from "./utils";

/* ------------------------------------------------------------------ *
 * Templates — all use built-in PDF fonts so export works fully offline.
 * ------------------------------------------------------------------ */

type TemplateStyles = {
  body: Style;
  paragraph: Style;
  heading1: Style;
  heading2: Style;
  heading3: Style;
  heading4: Style;
  bullet: Style;
  bulletText: Style;
  numbered: Style;
  numberedText: Style;
  check: Style;
  checkText: Style;
  quote: Style;
  codeBlock: Style;
  codeText: Style;
  divider: Style;
  table: Style;
  tableRow: Style;
  tableHeaderCell: Style;
  tableCell: Style;
  header: Style;
  headerTitle: Style;
  headerDate: Style;
  footer: Style;
  footerText: Style;
  listItem: Style;
  nested: Style;
  image: Style;
  caption: Style;
};

function templateStyles(template: ExportSettings["template"]): TemplateStyles {
  if (template === "academic") {
    return StyleSheet.create({
      body: { fontFamily: "Times-Roman", fontSize: 12, lineHeight: 1.5, color: "#1c1917" },
      paragraph: { marginBottom: 8 },
      heading1: { fontFamily: "Times-Bold", fontSize: 22, marginBottom: 10, marginTop: 4 },
      heading2: { fontFamily: "Times-Bold", fontSize: 17, marginBottom: 8, marginTop: 14 },
      heading3: { fontFamily: "Times-Bold", fontSize: 14, marginBottom: 6, marginTop: 10 },
      heading4: { fontFamily: "Times-Bold", fontSize: 12, marginBottom: 4, marginTop: 8 },
      bullet: { flexDirection: "row", marginBottom: 3 },
      bulletText: { flex: 1 },
      numbered: { flexDirection: "row", marginBottom: 3 },
      numberedText: { flex: 1 },
      check: { flexDirection: "row", marginBottom: 3 },
      checkText: { flex: 1 },
      quote: {
        marginBottom: 10,
        marginTop: 2,
        paddingLeft: 12,
        borderLeftWidth: 2,
        borderLeftColor: "#a8a29e",
        color: "#57534e",
        fontStyle: "italic",
      },
      codeBlock: {
        backgroundColor: "#f5f5f4",
        padding: 10,
        borderRadius: 3,
        marginBottom: 8,
      },
      codeText: { fontFamily: "Courier", fontSize: 10, lineHeight: 1.45 },
      divider: { borderTopWidth: 1, borderTopColor: "#d6d3d1", marginVertical: 10 },
      table: { marginBottom: 8, borderWidth: 0.5, borderColor: "#d6d3d1" },
      tableRow: { flexDirection: "row" },
      tableHeaderCell: {
        flex: 1,
        padding: 4,
        fontSize: 10,
        fontFamily: "Times-Bold",
        backgroundColor: "#f5f5f4",
      },
      tableCell: { flex: 1, padding: 4, fontSize: 10 },
      header: {
        flexDirection: "row",
        justifyContent: "space-between",
        borderBottomWidth: 1,
        borderBottomColor: "#d6d3d1",
        paddingBottom: 6,
        marginBottom: 16,
      },
      headerTitle: { fontFamily: "Times-Bold", fontSize: 10, color: "#57534e" },
      headerDate: { fontFamily: "Times-Roman", fontSize: 10, color: "#78716c" },
      footer: {
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 24,
        alignItems: "center",
      },
      footerText: { fontSize: 9, color: "#a8a29e", fontFamily: "Times-Roman" },
      listItem: { width: 16 },
      nested: { marginLeft: 14 },
      image: { maxWidth: 420, marginBottom: 4 },
      caption: { fontSize: 9, color: "#78716c", marginBottom: 8, fontStyle: "italic" },
    });
  }

  const accent = template === "modern" ? "#4f46e5" : "#1c1917";
  return StyleSheet.create({
    body: { fontFamily: "Helvetica", fontSize: 11, lineHeight: 1.55, color: "#1c1917" },
    paragraph: { marginBottom: 7 },
    heading1: { fontFamily: "Helvetica-Bold", fontSize: 22, marginBottom: 10, marginTop: 4 },
    heading2: { fontFamily: "Helvetica-Bold", fontSize: 16, marginBottom: 8, marginTop: 12 },
    heading3: { fontFamily: "Helvetica-Bold", fontSize: 13, marginBottom: 6, marginTop: 8 },
    heading4: { fontFamily: "Helvetica-Bold", fontSize: 11, marginBottom: 4, marginTop: 6 },
    bullet: { flexDirection: "row", marginBottom: 3 },
    bulletText: { flex: 1 },
    numbered: { flexDirection: "row", marginBottom: 3 },
    numberedText: { flex: 1 },
    check: { flexDirection: "row", marginBottom: 3 },
    checkText: { flex: 1 },
    quote: {
      marginBottom: 9,
      marginTop: 2,
      paddingLeft: 12,
      borderLeftWidth: 3,
      borderLeftColor: accent,
      color: "#57534e",
    },
    codeBlock: {
      backgroundColor: template === "modern" ? "#eef2ff" : "#f5f5f4",
      padding: 10,
      borderRadius: 3,
      marginBottom: 7,
    },
    codeText: { fontFamily: "Courier", fontSize: 9.5, lineHeight: 1.45 },
    divider: { borderTopWidth: 1, borderTopColor: "#d6d3d1", marginVertical: 9 },
    table: { marginBottom: 8, borderWidth: 0.5, borderColor: "#d6d3d1" },
    tableRow: { flexDirection: "row" },
    tableHeaderCell: {
      flex: 1,
      padding: 4,
      fontSize: 9.5,
      fontFamily: "Helvetica-Bold",
      backgroundColor: template === "modern" ? "#eef2ff" : "#f5f5f4",
    },
    tableCell: { flex: 1, padding: 4, fontSize: 9.5 },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      borderBottomWidth: 1,
      borderBottomColor: accent,
      paddingBottom: 6,
      marginBottom: 16,
    },
    headerTitle: { fontFamily: "Helvetica-Bold", fontSize: 10, color: accent },
    headerDate: { fontFamily: "Helvetica", fontSize: 9, color: "#78716c" },
    footer: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 24,
      alignItems: "center",
    },
    footerText: { fontSize: 9, color: "#a8a29e", fontFamily: "Helvetica" },
    listItem: { width: 16 },
    nested: { marginLeft: 14 },
    image: { maxWidth: 420, marginBottom: 4 },
    caption: { fontSize: 9, color: "#78716c", marginBottom: 8 },
  });
}

/* ------------------------------------------------------------------ *
 * Inline + block → PDF elements
 * ------------------------------------------------------------------ */

interface InlineLike {
  type?: string;
  text?: string;
  styles?: Record<string, unknown>;
  content?: unknown;
  href?: string;
}

function inlineToPdf(content: unknown) {
  if (!content) return "";
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  const parts: React.ReactNode[] = [];
  for (let i = 0; i < content.length; i++) {
    const item = content[i];
    if (typeof item === "string") {
      parts.push(item);
      continue;
    }
    const t = item as InlineLike;
    if (t?.type === "text") {
      const s = t.styles ?? {};
      let text: React.ReactNode = typeof t.text === "string" ? t.text : "";
      if (s.code)
        text = (
          <Text key={i} style={{ fontFamily: "Courier", fontSize: 9 }}>
            {text}
          </Text>
        );
      if (s.strike)
        text = <Text key={i} style={{ textDecoration: "line-through" }}>{text}</Text>;
      if (s.underline)
        text = <Text key={i} style={{ textDecoration: "underline" }}>{text}</Text>;
      if (s.italic)
        text = <Text key={i} style={{ fontStyle: "italic" }}>{text}</Text>;
      if (s.bold)
        text = <Text key={i} style={{ fontFamily: "Helvetica-Bold" }}>{text}</Text>;
      parts.push(text);
    } else if (t?.type === "link") {
      parts.push(
        <Text key={i} style={{ color: "#4f46e5", textDecoration: "underline" }}>
          {inlineToPdf(t.content)}
        </Text>
      );
    }
  }
  return parts;
}

function isHttpUrl(url: string): boolean {
  return /^(https?:|data:)/i.test(url);
}

function blocksToPdf(
  blocks: Block[],
  styles: TemplateStyles,
  numbered: { count: number } = { count: 0 }
): React.ReactNode[] {
  const out: React.ReactNode[] = [];

  for (const block of blocks) {
    const type = block.type as string;
    const text = inlineToPdf(block.content);
    const children = block.children?.length
      ? blocksToPdf(block.children, styles, numbered)
      : null;
    const nested = children ? <View style={styles.nested}>{children}</View> : null;

    switch (type) {
      case "heading": {
        const level = (block.props as { level?: number }).level ?? 1;
        const style =
          level <= 1
            ? styles.heading1
            : level === 2
              ? styles.heading2
              : level === 3
                ? styles.heading3
                : styles.heading4;
        out.push(
          <Text key={block.id} style={style}>
            {text}
          </Text>
        );
        break;
      }
      case "bulletListItem":
        out.push(
          <View key={block.id} style={styles.bullet}>
            <Text style={styles.listItem}>•</Text>
            <Text style={styles.bulletText}>
              {text}
              {nested}
            </Text>
          </View>
        );
        break;
      case "numberedListItem": {
        numbered.count += 1;
        out.push(
          <View key={block.id} style={styles.numbered}>
            <Text style={styles.listItem}>{numbered.count}.</Text>
            <Text style={styles.numberedText}>
              {text}
              {nested}
            </Text>
          </View>
        );
        break;
      }
      case "checkListItem": {
        const checked = (block.props as { checked?: boolean }).checked;
        out.push(
          <View key={block.id} style={styles.check}>
            <Text style={styles.listItem}>{checked ? "☑" : "☐"}</Text>
            <Text style={styles.checkText}>
              {text}
              {nested}
            </Text>
          </View>
        );
        break;
      }
      case "quote":
        out.push(
          <View key={block.id} style={styles.quote}>
            <Text>{text}</Text>
            {nested}
          </View>
        );
        break;
      case "codeBlock":
        out.push(
          <View key={block.id} style={styles.codeBlock}>
            <Text style={styles.codeText} wrap={false}>
              {text}
            </Text>
          </View>
        );
        break;
      case "divider":
        out.push(<View key={block.id} style={styles.divider} />);
        break;
      case "image": {
        const url = (block.props as { url?: string }).url ?? "";
        const caption = inlineToTextForPdf(block.content);
        if (url && isHttpUrl(url)) {
          out.push(
            <View key={block.id} style={{ marginBottom: 8 }}>
              {/* react-pdf's <Image> renders a PDF raster, not an HTML <img>. */}
              {/* eslint-disable-next-line jsx-a11y/alt-text -- PDF component, not an HTML img */}
              <Image src={url} style={styles.image} />
              {caption ? <Text style={styles.caption}>{caption}</Text> : null}
            </View>
          );
        }
        break;
      }
      case "table": {
        const rows = (block.children ?? []) as Block[];
        if (rows.length === 0) break;
        out.push(
          <View key={block.id} style={styles.table}>
            {rows.map((row, ri) => (
              <View key={row.id} style={styles.tableRow}>
                {(row.children ?? []).map((cell, ci) => (
                  <Text
                    key={(cell as Block).id ?? ci}
                    style={ri === 0 ? styles.tableHeaderCell : styles.tableCell}
                  >
                    {inlineToPdf((cell as Block).content)}
                  </Text>
                ))}
              </View>
            ))}
          </View>
        );
        break;
      }
      case "columnList":
        out.push(
          <View key={block.id} style={{ flexDirection: "row", gap: 12, marginBottom: 8 }}>
            {(block.children ?? []).map((col) => (
              <View key={col.id} style={{ flex: 1 }}>
                {blocksToPdf((col as Block).children ?? [], styles, numbered)}
              </View>
            ))}
          </View>
        );
        break;
      default:
        out.push(
          <Text key={block.id} style={styles.paragraph}>
            {text}
          </Text>
        );
    }
  }
  return out;
}

function inlineToTextForPdf(content: unknown): string {
  if (!content) return "";
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  return content
    .map((item) => {
      if (typeof item === "string") return item;
      const t = item as InlineLike;
      return typeof t?.text === "string" ? t.text : "";
    })
    .join("");
}

/* ------------------------------------------------------------------ *
 * Document + export
 * ------------------------------------------------------------------ */

function NoteDocument({
  note,
  settings,
  exportDate,
}: {
  note: Note;
  settings: ExportSettings;
  exportDate: string;
}) {
  const styles = templateStyles(settings.template);
  const margin = MARGIN_PRESETS.find((m) => m.id === settings.margins)?.points ?? 72;

  return (
    <Document title={note.title} author="Grapho" subject="Exported from Grapho">
      <Page
        size={settings.pageSize}
        orientation={settings.orientation}
        style={{
          paddingTop: margin,
          paddingBottom: margin,
          paddingHorizontal: margin,
        }}
      >
        {settings.header ? (
          <View fixed style={styles.header}>
            <Text style={styles.headerTitle}>{note.title}</Text>
            <Text style={styles.headerDate}>{exportDate}</Text>
          </View>
        ) : null}
        {blocksToPdf(note.content, styles)}
        {settings.footer ? (
          <View fixed style={styles.footer}>
            <Text
              style={styles.footerText}
              render={({ pageNumber, totalPages }) =>
                `Grapho · ${note.title} · Page ${pageNumber} of ${totalPages}`
              }
            />
          </View>
        ) : null}
      </Page>
    </Document>
  );
}

/** Render the note to a PDF Blob (client-side, fully offline). */
export async function renderNoteToPdfBlob(
  note: Note,
  settings: ExportSettings
): Promise<Blob> {
  const exportDate = formatDate(Date.now());
  const doc = pdf(<NoteDocument note={note} settings={settings} exportDate={exportDate} />);
  return doc.toBlob();
}

/** Render the note to a PDF Buffer (Node-side, used by the smoke test). */
export async function renderNoteToPdfBuffer(
  note: Note,
  settings: ExportSettings
): Promise<Buffer> {
  const exportDate = formatDate(Date.now());
  const doc = pdf(<NoteDocument note={note} settings={settings} exportDate={exportDate} />);
  const stream = await doc.toBuffer();
  const chunks: Buffer[] = [];
  for await (const chunk of stream as AsyncIterable<Buffer>) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}
