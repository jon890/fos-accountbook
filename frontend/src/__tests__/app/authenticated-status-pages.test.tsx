import { render, screen } from "@testing-library/react";
import AuthenticatedError from "@/app/(authenticated)/error";
import AuthenticatedNotFound from "@/app/(authenticated)/not-found";
import AuthenticatedForbidden from "@/app/(authenticated)/forbidden";

it.each([
  ["오류", <AuthenticatedError key="error" error={new Error("실패")} reset={jest.fn()} />],
  ["404", <AuthenticatedNotFound key="not-found" />],
  ["403", <AuthenticatedForbidden key="forbidden" />],
])("인증된 %s 화면의 홈 링크는 달력을 연다", (_, element) => {
  render(element);
  expect(screen.getByRole("link", { name: "홈으로" })).toHaveAttribute("href", "/calendar");
});
