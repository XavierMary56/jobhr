'use client'

import { useEffect, useRef, useState } from 'react'
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
    onTelegramAuth?: (user: any) => void
  }
}

export default function LoginPage() {
  const router = useRouter()
  const { setUser } = useAuthStore()
  const isInitialized = useRef(false)
  const [isWebApp, setIsWebApp] = useState(false)
  const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME

  useEffect(() => {
    if (isInitialized.current) return
    isInitialized.current = true
    const webAppAvailable = Boolean(window.Telegram?.WebApp)
    setIsWebApp(webAppAvailable)

    if (webAppAvailable) {
      window.Telegram?.WebApp?.ready()
      const initData = window.Telegram?.WebApp?.initDataUnsafe
      if (initData?.user) {
        handleTelegramLogin(initData)
      }
    }
  }, [])

  const handleTelegramLogin = async (telegramData: any) => {
    try {
      const isWebAppData = Boolean(telegramData?.user)
      const authData: TelegramAuthData = isWebAppData
        ? {
            id: telegramData.user.id,
            first_name: telegramData.user.first_name,
            last_name: telegramData.user.last_name || '',
            username: telegramData.user.username || '',
            photo_url: telegramData.user.photo_url || '',
            auth_date: telegramData.auth_date,
            hash: window.Telegram?.WebApp?.initData?.split('hash=')[1] || '',
          }
        : {
            id: telegramData.id,
            first_name: telegramData.first_name,
            last_name: telegramData.last_name || '',
            username: telegramData.username || '',
            photo_url: telegramData.photo_url || '',
            auth_date: telegramData.auth_date,
            hash: telegramData.hash || '',
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

  const handleLoginClick = async () => {
    if (window.Telegram?.WebApp?.initDataUnsafe?.user) {
      await handleTelegramLogin(window.Telegram.WebApp.initDataUnsafe)
      return
    }
    toast.info('请在 Telegram 中打开此链接')
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
            onClick={handleLoginClick}
            className="btn-primary w-full"
          >
            使用 Telegram 登录
          </button>

          {!isWebApp && botUsername && (
            <a
              href={`https://t.me/${botUsername}`}
              className="btn-secondary w-full text-center"
            >
              打开 Telegram 机器人
            </a>
          )}

          <p className="text-xs text-center text-gray-500 mt-4">
            请在 Telegram 中打开此链接以登录
          </p>
        </div>
      </div>
    </div>
  )
}
