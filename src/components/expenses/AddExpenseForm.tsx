'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'

const addExpenseSchema = z.object({
  amount: z.string().min(1, '금액을 입력해주세요').refine(
    (val) => !isNaN(Number(val)) && Number(val) > 0,
    '올바른 금액을 입력해주세요'
  ),
  description: z.string().optional(),
  categoryId: z.string().min(1, '카테고리를 선택해주세요'),
  date: z.string().min(1, '날짜를 선택해주세요')
})

type AddExpenseFormData = z.infer<typeof addExpenseSchema>

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

export function AddExpenseForm({ categories, onSuccess, onCancel }: AddExpenseFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset
  } = useForm<AddExpenseFormData>({
    resolver: zodResolver(addExpenseSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0] // 오늘 날짜를 기본값으로
    }
  })

  const selectedCategoryId = watch('categoryId')
  const selectedCategory = categories.find(cat => cat.id === selectedCategoryId)

  const onSubmit = async (data: AddExpenseFormData) => {
    setIsSubmitting(true)
    
    try {
      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: Number(data.amount),
          description: data.description,
          categoryId: data.categoryId,
          date: data.date
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '지출 추가에 실패했습니다')
      }

      toast({
        title: '지출이 추가되었습니다',
        description: `${Number(data.amount).toLocaleString()}원이 ${selectedCategory?.name} 카테고리에 추가되었습니다.`
      })

      reset()
      onSuccess?.()
    } catch (error) {
      console.error('Add expense error:', error)
      toast({
        title: '오류가 발생했습니다',
        description: error instanceof Error ? error.message : '지출 추가에 실패했습니다',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center">지출 추가</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* 금액 입력 */}
          <div className="space-y-2">
            <Label htmlFor="amount">금액 *</Label>
            <div className="relative">
              <Input
                id="amount"
                type="number"
                placeholder="0"
                className="text-right pr-8"
                {...register('amount')}
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">
                원
              </span>
            </div>
            {errors.amount && (
              <p className="text-sm text-red-500">{errors.amount.message}</p>
            )}
          </div>

          {/* 카테고리 선택 */}
          <div className="space-y-2">
            <Label>카테고리 *</Label>
            <Select onValueChange={(value) => setValue('categoryId', value)}>
              <SelectTrigger>
                <SelectValue placeholder="카테고리를 선택하세요">
                  {selectedCategory && (
                    <div className="flex items-center gap-2">
                      <span>{selectedCategory.icon}</span>
                      <span>{selectedCategory.name}</span>
                    </div>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    <div className="flex items-center gap-2">
                      <span>{category.icon}</span>
                      <span>{category.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.categoryId && (
              <p className="text-sm text-red-500">{errors.categoryId.message}</p>
            )}
          </div>

          {/* 날짜 선택 */}
          <div className="space-y-2">
            <Label htmlFor="date">날짜 *</Label>
            <Input
              id="date"
              type="date"
              {...register('date')}
            />
            {errors.date && (
              <p className="text-sm text-red-500">{errors.date.message}</p>
            )}
          </div>

          {/* 메모 입력 */}
          <div className="space-y-2">
            <Label htmlFor="description">메모</Label>
            <Input
              id="description"
              placeholder="간단한 메모를 입력하세요 (선택사항)"
              {...register('description')}
            />
          </div>

          {/* 버튼들 */}
          <div className="flex gap-2 pt-4">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                취소
              </Button>
            )}
            <Button
              type="submit"
              className="flex-1"
              disabled={isSubmitting}
            >
              {isSubmitting ? '추가 중...' : '지출 추가'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
