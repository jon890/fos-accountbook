"use client";

import { Toaster } from "@/components/ui/sonner";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="data-theme" defaultTheme="system" enableSystem>
      <SessionProvider>
        {children}
        <Toaster
          position="top-center"
          expand={true}
          closeButton
          toastOptions={{
            classNames: {
              toast: "bg-bg-elev border border-border shadow-lg text-fg",
              title: "text-fg font-medium",
              description: "text-fg-muted",
              actionButton: "bg-brand-500 text-brand-fg",
              cancelButton: "bg-bg-muted text-fg-muted",
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
    </ThemeProvider>
  );
}
