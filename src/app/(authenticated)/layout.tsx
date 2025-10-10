/**
 * Authenticated Layout
 * 
 * 인증이 필요한 모든 페이지를 감싸는 Layout입니다.
 * 로그인하지 않은 사용자는 자동으로 로그인 페이지로 리다이렉트됩니다.
 */

import { auth } from "@/lib/server/auth"
import { redirect } from "next/navigation"
import { ReactNode } from "react"

interface AuthenticatedLayoutProps {
  children: ReactNode
}

export default async function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  // 모든 하위 페이지에서 자동으로 세션 체크
  const session = await auth()

  // 로그인하지 않은 경우 로그인 페이지로 리다이렉트
  if (!session?.user) {
    redirect('/auth/signin')
  }

  // 인증된 사용자만 하위 페이지에 접근 가능
  return <>{children}</>
}

