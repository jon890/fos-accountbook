"use server";

import { apiDelete, ApiError, apiPost } from "@/lib/client";
import { auth } from "@/lib/server/auth";
import type { CreateExpenseRequest, ExpenseResponse } from "@/types/api";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

// 지출 생성 스키마
const createExpenseSchema = z.object({
  amount: z.number().positive("금액은 0보다 커야 합니다"),
  description: z.string().optional(),
  categoryId: z.string().min(1, "카테고리를 선택해주세요"),
  date: z.string().optional(),
});

export type CreateExpenseFormState = {
  errors?: {
    amount?: string[];
    description?: string[];
    categoryId?: string[];
    date?: string[];
  };
  message?: string;
  success?: boolean;
};

export async function createExpenseAction(
  prevState: CreateExpenseFormState,
  formData: FormData
): Promise<CreateExpenseFormState> {
  try {
    // 인증 확인
    const session = await auth();
    if (!session?.user?.id || !session?.user?.accessToken) {
      redirect("/api/auth/signin");
    }

    // familyUuid 가져오기 (폼 데이터 또는 첫 번째 가족 사용)
    const familyUuid = formData.get("familyUuid")?.toString();
    if (!familyUuid) {
      return {
        message: "가족 정보를 찾을 수 없습니다. 먼저 가족을 생성해주세요.",
        success: false,
      };
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

    // 백엔드 API 호출
    const requestBody: CreateExpenseRequest = {
      categoryUuid: categoryId,
      amount,
      description,
      date: date ? new Date(date).toISOString() : new Date().toISOString(),
    };

    await apiPost<ExpenseResponse>(
      `/families/${familyUuid}/expenses`,
      requestBody,
      { token: session.user.accessToken }
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
    
    if (error instanceof ApiError) {
      return {
        message: error.message || "지출 추가 중 오류가 발생했습니다.",
        success: false,
      };
    }

    return {
      message: "지출 추가 중 오류가 발생했습니다. 다시 시도해주세요.",
      success: false,
    };
  }
}

export async function deleteExpenseAction(
  familyUuid: string,
  expenseUuid: string
): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    // 인증 확인
    const session = await auth();
    if (!session?.user?.id || !session?.user?.accessToken) {
      redirect("/api/auth/signin");
    }

    // 백엔드 API 호출
    await apiDelete(
      `/families/${familyUuid}/expenses/${expenseUuid}`,
      { token: session.user.accessToken }
    );

    // 지출 페이지 및 대시보드 revalidate
    revalidatePath("/expenses");
    revalidatePath("/");

    return {
      success: true,
      message: "지출이 성공적으로 삭제되었습니다.",
    };
  } catch (error) {
    console.error("지출 삭제 중 오류:", error);
    
    if (error instanceof ApiError) {
      return {
        success: false,
        message: error.message || "지출 삭제에 실패했습니다.",
      };
    }

    return {
      success: false,
      message: "지출 삭제 중 오류가 발생했습니다.",
    };
  }
}
