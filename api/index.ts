/**
 * Single serverless entry for all `/api/*` routes.
 * Non-Next Vercel projects do not treat `api/[...path].ts` as a multi-segment catch-all,
 * so nested paths like `/api/services/:id` return NOT_FOUND. Rewrites in `vercel.json`
 * send every `/api/*` request here; Express still sees the real path via `originalUrl`.
 */
import app from '../server/src/index.js'

export default app
