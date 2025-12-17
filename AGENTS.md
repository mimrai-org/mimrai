# AGENTS.md - Mimrai Project Specifications

> This document provides comprehensive guidance for AI agents working with the Mimrai codebase.

## Project Overview

**Mimrai** is an open-source minimalist task management tool designed to help users track tasks and projects with ease. It features AI-powered assistance, real-time collaboration, and integrations with popular communication platforms.

---

## Tech Stack

### Core Technologies

| Category             | Technology       | Version |
| -------------------- | ---------------- | ------- |
| **Runtime**          | Bun              | 1.2.21  |
| **Language**         | TypeScript       | ^5.9.2  |
| **Monorepo**         | Turborepo        | 2.5.6   |
| **Linter/Formatter** | Biome            | ^2.2.0  |
| **Package Manager**  | Bun (workspaces) | -       |

### Frontend

| Category             | Technology             | Version           |
| -------------------- | ---------------------- | ----------------- |
| **Framework**        | Next.js                | 16.0.7            |
| **React**            | React                  | 19.2.1            |
| **Styling**          | Tailwind CSS           | ^4.1.10           |
| **UI Components**    | Radix UI + Shadcn UI   | Various           |
| **State Management** | Zustand                | ^5.0.8            |
| **Data Fetching**    | TanStack React Query   | ^5.85.5           |
| **Forms**            | React Hook Form + Zod  | ^7.63.0 / ^4.1.10 |
| **Animations**       | Motion (Framer Motion) | ^12.23.22         |
| **Rich Text**        | TipTap                 | ^3.6.6            |

### Backend

| Category            | Technology            | Version |
| ------------------- | --------------------- | ------- |
| **API Framework**   | Hono                  | ^4.9.8  |
| **API Protocol**    | tRPC                  | ^11.6.0 |
| **Database**        | PostgreSQL (Supabase) | -       |
| **ORM**             | Drizzle ORM           | 0.44.6  |
| **Authentication**  | Better Auth           | 1.4.6   |
| **Caching**         | Redis (Upstash)       | ^5.8.2  |
| **Background Jobs** | Trigger.dev           | 4.1.2   |
| **AI SDK**          | Vercel AI SDK         | 5.0.87  |
| **AI Provider**     | OpenAI                | 2.0.62  |

### Services & Infrastructure

| Service           | Purpose                     |
| ----------------- | --------------------------- |
| **Supabase**      | Database, storage, realtime |
| **Vercel**        | Website & dashboard hosting |
| **Fly.io**        | API hosting                 |
| **Trigger.dev**   | Background jobs             |
| **Resend**        | Email delivery              |
| **Upstash**       | Redis caching               |
| **Sentry**        | Error tracking              |
| **OpenPanel.dev** | Events and analytics        |

---

## Architecture

### Monorepo Structure

```
mimrai/
├── apps/
│   ├── api/          # Hono + tRPC backend (Fly.io)
│   ├── dashboard/    # Next.js task management app (Vercel)
│   └── website/      # Next.js marketing site (Vercel)
├── packages/
│   ├── billing/      # Stripe billing utilities
│   ├── cache/        # Redis caching layer
│   ├── db/           # Drizzle ORM schema & queries
│   ├── email/        # React Email templates
│   ├── embedding/    # Vector embeddings for AI
│   ├── events/       # OpenPanel analytics
│   ├── integration/  # Third-party integrations
│   ├── jobs/         # Trigger.dev background jobs
│   ├── locale/       # i18n utilities
│   ├── logger/       # Pino logging
│   ├── notifications/# Notification system
│   ├── tsconfig/     # Shared TypeScript configs
│   ├── ui/           # Shared UI components
│   └── utils/        # Shared utilities
```

### Apps

#### `@mimir/api` - Backend API

- **Framework**: Hono with OpenAPI support
- **Protocol**: tRPC for type-safe API calls
- **Port**: 3003 (default)
- **Features**:
  - AI chat agents with tools
  - REST API endpoints
  - Webhook handlers
  - Authentication via Better Auth
  - Integrations initialization

#### `@mimir/dashboard` - Main Application

- **Framework**: Next.js 16 with Turbopack
- **Port**: 3000
- **Features**:
  - Task management UI
  - Project management
  - AI chat interface
  - Real-time updates
  - Kanban boards
  - Timeline views

