/**
 * 회원가입 요청 타입
 */

export interface RegisterRequest {
  email: string;
  name?: string;
  image?: string;
}
