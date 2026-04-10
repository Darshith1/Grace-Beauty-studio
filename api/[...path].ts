/**
 * Vercel serverless: catch-all for `/api/*` (one or more segments).
 * Export the Express `app` so @vercel/node can invoke it correctly (avoids NOT_FOUND).
 */
import app from '../server/src/index.js'

export default app
