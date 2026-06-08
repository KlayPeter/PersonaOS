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
      },
    });
  }

  async completeWorkflowRun(workflowRunId: string) {
    return this.prisma.workflowRun.update({
      where: { id: workflowRunId },
      data: {
        status: WorkflowStatus.completed,
        finishedAt: new Date(),
      },
    });
  }

  async failWorkflowRun(workflowRunId: string) {
    return this.prisma.workflowRun.update({
      where: { id: workflowRunId },
      data: {
        status: WorkflowStatus.failed,
        finishedAt: new Date(),
      },
    });
  }

  async startStep(input: {
    workflowRunId: string;
    stepName: string;
    payload: unknown;
  }) {
    return this.prisma.stepRun.create({
      data: {
        workflowRunId: input.workflowRunId,
        stepName: input.stepName,
        status: StepStatus.running,
        inputSnapshot: serialize(input.payload),
      },
    });
  }

  async completeStep(stepRunId: string, output: unknown) {
    return this.prisma.stepRun.update({
      where: { id: stepRunId },
      data: {
        status: StepStatus.completed,
        finishedAt: new Date(),
        outputSnapshot: serialize(output),
      },
    });
  }

  async failStep(stepRunId: string, error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown step error";

    return this.prisma.stepRun.update({
      where: { id: stepRunId },
      data: {
        status: StepStatus.failed,
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
