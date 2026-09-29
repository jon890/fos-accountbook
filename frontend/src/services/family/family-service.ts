import { serverApiGet, serverApiPost, serverApiPut } from "@/lib/server/api/client";
import { ActionError } from "@/lib/errors";
import type {
  CreateFamilyData,
  CreateFamilyResult,
  Family,
  UpdateFamilyRequest,
} from "@/types/family";

export async function createFamily(
  data: CreateFamilyData
): Promise<CreateFamilyResult> {
  const result = await serverApiPost<CreateFamilyResult>("/families", data);

  // Set default family after creation
  await serverApiPut<void>("/users/me/profile", { defaultFamilyUuid: result.uuid });

  return result;
}

export async function getFamilies(): Promise<Family[]> {
  return serverApiGet<Family[]>("/families");
}

export async function getFamilyById(familyUuid: string): Promise<Family> {
  return serverApiGet<Family>(`/families/${familyUuid}`);
}

export async function updateFamily(
  familyUuid: string,
  data: UpdateFamilyRequest
): Promise<Family> {
  return serverApiPut<Family>(`/families/${familyUuid}`, data);
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
