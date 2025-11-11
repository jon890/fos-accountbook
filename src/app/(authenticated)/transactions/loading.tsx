import { PageLoadingSpinner } from "@/components/common/PageLoadingSpinner";

/**
 * Transactions 페이지 로딩 UI
 * 페이지 이동 시 서버 컴포넌트 로드 중 자동으로 표시됨
 */
export default function TransactionsLoading() {
  return <PageLoadingSpinner />;
}
