import { ActionError } from "@/lib/errors";
import { installmentInputSchema } from "@/lib/schemas/installment";
import type { InstallmentInput } from "@/types/installment";
import { z } from "zod";

const installmentUuidSchema = z.string().uuid();

/** 입력을 Zod 로 검증한다. 실패하면 첫 필드 문구로 ActionError(C001) 를 던진다. */
export function parseInstallmentInput(data: InstallmentInput): InstallmentInput {
  const result = installmentInputSchema.safeParse(data);
  if (result.success) return result.data;

  const issue = result.error.issues[0];
  throw ActionError.invalidInput(
    String(issue?.path[0] ?? "unknown"),
    data,
    issue?.message ?? "입력값 검증에 실패했습니다",
  );
}

/** API 경로에 들어가는 할부 UUID 의 형식을 검증한다. */
export function parseInstallmentUuid(installmentUuid: string): string {
  if (!installmentUuidSchema.safeParse(installmentUuid).success) {
    throw ActionError.invalidInput(
      "installmentUuid",
      installmentUuid,
      "UUID 형식이 올바르지 않습니다",
    );
  }
  return installmentUuid;
}
