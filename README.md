# Grace Beauty Studio

Mobile-first React (Vite) + Tailwind customer site with a booking flow, plus a hidden **admin** area at `/admin` for managing services, stylists, and viewing appointments.

The API is a small **Express** + **MongoDB Atlas** (Mongoose) server in `server/`. Confirmation emails use [Resend](https://resend.com) when `RESEND_API_KEY` is set.

## Prerequisites

- Node 20+
- MongoDB (local `mongodb://127.0.0.1:27017` or [MongoDB Atlas](https://www.mongodb.com/atlas) connection string)

## Setup

### 1. API (`server/`)

```bash
cd server
cp .env.example .env
# Set MONGODB_URI, JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD, RESEND_API_KEY (optional), EMAIL_FROM
npm install
npm run seed   # creates admin user + sample services/stylists if empty
npm run dev    # http://localhost:4000
```

### 2. Web (repo root)

```bash
cp .env.example .env   # optional; Vite proxies /api to localhost:4000 in dev
npm install
npm run dev            # runs API + Vite together
```

- Customer site: Vite dev server (default **5173**), proxied to API **4000**.
- Admin: open **http://localhost:5173/admin** (no link on the public site).

## Production

### Vercel

- This repo can now deploy to a single Vercel project with the SPA and Express API together.
- Vercel serves the frontend from `dist/` and routes `/api/*` into the Express app via `api/index.ts` and `api/[...path].ts`.
- Add these environment variables in the Vercel project:
  - `MONGODB_URI`
  - `JWT_SECRET`
  - `ADMIN_EMAIL`
  - `ADMIN_PASSWORD`
  - `FRONTEND_URL`
  - `RESEND_API_KEY` (optional)
  - `EMAIL_FROM` (optional)
- Leave `VITE_API_URL` empty on Vercel so the frontend uses same-origin `/api/...`.
- Run `npm run seed` locally against the same `MONGODB_URI` at least once to create the first admin account.

### Uploads on Vercel

- Vercel does not persist local disk uploads from Express. The admin upload endpoint returns a clear error in that environment.
- For production on Vercel, use hosted image URLs directly in the admin forms, or wire the upload route to object storage such as Vercel Blob, S3, or Cloudinary.

## Scripts

| Command        | Description                |
| -------------- | -------------------------- |
| `npm run dev`  | API + Vite concurrently    |
| `npm run build`| Typecheck + Vite build     |
| `npm run lint` | ESLint                     |
