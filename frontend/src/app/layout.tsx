import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { connection } from "next/server";
import "./globals.css";
import { Providers } from "./providers";
import { serverEnv } from "@/lib/env/server.env";
import { BRAND_COLOR_HEX } from "@/lib/utils/brand";


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

export async function generateMetadata(): Promise<Metadata> {
  await connection();

  return {
    metadataBase: new URL(serverEnv.AUTH_URL),
    title: {
      default: "우리집 가계부",
      template: "%s | 우리집 가계부",
    },
    description: "가족을 위한 스마트 가계부 앱",
    applicationName: "우리집 가계부",
    openGraph: {
      siteName: "우리집 가계부",
      locale: "ko_KR",
      type: "website",
      url: "/",
    },
    twitter: {
      card: "summary_large_image",
    },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  maximumScale: 1,
  themeColor: BRAND_COLOR_HEX,
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
