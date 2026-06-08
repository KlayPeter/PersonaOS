import { ProposalStatus, RuleStatus, type ProposalCategory } from "@prisma/client";

import { getPrismaClient } from "@/server/db/client";
import { generateArtifactWorkflow } from "@/server/domain/artifacts";
import { createMaterial, getMaterialDetail } from "@/server/domain/materials";
import {
  applyProposalWorkflow,
  rejectProposal,
} from "@/server/domain/proposals";
import { feedbackToProposalWorkflow, playgroundRunWorkflow } from "@/server/domain/playground";
import { getOrCreateDefaultWorkspace, updateWorkspaceProfile } from "@/server/domain/workspace";
import { analyzeMaterialWorkflow } from "@/server/harness/workflows/analyze-material";

type StoryCheck = {
  label: string;
  value: string;
};

type StoryResult = {
  story: string;
  materialTitle: string;
  proposalTitle: string;
  artifactTitle: string;
  artifactVersion: number;
  checks: StoryCheck[];
};

function assertCondition(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function rejectUnusedMaterialProposals(materialId: string, keepProposalId: string) {
  const prisma = getPrismaClient();
  const proposals = await prisma.ruleProposal.findMany({
    where: {
      materialId,
      status: ProposalStatus.pending,
      id: {
        not: keepProposalId,
      },
    },
  });

  for (const proposal of proposals) {
    await rejectProposal(proposal.id);
  }
}

async function resolveRuleFromProposal(input: {
  materialId: string;
  preferredCategories: ProposalCategory[];
  finalTitle: string;
  finalContent: string;
  finalCategory: ProposalCategory;
}) {
  const prisma = getPrismaClient();
  const workspace = await getOrCreateDefaultWorkspace();
  const proposal = await prisma.ruleProposal.findFirst({
    where: {
      materialId: input.materialId,
      workspaceId: workspace.id,
      status: ProposalStatus.pending,
      category: {
        in: input.preferredCategories,
      },
    },
    orderBy: { createdAt: "desc" },
  });

  assertCondition(proposal, `没有找到可用于验收的提案：${input.finalTitle}`);

  const existingRule = await prisma.rule.findFirst({
    where: {
      workspaceId: workspace.id,
      title: input.finalTitle,
      category: input.finalCategory,
      status: RuleStatus.active,
    },
    orderBy: { updatedAt: "desc" },
  });

  await rejectUnusedMaterialProposals(input.materialId, proposal.id);

  if (existingRule) {
    await rejectProposal(proposal.id);
    return existingRule;
  }

  const result = await applyProposalWorkflow({
    proposalId: proposal.id,
    decision: "edit_and_accept",
    editedTitle: input.finalTitle,
    editedContent: input.finalContent,
    editedCategory: input.finalCategory,
  });

  assertCondition(result.result.rule, `提案未能成功写入规则库：${input.finalTitle}`);
  return result.result.rule;
}

async function runWriterStory(): Promise<StoryResult> {
  await updateWorkspaceProfile({
    name: "Writer Persona Workspace",
    description: "用于 MVP 写作者故事验收。",
    identity: "技术写作者",
    primaryScenarios: ["写长文", "沉淀风格", "和 AI 协作改稿"],
    rememberNotes: "喜欢有逻辑、有密度、有启发的文章。",
    dislikedBehaviors: ["空话", "跑偏", "模板腔"],
    outputPreferences: ["主线清楚", "信息密度高", "有例子"],
    exportGoals: ["writing-style.md", "personal-system.md"],
    profileSummary: "偏好高密度、强结构、带启发和例子的长文表达。",
  });

  const material = await createMaterial({
    title: "[MVP Story] 写作者沉淀风格",
    type: "feedback",
    summary: "组合博客样本和结构反馈，验证从素材到 writing-style.md 的主线。",
    tags: ["mvp-story", "writer", "writing-style"],
    content: [
      "博客片段：我想写长文，但不想写成空泛总结。",
      "AI 反馈：太散，不是要短，是要分类清楚。",
      "补充要求：长文可以继续长，但要有主线、有层级、有辅助图表，关键观点最好配例子。",
    ].join("\n"),
  });

  const analyze = await analyzeMaterialWorkflow(material.id);
  const detail = await getMaterialDetail(material.id);
  assertCondition(detail, "写作者故事的素材详情不存在。");
  assertCondition(detail.insights.length >= 1, "写作者故事没有生成 insight。");
  assertCondition(detail.proposals.length >= 1, "写作者故事没有生成 proposal。");

  const rule = await resolveRuleFromProposal({
    materialId: material.id,
    preferredCategories: ["writing"],
    finalTitle: "长文结构与信息密度",
    finalContent: "长文应保持信息密度，但必须使用层级结构和辅助图表。",
    finalCategory: "writing",
  });

  const artifactResult = await generateArtifactWorkflow("writing_style", { polish: true });
  assertCondition(
    artifactResult.result.content.includes("长文应保持信息密度，但必须使用层级结构和辅助图表。"),
    "writing-style.md 未包含写作者故事确认后的规则。",
  );

  const playgroundRun = await playgroundRunWorkflow({
    artifactType: "writing_style",
    task: "帮我写一篇关于 AGENTS.md 的认知篇博客。",
  });
  const feedbackResult = await feedbackToProposalWorkflow({
    runId: playgroundRun.result.id,
    feedbackType: "examples_missing",
    feedbackText: "这次更像我了，但例子还不够。",
  });

  const feedbackProposals = Array.isArray(feedbackResult.result.proposals)
    ? feedbackResult.result.proposals
    : [];
  const feedbackProposalTitle = feedbackProposals[0]?.title ?? "未生成反馈提案";
  assertCondition(
    feedbackProposals.length > 0,
    "写作者故事没有从 Playground 反馈生成新 proposal。",
  );
  const prisma = getPrismaClient();
  const savedRun = await prisma.playgroundRun.findUnique({
    where: { id: playgroundRun.result.id },
  });
  assertCondition(savedRun?.feedbackContextBefore, "写作者故事没有保存反馈前上下文。");
  assertCondition(savedRun?.feedbackContextAfter, "写作者故事没有保存反馈后上下文。");

  return {
    story: "写作者沉淀风格",
    materialTitle: material.title,
    proposalTitle: rule.title,
    artifactTitle: artifactResult.result.title,
    artifactVersion: artifactResult.result.version,
    checks: [
      { label: "analyze", value: `${analyze.result.insights} insights / ${analyze.result.proposals} proposals` },
      { label: "rule", value: rule.title },
      { label: "artifact", value: `${artifactResult.result.title} v${artifactResult.result.version}` },
      { label: "feedback proposal", value: feedbackProposalTitle },
      { label: "feedback context", value: "saved" },
    ],
  };
}

async function runDeveloperStory(): Promise<StoryResult> {
  await updateWorkspaceProfile({
    name: "Developer Persona Workspace",
    description: "用于 MVP 开发者故事验收。",
    identity: "前端开发者",
    primaryScenarios: ["AI 写代码", "评审代码修改", "维护 Next.js 项目"],
    rememberNotes: "项目使用 Next.js 和 TypeScript，不希望 AI 乱改架构、乱加依赖。",
    dislikedBehaviors: ["乱加依赖", "大改架构", "没有说明影响范围"],
    outputPreferences: ["小步修改", "可 review", "命名有业务语义"],
    exportGoals: ["AGENTS.md", "personal-system.md"],
    profileSummary: "偏好小步、守边界、先说明影响范围的 AI coding 协作方式。",
  });

  const material = await createMaterial({
    title: "[MVP Story] 开发者生成 AGENTS",
    type: "project_description",
    summary: "组合 README、开发规范与坏案例，验证从素材到 AGENTS.md 的主线。",
    tags: ["mvp-story", "developer", "agents"],
    content: [
      "README 摘要：项目使用 Next.js 和 TypeScript，优先沿用现有目录和依赖。",
      "开发规范：修改前应先说明影响范围，命名保持业务语义，优先小步提交。",
      "坏案例：AI 曾经为了省事直接重写模块结构，还引入新依赖，导致 review 和回滚都很痛苦。",
    ].join("\n"),
  });

  const analyze = await analyzeMaterialWorkflow(material.id);
  const detail = await getMaterialDetail(material.id);
  assertCondition(detail, "开发者故事的素材详情不存在。");
  assertCondition(detail.insights.length >= 1, "开发者故事没有生成 insight。");
  assertCondition(detail.proposals.length >= 1, "开发者故事没有生成 proposal。");

  const rule = await resolveRuleFromProposal({
    materialId: material.id,
    preferredCategories: ["coding", "ai_collaboration"],
    finalTitle: "前端协作边界与影响说明",
    finalContent:
      "涉及 Next.js 和 TypeScript 项目时，AI 必须优先小步修改，不得无理由新增依赖或重写架构；开始改动前先说明影响范围，命名保持业务语义。",
    finalCategory: "coding",
  });

  const artifactResult = await generateArtifactWorkflow("agents_md", { polish: true });
  assertCondition(
    artifactResult.result.content.includes("开始改动前先说明影响范围"),
    "AGENTS.md 未包含开发者故事确认后的影响范围规则。",
  );
  assertCondition(
    artifactResult.result.content.includes("不得无理由新增依赖或重写架构"),
    "AGENTS.md 未包含开发者故事确认后的工程边界规则。",
  );

  return {
    story: "开发者生成 AGENTS.md",
    materialTitle: material.title,
    proposalTitle: rule.title,
    artifactTitle: artifactResult.result.title,
    artifactVersion: artifactResult.result.version,
    checks: [
      { label: "analyze", value: `${analyze.result.insights} insights / ${analyze.result.proposals} proposals` },
      { label: "rule", value: rule.title },
      { label: "artifact", value: `${artifactResult.result.title} v${artifactResult.result.version}` },
      { label: "contains", value: "影响范围 / 新增依赖 / 业务语义" },
    ],
  };
}

export async function runMvpStories() {
  const workspace = await getOrCreateDefaultWorkspace();
  const writer = await runWriterStory();
  const developer = await runDeveloperStory();

  return {
    workspaceName: workspace.name,
    stories: [writer, developer],
  };
}
