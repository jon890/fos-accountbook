import { z } from "zod";

export const CreateApiTokenSchema = z.object({
  name: z.string().trim().min(1).max(50),
});

export const ApiTokenUuidSchema = z.object({
  tokenUuid: z.string().uuid(),
});
