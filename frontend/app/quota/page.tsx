'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'
import { SUPPORT_CONFIG } from '@/lib/constants'
import { EmptyState } from '@/components/State'

export default function QuotaPage() {
  const searchParams = useSearchParams()
  const reason = searchParams.get('reason')
  const returnTo = searchParams.get('return') || '/candidates'

  const title = reason === 'not_configured'
    ? '配额未配置'
    : '配额不足'

  const description = reason === 'not_configured'
    ? '当前公司尚未配置解锁配额，请联系管理员进行配置。'
    : '当前配额已用完，请联系管理员升级或续费。'

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container py-12">
        <div className="max-w-2xl mx-auto">
          <EmptyState
            icon={reason === 'not_configured' ? '🧩' : '🎫'}
            illustration={reason === 'not_configured' ? 'profile' : 'quota'}
            title={title}
            description={description}
            actions={
              <>
                <Link href="/account" className="btn-primary">
                  前往账号资料
                </Link>
                <a
                  href={`mailto:${SUPPORT_CONFIG.EMAIL}?subject=配额问题咨询`}
                  className="btn-secondary"
                >
                  联系管理员
                </a>
                <Link href={returnTo} className="btn-secondary">
                  返回上一页
                </Link>
              </>
            }
          />
          <div className="mt-6 bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
            <p className="text-sm text-gray-700">
              你可以前往账号资料页面查看当前配额使用情况。
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
