"use server";

import { serverApiGet } from "@/lib/server/api";
import { serverApiClient, ServerApiError } from "@/lib/server/api/client";
import { auth } from "@/lib/server/auth";
import { getSelectedFamilyUuid } from "@/lib/server/cookies";
import type {
  CreateExpenseFormState,
  GetExpensesParams,
  GetExpensesResult,
} from "@/types/actions";
import type {
  CreateExpenseRequest,
  ExpenseResponse,
  FamilyResponse,
} from "@/types/api";
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

export async function createExpenseAction(
  prevState: CreateExpenseFormState,
  formData: FormData
): Promise<CreateExpenseFormState> {
  try {
    // 인증 확인
    const session = await auth();
    if (!session?.user?.id) {
      redirect("/api/auth/signin");
    }

    // 선택된 가족 UUID 가져오기
    let familyUuid = await getSelectedFamilyUuid();

    // 선택된 가족이 없으면 첫 번째 가족 사용 (쿠키에 저장하지 않음)
    if (!familyUuid) {
      const families = await serverApiGet<FamilyResponse[]>("/families");

      if (!families || families.length === 0) {
        return {
          message: "가족 정보를 찾을 수 없습니다. 먼저 가족을 생성해주세요.",
          success: false,
        };
      }

      familyUuid = families[0].uuid;
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

    if (error instanceof ServerApiError) {
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
    if (!session?.user?.id) {
      redirect("/api/auth/signin");
    }

    // 백엔드 API 호출 (HTTP-only 쿠키에서 자동으로 Access Token 전달)
    await serverApiClient(`/families/${familyUuid}/expenses/${expenseUuid}`, {
      method: "DELETE",
    });

    // 지출 페이지 및 대시보드 revalidate
    revalidatePath("/expenses");
    revalidatePath("/");

    return {
      success: true,
      message: "지출이 성공적으로 삭제되었습니다.",
    };
  } catch (error) {
    console.error("지출 삭제 중 오류:", error);

    if (error instanceof ServerApiError) {
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

/**
 * 지출 목록 조회 Server Action
 */
export async function getExpenses(
  params: GetExpensesParams
): Promise<GetExpensesResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        message: "로그인이 필요합니다.",
      };
    }

    // 선택된 가족 UUID 가져오기
    let familyId = await getSelectedFamilyUuid();

    // 선택된 가족이 없으면 첫 번째 가족 사용 (쿠키에 저장하지 않음)
    if (!familyId) {
      const families = await serverApiGet<FamilyResponse[]>("/families");

      if (!families || families.length === 0) {
        return {
          success: false,
          message: "가족 정보를 찾을 수 없습니다.",
        };
      }

      familyId = families[0].uuid;
    }

    const { categoryId, startDate, endDate, page = 1 } = params;
    const limit = 10;
    let queryParams = `page=${page - 1}&size=${limit}`;

    if (categoryId) {
      queryParams += `&categoryId=${categoryId}`;
    }
    if (startDate) {
      queryParams += `&startDate=${startDate}`;
    }
    if (endDate) {
      queryParams += `&endDate=${endDate}`;
    }

    const response = await serverApiClient<{
      data: {
        content: ExpenseResponse[];
        totalPages: number;
        totalElements: number;
        number: number;
      };
    }>(`/families/${familyId}/expenses?${queryParams}`, {
      method: "GET",
    });

    return {
      success: true,
      data: {
        expenses: response.data.content,
        totalPages: response.data.totalPages,
        totalElements: response.data.totalElements,
        currentPage: response.data.number,
      },
    };
  } catch (error) {
    console.error("지출 조회 중 오류:", error);

    if (error instanceof ServerApiError) {
      return {
        success: false,
        message: error.message || "지출 조회에 실패했습니다.",
      };
    }

    return {
      success: false,
      message: "지출 조회 중 오류가 발생했습니다.",
    };
  }
}
