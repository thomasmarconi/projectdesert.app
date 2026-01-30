# Project Desert - Frontend

A Next.js web application for managing and tracking ascetical practices and spiritual growth. This frontend connects to a FastAPI backend and provides a comprehensive interface for users to track daily practices, access daily readings, and manage spiritual development packages.

## What is Project Desert?

Project Desert is a spiritual development platform that helps users:
- **Track Ascetical Practices** - Monitor daily commitments like prayer, fasting, reading, etc.
- **Daily Mass Readings** - Access daily Catholic Mass readings with personal note-taking
- **Practice Packages** - Browse and subscribe to curated collections of spiritual practices
- **Progress Tracking** - View statistics, streaks, and completion rates
- **Community Features** - Admin tools for managing users and content

## Architecture

### Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org) with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: Radix UI primitives with custom components
- **State Management**: Zustand for client state, React Query for server state
- **Authentication**: NextAuth.js v5 with Google OAuth
- **Database Adapter**: PostgreSQL Adapter (for auth sessions)
- **API Communication**: Typed OpenAPI client with `openapi-fetch`

### Project Structure

```
frontend/
├── app/                    # Next.js App Router pages
│   ├── admin/             # Admin dashboard and management
│   ├── asceticisms/       # Asceticism tracking pages
│   ├── daily-readings/    # Daily Mass readings
│   └── packages/          # Practice packages browsing
├── components/            # React components
│   ├── admin/            # Admin-specific components
│   ├── asceticisms/      # Asceticism tracking UI
│   ├── daily-readings/   # Reading display components
│   ├── packages/         # Package browsing UI
│   ├── sidebar/          # Navigation sidebar
│   └── ui/               # Reusable UI primitives
├── lib/
│   ├── apiClient.ts      # Typed OpenAPI client
│   ├── services/         # API service layer
│   │   ├── adminService.ts
│   │   ├── asceticismService.ts
│   │   ├── packageService.ts
│   │   └── dailyReadingsService.ts
│   ├── stores/           # Zustand stores
│   └── utils.ts          # Utility functions
├── types/
│   ├── api.ts            # Auto-generated OpenAPI types
│   └── enums.ts          # Enum definitions
├── hooks/                # Custom React hooks
└── auth.ts               # NextAuth configuration

```

### API Architecture

The frontend uses a **fully typed API client** generated from the FastAPI backend's OpenAPI specification:

1. **Type Generation**: OpenAPI TypeScript types auto-generated from backend
2. **Typed Client**: `openapi-fetch` provides compile-time type safety
3. **Service Layer**: Abstraction layer for API calls with proper error handling
4. **No Direct Database Access**: All data flows through the backend API

See [API_CLIENT_GUIDE.md](./docs/API_CLIENT_GUIDE.md) for detailed usage.

## Getting Started

### Prerequisites

- Node.js 20+ and npm
- Docker (for PostgreSQL database)
- Backend API running on `http://localhost:8000`

### Initial Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   Create a `.env.local` file:
   ```env
   # Database (for auth adapter)
   DATABASE_HOST=localhost
   DATABASE_USER=postgres
   DATABASE_PASSWORD=postgres
   DATABASE_NAME=project_desert
   
   # NextAuth
   AUTH_SECRET=your-secret-key-here
   AUTH_GOOGLE_ID=your-google-client-id
   AUTH_GOOGLE_SECRET=your-google-client-secret
   
   # API
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

3. **Start the database**:
   ```bash
   npm run db:up
   ```

4. **Start the backend API** (in another terminal):
   ```bash
   cd ../api
   make backend
   ```

5. **Generate TypeScript types from OpenAPI**:
   ```bash
   npm run generate:types
   ```

6. **Run the development server**:
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Available Commands

### Development

```bash
npm run dev          # Start Next.js development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Database

```bash
npm run db:up        # Start PostgreSQL with Docker Compose
npm run db:down      # Stop PostgreSQL
npm run db:logs      # View PostgreSQL logs
```

### Type Generation

```bash
npm run generate:types   # Generate TypeScript types from backend OpenAPI spec
```

**Note**: Run this command whenever the backend API changes to sync types.

## Key Features

### 1. Asceticism Tracking
- Browse available ascetical practices
- Subscribe to practices with custom start/end dates
- Log daily progress (boolean, numeric, or text entries)
- View statistics: completion rate, current streak, longest streak
- Archive or pause commitments

### 2. Daily Mass Readings
- Access daily Catholic Mass readings from Universalis API
- Cache readings for offline access
- Personal note-taking for each day's readings
- Historical note browsing

### 3. Practice Packages
- Browse curated collections of practices
- One-click subscription to entire packages
- Admin tools to create and manage packages
- Published/draft status management

### 4. Admin Dashboard
- User management (roles, banning)
- Create and manage ascetical practice templates
- Package management
- Role-based access control (USER, MODERATOR, ADMIN)

### 5. Authentication
- Google OAuth integration
- Session management with NextAuth.js
- Role-based permissions
- Ban protection for administrators

## Development Workflow

### Making API Changes

1. Update the backend API (FastAPI)
2. Restart the backend server
3. Regenerate frontend types:
   ```bash
   npm run generate:types
   ```
4. Update service files if needed (types auto-update)

### Adding New Features

1. Define backend API endpoints first
2. Generate types to get TypeScript interfaces
3. Create service functions in `lib/services/`
4. Build UI components using the service layer
5. Add pages in the `app/` directory

### Type Safety

- All API calls are **fully typed**
- Path parameters are validated at compile-time
- Request/response bodies are type-checked
- Enums ensure valid status/role values

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_HOST` | PostgreSQL host | Yes |
| `DATABASE_USER` | PostgreSQL user | Yes |
| `DATABASE_PASSWORD` | PostgreSQL password | Yes |
| `DATABASE_NAME` | PostgreSQL database name | Yes |
| `AUTH_SECRET` | NextAuth secret key | Yes |
| `AUTH_GOOGLE_ID` | Google OAuth client ID | Yes |
| `AUTH_GOOGLE_SECRET` | Google OAuth client secret | Yes |
| `NEXT_PUBLIC_API_URL` | Backend API URL | Yes |

## Additional Documentation

- [API_CLIENT_GUIDE.md](./API_CLIENT_GUIDE.md) - API client usage reference

## Troubleshooting

### Types out of sync
```bash
npm run generate:types
```

### Database connection issues
```bash
npm run db:down
npm run db:up
```

### Port already in use
Kill the process using port 3000 or change the port:
```bash
PORT=3001 npm run dev
```

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [NextAuth.js Documentation](https://authjs.dev)
- [Radix UI](https://www.radix-ui.com)
- [Tailwind CSS](https://tailwindcss.com)
- [OpenAPI TypeScript](https://github.com/drwpow/openapi-typescript)
