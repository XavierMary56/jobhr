'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from '@/lib/toast'
import { auditAPI, AuditLog } from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import Header from '@/components/Header'
import { EmptyState, LoadingState } from '@/components/State'

export default function AuditLogsPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)

  useEffect(() => {
    if (!user) {
      router.push('/')
      return
    }
    fetchLogs()
  }, [user, page, router])

  const fetchLogs = async () => {
    try {
      setLoading(true)
      const response = await auditAPI.getLogs(page, pageSize)
      setLogs(response.items)
    } catch (error: any) {
      toast.error(error.response?.data?.error || '获取审计日志失败')
    } finally {
      setLoading(false)
    }
  }

  const getActionLabel = (action: string): string => {
    const labels: Record<string, string> = {
      'candidate.list': '浏览候选人列表',
      'candidate.view': '查看候选人详情',
      'candidate.unlock': '解锁候选人联系方式',
    }
    return labels[action] || action
  }

  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleString('zh-CN')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">审计日志</h1>
          <p className="text-gray-600">查看所有操作历史记录</p>
        </div>

        {loading ? (
          <LoadingState title="加载中..." description="正在获取审计日志" illustration="audit" />
        ) : logs.length === 0 ? (
          <EmptyState
            icon="🧾"
            illustration="audit"
            title="暂无操作记录"
            description="你还没有任何操作记录"
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-300 bg-gray-100">
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      操作
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      目标类型
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      目标 ID
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      时间
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {getActionLabel(log.action)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{log.target_type}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{log.target_id}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {formatDate(log.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="mt-8 flex justify-center gap-4">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="btn-secondary disabled:opacity-50"
              >
                ← 上一页
              </button>
              <span className="px-4 py-2">第 {page} 页</span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={logs.length < pageSize}
                className="btn-secondary disabled:opacity-50"
              >
                下一页 →
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
