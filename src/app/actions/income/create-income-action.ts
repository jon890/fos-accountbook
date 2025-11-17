/**
 * 수입 생성 Server Action
 */

"use server";

import { ActionError } from "@/lib/errors";
import { serverApiClient } from "@/lib/server/api/client";
import {
  requireAuthOrRedirect,
  getSelectedFamilyUuid,
} from "@/lib/server/auth-helpers";
import type { CreateIncomeRequest, IncomeResponse } from "@/types/income";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export interface CreateIncomeFormState {
  message?: string;
  errors?: {
    amount?: string[];
    description?: string[];
    categoryId?: string[];
    date?: string[];
  };
  success: boolean;
}

const createIncomeSchema = z.object({
  amount: z.number().positive("금액은 0보다 커야 합니다"),
  description: z.string().optional(),
  categoryId: z.string().min(1, "카테고리를 선택해주세요"),
  date: z.string().optional(),
});

export async function createIncomeAction(
  prevState: CreateIncomeFormState,
  formData: FormData
): Promise<CreateIncomeFormState> {
  try {
    // 인증 확인
    await requireAuthOrRedirect();

    // familyUuid 가져오기 (폼에서 전달되거나 기본값 사용)
    let familyUuid = formData.get("familyUuid")?.toString();

    // 폼에서 전달되지 않았다면 기본값 가져오기
    if (!familyUuid) {
      const selectedUuid = await getSelectedFamilyUuid();
      familyUuid = selectedUuid || undefined;
    }

    // 선택된 가족이 없으면 에러
    if (!familyUuid) {
      throw ActionError.familyNotSelected();
    }

    // 폼 데이터 파싱
    const rawData = {
      amount: Number(formData.get("amount")),
      description: formData.get("description")?.toString(),
      categoryId: formData.get("categoryId")?.toString(),
      date: formData.get("date")?.toString(),
    };

    // 데이터 검증
    const validatedFields = createIncomeSchema.safeParse(rawData);

    if (!validatedFields.success) {
      return {
        errors: validatedFields.error.flatten().fieldErrors,
        message: "입력값을 확인해주세요.",
        success: false,
      };
    }

    const { amount, description, categoryId, date } = validatedFields.data;

    // 백엔드 API 호출
    const requestBody: CreateIncomeRequest = {
      categoryUuid: categoryId,
      amount,
      description,
      date: date ? new Date(date).toISOString() : new Date().toISOString(),
    };

    await serverApiClient<{ data: IncomeResponse }>(
      `/families/${familyUuid}/incomes`,
      {
        method: "POST",
        body: JSON.stringify(requestBody),
      }
    );

    // 페이지 revalidate
    revalidatePath("/transactions");
    revalidatePath("/");

    return {
      message: "수입이 성공적으로 추가되었습니다.",
      success: true,
    };
  } catch (error) {
    console.error("수입 추가 중 오류:", error);

    // ActionError 처리
    if (error instanceof ActionError) {
      return {
        message: error.message,
        success: false,
      };
    }

    return {
      message:
        error instanceof Error
          ? error.message
          : "수입 추가에 실패했습니다. 다시 시도해주세요.",
      success: false,
    };
  }
}
