/**
 * 카테고리 관련 타입
 */

import {
  createCategorySchema,
  updateCategorySchema,
} from "@/lib/schemas/category";
import z from "zod";

/**
 * 카테고리 응답
 */
export interface CategoryResponse {
  uuid: string;
  familyUuid: string;
  name: string;
  icon?: string;
  color?: string;
  excludeFromBudget?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
