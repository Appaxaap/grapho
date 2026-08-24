import assert from "node:assert/strict";
import test from "node:test";

const validBlock = { id: "b1", type: "paragraph", text: "Hello" };
const validDocument = { id: "d1", title: "Test", folder: "Projects", updated: "Just now", blocks: [validBlock] };

function isBlock(value) {
  return Boolean(value && typeof value === "object" && typeof value.id === "string" && typeof value.type === "string" && typeof value.text === "string");
}

function isDocument(value) {
  return Boolean(value && typeof value === "object" && typeof value.id === "string" && value.id.length > 0 && typeof value.title === "string" && typeof value.folder === "string" && Array.isArray(value.blocks) && value.blocks.length > 0 && value.blocks.every(isBlock));
}

function isPayload(value) {
  return Boolean(value && value.version === 1 && Array.isArray(value.documents) && value.documents.length > 0 && value.documents.every(isDocument) && typeof value.selectedId === "string" && typeof value.activeFolder === "string");
}

test("accepts a valid workspace payload", () => {
  assert.equal(isPayload({ version: 1, documents: [validDocument], selectedId: "d1", activeFolder: "Projects" }), true);
});

test("rejects malformed or empty storage", () => {
  assert.equal(isPayload(null), false);
  assert.equal(isPayload({ version: 1, documents: [], selectedId: "d1", activeFolder: "Projects" }), false);
  assert.equal(isPayload({ version: 1, documents: [{ ...validDocument, blocks: [] }], selectedId: "d1", activeFolder: "Projects" }), false);
  assert.equal(isPayload({ version: 2, documents: [validDocument], selectedId: "d1", activeFolder: "Projects" }), false);
});

test("preserves trash metadata as valid document state", () => {
  assert.equal(isDocument({ ...validDocument, trashed: true, deletedAt: new Date().toISOString() }), true);
});
