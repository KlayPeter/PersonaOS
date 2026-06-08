import type { InputHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full rounded-[1.3rem] border border-[color:var(--line)] bg-[rgba(255,252,248,0.96)] px-4 py-[0.95rem] text-[color:var(--foreground)] outline-none transition-[border-color,transform,box-shadow] duration-200 focus:border-[rgba(165,58,43,0.45)] focus:shadow-[0_0_0_4px_rgba(165,58,43,0.08)] focus:-translate-y-px",
        className,
      )}
      {...props}
    />
  );
}
