# Clave Society

Society management software — React frontend + Express backend.

## Structure

```
frontend/   # Vite + React app
backend/    # Express + MongoDB API
```

## Frontend

```bash
cd frontend
cp .env.example .env   # already points at Render API
npm install
npm run dev
```

## Backend

```bash
cd backend
cp .env.example .env
npm install
npm run seed           # demo users into MongoDB
npm run dev
```

## Demo login (after seed)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@clave.demo | Admin@123 |
| Accountant | accountant@clave.demo | Account@123 |
| Member | member@clave.demo | Member@123 |
