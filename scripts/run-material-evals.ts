import { runMaterialEvals } from "@/server/evals/material-evals";

async function main() {
  const summary = await runMaterialEvals();

  console.log("Material eval summary");
  console.log(`- fixtures: ${summary.fixtureCount}`);
  console.log(
    `- insight hit rate: ${summary.insightHitCount}/${summary.insightExpectationCount} (${summary.insightHitRate})`,
  );
  console.log(
    `- proposal direction hit rate: ${summary.proposalDirectionHitCount}/${summary.proposalDirectionCount} (${summary.proposalDirectionHitRate})`,
  );
  console.log(`- actionable rate: ${summary.actionableProposalCount}/${summary.proposalCount} (${summary.actionableRate})`);
  console.log(`- vague rate: ${summary.vagueProposalCount}/${summary.proposalCount} (${summary.vagueRate})`);

  const failures = summary.results.filter(
    (result) => result.missingInsightTypes.length > 0 || result.missingProposalDirections.length > 0,
  );

  if (failures.length > 0) {
    console.error("\nFailed fixtures:");

    for (const failure of failures) {
      console.error(`- ${failure.fixture.name}`);
      if (failure.missingInsightTypes.length > 0) {
        console.error(`  missing insight types: ${failure.missingInsightTypes.join(", ")}`);
      }
      if (failure.missingProposalDirections.length > 0) {
        console.error(`  missing proposal directions: ${failure.missingProposalDirections.join(", ")}`);
      }
    }

    process.exitCode = 1;
    return;
  }

  console.log("\nAll eval fixtures passed.");
}

void main();
