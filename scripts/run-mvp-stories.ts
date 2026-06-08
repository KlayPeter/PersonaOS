import "dotenv/config";

import { runMvpStories } from "@/server/evals/mvp-stories";

async function main() {
  const summary = await runMvpStories();

  console.log(`Workspace: ${summary.workspaceName}`);
  console.log("MVP stories passed:");

  for (const story of summary.stories) {
    console.log(`\n- ${story.story}`);
    console.log(`  material: ${story.materialTitle}`);
    console.log(`  rule: ${story.proposalTitle}`);
    console.log(`  artifact: ${story.artifactTitle} v${story.artifactVersion}`);
    for (const check of story.checks) {
      console.log(`  ${check.label}: ${check.value}`);
    }
  }
}

void main();
