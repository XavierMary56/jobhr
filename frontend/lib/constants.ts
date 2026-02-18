/**
 * 应用常量配置
 * 集中管理所有硬编码的常量值
 */

// API 配置
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080',
  TIMEOUT: 10000, // 请求超时时间（毫秒）
} as const

// 支持联系方式
export const SUPPORT_CONFIG = {
  EMAIL: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'support@example.com',
} as const

// 英语水平选项
export const ENGLISH_LEVELS = [
  { value: '', label: '所有' },
  { value: 'none', label: '无' },
  { value: 'basic', label: '基础' },
  { value: 'working', label: '工作' },
  { value: 'fluent', label: '流利' },
] as const

// 技能列表
export const SKILLS = [
  '',
  'Java',
  'Python',
  'Go',
  'Rust',
  'JavaScript',
  'TypeScript',
  'React',
  'Node.js',
  'Solidity',
  'Web3',
] as const

// 分页配置
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const

// 审计日志操作映射
export const AUDIT_ACTION_LABELS: Record<string, string> = {
  'candidate.list': '查看候选人列表',
  'candidate.view': '查看候选人详情',
  'candidate.unlock': '解锁候选人联系方式',
  'company.create': '创建公司',
  'user.login': '用户登录',
} as const

// 用户状态
export const USER_STATUS = {
  ACTIVE: 'active',
  PENDING: 'pending',
  BLOCKED: 'blocked',
} as const

// Toast 配置
export const TOAST_CONFIG = {
  POSITION: 'top-right',
  AUTO_CLOSE: 3000,
} as const

// 路由路径
export const ROUTES = {
  HOME: '/',
  LOGIN: '/',
  CANDIDATES: '/candidates',
  CANDIDATE_DETAIL: (slug: string) => `/candidates/${slug}`,
  AUDIT_LOGS: '/audit-logs',
  WAITING_APPROVAL: '/waiting-approval',
} as const
