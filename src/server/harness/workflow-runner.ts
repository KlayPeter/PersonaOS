import { RunLogger } from "@/server/harness/logging/run-logger";

type WorkflowContext = {
  workflowRunId: string;
  step<T>(
    stepName: string,
    payload: unknown,
    handler: (tools: {
      workflowRunId: string;
      stepRunId: string;
      recordLLMRun(payload: {
        model: string;
        promptName: string;
        promptVersion: string;
        retryCount?: number;
        durationMs?: number;
        inputTokens?: number;
        outputTokens?: number;
        rawRequest: string;
        rawResponse?: string;
        parsedOutput?: string;
        status: "success" | "parse_failed" | "model_failed";
      }): Promise<unknown>;
    }) => Promise<T>,
  ): Promise<T>;
};

export async function runWorkflow<T>(
  input: {
    workspaceId: string;
    workflowType:
      | "analyze_material"
      | "apply_proposal"
      | "generate_artifact"
      | "playground_run"
      | "feedback_to_proposal";
    triggerSource?: "user_action" | "system_retry";
  },
  executor: (context: WorkflowContext) => Promise<T>,
) {
  const logger = new RunLogger();
  const workflowStartedAt = Date.now();
  const workflowRun = await logger.createWorkflowRun({
    workspaceId: input.workspaceId,
    workflowType: input.workflowType,
    triggerSource: input.triggerSource ?? "user_action",
  });

  const context: WorkflowContext = {
    workflowRunId: workflowRun.id,
    async step(stepName, payload, handler) {
      const stepStartedAt = Date.now();
      const stepRun = await logger.startStep({
        workflowRunId: workflowRun.id,
        stepName,
        payload,
        retryCount: input.triggerSource === "system_retry" ? 1 : 0,
      });

      try {
        const output = await handler({
          workflowRunId: workflowRun.id,
          stepRunId: stepRun.id,
          recordLLMRun: async (llmPayload) => {
            return logger.recordLLMRun(stepRun.id, llmPayload);
          },
        });

        await logger.completeStep(stepRun.id, output, Date.now() - stepStartedAt);
        return output;
      } catch (error) {
        await logger.failStep(stepRun.id, error, Date.now() - stepStartedAt);
        throw error;
      }
    },
  };

  try {
    const result = await executor(context);
    await logger.completeWorkflowRun(workflowRun.id, Date.now() - workflowStartedAt);
    return { workflowRunId: workflowRun.id, result };
  } catch (error) {
    await logger.failWorkflowRun(workflowRun.id, error, Date.now() - workflowStartedAt);
    throw error;
  }
}
