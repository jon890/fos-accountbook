'use client'

import { createExpenseAction, type CreateExpenseFormState } from '@/app/actions/expense-actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { useEffect } from 'react'
import { useFormState } from 'react-dom'

interface Category {
  id: string
  name: string
  color: string
  icon: string
}

interface AddExpenseFormProps {
  categories: Category[]
  onSuccess?: () => void
  onCancel?: () => void
}

const initialState: CreateExpenseFormState = {
  message: '',
  errors: {},
  success: false
}

export function AddExpenseForm({ categories, onSuccess, onCancel }: AddExpenseFormProps) {
  const { toast } = useToast()
  const [state, formAction] = useFormState(createExpenseAction, initialState)

  // 성공 시 처리
  useEffect(() => {
    if (state.success) {
      toast({
        title: '지출이 추가되었습니다',
        description: state.message
      })
      onSuccess?.()
    } else if (state.message && !state.success) {
      toast({
        title: '오류가 발생했습니다',
        description: state.message,
        variant: 'destructive'
      })
    }
  }, [state, toast, onSuccess])

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center">지출 추가</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          {/* 금액 입력 */}
          <div className="space-y-2">
            <Label htmlFor="amount">금액 *</Label>
            <div className="relative">
              <Input
                id="amount"
                name="amount"
                type="number"
                placeholder="0"
                className="text-right pr-8"
                required
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">
                원
              </span>
            </div>
            {state.errors?.amount && (
              <p className="text-sm text-red-500">{state.errors.amount[0]}</p>
            )}
          </div>

          {/* 카테고리 선택 */}
          <div className="space-y-2">
            <Label htmlFor="categoryId">카테고리 *</Label>
            <select
              id="categoryId"
              name="categoryId"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              required
            >
              <option value="">카테고리를 선택하세요</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.icon} {category.name}
                </option>
              ))}
            </select>
            {state.errors?.categoryId && (
              <p className="text-sm text-red-500">{state.errors.categoryId[0]}</p>
            )}
          </div>

          {/* 날짜 선택 */}
          <div className="space-y-2">
            <Label htmlFor="date">날짜 *</Label>
            <Input
              id="date"
              name="date"
              type="date"
              defaultValue={new Date().toISOString().split('T')[0]}
              required
            />
            {state.errors?.date && (
              <p className="text-sm text-red-500">{state.errors.date[0]}</p>
            )}
          </div>

          {/* 메모 입력 */}
          <div className="space-y-2">
            <Label htmlFor="description">메모</Label>
            <Input
              id="description"
              name="description"
              placeholder="간단한 메모를 입력하세요 (선택사항)"
            />
            {state.errors?.description && (
              <p className="text-sm text-red-500">{state.errors.description[0]}</p>
            )}
          </div>

          {/* 버튼들 */}
          <div className="flex gap-2 pt-4">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={onCancel}
              >
                취소
              </Button>
            )}
            <Button
              type="submit"
              className="flex-1"
            >
              지출 추가
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
