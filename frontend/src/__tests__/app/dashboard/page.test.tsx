import DashboardPage from "@/app/(authenticated)/dashboard/page";
import { redirect } from "next/navigation";

jest.mock("next/navigation", () => ({ redirect: jest.fn() }));

it("이전 대시보드 주소를 분석 화면으로 보낸다", () => {
  DashboardPage();
  expect(redirect).toHaveBeenCalledWith("/analytics");
});
