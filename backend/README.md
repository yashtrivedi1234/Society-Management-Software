# Clave Society Backend

Express.js (ES Modules) + Mongoose backend for Clave Society.

## Setup

1. Copy `.env.example` to `.env`
2. Install dependencies:
   - `npm install`
3. Run dev server:
   - `npm run dev`

## Base URL

- `http://localhost:5000/api/v1`

## Implemented Modules

- Auth: `POST /auth/register`, `POST /auth/login`, `GET /auth/me`
- Members: CRUD endpoints under `/members`
- Payments: list/create/mark-paid under `/payments`

## Notes

- Use `Authorization: Bearer <token>` for protected routes.
- Default CORS origin is `http://localhost:5173`.
