export const dynamic = "force-dynamic";

import { ArtifactGenerator } from "@/components/artifact-generator";
import { formatDate } from "@/lib/utils";
import { artifactTypeOptions } from "@/server/artifacts/registry";
import { listArtifacts } from "@/server/domain/artifacts";

export default async function ArtifactsPage() {
  const artifacts = await listArtifacts();
  const grouped = Object.entries(
    artifacts.reduce<Record<string, typeof artifacts>>((accumulator, artifact) => {
      accumulator[artifact.type] ??= [];
      accumulator[artifact.type].push(artifact);
      return accumulator;
    }, {}),
  );

  return (
    <div className="flex flex-col gap-8">
      <section className="hero-grid">
        <div className="flex flex-col gap-4">
          <p className="eyebrow">Phase 3 / Artifact Compile</p>
          <h1 className="max-w-4xl font-serif text-5xl leading-[1.05] text-[color:var(--ink)] lg:text-7xl">
            把已经确认的规则，编译成真正可用的资产文档。
          </h1>
        </div>
        <div className="panel text-sm leading-7 text-[color:var(--muted)]">
          <p>
            这一步不是自由生成，而是基于 Rulebase 的模板化编译。当前支持 `AGENTS.md`、
            `writing-style.md` 和 `personal-system.md` 三类核心导出。
          </p>
        </div>
      </section>

      <ArtifactGenerator options={artifactTypeOptions} />

      <section className="panel flex flex-col gap-6">
        <div>
          <p className="eyebrow">Artifact Versions</p>
          <h2 className="font-serif text-3xl text-[color:var(--ink)]">已保存版本 {artifacts.length}</h2>
        </div>

        <div className="grid gap-8">
          {grouped.length === 0 ? (
            <p className="text-sm leading-7 text-[color:var(--muted)]">
              还没有生成过资产。先在 Rulebase 中确认规则，再生成第一版导出文档。
            </p>
          ) : (
            grouped.map(([type, entries]) => (
              <section key={type} className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <span className="status-chip">{entries[0]?.title ?? type}</span>
                  <span className="text-sm text-[color:var(--muted)]">{entries.length} 个版本</span>
                </div>

                <div className="grid gap-4">
                  {entries.map((artifact) => (
                    <article key={artifact.id} className="panel-muted flex flex-col gap-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <h3 className="font-serif text-2xl text-[color:var(--ink)]">
                          {artifact.title} v{artifact.version}
                        </h3>
                        <span className="text-xs text-[color:var(--muted)]">
                          {formatDate(artifact.createdAt)}
                        </span>
                      </div>

                      <pre className="artifact-preview artifact-preview-compact">{artifact.content}</pre>
                    </article>
                  ))}
                </div>
              </section>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
