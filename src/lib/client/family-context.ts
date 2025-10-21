/**
 * 현재 선택된 가족 UUID를 가져오는 유틸리티 함수
 */
export function getSelectedFamilyUuid(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem("selected_family_uuid");
}

/**
 * 가족 UUID를 선택하여 저장
 */
export function setSelectedFamilyUuid(familyUuid: string): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem("selected_family_uuid", familyUuid);
}

/**
 * 선택된 가족 UUID를 제거
 */
export function clearSelectedFamilyUuid(): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem("selected_family_uuid");
}
