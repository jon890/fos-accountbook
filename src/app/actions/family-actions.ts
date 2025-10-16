"use server";

import { serverApiClient } from "@/lib/server/api/client";
import { auth } from "@/lib/server/auth";
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
