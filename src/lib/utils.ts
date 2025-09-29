import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import crypto from "crypto";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 초대 링크용 고유 코드를 생성합니다 (32자리)
 */
export function generateInviteCode(): string {
  return crypto.randomBytes(16).toString("hex");
}
