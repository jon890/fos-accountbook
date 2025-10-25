"use server";

import { serverApiClient } from "@/lib/server/api/client";
import { auth } from "@/lib/server/auth";
import {
  getSelectedFamilyUuid,
  setSelectedFamilyUuid,
} from "@/lib/server/cookies";
import type {
  CreateFamilyData,
  CreateFamilyResult,
  Family,
  GetFamiliesResult,
} from "@/types/actions";
import { revalidatePath } from "next/cache";

/**
 * 가족 생성 Server Action
 */
export async function createFamily(
  data: CreateFamilyData
): Promise<CreateFamilyResult> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const result = await serverApiClient<{
    data: CreateFamilyResult;
  }>("/families", {
    method: "POST",
    body: JSON.stringify(data),
  });

  revalidatePath("/");
  return result.data;
}

/**
 * 가족 목록 조회 Server Action
 */
export async function getFamilies(): Promise<GetFamiliesResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        message: "로그인이 필요합니다.",
      };
    }

    const result = await serverApiClient<{
      data: Family[];
    }>("/families", {
      method: "GET",
    });

    return {
      success: true,
      data: result.data,
    };
  } catch (error) {
    console.error("Failed to get families:", error);
    return {
      success: false,
      message: "가족 목록을 불러오는데 실패했습니다.",
    };
  }
}

/**
 * 가족 상세 조회 Server Action
 */
export async function getFamilyById(familyUuid: string): Promise<Family> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const result = await serverApiClient<{
    data: Family;
  }>(`/families/${familyUuid}`, {
    method: "GET",
  });

  return result.data;
}

/**
 * 선택된 가족 설정 Server Action
 * 쿠키에 가족 UUID를 저장하고 페이지를 새로고침
 */
export async function selectFamily(
  familyUuid: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        message: "로그인이 필요합니다.",
      };
    }

    // 가족이 존재하는지 확인
    const families = await getFamilies();
    if (!families.success || !families.data) {
      return {
        success: false,
        message: "가족 목록을 불러오는데 실패했습니다.",
      };
    }

    const familyExists = families.data.some((f) => f.uuid === familyUuid);
    if (!familyExists) {
      return {
        success: false,
        message: "선택한 가족을 찾을 수 없습니다.",
      };
    }

    // 쿠키에 선택된 가족 UUID 저장
    await setSelectedFamilyUuid(familyUuid);

    // 모든 페이지 재검증
    revalidatePath("/", "layout");

    return {
      success: true,
    };
  } catch (error) {
    console.error("Failed to select family:", error);
    return {
      success: false,
      message: "가족 선택에 실패했습니다.",
    };
  }
}

/**
 * 가족 정보 존재 여부 확인
 * 여러 페이지에서 공통으로 사용되는 유틸리티 함수
 */
export async function checkUserFamily(): Promise<{
  hasFamily: boolean;
  familyId?: string;
}> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { hasFamily: false };
    }

    const families = await getFamilies();

    if (!families.success || !families.data || families.data.length === 0) {
      return { hasFamily: false };
    }

    // 선택된 가족 UUID 가져오기 (쿠키에서 읽기만)
    let selectedFamilyUuid = await getSelectedFamilyUuid();
    if (!selectedFamilyUuid) {
      selectedFamilyUuid = families.data[0].uuid;
    }

    return {
      hasFamily: true,
      familyId: selectedFamilyUuid,
    };
  } catch (error) {
    console.error("Failed to check family:", error);
    return { hasFamily: false };
  }
}
