/**
 * 네이버 OAuth 프로필 응답 타입
 *
 * 네이버 API 응답 형식:
 * {
 *   resultcode: "00",
 *   message: "success",
 *   response: {
 *     id: "네이버 고유 ID",
 *     name: "사용자 이름",
 *     email: "이메일",
 *     profile_image: "프로필 이미지 URL"
 *   }
 * }
 */
export interface NaverProfile {
  response: {
    id: string;
    name: string;
    email: string;
    profile_image?: string;
  };
}
