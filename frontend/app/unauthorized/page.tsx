'use client'

import Link from 'next/link'
import { EmptyState } from '@/components/State'

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full">
        <EmptyState
          icon="🔒"
          illustration="lock"
          title="未登录或会话过期"
          description="请重新登录后再继续操作。"
          actions={
            <Link href="/" className="btn-primary w-full">
              返回登录
            </Link>
          }
        />
      </div>
    </div>
  )
}
