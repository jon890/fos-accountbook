jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));

import { revalidatePath } from "next/cache";
import { revalidateTransactionPaths } from "@/lib/server/revalidate-transaction-paths";

it("거래 변경 후 달력, 내역, 분석, 예산만 갱신한다", () => {
  jest.clearAllMocks();
  revalidateTransactionPaths();
  expect(jest.mocked(revalidatePath).mock.calls).toEqual([
    ["/calendar"], ["/transactions"], ["/analytics"], ["/budget"],
  ]);
});
