# AI Capsule: Cloud-Deployed AI Prompt Manager

CSE3CWA / CSE5006 Assignment 3, Semester 2, 2026
Student: Ruthik Kumar Boddu, 22624735

AI Capsule is a private prompt library. A user signs in with GitHub OAuth, and the Express backend issues its own application JWT in a Secure, HttpOnly cookie named `token`. The user can then create, read, update and delete their own AI prompt records. Every `/api/capsules` route is protected by JWT middleware, and ownership is always taken from the verified JWT, never from the browser.

## 1. Deployment

| Item | Value |
| --- | --- |
| Public URL | https://ai-capsule-tur7.onrender.com |
| GitHub repository | https://github.com/bruthikkumar18/AI-Capsule |
| Health check | https://ai-capsule-tur7.onrender.com/api/health |
| Cloud platform | Render (free Web Service, Node runtime) |
| Deployment model | One Render Web Service serves both the React build and the Express API from the same origin |
| Build command | `npm install && npm run build` |
| Start command | `npm start` |
| Render health check path | `/api/health` |
| OAuth provider | GitHub OAuth |

Note: the free Render instance sleeps after about 15 minutes without traffic. The first request after that can take up to about a minute while it starts.

## 2. Technology

| Component | Used |
| --- | --- |
| Frontend | React 18 (Vite build, React Router) |
| Backend | Node.js 22 + Express 4 |
| Authentication | GitHub OAuth (web application flow, implemented manually in Express) |
| Application session | JWT signed by Express (`jsonwebtoken`, HS256), stored in a Secure, HttpOnly cookie named `token` |
| Storage | SQLite via `better-sqlite3` |
| Deployment | Render Web Service |

## 3. Project structure

```
ai-capsule/
├── package.json            root scripts + server dependencies
├── .env.example            environment variable names (no secrets)
├── server/
│   ├── index.js            Express app, routes, static React build, SPA fallback
│   ├── config.js           reads and checks environment variables
│   ├── db.js               opens SQLite and runs schema.sql
│   ├── schema.sql          capsules table + user_id index
│   ├── initDb.js           optional manual DB init (npm run db:init)
│   ├── middleware/
│   │   └── requireAuth.js  JWT verification middleware
│   ├── routes/
│   │   ├── auth.js         GitHub OAuth login, callback, logout
│   │   └── capsules.js     protected CRUD routes
│   └── utils/
│       └── validateCapsule.js  input validation
├── client/                 React app (Vite)
│   ├── src/pages/          Landing, Login, Dashboard
│   ├── src/components/     CapsuleForm, CapsuleCard, ProtectedRoute, NavBar
│   └── src/api.js          fetch wrapper used by all pages
└── scripts/
    ├── security-test.js    health + 401 checks (local or deployed)
    └── ownership-test.js   two-user ownership checks (local)
```

## 4. Installation and running locally

Requirements: Node.js 22 (20 or 24 also work), npm, Git, a GitHub account.

1. Install server dependencies:
   ```bash
   npm install
   ```
2. Create a GitHub OAuth App for local use (GitHub, Settings, Developer settings, OAuth Apps, New OAuth App):
   - Homepage URL: `http://localhost:3000`
   - Authorization callback URL: `http://localhost:3000/auth/github/callback`
3. Copy `.env.example` to `.env` and fill in the values. Generate a JWT secret with:
   ```bash
   node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
   ```
4. Build the React client (installs client dependencies and runs `vite build`):
   ```bash
   npm run build
   ```
5. Start the app (Express serves the API and the React build together):
   ```bash
   npm start
   ```
6. Open `http://localhost:3000` in Chrome, Edge or Firefox. These browsers accept Secure cookies on `localhost`.

Optional development mode with hot reload (two terminals):

```bash
npm run dev          # Express on port 3000 with --watch
npm run dev:client   # Vite on port 5173, proxies /api and /auth to port 3000
```

