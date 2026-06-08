export const dynamic = "force-dynamic";

import Link from "next/link";

import { MaterialForm } from "@/components/material-form";
import { formatDate } from "@/lib/utils";
import { listMaterials, serializeMaterialTags } from "@/server/domain/materials";

const materialTypeLabel: Record<string, string> = {
  article: "文章",
  code_rule: "代码规则",
  prompt: "Prompt",
  feedback: "反馈",
  failed_output: "失败案例",
  note: "笔记",
  project_description: "项目描述",
};

const materialStatusLabel: Record<string, string> = {
  unprocessed: "未分析",
  analyzed: "已分析",
  used: "已生成提案",
  archived: "已归档",
};

export default async function InboxPage() {
  const materials = await listMaterials();

  return (
    <div className="flex flex-col gap-8">
      <section className="hero-grid">
        <div className="flex flex-col gap-4">
          <p className="eyebrow">Phase 1 / Inbox</p>
          <h1 className="max-w-4xl font-serif text-5xl leading-[1.05] text-[color:var(--ink)] lg:text-7xl">
            先收集素材，再让 PersonaOS 开始分析你。
          </h1>
        </div>
        <div className="panel text-sm leading-7 text-[color:var(--muted)]">
          <p>
            第一版先支持文本素材录入、类型选择、状态区分和明细回看。`Analyze workflow`
            会在素材详情页触发。
          </p>
        </div>
      </section>

      <MaterialForm />

      <section className="panel flex flex-col gap-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Inbox / Material List</p>
            <h2 className="font-serif text-3xl text-[color:var(--ink)]">已录入素材</h2>
          </div>
          <p className="text-sm text-[color:var(--muted)]">{materials.length} 条</p>
        </div>

        <div className="grid gap-4">
          {materials.length === 0 ? (
            <div className="rounded-[28px] border border-dashed border-[color:var(--line)] px-6 py-10 text-sm text-[color:var(--muted)]">
              还没有素材。先新增一条文章、反馈或项目描述，再去详情页运行分析。
            </div>
          ) : (
            materials.map((material) => (
              <Link
                key={material.id}
                href={`/inbox/${material.id}`}
                className="rounded-[28px] border border-[color:var(--line)] bg-[color:var(--paper)] px-6 py-6 transition-transform duration-200 hover:-translate-y-0.5"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <span className="status-chip">{materialStatusLabel[material.status]}</span>
                  <span className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">
                    {materialTypeLabel[material.type] ?? material.type}
                  </span>
                </div>

                <div className="mt-4 flex flex-col gap-3">
                  <h3 className="font-serif text-3xl text-[color:var(--ink)]">{material.title}</h3>
                  {material.summary ? (
                    <p className="text-sm leading-7 text-[color:var(--muted)]">{material.summary}</p>
                  ) : null}
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-3 text-xs text-[color:var(--muted)]">
                  <span>{formatDate(material.createdAt)}</span>
                  {serializeMaterialTags(material.tags).map((tag) => (
                    <span key={tag} className="tag-chip">
                      {tag}
                    </span>
                  ))}
                </div>
              </Link>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
