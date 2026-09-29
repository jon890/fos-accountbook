import { z } from "zod";

export const InvitationTokenSchema = z.object({
  token: z.string().uuid(),
});
