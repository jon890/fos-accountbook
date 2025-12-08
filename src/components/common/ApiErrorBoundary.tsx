"use client";

/**
 * API Error Boundary
 *
 * Server Component에서 발생한 에러를 캐치하고
 * toast로 알림 + fallback UI를 표시합니다.
 */

import { Component, type ReactNode } from "react";
import { toast } from "sonner";

interface ApiErrorBoundaryProps {
  children: ReactNode;
  /** 에러 발생 시 표시할 fallback UI (기본: null) */
  fallback?: ReactNode;
  /** toast에 표시할 에러 메시지 */
  errorMessage?: string;
  /** 에러 발생 시 호출할 콜백 */
  onError?: (error: Error) => void;
}

interface ApiErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ApiErrorBoundary extends Component<
  ApiErrorBoundaryProps,
  ApiErrorBoundaryState
> {
  constructor(props: ApiErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ApiErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error): void {
    const { errorMessage, onError } = this.props;

    // toast로 에러 알림
    toast.error(errorMessage || "데이터를 불러오는 중 오류가 발생했습니다.", {
      description: "잠시 후 다시 시도해주세요.",
    });

    // 콜백 호출
    onError?.(error);

    // 콘솔에 에러 로깅
    console.error("[ApiErrorBoundary]", error);
  }

  render() {
    if (this.state.hasError) {
      // fallback UI 반환 (기본: null = 아무것도 표시하지 않음)
      return this.props.fallback ?? null;
    }

    return this.props.children;
  }
}
