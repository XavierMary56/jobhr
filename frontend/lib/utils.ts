/**
 * 工具函数集合
 * 提供跨组件使用的通用辅助函数
 */

/**
 * 格式化薪资范围显示
 * @param min 最低薪资
 * @param max 最高薪资
 * @returns 格式化的薪资字符串
 */
export function formatSalaryRange(min?: number, max?: number): string {
  if (!min && !max) return '面议'
  if (min && max) return `¥${min.toLocaleString()} - ¥${max.toLocaleString()}`
  if (min) return `¥${min.toLocaleString()}+`
  if (max) return `最高 ¥${max.toLocaleString()}`
  return '面议'
}

/**
 * 格式化日期时间
 * @param dateString ISO 日期字符串
 * @returns 格式化的日期字符串
 */
export function formatDateTime(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * 格式化日期（仅日期部分）
 * @param dateString ISO 日期字符串
 * @returns 格式化的日期字符串
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN')
}

/**
 * 获取英语水平的中文标签
 * @param level 英语水平代码
 * @returns 中文标签
 */
export function getEnglishLevelLabel(level: string): string {
  const labels: Record<string, string> = {
    'none': '无',
    'basic': '基础',
    'working': '工作',
    'fluent': '流利',
  }
  return labels[level] || level || '未指定'
}

/**
 * 检查用户是否已认证
 * @param user 用户对象
 * @returns 是否已认证
 */
export function isAuthenticated(user: any): boolean {
  return !!user && !!user.hrUserID
}

/**
 * 检查用户是否为活跃状态
 * @param user 用户对象
 * @returns 是否活跃
 */
export function isUserActive(user: any): boolean {
  return user?.status === 'active'
}

/**
 * 截断文本
 * @param text 原始文本
 * @param maxLength 最大长度
 * @returns 截断后的文本
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

/**
 * 获取错误消息
 * @param error 错误对象
 * @param defaultMessage 默认消息
 * @returns 错误消息字符串
 */
export function getErrorMessage(error: any, defaultMessage: string = '操作失败'): string {
  return error?.response?.data?.error || error?.message || defaultMessage
}

/**
 * 延迟执行
 * @param ms 毫秒数
 * @returns Promise
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * 生成唯一 ID
 * @returns 唯一标识符
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}
