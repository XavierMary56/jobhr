'use client'

import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'

export default function WaitingApprovalPage() {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)

  if (user?.status === 'active') {
    router.push('/candidates')
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-amber-100 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full text-center">
        <div className="text-6xl mb-4">⏳</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          账户待审批
        </h1>
        <p className="text-gray-600 mb-6">
          你的账户已创建，但需要管理员审核后才能使用。
          请稍候，我们会尽快处理你的申请。
        </p>
        <button
          onClick={() => useAuthStore.getState().logout()}
          className="btn-secondary w-full"
        >
          返回登录
        </button>
      </div>
    </div>
  )
}
