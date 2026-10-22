# CivicPulse – Public Grievance System

A full-stack, non-AI public grievance workflow for citizen submissions, administrator assignment, and officer status updates. This phase does **not** implement AI, machine learning, automated classification, or AI-generated responses.

## Requirements

- Node.js 20 or later and npm
- MongoDB configured as a **single-node replica set** (MongoDB transactions are used to keep complaint changes, history, and notifications consistent)
- Visual Studio Code and a browser

## Quick start

1. Start MongoDB as a replica set. For a local MongoDB installation, start `mongod` with `--replSet rs0`, then run `mongosh --eval "rs.initiate()"` once. For MongoDB Atlas, use its replica-set connection URI.
2. Copy `backend/.env.example` to `backend/.env`; set a private `JWT_SECRET` of at least 32 characters and set `MONGODB_URI` as needed. Keep `NODE_ENV=development` for local setup.
3. Install dependencies from the project root and each app:

   ```powershell
   npm install
   npm install --prefix backend
   npm install --prefix frontend
   ```

4. Create example admin/officer accounts and a sample department:

   ```powershell
   npm run seed
   ```

   The development-only demo accounts are `admin@example.com` and `officer@example.com`; both use `DemoPass123!`. Change these credentials immediately for any shared environment. The seed script refuses to run unless `NODE_ENV=development`.

5. (Optional) Copy `frontend/.env.example` to `frontend/.env`. Defaults work for local development. If your backend runs on another host or port, update `VITE_BACKEND_ORIGIN` and restart Vite.
6. Start both apps from the project root:

   ```powershell
   npm run dev
   ```

   Frontend: `http://localhost:5173` · API through Vite proxy: `http://localhost:5173/api` · Direct API: `http://localhost:5000/api` · Health: `http://localhost:5173/api/health`

Register as a citizen using the UI. Use the seeded admin to create departments and officer accounts, then submit a complaint as a citizen, assign it as admin, and update it as the officer.

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start frontend and backend concurrently |
| `npm run build` | Production-build the frontend |
| `npm test` | Run backend model and workflow-constant tests |
| `npm run seed` | Add local development department and demo accounts |
| `npm run start --prefix backend` | Start the API server |
| `npm run dev --prefix frontend` | Start the Vite UI only |

## Deploy to Render

The repository includes a `render.yaml` Blueprint for one Node web service. It builds the Vite app and serves its static files from Express, so the UI and `/api` use the same origin.

1. Push the project to `main` on GitHub.
2. In Render, select **New → Blueprint** and connect `raghu9741/CivicPulse`.
3. When prompted for `MONGODB_URI`, enter the Atlas URI privately in Render. Do not add it to GitHub or the frontend environment.
4. Render generates `JWT_SECRET`; leave it generated. Confirm `NODE_ENV=production`, then deploy the Blueprint.
5. In Atlas **Network Access**, allow the Render service's outbound IP addresses. If your Atlas plan does not provide stable outbound IPs, use Atlas's recommended connectivity option for Render; avoid a permanent allow-all rule.
6. Wait for the service health check to pass, then open the Render service URL. `/api/health` should return `{"status":"ok","database":"connected"}`.

The Blueprint builds with `npm ci --prefix backend && npm ci --prefix frontend && npm run build --prefix frontend`, starts with `npm start --prefix backend`, and uses `/api/health` for readiness. Database-backed routes remain unavailable until the Render `MONGODB_URI` is valid and Atlas allows the service network.

## Project layout

```text
backend/
  src/config/       MongoDB connection
  src/controllers/  HTTP request handling
  src/middleware/   Authentication, roles, centralized errors
  src/models/       User, department, complaint, history, notification
  src/routes/       REST API routes
  src/services/     Authentication and complaint workflow rules
  src/modules/ai/   Documented placeholders only; not imported by live flows
  src/scripts/      Development-only seed script
frontend/
  src/components/   Layout and protected routing
  src/context/      Authentication state
  src/pages/        Landing, dashboards, forms, case views, management
  src/services/     Axios API client
docs/
  AI_INTEGRATION_PLAN.md
```

