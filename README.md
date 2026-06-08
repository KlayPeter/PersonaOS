# PersonaOS

PersonaOS 是一个 `workflow-first`、`human-approved` 的个人体系工坊 MVP。

当前仓库已完成第一阶段的基础搭建，目标是先跑通下面这条主链路：

```txt
Workspace Profile
  -> Material Inbox
  -> Analyze Workflow
  -> Insight
  -> Rule Proposal
```

## 当前已实现

- Next.js 16 + TypeScript + Tailwind CSS 工程骨架
- Prisma 7 + MySQL 8.4 本地开发环境
- 默认 workspace / 用户画像初始化与编辑
- 支持根据 onboarding 填写内容生成初始 Persona Profile 摘要
- Inbox 文本素材录入、列表、详情页与删除
- `analyze_material` workflow
- `WorkflowRun` / `StepRun` / `LLMRun` 留痕
- `Insight` 与 `RuleProposal` 落库和页面回看
- Proposal 审核页，支持接受、拒绝、编辑后接受
- `apply_proposal` workflow、Rulebase 与 Changelog
- 正式规则的编辑、归档与来源追踪
- `/artifacts` 资产页，支持生成、可选润色、预览、复制和下载 Markdown
- `generate_artifact` workflow 与 Artifact 版本保存
- 已支持 `AGENTS.md`、`writing-style.md`、`personal-system.md`
- `/playground` 测试场，支持用资产跑任务、记录反馈上下文并把反馈回流成 proposal
- 已接入 `shadcn/ui` 基础组件并保留仓库原有视觉语言
- `playground_run` / `feedback_to_proposal` workflow
- 内置自动化测试与 `evals/materials` 回归样本
- `/runs` 运行观测页，可查看 Workflow / Step / LLM 调用快照
- 评估脚本可输出 insight 命中率、proposal 方向命中率、空泛率、可执行率

## 本地启动

1. 安装依赖

```bash
npm install
```

2. 启动本地 MySQL

```bash
npm run db:up
```

3. 运行 Prisma migration

```bash
npm run db:migrate
```

4. 初始化默认数据

```bash
npm run db:seed
```

5. 启动开发服务

```bash
npm run dev
```

6. 运行自动化测试

```bash
npm test
```

7. 运行素材评估

```bash
npm run evals:materials
```

8. 运行提案质量与抽样复查

```bash
npm run review:proposals
```

9. 运行 MVP 验收故事

```bash
npm run verify:mvp
```

默认数据库端口使用 `3307`，避免和本机已有 MySQL 冲突。

## 环境变量

最小本地环境变量可直接参考 `.env.example`：

```bash
DATABASE_URL="mysql://root:root@127.0.0.1:3307/personaos"
DEFAULT_USER_EMAIL="demo@personaos.local"
DEFAULT_USER_NAME="PersonaOS Demo"
DEFAULT_WORKSPACE_NAME="My Personal System"
AI_PROVIDER="mock"
```

说明：

- `DATABASE_URL`：本地 MySQL 连接串
- `DEFAULT_USER_EMAIL` / `DEFAULT_USER_NAME`：默认用户初始化信息
- `DEFAULT_WORKSPACE_NAME`：默认 workspace 名称
- `AI_PROVIDER`：当前默认使用 `mock`，便于稳定调试 workflow 和 evals

## 主要路由

- `/`：项目总览页
- `/onboarding`：用户画像编辑
  - 支持生成初始画像摘要
- `/inbox`：素材录入与列表
- `/inbox/[id]`：素材详情、洞察与提案
- `/proposals`：审核候选规则提案
- `/rulebase`：浏览与维护正式规则
- `/artifacts`：生成与查看导出资产
- `/playground`：用资产测试任务并回流反馈
- `/runs`：查看 workflow / step / llm 观测明细
- `/changelog`：查看关键变更记录

## 目录结构

```txt
src/
  app/
  components/
  lib/
  server/
    ai/
    db/
    domain/
    harness/
prisma/
docs/
```

## 说明

- 当前 AI 层先使用 `mock` provider，以保证第一阶段 workflow 可稳定调试。
- 后续可以在 `src/server/ai/services/ai-service.ts` 中替换为真实模型调用。
- `.env.example` 提供了本地开发需要的最小环境变量模板。
- 当前测试使用 Node 内置测试运行能力，通过 `tsx --test` 执行。
- `npm run evals:materials` 会批量跑 `evals/materials` 中的样本，并输出：
  - insight 命中率
  - proposal 方向命中率
  - proposal 空泛率
  - proposal 可执行率
- `npm run review:proposals` 会读取数据库中的 proposal，输出：
  - 接受率
  - 编辑率
  - 拒绝率
  - 空泛率
  - 一组建议人工复查的抽样样本
- `npm run verify:mvp` 会自动跑通两条验收故事：
  - 写作者沉淀风格
  - 开发者生成 `AGENTS.md`
- 完整人工演示顺序记录在 [docs/03-MVP-验收演示脚本.md](/Users/admin/Desktop/Peter/PersonaOS/docs/03-MVP-验收演示脚本.md)
- Prompt 维护规则记录在 [docs/04-Prompt-维护说明.md](/Users/admin/Desktop/Peter/PersonaOS/docs/04-Prompt-维护说明.md)
- 当前“空泛规则”判断偏向识别泛化、没有动作约束的提案；“可执行规则”判断偏向识别包含必须、优先、步骤或边界约束的提案。
