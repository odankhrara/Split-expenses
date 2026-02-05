# Consumer Bill-Splitting Web Application

- **React frontend** – 5+ user flows: creating groups, adding expenses, tracking balances in real time.
- **Go backend** – REST APIs for users, shared expenses, and settlement logic.
- **Correctness** – Relational schemas and validation for shared payment data; no balance drift (partial payments, uneven splits, rounding).

## Requirements

- **Backend:** Go 1.21+
- **Frontend:** Node.js 18+ and npm

## Quick Start

### Backend

```bash
cd backend
go mod download
go run ./cmd/server
```

- API: **http://localhost:8080**
- Data: `./data/billsplit.db` (override with `DATA_DIR`)
- Port: `PORT` env (default 8080)

### Frontend

```bash
cd frontend
npm install
npm run dev
```

- App: **http://localhost:5173**
- API URL: `VITE_API_URL` (default http://localhost:8080/api)

## User Flows

1. **People** – Create and list users for group membership.
2. **Groups** – List groups and open a group.
3. **Create group** – Name, currency, select members.
4. **Group detail** – Members, add member, expenses, balances; links to add expense, balances, settle up.
5. **Add expense** – Payer, amount, description; even split or custom splits (must sum to amount).
6. **Balances** – Per-user net balance; auto-refresh every 5s.
7. **Settle up** – Record payments (from → to, amount); partial payments supported.

## REST API

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/users | Create user |
| GET | /api/users | List users |
| POST | /api/groups | Create group |
| GET | /api/groups | List groups |
| GET | /api/groups/:id | Get group |
| POST | /api/groups/:id/members | Add member |
| GET | /api/groups/:id/expenses | List expenses |
| POST | /api/groups/:id/expenses | Create expense |
| GET | /api/groups/:id/balances | Get balances |
| GET | /api/groups/:id/settlements | List settlements |
| POST | /api/groups/:id/settlements | Record settlement |

## Data and Correctness

- All amounts in **cents** (integer) to avoid float drift.
- **Expense splits:** Custom splits must sum to `amount_cents`; even split uses integer division and remainder so total is exact.
- **Balances:** `balance[u] = paid - share - sent_settlements + received_settlements`.
- **Settlements:** Partial payments allowed; from/to must be group members.

## Project Structure

```
backend/       Go API (users, groups, expenses, balances, settlements)
frontend/      React app (Vite, 5+ user flows)
README.md
```

## License

Use as needed for personal or educational projects.
