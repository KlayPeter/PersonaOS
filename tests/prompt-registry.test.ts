import test from "node:test";
import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import path from "node:path";

import { promptRegistry } from "@/server/ai/prompt-registry";

test("prompt registry tracks valid versions and prompt file paths", async () => {
  const entries = Object.entries(promptRegistry);

  assert.ok(entries.length >= 4);

  for (const [name, spec] of entries) {
    assert.match(name, /^[a-z-]+$/);
    assert.match(spec.version, /^v\d+$/);

    if (spec.systemPromptPath) {
      await access(path.join(process.cwd(), spec.systemPromptPath));
    }
  }
});
