import test from "node:test";
import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

import { AIService } from "@/server/ai/services/ai-service";

const service = new AIService();
const fixturesDir = path.join(process.cwd(), "evals", "materials");

test("material eval fixtures produce expected insight directions", async () => {
  const files = (await readdir(fixturesDir)).filter((file) => file.endsWith(".json"));

  assert.ok(files.length >= 3);

  for (const file of files) {
    const raw = await readFile(path.join(fixturesDir, file), "utf8");
    const fixture = JSON.parse(raw) as {
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
      expectedInsightTypes: string[];
    };

    const result = await service.analyzeMaterial({
      workspaceProfile: fixture.workspaceProfile,
      material: fixture.material,
      existingRules: [],
    });

    const actualTypes = result.output.insights.map((insight) => insight.type);

    for (const expectedType of fixture.expectedInsightTypes) {
      assert.ok(
        actualTypes.includes(expectedType as (typeof actualTypes)[number]),
        `${file} should include insight type ${expectedType}, got ${actualTypes.join(", ")}`,
      );
    }
  }
});