For this mode, use a separate local OAuth App whose callback is `http://localhost:5173/auth/github/callback` and set `GITHUB_CALLBACK_URL` to the same value.

Optional database initialisation (the server also does this automatically on start):

```bash
npm run db:init
```

## 5. Routes

### Pages (React Router)

| Route | Access | Purpose |
| --- | --- | --- |
| `/` | Public | Explains AI Capsule |
| `/login` | Public | Starts GitHub OAuth login |
| `/dashboard` | Protected | Shows and manages the signed-in user's records |

`/dashboard` is protected twice. Express checks the JWT before serving the page and redirects to `/login` if it is missing or invalid. React also calls `GET /api/me` and redirects to `/login` on a 401. Even if both were bypassed, the dashboard cannot load data because the API itself returns 401.

### API

| Method and path | Access | Purpose | Success |
| --- | --- | --- | --- |
| `GET /api/health` | Public | Health check, returns `{ "status": "ok" }` | 200 |
| `GET /api/capsules` | Protected | Read the authenticated user's records | 200 |
| `POST /api/capsules` | Protected | Create a record owned by the authenticated user | 201 |
| `PUT /api/capsules/:id` | Protected | Update one of the user's own records | 200 |
| `DELETE /api/capsules/:id` | Protected | Delete one of the user's own records | 200 |

Supporting routes:

| Route | Purpose |
| --- | --- |
| `GET /auth/github` | Starts OAuth: creates a random `state`, stores it in a short-lived HttpOnly cookie and redirects to GitHub |
| `GET /auth/github/callback` | GitHub redirects here; Express checks `state`, exchanges the code, reads the GitHub user and issues the JWT cookie |
| `POST /auth/logout` | Clears the `token` cookie |
| `GET /api/me` | Protected; returns the signed-in user's GitHub login and avatar from the JWT (used by the dashboard header and route guard) |

Error responses: `401` for no or invalid JWT, `400` for invalid input (with a list of messages), `404` when a record does not exist or belongs to another user, `500` for unexpected errors. All errors are JSON.

### How React talks to Express

The React build is served by the same Express app, so the browser and API share one origin (`https://ai-capsule-tur7.onrender.com`). `client/src/api.js` calls relative paths such as `fetch('/api/capsules')` with `credentials: 'same-origin'`, so the browser sends the `token` cookie automatically. No CORS configuration and no cross-site cookies are needed. JSON bodies are sent with `Content-Type: application/json`. A 401 from any call sends the user back to `/login`.

## 6. OAuth and JWT

1. The login page links to `/auth/github`. Express creates a random `state` value, saves it in an HttpOnly cookie (`oauth_state`, 10 minutes) and redirects to GitHub's authorize page with `scope=read:user`.
2. After the user approves, GitHub redirects to `/auth/github/callback?code=...&state=...`. Express rejects the request if `state` does not match the cookie (CSRF protection for the login flow).
3. Express exchanges the `code` for a GitHub access token (server to server, using `GITHUB_CLIENT_SECRET`), then calls `https://api.github.com/user` to get the GitHub user ID, login, name and avatar.
4. **Issue:** Express signs its own application JWT with `JWT_SECRET` (HS256, issuer `ai-capsule`, expiry 8 hours). The JWT subject (`sub`) is the GitHub numeric user ID. The GitHub access token is only used during the callback and is never stored or sent to the browser.
5. **Store:** the JWT is set as a cookie named `token` with `HttpOnly` (JavaScript cannot read it), `Secure` (HTTPS only), `SameSite=Lax` and an 8 hour max age. The frontend never uses localStorage or an Authorization header.
6. **Verify:** `server/middleware/requireAuth.js` reads `req.cookies.token` and calls `jwt.verify` with the secret, `algorithms: ['HS256']` and the expected issuer. Missing, malformed, forged, wrongly signed, `alg: none` and expired tokens all return `401` with no capsule data. On success it sets `req.user.id` from the verified `sub` claim.
7. `requireAuth` is attached directly to every route in `server/routes/capsules.js` (`router.get('/', requireAuth, ...)`, `router.post('/', requireAuth, ...)`, `router.put('/:id', requireAuth, ...)`, `router.delete('/:id', requireAuth, ...)`), so markers can confirm it by reading the file.

