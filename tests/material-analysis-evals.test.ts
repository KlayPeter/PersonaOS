import test from "node:test";
import assert from "node:assert/strict";

import { runMaterialEvals } from "@/server/evals/material-evals";

test("material eval fixtures cover expected insight and proposal directions", async () => {
  const summary = await runMaterialEvals();

  assert.ok(summary.fixtureCount >= 10);
  assert.equal(summary.insightHitCount, summary.insightExpectationCount);
  assert.equal(summary.proposalDirectionHitCount, summary.proposalDirectionCount);
  assert.ok(summary.actionableRate >= 0.8);
  assert.ok(summary.vagueRate <= 0.2);
});
