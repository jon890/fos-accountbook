import { z } from "zod";

/**
 * 백엔드 응답 공용 조각 (ADR-F42)
 */

export const uuidString = z.string().min(1);

export const isoDateString = z.string().min(1);

/** `PaginationResponse<T>` 와 같은 모양 */
export const paginationSchema = <T extends z.ZodType>(itemSchema: T) =>
  z.object({
    items: z.array(itemSchema),
    totalElements: z.number(),
    totalPages: z.number(),
    currentPage: z.number(),
  });
