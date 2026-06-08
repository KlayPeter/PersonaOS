"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function AnalyzeButton({ materialId }: { materialId: string }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleAnalyze() {
    startTransition(async () => {
      setMessage("");
      setError("");

      const response = await fetch(`/api/materials/${materialId}/analyze`, {
        method: "POST",
      });
      const payload = (await response.json()) as {
        error?: string;
        data?: { insights: number; proposals: number };
      };

      if (!response.ok) {
        setError(payload.error ?? "分析失败。");
        return;
      }

      setMessage(
        `分析完成，新增 ${payload.data?.insights ?? 0} 条 insight，生成 ${payload.data?.proposals ?? 0} 条 proposal。`,
      );
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <button type="button" className="primary-button" onClick={handleAnalyze} disabled={isPending}>
        {isPending ? "分析中..." : "运行 analyze workflow"}
      </button>
      {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
      {error ? (
        <div className="flex flex-col gap-2 text-sm text-rose-700">
          <p>{error}</p>
          <p className="text-[color:var(--muted)]">
            如果分析结果异常，可以到 <Link href="/onboarding" className="underline underline-offset-4">画像页</Link> 补上下文，
            或去 <Link href="/runs" className="underline underline-offset-4">运行页</Link> 查看 step 和 LLM 快照。
          </p>
        </div>
      ) : null}
    </div>
  );
}
