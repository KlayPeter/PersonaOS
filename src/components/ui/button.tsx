import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-full transition-[transform,background-color,color,border-color,opacity] duration-200 disabled:pointer-events-none disabled:opacity-70",
  {
    variants: {
      variant: {
        primary:
          "border-0 bg-[color:var(--accent)] px-5 py-3 font-semibold text-[#fff8f0] hover:not-disabled:-translate-y-0.5 hover:not-disabled:bg-[color:var(--accent-strong)]",
        secondary:
          "border border-[color:var(--line)] bg-[rgba(255,252,248,0.92)] px-5 py-3 font-medium text-[color:var(--foreground)] hover:not-disabled:-translate-y-0.5",
        ghost:
          "border border-transparent bg-transparent px-4 py-2 text-sm font-medium text-[color:var(--muted)] hover:not-disabled:border-[color:var(--line)] hover:not-disabled:bg-[rgba(255,252,248,0.76)]",
        destructive:
          "border border-[rgba(142,47,34,0.18)] bg-[rgba(255,252,248,0.92)] px-5 py-3 font-medium text-[#8e2f22] hover:not-disabled:-translate-y-0.5 hover:not-disabled:bg-[rgba(255,245,242,0.96)]",
      },
      size: {
        default: "",
        sm: "px-4 py-2 text-sm",
        lg: "px-6 py-3.5 text-base",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>;

export function Button({ className, variant, size, type = "button", ...props }: ButtonProps) {
  return <button type={type} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