#### `@mimir/website` - Marketing Site

- **Framework**: Next.js 16
- **Port**: 3001
- **Features**:
  - Landing pages
  - Documentation
  - Newsletter signup

### Packages

#### `@mimir/db` - Database Layer

- **ORM**: Drizzle ORM with PostgreSQL
- **Schema includes**:
  - Users, Teams, Sessions
  - Tasks, Projects, Milestones
  - Labels, Checklists, Columns
  - Integrations, Notifications
  - AI Chats, Embeddings
- **Exports**: `./client`, `./schema`, `./queries/*`, `./job-client`

#### `@mimir/cache` - Caching Layer

- **Backend**: Redis (Upstash)
- **Features**: Users cache, Teams cache, Integrations cache, Chat feedback cache
- **Exports**: `./redis-client`, `./users-cache`, `./teams-cache`, etc.

#### `@mimir/integration` - Third-Party Integrations

- **Supported platforms**:
  - Mattermost
  - GitHub
  - WhatsApp
  - Slack
- **Exports**: `./registry`, `./init`, `./validate`, `./mattermost`, `./slack`, etc.

#### `@mimir/jobs` - Background Jobs

- **Platform**: Trigger.dev
- **Job types**:
  - Follow-ups
  - Imports (CSV, Excel)
  - Meet bot
  - Notifications
  - Task processing

#### `@mimir/email` - Email Templates

- **Library**: React Email
- **Templates**:
  - Email verification
  - Password reset
  - Invitations
  - Notifications
  - Welcome emails

#### `@mimir/ui` - Shared UI Components

- **Based on**: Shadcn UI + Radix UI
- **Components**: Button, Dialog, Form, Input, Select, Table, Tabs, etc.
- **Styling**: Tailwind CSS with class-variance-authority

#### `@mimir/notifications` - Notification System

- Handles email, in-app, and integration-based notifications
- Integrates with Resend for email delivery

#### `@mimir/embedding` - AI Embeddings

- Vector embeddings for semantic search
- Task similarity and suggestions

#### `@mimir/billing` - Billing System

- Stripe integration
- Plan management (free, team)
- Subscription handling

#### `@mimir/events` - Analytics

- OpenPanel integration
- Server and client-side event tracking

#### `@mimir/locale` - Internationalization

- Timezone utilities
- Date formatting constants

#### `@mimir/logger` - Logging

- Pino logger with pretty printing

#### `@mimir/utils` - Shared Utilities

- Environment variables
- Formatting helpers
- Random generators
- Plan utilities
- Task utilities

---

## Database Schema (Key Entities)

```typescript
// Core entities
-users - // User accounts
  teams - // Team/workspace management
  usersOnTeams - // Team membership (owner/member roles)
  session - // Auth sessions
  account - // OAuth accounts
  // Task management
  tasks - // Main task entity
  projects - // Project containers
  milestones - // Milestone tracking
  labels - // Task labels
  columns - // Kanban columns
  statuses - // Task statuses (backlog, todo, in_progress, done, canceled)
  checklists - // Task checklists
  tasksDependencies - // Task dependencies (blocks, blocked_by)
  taskEmbeddings - // AI embeddings for tasks
  // Integrations
  integrations - // Third-party integration configs
  notifications - // User notifications
  // AI
  chats - // AI chat sessions
  chatMessages; // Chat message history
```

---

## Coding Standards

### TypeScript Configuration

- **Strict mode**: Enabled
- **Target**: ES2022
- **Module**: NodeNext
- **Features**:
  - `noUncheckedIndexedAccess`: true
  - `isolatedModules`: true
  - `skipLibCheck`: true

### Biome Configuration

- **Formatter**: Tab indentation, double quotes
- **Linter rules**:
  - Recommended rules enabled
  - `useSortedClasses`: Auto-sort Tailwind classes
  - `noUnusedImports`: Warn
  - `noParameterAssign`: Error
  - `useSelfClosingElements`: Error

### Form Handling

Always use the pattern from `components.instructions.md`:

```tsx
"use client";

import { z } from "zod/v3";
import { useZodForm } from "@/hooks/use-zod-form";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";

// Define schema OUTSIDE component
const schema = z.object({
  email: z.string().email(),
});

export function MyForm() {
  const form = useZodForm(schema, {
    defaultValues: { email: "" },
  });

  const handleSubmit = (data: z.infer<typeof schema>) => {
    // Handle submission
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="johndoe@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}
```

