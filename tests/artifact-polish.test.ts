import assert from "node:assert/strict";
import test from "node:test";

import { AIService } from "@/server/ai/services/ai-service";

const service = new AIService();

test("polishArtifact keeps markdown structure and exposes prompt metadata", async () => {
  const result = await service.polishArtifact({
    type: "agents_md",
    title: "AGENTS.md",
    content: [
      "# AGENTS.md",
      "",
      "## Validation Requirements",
      "",
      "- 修改后优先通过可复现、可检查的方式验证结果。",
      "- 对关键步骤保留可追踪输入输出，避免不可复盘的隐式变更。",
      "",
    ].join("\n"),
  });

  assert.match(result.output.content, /^# AGENTS\.md/m);
  assert.match(result.output.content, /## Validation Requirements/);
  assert.match(result.output.content, /优先采用/);
  assert.equal(result.log.promptName, "artifact-polish");
  assert.equal(result.log.promptVersion, "v1");
});
