import { revalidatePath } from "next/cache";

export function revalidateTransactionPaths(): void {
  for (const path of ["/calendar", "/transactions", "/analytics", "/budget"]) {
    revalidatePath(path);
  }
}
