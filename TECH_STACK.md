# Technology Stack: College Timetable System

Our Timetable Generation System leverages a modern, robust, and highly scalable stack designed for maximum efficiency both on the frontend UI and the backend scheduling engine.

---

## 1. Core Framework: Next.js (React)
- **What it is**: A React framework that enables server-side rendering and static web applications.
- **Where it's used**: The entire application is built on Next.js using the modern App Router architecture (`src/app`). It handles routing the users between the Dashboard, Login pages, and generating API endpoints locally.

## 2. Language: TypeScript
- **What it is**: A strongly typed programming language that builds on JavaScript.
- **Where it's used**: Used globally (`.ts` and `.tsx` files). It defines the exact shape of our Core Algorithm objects (`Event`, `Slot`, `Booking`, `Schedule`) and ensures the heavily mathematical constraint logic is strictly checked before runtime to prevent bugs.

## 3. Database & ORM: Prisma + SQLite
- **What it is**: Prisma is a next-generation Node.js and TypeScript Object-Relational Mapper (ORM). SQLite is our local database.
- **Where it's used**: 
  - Prisma is configured in `prisma/schema.prisma`. 
  - It handles all operations mapping backend data definitions into the frontend interface. We use it to store and query the `Faculty`, `Sections`, `Subjects`, `Rooms`, and generated `Timetable` grids.
  - The local `dev.db` SQLite database is used for rapid, lightweight offline development without needing an external SQL server.

## 4. Styling & UI: Tailwind CSS & Framer Motion
- **What it is**: Tailwind is a utility-first CSS framework. Framer Motion is a production-ready animation library.
- **Where it's used**: 
  - Tailwind powers the entire visual aesthetic (e.g., the Deep Velvet and Molten Gold themes, the sleek Glassmorphism login page). It is used directly on HTML classNames in the React components.
  - Framer Motion animates the interactive elements, such as the loading spinner overlay when generating a timetable, or the smooth Fade-In route transitions used on Dashboard elements.

## 5. State Management: Zustand & Context API
- **What it is**: Lightweight state management solutions for React applications.
- **Where it's used**: 
  - Built-in React Contexts (`AuthContext.tsx`) are used to persistently store and check the `User` object across the entire application router, gating the Dashboard layout and redirecting unauthenticated users to `/login`.

## 6. Authentication: Firebase
- **What it is**: Google's Backend-as-a-Service providing secure identity management.
- **Where it's used**: Configured in `src/lib/firebase.ts`. It provides standard `signInWithEmailAndPassword` logic for logging in the Principal, HOD, and Faculty.

## 7. Data Parsing & Export Pipeline: ExcelJS & XLSX
- **What it is**: Libraries specifically designed to read, manipulate, and export Microsoft Excel (`.xlsx`) spreadsheets natively in Node.
- **Where it's used**:
  - `xlsx`: Reads the raw uploaded curriculum files (e.g., `test.xlsx`) inside `/api/system/reset/route.ts` and parses them into Prisma database entries for `Rooms` and `Faculty`.
  - `exceljs`: Creates a deeply formatted buffer in `src/lib/excel-export.ts`. It handles the automated downloading of the final timetable grid—applying proper column scaling, cell alignment, text wrapping, and colors so the output sheet is immediately readable by university staff.

## 8. Icons: Lucide React
- **What it is**: A clean, customizable SVG icon set.
- **Where it's used**: Throughout the Next UI components (e.g. `Download`, `LogOut`, `Users`, `Calendar` icons on the Dashboard Menu and Export buttons).
