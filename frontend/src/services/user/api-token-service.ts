import {
  serverApiDelete,
  serverApiGet,
  serverApiPost,
} from "@/lib/server/api/client";
import {
  apiTokenListSchema,
  createdApiTokenSchema,
} from "@/lib/schemas/responses/user";
import type { ApiToken, CreatedApiToken } from "@/types/api-token";

export async function getApiTokens(): Promise<ApiToken[]> {
  return serverApiGet<ApiToken[]>("/users/me/api-tokens", {
    schema: apiTokenListSchema,
  });
}

export async function createApiToken(name: string): Promise<CreatedApiToken> {
  return serverApiPost<CreatedApiToken>(
    "/users/me/api-tokens",
    { name },
    { schema: createdApiTokenSchema }
  );
}

export async function revokeApiToken(tokenUuid: string): Promise<void> {
  await serverApiDelete<void>(`/users/me/api-tokens/${tokenUuid}`);
}
