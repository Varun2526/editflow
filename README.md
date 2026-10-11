# EditFlow

Client and project management for a freelance video editor. It has three parts:

- **Public site:** a cinematic portfolio landing page with a *Work With Me* inquiry form.
- **Admin workspace:** inquiries → clients → monthly projects → videos, a guided video workflow, change requests, and manual payment records (UPI/cash, no gateway).
- **Client portal:** clients follow their videos, approve them or request revisions, and see what they've paid.

| Folder | Stack |
|---|---|
| `backend/` | Java 21, Spring Boot 3.5, Maven, PostgreSQL, Flyway, JWT (Spring OAuth2 resource server) |
| `frontend/` | React 19, Vite, Tailwind CSS v4, React Router, Axios, Vitest |
| `docs/ARCHITECTURE.md` | Architecture, domain rules, API reference |

## Data policy

There is **no demo or seed data**. On first start the database holds only the admin account. Every client, project, video and payment is entered through the app, and every figure on screen is calculated from those records.

## How the work flows

```
Inquiry ──accept──▶ Client + monthly Project ──▶ Videos

Video:  PENDING → MEDIA_RECEIVED → EDITING → REVIEW ──client approves──▶ COMPLETED → DELIVERED
                                       ▲         │
                                       └─────────┘ client requests a revision → editor reworks it → back to REVIEW
```

- **Admin moves each stage forward** one step at a time. They can also step back to correct a mistake.
- **Review is the client's decision.** In their portal the client either **approves** the video (REVIEW → COMPLETED) or leaves a timecoded **revision request**. A client can't approve while their own requests are still open.
- **Payments are independent of approval.** The admin records installments against the project fee, and the project shows Unpaid, Partially paid or Paid.
- **The admin's *Today* page** lists what needs them right now, then what's waiting on clients, then a quiet overview of key figures.

## Prerequisites

- JDK 21 (on macOS: `brew install openjdk@21`; STS 4 also bundles one)
- PostgreSQL 14+ running locally
- Node.js 20+
- Docker, only for the backend integration tests (Testcontainers)

## Local database (one-time)

```bash
psql -d postgres -c "CREATE ROLE editflow LOGIN PASSWORD 'editflow';"
```

```bash
createdb -O editflow editflow
```

These are the defaults of the `local` Spring profile, for a local database only. On startup, Flyway creates and upgrades the schema (`backend/src/main/resources/db/migration`). Hibernate only validates it.

## Backend

Copy `backend/.env.example` to `backend/.env` and set at least `ADMIN_EMAIL` and `ADMIN_PASSWORD`. That file is gitignored and loaded automatically.

From `backend/`:

```bash
JAVA_HOME=/opt/homebrew/opt/openjdk@21 ./mvnw spring-boot:run
```

You can drop the `JAVA_HOME=…` prefix if Java 21 is already your default.

**Spring Tools 4 / STS**

1. File → Import → Maven → Existing Maven Projects.
2. Select `backend/`.
3. Right-click the project → Run As → Spring Boot App.
4. Use a Java 21 JRE (Project → Properties → Java Build Path).

The backend runs at:

- **API:** http://localhost:8081
- **Health check:** http://localhost:8081/actuator/health

With no profile set, it uses the `local` profile.

