import test from "node:test";
import assert from "node:assert/strict";

import { AIService } from "@/server/ai/services/ai-service";

const service = new AIService();

test("runPlayground returns output that references the selected artifact and task", async () => {
  const result = await service.runPlayground({
    artifact: {
      type: "writing_style",
      title: "writing-style.md",
      content: "# Writing Style Guide\n\n## Structure Preferences\n- 先给主线。",
      version: 2,
    },
    workspaceProfile: {
      identity: "写作者",
      primaryScenarios: ["写长文"],
      rememberNotes: "要有主线。",
      outputPreferences: ["高信息密度", "结构清楚"],
    },
    task: "写一篇关于 AGENTS.md 的博客",
  });

  assert.match(result.output.output, /writing-style\.md v2/);
  assert.match(result.output.output, /写一篇关于 AGENTS\.md 的博客/);
  assert.equal(result.log.promptName, "playground-run");
  assert.ok(result.log.inputTokens > 0);
  assert.ok(result.log.outputTokens > 0);
  assert.ok(result.log.durationMs > 0);
});

test("convertFeedbackToProposal turns scattered feedback into a writing proposal", async () => {
  const result = await service.convertFeedbackToProposal({
    artifactType: "writing_style",
    task: "写一篇关于 AGENTS.md 的博客",
    output: "分点很多，但是主线不明显。",
    feedbackType: "too_scattered",
    feedbackText: "分点多但没有主线。",
  });

  assert.equal(result.output.proposals[0]?.category, "writing");
  assert.match(result.output.proposals[0]?.proposedContent ?? "", /主线/);
  assert.equal(result.log.promptVersion, "v1");
  assert.equal(result.log.retryCount, 0);
});
