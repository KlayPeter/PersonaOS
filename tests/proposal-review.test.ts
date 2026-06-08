import test from "node:test";
import assert from "node:assert/strict";
import { ProposalStatus } from "@prisma/client";

import { buildProposalReviewSnapshot } from "@/server/evals/proposal-review";

test("proposal review snapshot computes rates and samples", () => {
  const now = new Date();
  const snapshot = buildProposalReviewSnapshot([
    {
      id: "p1",
      title: "结构化表达规则",
      category: "writing",
      proposedContent: "长文必须先明确主线，再按层次展开。",
      reason: "用户强调主线和结构。",
      evidence: "太散，不是要短。",
      status: ProposalStatus.accepted,
      confidence: 0.9,
      updatedAt: now,
      material: { title: "结构反馈" },
      insight: { title: "偏好清晰结构" },
    },
    {
      id: "p2",
      title: "补充 PersonaOS 个性化协作规则",
      category: "ai_collaboration",
      proposedContent: "当前反馈说明还有可细化空间，需要形成更明确的修正规则。",
      reason: "反馈暴露了问题。",
      evidence: "用户说不够具体。",
      status: ProposalStatus.edited,
      confidence: 0.82,
      updatedAt: new Date(now.getTime() - 1000),
      material: { title: "反馈案例" },
      insight: { title: "反模板化" },
    },
    {
      id: "p3",
      title: "删除无用规则",
      category: "product",
      proposedContent: "删掉它。",
      reason: "不适合当前产品。",
      evidence: "误报。",
      status: ProposalStatus.rejected,
      confidence: 0.91,
      updatedAt: new Date(now.getTime() - 2000),
      material: { title: "误报案例" },
      insight: { title: "边界冲突" },
    },
  ]);

  assert.equal(snapshot.acceptedCount, 1);
  assert.equal(snapshot.editedCount, 1);
  assert.equal(snapshot.rejectedCount, 1);
  assert.equal(snapshot.decisionCount, 3);
  assert.equal(snapshot.acceptanceRate, 0.3333);
  assert.equal(snapshot.editedRate, 0.3333);
  assert.equal(snapshot.vagueCount, 2);
  assert.ok(snapshot.sample.length > 0);
  assert.match(snapshot.sample[0]?.reviewReason ?? "", /复查/);
});
