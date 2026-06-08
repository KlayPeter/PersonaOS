"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type ProposalCategory =
  | "personal"
  | "ai_collaboration"
  | "coding"
  | "writing"
  | "knowledge"
  | "product";

const categoryOptions: Array<{ value: ProposalCategory; label: string }> = [
  { value: "personal", label: "个人规则" },
  { value: "ai_collaboration", label: "AI 协作" },
  { value: "coding", label: "编码" },
  { value: "writing", label: "写作" },
  { value: "knowledge", label: "知识沉淀" },
  { value: "product", label: "产品" },
];

export function RuleEditor(props: {
  ruleId: string;
  title: string;
  content: string;
  category: ProposalCategory;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [expanded, setExpanded] = useState(false);
  const [title, setTitle] = useState(props.title);
  const [content, setContent] = useState(props.content);
  const [category, setCategory] = useState<ProposalCategory>(props.category);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function saveRule() {
    startTransition(async () => {
      setMessage("");
      setError("");

      const response = await fetch(`/api/rules/${props.ruleId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title, content, category }),
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(payload.error ?? "更新规则失败。");
        return;
      }

      setMessage("规则已更新。");
      setExpanded(false);
      router.refresh();
    });
  }

  function archiveRule() {
    startTransition(async () => {
      setMessage("");
      setError("");

      const response = await fetch(`/api/rules/${props.ruleId}/archive`, {
        method: "POST",
      });
      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(payload.error ?? "归档规则失败。");
        return;
      }

      setMessage("规则已归档。");
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          className="secondary-button"
          onClick={() => setExpanded((current) => !current)}
          disabled={isPending}
        >
          {expanded ? "收起编辑" : "编辑规则"}
        </button>

        <button
          type="button"
          className="secondary-button destructive"
          onClick={archiveRule}
          disabled={isPending}
        >
          归档规则
        </button>
      </div>

      {expanded ? (
        <div className="panel-muted flex flex-col gap-4">
          <label className="field">
            <span>规则标题</span>
            <input value={title} onChange={(event) => setTitle(event.target.value)} />
          </label>

          <label className="field">
            <span>规则分类</span>
            <select value={category} onChange={(event) => setCategory(event.target.value as ProposalCategory)}>
              {categoryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>规则内容</span>
            <textarea rows={6} value={content} onChange={(event) => setContent(event.target.value)} />
          </label>

          <div className="flex">
            <button type="button" className="primary-button" onClick={saveRule} disabled={isPending}>
              保存修改
            </button>
          </div>
        </div>
      ) : null}

      {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
      {error ? <p className="text-sm text-rose-700">{error}</p> : null}
    </div>
  );
}
