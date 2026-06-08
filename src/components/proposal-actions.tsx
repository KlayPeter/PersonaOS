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

export function ProposalActions(props: {
  proposalId: string;
  title: string;
  proposedContent: string;
  category: ProposalCategory;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [showEditor, setShowEditor] = useState(false);
  const [editedTitle, setEditedTitle] = useState(props.title);
  const [editedContent, setEditedContent] = useState(props.proposedContent);
  const [editedCategory, setEditedCategory] = useState<ProposalCategory>(props.category);

  function runAction(
    url: string,
    body?: Record<string, unknown>,
    successMessage?: string,
  ) {
    startTransition(async () => {
      setMessage("");
      setError("");

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(payload.error ?? "操作失败。");
        return;
      }

      setMessage(successMessage ?? "操作成功。");
      setShowEditor(false);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          className="primary-button"
          disabled={isPending}
          onClick={() =>
            runAction(
              `/api/proposals/${props.proposalId}/accept`,
              undefined,
              "提案已接受并写入 Rulebase。",
            )
          }
        >
          {isPending ? "处理中..." : "接受提案"}
        </button>

        <button
          type="button"
          className="secondary-button"
          disabled={isPending}
          onClick={() => setShowEditor((current) => !current)}
        >
          编辑后接受
        </button>

        <button
          type="button"
          className="secondary-button destructive"
          disabled={isPending}
          onClick={() =>
            runAction(
              `/api/proposals/${props.proposalId}/reject`,
              undefined,
              "提案已拒绝，未进入正式规则库。",
            )
          }
        >
          拒绝提案
        </button>
      </div>

      {showEditor ? (
        <div className="panel-muted flex flex-col gap-4">
          <label className="field">
            <span>最终标题</span>
            <input value={editedTitle} onChange={(event) => setEditedTitle(event.target.value)} />
          </label>

          <label className="field">
            <span>最终分类</span>
            <select
              value={editedCategory}
              onChange={(event) => setEditedCategory(event.target.value as ProposalCategory)}
            >
              {categoryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>最终规则内容</span>
            <textarea
              rows={6}
              value={editedContent}
              onChange={(event) => setEditedContent(event.target.value)}
            />
          </label>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className="primary-button"
              disabled={isPending}
              onClick={() =>
                runAction(
                  `/api/proposals/${props.proposalId}/edit-and-accept`,
                  {
                    title: editedTitle,
                    category: editedCategory,
                    content: editedContent,
                  },
                  "提案已按编辑后的内容写入 Rulebase。",
                )
              }
            >
              保存并接受
            </button>
          </div>
        </div>
      ) : null}

      {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
      {error ? <p className="text-sm text-rose-700">{error}</p> : null}
    </div>
  );
}
