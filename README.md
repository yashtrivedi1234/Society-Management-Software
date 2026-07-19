# Society Manager

Residential society / RWA management software — React frontend + Express API.

Sample society in this demo: **Green Valley Residency** (Gurugram).

## What this software does

| Area | Modules |
|------|---------|
| Finance | Dashboard KPIs, maintenance collection, payments, expenses, ledger, invoices, reports |
| Community | Members directory, visitor gate, notices, complaints helpdesk |
| Amenities | Facility booking (hall, courts, etc.) |
| Operations | Staff, parking, parcels, emergency alerts, documents |
| Governance | Polls, events/RSVP, announcements |
| Resident portal | My Flat — dues, complaints, guest pre-approval |

## Roles to show the client

| Role | Login | What they see |
|------|-------|----------------|
| Admin | `admin@greenvalley.demo` / `Admin@123` | Full RWA console |
| Accountant | `accountant@greenvalley.demo` / `Account@123` | Finance-focused views |
| Member | `member@greenvalley.demo` / `Member@123` | Resident “My Flat” portal |

On the login screen, click a role button to auto-fill credentials.

## Suggested demo walkthrough (10–12 min)

1. **Login as Admin** — show dashboard (collected / pending / expenses / balance).
2. **Maintenance** — pending flats, mark payment, WhatsApp reminder.
3. **Expenses + Ledger** — add expense, show monthly accounts.
4. **Members + Visitors** — directory, check-in a visitor.
5. **Notices + Complaints** — post notice, open a ticket.
6. **Facility Booking** — book community hall.
7. **Logout → Member** — My Flat: dues, raise complaint, pre-approve guest.
8. **Optional: Accountant** — payments & reports focus.

## Run locally

```bash
# API
cd backend
cp .env.example .env   # set MONGODB_URI
npm install
npm run seed
npm run dev

# App (new terminal)
cd frontend
cp .env.example .env   # points at your API
npm install
npm run dev
```

Frontend: http://localhost:5173  
Backend: http://localhost:5000/api/v1

## Structure

```
frontend/   Vite + React
backend/    Express + MongoDB
```
