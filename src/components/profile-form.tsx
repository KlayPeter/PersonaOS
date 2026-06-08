"use client";

import { useState, useTransition } from "react";

import { splitListInput } from "@/lib/utils";
import type { WorkspaceProfile } from "@/server/domain/workspace";

export function ProfileForm({ initial }: { initial: WorkspaceProfile }) {
  const [form, setForm] = useState({
    name: initial.name,
    description: initial.description,
    identity: initial.identity,
    primaryScenarios: initial.primaryScenarios.join("\n"),
    rememberNotes: initial.rememberNotes,
    dislikedBehaviors: initial.dislikedBehaviors.join("\n"),
    outputPreferences: initial.outputPreferences.join("\n"),
    exportGoals: initial.exportGoals.join("\n"),
    profileSummary: initial.profileSummary,
  });
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isPending, startTransition] = useTransition();

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function submitForm() {
    startTransition(async () => {
      setMessage("");
      setError("");

      const response = await fetch("/api/workspace", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          identity: form.identity,
          primaryScenarios: splitListInput(form.primaryScenarios),
          rememberNotes: form.rememberNotes,
          dislikedBehaviors: splitListInput(form.dislikedBehaviors),
          outputPreferences: splitListInput(form.outputPreferences),
          exportGoals: splitListInput(form.exportGoals),
          profileSummary: form.profileSummary,
        }),
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(payload.error ?? "保存画像失败。");
        return;
      }

      setMessage("画像已保存，后续分析会直接使用这份上下文。");
    });
  }

  function generateProfileSummary() {
    startTransition(async () => {
      setMessage("");
      setError("");

      const response = await fetch("/api/workspace/generate-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          identity: form.identity,
          primaryScenarios: splitListInput(form.primaryScenarios),
          rememberNotes: form.rememberNotes,
          dislikedBehaviors: splitListInput(form.dislikedBehaviors),
          outputPreferences: splitListInput(form.outputPreferences),
          exportGoals: splitListInput(form.exportGoals),
        }),
      });

      const payload = (await response.json()) as {
        error?: string;
        profileSummary?: string;
        log?: { promptName: string; promptVersion: string };
      };

      if (!response.ok || !payload.profileSummary) {
        setError(payload.error ?? "生成初始画像失败。");
        return;
      }

      setForm((current) => ({ ...current, profileSummary: payload.profileSummary! }));
      setMessage(
        `已生成初始画像摘要${payload.log ? `（${payload.log.promptName} ${payload.log.promptVersion}）` : ""}，确认后记得保存。`,
      );
    });
  }

  return (
    <section className="panel flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <p className="eyebrow">Onboarding / Workspace Profile</p>
        <h2 className="font-serif text-4xl text-[color:var(--ink)]">先让 PersonaOS 认识你</h2>
        <p className="max-w-3xl text-sm leading-7 text-[color:var(--muted)]">
          这份画像会成为后续 `analyze workflow` 的基础上下文。第一阶段先聚焦身份、使用场景、偏好、禁忌和导出目标。
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <label className="field">
          <span>Workspace 名称</span>
          <input value={form.name} onChange={(event) => updateField("name", event.target.value)} />
        </label>

        <label className="field">
          <span>身份定位</span>
          <input
            value={form.identity}
            onChange={(event) => updateField("identity", event.target.value)}
            placeholder="开发者 / 写作者 / 产品设计实践者"
          />
        </label>

        <label className="field lg:col-span-2">
          <span>空间描述</span>
          <textarea
            rows={3}
            value={form.description}
            onChange={(event) => updateField("description", event.target.value)}
          />
        </label>

        <label className="field">
          <span>主要使用场景</span>
          <textarea
            rows={6}
            value={form.primaryScenarios}
            onChange={(event) => updateField("primaryScenarios", event.target.value)}
            placeholder="一行一个，也支持逗号分隔"
          />
        </label>

        <label className="field">
          <span>希望 AI 记住什么</span>
          <textarea
            rows={6}
            value={form.rememberNotes}
            onChange={(event) => updateField("rememberNotes", event.target.value)}
          />
        </label>

        <label className="field">
          <span>讨厌的行为</span>
          <textarea
            rows={6}
            value={form.dislikedBehaviors}
            onChange={(event) => updateField("dislikedBehaviors", event.target.value)}
          />
        </label>

        <label className="field">
          <span>输出偏好</span>
          <textarea
            rows={6}
            value={form.outputPreferences}
            onChange={(event) => updateField("outputPreferences", event.target.value)}
          />
        </label>

        <label className="field">
          <span>导出目标</span>
          <textarea
            rows={5}
            value={form.exportGoals}
            onChange={(event) => updateField("exportGoals", event.target.value)}
          />
        </label>

        <label className="field">
          <span>画像摘要</span>
          <textarea
            rows={5}
            value={form.profileSummary}
            onChange={(event) => updateField("profileSummary", event.target.value)}
            placeholder="也可以点击下方按钮，根据上面的填写内容自动生成初始 Persona Profile。"
          />
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          className="secondary-button"
          onClick={generateProfileSummary}
          disabled={isPending}
        >
          {isPending ? "处理中..." : "生成初始画像摘要"}
        </button>
        <button type="button" className="primary-button" onClick={submitForm} disabled={isPending}>
          {isPending ? "保存中..." : "保存 Persona Profile"}
        </button>
        {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
        {error ? <p className="text-sm text-rose-700">{error}</p> : null}
      </div>
    </section>
  );
}
