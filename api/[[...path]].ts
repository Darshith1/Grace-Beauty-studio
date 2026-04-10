/**
 * Vercel serverless: optional catch-all handles `/api` and `/api/*`.
 * A lone `api/index.ts` only matched `/api` exactly; nested routes need this file.
 * Two competing `api/*.ts` handlers can cause NOT_FOUND / routing conflicts.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'
import type { Request, Response } from 'express'
import app, { connectToDatabase } from '../server/src/index.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await connectToDatabase()
  return app(req as unknown as Request, res as unknown as Response)
}
