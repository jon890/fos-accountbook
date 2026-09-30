import {
  serverApiDelete,
  serverApiGet,
  serverApiPost,
} from "@/lib/server/api/client";
import type { ApiToken, CreatedApiToken } from "@/types/api-token";

export async function getApiTokens(): Promise<ApiToken[]> {
  return serverApiGet<ApiToken[]>("/users/me/api-tokens");
}

export async function createApiToken(name: string): Promise<CreatedApiToken> {
  return serverApiPost<CreatedApiToken>("/users/me/api-tokens", { name });
}

export async function revokeApiToken(tokenUuid: string): Promise<void> {
  await serverApiDelete<void>(`/users/me/api-tokens/${tokenUuid}`);
}
