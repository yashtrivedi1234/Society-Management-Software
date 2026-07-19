# Society Manager — Backend

Express (ESM) + Mongoose API for the society / RWA management app.

## Setup

```bash
cp .env.example .env
npm install
npm run seed
npm run dev
```

Base URL: `http://localhost:5000/api/v1`

## Auth

- `POST /auth/login` — `{ email, password }`
- `GET /auth/me` — Bearer token

Demo users are created by `npm run seed` (see root README).
