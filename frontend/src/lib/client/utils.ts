/**
 * 클라이언트 유틸리티 함수
 * 
 * 브라우저 환경에서 안전하게 사용 가능한 유틸리티 함수들입니다.
 */

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Tailwind CSS 클래스를 조건부로 병합합니다.
 * 
 * @example
 * cn('px-2 py-1', condition && 'bg-blue-500', 'text-white')
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

