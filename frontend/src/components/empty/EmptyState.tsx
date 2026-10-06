import type { LucideIcon } from "lucide-react";
import { Sparkles } from "lucide-react";
import Link from "next/link";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  cta?: { label: string; href: string; icon?: LucideIcon };
  tip?: { title: string; body: string };
}

export function EmptyState({ icon: Icon, title, description, cta, tip }: EmptyStateProps) {
  return (
    <div className="bg-bg-elev border border-border rounded-2xl px-4 pt-8 pb-6 flex flex-col items-center text-center md:px-6 md:pt-13 md:pb-10">
      <div className="size-16 rounded-full bg-brand-50 flex items-center justify-center mb-5 md:size-24">
        <Icon className="size-8 text-brand-500 opacity-85 md:size-12" />
      </div>

      <p className="text-[17px] font-bold tracking-tight text-fg mb-2">{title}</p>
      <p className="text-[13px] text-fg-muted leading-relaxed whitespace-pre-line mb-6">
        {description}
      </p>

      {cta && (
        <Link
          href={cta.href}
          className="inline-flex items-center gap-2 h-11 px-5 rounded-xl bg-brand-500 text-brand-fg text-sm font-semibold shadow-brand-btn hover:opacity-90 transition-opacity mb-6"
        >
          {cta.icon && <cta.icon className="size-4" />}
          {cta.label}
        </Link>
      )}

      {tip && (
        <div className="w-full bg-brand-50 rounded-xl p-4 text-left">
          <div className="flex items-center gap-1.5 mb-1">
            <Sparkles className="size-3.5 text-brand-500 shrink-0" />
            <span className="text-[12px] font-bold text-brand-700">{tip.title}</span>
          </div>
          <p className="text-[12px] text-brand-700 leading-relaxed whitespace-pre-line">
            {tip.body}
          </p>
        </div>
      )}
    </div>
  );
}
