"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

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

  function handleGenerate(type: ArtifactType) {
    startTransition(async () => {
      setMessage("");
      setError("");

      const response = await fetch("/api/artifacts/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ type }),
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
      <div className="grid gap-4 md:grid-cols-3">
        {options.map((option) => (
          <article key={option.type} className="panel-muted flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <p className="eyebrow">Generate</p>
              <h3 className="font-serif text-2xl text-[color:var(--ink)]">{option.title}</h3>
              <p className="text-sm leading-7 text-[color:var(--muted)]">{option.description}</p>
            </div>

            <div className="mt-auto">
              <button
                type="button"
                className="primary-button"
                onClick={() => handleGenerate(option.type)}
                disabled={isPending}
              >
                {isPending ? "生成中..." : `生成 ${option.filename}`}
              </button>
            </div>
          </article>
        ))}
      </div>

      {latestArtifact ? (
        <section className="panel flex flex-col gap-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="eyebrow">Latest Output</p>
              <h3 className="font-serif text-3xl text-[color:var(--ink)]">
                {latestArtifact.title} v{latestArtifact.version}
              </h3>
            </div>

            <div className="flex flex-wrap gap-3">
              <button type="button" className="secondary-button" onClick={copyLatest}>
                复制 Markdown
              </button>
              <button type="button" className="secondary-button" onClick={downloadLatest}>
                下载文件
              </button>
            </div>
          </div>

          <pre className="artifact-preview">{latestArtifact.content}</pre>
        </section>
      ) : null}

      {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
      {error ? <p className="text-sm text-rose-700">{error}</p> : null}
    </div>
  );
}
