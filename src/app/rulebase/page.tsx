export const dynamic = "force-dynamic";

import { EmptyStatePanel } from "@/components/empty-state-panel";
import { RuleEditor } from "@/components/rule-editor";
import { formatDate } from "@/lib/utils";
import { listRules } from "@/server/domain/rules";

const categoryLabel: Record<string, string> = {
  personal: "个人规则",
  ai_collaboration: "AI 协作",
  coding: "编码",
  writing: "写作",
  knowledge: "知识沉淀",
  product: "产品",
};

export default async function RulebasePage() {
  const rules = await listRules();
  const grouped = Object.entries(
    rules.reduce<Record<string, typeof rules>>((accumulator, rule) => {
      const key = rule.category;
      accumulator[key] ??= [];
      accumulator[key].push(rule);
      return accumulator;
    }, {}),
  );

  return (
    <div className="flex flex-col gap-8">
      <section className="hero-grid">
        <div className="flex flex-col gap-4">
          <p className="eyebrow">Rulebase / Approved Knowledge</p>
          <h1 className="max-w-4xl font-serif text-5xl leading-[1.05] text-[color:var(--ink)] lg:text-7xl">
            这里存放的是已经过人工确认的正式规则。
          </h1>
        </div>
        <div className="panel text-sm leading-7 text-[color:var(--muted)]">
          <p>
            Rulebase 会承接 proposal 的审核结果。当前支持按分类浏览、手动编辑、查看来源与更新时间，并可归档规则。
          </p>
        </div>
      </section>

      <section className="panel flex flex-col gap-6">
        <div>
          <p className="eyebrow">Active Rules</p>
          <h2 className="font-serif text-3xl text-[color:var(--ink)]">正式规则 {rules.length}</h2>
        </div>

        <div className="grid gap-8">
          {grouped.length === 0 ? (
            <EmptyStatePanel
              title="正式规则库还是空的"
              description="Rulebase 只接收已经过人工确认的内容。先去提案页接受或编辑后接受 proposal，再回来生成正式规则。"
              actions={[{ href: "/proposals", label: "去处理提案" }]}
            />
          ) : (
            grouped.map(([category, entries]) => (
              <section key={category} className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <span className="status-chip">{categoryLabel[category] ?? category}</span>
                  <span className="text-sm text-[color:var(--muted)]">{entries.length} 条</span>
                </div>

                <div className="grid gap-4">
                  {entries.map((rule) => (
                    <article key={rule.id} className="panel-muted flex flex-col gap-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <h3 className="font-serif text-2xl text-[color:var(--ink)]">{rule.title}</h3>
                        <span className="text-xs text-[color:var(--muted)]">
                          更新于 {formatDate(rule.updatedAt)}
                        </span>
                      </div>

                      <p className="text-sm leading-7 text-[color:var(--muted)]">{rule.content}</p>

                      <div className="rounded-[24px] border border-[color:var(--line)] px-4 py-4 text-sm leading-7 text-[color:var(--muted)]">
                        <p>来源提案：{rule.sourceProposal?.title ?? "无"}</p>
                        <p>来源素材：{rule.sourceMaterial?.title ?? "无"}</p>
                      </div>

                      <RuleEditor
                        ruleId={rule.id}
                        title={rule.title}
                        content={rule.content}
                        category={rule.category}
                      />
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
