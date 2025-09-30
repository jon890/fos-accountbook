"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { expenseService, familyService } from "@/container";

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
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      redirect("/api/auth/signin");
    }

    // 사용자의 가족 정보 가져오기
    const family = await familyService.getFamilyByUserId(session.user.id);
    if (!family) {
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

    // 카테고리가 해당 가족에 속하는지 확인 (UUID 기반)
    const categoryExists = family.categories.some(
      (cat) => cat.id === categoryId
    );
    if (!categoryExists) {
      return {
        errors: {
          categoryId: ["유효하지 않은 카테고리입니다."],
        },
        message: "유효하지 않은 카테고리입니다.",
        success: false,
      };
    }

    // 지출 생성
    await expenseService.createExpense({
      familyId: family.uuid,
      categoryId,
      amount,
      description: description || undefined,
      date: date ? new Date(date) : undefined,
    });

    // 지출 페이지 및 대시보드 revalidate
    revalidatePath("/expenses");
    revalidatePath("/");

    return {
      message: "지출이 성공적으로 추가되었습니다.",
      success: true,
    };
  } catch (error) {
    console.error("지출 추가 중 오류:", error);
    return {
      message: "지출 추가 중 오류가 발생했습니다. 다시 시도해주세요.",
      success: false,
    };
  }
}

export async function deleteExpenseAction(expenseId: string): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    // 인증 확인
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      redirect("/api/auth/signin");
    }

    // 지출 삭제
    const success = await expenseService.deleteExpense(expenseId);

    if (!success) {
      return {
        success: false,
        message: "지출 삭제에 실패했습니다.",
      };
    }

    // 지출 페이지 및 대시보드 revalidate
    revalidatePath("/expenses");
    revalidatePath("/");

    return {
      success: true,
      message: "지출이 성공적으로 삭제되었습니다.",
    };
  } catch (error) {
    console.error("지출 삭제 중 오류:", error);
    return {
      success: false,
      message: "지출 삭제 중 오류가 발생했습니다.",
    };
  }
}
