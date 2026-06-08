export const dynamic = "force-dynamic";

import { formatDate } from "@/lib/utils";
import { artifactTypeOptions } from "@/server/artifacts/registry";
import { listPlaygroundRuns } from "@/server/domain/playground";
import { PlaygroundConsole } from "@/components/playground-console";

const feedbackLabel: Record<string, string> = {
  good: "像我",
  not_like_me: "不像我",
  too_vague: "太空",
  too_short: "太短",
  too_long: "太长",
  too_scattered: "太散",
  too_template: "太模板",
  logic_weak: "逻辑不够",
  examples_missing: "例子不够",
  custom: "自定义",
};

export default async function PlaygroundPage() {
  const runs = await listPlaygroundRuns();

  return (
    <div className="flex flex-col gap-8">
      <section className="hero-grid">
        <div className="flex flex-col gap-4">
          <p className="eyebrow">Phase 4 / Playground Evolve</p>
          <h1 className="max-w-4xl font-serif text-5xl leading-[1.05] text-[color:var(--ink)] lg:text-7xl">
            用自己的资产跑任务，再把真实反馈回流成新的提案。
          </h1>
        </div>
        <div className="panel text-sm leading-7 text-[color:var(--muted)]">
          <p>
            Playground 不只是演示区，它是 PersonaOS 的进化入口。你可以选择资产、输入任务、查看输出，再直接把反馈转成新的 proposal。
          </p>
        </div>
      </section>

      <PlaygroundConsole
        artifactOptions={artifactTypeOptions.map(({ type, title, description }) => ({
          type,
          title,
          description,
        }))}
      />

      <section className="panel flex flex-col gap-5">
        <div>
          <p className="eyebrow">Recent Runs</p>
          <h2 className="font-serif text-3xl text-[color:var(--ink)]">最近 Playground 记录 {runs.length}</h2>
        </div>

        <div className="grid gap-4">
          {runs.length === 0 ? (
            <p className="text-sm leading-7 text-[color:var(--muted)]">还没有 Playground 记录。</p>
          ) : (
            runs.map((run) => (
              <article key={run.id} className="panel-muted flex flex-col gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="status-chip">{run.sourceArtifact?.title ?? run.artifactType}</span>
                  <span className="text-xs text-[color:var(--muted)]">{formatDate(run.createdAt)}</span>
                  {run.feedback ? (
                    <span className="tag-chip">{feedbackLabel[run.feedback] ?? run.feedback}</span>
                  ) : null}
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <div>
                    <p className="eyebrow">Task</p>
                    <p className="mt-2 text-sm leading-7 text-[color:var(--muted)]">{run.inputTask}</p>
                  </div>
                  <div>
                    <p className="eyebrow">Feedback</p>
                    <p className="mt-2 text-sm leading-7 text-[color:var(--muted)]">
                      {run.feedbackText || (run.feedback ? feedbackLabel[run.feedback] : "暂无反馈")}
                    </p>
                  </div>
                </div>

                <pre className="artifact-preview artifact-preview-compact">{run.output}</pre>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
