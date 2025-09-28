import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Wallet, Plus } from "lucide-react"

export function RecentActivity() {
  return (
    <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold text-gray-900">최근 활동</CardTitle>
          <Badge variant="secondary" className="bg-gray-100">0건</Badge>
        </div>
        <CardDescription>
          최근 추가된 지출 내역을 확인하세요
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-gradient-to-r from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Wallet className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">아직 지출 내역이 없습니다</h3>
          <p className="text-gray-500 mb-6">첫 번째 지출을 추가해보세요!</p>
          <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200 rounded-2xl px-8">
            <Plus className="w-5 h-5 mr-2" />
            첫 지출 추가하기
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
