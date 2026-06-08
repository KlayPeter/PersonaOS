# PersonaOS Harness 化实施方案

## 1. 文档目的

这份文档把 [需求文档.md](/Users/admin/Desktop/Peter/PersonaOS/需求文档.md) 转成偏工程落地的实施方案，并刻意向 `Harness` 风格靠拢。

这里的 `Harness` 先按一个通用定义理解：

- 它不是单纯的 Prompt 调用封装
- 它是 Agent 的运行外壳
- 它负责状态、步骤编排、人工确认、日志、评估、可回放

也就是说，PersonaOS 第一版不应只是一个“LLM 生成页面”，而应是一个：

```txt
可追踪的 Agent Workflow System
```

## 2. 核心设计原则

### 2.1 先做 Harness，再做聪明

第一版最重要的不是模型多强，而是把下面这些能力做出来：

- 明确的状态流转
- 可复盘的中间产物
- 人工审核关卡
- 可回放的执行日志
- 基本评估能力

### 2.2 Agent 只提案，不自动污染规则库

正式规则必须经过用户确认才能入库。这个原则直接决定 Harness 里必须存在：

- `proposal checkpoint`
- `human decision`
- `audit trail`

### 2.3 每一步都要有结构化输入输出

Harness 风格的系统不鼓励“大 Prompt 一把梭”。每个步骤都应该有：

- 输入上下文
- 输出 schema
- 错误处理
- 重试策略
- 结果落库

### 2.4 中间态比最终答案更重要

PersonaOS 的真正资产不是某次回答，而是这些中间态：

- `Insight`
- `RuleProposal`
- `Rule`
- `Artifact`
- `PlaygroundFeedback`

## 3. 产品主线与 Harness 对应关系

需求文档的主线是：

```txt
Material
  -> Insight
  -> RuleProposal
  -> Rule
  -> Artifact
  -> PlaygroundRun
  -> Feedback
  -> RuleProposal
```

把它翻译成 Harness 语言后，可以理解为：

```txt
Input
  -> Analyze Step
  -> Propose Step
  -> Human Approval Checkpoint
  -> Apply Step
  -> Compile Step
  -> Test Step
  -> Feedback Step
  -> Evolve Step
```

这意味着第一版架构应该围绕“工作流节点”来组织，而不是围绕“页面”来组织。

## 4. 建议的系统分层

```txt
Web UI
  -> App Services / API
  -> Harness Runtime
  -> AI Services
  -> Database / Artifact Storage / Logs
```

### 4.1 Web UI

职责：

- 收集用户输入
- 展示中间结果
- 呈现待审核提案
- 触发工作流步骤
- 接收反馈

页面继续沿用需求文档定义：

- `Onboarding`
- `Inbox`
- `Proposals`
- `Rulebase`
- `Artifacts`
- `Playground`

### 4.2 App Services / API

职责：

- 做权限和参数校验
- 组装工作流输入
- 调度 Harness Runtime
- 返回页面需要的数据

它不直接写复杂 Prompt 逻辑，只负责应用层入口。

### 4.3 Harness Runtime

这是 PersonaOS 第一版最值得重点设计的层。

职责：

- 维护工作流步骤
- 管理每一步的状态
- 记录执行日志
- 保存中间产物
- 在关键节点等待人工确认
- 支持失败重试和人工重跑

建议把 Harness Runtime 抽成这些模块：

- `workflow-registry`
- `step-runner`
- `checkpoint-manager`
- `run-logger`
- `schema-validator`
- `retry-policy`
- `run-replayer`

### 4.4 AI Services

建议统一收口，不要散落在页面和 API 中。

```ts
AIService
  analyzeMaterial()
  generateRuleProposals()
  generateArtifact()
  runPlayground()
  convertFeedbackToProposal()
```

每个方法都要：

- 输入明确
- 输出 JSON 或模板化 Markdown
- 使用 schema 校验
- 保存原始输入和原始输出

### 4.5 Data Layer

核心实体沿用需求文档，但建议额外增加 3 类 Harness 表：

#### WorkflowRun

记录一次完整流程执行。

```ts
WorkflowRun {
  id: string
  workspaceId: string
  workflowType: "analyze_material" | "generate_artifact" | "playground_run" | "feedback_to_proposal"
  status: "pending" | "running" | "waiting_for_human" | "completed" | "failed" | "cancelled"
  triggerSource: "user_action" | "system_retry"
  startedAt: Date
  finishedAt?: Date
}
```

#### StepRun

记录工作流内每一步。

```ts
StepRun {
  id: string
  workflowRunId: string
  stepName: string
  status: "pending" | "running" | "completed" | "failed" | "skipped"
  inputSnapshot: string
  outputSnapshot?: string
  errorMessage?: string
  startedAt: Date
  finishedAt?: Date
}
```

#### LLMRun

记录模型执行细节，便于调试和评估。

```ts
LLMRun {
  id: string
  stepRunId: string
  model: string
  promptName: string
  promptVersion: string
  inputTokens?: number
  outputTokens?: number
  rawRequest: string
  rawResponse?: string
  parsedOutput?: string
  status: "success" | "parse_failed" | "model_failed"
  createdAt: Date
}
```

## 5. 建议的核心工作流

### 5.1 素材分析工作流

