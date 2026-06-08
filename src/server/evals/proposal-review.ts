import { ProposalStatus } from "@prisma/client";

import { isActionableProposal, isVagueProposal } from "@/server/evals/proposal-quality";

type ReviewProposalLike = {
  id: string;
  title: string;
  category: string;
  proposedContent: string;
  reason: string;
  evidence: string;
  status: ProposalStatus;
  confidence: number | null;
  updatedAt: Date;
  material?: { title: string } | null;
  insight?: { title: string } | null;
};

function toRate(hit: number, total: number) {
  if (total === 0) {
    return 0;
  }

  return Number((hit / total).toFixed(4));
}

function buildReviewReason(input: {
  status: ProposalStatus;
  isVague: boolean;
  isActionable: boolean;
  confidence: number | null;
}) {
  if (input.status === ProposalStatus.edited) {
    return "编辑后接受：复查 AI 初稿与最终规则之间的偏差。";
  }

  if (input.isVague) {
    return "判定为空泛：复查是否误收，或是否还需要更明确的动作约束。";
  }

  if (!input.isActionable && input.status !== ProposalStatus.rejected) {
    return "可执行性偏弱：复查规则是否仍然过于抽象。";
  }

  if (input.status === ProposalStatus.rejected && (input.confidence ?? 0) >= 0.8) {
    return "高置信度被拒绝：复查是否存在 prompt 方向偏差或误杀。";
  }

  if (input.status === ProposalStatus.accepted) {
    return "常规抽样：确认接受口径是否稳定。";
  }

  return "常规抽样：复查人审决策与证据是否匹配。";
}

export function buildProposalReviewSnapshot(proposals: ReviewProposalLike[]) {
  const decided = proposals.filter((proposal) => proposal.status !== ProposalStatus.pending);
  const acceptedCount = decided.filter((proposal) => proposal.status === ProposalStatus.accepted).length;
  const editedCount = decided.filter((proposal) => proposal.status === ProposalStatus.edited).length;
  const rejectedCount = decided.filter((proposal) => proposal.status === ProposalStatus.rejected).length;
  const vagueCount = proposals.filter((proposal) => isVagueProposal(proposal)).length;
  const actionableCount = proposals.filter((proposal) => isActionableProposal(proposal)).length;

  const sample = decided
    .map((proposal) => {
      const vague = isVagueProposal(proposal);
      const actionable = isActionableProposal(proposal);

      return {
        ...proposal,
        isVague: vague,
        isActionable: actionable,
        reviewReason: buildReviewReason({
          status: proposal.status,
          isVague: vague,
          isActionable: actionable,
          confidence: proposal.confidence,
        }),
      };
    })
    .sort((left, right) => right.updatedAt.getTime() - left.updatedAt.getTime())
    .sort((left, right) => {
      const leftWeight =
        (left.status === ProposalStatus.edited ? 3 : 0) +
        (left.isVague ? 2 : 0) +
        (!left.isActionable ? 1 : 0);
      const rightWeight =
        (right.status === ProposalStatus.edited ? 3 : 0) +
        (right.isVague ? 2 : 0) +
        (!right.isActionable ? 1 : 0);

      return rightWeight - leftWeight;
    })
    .slice(0, 5);

  return {
    totalProposalCount: proposals.length,
    pendingCount: proposals.filter((proposal) => proposal.status === ProposalStatus.pending).length,
    decisionCount: decided.length,
    acceptedCount,
    editedCount,
    rejectedCount,
    vagueCount,
    actionableCount,
    acceptanceRate: toRate(acceptedCount, decided.length),
    editedRate: toRate(editedCount, decided.length),
    rejectionRate: toRate(rejectedCount, decided.length),
    vagueRate: toRate(vagueCount, proposals.length),
    actionableRate: toRate(actionableCount, proposals.length),
    sample,
  };
}
