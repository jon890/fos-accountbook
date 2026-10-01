import { redirect } from "next/navigation";
import { getCalendarMonthAction } from "@/actions/calendar/get-calendar-month-action";
import { CalendarHome } from "@/components/calendar/CalendarHome";
import { auth } from "@/lib/server/auth";
import { handleActionError } from "@/lib/server/action-result-handler";
import { getDatePartsInTimezone } from "@/lib/utils/date-timezone";
import { ErrorCode } from "@/lib/errors";

interface CalendarPageProps {
  searchParams: Promise<{ month?: string | string[]; date?: string | string[] }>;
}

export default async function CalendarPage({ searchParams }: CalendarPageProps) {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/signin");
  }
  const familyUuid = session.user.profile?.defaultFamilyUuid;
  if (!familyUuid) {
    redirect("/families/create");
  }
  const today = getDatePartsInTimezone(session.user.profile?.timezone);
  const params = await searchParams;
  let year = today.year;
  let month = today.month;
  if (typeof params.month === "string" && /^\d{4}-\d{2}$/.test(params.month)) {
    const [requestedYear, requestedMonth] = params.month.split("-").map(Number);
    const validYear = requestedYear >= 2000 && requestedYear <= 2100;
    const validMonth = requestedMonth >= 1 && requestedMonth <= 12;
    if (validYear && validMonth) {
      year = requestedYear;
      month = requestedMonth;
    }
  }

  const monthString = `${year}-${String(month).padStart(2, "0")}`;
  const isCurrentMonth = year === today.year && month === today.month;
  let initialDate = isCurrentMonth ? today.date : `${monthString}-01`;
  if (typeof params.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(params.date)) {
    const [dateYear, dateMonth, dateDay] = params.date.split("-").map(Number);
    const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
    const belongsToMonth = dateYear === year && dateMonth === month;
    const validDay = dateDay >= 1 && dateDay <= daysInMonth;
    if (belongsToMonth && validDay) {
      initialDate = params.date;
    }
  }

  const result = await getCalendarMonthAction(year, month);
  if (!result.success) {
    const invalidFamily = result.error.code === ErrorCode.FAMILY_NOT_FOUND
      || result.error.code === ErrorCode.NOT_FAMILY_MEMBER;
    if (invalidFamily) {
      redirect("/families/select");
    }
    const isAuthError = result.error.code === "A001" || result.error.code === "A002";
    if (isAuthError) {
      handleActionError(result);
    }
    throw new Error(result.error.message);
  }

  return (
    <CalendarHome
      data={result.data}
      initialDate={initialDate}
      today={today.date}
      familyUuid={familyUuid}
    />
  );
}