```txt
User submits material
  -> create WorkflowRun
  -> load profile + existing rules
  -> analyze material
  -> persist insights
  -> generate proposals
  -> persist proposals
  -> mark material analyzed
```

推荐步骤：

1. `load_workspace_context`
2. `extract_insights`
3. `validate_insights_schema`
4. `persist_insights`
5. `generate_rule_proposals`
6. `validate_proposals_schema`
7. `persist_proposals`
8. `update_material_status`

### 5.2 提案应用工作流

```txt
User accepts proposal
  -> create WorkflowRun
  -> lock proposal
  -> create or update rule
  -> append changelog
  -> mark proposal accepted
```

推荐步骤：

1. `load_proposal`
2. `validate_human_decision`
3. `apply_rule_change`
4. `write_changelog`
5. `update_proposal_status`

### 5.3 资产生成工作流

```txt
User selects artifact type
  -> create WorkflowRun
  -> load active rules
  -> group rules by category
  -> compile markdown
  -> persist artifact version
```

推荐步骤：

1. `load_rulebase`
2. `build_artifact_context`
3. `generate_artifact_draft`
4. `validate_artifact_shape`
5. `persist_artifact`

### 5.4 Playground 反馈进化工作流

```txt
User runs playground
  -> generate output
  -> collect feedback
  -> convert feedback to proposal
  -> save proposal
```

推荐步骤：

1. `load_selected_artifact`
2. `run_task_with_artifact`
3. `save_playground_run`
4. `collect_feedback`
5. `convert_feedback_to_proposal`
6. `persist_feedback_proposals`

## 6. Prompt 设计策略

第一版建议拆成 4 个 Prompt，不建议合并：

1. `material-analysis`
2. `rule-proposal-generation`
3. `artifact-generation`
4. `feedback-to-proposal`

每个 Prompt 都要有：

- 唯一名字
- 版本号
- 输入说明
- 输出 schema
- 失败时兜底策略

建议放在：

```txt
src/server/ai/prompts/
```

Prompt 文件建议拆分：

- `system.md`
- `output-schema.ts`
- `example-input.json`
- `example-output.json`

这样后面做版本对比和评估会非常方便。

## 7. Artifact 生成策略

第一版不要把 Artifact 生成理解成“自由写作”，而要理解成“规则编译”。

推荐模式：

```txt
Rulebase
  -> category grouping
  -> template filling
  -> LLM polish if needed
```

也就是先模板化，再让模型润色，而不是反过来。

优点：

- 稳定
- 更可控
- 更容易调试
- 更像真正的资产系统

## 8. 目录结构建议

建议从一开始就按 Harness 思维组织代码：

```txt
src/
  app/
  components/
  server/
    api/
    db/
    domain/
    harness/
      workflows/
      steps/
      checkpoints/
      logging/
      retry/
      replay/
    ai/
      prompts/
      schemas/
      services/
    artifacts/
      templates/
      compilers/
    evals/
```

如果你不想一开始把目录拆太细，至少要有：

```txt
src/server/harness
src/server/ai
src/server/artifacts
src/server/domain
```

## 9. 建议的开发阶段

### Phase 0：先把 Harness 骨架做出来

目标：

- 有 `WorkflowRun`
- 有 `StepRun`
- 有统一 `AIService`
- 有 schema 校验
- 有基础日志

这一阶段先不追求页面漂亮。

### Phase 1：跑通 analyze workflow

目标：

- 素材可提交
- 分析可执行
- `Insight` 和 `RuleProposal` 可落库
- 分析结果可回看

### Phase 2：跑通 human approval workflow

目标：

- 提案可接受、拒绝、编辑后接受
- 正式规则可追溯来源
- changelog 正常记录

### Phase 3：跑通 artifact compile workflow

目标：

- 生成 `AGENTS.md`
- 生成 `writing-style.md`
- 生成 `personal-system.md`

### Phase 4：跑通 playground evolve workflow

目标：

- 能基于资产测试
- 能收反馈
- 能从反馈生成新提案

### Phase 5：补 eval 和 replay

目标：

- 有固定测试集
- 有结果对比
- 有工作流回放能力

## 10. 学习重点

如果你的目的不只是做出来，而是真的学会 Agent 实践，这个项目最值得刻意练的是：

### 10.1 状态机思维

学会把“AI 功能”翻译成：

- 状态
- 事件
- 转移
- 审核关卡

### 10.2 结构化输出思维

不要把模型当写手，要把它当“结构化中间产物生成器”。

### 10.3 可追踪性思维

每次失败都能回答：

- 哪一步失败了
- 输入是什么
- 模型输出了什么
- 为什么没过 schema

### 10.4 Evals 思维

不是“感觉不错”，而是：

- 提案接受率如何
- 提案被编辑率如何
- 空泛规则比例如何
- 反馈转提案的命中率如何

## 11. 第一版不要过早做的东西

- 不要一开始上多 Agent
- 不要一开始做自动入库
- 不要一开始做向量库
- 不要一开始做复杂插件导出
- 不要一开始做复杂文件解析

这些都不是第一版 Harness 的核心。

## 12. 当前建议结论

PersonaOS 最适合被做成一个：

```txt
Workflow-first
Human-approved
Traceable
Evaluable
Artifact-oriented
```

的 Agent 系统。

如果后续你真要接某个具体 Harness 框架或 SDK，也应先保留上述边界，不要让框架反过来定义产品。
