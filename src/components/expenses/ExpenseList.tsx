import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { expenseService } from '@/container'
import { ExpenseWithCategory } from '@/repositories/interfaces/expense.repository'
import { ExpensePagination } from './ExpensePagination'

interface Category {
  id: string
  name: string
  color: string
  icon: string
}

interface ExpenseListProps {
  familyId: string
  categoryId?: string
  startDate?: string
  endDate?: string
  page?: number
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const formatAmount = (amount: string) => {
  return Number(amount).toLocaleString() + '원'
}

export async function ExpenseList({ 
  familyId, 
  categoryId,
  startDate,
  endDate,
  page = 1 
}: ExpenseListProps) {
  const filters = {
    ...(categoryId && { categoryId }),
    ...(startDate && { startDate: new Date(startDate) }),
    ...(endDate && { endDate: new Date(endDate) })
  }

  const result = await expenseService.getExpensesByFamily(familyId, {
    page,
    limit: 10,
    filters
  })

  const { data: expenses, pagination } = result

  return (
    <div className="space-y-3">
      {expenses.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-gray-500">
            <p>등록된 지출이 없습니다.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {expenses.map((expense: ExpenseWithCategory) => (
            <Card key={expense.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge 
                        variant="secondary"
                        className="text-white"
                        style={{ backgroundColor: expense.category.color }}
                      >
                        <span className="mr-1">{expense.category.icon}</span>
                        {expense.category.name}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        {formatDate(expense.date.toString())}
                      </span>
                    </div>
                    
                    {expense.description && (
                      <p className="text-gray-700 mb-1">{expense.description}</p>
                    )}
                    
                    <p className="text-xs text-gray-400">
                      {formatDate(expense.createdAt.toString())}에 추가됨
                    </p>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-lg font-semibold text-red-600">
                      -{formatAmount(expense.amount)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {/* 페이지네이션 */}
          <ExpensePagination pagination={pagination} />
        </>
      )}
    </div>
  )
}
