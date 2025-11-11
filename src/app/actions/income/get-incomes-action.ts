"use server";

import { requireAuth } from "@/lib/server/auth-helpers";
import { serverApiClient } from "@/lib/server/api/client";
import {
  successResult,
  handleActionError,
  type ActionResult,
} from "@/lib/errors";

export interface Income {
  uuid: string;
  familyUuid: string;
  categoryUuid: string;
  category: {
    uuid: string;
    name: string;
    color: string;
    icon: string;
  };
  amount: number;
  description: string | null;
  date: string;
  createdAt: string;
  updatedAt: string;
}

export interface GetIncomesParams {
  familyId: string;
  categoryId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface GetIncomesResponse {
  items: Income[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
}

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
    const response = await serverApiClient<GetIncomesResponse>(endpoint, {
      method: "GET",
    });

    return successResult(response);
  } catch (error) {
    console.error("수입 목록 조회 실패:", error);
    return handleActionError(error, "수입 목록 조회에 실패했습니다");
  }
}
