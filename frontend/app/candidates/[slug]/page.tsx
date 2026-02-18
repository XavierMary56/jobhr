'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from '@/lib/toast'
import { candidateAPI, CandidateDetail } from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import Header from '@/components/Header'
import { EmptyState, LoadingState } from '@/components/State'

export default function CandidateDetailPage({ params }: { params: { slug: string } }) {
  const router = useRouter()
  const { user } = useAuthStore()
  const [candidate, setCandidate] = useState<CandidateDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [unlocking, setUnlocking] = useState(false)
  const [showContact, setShowContact] = useState(false)

  useEffect(() => {
    if (!user) {
      router.push('/')
      return
    }
    fetchCandidate()
  }, [user, params.slug, router])

  const fetchCandidate = async () => {
    try {
      setLoading(true)
      const data = await candidateAPI.getDetail(params.slug)
      setCandidate(data)
      setShowContact(data.unlocked_contact)
    } catch (error: any) {
      toast.error(error.response?.data?.error || '获取候选人信息失败')
      router.push('/candidates')
    } finally {
      setLoading(false)
    }
  }

  const handleUnlock = async () => {
    try {
      setUnlocking(true)
      const contact = await candidateAPI.unlock(params.slug)
      setShowContact(true)
      setCandidate((prev) =>
        prev ? { ...prev, contact, unlocked_contact: true } : null
      )
      toast.success('已解锁联系方式！')
    } catch (error: any) {
      if (error.response?.status === 402) {
        router.push(`/quota?reason=exceeded&return=/candidates/${params.slug}`)
      } else if (error.response?.status === 409) {
        router.push(`/quota?reason=not_configured&return=/candidates/${params.slug}`)
      } else {
        toast.error(error.response?.data?.error || '解锁失败')
      }
    } finally {
      setUnlocking(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container py-12">
          <LoadingState title="加载中..." description="正在获取候选人详情" illustration="profile" />
        </div>
      </div>
    )
  }

  if (!candidate) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container py-12">
          <EmptyState
            icon="📄"
            illustration="profile"
            title="候选人不存在"
            description="该候选人可能已被删除或不可见"
            actions={
              <Link href="/candidates" className="btn-primary">
                返回列表
              </Link>
            }
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="container py-8">
        <Link href="/candidates" className="text-blue-600 hover:text-blue-700 mb-4 inline-block">
          ← 返回列表
        </Link>

        <div className="grid gap-8 md:grid-cols-3 mt-6">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">
            {/* Header Card */}
            <div className="card">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{candidate.display_name}</h1>
                  <p className="text-lg text-gray-600 mt-2">{candidate.desired_role}</p>
                </div>
                {candidate.bc_experience && (
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                    区块链经验
                  </span>
                )}
              </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="card">
                <p className="text-gray-500 text-sm">英语水平</p>
                <p className="text-lg font-semibold text-gray-900">{candidate.english_level || '未指定'}</p>
              </div>
              <div className="card">
                <p className="text-gray-500 text-sm">可用天数</p>
                <p className="text-lg font-semibold text-gray-900">{candidate.availability_days || '-'} 天</p>
              </div>
              <div className="card">
                <p className="text-gray-500 text-sm">时区</p>
                <p className="text-lg font-semibold text-gray-900">{candidate.timezone || '未指定'}</p>
              </div>
              <div className="card">
                <p className="text-gray-500 text-sm">期望薪资</p>
                <p className="text-lg font-semibold text-gray-900">
                  {candidate.expected_salary_min_cny && candidate.expected_salary_max_cny
                    ? `¥${candidate.expected_salary_min_cny.toLocaleString()}-${candidate.expected_salary_max_cny.toLocaleString()}`
                    : '未指定'}
                </p>
              </div>
            </div>

            {/* Summary */}
            <div className="card">
              <h2 className="text-xl font-bold text-gray-900 mb-4">个人介绍</h2>
              <p className="text-gray-700 leading-relaxed">{candidate.summary || '暂无简介'}</p>
            </div>

            {/* Skills */}
            <div className="card">
              <h2 className="text-xl font-bold text-gray-900 mb-4">技能</h2>
              <div className="flex flex-wrap gap-2">
                {candidate.skills && candidate.skills.length > 0 ? (
                  candidate.skills.map((skill) => (
                    <span
                      key={skill}
                      className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium"
                    >
                      {skill}
                    </span>
                  ))
                ) : (
                  <p className="text-gray-500">未添加技能</p>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="md:col-span-1">
            <div className="card sticky top-4">
              <h3 className="text-lg font-bold text-gray-900 mb-4">联系方式</h3>

              {showContact && candidate.contact ? (
                <div className="space-y-3">
                  {candidate.contact.tg_username && (
                    <div>
                      <p className="text-gray-500 text-sm">Telegram</p>
                      <p className="font-medium text-gray-900">@{candidate.contact.tg_username}</p>
                    </div>
                  )}
                  {candidate.contact.email && (
                    <div>
                      <p className="text-gray-500 text-sm">邮箱</p>
                      <p className="font-medium text-gray-900 break-all">{candidate.contact.email}</p>
                    </div>
                  )}
                  {candidate.contact.phone && (
                    <div>
                      <p className="text-gray-500 text-sm">电话</p>
                      <p className="font-medium text-gray-900">{candidate.contact.phone}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-gray-600 text-sm mb-4">
                    {candidate.unlocked_contact
                      ? '已解锁'
                      : '联系方式已锁定，点击下方按钮解锁'}
                  </p>
                  {!candidate.unlocked_contact && (
                    <button
                      onClick={handleUnlock}
                      disabled={unlocking}
                      className="btn-primary w-full disabled:opacity-50"
                    >
                      {unlocking ? '解锁中...' : '🔓 解锁联系方式'}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
