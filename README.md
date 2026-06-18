# Somali Dictionary

A production-ready English and Somali dictionary platform built with a Next.js frontend, an Express REST API, and MongoDB Atlas. The app supports public dictionary search, word details, category browsing, admin word management, and CSV/XLSX bulk import.

## Features

- English to Somali and Somali to English word lookup
- Case-insensitive partial search with autocomplete suggestions
- Word detail pages with definitions, examples, category, and part of speech
- Browse by category with category word counts
- Admin authentication using an API key
- Admin CRUD for dictionary words and categories
- CSV/XLSX import with preview, validation, duplicate checks, and import summary
- MongoDB indexes for scalable search and lookup performance
- Production CORS, rate limiting, Helmet security headers, and health checks
- Prepared for future AI, voice, favorites, popularity, and offline sync features

## Tech Stack

- Frontend: Next.js App Router, React, Tailwind CSS
- Backend: Node.js, Express, Mongoose
- Database: MongoDB Atlas
- Uploads/imports: Multer memory storage and `xlsx`
- Deployment targets: Vercel for frontend, Render for backend

## Project Structure

```text
.
├── client/                 # Next.js frontend
│   ├── src/app/            # App Router pages
│   ├── src/components/     # Search, category, import, and admin UI
│   ├── src/lib/            # Frontend API clients and config
│   └── .env.example        # Frontend environment example
├── server/                 # Express backend
│   ├── scripts/            # Seed script
│   ├── src/config/         # Environment and database setup
│   ├── src/controllers/    # Request handlers
│   ├── src/middleware/     # Auth, upload, validation, error handling
│   ├── src/models/         # Mongoose schemas
│   ├── src/routes/         # REST routes
│   ├── src/services/       # Business logic
│   ├── src/validators/     # Zod request validation
│   ├── server.js           # Render-compatible entrypoint
│   └── .env.example        # Backend environment example
├── docs/                   # API and database documentation
├── render.yaml             # Render backend blueprint
└── package.json            # Root workspace scripts
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
ADMIN_API_KEY=replace_with_a_long_secure_admin_key
JWT_SECRET=replace_with_a_long_secure_jwt_secret
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

Seed starter data if needed:

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
npm run dev      # Run client and server together
npm run build    # Build the Next.js frontend
npm run start    # Start the Express backend
npm run lint     # Lint the frontend
npm run seed     # Seed dictionary data
```

Backend scripts:

```bash
npm run dev --prefix server
npm run start --prefix server
npm run check --prefix server
```

Frontend scripts:

```bash
npm run dev --prefix client
npm run build --prefix client
npm run lint --prefix client
```

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
ADMIN_API_KEY=your_long_secure_admin_key
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=200
AI_PROVIDER=disabled
AI_API_KEY=
```

### Frontend on Vercel

Set this environment variable in Vercel:

```env
NEXT_PUBLIC_API_URL=https://your-render-service.onrender.com/api
```

Then deploy the `client` workspace.

## GitHub Checklist

- Real `.env` files are ignored
- `node_modules`, `.next`, uploads, logs, and local build artifacts are ignored
- Configuration values are read from environment variables
- Public examples use placeholders only
- Admin API requests require the configured `x-admin-key`
- Import uploads use memory storage, so no upload files need to be committed

## Initial Git Commands

Run these after reviewing the readiness report:

```bash
git init
git add .
git commit -m "Initial English Somali dictionary platform"
git branch -M main
git remote add origin https://github.com/Mr-Ahmed-coder/Somali_Dictionary.git
git push -u origin main
```
