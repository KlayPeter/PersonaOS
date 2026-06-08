export const dynamic = "force-dynamic";

import Link from "next/link";
import { ArrowRight, Database, Sparkles, Waypoints } from "lucide-react";

import { formatDate } from "@/lib/utils";
import { getDashboardSnapshot } from "@/server/domain/materials";
import { serializeWorkspaceProfile } from "@/server/domain/workspace";

export default async function Home() {
  const { workspace, stats, recentMaterials } = await getDashboardSnapshot();
  const profile = serializeWorkspaceProfile(workspace);

  return (
    <div className="flex flex-col gap-8">
      <section className="hero-grid">
        <div className="flex flex-col gap-6">
          <p className="eyebrow">Workflow-first / Human-approved / Artifact-oriented</p>
          <h1 className="max-w-5xl font-serif text-6xl leading-[0.95] text-[color:var(--ink)] lg:text-[6.5rem]">
            把你的经验、风格和禁忌，沉淀成可执行的个人体系。
          </h1>
          <p className="max-w-3xl text-base leading-8 text-[color:var(--muted)]">
            这一版先把最关键的基础链路跑通：用户画像、素材录入、结构化洞察、规则提案和
            Harness 留痕。先稳定、可追踪，再慢慢变聪明。
          </p>
        </div>

        <div className="panel flex flex-col gap-5">
          <p className="eyebrow">Default Workspace</p>
          <h2 className="font-serif text-4xl text-[color:var(--ink)]">{profile.name}</h2>
          <p className="text-sm leading-7 text-[color:var(--muted)]">{profile.profileSummary}</p>
          <div className="flex flex-wrap gap-2">
            {profile.primaryScenarios.map((item) => (
              <span key={item} className="tag-chip">
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-5">
        {stats.map((item) => (
          <article key={item.label} className="panel-muted flex flex-col gap-3">
            <p className="text-xs uppercase tracking-[0.16em] text-[color:var(--muted)]">
              {item.label}
            </p>
            <p className="font-serif text-5xl text-[color:var(--ink)]">{item.value}</p>
            <p className="text-sm text-[color:var(--muted)]">{item.hint}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="panel flex flex-col gap-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="eyebrow">Current Surface</p>
              <h2 className="font-serif text-4xl text-[color:var(--ink)]">已搭好的主流程</h2>
            </div>
            <Link href="/inbox" className="secondary-link">
              进入 Inbox
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className="grid gap-4">
            <article className="step-card">
              <Database className="step-icon" />
              <div>
                <h3>Workspace / Profile</h3>
                <p>默认 workspace 自动创建，画像可编辑并会作为后续分析上下文使用。</p>
              </div>
            </article>
            <article className="step-card">
              <Waypoints className="step-icon" />
              <div>
                <h3>Inbox / Material</h3>
                <p>支持文本素材录入、类型选择、标签与状态区分，并提供明细页回看。</p>
              </div>
            </article>
            <article className="step-card">
              <Sparkles className="step-icon" />
              <div>
                <h3>Analyze Workflow</h3>
                <p>可以生成 insights 与 rule proposals，并将 WorkflowRun / StepRun / LLMRun 记入数据库。</p>
              </div>
            </article>
            <article className="step-card">
              <Sparkles className="step-icon" />
              <div>
                <h3>Artifact Compile</h3>
                <p>正式规则可以被编译成 AGENTS.md、writing-style.md 和 personal-system.md，并保存版本。</p>
              </div>
            </article>
          </div>
        </div>

        <div className="panel flex flex-col gap-6">
          <div>
            <p className="eyebrow">Recent Materials</p>
            <h2 className="font-serif text-4xl text-[color:var(--ink)]">最近输入</h2>
          </div>

          <div className="grid gap-4">
            {recentMaterials.length === 0 ? (
              <p className="text-sm leading-7 text-[color:var(--muted)]">
                还没有素材。建议先到 Inbox 录入一条反馈或项目描述。
              </p>
            ) : (
              recentMaterials.map((material) => (
                <Link key={material.id} href={`/inbox/${material.id}`} className="panel-muted block">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-lg font-medium text-[color:var(--ink)]">{material.title}</h3>
                    <span className="text-xs text-[color:var(--muted)]">{formatDate(material.createdAt)}</span>
                  </div>
                  {material.summary ? (
                    <p className="mt-3 text-sm leading-7 text-[color:var(--muted)]">{material.summary}</p>
                  ) : null}
                </Link>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
