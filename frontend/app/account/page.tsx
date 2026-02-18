'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import { accountAPI, MeResponse } from '@/lib/api'
import { toast } from '@/lib/toast'
import { useAuthStore } from '@/lib/store'
import { EmptyState, LoadingState } from '@/components/State'

export default function AccountPage() {
  const router = useRouter()
  const { user, setUser } = useAuthStore()
  const [data, setData] = useState<MeResponse | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchMe()
  }, [router, setUser])

  const fetchMe = async () => {
    try {
      setLoading(true)
      const response = await accountAPI.getMe()
      setUser({
        hrUserID: response.user.id,
        companyID: response.user.company_id,
        status: response.user.status as 'active' | 'pending' | 'blocked',
        role: response.user.role,
      })
      setData(response)
    } catch (error: any) {
      toast.error(error.response?.data?.error || '获取账号信息失败')
      router.push('/')
    } finally {
      setLoading(false)
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return '已激活'
      case 'pending':
        return '待审核'
      case 'blocked':
        return '已禁用'
      default:
        return status
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-amber-100 text-amber-800'
      case 'blocked':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">账号资料</h1>
          <p className="text-gray-600">查看当前账号与配额信息</p>
        </div>

        {loading ? (
          <LoadingState title="加载中..." description="正在获取账号信息" illustration="profile" />
        ) : !data ? (
          <EmptyState
            icon="👤"
            illustration="profile"
            title="暂无账号信息"
            description="请稍后再试或联系管理员"
          />
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            <div className="card">
              <h2 className="text-xl font-bold text-gray-900 mb-4">个人信息</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500">用户 ID</span>
                  <span className="font-medium text-gray-900">{data.user.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">显示名</span>
                  <span className="font-medium text-gray-900">{data.user.display_name || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Telegram</span>
                  <span className="font-medium text-gray-900">{data.user.tg_username || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">角色</span>
                  <span className="font-medium text-gray-900">{data.user.role}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">状态</span>
                  <span className={`px-2 py-1 rounded text-sm ${getStatusColor(data.user.status)}`}>
                    {getStatusLabel(data.user.status)}
                  </span>
                </div>
              </div>
            </div>

            <div className="card">
              <h2 className="text-xl font-bold text-gray-900 mb-4">公司信息</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500">公司 ID</span>
                  <span className="font-medium text-gray-900">{data.company.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">公司名称</span>
                  <span className="font-medium text-gray-900">{data.company.name || '-'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">公司状态</span>
                  <span className={`px-2 py-1 rounded text-sm ${getStatusColor(data.company.status)}`}>
                    {getStatusLabel(data.company.status)}
                  </span>
                </div>
              </div>
            </div>

            <div className="card md:col-span-2">
              <h2 className="text-xl font-bold text-gray-900 mb-4">解锁配额</h2>
              {!data.quota.configured ? (
                <div className="text-gray-600">
                  配额尚未配置，请联系管理员。
                </div>
              ) : (
                <>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600">总配额</p>
                      <p className="text-2xl font-bold text-blue-700">{data.quota.unlock_quota_total}</p>
                    </div>
                    <div className="bg-amber-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600">已使用</p>
                      <p className="text-2xl font-bold text-amber-700">{data.quota.unlock_quota_used}</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600">剩余</p>
                      <p className="text-2xl font-bold text-green-700">{data.quota.unlock_quota_remaining}</p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span>使用进度</span>
                      <span>{data.quota.unlock_quota_used}/{data.quota.unlock_quota_total}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-blue-600 h-3 rounded-full"
                        style={{
                          width: data.quota.unlock_quota_total > 0
                            ? `${Math.min(100, (data.quota.unlock_quota_used / data.quota.unlock_quota_total) * 100)}%`
                            : '0%'
                        }}
                      />
                    </div>
                  </div>

                  <div className="mt-4 text-sm text-gray-600">
                    配额周期：{data.quota.period_start || '-'} ~ {data.quota.period_end || '-'}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
