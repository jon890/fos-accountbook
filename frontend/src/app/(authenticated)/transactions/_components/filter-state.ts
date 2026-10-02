import {
  getLastNMonthsRange,
  getLastYearRange,
  getMonthRange,
} from "@/lib/utils/date-timezone";

export type QuickRange = "thisMonth" | "3months" | "1year" | "custom";

export interface FilterDraft {
  range: QuickRange;
  startDate: string;
  endDate: string;
  categoryId: string;
  amountMin: string;
  amountMax: string;
}

type ParamReader = { get(name: string): string | null };

export const ALL_CATEGORIES = "all";

export function resolveQuickRange(
  range: Exclude<QuickRange, "custom">,
  timezone: string
): { startDate: string; endDate: string } {
  if (range === "3months") return getLastNMonthsRange(timezone, 3);
  if (range === "1year") return getLastYearRange(timezone);
  return getMonthRange(timezone);
}

export function validateDateRange(startDate: string, endDate: string): string | null {
  if (!isValidDate(startDate) || !isValidDate(endDate)) {
    return "시작일과 종료일을 모두 입력해주세요";
  }
  if (startDate > endDate) {
    return "종료일은 시작일 이후여야 합니다";
  }
  return null;
}

export function validateAmountRange(amountMin: string, amountMax: string): string | null {
  const min = parseAmount(amountMin);
  const max = parseAmount(amountMax);
  if (Number.isNaN(min) || Number.isNaN(max)) {
    return "금액은 0 이상의 숫자로 입력해주세요";
  }
  if (min !== null && max !== null && min > max) {
    return "최소 금액은 최대 금액보다 클 수 없습니다";
  }
  return null;
}

export function validateFilterDraft(draft: FilterDraft): string | null {
  return (
    validateDateRange(draft.startDate, draft.endDate) ??
    validateAmountRange(draft.amountMin, draft.amountMax)
  );
}

/** 주소의 값에서 시트가 시작할 상태를 만든다. 기간이 없으면 이번 달이다. */
export function readFilterDraft(
  params: ParamReader,
  timezone: string,
  defaults: { startDate?: string; endDate?: string } = {}
): FilterDraft {
  const month = getMonthRange(timezone);
  const startDate = params.get("startDate") || defaults.startDate || month.startDate;
  const endDate = params.get("endDate") || defaults.endDate || month.endDate;

  return {
    range: detectRange(startDate, endDate, timezone),
    startDate,
    endDate,
    categoryId: params.get("categoryId") || ALL_CATEGORIES,
    amountMin: params.get("amountMin") ?? "",
    amountMax: params.get("amountMax") ?? "",
  };
}

export function resetFilterDraft(timezone: string): FilterDraft {
  const month = getMonthRange(timezone);
  return {
    range: "thisMonth",
    ...month,
    categoryId: ALL_CATEGORIES,
    amountMin: "",
    amountMax: "",
  };
}

/** 기본값과 다른 항목 수: 기간이 이번 달이 아님, 카테고리 있음, 금액 있음. */
export function countActiveFilters(draft: FilterDraft): number {
  let count = 0;
  if (draft.range !== "thisMonth") count += 1;
  if (draft.categoryId !== ALL_CATEGORIES) count += 1;
  if (draft.amountMin !== "" || draft.amountMax !== "") count += 1;
  return count;
}

/** 현재 주소의 검색어와 탭 같은 나머지 값은 그대로 두고 필터 값만 바꾼 주소를 만든다. */
export function buildFilterUrl(currentQuery: string, draft: FilterDraft): string {
  const params = new URLSearchParams(currentQuery);

  if (draft.range === "thisMonth") {
    params.delete("startDate");
    params.delete("endDate");
  } else {
    params.set("startDate", draft.startDate);
    params.set("endDate", draft.endDate);
  }

  if (draft.categoryId === ALL_CATEGORIES) {
    params.delete("categoryId");
  } else {
    params.set("categoryId", draft.categoryId);
  }

  setAmount(params, "amountMin", draft.amountMin);
  setAmount(params, "amountMax", draft.amountMax);
  params.delete("limit");

  const query = params.toString();
  return query ? `/transactions?${query}` : "/transactions";
}

function setAmount(params: URLSearchParams, key: string, value: string) {
  const amount = parseAmount(value);
  if (amount === null || Number.isNaN(amount)) {
    params.delete(key);
  } else {
    params.set(key, String(amount));
  }
}

/** 빈 값은 null, 0 이상의 유한한 숫자가 아니면 NaN. */
function parseAmount(value: string): number | null {
  if (value.trim() === "") return null;
  const amount = Number(value);
  return Number.isFinite(amount) && amount >= 0 ? amount : Number.NaN;
}

function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function detectRange(startDate: string, endDate: string, timezone: string): QuickRange {
  for (const range of ["thisMonth", "3months", "1year"] as const) {
    const resolved = resolveQuickRange(range, timezone);
    if (resolved.startDate === startDate && resolved.endDate === endDate) return range;
  }
  return "custom";
}
