import { ReactNode } from 'react'

type LoadingStateProps = {
  title: string
  description?: string
  illustration?: IllustrationVariant
}

type EmptyStateProps = {
  icon?: string
  title: string
  description?: string
  actions?: ReactNode
  illustration?: IllustrationVariant
}

type IllustrationVariant = 'lock' | 'compass' | 'ticket' | 'user' | 'alert' | 'list' | 'profile' | 'audit' | 'quota'

function Illustration({ variant }: { variant: IllustrationVariant }) {
  switch (variant) {
    case 'lock':
      return (
        <svg viewBox="0 0 120 80" className="state-illustration" role="img" aria-label="lock">
          <rect x="12" y="16" width="96" height="48" rx="12" fill="#e0f2fe" />
          <path d="M45 38v-6a15 15 0 0 1 30 0v6" fill="none" stroke="#2563eb" strokeWidth="6" strokeLinecap="round" />
          <rect x="36" y="38" width="48" height="28" rx="8" fill="#3b82f6" />
          <circle cx="60" cy="52" r="5" fill="#dbeafe" />
        </svg>
      )
    case 'compass':
      return (
        <svg viewBox="0 0 120 80" className="state-illustration" role="img" aria-label="compass">
          <rect x="12" y="16" width="96" height="48" rx="12" fill="#f1f5f9" />
          <circle cx="60" cy="40" r="18" fill="#e2e8f0" />
          <path d="M60 26l6 12-6 16-6-12z" fill="#ef4444" />
          <circle cx="60" cy="40" r="3" fill="#1e293b" />
        </svg>
      )
    case 'ticket':
      return (
        <svg viewBox="0 0 120 80" className="state-illustration" role="img" aria-label="ticket">
          <rect x="12" y="20" width="96" height="40" rx="10" fill="#fef3c7" />
          <path d="M40 20v40" stroke="#f59e0b" strokeWidth="3" strokeDasharray="4 4" />
          <circle cx="32" cy="40" r="6" fill="#f59e0b" />
          <rect x="52" y="32" width="40" height="6" rx="3" fill="#f59e0b" />
          <rect x="52" y="44" width="28" height="6" rx="3" fill="#f59e0b" />
        </svg>
      )
    case 'user':
      return (
        <svg viewBox="0 0 120 80" className="state-illustration" role="img" aria-label="user">
          <rect x="12" y="16" width="96" height="48" rx="12" fill="#ecfeff" />
          <circle cx="60" cy="36" r="12" fill="#06b6d4" />
          <rect x="38" y="50" width="44" height="10" rx="5" fill="#0ea5e9" />
        </svg>
      )
    case 'list':
      return (
        <svg viewBox="0 0 120 80" className="state-illustration" role="img" aria-label="list">
          <rect x="12" y="16" width="96" height="48" rx="12" fill="#f0f9ff" />
          <rect x="24" y="28" width="72" height="6" rx="3" fill="#38bdf8" />
          <rect x="24" y="40" width="60" height="6" rx="3" fill="#0ea5e9" />
          <rect x="24" y="52" width="48" height="6" rx="3" fill="#0284c7" />
        </svg>
      )
    case 'profile':
      return (
        <svg viewBox="0 0 120 80" className="state-illustration" role="img" aria-label="profile">
          <rect x="12" y="16" width="96" height="48" rx="12" fill="#f5f3ff" />
          <circle cx="44" cy="40" r="10" fill="#8b5cf6" />
          <rect x="60" y="32" width="36" height="6" rx="3" fill="#a78bfa" />
          <rect x="60" y="44" width="28" height="6" rx="3" fill="#7c3aed" />
        </svg>
      )
    case 'audit':
      return (
        <svg viewBox="0 0 120 80" className="state-illustration" role="img" aria-label="audit">
          <rect x="12" y="16" width="96" height="48" rx="12" fill="#ecfeff" />
          <rect x="30" y="24" width="60" height="36" rx="6" fill="#22d3ee" />
          <rect x="38" y="32" width="36" height="6" rx="3" fill="#e0f2fe" />
          <rect x="38" y="44" width="28" height="6" rx="3" fill="#e0f2fe" />
          <circle cx="86" cy="50" r="6" fill="#0ea5e9" />
        </svg>
      )
    case 'quota':
      return (
        <svg viewBox="0 0 120 80" className="state-illustration" role="img" aria-label="quota">
          <rect x="12" y="16" width="96" height="48" rx="12" fill="#fff7ed" />
          <rect x="26" y="30" width="68" height="8" rx="4" fill="#fed7aa" />
          <rect x="26" y="30" width="36" height="8" rx="4" fill="#fb923c" />
          <circle cx="88" cy="50" r="8" fill="#f97316" />
          <rect x="84" y="46" width="8" height="8" rx="2" fill="#fff7ed" />
        </svg>
      )
    case 'alert':
    default:
      return (
        <svg viewBox="0 0 120 80" className="state-illustration" role="img" aria-label="alert">
          <rect x="12" y="16" width="96" height="48" rx="12" fill="#fee2e2" />
          <path d="M60 24l20 36H40z" fill="#ef4444" />
          <rect x="58" y="34" width="4" height="14" fill="#fee2e2" />
          <rect x="58" y="52" width="4" height="4" fill="#fee2e2" />
        </svg>
      )
  }
}

export function LoadingState({ title, description, illustration }: LoadingStateProps) {
  return (
    <div className="state">
      <Illustration variant={illustration || 'alert'} />
      <div className="spinner" />
      <div className="state-title">{title}</div>
      {description && <div className="state-desc">{description}</div>}
    </div>
  )
}

export function EmptyState({ icon, title, description, actions, illustration }: EmptyStateProps) {
  return (
    <div className="state-card">
      {illustration && <Illustration variant={illustration} />}
      {icon && <div className="state-icon">{icon}</div>}
      <div className="state-title">{title}</div>
      {description && <div className="state-desc">{description}</div>}
      {actions && <div className="state-actions">{actions}</div>}
    </div>
  )
}
