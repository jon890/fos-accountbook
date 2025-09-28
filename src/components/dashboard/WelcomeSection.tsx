interface WelcomeSectionProps {
  userName?: string | null
}

export function WelcomeSection({ userName }: WelcomeSectionProps) {
  const firstName = userName?.split(' ')[0] || '사용자'
  
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">
            안녕하세요, {firstName}님! 👋
          </h2>
          <p className="text-gray-600">오늘도 알뜰한 가계 관리를 시작해보세요.</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">오늘</p>
          <p className="text-lg font-semibold text-gray-900">
            {new Date().toLocaleDateString('ko-KR', { 
              month: 'long', 
              day: 'numeric',
              weekday: 'short'
            })}
          </p>
        </div>
      </div>
    </div>
  )
}
