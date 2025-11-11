/**
 * 지출 생성 Server Action
 */

"use server";

import { ActionError } from "@/lib/errors";
import { serverApiClient } from "@/lib/server/api/client";
import { requireAuthOrRedirect } from "@/lib/server/auth-helpers";
import { getSelectedFamilyUuid } from "@/lib/server/cookies";
import type { CreateExpenseFormState } from "@/types/actions";
import type { CreateExpenseRequest, ExpenseResponse } from "@/types/expense";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// 지출 생성 스키마
const createExpenseSchema = z.object({
  amount: z.number().positive("금액은 0보다 커야 합니다"),
  description: z.string().optional(),
  categoryId: z.string().min(1, "카테고리를 선택해주세요"),
  date: z.string().optional(),
});

export async function createExpenseAction(
  prevState: CreateExpenseFormState,
  formData: FormData
): Promise<CreateExpenseFormState> {
  try {
    // 인증 확인
    await requireAuthOrRedirect();

    // 선택된 가족 UUID 가져오기
    const familyUuid = await getSelectedFamilyUuid();

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
    const validatedFields = createExpenseSchema.safeParse(rawData);

    if (!validatedFields.success) {
      return {
        errors: validatedFields.error.flatten().fieldErrors,
        message: "입력값을 확인해주세요.",
        success: false,
      };
    }

    const { amount, description, categoryId, date } = validatedFields.data;

    // 백엔드 API 호출 (HTTP-only 쿠키에서 자동으로 Access Token 전달)
    const requestBody: CreateExpenseRequest = {
      categoryUuid: categoryId,
      amount,
      description,
      date: date ? new Date(date).toISOString() : new Date().toISOString(),
    };

    await serverApiClient<{ data: ExpenseResponse }>(
      `/families/${familyUuid}/expenses`,
      {
        method: "POST",
        body: JSON.stringify(requestBody),
      }
    );

    // 지출 페이지 및 대시보드 revalidate
    revalidatePath("/expenses");
    revalidatePath("/");

    return {
      message: "지출이 성공적으로 추가되었습니다.",
      success: true,
    };
  } catch (error) {
    console.error("지출 추가 중 오류:", error);

    // ActionError 처리
    if (error instanceof ActionError) {
      return {
        message: error.message,
        success: false,
      };
    }

    return {
      message: "지출 추가 중 오류가 발생했습니다. 다시 시도해주세요.",
      success: false,
    };
  }
}
