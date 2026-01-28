# Gemini Context File (GEMINI.md)

## Project Overview

**Name**: fos-accountbook (우리집 가계부)
**Description**: A smart family budget application designed for managing shared family finances, incomes, expenses, and categories.
**Language**: Korean (UI/UX), English (Code/Comments)

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Library**: React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4, shadcn/ui
- **Authentication**: NextAuth.js v5 (Google, Naver)
- **State Management**: React Hook Form, Zod (Server-side validation)
- **HTTP Client**: ky (with custom wrappers for client/server)
- **Testing**: Jest, React Testing Library, MSW
- **Package Manager**: pnpm

## Architecture & Directory Structure

The project follows a feature-based structure within the Next.js App Router conventions.

```
src/
├── app/                          # Next.js App Router
│   ├── (authenticated)/          # Protected routes (Requires Auth)
│   │   ├── layout.tsx            # Session check & redirect logic
│   │   ├── dashboard/            # Dashboard page
│   │   ├── transactions/         # Transaction list
│   │   ├── categories/           # Category management
│   │   ├── families/             # Family management
│   │   └── ...
│   ├── actions/                  # Server Actions (Business Logic & Backend Calls)
│   │   ├── auth/
│   │   ├── expense/
│   │   ├── income/
│   │   └── ...
│   ├── api/                      # Next.js API Routes (mostly for Auth)
│   └── auth/                     # Public Auth pages (Signin, Error)
├── components/                   # React Components
│   ├── ui/                       # Reusable UI components (shadcn/ui)
│   ├── common/                   # Shared components (Loaders, ErrorBoundaries)
│   ├── dashboard/                # Dashboard-specific widgets
│   ├── expenses/                 # Expense forms & lists
│   └── ...
├── lib/                          # Core Utilities & Libraries
│   ├── client/                   # Client-side specific utils (hooks, api wrappers)
│   ├── server/                   # Server-side specific utils (api wrappers, auth config)
│   ├── env/                      # Environment variable schema & validation
│   └── utils/                    # General helpers (date formatting, etc.)
├── types/                        # TypeScript Definitions
│   ├── models/                   # Domain models (Expense, Income, Family)
│   └── ...
└── __tests__/                    # Unit & Integration Tests
```

## Key Conventions & Patterns

### 1. Authentication

- **Route Groups**: `src/app/(authenticated)` is used to group routes requiring login. The `layout.tsx` in this directory handles session validation.
- **NextAuth**: Handles OAuth (Google/Naver). JWT is exchanged/managed for backend API communication.

### 2. Data Fetching & Mutations

- **Server Actions**: Used for form submissions and data mutations. Located in `src/app/actions`.
- **API Wrappers**:
  - `src/lib/server/api`: Use `serverApiGet`, `serverApiPost` for fetching data inside Server Components/Actions.
  - `src/lib/client/api`: Use `apiGet`, `apiPost` for fetching data inside Client Components.
- **HTTP Client**: `ky` is used under the hood.

### 3. Styling

- **Tailwind CSS**: Utility-first styling.
- **Shadcn UI**: Used for base components (`Button`, `Dialog`, `Input`, etc.) in `src/components/ui`.
- **Icons**: `lucide-react`.

### 4. Testing

- **Jest**: Test runner.
- **Testing Library**: For component testing.
- **Naming**: `*.test.ts` or `*.test.tsx`.
- **Location**: `src/__tests__` mirrors the `src` structure.

## Development Commands

- `pnpm dev`: Start development server.
- `pnpm build`: Build for production.
- `pnpm test`: Run tests.
- `pnpm lint`: Run ESLint.

## Environment Variables

Required variables in `.env.local`:

- `NEXTAUTH_URL`, `NEXTAUTH_SECRET`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- `NAVER_CLIENT_ID`, `NAVER_CLIENT_SECRET`
- `BACKEND_API_URL`
