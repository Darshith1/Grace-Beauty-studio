/** Vercel serverless entry: `vercel.json` rewrites `/api/*` → `/api/index`; Express uses `originalUrl` on Vercel. */
import app from '../server/src/index.js'

export default app
