# PersonaOS 技术任务清单

## 1. 文档目的

这份清单把需求文档拆成可以执行的技术任务，并按 `Harness 化 Agent 产品` 的方式组织。

优先级说明：

- `P0` 必做，决定 MVP 是否成立
- `P1` 应做，决定体验是否顺滑
- `P2` 可延后，决定中期扩展性

状态说明：

- `[ ]` 未开始
- `[~]` 进行中
- `[x]` 已完成

## 2. Epic 0：项目骨架与工程初始化

### 2.1 仓库与基础工程

- [x] `P0` 初始化 Next.js + TypeScript 项目
- [x] `P0` 配置 ESLint、Prettier、基础 tsconfig
- [x] `P0` 接入 Tailwind CSS
- [ ] `P1` 接入 shadcn/ui 基础组件
- [x] `P0` 建立 `src/app`、`src/server`、`docs` 目录结构
- [x] `P0` 建立环境变量模板 `.env.example`

### 2.2 数据库与 ORM

- [x] `P0` 选择并初始化 MySQL
- [x] `P0` 接入 Prisma
- [x] `P0` 建立初始 migration
- [x] `P0` 配置本地 seed 脚本

### 2.3 Harness 基础设施

- [x] `P0` 创建 `src/server/harness` 目录
- [x] `P0` 定义 `WorkflowRun` 数据模型
- [x] `P0` 定义 `StepRun` 数据模型
- [x] `P0` 定义 `LLMRun` 数据模型
- [x] `P0` 实现基础 `workflow runner`
- [x] `P0` 实现基础 `step logger`
- [x] `P1` 实现 `retry policy`
- [x] `P1` 实现 `run replay` 设计草案

### 2.4 AI 基础设施

- [x] `P0` 创建 `AIService` 统一入口
- [x] `P0` 定义模型调用接口
- [x] `P0` 接入 JSON schema 校验
- [x] `P0` 统一模型错误处理
- [ ] `P1` 记录 token、耗时、失败原因

## 3. Epic 1：用户与 Workspace

### 3.1 数据模型

- [x] `P0` 创建 `User` 表
- [x] `P0` 创建 `Workspace` 表
- [x] `P0` 约束一个用户默认一个 workspace

### 3.2 Onboarding 页面

- [x] `P0` 建立 `/app/onboarding` 页面
- [x] `P0` 实现身份、场景、偏好、讨厌行为、导出目标表单
- [x] `P0` 支持保存用户画像
- [x] `P0` 支持编辑用户画像
- [ ] `P1` 根据填写内容生成初始 `Personal Profile`

### 3.3 API

- [x] `P0` 实现创建 workspace 接口
- [x] `P0` 实现读取 workspace 接口
- [x] `P0` 实现更新 profile 接口

验收标准：

- 用户第一次进入系统可以完成画像初始化
- 页面刷新后能正确读取已保存画像

## 4. Epic 2：Inbox 与 Material 管理

### 4.1 数据模型

- [x] `P0` 创建 `Material` 表
- [x] `P0` 支持 `type`、`tags`、`status`
- [x] `P0` 实现 `unprocessed/analyzed/used/archived` 状态

### 4.2 页面

- [x] `P0` 建立 `/app/inbox` 页面
- [x] `P0` 实现素材列表
- [x] `P0` 实现新增素材表单
- [x] `P0` 支持选择素材类型
- [x] `P1` 支持标签
- [ ] `P1` 支持删除素材
- [x] `P1` 建立 `/app/inbox/[id]` 详情页

### 4.3 API

- [x] `P0` 实现 `POST /api/materials`
- [x] `P0` 实现 `GET /api/materials`
- [x] `P0` 实现 `GET /api/materials/:id`
- [ ] `P1` 实现 `DELETE /api/materials/:id`

验收标准：

- 用户可以录入一条文本素材
- 素材保存后在 Inbox 列表中可见
- 可区分不同素材类型和处理状态

## 5. Epic 3：Analyze Workflow

### 5.1 数据模型

- [x] `P0` 创建 `Insight` 表
- [x] `P0` 创建 `RuleProposal` 表

### 5.2 Prompt 与 Schema

- [x] `P0` 创建 `material-analysis` prompt
- [x] `P0` 定义 `Insight` 输出 schema
- [x] `P0` 创建 `rule-proposal-generation` prompt
- [x] `P0` 定义 `RuleProposal` 输出 schema
- [ ] `P1` 为 prompt 增加 few-shot 示例
- [ ] `P1` 增加 prompt version 字段

### 5.3 Harness Workflow

