export function TailwindTest() {
  return (
    <div className="p-8 space-y-6 bg-gradient-to-br from-slate-50 to-blue-50">
      <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
        Tailwind CSS v3 테스트
      </h1>
      
      {/* 기본 색상 테스트 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-blue-500 text-white rounded-2xl">
          Blue 500
        </div>
        <div className="p-4 bg-purple-600 text-white rounded-2xl">
          Purple 600
        </div>
        <div className="p-4 bg-emerald-500 text-white rounded-2xl">
          Emerald 500
        </div>
        <div className="p-4 bg-green-600 text-white rounded-2xl">
          Green 600
        </div>
      </div>
      
      {/* 그라데이션 테스트 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-6 gradient-blue-purple text-white rounded-2xl">
          <h3 className="font-semibold">Blue-Purple 그라데이션</h3>
          <p className="text-sm opacity-90">커스텀 그라데이션 클래스</p>
        </div>
        <div className="p-6 gradient-emerald-green text-white rounded-2xl">
          <h3 className="font-semibold">Emerald-Green 그라데이션</h3>
          <p className="text-sm opacity-90">커스텀 그라데이션 클래스</p>
        </div>
        <div className="p-6 gradient-purple-indigo text-white rounded-2xl">
          <h3 className="font-semibold">Purple-Indigo 그라데이션</h3>
          <p className="text-sm opacity-90">커스텀 그라데이션 클래스</p>
        </div>
      </div>
      
      {/* 글래스모피즘 테스트 */}
      <div className="relative p-8 rounded-3xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-600/20"></div>
        <div className="relative glass rounded-2xl p-6">
          <h3 className="text-xl font-semibold mb-2">글래스모피즘 효과</h3>
          <p className="text-gray-600">backdrop-blur와 반투명 배경을 사용한 현대적인 디자인</p>
        </div>
      </div>
      
      {/* 애니메이션 테스트 */}
      <div className="flex items-center justify-center space-x-8">
        <div className="w-16 h-16 bg-blue-500 rounded-2xl animate-pulse"></div>
        <div className="w-16 h-16 bg-purple-500 rounded-2xl animate-bounce"></div>
        <div className="w-16 h-16 bg-emerald-500 rounded-2xl animate-float"></div>
      </div>
      
      {/* 호버 효과 테스트 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-6 bg-white rounded-2xl shadow-lg hover-lift cursor-pointer">
          <h3 className="font-semibold mb-2">호버 리프트 효과</h3>
          <p className="text-gray-600">마우스를 올려보세요!</p>
        </div>
        <div className="p-6 bg-white rounded-2xl shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer">
          <h3 className="font-semibold mb-2">호버 스케일 효과</h3>
          <p className="text-gray-600">Tailwind 기본 클래스 사용</p>
        </div>
      </div>
      
      {/* 반응형 테스트 */}
      <div className="bg-white rounded-2xl p-6 shadow-lg">
        <h3 className="text-lg font-semibold mb-4">반응형 테스트</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
            <div
              key={num}
              className="p-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl text-center"
            >
              Item {num}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
