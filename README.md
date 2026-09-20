# SaaS Business Management Platform

A production-ready, multi-tenant business management SaaS. Manage products, sales, expenses, investments, customers, transactions, and get full financial reports & analytics — all behind a subscription model with manual bKash / Nagad payment approval.

Each registered user gets their own isolated business workspace: all data is scoped per business, verified server-side from the authenticated JWT.

---

## Tech Stack

| Layer    | Technology |
|----------|------------|
| Frontend | Next.js 16 (App Router), React 19, Tailwind CSS v4, Recharts, lucide-react |
| Backend  | Node.js, Express, Mongoose (MongoDB) |
| Auth     | JWT (HTTP-only cookies, short-lived access + rotating refresh tokens) |
| Payment  | Manual bKash / Nagad via payment requests + admin approval |
| Hosting  | Ready for Vercel (frontend) + Render/Railway/Fly (backend) |

---

## Features

- **Multi-tenant isolation** — every query is scoped by `businessId` derived from the verified JWT; cross-tenant reads/writes are rejected (`404`/`403`).
- **Authentication & sessions**
  - Register, login, logout, refresh-token rotation
  - Password reset via email (verification/reset tokens)
  - HTTP-only cookie sessions, refresh flow on the client
  - Auth route rate limiting (brute-force protection)
- **Business onboarding** — set up your business (name, type, currency, capital, logo, etc.) or skip and finish later.
- **Dashboard** — KPIs, todays / weekly / monthly / yearly summaries, revenue-vs-expense, profit/loss, cash flow and expense-category charts.
- **Products** — CRUD, auto-SKU generation, stock tracking with low-stock/out-of-stock warnings.
- **Sales** — invoice-numbered sales with multiple items, per-line discounts, wholesale-style selling price, payment tracking (paid/partial/due), auto stock decrement, transactional writes.
- **Purchases & Suppliers** — purchase orders with multiple items, supplier balances (total purchased / paid / due), auto stock increment, transactional writes.
- **Expenses** — CRUD with category breakdown aggregation.
- **Investments** — track capital infusions.
- **Customers** — CRUD with purchase history, total purchased / paid / due.
- **Transactions** — unified ledger view (sale/expense/investment entries).
- **Reports** (Premium) — CLTV, inventory, sales detail, profit & loss, cash statements.
- **Analytics** (Premium) — trends, top products, top customers, revenue by payment method, profit margins.
- **Subscriptions** — free tier with enforced limits (25 products / 100 transactions / 15 customers) and a Pro plan activated by admin after manual payment verification.
- **Admin panel** — dashboard stats, user search/suspend, payment review (approve → activates subscription), subscription overview.
- **Notifications** — in-app notifications with unread badge and mark-all-read.
- **Dark / light theme**, responsive mobile layout, loading skeletons, empty & error states.

---

## Project Structure

