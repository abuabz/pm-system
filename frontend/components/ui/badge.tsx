import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "todo" | "in_progress" | "done"
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        {
          "border-transparent bg-slate-900 text-slate-50 hover:bg-slate-900/80 dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-slate-50/80":
            variant === "default",
          "border-transparent bg-slate-100 text-slate-900 hover:bg-slate-100/80 dark:bg-slate-800 dark:text-slate-50 dark:hover:bg-slate-800/80":
            variant === "secondary",
          "border-transparent bg-red-500 text-slate-50 hover:bg-red-500/80 dark:bg-red-900 dark:text-slate-50 dark:hover:bg-red-900/80":
            variant === "destructive",
          "border-transparent bg-emerald-500 text-white hover:bg-emerald-600 dark:bg-emerald-900 dark:text-emerald-100":
            variant === "success",
          "border-transparent bg-amber-500 text-white hover:bg-amber-600 dark:bg-amber-900 dark:text-amber-100":
            variant === "warning",
          "text-slate-950 dark:text-slate-50": variant === "outline",
          "border-transparent bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300":
            variant === "todo",
          "border-transparent bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300":
            variant === "in_progress",
          "border-transparent bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300":
            variant === "done",
        },
        className
      )}
      {...props}
    />
  )
}

export { Badge }
