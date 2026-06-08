export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";

import { AnalyzeButton } from "@/components/analyze-button";
import { DeleteMaterialButton } from "@/components/delete-material-button";
import { EmptyStatePanel } from "@/components/empty-state-panel";
import { formatDate } from "@/lib/utils";
import { getMaterialDetail, serializeMaterialTags } from "@/server/domain/materials";

const materialTypeLabel: Record<string, string> = {
  article: "文章",
  code_rule: "代码规则",
  prompt: "Prompt",
  feedback: "反馈",
  failed_output: "失败案例",
  note: "笔记",
  project_description: "项目描述",
};

const materialStatusLabel: Record<string, string> = {
  unprocessed: "未分析",
  analyzed: "已分析",
  used: "已生成提案",
  archived: "已归档",
};

const insightTypeLabel: Record<string, string> = {
  preference: "偏好",
  principle: "原则",
  boundary: "边界",
  style: "风格",
  workflow: "工作流",
  anti_pattern: "反模式",
};

const proposalCategoryLabel: Record<string, string> = {
  personal: "个人规则",
  ai_collaboration: "AI 协作",
  coding: "编码",
  writing: "写作",
  knowledge: "知识沉淀",
  product: "产品",
};

export default async function MaterialDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const material = await getMaterialDetail(id);

  if (!material) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-8">
      <section className="panel flex flex-col gap-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex max-w-3xl flex-col gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="status-chip">{materialStatusLabel[material.status]}</span>
              <span className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">
                {materialTypeLabel[material.type] ?? material.type}
              </span>
            </div>

            <h1 className="font-serif text-5xl leading-tight text-[color:var(--ink)]">
              {material.title}
            </h1>

            {material.summary ? (
              <p className="text-base leading-8 text-[color:var(--muted)]">{material.summary}</p>
            ) : null}

            <div className="flex flex-wrap items-center gap-3 text-xs text-[color:var(--muted)]">
              <span>{formatDate(material.createdAt)}</span>
              {serializeMaterialTags(material.tags).map((tag) => (
                <span key={tag} className="tag-chip">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="panel-muted flex min-w-[280px] flex-col gap-4">
            <p className="eyebrow">Analyze Workflow</p>
            <p className="text-sm leading-7 text-[color:var(--muted)]">
              该按钮会依次执行：加载画像上下文、提炼 `insights`、生成 `rule proposals`、落库并更新素材状态。
            </p>
            <AnalyzeButton materialId={material.id} />
            <DeleteMaterialButton materialId={material.id} title={material.title} />
          </div>
        </div>

        <div className="rounded-[28px] border border-[color:var(--line)] bg-[#14110f] px-6 py-6 text-sm leading-7 text-[#f6efe7]">
          <pre className="whitespace-pre-wrap font-mono text-[13px]">{material.content}</pre>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="panel flex flex-col gap-5">
          <div>
            <p className="eyebrow">Insights</p>
            <h2 className="font-serif text-3xl text-[color:var(--ink)]">
              结构化洞察 {material.insights.length}
            </h2>
          </div>

          <div className="grid gap-4">
            {material.insights.length === 0 ? (
              <EmptyStatePanel
                title="这条素材还没有洞察"
                description="先运行右上角的 analyze workflow。完成后这里会展示结构化 insight，并继续生成 proposal。"
              />
            ) : (
              material.insights.map((insight) => (
                <article key={insight.id} className="panel-muted flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="status-chip">{insightTypeLabel[insight.type]}</span>
                    <span className="text-xs text-[color:var(--muted)]">
                      置信度 {Math.round(insight.confidence * 100)}%
                    </span>
                  </div>
                  <h3 className="text-xl font-medium text-[color:var(--ink)]">{insight.title}</h3>
                  <p className="text-sm leading-7 text-[color:var(--muted)]">{insight.description}</p>
                  <p className="rounded-2xl bg-[color:var(--paper)] px-4 py-3 text-sm leading-7 text-[color:var(--muted)]">
                    证据：{insight.evidence}
                  </p>
                </article>
              ))
            )}
          </div>
        </div>

        <div className="panel flex flex-col gap-5">
          <div>
            <p className="eyebrow">Proposals</p>
            <h2 className="font-serif text-3xl text-[color:var(--ink)]">
              候选规则提案 {material.proposals.length}
            </h2>
          </div>

          <div className="grid gap-4">
            {material.proposals.length === 0 ? (
              <EmptyStatePanel
                title="候选规则还没生成出来"
                description="只要 insight 校验通过，这里就会自动落出 proposal。下一步通常是去提案页做人审，再进入 Rulebase。"
                actions={[{ href: "/proposals", label: "查看提案页" }]}
              />
            ) : (
              material.proposals.map((proposal) => (
                <article key={proposal.id} className="panel-muted flex flex-col gap-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="status-chip">{proposalCategoryLabel[proposal.category]}</span>
                    <span className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">
                      {proposal.action}
                    </span>
                    <span className="text-xs text-[color:var(--muted)]">{proposal.status}</span>
                    {proposal.confidence ? (
                      <span className="text-xs text-[color:var(--muted)]">
                        置信度 {Math.round(proposal.confidence * 100)}%
                      </span>
                    ) : null}
                  </div>
                  <h3 className="text-xl font-medium text-[color:var(--ink)]">{proposal.title}</h3>
                  <p className="text-sm leading-7 text-[color:var(--muted)]">{proposal.proposedContent}</p>
                  <p className="text-sm leading-7 text-[color:var(--muted)]">原因：{proposal.reason}</p>
                  <p className="rounded-2xl bg-[color:var(--paper)] px-4 py-3 text-sm leading-7 text-[color:var(--muted)]">
                    证据：{proposal.evidence}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {(Array.isArray(proposal.affectedArtifacts)
                      ? proposal.affectedArtifacts.filter(
                          (item): item is string => typeof item === "string",
                        )
                      : []
                    ).map((artifact) => (
                      <span key={artifact} className="tag-chip">
                        {artifact}
                      </span>
                    ))}
                  </div>
                </article>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
