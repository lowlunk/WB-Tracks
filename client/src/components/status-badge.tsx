import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusConfig: Record<string, { className: string; label: string }> = {
  active: { className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300", label: "Active" },
  in_use: { className: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300", label: "In Use" },
  available: { className: "bg-slate-100 text-slate-600 dark:bg-slate-800/40 dark:text-slate-400", label: "Available" },
  reserved: { className: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300", label: "Reserved" },
  warning: { className: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300", label: "Warning" },
  offline: { className: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300", label: "Offline" },
  inactive: { className: "bg-slate-100 text-slate-500 dark:bg-slate-800/40 dark:text-slate-500", label: "Inactive" },
};

export function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] || { className: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400", label: status };
  return (
    <Badge variant="secondary" className={cn("text-xs font-medium no-default-hover-elevate no-default-active-elevate", config.className)} data-testid={`status-${status}`}>
      <span className={cn(
        "inline-block w-1.5 h-1.5 rounded-full mr-1.5",
        status === "active" || status === "in_use" ? "bg-emerald-500 dark:bg-emerald-400" :
        status === "warning" || status === "reserved" ? "bg-amber-500 dark:bg-amber-400" :
        status === "offline" ? "bg-red-500 dark:bg-red-400" :
        "bg-slate-400 dark:bg-slate-500"
      )} />
      {config.label}
    </Badge>
  );
}
