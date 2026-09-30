import { z } from "zod";

export const InvitationTokenSchema = z.object({
  token: z.string().uuid(),
});

export const InvitationUuidSchema = z.object({
  invitationUuid: z.string().uuid(),
});
