# Inventory Management System

## Overview

This is a full-stack inventory management system built with React, Express.js, and PostgreSQL. The application provides a comprehensive solution for managing products, categories, stock movements, and user authentication with role-based access control.

## System Architecture

### Frontend Architecture
- **React 18** with function components and hooks
- **Vite** as the build tool and development server
- **Wouter** for client-side routing (lightweight alternative to React Router)
- **TanStack React Query** for server state management and caching
- **Tailwind CSS** with **shadcn/ui** component library for styling
- **TypeScript** for type safety

### Backend Architecture
- **Express.js** server with TypeScript
- **Drizzle ORM** for database operations and schema management
- **PostgreSQL** database (configured for Neon serverless)
- **JWT-based authentication** with bcrypt for password hashing
- **Role-based access control** (user/admin roles)

### Database Design
- **Users**: Authentication and role management
- **Categories**: Product categorization
- **Products**: Inventory items with stock tracking
- **Stock Movements**: Audit trail for inventory changes

## Key Components

### Authentication System
- JWT token-based authentication
- Password hashing with bcrypt
- Role-based access control (user/admin)
- Protected routes and middleware
- Context-based auth state management

### Inventory Management
- CRUD operations for products and categories
- Stock level tracking with minimum thresholds
- Stock movement history and audit trail
- Search and filtering capabilities
- Pagination for large datasets

### User Interface
- Responsive design with Tailwind CSS
- Modern component library (shadcn/ui)
- Dashboard with statistics and charts
- Real-time data updates with React Query
- Toast notifications for user feedback

### API Structure
- RESTful endpoints for all resources
- Consistent error handling and validation
- Input sanitization with Zod schemas
- Request logging and monitoring

## Data Flow

1. **Authentication Flow**:
   - User credentials → JWT token generation
   - Token stored in localStorage
   - Auth context provides user state globally
   - Protected routes check authentication status

2. **Inventory Operations**:
   - Frontend forms → API validation → Database operations
   - Real-time updates through React Query cache invalidation
   - Stock movements logged for audit purposes

3. **State Management**:
   - Server state: React Query for API data
   - Client state: React hooks and context
   - Form state: Controlled components with validation

## External Dependencies

### Frontend Dependencies
- **@tanstack/react-query**: Server state management
- **@radix-ui/react-***: Accessible UI primitives
- **tailwindcss**: Utility-first CSS framework
- **wouter**: Lightweight routing
- **date-fns**: Date manipulation
- **zod**: Schema validation

### Backend Dependencies
- **drizzle-orm**: Type-safe ORM
- **@neondatabase/serverless**: PostgreSQL driver
- **bcrypt**: Password hashing
- **jsonwebtoken**: JWT token handling
- **express**: Web framework

## Deployment Strategy

The application is configured for deployment on Replit with:
- **Development mode**: Vite dev server with hot module replacement
- **Production build**: Static files served by Express
- **Environment variables**: Database URL and JWT secret
- **Database migrations**: Drizzle Kit for schema management

Build process:
1. Frontend: Vite builds React app to `dist/public`
2. Backend: esbuild bundles Node.js server to `dist/index.js`
3. Production: Single Express server serves both API and static files

## Changelog

- July 08, 2025. Initial setup with PostgreSQL database
- July 08, 2025. Migrated from PostgreSQL to MongoDB Atlas
  - Added MongoDB schemas and storage layer
  - Integrated with user's MongoDB Atlas cluster
  - Created fallback in-memory storage for development
  - Firebase Google OAuth integration maintained

## User Preferences

Preferred communication style: Simple, everyday language.