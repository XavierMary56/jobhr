'use client'

import { useEffect } from 'react'
import { EmptyState } from '@/components/State'

export default function Error({
  error,
  reset,
}: {
  error: Error
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full">
        <EmptyState
          icon="💥"
          illustration="alert"
          title="页面发生错误"
          description="请刷新页面或稍后再试。"
          actions={
            <>
              <button onClick={reset} className="btn-primary">
                重试
              </button>
              <a href="/" className="btn-secondary">
                返回登录
              </a>
            </>
          }
        />
      </div>
    </div>
  )
}
