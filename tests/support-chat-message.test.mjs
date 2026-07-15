import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

const source = await readFile(
  new URL("../src/lib/support-chat-message.ts", import.meta.url),
  "utf8",
);
const { outputText } = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ES2022,
    target: ts.ScriptTarget.ES2022,
  },
});
const { mergeSupportMessage, normalizeSupportMessage } = await import(
  `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`
);

test("normalizes Java LocalDateTime arrays before ordering realtime messages", () => {
  const existing = normalizeSupportMessage({
    id: "old",
    createdAt: "2026-07-15T15:17:00",
  });
  const incoming = { id: "new", createdAt: [2026, 7, 15, 15, 18, 0, 250_000_000] };

  const result = mergeSupportMessage([existing], incoming);

  assert.deepEqual(result.map((message) => message.id), ["old", "new"]);
  assert.equal(Number.isFinite(Date.parse(result[1].createdAt)), true);
});

test("keeps a new message with a missing timestamp at the end", () => {
  const existing = normalizeSupportMessage({ id: "old", createdAt: "2026-07-15T15:17:00" });

  const result = mergeSupportMessage(
    [existing],
    { id: "new", createdAt: null },
    "2026-07-15T15:18:00",
  );

  assert.deepEqual(result.map((message) => message.id), ["old", "new"]);
});

test("a duplicate WebSocket event preserves the valid REST timestamp", () => {
  const restMessage = normalizeSupportMessage({
    id: "same-id",
    content: "Bản REST",
    createdAt: "2026-07-15T15:18:00",
  });

  const result = mergeSupportMessage(
    [restMessage],
    { id: "same-id", content: "Bản realtime", createdAt: null },
    "2026-07-15T15:20:00",
  );

  assert.equal(result.length, 1);
  assert.equal(result[0].content, "Bản realtime");
  assert.equal(result[0].createdAt, restMessage.createdAt);
});
