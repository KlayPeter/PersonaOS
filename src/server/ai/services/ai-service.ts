import type { ArtifactType, PlaygroundFeedback } from "@prisma/client";

import type { ArtifactPolishOutput } from "@/server/ai/schemas/artifact-polish";
import type { FeedbackProposalOutput } from "@/server/ai/schemas/feedback-proposal";
import type { ProposalOutput } from "@/server/ai/schemas/proposal";
import type { InsightOutput } from "@/server/ai/schemas/insight";
import type { WorkspaceProfileSummaryOutput } from "@/server/ai/schemas/workspace-profile";
import { getPromptSpec, type PromptName } from "@/server/ai/prompt-registry";

type LLMLog = {
  model: string;
  promptName: string;
  promptVersion: string;
  retryCount: number;
  durationMs: number;
  inputTokens: number;
  outputTokens: number;
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

type RunPlaygroundInput = {
  artifact: {
    type: ArtifactType;
    title: string;
    content: string;
    version: number;
  };
  workspaceProfile: {
    identity: string;
    primaryScenarios: string[];
    rememberNotes: string;
    outputPreferences: string[];
  };
  task: string;
};

type ConvertFeedbackToProposalInput = {
  artifactType: ArtifactType;
  task: string;
  output: string;
  feedbackType: PlaygroundFeedback;
  feedbackText?: string;
};

type GenerateWorkspaceProfileSummaryInput = {
  name: string;
  description: string;
  identity: string;
  primaryScenarios: string[];
  rememberNotes: string;
  dislikedBehaviors: string[];
  outputPreferences: string[];
  exportGoals: string[];
};

type PolishArtifactInput = {
  type: ArtifactType;
  title: string;
  content: string;
};

function buildEvidence(content: string) {
  const normalized = content.replace(/\s+/g, " ").trim();
  return normalized.slice(0, 140) || "素材正文未提供足够证据。";
}

function includesAny(content: string, keywords: string[]) {
  return keywords.some((keyword) => content.includes(keyword));
}

function artifactFilename(type: ArtifactType) {
  if (type === "agents_md") {
    return "AGENTS.md";
  }

  if (type === "writing_style") {
    return "writing-style.md";
  }

  return "personal-system.md";
}

function estimateTokens(value: string) {
  return Math.max(1, Math.ceil(value.length / 4));
}

function buildLog<TInput, TOutput>(input: {
  promptName: PromptName;
  request: TInput;
  response: TOutput;
  durationMs: number;
  status?: "success" | "parse_failed" | "model_failed";
}): LLMLog {
  const prompt = getPromptSpec(input.promptName);
  const rawRequest = JSON.stringify(input.request, null, 2);
  const rawResponse = JSON.stringify(input.response, null, 2);

  return {
    model: process.env.AI_PROVIDER ?? "mock",
    promptName: input.promptName,
    promptVersion: prompt.version,
    retryCount: 0,
    durationMs: Math.max(1, input.durationMs),
    inputTokens: estimateTokens(rawRequest),
    outputTokens: estimateTokens(rawResponse),
    rawRequest,
    rawResponse,
    parsedOutput: rawResponse,
    status: input.status ?? "success",
  };
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

function summarizeArtifactExcerpt(content: string) {
  return content
    .split("\n")
    .filter((line) => line.trim())
    .slice(0, 6)
    .join("\n");
}

function buildPlaygroundOutput(input: RunPlaygroundInput) {
  const excerpt = summarizeArtifactExcerpt(input.artifact.content);

  return [
    `任务：${input.task}`,
    "",
    `使用资产：${artifactFilename(input.artifact.type)} v${input.artifact.version}`,
    "",
    "执行说明：",
    `- 当前身份：${input.workspaceProfile.identity || "未设置"}`,
    `- 重点场景：${input.workspaceProfile.primaryScenarios.join(" / ") || "未设置"}`,
    `- 输出偏好：${input.workspaceProfile.outputPreferences.join(" / ") || "未设置"}`,
    "",
    "资产要点摘录：",
    excerpt || "- 当前资产还没有可提炼的规则摘录。",
    "",
    "模拟输出：",
    `基于当前资产，PersonaOS 会优先围绕「${input.task}」给出结构清楚、贴合个人偏好的回答，并避免偏离既有规则。`,
  ].join("\n");
}

function buildWorkspaceProfileSummary(input: GenerateWorkspaceProfileSummaryInput) {
  const scenarios = input.primaryScenarios.length > 0 ? input.primaryScenarios.join("、") : "未明确主要场景";
  const preferences = input.outputPreferences.length > 0 ? input.outputPreferences.join("、") : "输出偏好仍待补充";
  const dislikes = input.dislikedBehaviors.length > 0 ? input.dislikedBehaviors.join("、") : "暂未强调明显禁忌";
  const goals = input.exportGoals.length > 0 ? input.exportGoals.join("、") : "导出目标仍待补充";

  return [
    `${input.name} 当前主要以「${input.identity || "未明确身份"}」的身份使用 PersonaOS，核心场景包括：${scenarios}。`,
    `在协作与输出上，优先追求 ${preferences}，并明确避免 ${dislikes}。`,
    input.rememberNotes
      ? `系统后续分析和生成时应长期记住：${input.rememberNotes}。`
      : "系统后续分析时应继续从素材中补全长期记忆点。",
    `当前最重要的导出目标是：${goals}。`,
  ].join("");
}

function polishArtifactMarkdown(content: string) {
  return content
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/修改后优先通过/g, "修改后优先采用")
    .replace(/保留可追踪输入输出/g, "保留可追踪的输入输出")
    .trim();
}

function mapFeedbackToProposal(
  input: ConvertFeedbackToProposalInput,
): FeedbackProposalOutput["proposals"] {
  const filename = artifactFilename(input.artifactType);
  const feedbackReason = input.feedbackText?.trim() || "用户在 Playground 中给出了负向反馈。";

  if (input.feedbackType === "too_scattered") {
    return [
      {
        title: "补充输出主线与结构控制规则",
        category: "writing",
        action: "add",
        proposedContent:
          "当输出较长内容时，必须先明确主线，再按层次展开；每个分节都要服务于中心论点，避免只堆积分点。",
        reason: "用户反馈当前 Playground 输出太散，说明现有资产对结构控制还不够明确。",
        evidence: feedbackReason,
        affectedArtifacts: ["writing-style.md", "personal-system.md"],
        confidence: 0.89,
      },
    ];
  }

  if (input.feedbackType === "too_vague" || input.feedbackType === "too_template") {
    return [
      {
        title: "补充反模板化表达规则",
        category: "ai_collaboration",
        action: "add",
        proposedContent:
          "输出必须优先给出具体判断、边界和例子，避免空泛总结、模板化套话和无证据延展。",
        reason: "Playground 反馈说明当前资产还不足以抑制空泛或模板化表达。",
        evidence: feedbackReason,
        affectedArtifacts: ["AGENTS.md", "writing-style.md"],
        confidence: 0.87,
      },
    ];
  }

  if (input.feedbackType === "not_like_me") {
    return [
      {
        title: "强化个人语气与偏好映射",
        category: "personal",
        action: "add",
        proposedContent:
          "生成内容前应先对齐用户身份、目标和常用表达风格，确保成文在结构、节奏和判断方式上更像用户本人。",
        reason: "用户直接反馈“不像我”，说明当前资产对个人风格映射还不够强。",
        evidence: feedbackReason,
        affectedArtifacts: [filename, "personal-system.md"],
        confidence: 0.84,
      },
    ];
  }

  if (input.feedbackType === "logic_weak" || input.feedbackType === "examples_missing") {
    return [
      {
        title: "要求关键结论补逻辑链路与示例",
        category: "knowledge",
        action: "add",
        proposedContent:
          "涉及观点输出时，至少补齐一层推理链路，并优先给出贴近场景的示例，避免只给结论不给支撑。",
        reason: "用户反馈说明当前资产需要更明确地约束论证与举例质量。",
        evidence: feedbackReason,
        affectedArtifacts: ["writing-style.md", "personal-system.md"],
        confidence: 0.83,
      },
    ];
  }

  return [
    {
      title: "细化 Playground 反馈对应的修正规则",
      category: "ai_collaboration",
      action: "add",
      proposedContent:
        "当 Playground 出现负向反馈时，应优先把反馈转成明确的结构、边界或表达规则，再进入 proposal 审核。",
      reason: "当前反馈暴露出资产仍有可细化空间，需要形成更明确的修正规则。",
      evidence: feedbackReason,
      affectedArtifacts: [filename, "personal-system.md"],
      confidence: 0.76,
    },
  ];
}

export class AIService {
  async analyzeMaterial(input: AnalyzeMaterialInput): Promise<AIResult<InsightOutput>> {
    const startedAt = Date.now();
    const output = {
      insights: buildInsights(input),
    };

    return {
      output,
      log: buildLog({
        promptName: "material-analysis",
        request: input,
        response: output,
        durationMs: Date.now() - startedAt,
      }),
    };
  }

  async generateRuleProposals(
    input: GenerateRuleProposalsInput,
  ): Promise<AIResult<ProposalOutput>> {
    const startedAt = Date.now();
    const output = {
      proposals: input.insights.map((insight) => mapInsightToProposal(insight)),
    };

    return {
      output,
      log: buildLog({
        promptName: "rule-proposal-generation",
        request: input,
        response: output,
        durationMs: Date.now() - startedAt,
      }),
    };
  }

  async runPlayground(input: RunPlaygroundInput): Promise<AIResult<{ output: string }>> {
    const startedAt = Date.now();
    const output = {
      output: buildPlaygroundOutput(input),
    };

    return {
      output,
      log: buildLog({
        promptName: "playground-run",
        request: input,
        response: output,
        durationMs: Date.now() - startedAt,
      }),
    };
  }

  async convertFeedbackToProposal(
    input: ConvertFeedbackToProposalInput,
  ): Promise<AIResult<FeedbackProposalOutput>> {
    const startedAt = Date.now();
    const output = {
      proposals: mapFeedbackToProposal(input),
    };

    return {
      output,
      log: buildLog({
        promptName: "feedback-to-proposal",
        request: input,
        response: output,
        durationMs: Date.now() - startedAt,
      }),
    };
  }

  async generateWorkspaceProfileSummary(
    input: GenerateWorkspaceProfileSummaryInput,
  ): Promise<AIResult<WorkspaceProfileSummaryOutput>> {
    const startedAt = Date.now();
    const output = {
      profileSummary: buildWorkspaceProfileSummary(input),
    };

    return {
      output,
      log: buildLog({
        promptName: "workspace-profile-init",
        request: input,
        response: output,
        durationMs: Date.now() - startedAt,
      }),
    };
  }

  async polishArtifact(input: PolishArtifactInput): Promise<AIResult<ArtifactPolishOutput>> {
    const startedAt = Date.now();
    const output = {
      content: polishArtifactMarkdown(input.content),
    };

    return {
      output,
      log: buildLog({
        promptName: "artifact-polish",
        request: input,
        response: output,
        durationMs: Date.now() - startedAt,
      }),
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
