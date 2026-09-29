import { cn } from "@/lib/client/utils";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface SettingsCardProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
}

export function SettingsCard({
  icon: Icon,
  title,
  subtitle,
  children,
  className,
}: SettingsCardProps) {
  return (
    <div
      className={cn(
        "bg-bg-elev rounded-2xl border border-border overflow-hidden",
        className
      )}
    >
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
        <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-700 flex items-center justify-center shrink-0">
          <Icon size={17} strokeWidth={1.8} />
        </div>
        <div>
          <div className="text-[15px] font-bold leading-tight tracking-tight">
            {title}
          </div>
          {subtitle && (
            <div className="text-xs text-fg-muted mt-0.5">{subtitle}</div>
          )}
        </div>
      </div>
      <div className="py-2">{children}</div>
    </div>
  );
}
