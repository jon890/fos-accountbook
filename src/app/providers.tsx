"use client";

import { Toaster } from "@/components/ui/sonner";
import { SessionProvider } from "next-auth/react";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <Toaster
        position="top-center"
        expand={true}
        richColors
        closeButton
        toastOptions={{
          classNames: {
            toast: "bg-white border border-gray-200 shadow-lg",
            title: "text-gray-900 font-medium",
            description: "text-gray-600",
            success: "bg-green-50 border-green-200 text-green-900",
            error: "bg-red-50 border-red-200 text-red-900",
            warning: "bg-yellow-50 border-yellow-200 text-yellow-900",
            info: "bg-blue-50 border-blue-200 text-blue-900",
          },
          style: {
            zIndex: 100,
          },
        }}
        style={{
          zIndex: 100,
        }}
      />
    </SessionProvider>
  );
}
