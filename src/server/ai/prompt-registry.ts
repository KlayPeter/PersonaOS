export const promptRegistry = {
  "material-analysis": {
    version: "v1",
    systemPromptPath: "src/server/ai/prompts/material-analysis/system.md",
    purpose: "从素材中提炼结构化 insights。",
  },
  "rule-proposal-generation": {
    version: "v1",
    systemPromptPath: "src/server/ai/prompts/rule-proposal-generation/system.md",
    purpose: "把 insights 转成可审核的 proposal。",
  },
  "playground-run": {
    version: "v1",
    systemPromptPath: null,
    purpose: "基于资产与画像生成 Playground 模拟输出。",
  },
  "feedback-to-proposal": {
    version: "v1",
    systemPromptPath: "src/server/ai/prompts/feedback-to-proposal/system.md",
    purpose: "把 Playground 反馈回流成新的 proposal。",
  },
} as const;

export type PromptName = keyof typeof promptRegistry;

export function getPromptSpec(name: PromptName) {
  return promptRegistry[name];
}
