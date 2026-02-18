'use client'

import Link from 'next/link'
import { EmptyState } from '@/components/State'

export default function ForbiddenPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full">
        <EmptyState
          icon="⛔"
          illustration="alert"
          title="访问受限"
          description="你的账号没有权限访问该资源。"
          actions={
            <>
              <Link href="/" className="btn-secondary">
                返回登录
              </Link>
              <Link href="/account" className="btn-primary">
                查看账号
              </Link>
            </>
          }
        />
      </div>
    </div>
  )
}
