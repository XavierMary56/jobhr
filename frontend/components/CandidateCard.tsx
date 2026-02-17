/**
 * CandidateCard 组件
 * 候选人卡片，用于列表展示候选人基本信息
 */

import { Candidate } from '@/lib/api'
import { formatSalaryRange, getEnglishLevelLabel } from '@/lib/utils'

interface CandidateCardProps {
  candidate: Candidate
}

export default function CandidateCard({ candidate }: CandidateCardProps) {
  return (
    <div className="card group cursor-pointer transform transition-transform hover:scale-105">
      {/* 候选人基本信息 */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600">
            {candidate.display_name}
          </h3>
          <p className="text-sm text-gray-600 mt-1">{candidate.desired_role}</p>
        </div>
        {candidate.bc_experience && (
          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium whitespace-nowrap ml-2">
            BC经验
          </span>
        )}
      </div>

      {/* 候选人详细信息 */}
      <div className="space-y-3 text-sm">
        <div className="flex justify-between text-gray-600">
          <span>英语水平:</span>
          <span className="text-gray-900 font-medium">
            {getEnglishLevelLabel(candidate.english_level)}
          </span>
        </div>

        <div className="flex justify-between text-gray-600">
          <span>期望薪资:</span>
          <span className="text-gray-900 font-medium">
            {formatSalaryRange(candidate.expected_salary_min_cny, candidate.expected_salary_max_cny)}
          </span>
        </div>

        {candidate.availability_days > 0 && (
          <div className="flex justify-between text-gray-600">
            <span>可用天数:</span>
            <span className="text-gray-900 font-medium">{candidate.availability_days} 天</span>
          </div>
        )}
      </div>

      {/* 技能标签 */}
      {candidate.skills && candidate.skills.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-600 mb-2">技能标签:</p>
          <div className="flex flex-wrap gap-2">
            {candidate.skills.slice(0, 3).map((skill) => (
              <span
                key={skill}
                className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs"
              >
                {skill}
              </span>
            ))}
            {candidate.skills.length > 3 && (
              <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                +{candidate.skills.length - 3}
              </span>
            )}
          </div>
        </div>
      )}

      {/* 底部操作区 */}
      <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
        <span className={`text-xs ${candidate.unlocked_contact ? 'text-green-600' : 'text-gray-500'}`}>
          {candidate.unlocked_contact ? '✓ 已解锁' : '🔒 未解锁'}
        </span>
        <span className="text-blue-600 group-hover:text-blue-700 font-medium text-sm">
          查看详情 →
        </span>
      </div>
    </div>
  )
}
