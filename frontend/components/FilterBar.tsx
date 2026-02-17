/**
 * FilterBar 组件
 * 候选人筛选搜索栏，支持关键词、英语水平、技能、区块链经验等多维度筛选
 */

'use client'

import { useState } from 'react'
import { CandidateListParams } from '@/lib/api'
import { ENGLISH_LEVELS, SKILLS } from '@/lib/constants'

interface FilterBarProps {
  onFilterChange: (filters: Partial<CandidateListParams>) => void
}

export default function FilterBar({ onFilterChange }: FilterBarProps) {
  // 筛选条件状态
  const [q, setQ] = useState('')
  const [skill, setSkill] = useState('')
  const [english, setEnglish] = useState('')
  const [bcExperience, setBcExperience] = useState(false)
  const [availabilityDaysMax, setAvailabilityDaysMax] = useState('')
  const [salaryMin, setSalaryMin] = useState('')
  const [salaryMax, setSalaryMax] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)

  /**
   * 应用筛选条件
   */
  const handleSearch = () => {
    onFilterChange({
      q: q || undefined,
      skill: skill || undefined,
      english: english || undefined,
      bc_experience: bcExperience || undefined,
      availability_days_max: availabilityDaysMax ? parseInt(availabilityDaysMax) : undefined,
      salary_min: salaryMin ? parseInt(salaryMin) : undefined,
      salary_max: salaryMax ? parseInt(salaryMax) : undefined,
    })
  }

  /**
   * 重置所有筛选条件
   */
  const handleReset = () => {
    setQ('')
    setSkill('')
    setEnglish('')
    setBcExperience(false)
    setAvailabilityDaysMax('')
    setSalaryMin('')
    setSalaryMax('')
    onFilterChange({
      q: undefined,
      skill: undefined,
      english: undefined,
      bc_experience: undefined,
      availability_days_max: undefined,
      salary_min: undefined,
      salary_max: undefined,
    })
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      <div className="space-y-4">
        {/* 基础筛选条件 */}
        <div className="grid gap-4 md:grid-cols-3">
          {/* 关键词搜索 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              关键词搜索
            </label>
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="搜索候选人名字或职位..."
              className="input-field"
            />
          </div>

          {/* 英语水平筛选 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              英语水平
            </label>
            <select
              value={english}
              onChange={(e) => setEnglish(e.target.value)}
              className="input-field"
            >
              {ENGLISH_LEVELS.map((level) => (
                <option key={level.value} value={level.value}>
                  {level.label}
                </option>
              ))}
            </select>
          </div>

          {/* 技能筛选 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              技能
            </label>
            <select
              value={skill}
              onChange={(e) => setSkill(e.target.value)}
              className="input-field"
            >
              {SKILLS.map((s) => (
                <option key={s} value={s}>
                  {s || '所有'}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 高级筛选开关 */}
        <div>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            {showAdvanced ? '▼ 隐藏高级选项' : '▶ 显示高级选项'}
          </button>
        </div>

        {showAdvanced && (
          <div className="pt-4 border-t border-gray-200 space-y-4">
            {/* Blockchain Experience */}
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={bcExperience}
                onChange={(e) => setBcExperience(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-sm font-medium text-gray-700">
                仅显示有区块链经验的候选人
              </span>
            </label>

            {/* Salary Range */}
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  最低期望薪资 (CNY)
                </label>
                <input
                  type="number"
                  value={salaryMin}
                  onChange={(e) => setSalaryMin(e.target.value)}
                  placeholder="例如: 20000"
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  最高期望薪资 (CNY)
                </label>
                <input
                  type="number"
                  value={salaryMax}
                  onChange={(e) => setSalaryMax(e.target.value)}
                  placeholder="例如: 50000"
                  className="input-field"
                />
              </div>
            </div>

            {/* Availability */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                最大可用天数
              </label>
              <input
                type="number"
                value={availabilityDaysMax}
                onChange={(e) => setAvailabilityDaysMax(e.target.value)}
                placeholder="例如: 30"
                className="input-field"
              />
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <button onClick={handleSearch} className="btn-primary flex-1">
            🔍 搜索
          </button>
          <button onClick={handleReset} className="btn-secondary">
            重置
          </button>
        </div>
      </div>
    </div>
  )
}
