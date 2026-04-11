import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-insecure-change-me'

if (process.env.VERCEL && JWT_SECRET === 'dev-insecure-change-me') {
  console.warn(
    '[auth] Set JWT_SECRET in Vercel Project → Settings → Environment Variables (Production).'
  )
}

export type AuthedRequest = Request & { adminId?: string; adminEmail?: string }

export function authMiddleware(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { sub: string; email: string }
    req.adminId = payload.sub
    req.adminEmail = payload.email
    next()
  } catch {
    return res.status(401).json({ error: 'Invalid token' })
  }
}

export function signToken(adminId: string, email: string) {
  return jwt.sign({ sub: adminId, email }, JWT_SECRET, { expiresIn: '7d' })
}
