import test from "node:test";
import assert from "node:assert/strict";

import { compileArtifactMarkdown } from "@/server/artifacts/compilers/markdown";

const sampleRules = [
  {
    id: "rule_1",
    workspaceId: "ws_1",
    category: "ai_collaboration",
    title: "控制协作边界",
    content: "不要乱改架构，也不要无理由扩依赖。",
    sourceProposalId: null,
    sourceMaterialId: null,
    status: "active",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "rule_2",
    workspaceId: "ws_1",
    category: "writing",
    title: "保持结构",
    content: "长文应先给主线，再分层展开。",
    sourceProposalId: null,
    sourceMaterialId: null,
    status: "active",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
] as const;

test("compileArtifactMarkdown builds AGENTS markdown sections", () => {
  const content = compileArtifactMarkdown("agents_md", [...sampleRules]);

  assert.match(content, /^# AGENTS\.md/m);
  assert.match(content, /## AI Collaboration Rules/);
  assert.match(content, /不要乱改架构/);
});

test("compileArtifactMarkdown builds writing style markdown sections", () => {
  const content = compileArtifactMarkdown("writing_style", [...sampleRules]);

  assert.match(content, /^# Writing Style Guide/m);
  assert.match(content, /## Structure Preferences/);
  assert.match(content, /长文应先给主线/);
});
