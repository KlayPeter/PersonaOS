"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { splitListInput } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const materialTypes = [
  { value: "article", label: "文章" },
  { value: "code_rule", label: "代码规则" },
  { value: "prompt", label: "Prompt" },
  { value: "feedback", label: "用户反馈" },
  { value: "failed_output", label: "AI 输出失败案例" },
  { value: "note", label: "知识笔记" },
  { value: "project_description", label: "项目描述" },
] as const;

export function MaterialForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: "",
    type: "feedback",
    summary: "",
    tags: "",
    content: "",
  });
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function submitMaterial() {
    startTransition(async () => {
      setError("");

      const response = await fetch("/api/materials", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: form.title,
          type: form.type,
          summary: form.summary,
          tags: splitListInput(form.tags),
          content: form.content,
        }),
      });

      const payload = (await response.json()) as { id?: string; error?: string };

      if (!response.ok || !payload.id) {
        setError(payload.error ?? "新增素材失败。");
        return;
      }

      setForm({
        title: "",
        type: "feedback",
        summary: "",
        tags: "",
        content: "",
      });
      router.push(`/inbox/${payload.id}`);
      router.refresh();
    });
  }

  return (
    <Card variant="panel" className="flex flex-col gap-6">
      <CardHeader>
        <p className="eyebrow">Inbox / New Material</p>
        <CardTitle className="text-3xl">持续喂入素材</CardTitle>
        <CardDescription>
          第一阶段先支持文本素材，重点是让输入能进入 Inbox，并能在后续被 workflow 分析。
        </CardDescription>
      </CardHeader>

      <div className="grid gap-5 lg:grid-cols-2">
        <label className="field">
          <span>标题</span>
          <Input value={form.title} onChange={(event) => updateField("title", event.target.value)} />
        </label>

        <label className="field">
          <span>素材类型</span>
          <Select value={form.type} onChange={(event) => updateField("type", event.target.value)}>
            {materialTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </Select>
        </label>

        <label className="field lg:col-span-2">
          <span>一句说明</span>
          <Textarea
            rows={3}
            value={form.summary}
            onChange={(event) => updateField("summary", event.target.value)}
          />
        </label>

        <label className="field lg:col-span-2">
          <span>标签</span>
          <Input
            value={form.tags}
            onChange={(event) => updateField("tags", event.target.value)}
            placeholder="例如：写作, 结构化, AI 协作"
          />
        </label>

        <label className="field lg:col-span-2">
          <span>素材正文</span>
          <Textarea
            rows={10}
            value={form.content}
            onChange={(event) => updateField("content", event.target.value)}
            placeholder="粘贴文章、反馈、规范、复盘、Prompt 或项目描述"
          />
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <Button onClick={submitMaterial} disabled={isPending}>
          {isPending ? "保存中..." : "保存到 Inbox"}
        </Button>
        {error ? <p className="text-sm text-rose-700">{error}</p> : null}
      </div>
    </Card>
  );
}
