"use server";

import { auth } from "@/lib/server/auth";
import { serverApiClient } from "@/lib/server/api";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

/**
 * 사용자의 기본 가족 설정
 */
export async function setDefaultFamily(familyUuid: string) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/api/auth/signin");
  }

  await serverApiClient("/users/me/default-family", {
    method: "PUT",
    body: JSON.stringify({ familyUuid }),
  });

  revalidatePath("/");
  revalidatePath("/settings");
}

/**
 * 사용자의 기본 가족 조회
 */
export async function getDefaultFamily(): Promise<string | null> {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/api/auth/signin");
  }

  const response = await serverApiClient<{ defaultFamilyUuid: string }>(
    "/users/me/default-family"
  );

  return response.defaultFamilyUuid || null;
}
