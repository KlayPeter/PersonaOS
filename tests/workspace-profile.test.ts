import test from "node:test";
import assert from "node:assert/strict";

import { AIService } from "@/server/ai/services/ai-service";
import { promptRegistry } from "@/server/ai/prompt-registry";

test("generateWorkspaceProfileSummary builds an initial profile summary", async () => {
  const service = new AIService();
  const result = await service.generateWorkspaceProfileSummary({
    name: "Writer Workspace",
    description: "沉淀个人写作与协作偏好",
    identity: "技术写作者",
    primaryScenarios: ["写长文", "改稿"],
    rememberNotes: "重视信息密度和主线。",
    dislikedBehaviors: ["空话", "模板腔"],
    outputPreferences: ["结构清楚", "有例子"],
    exportGoals: ["writing-style.md", "personal-system.md"],
  });

  assert.match(result.output.profileSummary, /技术写作者/);
  assert.match(result.output.profileSummary, /写长文/);
  assert.match(result.output.profileSummary, /结构清楚/);
  assert.equal(result.log.promptName, "workspace-profile-init");
});

test("prompt registry includes workspace profile init prompt", () => {
  assert.equal(promptRegistry["workspace-profile-init"].version, "v1");
  assert.equal(
    promptRegistry["workspace-profile-init"].systemPromptPath,
    "src/server/ai/prompts/workspace-profile-init/system.md",
  );
});
