import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { serverEnv } from "@/lib/env/server.env";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connection();

  const baseUrl = new URL(serverEnv.AUTH_URL);

  return [
    { url: new URL("/", baseUrl).toString() },
    { url: new URL("/auth/signin", baseUrl).toString() },
  ];
}
