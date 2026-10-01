import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { serverEnv } from "@/lib/env/server.env";

const disallowedPaths = [
  "/calendar",
  "/transactions",
  "/analytics",
  "/budget",
  "/categories",
  "/notifications",
  "/settings",
  "/menu",
  "/families",
  "/invite",
  "/api",
  "/dashboard",
  "/expenses",
  "/auth/error",
  "/auth/signout",
];

export const dynamic = "force-dynamic";

export default async function robots(): Promise<MetadataRoute.Robots> {
  await connection();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: disallowedPaths,
    },
    sitemap: new URL("/sitemap.xml", serverEnv.AUTH_URL).toString(),
  };
}
