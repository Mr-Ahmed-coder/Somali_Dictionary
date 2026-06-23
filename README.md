# Somali Dictionary

A production-ready English and Somali dictionary platform built with a Next.js frontend, an Express REST API, and MongoDB Atlas. The app supports public dictionary search, word details, category browsing, secure admin management, and CSV/XLSX bulk import.

## Latest Updates

- Added 1000+ English and Somali dictionary words in MongoDB Atlas
- Added About Us page
- Added Categories and category browsing pages
- Added Word Details page
- Improved homepage UI with a search-focused experience
- Improved dictionary search with partial matching and suggestions
- Migrated the database from local MongoDB to MongoDB Atlas
- Fixed CSV/XLSX import for Google Sheets exports
- Added General category dataset
- Upgraded admin security to JWT login with bcrypt-hashed passwords

## Features

- English to Somali and Somali to English word lookup
- Case-insensitive partial search with autocomplete suggestions
- Word detail pages with definitions, examples, category, and part of speech
- Browse by category with category word counts
- Secure admin login with email, password, bcrypt hashing, and JWT sessions
- Admin CRUD for dictionary words and categories
- CSV/XLSX import with preview, validation, duplicate checks, and import summary
- MongoDB indexes for scalable search and lookup performance
- Production CORS, rate limiting, Helmet security headers, and health checks
- Prepared for future AI, voice, favorites, popularity, and offline sync features

## Tech Stack

- Frontend: Next.js App Router, React, Tailwind CSS
- Backend: Node.js, Express, Mongoose
- Database: MongoDB Atlas
- Auth: JWT, bcrypt-compatible password hashing
- Uploads/imports: Multer memory storage and `xlsx`
- Deployment targets: Vercel for frontend, Render for backend

## Project Structure

```text
.
|-- client/                 # Next.js frontend
|   |-- src/app/            # App Router pages
|   |-- src/components/     # Search, category, import, and admin UI
|   |-- src/lib/            # Frontend API clients and config
|   `-- .env.example        # Frontend environment example
|-- server/                 # Express backend
|   |-- scripts/            # Seed and admin bootstrap scripts
|   |-- src/config/         # Environment and database setup
|   |-- src/controllers/    # Request handlers
|   |-- src/middleware/     # Auth, upload, validation, error handling
|   |-- src/models/         # Mongoose schemas
|   |-- src/routes/         # REST routes
|   |-- src/services/       # Business logic
|   |-- src/validators/     # Zod request validation
|   |-- server.js           # Render-compatible entrypoint
|   `-- .env.example        # Backend environment example
|-- docs/                   # API and database documentation
|-- render.yaml             # Render backend blueprint
`-- package.json            # Root workspace scripts
```

## Environment Variables

Copy the example files before running the project:

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env.local
```

Backend (`server/.env`):

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=your_mongodb_uri
FRONTEND_URL=http://localhost:3000
JWT_SECRET=replace_with_a_long_secure_jwt_secret
JWT_EXPIRES_IN=8h
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=replace_with_a_long_secure_admin_password
ADMIN_NAME=Dictionary Admin
ADMIN_API_KEY=
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=200
AI_PROVIDER=disabled
AI_API_KEY=
```

Frontend (`client/.env.local`):

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

Never commit real `.env` files, database connection strings, API keys, passwords, or secrets.

## Installation

Install all workspace dependencies from the project root:

```bash
npm install
```

Create or update the first admin user from trusted environment variables:

```bash
npm run create-admin
```

Seed starter dictionary data if needed:

```bash
npm run seed
```

Run the frontend and backend together:

```bash
npm run dev
```

Useful URLs in local development:

- Frontend: `http://localhost:3000`
- Backend health check: `http://localhost:5000/`
- API base: `http://localhost:5000/api`

## Scripts

Root scripts:

```bash
npm run dev           # Run client and server together
npm run build         # Build the Next.js frontend
npm run start         # Start the Express backend
npm run lint          # Lint the frontend
npm run seed          # Seed dictionary data
npm run create-admin  # Create/update the protected admin user
```

Backend scripts:

```bash
npm run dev --prefix server
npm run start --prefix server
npm run check --prefix server
npm run create-admin --prefix server
```

Frontend scripts:

```bash
npm run dev --prefix client
npm run build --prefix client
npm run lint --prefix client
```

## Admin Security

- There is no public admin registration route.
- Admin users are created with `npm run create-admin` using `ADMIN_EMAIL` and `ADMIN_PASSWORD` from environment variables.
- Passwords are stored as bcrypt hashes only.
- Admin login returns a JWT signed with `JWT_SECRET`.
- Protected requests use `Authorization: Bearer <token>`.
- Admin tokens are stored in browser `sessionStorage` and cleared on logout or expiry.
- Admin-only routes protect create, update, delete, category management, and CSV/XLSX import.

## Deployment

### Backend on Render

Render settings:

- Root directory: `server`
- Build command: `npm install`
- Start command: `npm start`
- Health check path: `/`

Required backend environment variables on Render:

```env
NODE_ENV=production
PORT=5000
MONGODB_URI=your_mongodb_atlas_uri
FRONTEND_URL=https://your-vercel-domain.vercel.app
JWT_SECRET=your_long_secure_jwt_secret
JWT_EXPIRES_IN=8h
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=your_long_secure_admin_password
ADMIN_NAME=Dictionary Admin
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=200
AI_PROVIDER=disabled
AI_API_KEY=
```

After setting Render environment variables, run the backend admin bootstrap once:

```bash
npm run create-admin --prefix server
```

### Frontend on Vercel

Set this environment variable in Vercel:

```env
NEXT_PUBLIC_API_URL=https://your-render-service.onrender.com/api
```

Then deploy the `client` workspace.

## GitHub Safety Checklist

- Real `.env` files are ignored
- `node_modules`, `.next`, uploads, logs, and local build artifacts are ignored
- Configuration values are read from environment variables
- Public examples use placeholders only
- Admin requests require a valid JWT bearer token
- Import uploads use memory storage, so no upload files need to be committed

## Release Commands

Use these commands after reviewing the local changes:

```bash
git status
git add .
git commit -m "Secure admin authentication with JWT"
git push origin main
```
