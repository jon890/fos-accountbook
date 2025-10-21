"use client";

import { Session } from "next-auth";
import { useSession } from "next-auth/react";
import { BottomNavigation } from "./BottomNavigation";
import { Header } from "./Header";

interface AppLayoutProps {
  children: React.ReactNode;
  initialSession: Session;
}

export function AppLayout({ children, initialSession }: AppLayoutProps) {
  const { data: session } = useSession();
  const currentSession = session || initialSession;

  return (
    <div
      className="min-h-screen"
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #f8fafc 0%, rgba(59, 130, 246, 0.1) 50%, rgba(99, 102, 241, 0.1) 100%)",
      }}
    >
      <Header session={currentSession} />

      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 md:py-6 pb-20 md:pb-24">
        {children}
      </main>

      <BottomNavigation />
    </div>
  );
}
