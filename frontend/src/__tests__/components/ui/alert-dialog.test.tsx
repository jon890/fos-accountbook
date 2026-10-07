import { render, screen } from "@testing-library/react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/client/utils";

test.each([undefined, "destructive"] as const)("확인 버튼에 variant=%s의 클래스를 적용한다", (variant) => {
  render(
    <AlertDialog open>
      <AlertDialogContent>
        <AlertDialogTitle>삭제 확인</AlertDialogTitle>
        <AlertDialogDescription>항목을 삭제합니다.</AlertDialogDescription>
        <AlertDialogAction variant={variant}>확인</AlertDialogAction>
      </AlertDialogContent>
    </AlertDialog>,
  );
  const expected = cn(variant ? buttonVariants({ variant }) : buttonVariants());
  expect(screen.getByRole("button", { name: "확인" })).toHaveClass(...expected.split(" "));
});
