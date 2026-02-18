import Link from 'next/link'
import { EmptyState } from '@/components/State'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full">
        <EmptyState
          icon="🧭"
          illustration="compass"
          title="页面不存在"
          description="你访问的页面不存在或已被移除。"
          actions={
            <Link href="/candidates" className="btn-primary w-full">
              返回候选人列表
            </Link>
          }
        />
      </div>
    </div>
  )
}
