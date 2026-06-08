import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

import { AIService } from "@/server/ai/services/ai-service";
import type { InsightOutput } from "@/server/ai/schemas/insight";
import { isActionableProposal, isVagueProposal } from "@/server/evals/proposal-quality";

export type MaterialEvalFixture = {
  name: string;
  material: {
    title: string;
    type: string;
    summary: string;
    content: string;
  };
  workspaceProfile: {
    identity: string;
    primaryScenarios: string[];
    rememberNotes: string;
    dislikedBehaviors: string[];
    outputPreferences: string[];
  };
  expectedInsightTypes: InsightOutput["insights"][number]["type"][];
  expectedProposalDirections: string[];
};

export type MaterialEvalResult = {
  fixture: MaterialEvalFixture;
  actualInsightTypes: string[];
  proposalCorpus: string;
  missingInsightTypes: string[];
  missingProposalDirections: string[];
  proposalCount: number;
  vagueProposalCount: number;
  actionableProposalCount: number;
};

export type MaterialEvalSummary = {
  fixtureCount: number;
  insightExpectationCount: number;
  insightHitCount: number;
  proposalDirectionCount: number;
  proposalDirectionHitCount: number;
  proposalCount: number;
  vagueProposalCount: number;
  actionableProposalCount: number;
  insightHitRate: number;
  proposalDirectionHitRate: number;
  vagueRate: number;
  actionableRate: number;
  results: MaterialEvalResult[];
};

const fixturesDir = path.join(process.cwd(), "evals", "materials");

function toRate(hit: number, total: number) {
  if (total === 0) {
    return 0;
  }

  return Number((hit / total).toFixed(4));
}

export async function readMaterialEvalFixtures() {
  const files = (await readdir(fixturesDir))
    .filter((file) => file.endsWith(".json"))
    .sort((left, right) => left.localeCompare(right));

  const fixtures = await Promise.all(
    files.map(async (file) => {
      const raw = await readFile(path.join(fixturesDir, file), "utf8");
      return JSON.parse(raw) as MaterialEvalFixture;
    }),
  );

  return fixtures;
}

export async function runMaterialEvals(service = new AIService()): Promise<MaterialEvalSummary> {
  const fixtures = await readMaterialEvalFixtures();
  const results: MaterialEvalResult[] = [];

  for (const fixture of fixtures) {
    const insightResult = await service.analyzeMaterial({
      workspaceProfile: fixture.workspaceProfile,
      material: fixture.material,
      existingRules: [],
    });
    const proposalResult = await service.generateRuleProposals({
      insights: insightResult.output.insights,
      material: {
        title: fixture.material.title,
        type: fixture.material.type,
      },
    });

    const actualInsightTypes = insightResult.output.insights.map((insight) => insight.type);
    const proposalCorpus = proposalResult.output.proposals
      .map((proposal) => [proposal.title, proposal.proposedContent, proposal.reason].join(" "))
      .join("\n")
      .toLowerCase();

    results.push({
      fixture,
      actualInsightTypes,
      proposalCorpus,
      missingInsightTypes: fixture.expectedInsightTypes.filter(
        (expectedType) => !actualInsightTypes.includes(expectedType),
      ),
      missingProposalDirections: fixture.expectedProposalDirections.filter(
        (direction) => !proposalCorpus.includes(direction.toLowerCase()),
      ),
      proposalCount: proposalResult.output.proposals.length,
      vagueProposalCount: proposalResult.output.proposals.filter((proposal) => isVagueProposal(proposal)).length,
      actionableProposalCount: proposalResult.output.proposals.filter((proposal) => isActionableProposal(proposal)).length,
    });
  }

  const insightExpectationCount = results.reduce(
    (total, result) => total + result.fixture.expectedInsightTypes.length,
    0,
  );
  const insightHitCount = results.reduce(
    (total, result) => total + result.fixture.expectedInsightTypes.length - result.missingInsightTypes.length,
    0,
  );
  const proposalDirectionCount = results.reduce(
    (total, result) => total + result.fixture.expectedProposalDirections.length,
    0,
  );
  const proposalDirectionHitCount = results.reduce(
    (total, result) =>
      total + result.fixture.expectedProposalDirections.length - result.missingProposalDirections.length,
    0,
  );
  const proposalCount = results.reduce((total, result) => total + result.proposalCount, 0);
  const vagueProposalCount = results.reduce((total, result) => total + result.vagueProposalCount, 0);
  const actionableProposalCount = results.reduce(
    (total, result) => total + result.actionableProposalCount,
    0,
  );

  return {
    fixtureCount: fixtures.length,
    insightExpectationCount,
    insightHitCount,
    proposalDirectionCount,
    proposalDirectionHitCount,
    proposalCount,
    vagueProposalCount,
    actionableProposalCount,
    insightHitRate: toRate(insightHitCount, insightExpectationCount),
    proposalDirectionHitRate: toRate(proposalDirectionHitCount, proposalDirectionCount),
    vagueRate: toRate(vagueProposalCount, proposalCount),
    actionableRate: toRate(actionableProposalCount, proposalCount),
    results,
  };
}
