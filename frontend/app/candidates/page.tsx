'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from '@/lib/toast'
import { candidateAPI, CandidateListParams, Candidate } from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import Header from '@/components/Header'
import CandidateCard from '@/components/CandidateCard'
import FilterBar from '@/components/FilterBar'
import { EmptyState, LoadingState } from '@/components/State'

export default function CandidatesPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState<CandidateListParams>({
    page: 1,
    page_size: 20,
  })

  useEffect(() => {
    if (!user) {
      router.push('/')
      return
    }
    fetchCandidates()
  }, [user, filters, router])

  const fetchCandidates = async () => {
    try {
      setLoading(true)
      const response = await candidateAPI.list(filters)
      setCandidates(response.items)
    } catch (error: any) {
      toast.error(error.response?.data?.error || '获取候选人列表失败')
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (newFilters: Partial<CandidateListParams>) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
      page: 1,
    }))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">候选人列表</h1>
          <p className="text-gray-600">浏览并发现最适合的候选人</p>
        </div>

        <FilterBar onFilterChange={handleFilterChange} />

        {loading ? (
          <LoadingState title="加载中..." description="正在获取候选人列表" illustration="list" />
        ) : candidates.length === 0 ? (
          <EmptyState
            icon="🔎"
            illustration="list"
            title="未找到匹配的候选人"
            description="尝试调整筛选条件或清除筛选"
            actions={
              <button
                onClick={() => setFilters({ page: 1, page_size: 20 })}
                className="btn-secondary"
              >
                清除筛选
              </button>
            }
          />
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {candidates.map((candidate) => (
              <Link key={candidate.slug} href={`/candidates/${candidate.slug}`}>
                <CandidateCard candidate={candidate} />
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && candidates.length > 0 && (
          <div className="mt-8 flex justify-center gap-4">
            <button
              onClick={() =>
                handleFilterChange({ page: Math.max(1, (filters.page || 1) - 1) })
              }
              disabled={(filters.page || 1) === 1}
              className="btn-secondary disabled:opacity-50"
            >
              ← 上一页
            </button>
            <span className="px-4 py-2">第 {filters.page} 页</span>
            <button
              onClick={() => handleFilterChange({ page: (filters.page || 1) + 1 })}
              disabled={candidates.length < (filters.page_size || 20)}
              className="btn-secondary disabled:opacity-50"
            >
              下一页 →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
