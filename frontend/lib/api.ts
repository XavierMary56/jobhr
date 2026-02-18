/**
 * API 客户端模块
 * 提供与后端 API 交互的所有方法
 */

import axios, { AxiosInstance } from 'axios'
import { API_CONFIG } from './constants'

// ==================== API 客户端配置 ====================

/**
 * 创建 Axios 实例，配置基础 URL 和凭证
 */
const apiClient: AxiosInstance = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  withCredentials: true, // 允许携带 Cookie
  timeout: API_CONFIG.TIMEOUT,
})

/**
 * 请求拦截器
 * 自动添加认证令牌到请求头
 */
apiClient.interceptors.request.use((config) => {
  // 仅在浏览器环境中处理 localStorage
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('hr_auth')
    if (token) {
      config.headers.Cookie = `hr_auth=${token}`
    }
  }
  return config
})

/**
 * 响应拦截器
 * 统一处理认证失败和错误
 */
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // 401 未授权 - 清除令牌并重定向到登录页
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('hr_auth')
        window.location.href = '/unauthorized'
      }
    }
    if (error.response?.status === 403) {
      if (typeof window !== 'undefined') {
        const code = error.response?.data?.error
        if (code === 'pending_approval') {
          window.location.href = '/waiting-approval'
        } else {
          window.location.href = '/forbidden'
        }
      }
    }
    return Promise.reject(error)
  }
)

// ==================== 类型定义 ====================

/**
 * Telegram 认证数据接口
 */
export interface TelegramAuthData {
  id: number              // Telegram 用户 ID
  first_name: string      // 名字
  last_name?: string      // 姓氏（可选）
  username?: string       // 用户名（可选）
  photo_url?: string      // 头像 URL（可选）
  auth_date: number       // 认证时间戳
  hash: string            // HMAC 哈希值，用于验证
}

/**
 * 登录响应接口
 */
export interface LoginResponse {
  success: boolean        // 登录是否成功
  user_id: number         // HR 用户 ID
  status: string          // 用户状态：active/pending/blocked
}

/**
 * 候选人基本信息接口
 */
export interface Candidate {
  slug: string                      // 候选人唯一标识
  display_name: string              // 显示名称
  desired_role: string              // 期望职位
  english_level: string             // 英语水平
  expected_salary_min_cny: number   // 最低期望薪资（人民币）
  expected_salary_max_cny: number   // 最高期望薪资（人民币）
  availability_days: number         // 可用天数
  timezone: string                  // 时区
  bc_experience: boolean            // 是否有区块链经验
  summary: string                   // 简介
  unlocked_contact: boolean         // 是否已解锁联系方式
  skills: string[]                  // 技能列表
}

/**
 * 候选人详细信息接口
 * 继承基本信息，添加联系方式（解锁后可见）
 */
export interface CandidateDetail extends Candidate {
  contact?: {
    tg_username: string   // Telegram 用户名
    email: string         // 邮箱
    phone: string         // 电话
  }
}

/**
 * 候选人列表查询参数接口
 */
export interface CandidateListParams {
  q?: string                    // 关键词搜索
  skill?: string                // 技能筛选
  english?: string              // 英语水平筛选
  bc_experience?: boolean       // 区块链经验筛选
  availability_days_max?: number// 最大可用天数
  salary_min?: number           // 最低薪资要求
  salary_max?: number           // 最高薪资要求
  page?: number                 // 页码（默认：1）
  page_size?: number            // 每页数量（默认：20）
}

/**
 * 候选人列表响应接口
 */
export interface CandidateListResponse {
  items: Candidate[]            // 候选人数组
}

/**
 * 候选人联系方式接口（解锁后返回）
 */
export interface CandidateContactResponse {
  tg_username: string           // Telegram 用户名
  email: string                 // 邮箱地址
  phone: string                 // 电话号码
}

/**
 * 审计日志接口
 */
export interface AuditLog {
  id: number                    // 日志 ID
  action: string                // 操作类型
  target_type: string           // 目标类型
  target_id: string             // 目标 ID
  meta: Record<string, any>     // 元数据
  created_at: string            // 创建时间
}

/**
 * 审计日志列表响应接口
 */
export interface AuditLogResponse {
  items: AuditLog[]             // 日志数组
  page: number                  // 当前页码
  page_size: number             // 每页数量
  total: number                 // 总记录数
}

/**
 * 当前账号信息接口
 */
export interface MeResponse {
  user: {
    id: number
    company_id: number
    status: string
    role: string
    display_name: string
    tg_username: string
  }
  company: {
    id: number
    name: string
    status: string
  }
  quota: {
    configured: boolean
    unlock_quota_total: number
    unlock_quota_used: number
    unlock_quota_remaining: number
    period_start: string
    period_end: string
  }
}

// ==================== API 方法 ====================

/**
 * 认证相关 API
 */
export const authAPI = {
  /**
   * Telegram 登录
   * @param data Telegram 认证数据
   * @returns 登录响应
   */
  telegramLogin: async (data: TelegramAuthData): Promise<LoginResponse> => {
    const response = await apiClient.post('/auth/telegram/login', data)
    return response.data
  },
}

/**
 * 候选人相关 API
 */
export const candidateAPI = {
  /**
   * 获取候选人列表
   * @param params 查询参数
   * @returns 候选人列表
   */
  list: async (params: CandidateListParams): Promise<CandidateListResponse> => {
    const response = await apiClient.get('/api/candidates', { params })
    return response.data
  },

  /**
   * 获取候选人详情
   * @param slug 候选人唯一标识
   * @returns 候选人详细信息
   */
  getDetail: async (slug: string): Promise<CandidateDetail> => {
    const response = await apiClient.get(`/api/candidates/${slug}`)
    return response.data
  },

  /**
   * 解锁候选人联系方式
   * @param slug 候选人唯一标识
   * @returns 联系方式信息
   */
  unlock: async (slug: string): Promise<CandidateContactResponse> => {
    const response = await apiClient.post(`/api/candidates/${slug}/unlock`)
    return response.data
  },
}

/**
 * 审计日志相关 API
 */
export const auditAPI = {
  /**
   * 获取审计日志列表
   * @param page 页码
   * @param page_size 每页数量
   * @returns 审计日志列表
   */
  getLogs: async (page: number = 1, page_size: number = 20): Promise<AuditLogResponse> => {
    const response = await apiClient.get('/api/audit-logs', {
      params: { page, page_size },
    })
    return response.data
  },
}

/**
 * 账号相关 API
 */
export const accountAPI = {
  /**
   * 获取当前账号信息
   */
  getMe: async (): Promise<MeResponse> => {
    const response = await apiClient.get('/api/me')
    return response.data
  },
}

export default apiClient
