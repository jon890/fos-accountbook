"use server";

import { familyInviteService } from "@/container";
import { auth } from "@/lib/auth";
import { MemberStatus } from "@/types/enums";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

// 초대 링크 생성 스키마
const createInviteSchema = z.object({
  familyUuid: z.string().uuid("유효한 가족 UUID를 입력해주세요."),
  expiresInDays: z.coerce.number().int().min(1).max(30).optional(),
  usageLimit: z.coerce.number().int().min(1).optional(),
});

// 초대 코드 가입 스키마
const joinFamilySchema = z.object({
  inviteCode: z.string().min(1, "초대 코드를 입력해주세요."),
});

// 멤버 승인/거절 스키마
const manageMemberSchema = z.object({
  familyUuid: z.string().uuid("유효한 가족 UUID를 입력해주세요."),
  userUuid: z.string().uuid("유효한 사용자 UUID를 입력해주세요."),
});

export interface ActionResult<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: string[];
}

/**
 * 초대 링크 생성 서버 액션
 */
export async function createInviteAction(
  formData: FormData
): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.uuid) {
      return {
        success: false,
        message: "로그인이 필요합니다.",
      };
    }

    const rawData = {
      familyUuid: formData.get("familyUuid"),
      expiresInDays: formData.get("expiresInDays"),
      usageLimit: formData.get("usageLimit"),
    };

    const validatedData = createInviteSchema.parse(rawData);

    const invite = await familyInviteService.createInvite({
      ...validatedData,
      invitedBy: session.user.uuid,
    });

    revalidatePath("/families/manage");

    return {
      success: true,
      message: "초대 링크가 생성되었습니다.",
      data: {
        inviteCode: invite.inviteCode,
        expiresAt: invite.expiresAt,
      },
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: "입력 데이터가 올바르지 않습니다.",
        errors: error.issues.map((issue) => issue.message),
      };
    }

    if (error instanceof Error) {
      return {
        success: false,
        message: error.message,
      };
    }

    console.error("Error creating invite:", error);
    return {
      success: false,
      message: "초대 링크 생성 중 오류가 발생했습니다.",
    };
  }
}

/**
 * 가족 가입 신청 서버 액션
 */
export async function joinFamilyAction(
  formData: FormData
): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.uuid) {
      return {
        success: false,
        message: "로그인이 필요합니다.",
      };
    }

    const rawData = {
      inviteCode: formData.get("inviteCode"),
    };

    const validatedData = joinFamilySchema.parse(rawData);

    const result = await familyInviteService.joinFamily({
      inviteCode: validatedData.inviteCode,
      userUuid: session.user.uuid,
    });

    if (result.success) {
      revalidatePath("/families");
      if (result.memberStatus === MemberStatus.ACTIVE.code) {
        redirect("/families");
      }
    }

    return {
      success: result.success,
      message: result.message,
      data: { memberStatus: result.memberStatus },
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: "입력 데이터가 올바르지 않습니다.",
        errors: error.issues.map((issue) => issue.message),
      };
    }

    console.error("Error joining family:", error);
    return {
      success: false,
      message: "가족 가입 신청 중 오류가 발생했습니다.",
    };
  }
}

/**
 * 멤버 승인 서버 액션
 */
export async function approveMemberAction(
  formData: FormData
): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.uuid) {
      return {
        success: false,
        message: "로그인이 필요합니다.",
      };
    }

    const rawData = {
      familyUuid: formData.get("familyUuid"),
      userUuid: formData.get("userUuid"),
    };

    const validatedData = manageMemberSchema.parse(rawData);

    const result = await familyInviteService.approveMember(
      validatedData.familyUuid,
      validatedData.userUuid,
      session.user.uuid
    );

    if (result.success) {
      revalidatePath("/families/manage");
    }

    return {
      success: result.success,
      message: result.message,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: "입력 데이터가 올바르지 않습니다.",
        errors: error.issues.map((issue) => issue.message),
      };
    }

    console.error("Error approving member:", error);
    return {
      success: false,
      message: "멤버 승인 중 오류가 발생했습니다.",
    };
  }
}

/**
 * 멤버 거절 서버 액션
 */
export async function rejectMemberAction(
  formData: FormData
): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.uuid) {
      return {
        success: false,
        message: "로그인이 필요합니다.",
      };
    }

    const rawData = {
      familyUuid: formData.get("familyUuid"),
      userUuid: formData.get("userUuid"),
    };

    const validatedData = manageMemberSchema.parse(rawData);

    const result = await familyInviteService.rejectMember(
      validatedData.familyUuid,
      validatedData.userUuid,
      session.user.uuid
    );

    if (result.success) {
      revalidatePath("/families/manage");
    }

    return {
      success: result.success,
      message: result.message,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: "입력 데이터가 올바르지 않습니다.",
        errors: error.issues.map((issue) => issue.message),
      };
    }

    console.error("Error rejecting member:", error);
    return {
      success: false,
      message: "멤버 거절 중 오류가 발생했습니다.",
    };
  }
}

/**
 * 초대 링크 비활성화 서버 액션
 */
export async function deactivateInviteAction(
  formData: FormData
): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.uuid) {
      return {
        success: false,
        message: "로그인이 필요합니다.",
      };
    }

    const inviteUuid = formData.get("inviteUuid") as string;
    if (!inviteUuid) {
      return {
        success: false,
        message: "초대 UUID가 필요합니다.",
      };
    }

    const result = await familyInviteService.deactivateInvite(
      inviteUuid,
      session.user.uuid
    );

    if (result.success) {
      revalidatePath("/families/manage");
    }

    return {
      success: result.success,
      message: result.message,
    };
  } catch (error) {
    console.error("Error deactivating invite:", error);
    return {
      success: false,
      message: "초대 링크 비활성화 중 오류가 발생했습니다.",
    };
  }
}