- [x] `P0` 实现 `analyze_material` workflow
- [x] `P0` 步骤 1：加载画像和已有规则
- [x] `P0` 步骤 2：调用 `analyzeMaterial()`
- [x] `P0` 步骤 3：校验 insight schema
- [x] `P0` 步骤 4：保存 insights
- [x] `P0` 步骤 5：调用 `generateRuleProposals()`
- [x] `P0` 步骤 6：校验 proposal schema
- [x] `P0` 步骤 7：保存 proposals
- [x] `P0` 步骤 8：更新 material 状态

### 5.4 页面与 API

- [x] `P0` 在素材详情页增加“分析”按钮
- [x] `P0` 实现 `POST /api/materials/:id/analyze`
- [x] `P0` 在素材详情页展示 insights 列表
- [x] `P0` 在素材详情页展示 proposals 列表
- [x] `P1` 展示每条洞察和提案的 evidence
- [x] `P1` 展示 confidence

验收标准：

- 一条素材能生成结构化 insights
- insights 能进一步生成 proposals
- 整个过程有 WorkflowRun 和 StepRun 记录

## 6. Epic 4：Proposal 审核与 Rulebase 入库

### 6.1 数据模型

- [x] `P0` 创建 `Rule` 表
- [x] `P0` 创建 `Changelog` 表
- [x] `P0` 规则保留 `sourceProposalId`
- [x] `P0` 规则保留 `sourceMaterialId`

### 6.2 Proposals 页面

- [x] `P0` 建立 `/app/proposals` 页面
- [x] `P0` 展示待审核 proposal 列表
- [x] `P0` 支持接受 proposal
- [x] `P0` 支持拒绝 proposal
- [x] `P0` 支持编辑后接受
- [x] `P1` 展示 `affectedArtifacts`
- [x] `P1` 展示 evidence 原文片段

### 6.3 Harness Workflow

- [x] `P0` 实现 `apply_proposal` workflow
- [x] `P0` 步骤 1：加载 proposal
- [x] `P0` 步骤 2：检查 proposal 是否可操作
- [x] `P0` 步骤 3：创建或更新 rule
- [x] `P0` 步骤 4：写入 changelog
- [x] `P0` 步骤 5：更新 proposal 状态

### 6.4 API

- [x] `P0` 实现 `POST /api/proposals/:id/accept`
- [x] `P0` 实现 `POST /api/proposals/:id/reject`
- [x] `P0` 实现 `POST /api/proposals/:id/edit-and-accept`

验收标准：

- 用户可以把候选规则转成正式规则
- 每条正式规则都能追溯来源
- AI 不能绕过人工确认直接写规则

## 7. Epic 5：Rulebase 与版本记录

### 7.1 Rulebase 页面

- [x] `P0` 建立 `/app/rulebase` 页面
- [x] `P0` 按分类展示规则
- [x] `P0` 支持手动编辑规则
- [x] `P0` 显示更新时间
- [x] `P0` 显示来源
- [x] `P1` 支持归档规则

### 7.2 Changelog 页面

- [x] `P1` 建立 `/app/changelog` 页面
- [x] `P1` 展示规则新增、修改、删除、生成资产记录

### 7.3 API

- [x] `P0` 实现 `GET /api/rules`
- [x] `P0` 实现 `PATCH /api/rules/:id`
- [x] `P1` 实现 `POST /api/rules/:id/archive`
- [x] `P1` 实现 `GET /api/changelog`

验收标准：

- 用户能浏览正式规则库
- 规则修改后保留历史痕迹

## 8. Epic 6：Artifacts 编译与导出

### 8.1 数据模型

- [x] `P0` 创建 `Artifact` 表
- [x] `P0` 支持 `type` 和 `version`

### 8.2 模板系统

- [x] `P0` 创建 `AGENTS.md` 模板
- [x] `P0` 创建 `writing-style.md` 模板
- [x] `P0` 创建 `personal-system.md` 模板
- [x] `P0` 创建规则分类到模板段落的映射逻辑
- [ ] `P1` 增加 LLM 润色可选步骤

### 8.3 Harness Workflow

- [x] `P0` 实现 `generate_artifact` workflow
- [x] `P0` 步骤 1：加载 active rules
- [x] `P0` 步骤 2：整理 artifact context
- [x] `P0` 步骤 3：生成 artifact 内容
- [x] `P0` 步骤 4：保存 artifact 版本

### 8.4 页面与 API

