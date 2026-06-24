# Internal Company Communication Platform

A secure, enterprise-grade internal communication platform for company employees. The application functions similarly to Slack or Microsoft Teams but is designed to be self-hosted on company-controlled infrastructure.

---

## Tech Stack Overview

- **Frontend Client**: Next.js (App Router), Tailwind CSS (v4), TypeScript, Socket.io Client, Redux Toolkit, TanStack React Query.
- **Backend Server**: Node.js, Express, Socket.io, JWT Authentication, BcryptJS, Multer (local secure storage), PDFKit, ExcelJS.
- **Database**: MongoDB (Mongoose ORM).

---

## Folder Architecture

```text
rm-chat-app/
├── client/                 # Next.js Frontend Application
│   ├── src/
│   │   ├── app/            # Next.js App Router (login, dashboard, pages)
│   │   ├── components/     # UI modules (chat, announcements, files, settings, admin)
│   │   ├── hooks/          # Global hooks (useSocket)
│   │   ├── store/          # Redux Toolkit store and slices (auth, chat, ui)
│   │   └── utils/          # apiClient helper (Axios)
│   └── package.json
└── server/                 # Express Backend Server & WebSockets
    ├── src/
    │   ├── config/         # Mongoose DB connections
    │   ├── controllers/    # API handlers (auth, users, depts, chats, files, stats)
    │   ├── middleware/     # JWT verification, RBAC, file filter, audit logger
    │   ├── models/         # Mongoose Schemas (User, Chat, File, Notification, etc.)
    │   ├── routes/         # Express Router indices
    │   ├── scripts/        # Seeding databases
    │   └── sockets/        # Socket.io connection and event listeners
    ├── uploads/            # Secure local uploads folder
    └── package.json
```

---

## Quick Start Guide

### 1. Database & Backend Configuration

Make sure a MongoDB instance is available (or supply a MongoDB Atlas connection string).

1. Open a terminal and navigate to the backend server directory:
   ```bash
   cd server
   ```
2. Initialize environment configurations:
   - Copy `.env.example` to `.env`.
   - Update `MONGO_URI` if using a remote MongoDB Atlas cluster.
3. Install dependencies:
   ```bash
   npm install
   ```
4. Run the seed script to populate default department directories, collaboration teams, and test user profiles:
   ```bash
   npm run seed
   ```
5. Start the backend Express server:
   ```bash
   npm run dev
   ```
   The backend will bootstrap on `http://localhost:5000`.

---

### 2. Frontend Client Bootstrapping

1. In a separate terminal tab, navigate to the client directory:
   ```bash
   cd client
   ```
2. Install client dependencies:
   ```bash
   npm install
   ```
3. Start the Next.js development server:
   ```bash
   npm run dev
   ```
   The client will load on `http://localhost:3000`. Open your browser to preview.

---

## Default Seeding Credentials

After running `npm run seed`, use any of the following accounts to test the app:

| Employee ID | Name | Email | Password | Role / Department |
| :--- | :--- | :--- | :--- | :--- |
| **EMP001** | System Admin | `admin@company.com` | `adminPassword123` | Administrator |
| **EMP002** | Sarah Jenkins | `sarah.hr@company.com` | `sarahPassword123` | Department Head (HR) |
| **EMP003** | Marcus Chen | `marcus.dev@company.com` | `marcusPassword123` | Department Head (Development) |
| **EMP004** | John Doe | `john.dev@company.com` | `johnPassword123` | Employee (Development) |
| **EMP006** | Diana Prince | `diana.mkt@company.com` | `dianaPassword123` | Department Head (Marketing) |
