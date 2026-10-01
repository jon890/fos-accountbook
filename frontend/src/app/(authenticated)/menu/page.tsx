import { getFamiliesAction } from "@/actions/family/get-families-action";
import { auth } from "@/lib/server/auth";
import { handleActionError } from "@/lib/server/action-result-handler";
import { redirect } from "next/navigation";
import { MenuPageClient } from "./_components/MenuPageClient";

export default async function MenuPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/signin");
  }

  const selectedFamilyUuid = session.user.profile?.defaultFamilyUuid;
  if (!selectedFamilyUuid) {
    redirect("/families/create");
  }

  const result = await getFamiliesAction();
  if (!result.success) {
    const isAuthError = result.error.code === "A001" || result.error.code === "A002";
    if (isAuthError) {
      handleActionError(result);
    }
    throw new Error(result.error.message);
  }

  const selectedFamily = result.data.find(
    (family) => family.uuid === selectedFamilyUuid
  );
  if (!selectedFamily) {
    redirect("/families/select");
  }

  return (
    <MenuPageClient
      familyName={selectedFamily.name}
      userName={session.user.name ?? "사용자"}
      selectedFamilyUuid={selectedFamilyUuid}
    />
  );
}
