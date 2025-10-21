import { getFamilies } from "@/app/actions/family-actions";
import { SettingsPageClient } from "@/components/settings/SettingsPageClient";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
  const familiesResult = await getFamilies();

  if (!familiesResult.success || !familiesResult.data) {
    redirect("/families/create");
  }

  return <SettingsPageClient families={familiesResult.data} />;
}
