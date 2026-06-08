# PersonaOS Prompt 维护说明

本文档说明 PersonaOS 当前 prompt 的位置、版本维护方式，以及每次调整后应该怎么回归。

## 1. Prompt 清单

当前 prompt registry 位于：

[`src/server/ai/prompt-registry.ts`](/Users/admin/Desktop/Peter/PersonaOS/src/server/ai/prompt-registry.ts)

当前登记的 prompt 有：

1. `material-analysis`
   - 目的：从素材中提炼结构化 `insights`
   - system prompt：[`src/server/ai/prompts/material-analysis/system.md`](/Users/admin/Desktop/Peter/PersonaOS/src/server/ai/prompts/material-analysis/system.md)
2. `rule-proposal-generation`
   - 目的：把 `insights` 转成可审核的 `proposals`
   - system prompt：[`src/server/ai/prompts/rule-proposal-generation/system.md`](/Users/admin/Desktop/Peter/PersonaOS/src/server/ai/prompts/rule-proposal-generation/system.md)
3. `feedback-to-proposal`
   - 目的：把 Playground 反馈回流成新 proposal
   - system prompt：[`src/server/ai/prompts/feedback-to-proposal/system.md`](/Users/admin/Desktop/Peter/PersonaOS/src/server/ai/prompts/feedback-to-proposal/system.md)
4. `playground-run`
   - 目的：生成 Playground 模拟输出
   - 当前没有独立 `system.md`，逻辑内置在 [`src/server/ai/services/ai-service.ts`](/Users/admin/Desktop/Peter/PersonaOS/src/server/ai/services/ai-service.ts)

## 2. 版本维护规则

每次改 prompt 时，至少同步检查三件事：

1. 更新对应的 `system.md` 或内置逻辑
2. 如果语义发生实质变化，更新 `prompt-registry.ts` 中的 `version`
3. 确认 `AIService` 记录到的 `promptName / promptVersion` 与实际版本一致

建议约定：

- 小改措辞、不影响输出结构：可保持原版本
- 改输出倾向、判断口径、few-shot、字段组织：升一个版本
- 如果改了 schema 约束，必须同步版本号

## 3. 修改 prompt 的标准步骤

1. 先确认问题发生在哪个节点
   - `/runs` 看 `promptName`
   - `/runs` 看对应 step 的输入输出快照
   - 判断是 `material-analysis`、`rule-proposal-generation` 还是 `feedback-to-proposal`
2. 修改 prompt 或内置生成逻辑
3. 如有必要，更新 `prompt-registry.ts` 中的 `version`
4. 跑回归

```bash
npm run lint
npm test
npm run evals:materials
npm run review:proposals
```

5. 如果改动影响主链路，再补跑

```bash
npm run verify:mvp
```

## 4. 什么时候优先改 prompt，什么时候优先改规则

优先改 prompt：

- 同类问题在多个素材上重复出现
- 提案整体变得更空泛、更跑偏或更保守
- 同一 workflow step 的结构化输出经常偏离预期方向

优先改规则：

- 问题主要来自用户个体偏好，而不是模型节点普遍失真
- 只有某个 workspace 或某类任务需要特殊约束
- 反馈已经能稳定转成 proposal，只差人工确认入 Rulebase

## 5. 维护时重点观察的指标

- `npm run evals:materials` 的
  - insight 命中率
  - proposal 方向命中率
  - proposal 空泛率
  - proposal 可执行率
- `/proposals` 页面上的
  - 接受率
  - 编辑率
  - 空泛率
  - 人工抽样复查样本

## 6. 当前维护边界

- 当前 `AIService` 仍然是 `mock` provider，因此 prompt 维护更多是在维护“节点行为契约”和“未来真实模型接入后的回归基线”
- `playground-run` 目前没有外置 prompt 文件，后续如果接入真实模型，建议将其独立到 `src/server/ai/prompts/playground-run/system.md`
