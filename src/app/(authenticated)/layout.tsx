/**
 * Authenticated Layout
 *
 * 인증이 필요한 모든 페이지를 감싸는 Layout입니다.
 * 로그인하지 않은 사용자는 자동으로 로그인 페이지로 리다이렉트됩니다.
 */

import { AppLayout } from "@/components/layout/AppLayout";
import { auth } from "@/lib/server/auth";
import { redirect } from "next/navigation";
import { ReactNode } from "react";

interface AuthenticatedLayoutProps {
  children: ReactNode;
}

export default async function AuthenticatedLayout({
  children,
}: AuthenticatedLayoutProps) {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/signin");
  }

  return <AppLayout initialSession={session}>{children}</AppLayout>;
}
