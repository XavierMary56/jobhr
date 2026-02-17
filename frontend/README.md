# TG HR Platform - Frontend

Modern Next.js web application for HR users to browse and manage blockchain candidates for TG's HR recruitment platform.

## Overview

This is the frontend application of the TG HR Platform, built with **Next.js 14**, **React 18**, and **TypeScript**. It provides a comprehensive interface for HR users to:

- 🔐 Authenticate via Telegram Bot Web App
- 👥 Browse candidate profiles with advanced filtering
- 🔓 Unlock candidate contact information
- 📊 View audit logs of unlock activities
- ✅ View approval status

## Tech Stack

- **Framework**: [Next.js 14.1.0](https://nextjs.org)
- **Frontend**: [React 18.2.0](https://react.dev)
- **Language**: [TypeScript 5.3.3](https://www.typescriptlang.org)
- **Styling**: [Tailwind CSS 3.4.1](https://tailwindcss.com)
- **HTTP Client**: [Axios 1.6.5](https://axios-http.com)
- **State Management**: [Zustand 4.4.1](https://github.com/pmndrs/zustand)
- **Notifications**: [React-Toastify 9.1.3](https://fkhadra.github.io/react-toastify/introduction)

## Project Structure

```
frontend/
├── app/
│   ├── layout.tsx              # Root layout with ToastContainer
│   ├── page.tsx                # Telegram login page
│   ├── candidates/
│   │   ├── page.tsx            # Candidate list with filtering
│   │   └── [slug]/
│   │       └── page.tsx        # Candidate detail and unlock
│   ├── audit-logs/
│   │   └── page.tsx            # Audit logs viewer
│   └── waiting-approval/
│       └── page.tsx            # Pending approval page
├── components/
│   ├── Header.tsx              # Navigation header
│   ├── FilterBar.tsx           # Search and filter controls
│   └── CandidateCard.tsx       # Reusable candidate card
├── lib/
│   ├── api.ts                  # Typed API client
│   └── store.ts                # Zustand auth store
├── styles/
│   └── globals.css             # Global styles and utilities
├── public/                     # Static assets
├── package.json                # Dependencies
├── tsconfig.json               # TypeScript config
├── next.config.js              # Next.js config
├── tailwind.config.js          # Tailwind config
└── .env.local                  # Environment variables

```

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- Backend API running on `http://localhost:8080`
- Telegram Bot Web App (for authentication)

### Installation

1. **Clone and navigate to frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Set up environment variables**:
   ```bash
   # .env.local
   NEXT_PUBLIC_API_URL=http://localhost:8080
   ```

4. **Start development server**:
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Features

### 🔐 Authentication
- **Telegram Web App Login**: Secure authentication using Telegram Bot Web App SDK
- **JWT Tokens**: Secure cookie-based session management
- **Auto Role Detection**: User roles and permissions automatically assigned from backend

### 👥 Candidate Management
- **List View**: Browse all available candidates with pagination
- **Advanced Filtering**:
  - 🔍 Keyword search (name, title)
  - 🌐 English proficiency level filtering
  - 💻 Technical skills filtering
  - ⛓️ Blockchain experience filter
- **Detail Page**: View full candidate profile with:
  - Professional summary
  - Technical skills with proficiency levels
  - Experience and background
  - Availability information

### 🔓 Unlock System
- **Token-Based Unlocks**: HR users have limited unlocks per period
- **Contact Display**: Phone number and email revealed after unlock
- **History Tracking**: All unlock activities logged and auditable
- **Quota Management**: Real-time quota display and deduction

### 📊 Audit Logs
- **Activity Tracking**: View all unlock activities by company
- **Detailed Information**:
  - User who performed the action
  - Candidate unlocked
  - Timestamp of unlock
  - Action type categorization
- **Pagination**: Efficient log browsing with pagination

### ⏳ Status Management
- **Pending/Blocked States**: Users awaiting admin approval see dedicated waiting page
- **Status Indicators**: Clear indication of account status throughout app

## API Integration

The application communicates with the backend API through the typed API client (`lib/api.ts`):

### Authentication
```typescript
POST /auth/telegram/login
Body: { telegram_init_data: string }
Response: { hr_user_id: string; ... }
```

### Candidates
```typescript
GET /api/candidates
Params: q, skill, english, bc_experience, page, page_size
Response: { items: Candidate[], total: number }

GET /api/candidates/:slug
Response: CandidateDetail

POST /api/candidates/:slug/unlock
Response: { contact: { phone, email } }
```

### Audit Logs
```typescript
GET /api/audit-logs
Params: page, page_size
Response: { items: AuditLog[], total: number }
```

## State Management

Uses **Zustand** for lightweight global state:

```typescript
// lib/store.ts
interface User {
  hrUserID: string
  companyID: string
  status: 'pending' | 'active' | 'blocked'
  role?: string
}

// Usage in components
const user = useAuthStore((state) => state.user)
const setUser = useAuthStore((state) => state.setUser)
const logout = useAuthStore((state) => state.logout)
```

## Styling

### Tailwind CSS
- **Framework**: Responsive utility-first CSS
- **Custom Extensions**: Global utilities in `globals.css`:
  - `btn-primary`: Primary action button
  - `btn-secondary`: Secondary action button
  - `input-field`: Consistent input styling
  - `card`: Card container with shadow
  - `badge`: Status badge styling
  - `code-block`: Code display

### Color Scheme
- **Primary**: Blue (#1d4ed8)
- **Success**: Green (#10b981)
- **Warning**: Amber (#f59e0b)
- **Error**: Red (#ef4444)
- **Neutral**: Gray palette

## Error Handling

- **API Errors**: Comprehensive error handling with toast notifications
- **Auth Errors**: Automatic redirect to login on 401 responses
- **Network Errors**: User-friendly error messages
- **Validation**: Form validation and helpful error tooltips

## Performance Optimizations

- **Code Splitting**: Automatic code splitting by route
- **Image Optimization**: Next.js Image component for optimized images
- **Caching**: API response caching strategy
- **SSR**: Server-side rendering for better SEO

## Development

### Build for Production
```bash
npm run build
npm start
```

### Run Linting (when configured)
```bash
npm run lint
```

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8080` | Backend API base URL |

## Docker

### Build Docker Image
```bash
docker build -t tg-hr-platform-frontend .
```

### Run in Docker
```bash
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_API_URL=http://backend:8080 \
  tg-hr-platform-frontend
```

See [../docker-compose.yml](../docker-compose.yml) for full stack setup.

## Deployment

### Vercel (Recommended)
```bash
npm install -g vercel
vercel login
vercel
```

### Manual Deployment
1. Build the application: `npm run build`
2. Deploy the `.next` directory to your hosting provider
3. Set environment variables on your hosting platform
4. Configure backend API URL via `NEXT_PUBLIC_API_URL`

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Commit changes: `git commit -am 'Add feature'`
3. Push to branch: `git push origin feature/your-feature`
4. Open a Pull Request

## License

© 2024 TG Corporate. All rights reserved.

## Support

For issues and questions:
1. Check existing issues in the repository
2. Contact the backend team for API-related issues
3. File a bug report with reproduction steps
