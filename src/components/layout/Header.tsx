"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { LogOut, Wallet } from "lucide-react";
import { Session } from "next-auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FamilySelectorDropdown } from "@/components/families/FamilySelectorDropdown";

interface HeaderProps {
  session: Session;
}

export function Header({ session }: HeaderProps) {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-gray-200/50 shadow-sm">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 md:h-16">
      <Link
        href="/dashboard"
        className="flex items-center space-x-2 md:space-x-3 cursor-pointer hover:opacity-80 transition-opacity"
      >
            <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg">
              <Wallet className="w-4 h-4 md:w-5 md:h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base md:text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                우리집 가계부
              </h1>
            </div>
          </Link>

          <div className="flex items-center space-x-1.5 md:space-x-3">
            <FamilySelectorDropdown />
            <Avatar className="w-8 h-8 md:w-9 md:h-9 ring-2 ring-blue-100">
              <AvatarImage src={session.user?.image || ""} />
              <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold text-xs md:text-sm">
                {session.user?.name?.[0] || "U"}
              </AvatarFallback>
            </Avatar>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/auth/signout")}
              className="text-gray-600 hover:text-gray-900 h-8 w-8 md:h-9 md:w-9 p-0"
            >
              <LogOut className="w-3.5 h-3.5 md:w-4 md:h-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
