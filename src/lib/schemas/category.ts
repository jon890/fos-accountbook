import { z } from "zod";

export const createCategorySchema = z.object({
  name: z.string().min(1, "이름은 필수입니다").trim(),
  color: z.string().optional(),
  icon: z.string().optional(),
  excludeFromBudget: z.boolean().optional(),
});

export const updateCategorySchema = z
  .object({
    name: z.string().min(1, "이름은 필수입니다").trim().optional(),
    color: z.string().optional(),
    icon: z.string().optional(),
    excludeFromBudget: z.boolean().optional(),
  })
  .refine(
    (data) => {
      return (
        data.name !== undefined ||
        data.color !== undefined ||
        data.icon !== undefined ||
        data.excludeFromBudget !== undefined
      );
    },
    {
      message: "수정할 항목이 없습니다",
      path: [], // root error
    }
  );
