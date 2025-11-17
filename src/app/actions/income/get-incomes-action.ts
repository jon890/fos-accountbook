"use server";

import {
  handleActionError,
  successResult,
  type ActionResult,
} from "@/lib/errors";
import { serverApiGet } from "@/lib/server/api/client";
import { requireAuth } from "@/lib/server/auth/auth-helpers";
import type { GetIncomesParams, GetIncomesResponse } from "@/types/income";

/**
 * 수입 목록 조회 Server Action
 */
export async function getIncomesAction(
  params: GetIncomesParams
): Promise<ActionResult<GetIncomesResponse>> {
  try {
    // 1. 인증 확인
    await requireAuth();

    // 2. 쿼리 파라미터 구성
    const queryParams = new URLSearchParams();
    if (params.categoryId) queryParams.set("categoryUuid", params.categoryId);
    if (params.startDate) queryParams.set("startDate", params.startDate);
    if (params.endDate) queryParams.set("endDate", params.endDate);
    queryParams.set("page", String((params.page || 1) - 1)); // 백엔드는 0-based
    queryParams.set("size", String(params.limit || 25));

    const queryString = queryParams.toString();
    const endpoint = `/families/${params.familyId}/incomes${
      queryString ? `?${queryString}` : ""
    }`;

    // 3. 백엔드 API 호출
    const response = await serverApiGet<GetIncomesResponse>(endpoint);

    return successResult(response);
  } catch (error) {
    console.error("수입 목록 조회 실패:", error);
    return handleActionError(error, "수입 목록 조회에 실패했습니다");
  }
}
