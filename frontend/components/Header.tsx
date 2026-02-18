'use client'

import Link from 'next/link'
import { useAuthStore } from '@/lib/store'

export default function Header() {
  const { user, logout } = useAuthStore()

  const handleLogout = () => {
    logout()
  }

  return (
    <header className="bg-white shadow-sm sticky top-0 z-40">
      <div className="container py-4 flex justify-between items-center">
        <Link href="/candidates" className="text-2xl font-bold text-blue-600">
          TG HR
        </Link>

        <nav className="flex items-center gap-6">
          <Link
            href="/account"
            className="text-gray-600 hover:text-gray-900 font-medium"
          >
            账号资料
          </Link>
          <Link
            href="/candidates"
            className="text-gray-600 hover:text-gray-900 font-medium"
          >
            候选人
          </Link>
          <Link
            href="/audit-logs"
            className="text-gray-600 hover:text-gray-900 font-medium"
          >
            审计日志
          </Link>

          {user && (
            <div className="flex items-center gap-4 ml-4 pl-4 border-l border-gray-300">
              <span className="text-sm text-gray-600">
                用户 ID: {user.hrUserID}
              </span>
              <button
                onClick={handleLogout}
                className="text-red-600 hover:text-red-700 font-medium text-sm"
              >
                退出
              </button>
            </div>
          )}
        </nav>
      </div>
    </header>
  )
}
