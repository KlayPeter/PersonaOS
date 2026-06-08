export function describeReplayCapability() {
  return {
    available: false,
    reason: "第一阶段先完成日志留痕，后续再补基于 WorkflowRun / StepRun 的重放能力。",
  };
}