- **Admin account:** if no admin exists, one is created on startup from `ADMIN_EMAIL` / `ADMIN_PASSWORD`. No credentials are hard-coded.
- **JWT secret:** without `JWT_SECRET`, the local profile signs tokens with a random key per process, so you have to log in again after a restart. Any other profile refuses to start without `JWT_SECRET`.
- **Client logins:** created by the admin (when accepting an inquiry or from a client's page). The app generates a temporary password and shows it **once**; the admin sends it to the client themselves. The client must change it at first login.

### Backend tests

```bash
./mvnw test
```

```bash
./mvnw verify
```

- `test` runs the unit tests.
- `verify` also runs the integration tests against a real PostgreSQL 16 in Testcontainers. These need Docker, and are skipped without it.

## Frontend

From `frontend/`:

```bash
cp .env.example .env
```

```bash
npm install
```

```bash
npm run dev
```

Open http://localhost:5173.

- **API URL:** `VITE_API_URL` in `.env` points at the backend (default `http://localhost:8081`).
- **CORS:** the backend only accepts origins listed in `FRONTEND_URL`.
- **Sessions:** each browser tab keeps its own login (`sessionStorage`), so you can be the admin in one tab and a client in another.

| Command | Purpose |
|---|---|
| `npm test` | Vitest + Testing Library |
| `npm run lint` | oxlint |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serve the build. Proxies `/api` to `PREVIEW_API_TARGET` (default `http://localhost:8081`). |

## Main routes

| Area | Routes |
|---|---|
| Public | `/`, `/work-with-me`, `/login` |
| Admin | `/admin` (Today), `/admin/inquiries`, `/admin/projects/:id` (project workspace), `/admin/videos/:id`, `/admin/clients/:id`, `/admin/payments`, plus record lists for videos, revisions and payments |
| Client | `/portal`, `/portal/projects/:id`, `/portal/videos/:id` (approve / request a revision), `/portal/payments`, `/portal/profile` |

## Environment variables

**Backend**

| Variable | Notes |
|---|---|
| `DATABASE_URL` | **JDBC form**, e.g. `jdbc:postgresql://host/db?sslmode=require`. Neon shows `postgres://user:pass@host/db`: move the user and password into the two variables below. |
| `DATABASE_USERNAME`, `DATABASE_PASSWORD` | |
| `JWT_SECRET` | 32+ bytes. Generate one with `openssl rand -base64 48`. Required outside `local`. |
| `JWT_TTL_MINUTES` | Default `480` |
| `FRONTEND_URL` | Comma-separated CORS allow-list, no wildcard |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME` | Admin bootstrap only |
| `APP_TIMEZONE` | Default `Asia/Kolkata`. Defines "today" for due dates and overdue. |
| `SPRING_PROFILES_ACTIVE` | `prod` in production; unset locally |
| `PORT` | Default `8081` (Render sets it) |
| `DB_POOL_SIZE` | Default `5`. Keep it small for Neon's free tier. |

**Frontend:** `VITE_API_URL`, the backend base URL with no trailing slash.

## Deployment (Vercel + Render + Neon)

Everything deployable is in the repo:

- `backend/Dockerfile`: multi-stage build onto a Java 21 runtime, with the `prod` profile and memory flags baked in.
- `render.yaml`: Render Blueprint for the API.
- `frontend/vercel.json`: SPA rewrite, asset caching and security headers.
- `.github/workflows/ci.yml`: runs both test suites on every push.

### 1. Database (Neon)

1. Create a project in a region near your users (e.g. Singapore).
2. Copy the **pooled** connection string. It looks like:

   ```
   postgres://USER:PASSWORD@ep-xxx-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
   ```

3. Convert it to JDBC form. User and password become separate variables:

   | Variable | Value |
   |---|---|
   | `DATABASE_URL` | `jdbc:postgresql://ep-xxx-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require` |
   | `DATABASE_USERNAME` | `USER` |
   | `DATABASE_PASSWORD` | `PASSWORD` |

Flyway creates the schema on the first boot. Nothing else is inserted except the admin account.

### 2. Backend (Render)

1. Go to **New → Blueprint** and select this repository. Render reads `render.yaml`.
2. Fill in the prompted variables:
   - the three `DATABASE_*` values from step 1
   - `ADMIN_EMAIL` and `ADMIN_PASSWORD` (8+ characters)
   - `FRONTEND_URL`: use a placeholder for now and set it in step 4
3. `JWT_SECRET` is generated automatically. **Don't change it later**, or every session is signed out.
4. Wait for the deploy, then check that `https://<service>.onrender.com/actuator/health` returns `{"status":"UP"}`.

### 3. Frontend (Vercel)

1. Import the repository.
2. Set **Root Directory** to `frontend`. Vite is detected from `vercel.json`.
3. Add the environment variable `VITE_API_URL` = `https://<service>.onrender.com`, with no trailing slash.
4. Deploy.

### 4. Connect them

1. In Render, set `FRONTEND_URL` to your Vercel URL, e.g. `https://editflow.vercel.app`, and redeploy. Separate several URLs with commas; wildcards aren't allowed.
2. Open the site:
   - submit a test inquiry from **Work With Me**
   - sign in as the admin
   - accept the inquiry
   - log into the portal with the temporary password in a second tab
3. Delete the test client's data afterwards if you don't want to keep it.

### What to expect on the free tiers

- **Render sleeps** after about 15 minutes idle, and the first request then takes up to about a minute. The site pings the API on page load, and shows a "Waking up the server…" notice while a request is slow. A paid instance removes the delay.
- **Neon pauses** when idle and resumes in about a second on the next query.
- **Rate limits** apply to the public endpoints:

  | Endpoint | Limit |
  |---|---|
  | Login, per IP | 10 attempts / 5 minutes |
  | Failed logins, per account | 20 / 15 minutes |
  | Inquiries, per IP | 5 / hour |

  Change them with `app.rate-limit.*` properties.

## Known limitations

- **No refresh tokens.** Sessions expire after `JWT_TTL_MINUTES`, and the token lives in `sessionStorage`.
- **Rate limits are kept in memory.** They reset on restart, and assume a single backend instance.
- **No email or notifications.** Credentials and updates are shared manually, e.g. on WhatsApp.
- **Video files aren't stored or streamed.** Each video links to its Google Drive location.
- **Payments are manual records only**, with no payment gateway.
