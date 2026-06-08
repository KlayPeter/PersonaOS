"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type ArtifactType = "agents_md" | "writing_style" | "personal_system";

type ArtifactRecord = {
  id: string;
  type: ArtifactType;
  title: string;
  content: string;
  version: number;
};

export function ArtifactGenerator({
  options,
}: {
  options: Array<{
    type: ArtifactType;
    title: string;
    filename: string;
    description: string;
  }>;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [latestArtifact, setLatestArtifact] = useState<ArtifactRecord | null>(null);
  const [polishEnabled, setPolishEnabled] = useState(true);

  function handleGenerate(type: ArtifactType) {
    startTransition(async () => {
      setMessage("");
      setError("");

      const response = await fetch("/api/artifacts/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ type, polish: polishEnabled }),
      });

      const payload = (await response.json()) as {
        error?: string;
        artifact?: ArtifactRecord;
      };

      if (!response.ok || !payload.artifact) {
        setError(payload.error ?? "生成资产失败。");
        return;
      }

      setLatestArtifact(payload.artifact);
      setMessage(`已生成 ${payload.artifact.title} v${payload.artifact.version}。`);
      router.refresh();
    });
  }

  async function copyLatest() {
    if (!latestArtifact) {
      return;
    }

    await navigator.clipboard.writeText(latestArtifact.content);
    setMessage(`${latestArtifact.title} 已复制到剪贴板。`);
  }

  function downloadLatest() {
    if (!latestArtifact) {
      return;
    }

    const blob = new Blob([latestArtifact.content], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = latestArtifact.title;
    anchor.click();
    URL.revokeObjectURL(url);
    setMessage(`${latestArtifact.title} 已开始下载。`);
  }

  return (
    <div className="flex flex-col gap-6">
      <label className="flex items-start gap-3 rounded-[1.4rem] border border-[color:var(--line)] bg-[rgba(255,252,248,0.82)] px-4 py-4 text-sm text-[color:var(--muted)]">
        <input
          type="checkbox"
          checked={polishEnabled}
          onChange={(event) => setPolishEnabled(event.target.checked)}
          className="mt-1 size-4 accent-[color:var(--accent)]"
        />
        <span>生成后增加一次可选润色步骤，只调整 Markdown 的表述和节奏，不改动核心规则含义。</span>
      </label>

      <div className="grid gap-4 md:grid-cols-3">
        {options.map((option) => (
          <Card key={option.type} variant="muted" className="flex flex-col gap-4">
            <CardHeader>
              <p className="eyebrow">Generate</p>
              <CardTitle>{option.title}</CardTitle>
              <CardDescription>{option.description}</CardDescription>
            </CardHeader>

            <div className="mt-auto">
              <Button onClick={() => handleGenerate(option.type)} disabled={isPending}>
                {isPending ? "生成中..." : `生成 ${option.filename}`}
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {latestArtifact ? (
        <Card variant="panel" className="flex flex-col gap-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="eyebrow">Latest Output</p>
              <h3 className="font-serif text-3xl text-[color:var(--ink)]">
                {latestArtifact.title} v{latestArtifact.version}
              </h3>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button variant="secondary" onClick={copyLatest}>
                复制 Markdown
              </Button>
              <Button variant="secondary" onClick={downloadLatest}>
                下载文件
              </Button>
            </div>
          </div>

          <CardContent>
            <pre className="artifact-preview">{latestArtifact.content}</pre>
          </CardContent>
        </Card>
      ) : null}

      {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
      {error ? (
        <div className="flex flex-col gap-2 text-sm text-rose-700">
          <p>{error}</p>
          <p className="text-[color:var(--muted)]">
            如果提示没有正式规则，先去 <Link href="/proposals" className="underline underline-offset-4">处理提案</Link>，
            再到 <Link href="/rulebase" className="underline underline-offset-4">规则库</Link> 确认是否已经入库。
          </p>
        </div>
      ) : null}
    </div>
  );
}
