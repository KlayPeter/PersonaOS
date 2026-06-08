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
- Inbox 文本素材录入、列表、详情页
- `analyze_material` workflow
- `WorkflowRun` / `StepRun` / `LLMRun` 留痕
- `Insight` 与 `RuleProposal` 落库和页面回看
- Proposal 审核页，支持接受、拒绝、编辑后接受
- `apply_proposal` workflow、Rulebase 与 Changelog
- 正式规则的编辑、归档与来源追踪
- `/artifacts` 资产页，支持生成、预览、复制和下载 Markdown
- `generate_artifact` workflow 与 Artifact 版本保存
- 已支持 `AGENTS.md`、`writing-style.md`、`personal-system.md`
- `/playground` 测试场，支持用资产跑任务并把反馈回流成 proposal
- `playground_run` / `feedback_to_proposal` workflow
- 内置自动化测试与 `evals/materials` 回归样本

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

默认数据库端口使用 `3307`，避免和本机已有 MySQL 冲突。

## 主要路由

- `/`：项目总览页
- `/onboarding`：用户画像编辑
- `/inbox`：素材录入与列表
- `/inbox/[id]`：素材详情、洞察与提案
- `/proposals`：审核候选规则提案
- `/rulebase`：浏览与维护正式规则
- `/artifacts`：生成与查看导出资产
- `/playground`：用资产测试任务并回流反馈
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
