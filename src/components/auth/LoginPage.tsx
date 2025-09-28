'use client'

import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Wallet, PiggyBank, BarChart3, Users } from "lucide-react"

export function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-indigo-400/20 to-pink-600/20 rounded-full blur-3xl"></div>
        </div>
        
        <Card className="relative backdrop-blur-sm bg-white/80 shadow-2xl border-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-white/30"></div>
          
          <CardHeader className="relative text-center space-y-6 pt-8 pb-6">
            <div className="mx-auto relative">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl">
                <Wallet className="w-10 h-10 text-white" />
              </div>
              <div className="absolute inset-0 w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl animate-pulse opacity-20"></div>
            </div>
            
            <div className="space-y-2">
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                우리집 가계부
              </CardTitle>
              <CardDescription className="text-gray-600 text-base">
                가족과 함께 관리하는 스마트 가계부
              </CardDescription>
            </div>
          </CardHeader>
          
          <CardContent className="relative space-y-6 px-8 pb-8">
            <div className="space-y-4">
              <Button 
                onClick={() => signIn('google')} 
                className="w-full h-14 text-base font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200 rounded-2xl"
                size="lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-bold text-sm">G</span>
                  </div>
                  <span>Google로 시작하기</span>
                </div>
              </Button>
              
              <div className="flex items-center space-x-4">
                <Separator className="flex-1" />
                <span className="text-xs text-gray-400 font-medium">안전한 로그인</span>
                <Separator className="flex-1" />
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4 pt-2">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto">
                  <PiggyBank className="w-6 h-6 text-blue-600" />
                </div>
                <p className="text-xs text-gray-600">스마트 절약</p>
              </div>
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center mx-auto">
                  <BarChart3 className="w-6 h-6 text-green-600" />
                </div>
                <p className="text-xs text-gray-600">실시간 분석</p>
              </div>
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
                <p className="text-xs text-gray-600">가족 공유</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
