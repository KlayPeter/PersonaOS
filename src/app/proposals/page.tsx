export const dynamic = "force-dynamic";

import { ProposalStatus } from "@prisma/client";

import { EmptyStatePanel } from "@/components/empty-state-panel";
import { ProposalActions } from "@/components/proposal-actions";
import { formatDate } from "@/lib/utils";
import { getProposalReviewSnapshot, listProposals, serializeAffectedArtifacts } from "@/server/domain/proposals";

const categoryLabel: Record<string, string> = {
  personal: "个人规则",
  ai_collaboration: "AI 协作",
  coding: "编码",
  writing: "写作",
  knowledge: "知识沉淀",
  product: "产品",
};

const statusLabel: Record<string, string> = {
  pending: "待审核",
  accepted: "已接受",
  rejected: "已拒绝",
  edited: "编辑后接受",
};

export default async function ProposalsPage() {
  const pending = await listProposals(ProposalStatus.pending);
  const recent = (await listProposals()).filter((proposal) => proposal.status !== ProposalStatus.pending).slice(0, 8);
  const quality = await getProposalReviewSnapshot();

  return (
    <div className="flex flex-col gap-8">
      <section className="hero-grid">
        <div className="flex flex-col gap-4">
          <p className="eyebrow">Phase 2 / Human Approval</p>
          <h1 className="max-w-4xl font-serif text-5xl leading-[1.05] text-[color:var(--ink)] lg:text-7xl">
            让 AI 只提案，不直接污染正式规则库。
          </h1>
        </div>
        <div className="panel text-sm leading-7 text-[color:var(--muted)]">
          <p>
            这一页对应文档里的 `human approval workflow`。用户可以接受、拒绝，或者编辑后再接受 proposal，
            由 Harness 负责写入 Rulebase 和 changelog。
          </p>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-5">
        <article className="panel-muted flex flex-col gap-3">
          <p className="text-xs uppercase tracking-[0.16em] text-[color:var(--muted)]">接受率</p>
          <p className="font-serif text-5xl text-[color:var(--ink)]">{Math.round(quality.acceptanceRate * 100)}%</p>
          <p className="text-sm text-[color:var(--muted)]">
            {quality.acceptedCount}/{quality.decisionCount || 0} 条已决策 proposal 被直接接受
          </p>
        </article>
        <article className="panel-muted flex flex-col gap-3">
          <p className="text-xs uppercase tracking-[0.16em] text-[color:var(--muted)]">编辑率</p>
          <p className="font-serif text-5xl text-[color:var(--ink)]">{Math.round(quality.editedRate * 100)}%</p>
          <p className="text-sm text-[color:var(--muted)]">
            {quality.editedCount}/{quality.decisionCount || 0} 条需要人工改写后才入库
          </p>
        </article>
        <article className="panel-muted flex flex-col gap-3">
          <p className="text-xs uppercase tracking-[0.16em] text-[color:var(--muted)]">拒绝率</p>
          <p className="font-serif text-5xl text-[color:var(--ink)]">{Math.round(quality.rejectionRate * 100)}%</p>
          <p className="text-sm text-[color:var(--muted)]">
            {quality.rejectedCount}/{quality.decisionCount || 0} 条被明确拒绝
          </p>
        </article>
        <article className="panel-muted flex flex-col gap-3">
          <p className="text-xs uppercase tracking-[0.16em] text-[color:var(--muted)]">空泛率</p>
          <p className="font-serif text-5xl text-[color:var(--ink)]">{Math.round(quality.vagueRate * 100)}%</p>
          <p className="text-sm text-[color:var(--muted)]">
            {quality.vagueCount}/{quality.totalProposalCount || 0} 条 proposal 被判定为空泛
          </p>
        </article>
        <article className="panel-muted flex flex-col gap-3">
          <p className="text-xs uppercase tracking-[0.16em] text-[color:var(--muted)]">待审核</p>
          <p className="font-serif text-5xl text-[color:var(--ink)]">{quality.pendingCount}</p>
          <p className="text-sm text-[color:var(--muted)]">当前仍在等待人工确认的提案数量</p>
        </article>
      </section>

      <section className="panel flex flex-col gap-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Pending Proposals</p>
            <h2 className="font-serif text-3xl text-[color:var(--ink)]">待审核提案 {pending.length}</h2>
          </div>
        </div>

        <div className="grid gap-5">
          {pending.length === 0 ? (
            <EmptyStatePanel
              title="当前没有待审核提案"
              description="可以先去 Inbox 对新素材运行 analyze workflow，或者在 Playground 中对已有资产给负向反馈，把问题回流成新 proposal。"
              actions={[
                { href: "/inbox", label: "去分析素材" },
                { href: "/playground", label: "去测试场回流反馈" },
              ]}
            />
          ) : (
            pending.map((proposal) => (
              <article key={proposal.id} className="panel-muted flex flex-col gap-5">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="status-chip">{categoryLabel[proposal.category]}</span>
                  <span className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">
                    {proposal.action}
                  </span>
                  <span className="text-xs text-[color:var(--muted)]">{formatDate(proposal.createdAt)}</span>
                </div>

                <div className="flex flex-col gap-3">
                  <h3 className="font-serif text-3xl text-[color:var(--ink)]">{proposal.title}</h3>
                  <p className="text-sm leading-7 text-[color:var(--muted)]">{proposal.proposedContent}</p>
                  <p className="text-sm leading-7 text-[color:var(--muted)]">原因：{proposal.reason}</p>
                  <p className="rounded-2xl bg-[color:var(--paper)] px-4 py-3 text-sm leading-7 text-[color:var(--muted)]">
                    证据：{proposal.evidence}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {serializeAffectedArtifacts(proposal.affectedArtifacts).map((artifact) => (
                    <span key={artifact} className="tag-chip">
                      {artifact}
                    </span>
                  ))}
                </div>

                <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
                  <div className="rounded-[24px] border border-[color:var(--line)] px-4 py-4 text-sm leading-7 text-[color:var(--muted)]">
                    <p className="eyebrow">Source</p>
                    <p className="mt-2">素材：{proposal.material?.title ?? "未绑定素材"}</p>
                    <p>洞察：{proposal.insight?.title ?? "未绑定 insight"}</p>
                  </div>
                  <ProposalActions
                    proposalId={proposal.id}
                    title={proposal.title}
                    proposedContent={proposal.proposedContent}
                    category={proposal.category}
                  />
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      <section className="panel flex flex-col gap-5">
        <div>
          <p className="eyebrow">Review Sample</p>
          <h2 className="font-serif text-3xl text-[color:var(--ink)]">人工抽样复查</h2>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-[color:var(--muted)]">
            这里会优先抽样“编辑后接受”“可执行性偏弱”“高置信度被拒绝”等提案，帮助检查 prompt 方向和人工审核口径是否稳定。
          </p>
        </div>

        <div className="grid gap-4">
          {quality.sample.length === 0 ? (
            <EmptyStatePanel
              title="还没有可复查样本"
              description="先处理几条 proposal，这里才会开始积累人工抽样复查候选。"
            />
          ) : (
            quality.sample.map((proposal) => (
              <article key={proposal.id} className="panel-muted flex flex-col gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="status-chip">{statusLabel[proposal.status]}</span>
                  <span className="tag-chip">{categoryLabel[proposal.category] ?? proposal.category}</span>
                  {proposal.confidence ? (
                    <span className="tag-chip">置信度 {Math.round(proposal.confidence * 100)}%</span>
                  ) : null}
                  <span className="text-xs text-[color:var(--muted)]">{formatDate(proposal.updatedAt)}</span>
                </div>
                <div className="flex flex-col gap-2">
                  <h3 className="text-xl font-medium text-[color:var(--ink)]">{proposal.title}</h3>
                  <p className="text-sm leading-7 text-[color:var(--muted)]">{proposal.proposedContent}</p>
                </div>
                <p className="rounded-2xl bg-[color:var(--paper)] px-4 py-3 text-sm leading-7 text-[color:var(--muted)]">
                  复查原因：{proposal.reviewReason}
                </p>
                <div className="flex flex-wrap gap-3 text-xs text-[color:var(--muted)]">
                  <span>素材：{proposal.material?.title ?? "未绑定素材"}</span>
                  <span>洞察：{proposal.insight?.title ?? "未绑定 insight"}</span>
                  <span>空泛判定：{proposal.isVague ? "是" : "否"}</span>
                  <span>可执行判定：{proposal.isActionable ? "是" : "否"}</span>
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      <section className="panel flex flex-col gap-5">
        <div>
          <p className="eyebrow">Recent Decisions</p>
          <h2 className="font-serif text-3xl text-[color:var(--ink)]">最近处理记录</h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {recent.length === 0 ? (
            <EmptyStatePanel
              title="还没有处理记录"
              description="接受、拒绝或编辑后接受任一 proposal 后，这里会保留最近的人审决策。"
            />
          ) : (
            recent.map((proposal) => (
              <article key={proposal.id} className="panel-muted flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="status-chip">{statusLabel[proposal.status]}</span>
                  <span className="text-xs text-[color:var(--muted)]">{formatDate(proposal.updatedAt)}</span>
                </div>
                <h3 className="text-xl font-medium text-[color:var(--ink)]">{proposal.title}</h3>
                <p className="text-sm leading-7 text-[color:var(--muted)]">{proposal.proposedContent}</p>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
