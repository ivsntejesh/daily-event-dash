# Dashboard Application

## Overview

This is a modern full-stack web application built with React, Express, and Supabase. The application provides task and event management capabilities with both private and public sharing features. It includes user authentication, role-based access control, and integration with Google Sheets for data synchronization.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

**July 15, 2025 - Smart Google Sheets Sync Implementation**
- Implemented comprehensive smart sync algorithm to prevent duplicates
- Added duplicate detection using unique keys (title + date + time)
- Implemented update detection for changed items
- Added automatic deletion of items removed from sheet
- Handles both tasks (single time) and events (time ranges) correctly
- Uses time format normalization for accurate comparisons
- Edge cases handled: empty fields, different time formats, new additions

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: React hooks and context for authentication
- **Data Fetching**: Custom hooks with Supabase client
- **Routing**: React Router for client-side navigation
- **Build Tool**: Vite for development and production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL via Supabase with Drizzle ORM
- **Authentication**: Supabase Auth
- **API**: RESTful endpoints (to be implemented)

### Component Structure
- **UI Components**: Reusable components in `client/src/components/ui/`
- **Feature Components**: Domain-specific components for events, tasks, auth
- **Pages**: Route-level components in `client/src/pages/`
- **Hooks**: Custom React hooks for data management and business logic

## Key Components

### Authentication System
- Supabase Auth integration with email/password authentication
- Protected routes using `ProtectedRoute` component
- Role-based access control with admin/moderator/user roles
- Authentication context provider for global state management

### Event Management
- Private events (user-specific) and public events (shared)
- Event CRUD operations with real-time updates
- Calendar view and dashboard view modes
- Event filtering and searching capabilities
- Support for online/in-person events with meeting links

### Task Management
- Private and public task management
- Task completion tracking and priority levels
- Time-based task scheduling with start/end times
- Task filtering by status, priority, and timeframe

### Data Synchronization
- Google Sheets integration for bulk data import
- Scheduled synchronization using Supabase Edge Functions
- Admin-only sync management dashboard
- Error handling and logging for sync operations

### User Interface
- Responsive design with mobile-first approach
- Dark/light mode support via CSS variables
- Consistent design system using shadcn/ui components
- Accessible components following ARIA guidelines

## Data Flow

### Authentication Flow
1. User signs in via Supabase Auth
2. Authentication state stored in React context
3. Protected routes check authentication status
4. User role fetched from `user_roles` table

### Event/Task Management Flow
1. User creates/edits events or tasks via forms
2. Data validated on client-side using Zod schemas
3. Submitted to appropriate Supabase table (private or public)
4. Real-time updates via Supabase subscriptions
5. UI updates automatically through custom hooks

### Sync Process Flow
1. Admin triggers manual sync or scheduled cron job runs
2. Supabase Edge Function fetches Google Sheets data
3. Data validated and processed in batches
4. New records inserted, existing records updated
5. Sync logs created for monitoring and debugging

## External Dependencies

### Core Dependencies
- **Supabase**: Backend-as-a-Service for database, auth, and real-time features
- **Drizzle ORM**: Type-safe database queries and migrations
- **React Query/TanStack Query**: Server state management
- **Radix UI**: Headless UI primitives for accessibility
- **Tailwind CSS**: Utility-first CSS framework

### Development Tools
- **Vite**: Fast build tool and development server
- **TypeScript**: Type safety and developer experience
- **ESLint/Prettier**: Code quality and formatting
- **PostCSS**: CSS processing and optimization

### Database Schema
- **users**: User authentication and profile data
- **user_roles**: Role-based access control
- **events**: Private user events
- **public_events**: Shared community events
- **tasks**: Private user tasks
- **public_tasks**: Shared community tasks
- **sync_log**: Synchronization monitoring and debugging

## Deployment Strategy

### Development Environment
- Vite dev server for hot reloading
- Express server with middleware mode
- Environment variables for Supabase configuration
- Local database connection via DATABASE_URL

### Production Build
- Vite builds optimized React application
- ESBuild bundles Express server
- Static assets served from `/dist/public`
- Node.js server handles API routes and serves SPA

### Database Management
- Drizzle migrations for schema changes
- PostgreSQL hosted on Supabase
- Connection pooling via @neondatabase/serverless
- Environment-based configuration

### Edge Functions
- Supabase Edge Functions for server-side logic
- Google Sheets synchronization
- Scheduled tasks via pg_cron
- CORS handling for cross-origin requests

The application follows modern web development best practices with separation of concerns, type safety, and scalable architecture patterns. The modular structure allows for easy feature additions and maintenance.