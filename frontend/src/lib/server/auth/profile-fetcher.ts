import { UserProfile } from "@/types";
import { serverApiGet } from "../api";

/**
 * 사용자 프로필을 백엔드에서 조회합니다.
 * jwt callback에서 사용되며, 실패 시 null을 반환합니다.
 *
 * @returns UserProfile | null
 */
export async function fetchUserProfile(): Promise<UserProfile | null> {
  try {
    return await serverApiGet<UserProfile>("/users/me/profile");
  } catch (error) {
    console.error("[fetchUserProfile] 프로필 조회 실패:", error);
    return null;
  }
}
