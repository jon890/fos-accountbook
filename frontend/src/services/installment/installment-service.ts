import {
  serverApiDelete,
  serverApiGet,
  serverApiPost,
  serverApiPut,
} from "@/lib/server/api/client";
import {
  installmentListResponseSchema,
  installmentResponseSchema,
} from "@/lib/schemas/responses/installment";
import type { Installment, InstallmentInput } from "@/types/installment";

export async function getInstallments(
  familyUuid: string,
): Promise<Installment[]> {
  return serverApiGet(`/families/${familyUuid}/installments`, {
    schema: installmentListResponseSchema,
  });
}

export async function createInstallment(
  familyUuid: string,
  data: InstallmentInput,
): Promise<Installment> {
  return serverApiPost<Installment>(
    `/families/${familyUuid}/installments`,
    data,
    { schema: installmentResponseSchema },
  );
}

export async function updateInstallment(
  familyUuid: string,
  installmentUuid: string,
  data: InstallmentInput,
): Promise<Installment> {
  return serverApiPut<Installment>(
    `/families/${familyUuid}/installments/${installmentUuid}`,
    data,
    { schema: installmentResponseSchema },
  );
}

export async function deleteInstallment(
  familyUuid: string,
  installmentUuid: string,
): Promise<void> {
  await serverApiDelete(
    `/families/${familyUuid}/installments/${installmentUuid}`,
  );
}
