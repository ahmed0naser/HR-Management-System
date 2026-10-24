# HR Management System (Backend)

REST API for employee management, attendance tracking and leave approvals, built with **NestJS, TypeORM and PostgreSQL**. A React frontend is planned.

> **Status:** work in progress. Auth, users, attendance and leave requests are done. Payroll, tasks, notifications and dashboards are not built yet (see [Roadmap](#roadmap)).

## Features

**Authentication and security**

- JWT login with refresh-token rotation (refresh tokens are hashed, single-use and revocable)
- Tokens delivered in httpOnly cookies, not in the response body
- Logout revokes every active session of the user
- Password reset by email (hashed, single-use, 5-minute link) with account-enumeration protection
- Audit log of every login attempt (email, IP, success or failure)
- Role-based access control for five roles, plus ownership and team-scoped checks in the services

**Users**

- Employee profiles with CRUD, pagination and soft-delete (status set to `Terminated`)
- Profile photo upload (Multer, image-only, 5 MB limit, owner-only)
- Manager relation: each employee can report to a manager, and managers see only their own team

**Attendance**

- Security officers record daily attendance per employee
- Admin/HR configure shift rules (start and end time, late tolerance, deduction rates)
- Lateness is computed from the employee's shift at entry time and stored as a snapshot
- Records are editable on the same day only

**Leave and permission requests**

- Six request types: Annual, Sick, Emergency, Exit, WorkFromHome, Unpaid
- The approval chain (manager, HR, or both) lives in one constant (`APPROVAL_CHAIN`)
- Employees with no manager skip the manager step
- Annual leave balance is checked at creation and re-checked at approval, then deducted inside a database transaction with row locking, so approving twice never deducts twice
- HR cannot approve their own requests
- Employees can cancel pending requests (the row is kept)

## Tech stack

NestJS 11, TypeScript, TypeORM, PostgreSQL, Passport (local and JWT strategies), bcrypt, class-validator, Multer, Nodemailer (`@nestjs-modules/mailer`)

## Getting started

**Prerequisites:** Node.js 20+, PostgreSQL, and a Mailtrap (or any SMTP) account for password-reset emails.

```bash
git clone https://github.com/ahmed0naser/HR-Management-System
cd HR-management-system/backend
npm install
```

Create a database named `HR_System`, then create `backend/.env`:

```env
NODE_ENV=dev
PORT=3000

HOST=localhost
PG_PORT=5432
PG_USERNAME=postgres
PG_PASSWORD=your_password

JWT_SECRET=a_long_random_string
JWT_EXPIRES=15m

MAIL_HOST=sandbox.smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USER=your_mailtrap_user
MAIL_PASSWORD=your_mailtrap_password
MAIL_FROM=no-reply@hr-system.local
```

Create the upload folder, then start the server:

```bash
mkdir -p uploads/photos
npm run start:dev
```

The API runs at `http://localhost:3000/api/v1`.

**Notes**

- Tables are created automatically only when `NODE_ENV=dev` (TypeORM `synchronize`). There are no migrations yet.
- There is no public signup and no seed script. To create the first Admin, temporarily remove the guards from `POST /users`, create the account, then restore the guards.
- CORS allows `http://localhost:5173` with credentials.

## Roles

| Role             | Can do                                                                                       |
| ---------------- | -------------------------------------------------------------------------------------------- |
| Admin            | Manage users (only Admin can terminate them), configure shift rules, view all leave requests |
| HR_Manager       | Manage users, configure shift rules, give final approval on leave requests                   |
| Manager          | Approve their team's leave requests, view their team's attendance                            |
| Security_Officer | Record and edit same-day attendance                                                          |
| Employee         | Submit and cancel own leave requests, view own attendance records                            |

## API overview

All routes are prefixed with `/api/v1`. Except login and password reset, they need the auth cookie.

| Area           | Endpoints                                                                                                                                                  |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Auth           | `POST /auth/login`, `/auth/refresh`, `/auth/logout`, `/auth/forgot-password`, `/auth/reset-password/:token`                                                |
| Users          | `GET/POST /users`, `GET/PATCH/DELETE /users/:id`, `POST /users/profile-pic/:id`                                                                            |
| Shift rules    | `GET/POST /attendance-rule`, `GET /attendance-rule/:shift`, `PATCH /attendance-rule/:id`                                                                   |
| Attendance     | `POST/GET /attendance`, `GET/PATCH /attendance/:id`                                                                                                        |
| Leave requests | `POST/GET /permissions`, `GET /permissions/my`, `GET/DELETE /permissions/:id`, `PATCH /permissions/:id/manager-action`, `PATCH /permissions/:id/hr-action` |

## Project structure

```
backend/src/
  auth/         login, refresh, logout, password reset, strategies
  users/        user entity, CRUD, photo upload
  attendance/   attendance records and shift rules
  permissions/  leave requests and approval workflow
  Mail/         email sending
  common/       enums, guards, decorators, shared types, constants
```

## Design decisions

- **Refresh tokens are hashed and rotated**, so a leaked database cannot be used to hijack sessions and a stolen token works only once.
- **Ownership and team checks live in services, not guards**, because they need the record loaded from the database anyway.
- **`isLate` is stored when the attendance is recorded**, so changing a shift rule later does not rewrite history.
- **The approval chain is data, not code.** Adding or changing a request type is a one-line edit.

## Known limitations

- No automated tests yet
- `User.department` is a plain text label, not a separate entity
- The password-reset email link points at the API endpoint; a frontend page will replace it
- No overlap detection for leave requests
- Cancel and reject are not locked against a simultaneous HR approval
- Attendance reports and exports are not implemented

## Roadmap

- [ ] Payroll and payslip PDFs
- [ ] Task management with overdue tracking
- [ ] Real-time notifications
- [ ] Dashboards and analytics
- [ ] Swagger documentation and tests
- [ ] React frontend