## Roles and workflow

- Public registration always creates a Citizen. Admin and Officer accounts are created only through the admin UI or local seed script.
- Citizens can create and view their own complaints, see history and notifications, and edit their name.
- Admins can view all complaints, create departments and officers, and assign open complaints to officers in the selected department.
- Officers can only retrieve complaints assigned to them and update those complaints with remarks.
- Complaint creation and status/assignment changes use MongoDB transactions to write the complaint, history, and notifications together. A replica set is required even for a single local MongoDB node.
- Optional image attachment upload is not included in this phase.

## API reference

All endpoints are under `/api`. Login uses an HttpOnly JWT cookie (`civicpulse_token`); the browser client sends credentials. Password hashes are never included in response objects.

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| `POST` | `/auth/register` | Public | Create a Citizen account |
| `POST` | `/auth/login` | Public | Sign in |
| `POST` | `/auth/logout` | Public | Clear the session cookie |
| `GET` | `/auth/me` | Signed in | Current account |
| `PATCH` | `/auth/profile` | Signed in | Update own display name |
| `GET` | `/dashboard/stats` | Signed in | Counts scoped to the current role |
| `GET` | `/complaints` | Signed in | List own, assigned, or all complaints; optional `status`, `category`, `priority`, `search` |
| `POST` | `/complaints` | Citizen | Submit a complaint |
| `GET` | `/complaints/:id` | Authorized owner/assignee or Admin | Complaint and status history |
| `GET` | `/complaints/:id/history` | Citizen owner | Status history |
| `PATCH` | `/complaints/:id/assignment` | Admin | Assign `departmentId` and `officerId` |
| `PATCH` | `/complaints/:id/status` | Assigned Officer | Update status and optional `remarks` |
| `GET` | `/departments` | Signed in | List departments |
| `POST` | `/departments` | Admin | Create department |
| `GET` | `/officers` | Admin | List officers; optional `departmentId` |
| `POST` | `/officers` | Admin | Create an officer account |
| `GET` | `/notifications` | Signed in | List own notifications |
| `PATCH` | `/notifications/:id/read` | Notification owner | Mark notification read |
| `GET` | `/api/health` | Public | API health check |

Complaint categories: Water, Electricity, Roads, Waste Management, Sanitation, Public Safety, Other. Priorities: Normal, High, Critical. Statuses: Submitted, Assigned, In Progress, Resolved, Rejected.

## Configuration and security notes

- `backend/.env.example` documents environment variables. Never commit the actual `.env`.
- `MONGODB_URI` must be a MongoDB URI beginning with `mongodb://` or `mongodb+srv://`. The backend loads `backend/.env` from its working directory and rejects example placeholders or unescaped reserved characters in credentials without printing the URI.
- The backend starts listening even if MongoDB is temporarily unavailable, retries the connection with backoff, and returns HTTP 503 with database status at `/api/health` and a clear message for database-backed API requests. Connection logs classify common configuration, authentication, DNS/network, and TLS failures without printing secrets.
- The Vite development server proxies `/api` to `VITE_BACKEND_ORIGIN` (default `http://localhost:5000`). `VITE_API_URL` defaults to same-origin `/api`; for a separate deployed API origin, set it before building and configure the backend CORS origin accordingly.
- The API requires `JWT_SECRET` to be at least 32 characters.
- CORS is limited to `FRONTEND_ORIGIN`; the JWT cookie is HttpOnly and uses `secure` in production.
- Helmet, request-size limits, authentication throttling, server-side validation, role checks, complaint ownership checks, and centralized error responses are enabled.
- For production, deploy over HTTPS, use a private strong secret, restrict CORS to the real UI origin, configure MongoDB access controls/backups, and replace all demo credentials.

## Testing and limitations

Run `npm test` and `npm run build`. The included automated tests verify model defaults, schema constraints, and shared workflow values. The complete HTTP/database workflow still requires a running MongoDB replica set and is not represented as integration-tested by these unit tests.

See [docs/AI_INTEGRATION_PLAN.md](./docs/AI_INTEGRATION_PLAN.md) for future-phase guidance.
