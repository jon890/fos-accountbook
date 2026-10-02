import { serverApiGet, serverApiPost, serverApiPut } from "@/lib/server/api/client";
import { ActionError } from "@/lib/errors";
import {
  createFamilyResultSchema,
  familyListSchema,
  familyMemberListSchema,
  familySchema,
} from "@/lib/schemas/responses/family";
import type {
  CreateFamilyData,
  CreateFamilyResult,
  Family,
  FamilyMemberSummary,
  UpdateFamilyRequest,
} from "@/types/family";

export async function createFamily(
  data: CreateFamilyData
): Promise<CreateFamilyResult> {
  const result = await serverApiPost<CreateFamilyResult>("/families", data, {
    schema: createFamilyResultSchema,
  });

  // Set default family after creation
  await serverApiPut<void>("/users/me/profile", { defaultFamilyUuid: result.uuid });

  return result;
}

export async function getFamilies(): Promise<Family[]> {
  return serverApiGet<Family[]>("/families", { schema: familyListSchema });
}

export async function getFamilyById(familyUuid: string): Promise<Family> {
  return serverApiGet<Family>(`/families/${familyUuid}`, { schema: familySchema });
}

export async function updateFamily(
  familyUuid: string,
  data: UpdateFamilyRequest
): Promise<Family> {
  return serverApiPut<Family>(`/families/${familyUuid}`, data, {
    schema: familySchema,
  });
}

export async function selectFamily(familyUuid: string): Promise<void> {
  const families = await getFamilies();
  const familyExists = families.some((f) => f.uuid === familyUuid);
  if (!familyExists) {
    throw ActionError.entityNotFound("가족", familyUuid);
  }
  await setDefaultFamily(familyUuid);
}

export async function setDefaultFamily(familyUuid: string): Promise<void> {
  await serverApiPut<void>("/users/me/profile", { defaultFamilyUuid: familyUuid });
}

export async function getFamilyMembers(
  familyUuid: string
): Promise<FamilyMemberSummary[]> {
  return serverApiGet<FamilyMemberSummary[]>(`/families/${familyUuid}/members`, {
    schema: familyMemberListSchema,
  });
}
