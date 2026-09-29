import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Providers } from "./providers";

const pretendard = localFont({
  src: "../../node_modules/pretendard/dist/web/variable/woff2/PretendardVariable.woff2",
  variable: "--font-sans",
  weight: "45 920",
  display: "swap",
});

const inter = localFont({
  src: "../../node_modules/inter-ui/variable/InterVariable.woff2",
  variable: "--font-num",
  weight: "100 900",
  display: "swap",
});

export const metadata: Metadata = {
  title: "우리집 가계부",
  description: "가족을 위한 스마트 가계부 앱",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body
        className={`${pretendard.variable} ${inter.variable} antialiased bg-bg text-fg min-h-screen`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
