import type { Block } from "./model";

const SECTION_NAMES = /^(?:background|confidentiality|dispute resolution|effective date|governing law|obligations|parties|purpose|scope|term|termination|signatures?|intellectual property|non-binding provisions?)$/i;

export function isMemorandumOfUnderstanding(text: string): boolean {
  const normalized = text.replace(/\s+/g, " ").trim();
  const signals = [
    /memorandum\s+of\s+understanding|\bMOU\b/i,
    /\bpart(?:y|ies)\b|between\s+.+\s+and\s+/i,
    /effective\s+date|commencement\s+date/i,
    /purpose|scope|obligations|responsibilities/i,
    /term|termination|confidentiality|governing\s+law/i,
    /\bsignatures?\b|authorized\s+representative/i,
  ];
  const score = signals.filter((signal) => signal.test(normalized)).length;
  return score >= 4 || (score >= 3 && signals[0].test(normalized));
}

export function formatMemorandumOfUnderstanding(rawText: string, makeId: () => string): { blocks: Block[]; title?: string } {
  const lines = rawText.replace(/\r/g, "").split("\n").map((line) => line.trim()).filter(Boolean);
  const blocks: Block[] = [];
  let title: string | undefined;

  for (const line of lines) {
    const cleaned = cleanLine(line);
    if (!cleaned) continue;

    if (isMouTitle(cleaned) && !title) {
      title = cleaned.replace(/^(?:#\s*)?memorandum\s+of\s+understanding\s*[-:]?\s*/i, "Memorandum of Understanding").trim();
      if (title.toLowerCase() === "memorandum of understanding") title = "Memorandum of Understanding";
      blocks.push({ id: makeId(), type: "heading", text: title });
      continue;
    }

    const section = cleaned.match(/^(?:(\d+(?:\.\d+)*)[.)]?\s+)?(.+?)\s*:?$/);
    const sectionName = section?.[2]?.trim() ?? cleaned;
    const numberedSection = Boolean(section?.[1] && !/^\d+\s+(?:days?|months?|years?)/i.test(cleaned));
    if (SECTION_NAMES.test(sectionName) || (numberedSection && sectionName.split(/\s+/).length <= 8) || /^article\s+\w+/i.test(cleaned)) {
      blocks.push({ id: makeId(), type: "heading", text: sectionName });
      continue;
    }

    if (/^(?:[-*•]|\(\w\)|[a-z]\))\s+/i.test(cleaned)) {
      blocks.push({ id: makeId(), type: "list", text: cleanLine(cleaned.replace(/^(?:[-*•]|\(\w\)|[a-z]\))\s+/i, "")) });
      continue;
    }

    if (/^(?:between|among|this memorandum|this mou|the parties)/i.test(cleaned)) {
      blocks.push({ id: makeId(), type: "quote", text: cleaned });
      continue;
    }

    blocks.push({ id: makeId(), type: "paragraph", text: cleaned });
  }

  return { blocks, title };
}

function isMouTitle(value: string) {
  return /^(?:#\s*)?(?:memorandum\s+of\s+understanding|MOU)\b/i.test(value);
}

function cleanLine(value: string) {
  return value.replace(/^#{1,6}\s+/, "").replace(/\s+/g, " ").trim();
}
