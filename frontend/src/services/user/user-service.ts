import { serverApiGet, serverApiPut } from "@/lib/server/api/client";
import type { UserProfile } from "@/types";

export async function getUserProfile(): Promise<UserProfile> {
  return serverApiGet<UserProfile>("/users/me/profile");
}

export async function setDefaultFamily(familyUuid: string): Promise<void> {
  await serverApiPut<void>("/users/me/profile", { defaultFamilyUuid: familyUuid });
}