`SameSite=Lax` also means other websites cannot make the browser send the cookie on cross-site POST, PUT or DELETE requests.

## 7. Environment variables

Set locally in `.env` (ignored by Git) and in Render under Environment. Values are never committed.

| Name | Purpose |
| --- | --- |
| `GITHUB_CLIENT_ID` | GitHub OAuth App client ID |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth App client secret |
| `GITHUB_CALLBACK_URL` | Must match the OAuth App callback, e.g. `https://ai-capsule-tur7.onrender.com/auth/github/callback` |
| `JWT_SECRET` | Secret used to sign and verify the application JWT (at least 32 random characters) |
| `NODE_ENV` | `production` on Render |
| `DATABASE_PATH` | Optional path for the SQLite file (default `./data/capsules.db`) |
| `PORT` | Set automatically by Render; `3000` locally |

The server refuses to start if any of the four required secrets or URLs is missing, so a misconfigured deployment fails loudly instead of running insecurely.

## 8. Database and storage

- **Engine:** SQLite file database using `better-sqlite3`.
- **Creation:** `server/db.js` creates the `data/` folder if needed, opens the file and runs `server/schema.sql` on every start. The schema uses `CREATE TABLE IF NOT EXISTS`, so it is safe to re-run. `npm run db:init` does the same manually.
- **Schema:** the table from the specification, plus an `updated_at` column and an index on `user_id`:

```sql
CREATE TABLE IF NOT EXISTS capsules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  project_name TEXT NOT NULL,
  prompt_title TEXT NOT NULL,
  prompt_version TEXT,
  prompt_text TEXT NOT NULL,
  response_summary TEXT,
  category TEXT,
  usefulness TEXT,
  reviewed INTEGER DEFAULT 0,
  improved INTEGER DEFAULT 0,
  screenshot_url TEXT,
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_capsules_user_id ON capsules (user_id);
```

- **Ownership:** `user_id` stores the GitHub user ID taken from the verified JWT (`req.user.id`). The API never reads `user_id` from the request body. Every query includes the owner:
  - READ: `SELECT ... WHERE user_id = ?`
  - CREATE: `INSERT ... (user_id, ...)` with `req.user.id`
  - UPDATE: `UPDATE ... WHERE id = ? AND user_id = ?`
  - DELETE: `DELETE ... WHERE id = ? AND user_id = ?`
  If no row matches (the record does not exist or belongs to someone else), the API returns `404`, so it does not reveal whether another user's record exists.
- **Validation:** project name, prompt title and prompt text are required; lengths are limited; category and usefulness must be from fixed lists; the screenshot URL must start with `http://` or `https://`; reviewed and improved are stored as 0 or 1. All SQL uses prepared statements with bound parameters (no string concatenation), which prevents SQL injection.
- **Persistence on Render: ephemeral.** The free Render Web Service has a temporary filesystem. The SQLite file works normally while the service is running, but it is reset when the service restarts, redeploys or spins down after inactivity. Records created during a session can disappear later. A persistent disk or a managed PostgreSQL database would fix this, but it was not needed for the assessed behaviour.

## 9. Required cURL tests and results

Run against the deployed URL. On Windows PowerShell use `curl.exe` instead of `curl`, because `curl` there is an alias for `Invoke-WebRequest`.

```bash
# Test 1 - no authentication
curl -i https://ai-capsule-tur7.onrender.com/api/capsules
# Required: 401 Unauthorized

# Test 2 - fake / invalid JWT
curl -i -H "Cookie: token=fake-token-123" https://ai-capsule-tur7.onrender.com/api/capsules
# Required: 401 Unauthorized
```

Results obtained against https://ai-capsule-tur7.onrender.com:

