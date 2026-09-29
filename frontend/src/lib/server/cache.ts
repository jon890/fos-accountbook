/**
 * Per-request 캐시 유틸리티 (React.cache 기반)
 *
 * React.cache()는 동일한 서버 렌더링 요청 내에서 중복 호출을 제거합니다.
 * Server Components와 Server Actions에서 공통으로 호출되는 비싼 연산을
 * 요청 단위로 메모이제이션하여 불필요한 중복 fetch를 방지합니다.
 *
 * ⚠️ 서버 전용 — Client Component에서 import 금지
 */

import "server-only";

import { cache } from "react";
import { auth } from "@/lib/server/auth";
import { serverApiGet } from "@/lib/server/api";
import type { CategoryResponse } from "@/types/category";
import type { DashboardStats } from "@/types/dashboard";

/**
 * 세션 조회 (per-request 캐시)
 *
 * requireAuth()와 getSelectedFamilyUuid() 등 여러 곳에서 auth()를 호출해도
 * 같은 요청 내에서는 한 번만 실제 조회가 발생합니다.
 */
export const getCachedSession = cache(() => auth());

/**
 * 가족 카테고리 목록 조회 (per-request 캐시)
 *
 * 같은 요청에서 동일한 familyUuid로 여러 번 호출해도 API는 한 번만 호출됩니다.
 * RSC 렌더링 중 여러 컴포넌트나 동일 Server Action 내 중복 호출 시 효과적입니다.
 *
 * ⚠️ React.cache()는 단일 요청(렌더 트리) 범위의 메모이제이션입니다.
 * 별도의 Server Action POST 요청 간에는 캐시가 공유되지 않습니다.
 */
export const getCachedFamilyCategories = cache(
  (familyUuid: string): Promise<CategoryResponse[]> =>
    serverApiGet<CategoryResponse[]>(`/families/${familyUuid}/categories`)
);

/**
 * 대시보드 월별 통계 조회 (per-request 캐시)
 */
export const getCachedDashboardStats = cache(
  (familyUuid: string, year: number, month: number): Promise<DashboardStats> =>
    serverApiGet<DashboardStats>(
      `/families/${familyUuid}/dashboard/stats/monthly?year=${year}&month=${month}`
    )
);
