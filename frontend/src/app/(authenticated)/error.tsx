"use client";
import { StatusCard } from "@/components/error/StatusCard";
import { ErrorResetButton } from "@/components/error/ErrorResetButton";

export default function AuthenticatedError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <StatusCard
      kind="error"
      secondaryCta={{ label: "대시보드로", href: "/dashboard" }}
      devMessage={`${error.message}\ndigest=${error.digest ?? "-"}`}
    >
      <ErrorResetButton reset={reset} label="다시 시도" />
    </StatusCard>
  );
}
