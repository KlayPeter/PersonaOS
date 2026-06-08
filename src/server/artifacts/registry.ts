import type { ArtifactType } from "@prisma/client";

export const artifactMetadata: Record<
  ArtifactType,
  { title: string; filename: string; description: string }
> = {
  agents_md: {
    title: "AGENTS.md",
    filename: "AGENTS.md",
    description: "面向 coding agent 的协作与工程规则。",
  },
  writing_style: {
    title: "writing-style.md",
    filename: "writing-style.md",
    description: "写作风格、结构偏好与修订规则。",
  },
  personal_system: {
    title: "personal-system.md",
    filename: "personal-system.md",
    description: "PersonaOS 当前正式规则的系统总览。",
  },
};

export const artifactTypeOptions = Object.entries(artifactMetadata).map(([type, value]) => ({
  type: type as ArtifactType,
  ...value,
}));
