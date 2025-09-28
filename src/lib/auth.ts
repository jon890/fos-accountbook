import { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "./prisma"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub
      }
      return session
    },
    async signIn({ user, account, profile }) {
      // OAuth 로그인 시 계정 연결 처리
      if (account?.provider === "google") {
        try {
          // 이미 존재하는 사용자인지 확인
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email! },
            include: { accounts: true }
          })

          if (existingUser) {
            // 이미 같은 제공자로 연결된 계정이 있는지 확인
            const existingAccount = existingUser.accounts.find(
              acc => acc.provider === account.provider
            )
            
            if (!existingAccount) {
              // 새 계정을 기존 사용자와 연결
              console.log(`Linking ${account.provider} account to existing user: ${user.email}`)
            }
          }
          
          return true
        } catch (error) {
          console.error("OAuth sign-in error:", error)
          return false
        }
      }
      
      return true
    },
    async redirect({ url, baseUrl }) {
      // 로그인 후 리다이렉트 처리
      if (url.startsWith('/')) return `${baseUrl}${url}`
      if (new URL(url).origin === baseUrl) return url
      return baseUrl
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
  },
}
