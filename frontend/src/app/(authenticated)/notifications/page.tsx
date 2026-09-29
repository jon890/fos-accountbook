import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/lib/server/auth";
import { getSelectedFamilyUuid } from "@/lib/server/auth/auth-helpers";
import { getNotificationsAction } from "@/actions/notification/get-notifications-action";
import { NotificationsClient } from "./_components/NotificationsClient";

const FilterSchema = z.enum(["all", "unread"]).default("all");

interface NotificationsPageProps {
  searchParams: Promise<{ filter?: string | string[] }>;
}

export default async function NotificationsPage({
  searchParams,
}: NotificationsPageProps) {
  const session = await auth();
  if (!session) redirect("/auth/signin");

  const familyUuid = await getSelectedFamilyUuid();
  if (!familyUuid) redirect("/");

  const raw = await searchParams;
  // Zod 런타임 검증 (ADR-F06) — 잘못된 값은 default "all"
  const filter = FilterSchema.catch("all").parse(
    Array.isArray(raw.filter) ? raw.filter[0] : raw.filter
  );

  const result = await getNotificationsAction(familyUuid);
  const notifications = result.success ? result.data.notifications : [];

  return (
    <NotificationsClient
      familyUuid={familyUuid}
      notifications={notifications}
      filter={filter}
    />
  );
}
