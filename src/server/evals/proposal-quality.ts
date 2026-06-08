type ProposalLike = {
  title: string;
  proposedContent: string;
  reason?: string;
};

const vagueMarkers = ["个性化", "修正规则", "细化空间", "需要形成", "可细化", "补充 personaos"];
const actionableMarkers = ["必须", "优先", "至少", "避免", "先", "再", "按", "通过"];

function normalize(input: ProposalLike) {
  return [input.title, input.proposedContent, input.reason ?? ""]
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

export function isVagueProposal(input: ProposalLike) {
  const text = normalize(input);

  if (text.length < 28) {
    return true;
  }

  return vagueMarkers.some((marker) => text.includes(marker)) && !actionableMarkers.some((marker) => text.includes(marker));
}

export function isActionableProposal(input: ProposalLike) {
  const text = normalize(input);

  if (text.length < 20) {
    return false;
  }

  return actionableMarkers.some((marker) => text.includes(marker));
}
