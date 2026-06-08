import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const promptFiles = [
  "src/server/ai/prompts/material-analysis/system.md",
  "src/server/ai/prompts/rule-proposal-generation/system.md",
  "src/server/ai/prompts/feedback-to-proposal/system.md",
  "src/server/ai/prompts/artifact-polish/system.md",
];

test("core prompts include few-shot guidance", async () => {
  for (const promptPath of promptFiles) {
    const content = await readFile(path.join(process.cwd(), promptPath), "utf8");
    assert.match(content, /few-shot/i, `${promptPath} 缺少 few-shot 示例`);
  }
});
