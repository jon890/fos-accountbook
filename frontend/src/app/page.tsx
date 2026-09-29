import { type Metadata } from "next";
import { auth } from "@/lib/server/auth";
import { redirect } from "next/navigation";
import { LandingPage } from "@/components/landing/LandingPage";

export const metadata: Metadata = {
  title: "fos-accountbook — 가족과 함께 쓰는 가계부",
  description: "부부가 같이 입력하고, 한눈에 보는 가족 가계부",
  openGraph: {
    title: "fos-accountbook — 가족과 함께 쓰는 가계부",
    description: "부부가 같이 입력하고, 한눈에 보는 가족 가계부",
  },
};

export default async function Page() {
  const session = await auth();
  if (session?.user) {
    const defaultFamilyUuid = session.user.profile?.defaultFamilyUuid;
    if (!defaultFamilyUuid) {
      redirect("/families/create");
    }
    redirect("/dashboard");
  }
  return <LandingPage />;
}
