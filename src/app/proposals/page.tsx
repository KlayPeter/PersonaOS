export const dynamic = "force-dynamic";

import { ProposalStatus } from "@prisma/client";

import { ProposalActions } from "@/components/proposal-actions";
import { formatDate } from "@/lib/utils";
import { listProposals, serializeAffectedArtifacts } from "@/server/domain/proposals";

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

      <section className="panel flex flex-col gap-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Pending Proposals</p>
            <h2 className="font-serif text-3xl text-[color:var(--ink)]">待审核提案 {pending.length}</h2>
          </div>
        </div>

        <div className="grid gap-5">
          {pending.length === 0 ? (
            <p className="text-sm leading-7 text-[color:var(--muted)]">
              当前没有待审核提案。你可以先去 Inbox 对素材运行 analyze workflow。
            </p>
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
          <p className="eyebrow">Recent Decisions</p>
          <h2 className="font-serif text-3xl text-[color:var(--ink)]">最近处理记录</h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {recent.length === 0 ? (
            <p className="text-sm leading-7 text-[color:var(--muted)]">还没有处理过的提案。</p>
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