### Import Conventions

```typescript
// Use "zod/v3" for schema validation
import { z } from "zod/v3";

// Workspace packages
import { db } from "@mimir/db/client";
import { tasks } from "@mimir/db/schema";
import { createTask } from "@mimir/db/queries/tasks";
import { Button } from "@mimir/ui/button";

// Path aliases in apps
import { useUser } from "@/hooks/use-user";
import { cn } from "@/lib/utils";
```

### Component Conventions

- Add `"use client";` directive for components using React hooks
- Use `cn()` utility for conditional class names
- Prefer Radix UI primitives with Shadcn patterns
- Use `lucide-react` for icons

---

## Development Commands

```bash
# Install dependencies
bun install

# Development
bun dev                # Run all apps
bun dev:dashboard      # Dashboard only (port 3000)
bun dev:api           # API only (port 3003)
bun dev:website       # Website only (port 3001)

# Database
bun db:push           # Push schema changes to database

# Code quality
bun check             # Run Biome linter/formatter
bun check-types       # TypeScript type checking

# Build
bun build             # Build all packages/apps

# Clean
bun clean             # Remove node_modules
```

---

## Environment Variables

The project uses `.env` files for configuration. Key variables include:

```bash
# Database
DATABASE_URL=

# Supabase
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Redis
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Auth
BETTER_AUTH_SECRET=

# API
ALLOWED_API_ORIGINS=
PORT=

# External Services
OPENAI_API_KEY=
RESEND_API_KEY=
STRIPE_SECRET_KEY=
SENTRY_DSN=
OPENPANEL_CLIENT_ID=
```

---

## AI Tools (API)

The API includes AI agents with the following tools:

| Tool                       | Description              |
| -------------------------- | ------------------------ |
| `create-task`              | Create new tasks         |
| `update-task`              | Modify existing tasks    |
| `get-tasks`                | Query tasks with filters |
| `create-project`           | Create projects          |
| `update-project`           | Modify projects          |
| `get-projects`             | List projects            |
| `create-milestone`         | Create milestones        |
| `update-milestone`         | Modify milestones        |
| `get-milestones`           | List milestones          |
| `create-label`             | Create task labels       |
| `get-labels`               | List labels              |
| `get-columns`              | Get kanban columns       |
| `get-users`                | List team members        |
| `create-checklist-item`    | Add checklist items      |
| `update-checklist-item`    | Modify checklist items   |
| `create-task-pull-request` | Link PRs to tasks        |
| `web-search`               | Search the web           |

---

## Best Practices

### General

1. **Type Safety**: Leverage TypeScript's strict mode and tRPC for end-to-end type safety
2. **Validation**: Always validate inputs with Zod schemas
3. **Error Handling**: Use proper error boundaries and Sentry for tracking
4. **Caching**: Use Redis cache for frequently accessed data
5. **Logging**: Use `@mimir/logger` for consistent logging

### Database

1. Use Drizzle query builder for type-safe queries
2. Define relations properly in schema
3. Use transactions for multi-step operations
4. Leverage indexes for performance

### Frontend

1. Use React Query for server state management
2. Use Zustand for client state
3. Implement optimistic updates where appropriate
4. Follow Shadcn UI patterns for consistency

### API

1. Use tRPC procedures for type-safe endpoints
2. Implement proper authentication middleware
3. Rate limit sensitive endpoints
4. Validate all inputs with Zod

### Testing

1. Write unit tests for utilities
2. Test API endpoints
3. Use Bun's built-in test runner

---

## File Naming Conventions

| Type       | Convention    | Example              |
| ---------- | ------------- | -------------------- |
| Components | kebab-case    | `task-card.tsx`      |
| Hooks      | use-\* prefix | `use-task-params.ts` |
| Utilities  | kebab-case    | `format.ts`          |
| Types      | kebab-case    | `types.ts`           |
| Schemas    | kebab-case    | `schema.ts`          |
| API Routes | kebab-case    | `tasks.ts`           |

---

## License

AGPL-3.0 for non-commercial use. Commercial license available upon request.

---

## Contact

For questions or commercial licensing: [ilpadronexd@gmail.com](mailto:ilpadronexd@gmail.com)
