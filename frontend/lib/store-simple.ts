/**
 * 简单的状态管理（不依赖 Zustand）
 * 使用原生 TypeScript + React Context 模式
 */

export interface User {
  hrUserID: number
  companyID: number
  status: 'active' | 'pending' | 'blocked'
  role: string
}

class SimpleAuthStore {
  private user: User | null = null

  getUser(): User | null {
    return this.user
  }

  setUser(user: User | null) {
    this.user = user
  }

  logout() {
    this.user = null
    if (typeof window !== 'undefined') {
      localStorage.removeItem('hr_auth')
      window.location.href = '/'
    }
  }

  isLoggedIn(): boolean {
    return this.user !== null && this.user.status === 'active'
  }
}

const authStore = new SimpleAuthStore()

// 简单的 Hook 替代 Zustand
export function useAuthStore() {
  return {
    user: authStore.getUser(),
    setUser: (user: User | null) => authStore.setUser(user),
    logout: () => authStore.logout(),
    isLoggedIn: authStore.isLoggedIn(),
  }
}

export default authStore
