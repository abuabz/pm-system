import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
  className?: string;
}

export function MetricCard({ title, value, icon, description, className }: MetricCardProps) {
  return (
    <div className={cn("bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm", className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</h3>
        <div className="text-slate-400 dark:text-slate-500">
          {icon}
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-3xl font-bold text-slate-900 dark:text-white">{value}</span>
        {description && (
          <span className="text-xs text-slate-500 dark:text-slate-400">{description}</span>
        )}
      </div>
    </div>
  );
}

export function MetricCardSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded"></div>
        <div className="h-6 w-6 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
      </div>
      <div className="flex flex-col gap-2 mt-4">
        <div className="h-8 w-16 bg-slate-200 dark:bg-slate-700 rounded"></div>
        <div className="h-3 w-32 bg-slate-200 dark:bg-slate-700 rounded"></div>
      </div>
    </div>
  );
}
