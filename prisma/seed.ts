import { Prisma } from "@prisma/client";

import { getPrismaClient } from "../src/server/db/client";

async function main() {
  const prisma = getPrismaClient();
  const email = process.env.DEFAULT_USER_EMAIL ?? "demo@personaos.local";
  const name = process.env.DEFAULT_USER_NAME ?? "PersonaOS Demo";
  const workspaceName =
    process.env.DEFAULT_WORKSPACE_NAME ?? "My Personal System";

  const user = await prisma.user.upsert({
    where: { email },
    update: { name },
    create: {
      email,
      name,
    },
  });

  await prisma.workspace.upsert({
    where: { userId: user.id },
    update: {
      name: workspaceName,
    },
    create: {
      userId: user.id,
      name: workspaceName,
      description: "用于沉淀 PersonaOS 个人规则、风格与工作流的默认空间。",
      identity: "独立开发者 / 写作者 / 产品设计实践者",
      primaryScenarios: [
        "AI 写代码",
        "结构化写作",
        "沉淀个人规则",
      ] as Prisma.InputJsonValue,
      rememberNotes:
        "优先保证结构清晰、工程边界明确、输出稳定且可复用。",
      dislikedBehaviors: [
        "乱改架构",
        "乱加依赖",
        "输出空话",
      ] as Prisma.InputJsonValue,
      outputPreferences: [
        "信息密度高",
        "有明确结构",
        "先结论后展开",
      ] as Prisma.InputJsonValue,
      exportGoals: [
        "AGENTS.md",
        "writing-style.md",
        "personal-system.md",
      ] as Prisma.InputJsonValue,
      profileSummary:
        "这个 workspace 聚焦于把用户的经验、偏好和禁忌转成可被 AI 执行的个人体系资产。",
    },
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await getPrismaClient().$disconnect();
  });
