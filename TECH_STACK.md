# Technology Stack Documentation

This project is a modern, high-performance web application built with the latest web standards. Below is a detailed breakdown of the technologies used and their specific roles in the application.

## 1. Core Framework & Language
- **Next.js 16 (App Router):** The main framework for both Frontend and Backend.
  - *Usage:* Routing (`src/app`), API endpoints (`src/app/api`), and server-side rendering.
  - *Why:* Provides fast performance, SEO benefits, and a unified development experience.
- **TypeScript:** The programming language used throughout the project.
  - *Usage:* All `.ts` and `.tsx` files.
  - *Why:* Adds static typing to JavaScript, reducing bugs and improving code quality.

## 2. Frontend (User Interface)
- **React 19:** The library for building user interfaces.
  - *Usage:* Building components like Buttons, Cards, and Tables.
- **Tailwind CSS 4:** A utility-first CSS framework for styling.
  - *Usage:* All styling (e.g., `className="p-4 bg-white"`).
  - *Why:* Allows for rapid UI development and easy responsive design.
- **Framer Motion:** A library for production-ready animations.
  - *Usage:* Smooth transitions between pages and interactive elements.
- **Lucide React:** A clean icon library.
  - *Usage:* Icons for "Edit", "Delete", "Add", etc.
- **Glassmorphism:** A design style using background blur and transparency.
  - *Usage:* `GlassCard` component (`bg-white/30 backdrop-blur-md`).

## 3. Backend & Database
- **Next.js API Routes:** Serverless functions that handle backend logic.
  - *Usage:* `src/app/api/...` (e.g., fetching faculty, saving subjects).
- **Prisma ORM:** A next-generation Object-Relational Mapper.
  - *Usage:* Interacting with the database (creating, reading, updating, deleting data).
  - *Why:* Type-safe database queries.
- **SQLite:** The relational database engine.
  - *Usage:* Local file-based database (`prisma/dev.db`).
  - *Why:* Lightweight, zero-configuration, and perfect for development/embedded apps.

## 4. Authentication & Security
- **Firebase Authentication:** Google's identity platform.
  - *Usage:* Handling user login (Email/Password) and secure token management.
- **RBAC (Role-Based Access Control):** Custom logic to manage permissions.
  - *Usage:* `src/middleware.ts` or API checks.
  - *Roles:* PRINCIPAL (Full Access), HOD (Department Access), FACULTY (View Only).

## 5. State Management
- **React Context API:** Native React state management.
  - *Usage:* `AuthContext` to manage the currently logged-in user across the app.
- **Zustand:** A small, fast state management library.
  - *Usage:* (Optional) Managing global UI state if needed.

## 6. Utilities & Logic
- **xlsx (SheetJS):** Excel file parser.
  - *Usage:* Reading data from uploaded Excel files and generating Excel reports.
- **clsx & tailwind-merge:** Utilities for constructing CSS class strings conditionally.
  - *Usage:* Merging custom classes in reusable components.

## 7. Project Structure Overview
- `src/app/`: Contains all pages and API routes.
- `src/components/`: Reusable UI blocks (Buttons, Inputs).
- `src/lib/`: Helper functions (Database connection, Algorithm logic).
- `prisma/`: Database schema and migration files.
- `public/`: Static assets (Images, Fonts).

---
*Created by Antigravity*
