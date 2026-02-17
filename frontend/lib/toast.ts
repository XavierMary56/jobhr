/**
 * 简单的消息提示（替代 react-toastify）
 * 使用浏览器原生 API
 */

export const toast = {
  success: (message: string) => {
    if (typeof window !== 'undefined') {
      console.log('✅ SUCCESS:', message)
      alert(`✅ ${message}`)
    }
  },
  
  error: (message: string) => {
    if (typeof window !== 'undefined') {
      console.error('❌ ERROR:', message)
      alert(`❌ ${message}`)
    }
  },
  
  info: (message: string) => {
    if (typeof window !== 'undefined') {
      console.info('ℹ️ INFO:', message)
      alert(`ℹ️ ${message}`)
    }
  },
  
  warning: (message: string) => {
    if (typeof window !== 'undefined') {
      console.warn('⚠️ WARNING:', message)
      alert(`⚠️ ${message}`)
    }
  },
}

export default toast
