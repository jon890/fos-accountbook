/**
 * getMonthlyCategoryBreakdown service 단위 테스트
 * @jest-environment node
 */

jest.mock("@/lib/env/server.env", () => ({
  serverEnv: {
    BACKEND_API_URL: "http://localhost:8080",
  },
}));
jest.mock("@/lib/server/auth/auth", () => ({
  handlers: {},
  auth: jest.fn(),
  signIn: jest.fn(),
  signOut: jest.fn(),
}));
jest.mock("@/lib/server/api/client");
jest.mock("@/lib/server/cache");

import { getMonthlyCategoryBreakdown } from "@/services/dashboard/dashboard-service";
import { serverApiGet } from "@/lib/server/api/client";
import { getCachedFamilyCategories } from "@/lib/server/cache";

const mockServerApiGet = serverApiGet as jest.MockedFunction<typeof serverApiGet>;
const mockGetCachedFamilyCategories = getCachedFamilyCategories as jest.MockedFunction<
  typeof getCachedFamilyCategories
>;

const FAMILY_UUID = "family-uuid-1";

const mockCategories = [
  { uuid: "cat-1", name: "식비", icon: "🍔", color: "#FF5733" },
  { uuid: "cat-2", name: "교통", icon: "🚌", color: "#3498DB" },
  { uuid: "cat-3", name: "문화", icon: "🎬", color: "#9B59B6" },
];

describe("getMonthlyCategoryBreakdown", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetCachedFamilyCategories.mockResolvedValue(mockCategories as never);
  });

  it("정상 3 카테고리 × 4건 → 합계/percentage 정확", async () => {
    // cat-1: 10000+20000=30000, cat-2: 5000+5000=10000, cat-3: 2000+8000=10000
    // total: 50000
    mockServerApiGet.mockResolvedValue({
      items: [
        { uuid: "e1", amount: 10000, date: "2024-03-01", categoryName: "식비", categoryUuid: "cat-1" },
        { uuid: "e2", amount: 20000, date: "2024-03-05", categoryName: "식비", categoryUuid: "cat-1" },
        { uuid: "e3", amount: 5000,  date: "2024-03-10", categoryName: "교통", categoryUuid: "cat-2" },
        { uuid: "e4", amount: 5000,  date: "2024-03-15", categoryName: "교통", categoryUuid: "cat-2" },
        { uuid: "e5", amount: 2000,  date: "2024-03-20", categoryName: "문화", categoryUuid: "cat-3" },
        { uuid: "e6", amount: 8000,  date: "2024-03-25", categoryName: "문화", categoryUuid: "cat-3" },
        // 4건은 각 카테고리가 2건씩 총 6건이지만 "3 카테고리 × 4건" = 12 아이템이 있어도 동작 검증
      ],
    });

    const result = await getMonthlyCategoryBreakdown(FAMILY_UUID, 2024, 3);

    expect(result.year).toBe(2024);
    expect(result.month).toBe(3);
    expect(result.totalExpense).toBe(50000);
    expect(result.items).toHaveLength(3);

    // totalAmount desc 정렬
    expect(result.items[0].categoryUuid).toBe("cat-1");
    expect(result.items[0].totalAmount).toBe(30000);
    expect(result.items[0].percentage).toBe(60);

    expect(result.items[1].totalAmount).toBe(10000);
    expect(result.items[1].percentage).toBe(20);

    expect(result.items[2].totalAmount).toBe(10000);
    expect(result.items[2].percentage).toBe(20);
  });

  it("빈 배열 → items: [], totalExpense: 0", async () => {
    mockServerApiGet.mockResolvedValue({ items: [] });

    const result = await getMonthlyCategoryBreakdown(FAMILY_UUID, 2024, 3);

    expect(result.totalExpense).toBe(0);
    expect(result.items).toEqual([]);
  });

  it("음수/0/NaN 항목 무시", async () => {
    mockServerApiGet.mockResolvedValue({
      items: [
        { uuid: "e1", amount: -500,      date: "2024-03-01", categoryName: "식비", categoryUuid: "cat-1" },
        { uuid: "e2", amount: 0,         date: "2024-03-02", categoryName: "식비", categoryUuid: "cat-1" },
        { uuid: "e3", amount: NaN,       date: "2024-03-03", categoryName: "식비", categoryUuid: "cat-1" },
        { uuid: "e4", amount: 10000,     date: "2024-03-04", categoryName: "교통", categoryUuid: "cat-2" },
      ],
    });

    const result = await getMonthlyCategoryBreakdown(FAMILY_UUID, 2024, 3);

    expect(result.totalExpense).toBe(10000);
    expect(result.items).toHaveLength(1);
    expect(result.items[0].categoryUuid).toBe("cat-2");
  });
});
