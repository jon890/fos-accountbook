import { getFamiliesAction } from "@/app/actions/family/get-families-action";
import { SettingsPageClient } from "@/components/settings/SettingsPageClient";
import { redirect } from "next/navigation";

// 쿠키를 사용하므로 동적 렌더링 필요
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const familiesResult = await getFamiliesAction();

  if (!familiesResult.success) {
    redirect("/families/create");
  }

  return <SettingsPageClient families={familiesResult.data} />;
}
