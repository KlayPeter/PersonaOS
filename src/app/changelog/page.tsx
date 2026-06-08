export const dynamic = "force-dynamic";

import { formatDate } from "@/lib/utils";
import { listChangelog } from "@/server/domain/changelog";

const changeTypeLabel: Record<string, string> = {
  rule_added: "新增规则",
  rule_modified: "修改规则",
  rule_deleted: "删除规则",
  rule_archived: "归档规则",
  artifact_generated: "生成资产",
  proposal_rejected: "拒绝提案",
};

export default async function ChangelogPage() {
  const changelog = await listChangelog();

  return (
    <div className="flex flex-col gap-8">
      <section className="hero-grid">
        <div className="flex flex-col gap-4">
          <p className="eyebrow">Audit Trail / Changelog</p>
          <h1 className="max-w-4xl font-serif text-5xl leading-[1.05] text-[color:var(--ink)] lg:text-7xl">
            每一次正式变更，都应该留下可回放的痕迹。
          </h1>
        </div>
        <div className="panel text-sm leading-7 text-[color:var(--muted)]">
          <p>
            这里记录 proposal 审核、Rulebase 编辑和归档等关键行为，作为 PersonaOS 第一版的 audit trail。
          </p>
        </div>
      </section>

      <section className="panel flex flex-col gap-5">
        <div>
          <p className="eyebrow">Timeline</p>
          <h2 className="font-serif text-3xl text-[color:var(--ink)]">变更记录 {changelog.length}</h2>
        </div>

        <div className="grid gap-4">
          {changelog.length === 0 ? (
            <p className="text-sm leading-7 text-[color:var(--muted)]">还没有变更记录。</p>
          ) : (
            changelog.map((entry) => (
              <article key={entry.id} className="panel-muted flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="status-chip">{changeTypeLabel[entry.changeType] ?? entry.changeType}</span>
                  <span className="text-xs text-[color:var(--muted)]">{formatDate(entry.createdAt)}</span>
                </div>
                <h3 className="text-xl font-medium text-[color:var(--ink)]">{entry.summary}</h3>
                <p className="whitespace-pre-wrap text-sm leading-7 text-[color:var(--muted)]">
                  {entry.detail}
                </p>
                <div className="flex flex-wrap gap-3 text-xs text-[color:var(--muted)]">
                  <span>提案：{entry.relatedProposal?.title ?? "无"}</span>
                  <span>规则：{entry.relatedRule?.title ?? "无"}</span>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
