'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from '@/lib/toast'
import { authAPI, TelegramAuthData } from '@/lib/api'
import { useAuthStore } from '@/lib/store'

declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        initData: string
        initDataUnsafe: {
          user?: {
            id: number
            first_name: string
            last_name?: string
            username?: string
            photo_url?: string
          }
          auth_date: number
        }
        ready: () => void
        close: () => void
      }
    }
  }
}

export default function LoginPage() {
  const router = useRouter()
  const { setUser } = useAuthStore()
  const isInitialized = useRef(false)

  useEffect(() => {
    if (isInitialized.current) return
    isInitialized.current = true

    // Load Telegram Web App Script
    const script = document.createElement('script')
    script.src = 'https://telegram.org/js/telegram-web-app.js'
    document.body.appendChild(script)

    script.onload = () => {
      if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.ready()
        const initData = window.Telegram.WebApp.initDataUnsafe
        if (initData?.user) {
          handleTelegramLogin(initData)
        }
      }
    }
  }, [])

  const handleTelegramLogin = async (telegramData: any) => {
    try {
      const authData: TelegramAuthData = {
        id: telegramData.user.id,
        first_name: telegramData.user.first_name,
        last_name: telegramData.user.last_name || '',
        username: telegramData.user.username || '',
        photo_url: telegramData.user.photo_url || '',
        auth_date: telegramData.auth_date,
        hash: window.Telegram?.WebApp?.initData?.split('hash=')[1] || '',
      }

      const response = await authAPI.telegramLogin(authData)

      if (response.success) {
        // Store token and user info
        setUser({
          hrUserID: response.user_id,
          companyID: 0, // Will be set from response in production
          status: response.status as 'active' | 'pending' | 'blocked',
          role: 'recruiter',
        })

        toast.success('登录成功！')
        
        if (response.status === 'pending') {
          toast.info('你的账户待审批，请等待管理员审核')
          router.push('/waiting-approval')
        } else {
          router.push('/candidates')
        }
      } else {
        toast.error('登录失败')
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || '登录失败，请重试')
    }
  }

  const handleTestLogin = async () => {
    // 测试模式：模拟 Telegram 登录数据
    console.log('API Base URL:', process.env.NEXT_PUBLIC_API_URL)
    
    const testTelegramData = {
      user: {
        id: 123456789,
        first_name: 'Test',
        last_name: 'User',
        username: 'testuser',
        photo_url: '',
      },
      auth_date: Math.floor(Date.now() / 1000),
    }
    
    console.log('开始测试登录...', testTelegramData)
    
    try {
      await handleTelegramLogin(testTelegramData)
    } catch (error) {
      console.error('登录错误:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">TG HR Platform</h1>
          <p className="text-gray-600">Telegram 快速登录</p>
        </div>

        <div className="space-y-4">
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
            <p className="text-sm text-gray-700">
              点击下方按钮使用 Telegram 登录
            </p>
          </div>

          <button
            onClick={() => {
              console.log('按钮被点击了')
              if (window.Telegram?.WebApp) {
                console.log('在 Telegram 中运行')
                window.Telegram.WebApp.close()
              } else {
                console.log('不在 Telegram 中，显示提示')
                toast.info('请在 Telegram 中打开此链接')
              }
            }}
            className="btn-primary w-full"
          >
            📱 使用 Telegram 登录
          </button>

          {/* 开发测试按钮 */}
          <button
            onClick={handleTestLogin}
            className="btn-secondary w-full text-sm"
          >
            🧪 测试模式登录（开发用）
          </button>

          {/* 调试信息 */}
          <div className="mt-4 p-3 bg-gray-100 rounded text-xs text-gray-600">
            <div><strong>API URL:</strong> {process.env.NEXT_PUBLIC_API_URL || '未配置'}</div>
            <div><strong>登录端点:</strong> POST /auth/telegram/login</div>
          </div>

          <p className="text-xs text-center text-gray-500 mt-4">
            在 Telegram 中打开此链接以登录
          </p>
        </div>
      </div>
    </div>
  )
}
