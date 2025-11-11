/**
 * Expenses Page - 지출 페이지 리다이렉트
 * /expenses → /transactions?tab=expenses로 리다이렉트
 */

import { redirect } from "next/navigation";

export default function ExpensesPage() {
  redirect("/transactions?tab=expenses");
}
