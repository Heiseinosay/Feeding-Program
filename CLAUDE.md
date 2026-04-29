# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A student feeding program management system for teachers. Teachers log in, manage students (CRUD + BMI tracking), create feeding sessions, record attendance, and view analytics.

## Commands

### Start Everything
```bat
start.bat        # Launches both client and server in separate terminal windows
```

### Frontend (from `client/`)
```bash
npm start        # Dev server on port 3000
npm run build    # Production build
npm test         # Run Jest tests
```

### Backend (from `server/`)
```bash
python server.py           # Dev server on port 5000
gunicorn server:app        # Production WSGI server
```

### Database
Import the SQL dump manually before first run:
```sql
-- In MySQL Workbench or CLI:
source Dump-FeedingProgram20260307.sql
```

## Architecture

**Monorepo** with two independent services:
- `client/` — React 19 SPA (CRA), served on port 3000
- `server/` — Flask REST API, served on port 5000

### Frontend Structure

- `client/src/api.js` — Axios instance with Bearer token injection and auto-refresh on 401 (interceptor calls `/api/auth/refresh` and retries original request)
- `client/src/App.js` — React Router v7 setup; protected routes redirect to `/login` if no token
- `client/src/pages/` — One file per page: `Login`, `Dashboard`, `Students`, `FeedingProgram`, `Profile`, `ChangePassword`
- `client/src/components/Loading.jsx` — Only shared UI component
- Token storage: access token in memory (module-level variable in `api.js`); refresh token in httpOnly cookie

### Backend Structure

- `server/server.py` — Flask app factory, all route registrations, JWT config
- `server/dbutils.py` — MySQL connection factory (credentials hardcoded for dev)
- `server/auth.py`, `students.py`, `section.py`, `session.py`, `charts.py` — Business logic functions called by route handlers in `server.py`

All API routes are prefixed `/api/`. Route groups:
| Prefix | Module | Purpose |
|--------|--------|---------|
| `/api/auth_*`, `/api/auth/*` | auth.py | Login, logout, token refresh, password change, profile |
| `/api/*student*` | students.py | Student CRUD, BMI measurements |
| `/api/*section*` | section.py | Sections/classes |
| `/api/*session*` | session.py | Feeding sessions (pending → completed/cancelled) |
| `/api/*status*`, `/api/bmi_trend` | charts.py | Dashboard analytics |

### Database Schema

MySQL database `FeedingProgram`. Key tables:
- `tblTeachers` — user accounts (teacher_id, email, Password)
- `tblStudents` — student records with BMI stored as JSON arrays (`bmi`, `bmi_measurement`, `measurement_date` columns hold arrays of historical values)
- `tblSections` — class sections linked to a teacher
- `tblSessions` — feeding sessions with `status` enum (`pending`/`completed`/`cancelled`) and `participating_section` as JSON
- `tblAttendance` — per-student attendance per session

## Environment

### Frontend — `client/.env`
```
REACT_APP_API_BASE=http://localhost:5000/api
```

### Backend — hardcoded in `server/dbutils.py` for dev
Database credentials and JWT secret are embedded in code for local development. The JWT secret defaults to `"dev-secret-change-me"` in `server/server.py`.

## Key Patterns

- **BMI history** is stored as JSON arrays inside single DB columns, not as separate rows. Append to the array on each measurement update.
- **Session lifecycle**: sessions start as `pending`, teacher marks them `completed` or `cancelled`. Attendance is only recorded for `completed` sessions.
- **CORS**: restricted to `http://localhost:3000`; cookie flags (`secure=False`, `CSRF_PROTECT=False`) are set for local dev only.
