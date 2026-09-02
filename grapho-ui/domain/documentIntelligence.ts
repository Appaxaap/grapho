import type { Block, DocumentIntelligenceIssue, DocumentIntelligenceResult, DocumentItem, DocumentType, DocumentTypeConfidence, RecognizedField } from "./model";
import { blockText, documentText, visibleBlocks } from "./operations";

type Detection = { type: DocumentType; confidence: DocumentTypeConfidence; score: number };
const rules: [DocumentType, RegExp[], number][] = [
  ["account-register", [/mailbox|account|register/i, /division:/i, /status:\s*(created|proposed)/i, /purpose:/i], 4],
  ["project-brief", [/goal|objective/i, /scope/i, /deliverable|timeline|owner/i, /brief|proposal|plan/i], 3],
  ["meeting-notes", [/attendees|agenda/i, /decisions?|action items?|next steps?/i, /\b20\d{2}\b|\b\d{1,2}[/-]\d{1,2}\b/i], 3],
  ["research-brief", [/question|hypothesis/i, /findings?|evidence/i, /sources?|references?/i], 3],
  ["checklist", [/\[\s?[x ]\s?\]|todo|checklist/i], 2],
  ["voiceover-script", [/episode|voiceover|documentary|script/i, /\b(I'm|I've|we|I)\b/i, /so\.\.\.|welcome back|thank you/i], 2],
  ["photography-plan", [/photography plan|image library|photographs?/i, /\b(?:16:9|4:5|4:3|3:2|21:9)\b/i, /shoot direction|shoot schedule|technical requirements/i], 2],
];

export function detectDocumentType(document: DocumentItem): Detection {
  const text = `${document.title}\n${documentText(document)}`;
  const scored = rules.map(([type, patterns, minimum]) => ({ type, score: patterns.filter((pattern) => pattern.test(text)).length, minimum })).sort((a, b) => b.score - a.score);
  const winner = scored[0];
  if (!winner || winner.score < winner.minimum) return { type: "generic", confidence: "low", score: winner?.score ?? 0 };
  return { type: winner.type, score: winner.score, confidence: winner.score >= winner.minimum + 1 ? "high" : "medium" };
}

export function recognizeFields(document: DocumentItem, type: DocumentType): RecognizedField[] {
  const fields: RecognizedField[] = [];
  const known: Record<string, string> = { type: "type", division: "division", status: "status", purpose: "purpose", owner: "owner", priority: "priority", date: "date", attendees: "attendees", agenda: "agenda", decisions: "decisions", "action items": "action-items", goal: "goal", objective: "objective", scope: "scope", deliverables: "deliverables", sources: "sources", findings: "findings" };
  for (const block of visibleBlocks(document)) for (const line of blockText(block).split("\n")) {
    const match = line.trim().match(/^([A-Za-z][\w -]{1,30}):\s*(.+)$/);
    if (!match) continue;
    const label = match[1].trim(); const key = known[label.toLowerCase()] ?? (type === "generic" ? "" : label.toLowerCase().replace(/\s+/g, "-"));
    if (key) fields.push({ key, label, value: match[2].trim(), blockId: block.id, confidence: known[label.toLowerCase()] ? "high" : "medium" });
  }
  return fields;
}

export type PhotographyAsset = { name: string; description: string; format?: string; category?: string; priority?: number; usages: string[] };
export type PhotographyPlan = { assets: PhotographyAsset[]; priorities: { level: number; count?: number; assets: string[] }[]; sessions: { title: string; assets: string[] }[]; deliveryChecklist: string[] };

export function parsePhotographyPlan(document: DocumentItem): PhotographyPlan | null {
  const text = documentText(document); if (!/photography plan|image slots|image library/i.test(`${document.title}\n${text}`)) return null;
  const assets: PhotographyAsset[] = []; let category = ""; let priority: number | undefined;
  for (const line of text.split("\n")) { const heading = line.match(/^#{1,6}\s+(.*)$/); if (heading) { category = heading[1].trim(); const priorityMatch = category.match(/priority\s+(\d+)/i); priority = priorityMatch ? Number(priorityMatch[1]) : priority; }
    const asset = line.match(/`([A-Za-z][\w-]+)`\s*-\s*(.*)/); if (asset) { const format = asset[2].match(/\b(?:16:9|4:5|4:3|3:2|21:9)\b/)?.[0]; assets.push({ name: asset[1], description: asset[2].trim(), format, category, priority, usages: [] }); }
  }
  const sessions = [...text.matchAll(/###\s+Session\s+\d+:\s*(.*)\n([\s\S]*?)(?=###\s+Session|##\s+Priority|$)/gi)].map((match) => ({ title: match[1].trim(), assets: [...match[2].matchAll(/`([A-Za-z][\w-]+)`/g)].map((item) => item[1]) }));
  const deliveryChecklist = text.split("\n").filter((line) => /^[-*]\s+/.test(line) && /deliver|export|format|rights|alt-text|RAW|negative space/i.test(line)).map((line) => line.replace(/^[-*]\s+/, ""));
  return assets.length ? { assets, priorities: [], sessions, deliveryChecklist } : null;
}

export function analyzeDocument(document: DocumentItem, _documents: DocumentItem[] = [document]): DocumentIntelligenceResult {
  const detection = detectDocumentType(document); const fields = recognizeFields(document, detection.type); const required = detection.type === "account-register" ? ["division", "status", "purpose"] : [];
  const missingFields = required.filter((key) => !fields.some((field) => field.key === key)); const issues: DocumentIntelligenceIssue[] = missingFields.map((key) => ({ id: `${document.id}:missing:${key}`, category: "completeness", severity: "warning", title: `Missing ${key}`, detail: `No ${key} field was found.`, fieldKey: key }));
  const duplicateKeys = [...new Set(fields.map((field) => field.key))].filter((key) => fields.filter((field) => field.key === key).length > 1 && ["status", "date", "owner"].includes(key));
  for (const key of duplicateKeys) issues.push({ id: `${document.id}:duplicate:${key}`, category: "consistency", severity: "info", title: `Multiple ${key} values`, detail: `This document contains more than one ${key} field.`, fieldKey: key });
  const score = required.length ? Math.round(((required.length - missingFields.length) / required.length) * 100) : 100;
  return { version: 1, documentId: document.id, type: detection.type, typeConfidence: detection.confidence, recognizedFields: fields, completeness: { complete: missingFields.length === 0, score, missingFields }, issues, suggestedView: detection.type === "account-register" ? "account-register" : detection.type === "checklist" ? "checklist" : detection.type === "generic" ? "document" : "outline" };
}
