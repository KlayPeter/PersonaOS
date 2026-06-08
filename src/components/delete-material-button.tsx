"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";

export function DeleteMaterialButton({ materialId, title }: { materialId: string; title: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!window.confirm(`确认删除素材「${title}」吗？已生成的 proposal 会保留，但会失去这条素材关联。`)) {
      return;
    }

    startTransition(async () => {
      setError("");

      const response = await fetch(`/api/materials/${materialId}`, {
        method: "DELETE",
      });
      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(payload.error ?? "删除素材失败。");
        return;
      }

      router.push("/inbox");
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
        {isPending ? "删除中..." : "删除这条素材"}
      </Button>
      {error ? <p className="text-sm text-rose-700">{error}</p> : null}
    </div>
  );
}