```
Test 1:
HTTP/1.1 401 Unauthorized
{"error":"Unauthorized: authentication required"}

Test 2:
HTTP/1.1 401 Unauthorized
{"error":"Unauthorized: invalid or expired token"}
```

Health check:

```bash
curl -i https://ai-capsule-tur7.onrender.com/api/health
# HTTP/1.1 200 OK
# {"status":"ok"}
```

Extra automated check (also covers POST, PUT and DELETE without a token):

```bash
npm run test:security -- https://ai-capsule-tur7.onrender.com
```

## 10. Limitation

**Storage is ephemeral on Render's free tier.** SQLite lives on the service's temporary filesystem, so all capsule records are lost whenever the service restarts, redeploys or sleeps after inactivity. For a real product the next step would be Render PostgreSQL or a persistent disk.

Other known limitations: the JWT cannot be revoked before it expires (logout clears the cookie in this browser, but a copied token stays valid for up to 8 hours), and the free instance has a cold start delay of up to about a minute.

## 11. AI-assisted development statement

**AI tools used:** Claude (Anthropic) was used to assist with project setup, React components, Express routes, SQLite queries, OAuth/JWT integration, cloud deployment, CSS, testing and debugging. I reviewed, ran and tested all generated code before using it.

**Problem found and corrected in AI-generated code or configuration:** my first Render deploy crashed on start with `Missing required environment variables: GITHUB_CALLBACK_URL`. I had set `APP_BASE_URL` on Render, but the code only reads `GITHUB_CALLBACK_URL`. I added the variable on Render and updated `server/config.js` so it builds the callback URL from `APP_BASE_URL` if the variable is missing. I also found a typo in the GitHub OAuth App redirect URI (`/auth/githucallbackb/`) and corrected it to `/auth/github/callback`, otherwise GitHub would reject the login redirect.

**How OAuth login, JWT verification and protected API behaviour were verified:**
- Signed in with GitHub on the deployed site and confirmed the redirect to `/dashboard` and the GitHub username and avatar in the header.
- In the browser DevTools (Application, Cookies) confirmed the cookie is named `token` and has HttpOnly and Secure ticked, without copying its value.
- Ran cURL Test 1 and Test 2 against the deployed URL; both returned `401 Unauthorized` and no capsule data.
- Ran `npm run test:security` against the deployed URL, which also confirms POST, PUT and DELETE return 401 without a token.
- Opened `/dashboard` in a private window (no cookie) and confirmed it redirects to `/login`.

**How CRUD behaviour and data ownership were verified:**
- Created, viewed, edited and deleted a capsule on the deployed site and refreshed the page after each step to confirm the change came from the database.
- Ran `npm run test:ownership` locally. It signs two test JWTs for user A and user B and checks that: user B cannot see, update or delete user A's record (404); a `user_id` sent in the request body is ignored; a JWT signed with the wrong secret and an expired JWT are rejected (401); invalid input returns 400; user A can update and delete their own record. All checks passed.

**Implementation or deployment decision I can explain:** I served the React build and the Express API from one Render Web Service instead of deploying them separately. Because the browser and API share one origin, the `token` cookie can use `SameSite=Lax` and is sent automatically with `fetch('/api/...')`. This avoids CORS configuration and cross-site cookie settings (`SameSite=None`), which are a common cause of login bugs, and it means only one public URL has to be configured in GitHub OAuth.

## 12. Security checklist

- No secrets in the repository: `.env` is in `.gitignore`; only `.env.example` with placeholder values is committed.
- The app JWT is never returned in a response body, logged or stored in localStorage.
- The GitHub access token is used once on the server and discarded.
- OAuth `state` parameter prevents login CSRF.
- `jwt.verify` pins the algorithm to HS256 and checks the issuer and expiry.
- Every CRUD route uses `requireAuth`, and every SQL statement is scoped by `user_id` from the verified JWT.
- Prepared statements prevent SQL injection; React escapes output, and screenshot links are limited to http and https URLs.
