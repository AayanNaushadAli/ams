# Lumina AMS — Attendance Management System

A modern, full-stack **Attendance Management System** built with Next.js 14, designed for colleges and schools. Supports three roles: **Admin**, **Teacher**, and **Student**, with class-based attendance tracking and multi-class enrollment.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Database | PostgreSQL (Neon DB / any Postgres) |
| ORM | Prisma 7 |
| Auth | NextAuth.js (JWT + Credentials) |
| Styling | Tailwind CSS |
| Charts | Recharts |
| Icons | Lucide React |

---

## Features

### Admin Dashboard
- **User Management** — View all users, change roles (Admin/Teacher/Student), delete users
- **Class Management** — Create classes with name + code (e.g. "Data Structures" / "CS201-A"), delete classes
- **Multi-Class Enrollment** — Enroll students in multiple classes via a checkbox modal (college-style)
- **Session Security** — JWT automatically invalidates if a user is deleted from the database

### Teacher Dashboard
- **Class Selector** — Pick a class to view its enrolled students
- **Create Classes** — Teachers can also create new classes
- **Mark Attendance** — Mark students as Present/Absent per class per day
- **Date Picker** — Mark attendance for any date
- **Search** — Filter students by name

### Student Dashboard
- **Attendance Overview** — Pie chart showing Present/Absent/Late breakdown with percentage
- **History** — Recent attendance records showing class name, code, date, and status
- **Stats** — Total classes attended vs total records

### Authentication
- **Login** — Email + password with JWT session
- **Register** — Self-registration with name, email, password, and role selection
- **Password Security** — Passwords hashed with bcryptjs
- **Role-Based Routing** — Redirects to the correct dashboard based on role

---

## Database Schema

```
User ──┐
       ├── Enrollment (many-to-many) ──── Class
       └── Attendance ─────────────────── Class
```

- **User** — id, email, password, name, role (ADMIN/TEACHER/STUDENT)
- **Class** — id, name, code (unique), teacherId (optional)
- **Enrollment** — studentId + classId (unique pair) — allows students in multiple classes
- **Attendance** — studentId + classId + date (unique) — one record per student per class per day

---

## Prerequisites

Before running locally, ensure you have these installed:

| Dependency | Version | Install |
|---|---|---|
| **Node.js** | v18+ | [nodejs.org](https://nodejs.org) |
| **npm** | v9+ | Comes with Node.js |
| **PostgreSQL** | Any (or use Neon DB) | [neon.tech](https://neon.tech) (free hosted) |

---

## Local Setup

### 1. Clone the repo
```bash
git clone https://github.com/AayanNaushadAli/ams.git
cd ams
```

### 2. Install dependencies
```bash
npm install
```

This installs all required packages:
- `next`, `react`, `react-dom` — Framework
- `@prisma/client`, `prisma`, `@prisma/adapter-pg`, `pg` — Database ORM & driver
- `next-auth` — Authentication
- `bcryptjs` — Password hashing
- `recharts` — Charts
- `lucide-react` — Icons
- `tailwindcss`, `postcss` — Styling
- `typescript`, `eslint` — Dev tools

### 3. Set up environment variables
Create a `.env` file in the project root:
```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require"
NEXTAUTH_SECRET="your-random-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"
```

- **DATABASE_URL** — Your PostgreSQL connection string (get one free from [neon.tech](https://neon.tech))
- **NEXTAUTH_SECRET** — Any random string (generate one with `openssl rand -base64 32`)
- **NEXTAUTH_URL** — Your app URL (use `http://localhost:3000` for local dev)

### 4. Push the database schema
```bash
npx prisma db push
```

### 5. Generate Prisma client
```bash
npx prisma generate
```

### 6. Run the dev server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Usage Guide

### Getting Started
1. **Register** — Go to `/register` and create an account (first user should pick any role, then promote to ADMIN via Prisma Studio)
2. **Make yourself Admin** — Run `npx prisma studio`, go to the User table, change your role to `ADMIN`

### As Admin
1. Go to **Classes tab** → Create classes (e.g. "Data Structures" / "CS201-A")
2. Go to **Users tab** → Click **"+ Manage"** next to any student → check the classes they should be enrolled in → Save
3. Change user roles as needed (Student → Teacher, etc.)

### As Teacher
1. Select a class from the dropdown
2. View enrolled students with their current attendance status
3. Click ✓ (Present) or ✗ (Absent) for each student
4. Click **Save Attendance**

### As Student
1. View your overall attendance percentage in the pie chart
2. See your recent attendance history with class names and dates

---

## Project Structure

```
lumina-ams/
├── app/
│   ├── admin/dashboard/       # Admin dashboard (users + classes management)
│   ├── teacher/dashboard/     # Teacher dashboard (attendance marking)
│   ├── student/dashboard/     # Student dashboard (attendance view)
│   ├── login/                 # Login page
│   ├── register/              # Registration page
│   ├── components/            # Shared components (UserMenu)
│   ├── api/
│   │   ├── auth/register/     # Registration API
│   │   ├── admin/users/       # Admin user management API
│   │   ├── classes/           # Class CRUD API
│   │   ├── classes/students/  # Enrollment API
│   │   ├── teacher/students/  # Fetch enrolled students API
│   │   ├── teacher/attendance/# Save attendance API
│   │   └── student/attendance/# Student attendance history API
│   ├── globals.css            # Global styles
│   ├── layout.tsx             # Root layout
│   └── page.tsx               # Landing page
├── lib/
│   ├── auth.ts                # NextAuth configuration
│   └── db.ts                  # Prisma client
├── prisma/
│   └── schema.prisma          # Database schema
├── types/
│   └── next-auth.d.ts         # TypeScript type extensions
├── .env                       # Environment variables (not committed)
├── package.json               # Dependencies
└── tailwind.config.ts         # Tailwind configuration
```

---

## Build for Production

```bash
npm run build
npm start
```

---

## License

This project is for educational purposes.
