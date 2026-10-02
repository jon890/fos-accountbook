const LIST_LIMIT_STEP = 300;
export const MAX_LIST_LIMIT = 3000;

export function parseListLimit(raw: string | undefined): number {
  if (!raw || !/^\d+$/.test(raw)) {
    return LIST_LIMIT_STEP;
  }

  const limit = Number(raw);
  if (limit < LIST_LIMIT_STEP || limit % LIST_LIMIT_STEP !== 0) {
    return LIST_LIMIT_STEP;
  }

  return Math.min(limit, MAX_LIST_LIMIT);
}
