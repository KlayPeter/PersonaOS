# PersonaOS MVP 验收演示脚本

本文档记录 `Epic 9` 的人工演示顺序，以及可直接执行的自动验收命令。

## 1. 自动验收命令

先确保本地数据库和开发环境已经启动：

```bash
npm run db:up
npm run db:migrate
npm run db:seed
```

然后执行：

```bash
npm run verify:mvp
```

脚本会自动跑通两条故事：

1. 写作者沉淀风格
2. 开发者生成 `AGENTS.md`

自动验收成功时，输出里会包含：

- 每条故事对应的素材标题
- 生成并确认的规则标题
- 最终产出的资产版本
- 关键检查点，例如 `insight/proposal` 数量、反馈回流结果、是否包含目标规则

## 2. 人工演示顺序

建议按下面顺序演示：

1. `/onboarding`
   填写或确认当前画像。
2. `/inbox`
   新增一条素材，保存后进入详情页。
3. `/inbox/[id]`
   点击 `运行 analyze workflow`，确认生成 `insights` 和 `proposals`。
4. `/proposals`
   对候选规则执行接受、拒绝或编辑后接受。
5. `/rulebase`
   确认正式规则已经入库，并能看到来源提案和来源素材。
6. `/artifacts`
   生成 `AGENTS.md` 或 `writing-style.md`，确认新版本已保存。
7. `/playground`
   选择资产、输入任务、查看输出，再提交一条反馈。
8. `/runs`
   查看刚才整条链路对应的 workflow、step、LLM 记录。
9. `/changelog`
   确认规则变更和资产生成都有时间线记录。

## 3. 用户故事 1：写作者沉淀风格

目标：

- 从素材中提炼写作结构偏好
- 接受规则后生成 `writing-style.md`
- 在 Playground 中继续给出“例子不够”的反馈

建议展示内容：

- 画像：技术写作者，偏好高密度、强结构、带启发
- 素材：博客片段 + “太散，不是要短，是要分类清楚”
- 提案处理：把规则确认成
  `长文应保持信息密度，但必须使用层级结构和辅助图表。`
- 资产导出：`writing-style.md`
- Playground 反馈：`这次更像我了，但例子还不够。`

期望结果：

- 成功生成 `writing-style.md`
- 反馈后新增一条与“补示例”相关的 proposal

## 4. 用户故事 2：开发者生成 AGENTS.md

目标：

- 从工程边界素材中提炼 AI coding 规则
- 接受规则后生成 `AGENTS.md`

建议展示内容：

- 画像：前端开发者，项目使用 Next.js + TypeScript
- 素材：README 摘要 + 开发规范 + AI 写坏代码案例
- 提案处理：把规则确认成
  `涉及 Next.js 和 TypeScript 项目时，AI 必须优先小步修改，不得无理由新增依赖或重写架构；开始改动前先说明影响范围，命名保持业务语义。`
- 资产导出：`AGENTS.md`

期望结果：

- `AGENTS.md` 中能看到工程边界、影响范围、命名语义这几类约束

## 5. 演示时重点观察

- `Material -> Insight -> RuleProposal -> Rulebase -> Artifact` 这条主线是否连续
- 所有失败提示是否都能给出下一步动作
- `/runs` 中是否能看到 workflow、step、LLM 的状态、快照、prompt version、tokens、耗时
- `/changelog` 是否同步记录了提案决策和资产生成
