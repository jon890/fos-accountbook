import { Compass, Lock, AlertCircle } from "lucide-react";
import Link from "next/link";
import type { ComponentType, ReactNode } from "react";

type StatusKind = "not-found" | "forbidden" | "error";

interface StatusCardProps {
  kind: StatusKind;
  title?: string;
  description?: string;
  primaryCta?: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  devMessage?: string;
  children?: ReactNode;
}

const STATUS_MAP: Record<
  StatusKind,
  {
    icon: ComponentType<{ className?: string; size?: number | string }>;
    iconBg: string;
    iconColor: string;
    title: string;
    description: string;
  }
> = {
  "not-found": {
    icon: Compass,
    iconBg: "bg-brand-50",
    iconColor: "text-brand-500",
    title: "찾을 수 없어요",
    description: "주소를 다시 확인해 주세요",
  },
  forbidden: {
    icon: Lock,
    iconBg: "bg-warning/10",
    iconColor: "text-warning",
    title: "권한이 없어요",
    description: "이 가족 데이터에 접근할 수 없어요",
  },
  error: {
    icon: AlertCircle,
    iconBg: "bg-expense/10",
    iconColor: "text-expense",
    title: "문제가 발생했어요",
    description: "잠시 후 다시 시도해주세요",
  },
};

export function StatusCard({
  kind,
  title,
  description,
  primaryCta,
  secondaryCta,
  devMessage,
  children,
}: StatusCardProps) {
  const { icon: Icon, iconBg, iconColor, title: defaultTitle, description: defaultDesc } =
    STATUS_MAP[kind];

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-5">
      <div className="max-w-[360px] w-full flex flex-col items-center text-center gap-5">
        <div
          className={`size-[88px] rounded-full ${iconBg} flex items-center justify-center`}
        >
          <Icon className={`size-11 ${iconColor}`} />
        </div>

        <div className="flex flex-col gap-1.5">
          <p className="text-[22px] font-bold tracking-tight text-fg">
            {title ?? defaultTitle}
          </p>
          <p className="text-[13.5px] text-fg-muted">
            {description ?? defaultDesc}
          </p>
        </div>

        {process.env.NODE_ENV !== "production" && devMessage && (
          <div className="w-full bg-bg-elev border border-border rounded-xl p-3.5 text-left">
            <p className="text-[10.5px] font-bold uppercase tracking-wider text-fg-subtle mb-1.5">
              DEV ONLY
            </p>
            <p className="font-mono text-[12px] text-expense break-all whitespace-pre-wrap">
              {devMessage}
            </p>
          </div>
        )}

        <div className="w-full flex flex-col gap-3">
          {primaryCta && (
            <Link
              href={primaryCta.href}
              className="h-12 px-6 rounded-xl bg-brand-500 text-brand-fg font-semibold flex items-center justify-center hover:opacity-90 transition-opacity"
            >
              {primaryCta.label}
            </Link>
          )}
          {secondaryCta && (
            <Link
              href={secondaryCta.href}
              className="text-sm font-semibold text-fg-muted hover:text-fg transition-colors"
            >
              {secondaryCta.label}
            </Link>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}
