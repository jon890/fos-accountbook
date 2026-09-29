/**
 * 지출 생성 Server Action
 */

"use server";

import { ActionError } from "@/lib/errors";
import {
  requireAuthOrRedirect,
  getSelectedFamilyUuid,
} from "@/lib/server/auth/auth-helpers";
import { createExpense } from "@/services/expense/expense-service";
import type { CreateExpenseFormState } from "@/types/expense";
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
    await requireAuthOrRedirect();

    const familyUuid = await getSelectedFamilyUuid();
    if (!familyUuid) {
      throw ActionError.familyNotSelected();
    }

    const rawData = {
      amount: Number(formData.get("amount")),
      description: formData.get("description")?.toString(),
      categoryId: formData.get("categoryId")?.toString(),
      date: formData.get("date")?.toString(),
    };

    const validatedFields = createExpenseSchema.safeParse(rawData);
    if (!validatedFields.success) {
      return {
        errors: validatedFields.error.flatten().fieldErrors,
        message: "입력값을 확인해주세요.",
        success: false,
      };
    }

    await createExpense(familyUuid, validatedFields.data);

    revalidatePath("/transactions");
    revalidatePath("/");
    revalidatePath("/analytics");

    return {
      message: "지출이 성공적으로 추가되었습니다.",
      success: true,
    };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "지출 추가에 실패했습니다. 다시 시도해주세요.";
    return { message, success: false };
  }
}