```
.
├── package.json                  # Frontend (root)
├── .env.example                  # Frontend env template
├── src/                          # Next.js frontend
│   ├── app/                      # App Router pages
│   │   ├── auth/                 # login / register / forgot / reset
│   │   ├── onboarding/page.jsx   # Business setup wizard
│   │   ├── dashboard/            # sales, purchases, suppliers, products, expenses,
│   │   │                         # investments, customers, transactions, reports,
│   │   │                         # analytics, settings, profile, subscription
│   │   ├── admin/                # admin dashboard, users, payments, subscriptions
│   │   ├── page.jsx              # Landing page
│   │   └── layout.js             # Root providers + SEO
│   ├── components/               # ui/, common/, charts/, layout/, landing/
│   ├── contexts/                 # AuthContext, ThemeContext, ToastContext
│   ├── hooks/                    # useFetch / useSubmit helpers
│   ├── lib/api.js                # Axios client (credentials + refresh interceptor)
│   └── constants/                # currencies, business types, routes, helpers
│
└── server/                       # Express backend
    ├── .env.example              # Backend env template
    ├── package.json
    └── src/
        ├── index.js              # App entry; mounts /api/* routes
        ├── config/db.js          # MongoDB connection
        ├── models/               # User, Business, Subscription, Product, Sale,
        │                         # Purchase, Expense, Investment, Customer,
        │                         # Supplier, Transaction, PaymentRequest,
        │                         # Notification, AuditLog
        ├── controllers/          # auth, business, product, sale, purchase,
        │                         # supplier, expense, investment, customer,
        │                         # transaction, dashboard, report, analytics,
        │                         # subscription, payment, notification,
        │                         # settings, admin, profile
        ├── routes/               # one router per resource
        ├── middleware/           # protect, adminOnly, requireBusiness,
        │                         # requirePremium, authLimiter, apiLimiter
        ├── services/             # session/cookie helpers
        └── utils/                # seed script, constants, helpers, error handler
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas). For a local install with full features (sale transactions), run Mongo as a **single-node replica set**:

```bash
mongod --replSet rs0 --dbpath /path/to/data
# then once:
mongosh --eval "rs.initiate()"
```

### 1. Backend

```bash
cd server
npm install
cp .env.example .env          # then fill in values (see below)
npm run seed                  # optional: demo admin + business data
npm run dev                   # starts on http://localhost:5000
```

Backend env (`server/.env`):

```
MONGODB_URI=mongodb://localhost:27017/saas-business-management
JWT_SECRET=change_me
JWT_REFRESH_SECRET=change_me
JWT_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d
CLIENT_URL=http://localhost:3000
SERVER_URL=http://localhost:5000
CORS_ORIGINS=https://app.businesshub.example   # comma-separated; needed for production
BKASH_PAYMENT_NUMBER=01XXXXXXXXX
NAGAD_PAYMENT_NUMBER=01XXXXXXXXX
EMAIL_HOST=smtp.gmail.com
EMAIL_USER=your_email@example.com
EMAIL_PASSWORD=app_password
NODE_ENV=development
```

> **CORS note:** in `development` the API accepts requests from any origin (any port/host).
> In `production` only `CLIENT_URL`'s origin plus the comma-separated `CORS_ORIGINS` list are
> allowed — make sure your frontend domain is listed there, otherwise browser requests will fail
> with a network error.

### 2. Frontend

```bash
npm install
cp .env.example .env.local    # NEXT_PUBLIC_API_URL=http://localhost:5000/api
npm run dev                   # starts on http://localhost:3000
```

### 3. Seed demo data (backend)

```bash
cd server && npm run seed
```

> **Warning:** `seed.js` **deletes all existing collections** before seeding. Only run it on a fresh/development database — never on a database containing real users.

Creates:

- **Admin** — `admin@businesshub.com` / `admin123`
- **Demo user** — `demo@businesshub.com` / `demo1234` (has an active 1-year Pro subscription)
- Demo business with 8 products, 16 sales, 15 expenses, 5 customers, 4 suppliers, 6 purchases, and 3 investments — all with matching ledger (`Transaction`) entries.

---

## How Multi-Tenancy Works

1. On register, a `User` and a free `Subscription` are created; the user completes a business setup which links `user.businessId`.
2. The `protect` middleware verifies the JWT and loads the user. `requireBusiness` ensures `businessId` is set and attaches it to the request.
3. **Every** controller query includes `{ businessId: req.businessId }` (or `userId: req.user._id` for user-scoped resources). Client-supplied IDs can never cross tenant boundaries — cross-tenant lookups simply return 404.
4. The admin panel runs entirely on `role`/`adminOnly` + separate admin routes, and admin JWT control is enforced server-side.

## Subscription / Payments

- Free plan limits (enforced in controllers): **25 products, 100 transactions, 15 customers**.
- Premium features (`/reports/*`, `/analytics`) are gated by `requirePremium` — requires a non-free plan, `status === 'active'`, and an unexpired `expiryDate` (403 `PREMIUM_REQUIRED`).
- Upgrade: user picks a plan → submits a payment request with bKash/Nagad transaction ID → admin reviews and approves/rejects (with note). Approval upserts an active subscription for 12 months and notifies the user.

## Security

- Passwords hashed with bcrypt; sensitive fields excluded from responses.
- HTTP-only, `SameSite=Strict` cookies; short-lived access tokens with rotating refresh tokens; logout invalidates refresh tokens.
- Auth endpoints rate-limited (register/login/refresh/forgot/reset); API-wide rate limiting applied globally.
- Audit log records security-relevant actions (user status changes, payment review, etc.).

## Scripts

| Directory | Command            | Description                       |
|-----------|--------------------|-----------------------------------|
| root      | `npm run dev`      | Start Next.js dev server (3000)    |
| root      | `npm run build`    | Production build of frontend       |
| root      | `npm run start`    | Serve production build             |
| server    | `npm run dev`      | Express dev server with nodemon    |
| server    | `npm start`        | Run Express server                 |
| server    | `npm run seed`     | Seed admin + demo business data    |

## API Overview

Base URL: `/api`

| Area              | Endpoints (prefix)                                   |
|-------------------|------------------------------------------------------|
| Auth              | `POST /auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout`, `GET /auth/me`, `POST /auth/forgot-password`, `/auth/reset-password` |
| Business          | `POST /business/onboarding`, `GET/PATCH /business`   |
| Products          | `/products` CRUD                                     |
| Sales             | `/sales` CRUD (transactional, invoice + stock)       |
| Expenses          | `/expenses` CRUD (with category summary)             |
| Investments       | `/investments` CRUD                                  |
| Customers         | `/customers` CRUD (purchase history)                 |
| Suppliers         | `/suppliers` CRUD (balance summary)                  |
| Purchases         | `/purchases` CRUD (transactional, invoice + stock)   |
| Transactions      | `/transactions` list + summary                       |
| Dashboard         | `GET /dashboard`, `GET /dashboard/charts`            |
| Reports (premium) | `GET /reports/pnl`, `/reports/sales`, `/reports/expenses`, `/reports/investments`, `/reports/cash-flow`, `/reports/products`, `/reports/customers` |
| Analytics (premium)| `GET /analytics`                                    |
| Subscriptions     | `GET /subscription`, `/subscription/plans`, `/subscription/payment-instructions` |
| Payments          | `GET/POST /payments` (submit a payment request)      |
| Notifications     | `GET /notifications`, `PATCH /notifications/read-all`, `PATCH /notifications/:id/read` |
| Profile           | `GET/PATCH /profile`, `POST /profile/change-password` |
| Settings          | `GET/PATCH /settings`                               |
| Admin             | `GET /admin/dashboard`, `/admin/users`, `/admin/payments`, `/admin/subscriptions`, `PATCH /admin/users/:id`, `PATCH /admin/payments/:id/review` |

---

## License

Private / proprietary. Do not distribute.