- [x] `P0` 建立 `/app/artifacts` 页面
- [x] `P0` 提供三个生成按钮
- [x] `P0` 展示生成结果
- [x] `P0` 支持复制到剪贴板
- [x] `P0` 支持下载 Markdown
- [x] `P0` 实现 `POST /api/artifacts/generate`

验收标准：

- 在已有正式规则的前提下，能生成三类资产
- 生成结果会作为版本保存

## 9. Epic 7：Playground 与反馈进化

### 9.1 数据模型

- [x] `P0` 创建 `PlaygroundRun` 表
- [ ] `P1` 增加 feedback 枚举和自定义反馈文本

### 9.2 Prompt 与 Schema

- [x] `P0` 创建 `feedback-to-proposal` prompt
- [ ] `P0` 定义反馈转提案输出 schema
- [x] `P0` 定义反馈转提案输出 schema
- [x] `P0` 创建 `runPlayground()` 调用入口

### 9.3 页面与 API

- [x] `P0` 建立 `/app/playground` 页面
- [x] `P0` 支持选择 artifact 类型
- [x] `P0` 支持输入测试任务
- [x] `P0` 展示输出结果
- [x] `P0` 支持反馈按钮组
- [x] `P0` 实现 `POST /api/playground/run`
- [x] `P0` 实现 `POST /api/playground/:id/feedback`

### 9.4 Harness Workflow

- [x] `P0` 实现 `playground_run` workflow
- [x] `P0` 实现 `feedback_to_proposal` workflow
- [x] `P0` 从反馈生成新 proposal
- [ ] `P1` 保存反馈前后上下文

验收标准：

- 用户可以选一份资产来测试任务
- 用户反馈后系统能生成新的规则提案

## 10. Epic 8：Harness 可观测性与评估

### 10.1 运行可观测性

- [x] `P0` 记录每次 workflow 状态
- [x] `P0` 记录每个 step 的输入输出快照
- [x] `P0` 记录每次 LLMRun 的 promptName 和 version
- [x] `P1` 记录 tokens、耗时、重试次数
- [x] `P1` 实现基础调试页面或查询脚本

### 10.2 评估集

- [x] `P0` 建立 `evals/materials` 目录
- [x] `P0` 准备 10 条真实素材样本
- [x] `P0` 为样本写预期 insight/proposal 方向
- [x] `P1` 编写批量评估脚本
- [ ] `P1` 记录提案接受率、编辑率、空泛率

### 10.3 质量门槛

- [x] `P0` 定义“空泛规则”判定标准
- [x] `P0` 定义“可执行规则”判定标准
- [ ] `P1` 增加人工抽样复查机制

验收标准：

- 出现模型问题时，能快速定位到具体 workflow step
- 至少有一套最小评估集用于回归测试

## 11. Epic 9：发布前收口

### 11.1 产品收口

- [x] `P0` 检查核心链路是否完整
- [x] `P0` 验证从 Material 到 Artifact 的完整主线
- [x] `P0` 验证 Playground 反馈是否回流到 Proposal
- [x] `P1` 补充空状态和错误提示

### 11.2 文档收口

- [x] `P0` 更新 README
- [x] `P0` 补充本地启动说明
- [x] `P0` 补充环境变量说明
- [ ] `P1` 补充 Prompt 维护说明
- [x] `P1` 补充 Evals 使用说明

### 11.3 MVP 验收回放

- [x] `P0` 跑通“写作者沉淀风格”故事
- [x] `P0` 跑通“开发者生成 AGENTS.md”故事
- [x] `P0` 记录一次完整演示脚本

## 12. 推荐实施顺序

建议严格按这个顺序推进：

1. Epic 0
2. Epic 1
3. Epic 2
4. Epic 3
5. Epic 4
6. Epic 5
7. Epic 6
8. Epic 7
9. Epic 8
10. Epic 9

原因：

- 先有 Harness 骨架，后面才不会把 LLM 调用写散
- 先有 Proposal 审核，Rulebase 才可信
- 先有 Artifact 编译，产品才不是单纯分析器
- 先有 Playground 闭环，产品才真正像 Agent 系统

## 13. 第一周建议 Sprint

如果你想立刻开工，建议第一周只做这些：

- [ ] 初始化 Next.js + Prisma + MySQL
- [ ] 建好 `User/Workspace/Material/WorkflowRun/StepRun/LLMRun` 表
- [ ] 做 Onboarding 页面
- [ ] 做 Inbox 页面
- [ ] 接一个最小版 `analyze_material` workflow
- [ ] 能从一条素材生成 mock proposals

这一周的目标不是“做完 MVP”，而是：

```txt
证明 PersonaOS 的 Harness 骨架成立
```
