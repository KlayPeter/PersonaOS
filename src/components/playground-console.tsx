"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type ArtifactType = "agents_md" | "writing_style" | "personal_system";
type FeedbackType =
  | "good"
  | "not_like_me"
  | "too_vague"
  | "too_short"
  | "too_long"
  | "too_scattered"
  | "too_template"
  | "logic_weak"
  | "examples_missing"
  | "custom";

type PlaygroundRunRecord = {
  id: string;
  artifactType: ArtifactType;
  inputTask: string;
  output: string;
  feedback: FeedbackType | null;
  feedbackText: string | null;
};

const feedbackOptions: Array<{ value: FeedbackType; label: string }> = [
  { value: "good", label: "像我" },
  { value: "not_like_me", label: "不像我" },
  { value: "too_scattered", label: "太散" },
  { value: "too_vague", label: "太空" },
  { value: "too_short", label: "太短" },
  { value: "too_long", label: "太长" },
  { value: "too_template", label: "太模板" },
  { value: "logic_weak", label: "逻辑不够" },
  { value: "examples_missing", label: "例子不够" },
  { value: "custom", label: "自定义" },
];

export function PlaygroundConsole({
  artifactOptions,
}: {
  artifactOptions: Array<{
    type: ArtifactType;
    title: string;
    description: string;
  }>;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [artifactType, setArtifactType] = useState<ArtifactType>("writing_style");
  const [task, setTask] = useState("帮我写一篇关于 AGENTS.md 的认知篇博客。");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [feedbackText, setFeedbackText] = useState("");
  const [latestRun, setLatestRun] = useState<PlaygroundRunRecord | null>(null);

  function runPlayground() {
    startTransition(async () => {
      setMessage("");
      setError("");

      const response = await fetch("/api/playground/run", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          artifactType,
          task,
        }),
      });

      const payload = (await response.json()) as {
        error?: string;
        run?: PlaygroundRunRecord;
      };

      if (!response.ok || !payload.run) {
        setError(payload.error ?? "运行 Playground 失败。");
        return;
      }

      setLatestRun(payload.run);
      setMessage("Playground 输出已生成，现在可以直接给反馈。");
      router.refresh();
    });
  }

  function sendFeedback(feedbackType: FeedbackType) {
    if (!latestRun) {
      return;
    }

    startTransition(async () => {
      setMessage("");
      setError("");

      const response = await fetch(`/api/playground/${latestRun.id}/feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          feedbackType,
          feedbackText,
        }),
      });

      const payload = (await response.json()) as {
        error?: string;
        generatedProposalIds?: string[];
      };

      if (!response.ok) {
        setError(payload.error ?? "提交反馈失败。");
        return;
      }

      if (feedbackType === "good") {
        setMessage("已记录“像我”的正向反馈。");
      } else {
        setMessage(`反馈已回流，并生成 ${payload.generatedProposalIds?.length ?? 0} 条新提案。`);
      }

      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <Card variant="panel" className="flex flex-col gap-6">
        <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
          <label className="field">
            <span>选择资产</span>
            <Select value={artifactType} onChange={(event) => setArtifactType(event.target.value as ArtifactType)}>
              {artifactOptions.map((option) => (
                <option key={option.type} value={option.type}>
                  {option.title}
                </option>
              ))}
            </Select>
          </label>

          <label className="field">
            <span>测试任务</span>
            <Textarea rows={4} value={task} onChange={(event) => setTask(event.target.value)} />
          </label>
        </div>

        <div className="flex">
          <Button onClick={runPlayground} disabled={isPending}>
            {isPending ? "运行中..." : "运行 Playground"}
          </Button>
        </div>
      </Card>

      {latestRun ? (
        <Card variant="panel" className="flex flex-col gap-5">
          <div>
            <p className="eyebrow">Latest Playground Output</p>
            <h3 className="font-serif text-3xl text-[color:var(--ink)]">
              {artifactOptions.find((option) => option.type === latestRun.artifactType)?.title ?? latestRun.artifactType}
            </h3>
          </div>

          <pre className="artifact-preview">{latestRun.output}</pre>

          <Card variant="muted" className="flex flex-col gap-4">
            <label className="field">
              <span>补充反馈</span>
              <Textarea
                rows={3}
                value={feedbackText}
                onChange={(event) => setFeedbackText(event.target.value)}
                placeholder="例如：分点多但没有主线，例子也不够具体。"
              />
            </label>

            <div className="flex flex-wrap gap-3">
              {feedbackOptions.map((option) => (
                <Button
                  key={option.value}
                  variant="secondary"
                  onClick={() => sendFeedback(option.value)}
                  disabled={isPending}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </Card>
        </Card>
      ) : null}

      {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
      {error ? (
        <div className="flex flex-col gap-2 text-sm text-rose-700">
          <p>{error}</p>
          <p className="text-[color:var(--muted)]">
            如果提示没有可用资产，先去 <Link href="/artifacts" className="underline underline-offset-4">资产页</Link> 生成对应文档；
            如果反馈提交失败，可以到 <Link href="/runs" className="underline underline-offset-4">运行页</Link> 查看 workflow 明细。
          </p>
        </div>
      ) : null}
    </div>
  );
}
