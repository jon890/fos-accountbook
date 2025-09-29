/**
 * 가족 구성원 상태 enum
 */
export class MemberStatus {
  static readonly PENDING = new MemberStatus("pending", "가입 신청 대기");
  static readonly APPROVED = new MemberStatus("approved", "승인됨");
  static readonly REJECTED = new MemberStatus("rejected", "거절됨");
  static readonly ACTIVE = new MemberStatus("active", "활성 멤버");

  private constructor(
    public readonly code: string,
    public readonly name: string
  ) {}

  static fromCode(code: string): MemberStatus {
    switch (code) {
      case "pending":
        return MemberStatus.PENDING;
      case "approved":
        return MemberStatus.APPROVED;
      case "rejected":
        return MemberStatus.REJECTED;
      case "active":
        return MemberStatus.ACTIVE;
      default:
        throw new Error(`Invalid MemberStatus code: ${code}`);
    }
  }

  static getAllCodes(): string[] {
    return [
      MemberStatus.PENDING.code,
      MemberStatus.APPROVED.code,
      MemberStatus.REJECTED.code,
      MemberStatus.ACTIVE.code,
    ];
  }

  static getAllValues(): MemberStatus[] {
    return [
      MemberStatus.PENDING,
      MemberStatus.APPROVED,
      MemberStatus.REJECTED,
      MemberStatus.ACTIVE,
    ];
  }
}

/**
 * 가족 구성원 역할 enum
 */
export class MemberRole {
  static readonly ADMIN = new MemberRole("admin", "관리자");
  static readonly MEMBER = new MemberRole("member", "일반 멤버");

  private constructor(
    public readonly code: string,
    public readonly name: string
  ) {}

  static fromCode(code: string): MemberRole {
    switch (code) {
      case "admin":
        return MemberRole.ADMIN;
      case "member":
        return MemberRole.MEMBER;
      default:
        throw new Error(`Invalid MemberRole code: ${code}`);
    }
  }

  static getAllCodes(): string[] {
    return [MemberRole.ADMIN.code, MemberRole.MEMBER.code];
  }

  static getAllValues(): MemberRole[] {
    return [MemberRole.ADMIN, MemberRole.MEMBER];
  }
}

/**
 * 초대 링크 상태 enum
 */
export enum InviteStatus {
  ACTIVE = "active", // 활성
  INACTIVE = "inactive", // 비활성
  EXPIRED = "expired", // 만료
}

/**
 * 초대 검증 실패 이유 enum
 */
export class InviteValidationReason {
  static readonly EXPIRED = new InviteValidationReason("expired", "만료됨");
  static readonly INACTIVE = new InviteValidationReason(
    "inactive",
    "비활성화됨"
  );
  static readonly LIMIT_EXCEEDED = new InviteValidationReason(
    "limit_exceeded",
    "사용 횟수 초과"
  );
  static readonly NOT_FOUND = new InviteValidationReason(
    "not_found",
    "찾을 수 없음"
  );
  static readonly ALREADY_MEMBER = new InviteValidationReason(
    "already_member",
    "이미 멤버임"
  );

  private constructor(
    public readonly code: string,
    public readonly name: string
  ) {}

  static fromCode(code: string): InviteValidationReason {
    switch (code) {
      case "expired":
        return InviteValidationReason.EXPIRED;
      case "inactive":
        return InviteValidationReason.INACTIVE;
      case "limit_exceeded":
        return InviteValidationReason.LIMIT_EXCEEDED;
      case "not_found":
        return InviteValidationReason.NOT_FOUND;
      case "already_member":
        return InviteValidationReason.ALREADY_MEMBER;
      default:
        throw new Error(`Invalid InviteValidationReason code: ${code}`);
    }
  }

  static getAllCodes(): string[] {
    return [
      InviteValidationReason.EXPIRED.code,
      InviteValidationReason.INACTIVE.code,
      InviteValidationReason.LIMIT_EXCEEDED.code,
      InviteValidationReason.NOT_FOUND.code,
      InviteValidationReason.ALREADY_MEMBER.code,
    ];
  }

  static getAllValues(): InviteValidationReason[] {
    return [
      InviteValidationReason.EXPIRED,
      InviteValidationReason.INACTIVE,
      InviteValidationReason.LIMIT_EXCEEDED,
      InviteValidationReason.NOT_FOUND,
      InviteValidationReason.ALREADY_MEMBER,
    ];
  }
}

/**
 * 가족 타입 enum
 */
export enum FamilyType {
  PERSONAL = "personal", // 개인 가계부
  FAMILY = "family", // 가족 가계부
}
