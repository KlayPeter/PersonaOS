import type { ProposalOutput } from "@/server/ai/schemas/proposal";
import type { InsightOutput } from "@/server/ai/schemas/insight";

type LLMLog = {
  model: string;
  promptName: string;
  promptVersion: string;
  rawRequest: string;
  rawResponse: string;
  parsedOutput: string;
  status: "success" | "parse_failed" | "model_failed";
};

type AIResult<T> = {
  output: T;
  log: LLMLog;
};

type AnalyzeMaterialInput = {
  workspaceProfile: {
    identity: string;
    primaryScenarios: string[];
    rememberNotes: string;
    dislikedBehaviors: string[];
    outputPreferences: string[];
  };
  material: {
    title: string;
    type: string;
    summary: string;
    content: string;
  };
  existingRules: Array<{
    title: string;
    content: string;
  }>;
};

type GenerateRuleProposalsInput = {
  insights: InsightOutput["insights"];
  material: {
    title: string;
    type: string;
  };
};

function buildEvidence(content: string) {
  const normalized = content.replace(/\s+/g, " ").trim();
  return normalized.slice(0, 140) || "素材正文未提供足够证据。";
}

function includesAny(content: string, keywords: string[]) {
  return keywords.some((keyword) => content.includes(keyword));
}

function buildInsights(input: AnalyzeMaterialInput): InsightOutput["insights"] {
  const text = [
    input.material.title,
    input.material.summary,
    input.material.content,
    input.workspaceProfile.rememberNotes,
    input.workspaceProfile.dislikedBehaviors.join(" "),
    input.workspaceProfile.outputPreferences.join(" "),
  ]
    .join(" ")
    .toLowerCase();

  const evidence = buildEvidence(input.material.content);
  const insights: InsightOutput["insights"] = [];

  if (includesAny(text, ["结构", "分类", "逻辑", "主线", "清晰"])) {
    insights.push({
      type: "style",
      title: "用户偏好高密度但结构清晰的表达",
      description:
        "素材反复强调结构、分类和主线，说明用户更关注信息组织质量，而不是一味压缩篇幅。",
      evidence,
      confidence: 0.92,
    });
  }

  if (includesAny(text, ["架构", "依赖", "重构", "工程", "边界"])) {
    insights.push({
      type: "boundary",
      title: "用户希望 AI 严守工程边界",
      description:
        "涉及代码或工程协作时，AI 不应随意改架构、扩依赖或脱离既有约束做大幅变更。",
      evidence,
      confidence: 0.9,
    });
  }

  if (includesAny(text, ["不要", "讨厌", "别", "禁止", "空话", "模板化"])) {
    insights.push({
      type: "anti_pattern",
      title: "用户明确排斥空泛和模板化输出",
      description:
        "素材里包含明确的负向反馈，说明 PersonaOS 需要优先避免套话、跑偏和无效铺陈。",
      evidence,
      confidence: 0.88,
    });
  }

  if (includesAny(text, ["流程", "复盘", "步骤", "工作流", "沉淀"])) {
    insights.push({
      type: "workflow",
      title: "用户重视可复用的工作流沉淀",
      description:
        "素材不仅关注答案质量，还关注是否能沉淀成后续可执行、可复盘的流程与规则。",
      evidence,
      confidence: 0.85,
    });
  }

  if (insights.length === 0) {
    insights.push({
      type: "preference",
      title: "当前素材体现出明确的个人偏好",
      description:
        "即便信号不够集中，也能确认这条素材包含可被 PersonaOS 提炼的个人偏好与表达方式。",
      evidence,
      confidence: 0.72,
    });
  }

  return insights.slice(0, 4);
}

function mapInsightToProposal(
  insight: InsightOutput["insights"][number],
): ProposalOutput["proposals"][number] {
  if (insight.type === "boundary") {
    return {
      title: "将工程边界写入协作规则",
      category: "coding",
      action: "add",
      proposedContent:
        "当任务涉及代码修改时，AI 必须优先遵守现有架构与依赖边界，除非用户明确授权，否则不主动扩依赖或重写结构。",
      reason: insight.description,
      evidence: insight.evidence,
      affectedArtifacts: ["AGENTS.md", "personal-system.md"],
      confidence: insight.confidence,
    };
  }

  if (insight.type === "style") {
    return {
      title: "补充结构化表达规则",
      category: "writing",
      action: "add",
      proposedContent:
        "保持信息密度的同时，优先通过分层标题、表格、步骤化展开和明确主线来降低阅读负担。",
      reason: insight.description,
      evidence: insight.evidence,
      affectedArtifacts: ["writing-style.md", "personal-system.md"],
      confidence: insight.confidence,
    };
  }

  if (insight.type === "workflow") {
    return {
      title: "把复盘结果沉淀为流程资产",
      category: "knowledge",
      action: "add",
      proposedContent:
        "对重复出现的经验和反馈，优先整理为可复用的步骤、判断标准和复盘清单，再决定是否升级为正式规则。",
      reason: insight.description,
      evidence: insight.evidence,
      affectedArtifacts: ["personal-system.md"],
      confidence: insight.confidence,
    };
  }

  return {
    title: "补充 PersonaOS 个性化协作规则",
    category: "ai_collaboration",
    action: "add",
    proposedContent:
      "AI 输出应避免空话、模板化和无依据延展，优先给出结构清楚、贴合上下文且可直接执行的内容。",
    reason: insight.description,
    evidence: insight.evidence,
    affectedArtifacts: ["AGENTS.md", "writing-style.md"],
    confidence: insight.confidence,
  };
}

export class AIService {
  async analyzeMaterial(input: AnalyzeMaterialInput): Promise<AIResult<InsightOutput>> {
    const output = {
      insights: buildInsights(input),
    };

    return {
      output,
      log: {
        model: process.env.AI_PROVIDER ?? "mock",
        promptName: "material-analysis",
        promptVersion: "v1",
        rawRequest: JSON.stringify(input, null, 2),
        rawResponse: JSON.stringify(output, null, 2),
        parsedOutput: JSON.stringify(output, null, 2),
        status: "success",
      },
    };
  }

  async generateRuleProposals(
    input: GenerateRuleProposalsInput,
  ): Promise<AIResult<ProposalOutput>> {
    const output = {
      proposals: input.insights.map((insight) => mapInsightToProposal(insight)),
    };

    return {
      output,
      log: {
        model: process.env.AI_PROVIDER ?? "mock",
        promptName: "rule-proposal-generation",
        promptVersion: "v1",
        rawRequest: JSON.stringify(input, null, 2),
        rawResponse: JSON.stringify(output, null, 2),
        parsedOutput: JSON.stringify(output, null, 2),
        status: "success",
      },
    };
  }
}

let service: AIService | undefined;

export function getAIService() {
  if (!service) {
    service = new AIService();
  }

  return service;
}
