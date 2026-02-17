/**
 * 简化状态管理（不依赖 Zustand）
 */
import { useState, useEffect } from 'react'

export interface User {
  hrUserID: number
  companyID: number
  status: 'active' | 'pending' | 'blocked'
  role: string
}

class SimpleAuthStore {
  private user: User | null = null
  private listeners: Set<() => void> = new Set()

  getUser(): User | null {
    return this.user
  }

  setUser(user: User | null) {
    this.user = user
    this.notify()
  }

  logout() {
    this.user = null
    this.notify()
  }

  isLoggedIn(): boolean {
    return this.user !== null && this.user.status === 'active'
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private notify() {
    this.listeners.forEach((listener) => listener())
  }
}

const authStore = new SimpleAuthStore()

export function useAuthStore() {
  const [, forceUpdate] = useState({})

  useEffect(() => {
    return authStore.subscribe(() => forceUpdate({}))
  }, [])

  return {
    user: authStore.getUser(),
    setUser: (user: User | null) => authStore.setUser(user),
    logout: () => authStore.logout(),
    isLoggedIn: authStore.isLoggedIn(),
  }
}
