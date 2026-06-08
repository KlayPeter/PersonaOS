import "dotenv/config";

import { getProposalReviewSnapshot } from "@/server/domain/proposals";

async function main() {
  const snapshot = await getProposalReviewSnapshot();

  console.log("Proposal review snapshot");
  console.log(`- total proposals: ${snapshot.totalProposalCount}`);
  console.log(`- pending: ${snapshot.pendingCount}`);
  console.log(`- acceptance rate: ${snapshot.acceptedCount}/${snapshot.decisionCount} (${snapshot.acceptanceRate})`);
  console.log(`- edited rate: ${snapshot.editedCount}/${snapshot.decisionCount} (${snapshot.editedRate})`);
  console.log(`- rejection rate: ${snapshot.rejectedCount}/${snapshot.decisionCount} (${snapshot.rejectionRate})`);
  console.log(`- vague rate: ${snapshot.vagueCount}/${snapshot.totalProposalCount} (${snapshot.vagueRate})`);
  console.log(`- actionable rate: ${snapshot.actionableCount}/${snapshot.totalProposalCount} (${snapshot.actionableRate})`);

  console.log("\nReview sample:");
  for (const proposal of snapshot.sample) {
    console.log(`- [${proposal.status}] ${proposal.title}`);
    console.log(`  reason: ${proposal.reviewReason}`);
    console.log(`  material: ${proposal.material?.title ?? "未绑定素材"}`);
  }
}

void main();
