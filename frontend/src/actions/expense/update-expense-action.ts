"use server";

import {
  requireAuth,
  getSelectedFamilyUuid,
} from "@/lib/server/auth/auth-helpers";
import { updateExpense } from "@/services/expense/expense-service";
import type { UpdateExpenseFormState } from "@/types/expense";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// 지출 수정 스키마 (모든 필드가 선택적)
const updateExpenseSchema = z.object({
  expenseUuid: z.string().min(1, "지출 UUID는 필수입니다"),
  familyUuid: z.string().min(1, "가족 UUID는 필수입니다"),
  amount: z.number().positive("금액은 0보다 커야 합니다").optional(),
  description: z.string().optional(),
  categoryId: z.string().min(1, "카테고리를 선택해주세요").optional(),
  date: z.string().optional(),
});

export async function updateExpenseAction(
  prevState: UpdateExpenseFormState,
  formData: FormData
): Promise<UpdateExpenseFormState> {
  try {
    await requireAuth();

    const rawData = {
      expenseUuid: formData.get("expenseUuid")?.toString(),
      familyUuid: formData.get("familyUuid")?.toString(),
      amount: formData.get("amount") ? Number(formData.get("amount")) : undefined,
      description: formData.get("description")?.toString(),
      categoryId: formData.get("categoryId")?.toString(),
      date: formData.get("date")?.toString(),
    };

    const validatedFields = updateExpenseSchema.safeParse(rawData);
    if (!validatedFields.success) {
      return {
        errors: validatedFields.error.flatten().fieldErrors,
        message: "입력값을 확인해주세요.",
        success: false,
      };
    }

    const { expenseUuid, familyUuid, amount, description, categoryId, date } =
      validatedFields.data;

    const sessionFamilyUuid = await getSelectedFamilyUuid();
    if (!sessionFamilyUuid) {
      return { success: false, message: "가족 정보를 찾을 수 없습니다.", errors: {} };
    }
    if (familyUuid !== sessionFamilyUuid) {
      return { success: false, message: "권한이 없습니다.", errors: {} };
    }

    if (!categoryId && !amount && description === undefined && !date) {
      return { success: false, message: "수정할 내용이 없습니다", errors: {} };
    }

    await updateExpense(familyUuid, expenseUuid, {
      amount,
      description,
      categoryId,
      date,
    });

    revalidatePath("/transactions");
    revalidatePath("/");
    revalidatePath("/analytics");

    return { success: true, message: "지출이 수정되었습니다" };
  } catch {
    return {
      success: false,
      message: "지출 수정 중 오류가 발생했습니다. 다시 시도해주세요.",
      errors: {},
    };
  }
}
