import { LLMRunStatus, StepStatus, WorkflowStatus } from "@prisma/client";

import { getPrismaClient } from "@/server/db/client";

function serialize(value: unknown) {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return JSON.stringify({ error: "serialization_failed" });
  }
}

export class RunLogger {
  private prisma = getPrismaClient();

  async createWorkflowRun(input: {
    workspaceId: string;
    workflowType:
      | "analyze_material"
      | "apply_proposal"
      | "generate_artifact"
      | "playground_run"
      | "feedback_to_proposal";
    triggerSource: "user_action" | "system_retry";
  }) {
    return this.prisma.workflowRun.create({
      data: {
        workspaceId: input.workspaceId,
        workflowType: input.workflowType,
        triggerSource: input.triggerSource,
        status: WorkflowStatus.running,
        retryCount: input.triggerSource === "system_retry" ? 1 : 0,
      },
    });
  }

  async completeWorkflowRun(workflowRunId: string, durationMs: number) {
    return this.prisma.workflowRun.update({
      where: { id: workflowRunId },
      data: {
        status: WorkflowStatus.completed,
        durationMs,
        finishedAt: new Date(),
      },
    });
  }

  async failWorkflowRun(workflowRunId: string, error: unknown, durationMs: number) {
    const message = error instanceof Error ? error.message : "Unknown workflow error";

    return this.prisma.workflowRun.update({
      where: { id: workflowRunId },
      data: {
        status: WorkflowStatus.failed,
        durationMs,
        errorMessage: message,
        finishedAt: new Date(),
      },
    });
  }

  async startStep(input: {
    workflowRunId: string;
    stepName: string;
    payload: unknown;
    retryCount?: number;
  }) {
    return this.prisma.stepRun.create({
      data: {
        workflowRunId: input.workflowRunId,
        stepName: input.stepName,
        status: StepStatus.running,
        retryCount: input.retryCount ?? 0,
        inputSnapshot: serialize(input.payload),
      },
    });
  }

  async completeStep(stepRunId: string, output: unknown, durationMs: number) {
    return this.prisma.stepRun.update({
      where: { id: stepRunId },
      data: {
        status: StepStatus.completed,
        durationMs,
        finishedAt: new Date(),
        outputSnapshot: serialize(output),
      },
    });
  }

  async failStep(stepRunId: string, error: unknown, durationMs: number) {
    const message = error instanceof Error ? error.message : "Unknown step error";

    return this.prisma.stepRun.update({
      where: { id: stepRunId },
      data: {
        status: StepStatus.failed,
        durationMs,
        finishedAt: new Date(),
        errorMessage: message,
        outputSnapshot: serialize({ error: message }),
      },
    });
  }

  async recordLLMRun(
    stepRunId: string,
    payload: {
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
    },
  ) {
    return this.prisma.lLMRun.create({
      data: {
        stepRunId,
        model: payload.model,
        promptName: payload.promptName,
        promptVersion: payload.promptVersion,
        retryCount: payload.retryCount ?? 0,
        durationMs: payload.durationMs,
        inputTokens: payload.inputTokens,
        outputTokens: payload.outputTokens,
        rawRequest: payload.rawRequest,
        rawResponse: payload.rawResponse,
        parsedOutput: payload.parsedOutput,
        status:
          payload.status === "success"
            ? LLMRunStatus.success
            : payload.status === "parse_failed"
              ? LLMRunStatus.parse_failed
              : LLMRunStatus.model_failed,
      },
    });
  }
}
