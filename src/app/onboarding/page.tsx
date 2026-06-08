export const dynamic = "force-dynamic";

import { ProfileForm } from "@/components/profile-form";
import {
  getOrCreateDefaultWorkspace,
  serializeWorkspaceProfile,
} from "@/server/domain/workspace";

export default async function OnboardingPage() {
  const workspace = await getOrCreateDefaultWorkspace();

  return (
    <div className="flex flex-col gap-8">
      <section className="hero-grid">
        <div className="flex flex-col gap-4">
          <p className="eyebrow">Phase 1 / Profile Setup</p>
          <h1 className="max-w-4xl font-serif text-5xl leading-[1.05] text-[color:var(--ink)] lg:text-7xl">
            从画像开始，把零散偏好变成系统上下文。
          </h1>
        </div>
        <div className="panel text-sm leading-7 text-[color:var(--muted)]">
          <p>
            文档要求第一阶段至少跑通：`创建 workspace`、`填写 profile`、`后续分析可复用画像上下文`。
          </p>
          <p className="mt-3">
            现在也支持根据当前填写内容先生成一版初始 `Personal Profile`，再决定是否手动微调。
          </p>
        </div>
      </section>

      <ProfileForm initial={serializeWorkspaceProfile(workspace)} />
    </div>
  );
}
