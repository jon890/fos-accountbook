/**
 * 수입 수정 Server Action
 */

"use server";

import { ActionError } from "@/lib/errors";
import { serverApiClient } from "@/lib/server/api/client";
import { requireAuth } from "@/lib/server/auth-helpers";
import type { UpdateIncomeFormState } from "@/types/income";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// 수입 수정 스키마 (모든 필드가 선택적)
const updateIncomeSchema = z.object({
  incomeUuid: z.string().min(1, "수입 UUID는 필수입니다"),
  familyUuid: z.string().min(1, "가족 UUID는 필수입니다"),
  amount: z.number().positive("금액은 0보다 커야 합니다").optional(),
  description: z.string().optional(),
  categoryId: z.string().min(1, "카테고리를 선택해주세요").optional(),
  date: z.string().optional(),
});

export async function updateIncomeAction(
  prevState: UpdateIncomeFormState,
  formData: FormData
): Promise<UpdateIncomeFormState> {
  try {
    // 인증 확인
    await requireAuth();

    // FormData에서 데이터 추출
    const rawData = {
      incomeUuid: formData.get("incomeUuid")?.toString(),
      familyUuid: formData.get("familyUuid")?.toString(),
      amount: formData.get("amount")
        ? Number(formData.get("amount"))
        : undefined,
      description: formData.get("description")?.toString(),
      categoryId: formData.get("categoryId")?.toString(),
      date: formData.get("date")?.toString(),
    };

    // Zod 스키마로 데이터 검증
    const validatedFields = updateIncomeSchema.safeParse(rawData);

    if (!validatedFields.success) {
      return {
        errors: validatedFields.error.flatten().fieldErrors,
        message: "입력값을 확인해주세요.",
        success: false,
      };
    }

    const { incomeUuid, familyUuid, amount, description, categoryId, date } =
      validatedFields.data;

    // 최소 하나의 필드는 수정되어야 함
    if (!categoryId && !amount && description === undefined && !date) {
      return {
        success: false,
        message: "수정할 내용이 없습니다",
        errors: {},
      };
    }

    // 백엔드 요청 데이터 구성
    const updateData: {
      categoryUuid?: string;
      amount?: number;
      description?: string;
      date?: string;
    } = {};

    if (categoryId) {
      updateData.categoryUuid = categoryId;
    }

    if (amount !== undefined) {
      updateData.amount = amount;
    }

    if (description !== undefined) {
      updateData.description = description;
    }

    if (date) {
      updateData.date = new Date(date).toISOString();
    }

    // 백엔드 API 호출
    await serverApiClient(`/families/${familyUuid}/incomes/${incomeUuid}`, {
      method: "PUT",
      body: JSON.stringify(updateData),
    });

    // 관련 페이지 재검증
    revalidatePath("/transactions");
    revalidatePath("/");

    return {
      success: true,
      message: "수입이 수정되었습니다",
    };
  } catch (error) {
    console.error("Failed to update income:", error);

    // ActionError 처리
    if (error instanceof ActionError) {
      return {
        success: false,
        message: error.message,
        errors: {},
      };
    }

    return {
      success: false,
      message: "수입 수정 중 오류가 발생했습니다. 다시 시도해주세요.",
      errors: {},
    };
  }
}
