"use client";
import { StatusCard } from "@/components/error/StatusCard";
import { ErrorResetButton } from "@/components/error/ErrorResetButton";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ko">
      <body>
        <StatusCard
          kind="error"
          secondaryCta={{ label: "홈으로", href: "/" }}
          devMessage={`${error.message}\ndigest=${error.digest ?? "-"}`}
        >
          <ErrorResetButton reset={reset} label="다시 시도" />
        </StatusCard>
      </body>
    </html>
  );
}
