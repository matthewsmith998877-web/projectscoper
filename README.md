# ScopeBuilder

A project scoping tool for marketing agencies. Enables project managers and commercial teams to scope client projects by hours, roles and tasks — and generate a branded PDF proposal.

## Features

- User registration and login (JWT auth)
- Hours grid: input hours by role (row) and task (column)
- Live financial summary: Total Revenue, Total Costs, Net Profit, Net Margin
- Summary page with editable project details
- PDF generation and download
- Admin panel: manage roles (with chargeout + cost rates) and task types
- Scopes saved per user and reloadable from the dashboard

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite |
| Styling | Plain CSS (no framework) |
| Backend | Node.js + Express |
| Database | SQLite (via better-sqlite3) |
| Auth | JWT (jsonwebtoken) + bcrypt |
| PDF | jsPDF (client-side) |

---

## Prerequisites

- Node.js 18+
- npm 9+

---

## Project Structure

```
scopebuilder/
├── backend/
│   ├── db/
│   │   └── database.js        # SQLite setup + seed data
│   ├── middleware/
│   │   └── auth.js            # JWT middleware
│   ├── routes/
│   │   ├── auth.js            # /api/auth/*
│   │   ├── roles.js           # /api/roles/*
│   │   ├── tasks.js           # /api/tasks/*
│   │   └── scopes.js          # /api/scopes/*
│   ├── server.js              # Express app entry point
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/        # Shared UI components
│   │   ├── pages/             # Page-level components
│   │   ├── context/           # React context (auth, data)
│   │   ├── hooks/             # Custom hooks
│   │   ├── utils/             # Helpers (api.js, pdf.js, format.js)
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   ├── vite.config.js
│   └── .env.example
└── README.md
```

---

## Setup Instructions

### 1. Clone / copy the project

```bash
# If using git
git clone <your-repo>
cd scopebuilder

# Or just copy the files and cd in
cd scopebuilder
```

### 2. Set up the backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env if needed (defaults work for local dev)
npm run dev
```

The backend will start on **http://localhost:3001**.  
It creates `backend/db/scopebuilder.db` automatically on first run and seeds default roles and tasks.

### 3. Set up the frontend (new terminal)

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

The frontend will start on **http://localhost:5173**.

### 4. Open the app

Visit **http://localhost:5173**

**Default admin account (seeded automatically):**
- Email: `admin@agency.com`
- Password: `admin1234`

Register additional user accounts through the UI.

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3001` | Express server port |
| `JWT_SECRET` | `changeme-use-a-long-random-string` | Secret for signing JWTs |
| `JWT_EXPIRES_IN` | `7d` | JWT expiry |
| `ADMIN_EMAIL` | `admin@agency.com` | Seeded admin email |
| `ADMIN_PASSWORD` | `admin1234` | Seeded admin password |

### Frontend (`frontend/.env`)

| Variable | Default | Description |
|---|---|---|
| `VITE_API_URL` | `http://localhost:3001` | Backend base URL |

---

## Production Deployment

For production:

1. Set a strong `JWT_SECRET` in backend `.env`
2. Set `VITE_API_URL` to your backend's public URL
3. Run `npm run build` in `/frontend` — serve the `dist/` folder from a static host (Vercel, Netlify, etc.)
4. Deploy the backend to a Node host (Railway, Render, Fly.io, etc.)
5. Consider swapping SQLite for PostgreSQL for multi-instance deployments (change `better-sqlite3` to `pg` and update `db/database.js`)

---

## Default Roles (seeded)

| Role | Chargeout | Cost Rate |
|---|---|---|
| Strategy Director | £175/hr | £105/hr |
| Creative Director | £150/hr | £90/hr |
| Senior Designer | £110/hr | £66/hr |
| Designer | £85/hr | £51/hr |
| Senior Developer | £130/hr | £78/hr |
| Developer | £100/hr | £60/hr |
| Project Manager | £95/hr | £57/hr |
| Copywriter | £90/hr | £54/hr |
| Account Manager | £80/hr | £48/hr |

## Default Tasks (seeded)

Strategy, Creative, Development, Project Management, QA & Testing, Content, Analytics
