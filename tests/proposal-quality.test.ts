import test from "node:test";
import assert from "node:assert/strict";

import { isActionableProposal, isVagueProposal } from "@/server/evals/proposal-quality";

test("proposal quality rules flag vague proposals", () => {
  const result = isVagueProposal({
    title: "补充 PersonaOS 个性化协作规则",
    proposedContent: "当前反馈说明还有可细化空间，需要形成更明确的修正规则。",
  });

  assert.equal(result, true);
});

test("proposal quality rules keep executable proposals actionable", () => {
  const actionable = isActionableProposal({
    title: "补充结构化表达规则",
    proposedContent: "长文必须先明确主线，再按层次展开，并通过标题和步骤控制阅读路径。",
  });

  assert.equal(actionable, true);
  assert.equal(
    isVagueProposal({
      title: "补充结构化表达规则",
      proposedContent: "长文必须先明确主线，再按层次展开，并通过标题和步骤控制阅读路径。",
    }),
    false,
  );
});
