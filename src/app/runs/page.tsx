export const dynamic = "force-dynamic";

import { formatDate } from "@/lib/utils";
import { listWorkflowRuns } from "@/server/domain/runs";

const workflowTypeLabel: Record<string, string> = {
  analyze_material: "分析素材",
  apply_proposal: "应用提案",
  generate_artifact: "生成资产",
  playground_run: "测试场运行",
  feedback_to_proposal: "反馈转提案",
};

const statusLabel: Record<string, string> = {
  pending: "待执行",
  running: "运行中",
  waiting_for_human: "等待人工",
  completed: "已完成",
  failed: "失败",
  cancelled: "已取消",
};

const stepStatusLabel: Record<string, string> = {
  pending: "待执行",
  running: "运行中",
  completed: "已完成",
  failed: "失败",
  skipped: "已跳过",
};

const llmStatusLabel: Record<string, string> = {
  success: "成功",
  parse_failed: "解析失败",
  model_failed: "模型失败",
};

function formatDuration(durationMs: number | null) {
  if (!durationMs || durationMs < 0) {
    return "未记录";
  }

  return `${durationMs}ms`;
}

function formatTokens(inputTokens: number | null, outputTokens: number | null) {
  if (!inputTokens && !outputTokens) {
    return "未记录";
  }

  return `in ${inputTokens ?? 0} / out ${outputTokens ?? 0}`;
}

export default async function RunsPage() {
  const runs = await listWorkflowRuns();

  return (
    <div className="flex flex-col gap-8">
      <section className="hero-grid">
        <div className="flex flex-col gap-4">
          <p className="eyebrow">Harness / Observability</p>
          <h1 className="max-w-5xl font-serif text-5xl leading-[1.03] text-[color:var(--ink)] lg:text-7xl">
            先看清每一条 workflow，是怎么跑出来的。
          </h1>
        </div>
        <div className="panel text-sm leading-7 text-[color:var(--muted)]">
          <p>
            这里按 workflow 展示状态、时长、step 快照和 LLM 调用记录，方便定位失败点、回看输入输出，以及检查
            prompt version、tokens 和耗时。
          </p>
        </div>
      </section>

      <section className="panel flex flex-col gap-5">
        <div>
          <p className="eyebrow">Workflow Runs</p>
          <h2 className="font-serif text-3xl text-[color:var(--ink)]">最近运行 {runs.length}</h2>
        </div>

        <div className="grid gap-4">
          {runs.length === 0 ? (
            <p className="text-sm leading-7 text-[color:var(--muted)]">还没有 workflow 运行记录。</p>
          ) : (
            runs.map((run) => (
              <article key={run.id} className="panel-muted flex flex-col gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="status-chip">{workflowTypeLabel[run.workflowType] ?? run.workflowType}</span>
                  <span className="tag-chip">{statusLabel[run.status] ?? run.status}</span>
                  <span className="tag-chip">耗时 {formatDuration(run.durationMs)}</span>
                  <span className="tag-chip">重试 {run.retryCount}</span>
                  <span className="text-xs text-[color:var(--muted)]">{formatDate(run.startedAt)}</span>
                </div>

                {run.errorMessage ? (
                  <p className="text-sm leading-7 text-[#8e2f22]">失败原因：{run.errorMessage}</p>
                ) : null}

                <div className="grid gap-3">
                  {run.stepRuns.map((step) => (
                    <details key={step.id} className="panel-soft">
                      <summary className="details-summary">
                        <span className="font-medium text-[color:var(--ink)]">{step.stepName}</span>
                        <span className="tag-chip">{stepStatusLabel[step.status] ?? step.status}</span>
                        <span className="tag-chip">耗时 {formatDuration(step.durationMs)}</span>
                        <span className="tag-chip">重试 {step.retryCount}</span>
                        <span className="tag-chip">LLM {step.llmRuns.length}</span>
                      </summary>

                      <div className="mt-4 grid gap-4">
                        {step.errorMessage ? (
                          <p className="text-sm leading-7 text-[#8e2f22]">Step 错误：{step.errorMessage}</p>
                        ) : null}

                        <div className="grid gap-4 lg:grid-cols-2">
                          <div className="field">
                            <span>Input Snapshot</span>
                            <pre className="snapshot-preview">{step.inputSnapshot}</pre>
                          </div>
                          <div className="field">
                            <span>Output Snapshot</span>
                            <pre className="snapshot-preview">{step.outputSnapshot ?? "无输出快照"}</pre>
                          </div>
                        </div>

                        {step.llmRuns.length > 0 ? (
                          <div className="grid gap-3">
                            {step.llmRuns.map((llmRun) => (
                              <div key={llmRun.id} className="panel-soft">
                                <div className="flex flex-wrap items-center gap-3">
                                  <span className="status-chip">{llmRun.promptName}</span>
                                  <span className="tag-chip">{llmRun.promptVersion}</span>
                                  <span className="tag-chip">{llmRun.model}</span>
                                  <span className="tag-chip">{llmStatusLabel[llmRun.status] ?? llmRun.status}</span>
                                  <span className="tag-chip">{formatTokens(llmRun.inputTokens, llmRun.outputTokens)}</span>
                                  <span className="tag-chip">耗时 {formatDuration(llmRun.durationMs)}</span>
                                  <span className="tag-chip">重试 {llmRun.retryCount}</span>
                                </div>

                                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                                  <div className="field">
                                    <span>Raw Request</span>
                                    <pre className="snapshot-preview">{llmRun.rawRequest}</pre>
                                  </div>
                                  <div className="field">
                                    <span>Parsed Output</span>
                                    <pre className="snapshot-preview">{llmRun.parsedOutput ?? "无结构化输出"}</pre>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </details>
                  ))}
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
