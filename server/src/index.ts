import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'
import bcrypt from 'bcrypt'
import multer from 'multer'
import { randomBytes, timingSafeEqual } from 'node:crypto'
import { DateTime } from 'luxon'
import {
  ServiceModel,
  StylistModel,
  AppointmentModel,
  AdminModel,
} from './models.js'
import {
  SALON_TZ,
  appointmentEnd,
  stylistConflict,
  busyIntervalsOverlappingDay,
  type AppointmentDoc,
} from './bookingAvailability.js'
import { authMiddleware, signToken, type AuthedRequest } from './middleware/auth.js'
import { sendBookingConfirmation } from './email.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const isVercel = Boolean(process.env.VERCEL)
const uploadsDir = isVercel ? path.join('/tmp', 'grace-uploads') : path.join(__dirname, '..', 'uploads')
fs.mkdirSync(uploadsDir, { recursive: true })

const PORT = Number(process.env.PORT) || 4000
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/grace-beauty-studio'
if (isVercel && MONGODB_URI.includes('127.0.0.1')) {
  console.warn('[db] Set MONGODB_URI in Vercel env to your Atlas URI (localhost is not reachable).')
}
const FRONTEND_URL = (process.env.FRONTEND_URL || '').replace(/\/$/, '')
let mongoConnectPromise: Promise<typeof mongoose> | null = null

export async function connectToDatabase() {
  if (mongoose.connection.readyState === 1) return mongoose
  if (!mongoConnectPromise) {
    mongoConnectPromise = mongoose.connect(MONGODB_URI).catch((error) => {
      mongoConnectPromise = null
      throw error
    })
  }
  await mongoConnectPromise
  return mongoose
}

function tokensMatch(stored: string | null | undefined, provided: string) {
  if (!stored) return false
  const a = Buffer.from(provided, 'utf8')
  const b = Buffer.from(stored, 'utf8')
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

const app = express()
/** After vercel.json rewrites `/api/*` → `/api/index`, keep the public path for Express matchers. */
if (isVercel) {
  app.use((req, _res, next) => {
    if (req.originalUrl?.startsWith('/api')) {
      req.url = req.originalUrl
    }
    next()
  })
}
app.use(cors({ origin: true, credentials: true }))
app.use(express.json())
/** Vercel serverless + local: ensure Mongo is ready before route handlers. */
app.use(async (_req, _res, next) => {
  try {
    await connectToDatabase()
    next()
  } catch (e) {
    next(e)
  }
})
if (!isVercel) {
  app.use('/uploads', express.static(uploadsDir))
}

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadsDir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase()
      const safe = ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext) ? ext : '.jpg'
      cb(null, `${Date.now()}-${randomBytes(8).toString('hex')}${safe}`)
    },
  }),
  limits: { fileSize: 3 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    cb(null, /^image\/(jpeg|png|webp|gif)$/.test(file.mimetype))
  },
})

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string }
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' })
  }
  const admin = await AdminModel.findOne({ email: email.toLowerCase().trim() })
  if (!admin) {
    return res.status(401).json({ error: 'Invalid credentials' })
  }
  const ok = await bcrypt.compare(password, admin.passwordHash)
  if (!ok) {
    return res.status(401).json({ error: 'Invalid credentials' })
  }
  const token = signToken(String(admin._id), admin.email)
  res.json({ token, email: admin.email })
})

app.get('/api/services', async (_req, res) => {
  const list = await ServiceModel.find({ active: true }).sort({ sortOrder: 1, name: 1 }).lean()
  res.json(list)
})

app.get('/api/services/:id', async (req, res) => {
  const doc = await ServiceModel.findOne({ _id: req.params.id, active: true }).lean()
  if (!doc) return res.status(404).json({ error: 'Not found' })
  res.json(doc)
})

app.get('/api/stylists', async (_req, res) => {
  const list = await StylistModel.find({ active: true }).sort({ sortOrder: 1, name: 1 }).lean()
  res.json(list)
})

/** Public: stylist busy intervals for a calendar day (Eastern `YYYY-MM-DD`) for slot filtering. */
app.get('/api/booking/busy', async (req, res) => {
  const date = typeof req.query.date === 'string' ? req.query.date : ''
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: 'Invalid date' })
  }
  const dayStart = DateTime.fromISO(date, { zone: SALON_TZ }).startOf('day')
  const dayEnd = dayStart.endOf('day')
  const list = await AppointmentModel.find({
    status: { $in: ['pending', 'confirmed'] },
    scheduledAt: { $lt: dayEnd.toJSDate() },
  })
    .lean()
    .limit(500)

  const filtered = list.filter((appt) => {
    const exStart = new Date(appt.scheduledAt)
    const exEnd = appointmentEnd(exStart, appt.lineItems as AppointmentDoc['lineItems'])
    return exEnd > dayStart.toJSDate() && exStart < dayEnd.toJSDate()
  })

  const busy = busyIntervalsOverlappingDay(
    dayStart.toJSDate(),
    dayEnd.toJSDate(),
    filtered as unknown as AppointmentDoc[]
  )
  res.json({ date, busy })
})

app.post('/api/appointments', async (req, res) => {
  const body = req.body as {
    customerPhone?: string
    customerEmail: string
    firstName?: string
    lastName?: string
    notes?: string
    scheduledAt: string
    timezone?: string
    lineItems: {
      serviceId: string
      serviceName: string
      priceCents: number
      durationMinutes: number
      stylistId?: string | null
      stylistName?: string | null
      serviceNoPhoto?: boolean
      stylistNoPhoto?: boolean
    }[]
  }

  if (!body.customerEmail || !body.scheduledAt || !Array.isArray(body.lineItems)) {
    return res.status(400).json({ error: 'Invalid payload' })
  }

  const phoneRaw = (body.customerPhone ?? '').trim()
  const phoneDigits = phoneRaw.startsWith('+')
    ? phoneRaw.slice(1).replace(/\D/g, '')
    : phoneRaw.replace(/\D/g, '')
  if (phoneDigits.length < 8 || phoneDigits.length > 15) {
    return res.status(400).json({ error: 'A valid phone number is required' })
  }
  if (!body.firstName?.trim() || !body.lastName?.trim()) {
    return res.status(400).json({ error: 'First and last name are required' })
  }

  const scheduledAt = new Date(body.scheduledAt)
  if (Number.isNaN(scheduledAt.getTime())) {
    return res.status(400).json({ error: 'Invalid appointment time' })
  }
  if (scheduledAt.getTime() <= Date.now()) {
    return res.status(400).json({ error: 'Please choose a future date and time.' })
  }

  const newEnd = appointmentEnd(scheduledAt, body.lineItems)
  const candidates = await AppointmentModel.find({
    status: { $in: ['pending', 'confirmed'] },
    scheduledAt: { $lt: newEnd },
  })
    .lean()
    .limit(2000)

  for (const ex of candidates) {
    const exStart = new Date(ex.scheduledAt)
    const exEnd = appointmentEnd(exStart, ex.lineItems as AppointmentDoc['lineItems'])
    if (exEnd <= scheduledAt || exStart >= newEnd) continue
    if (
      stylistConflict(
        scheduledAt,
        body.lineItems,
        exStart,
        ex.lineItems as AppointmentDoc['lineItems']
      )
    ) {
      return res.status(409).json({
        error:
          'That time is no longer available for your stylist. Please choose another slot.',
      })
    }
  }

  const cancellationToken = randomBytes(32).toString('hex')

  const appt = await AppointmentModel.create({
    customerPhone: `+${phoneDigits}`,
    customerEmail: body.customerEmail.trim().toLowerCase(),
    firstName: body.firstName ?? '',
    lastName: body.lastName ?? '',
    notes: body.notes ?? '',
    scheduledAt,
    timezone: body.timezone || 'America/New_York',
    lineItems: body.lineItems,
    status: 'pending',
    cancellationToken,
  })

  const confirmationPath = `/book/confirmation/${String(appt._id)}`
  const manageUrl = FRONTEND_URL
    ? `${FRONTEND_URL}${confirmationPath}?token=${encodeURIComponent(cancellationToken)}`
    : ''

  const emailResult = await sendBookingConfirmation(appt.customerEmail, {
    firstName: appt.firstName,
    scheduledAt: appt.scheduledAt,
    timezone: appt.timezone,
    lineItems: appt.lineItems.map(
      (l: { serviceName: string; stylistName?: string | null; priceCents: number }) => ({
        serviceName: l.serviceName,
        stylistName: l.stylistName,
        priceCents: l.priceCents,
      })
    ),
    manageUrl,
  })

  if (emailResult.ok) {
    appt.confirmationEmailSentAt = new Date()
  } else {
    appt.confirmationEmailError = emailResult.error ?? 'Unknown'
  }
  await appt.save()

  const raw = appt.toObject()
  const { cancellationToken: ct, ...appointment } = raw
  res.status(201).json({
    id: String(appt._id),
    cancellationToken: ct,
    confirmationEmailSent: emailResult.ok,
    appointment,
  })
})

/** Load appointment details with the secret link token (e.g. from confirmation email). */
app.get('/api/appointments/:id/public', async (req, res) => {
  const token = typeof req.query.token === 'string' ? req.query.token : ''
  if (!token) {
    return res.status(400).json({ error: 'Missing token' })
  }
  const appt = await AppointmentModel.findById(req.params.id)
  if (!appt) {
    return res.status(404).json({ error: 'Not found' })
  }
  if (!tokensMatch(appt.cancellationToken, token)) {
    return res.status(403).json({ error: 'Invalid token' })
  }
  const safe = appt.toObject()
  delete safe.cancellationToken
  res.json(safe)
})

/** Customer cancel — requires the same secret token issued at booking. */
app.post('/api/appointments/:id/cancel', async (req, res) => {
  const token = (req.body as { token?: string })?.token
  if (!token || typeof token !== 'string') {
    return res.status(400).json({ error: 'Token required' })
  }
  const appt = await AppointmentModel.findById(req.params.id)
  if (!appt) {
    return res.status(404).json({ error: 'Not found' })
  }
  if (!appt.cancellationToken) {
    return res.status(403).json({ error: 'Cancellation is not available for this booking' })
  }
  if (appt.status === 'cancelled') {
    return res.status(409).json({ error: 'This appointment is already cancelled' })
  }
  if (!tokensMatch(appt.cancellationToken, token)) {
    return res.status(403).json({ error: 'Invalid token' })
  }
  appt.status = 'cancelled'
  await appt.save()
  res.json({ ok: true })
})

app.get('/api/appointments', authMiddleware, async (_req: AuthedRequest, res) => {
  const list = await AppointmentModel.find().sort({ createdAt: -1 }).limit(200).lean()
  res.json(
    list.map((row) => {
      const copy = { ...(row as Record<string, unknown>) }
      delete copy.cancellationToken
      return copy
    })
  )
})

app.get('/api/appointments/:id', authMiddleware, async (req, res) => {
  const doc = await AppointmentModel.findById(req.params.id).lean()
  if (!doc) return res.status(404).json({ error: 'Not found' })
  const copy = { ...(doc as Record<string, unknown>) }
  delete copy.cancellationToken
  res.json(copy)
})

const ADMIN_APPT_STATUSES = new Set(['pending', 'confirmed', 'declined', 'cancelled'])

app.patch('/api/admin/appointments/:id', authMiddleware, async (req, res) => {
  const body = req.body as { status?: string; scheduledAt?: string; notes?: string }
  const appt = await AppointmentModel.findById(req.params.id)
  if (!appt) {
    return res.status(404).json({ error: 'Not found' })
  }
  if (body.status !== undefined) {
    if (!ADMIN_APPT_STATUSES.has(body.status)) {
      return res.status(400).json({ error: 'Invalid status' })
    }
    appt.status = body.status
  }
  if (body.scheduledAt !== undefined) {
    const d = new Date(body.scheduledAt)
    if (Number.isNaN(d.getTime())) {
      return res.status(400).json({ error: 'Invalid scheduledAt' })
    }
    appt.scheduledAt = d
  }
  if (body.notes !== undefined && typeof body.notes === 'string') {
    appt.notes = body.notes
  }
  await appt.save()
  const copy = { ...(appt.toObject() as Record<string, unknown>) }
  delete copy.cancellationToken
  res.json(copy)
})

app.post('/api/admin/upload', authMiddleware, upload.single('file'), (req, res) => {
  if (isVercel) {
    return res.status(501).json({
      error:
        'Direct file uploads are not supported on Vercel without persistent object storage. Paste an external image URL instead.',
    })
  }
  const f = req.file
  if (!f) {
    return res.status(400).json({ error: 'Invalid or missing image file' })
  }
  res.json({ url: `/uploads/${f.filename}` })
})

app.get('/api/admin/services', authMiddleware, async (_req, res) => {
  const list = await ServiceModel.find().sort({ sortOrder: 1, name: 1 }).lean()
  res.json(list)
})

app.post('/api/admin/services', authMiddleware, async (req, res) => {
  const doc = await ServiceModel.create(req.body)
  res.status(201).json(doc)
})

app.patch('/api/admin/services/:id', authMiddleware, async (req, res) => {
  const doc = await ServiceModel.findByIdAndUpdate(req.params.id, req.body, { new: true })
  if (!doc) return res.status(404).json({ error: 'Not found' })
  res.json(doc)
})

app.delete('/api/admin/services/:id', authMiddleware, async (req, res) => {
  await ServiceModel.findByIdAndDelete(req.params.id)
  res.status(204).end()
})

app.get('/api/admin/stylists', authMiddleware, async (_req, res) => {
  const list = await StylistModel.find().sort({ sortOrder: 1, name: 1 }).lean()
  res.json(list)
})

app.post('/api/admin/stylists', authMiddleware, async (req, res) => {
  const doc = await StylistModel.create(req.body)
  res.status(201).json(doc)
})

app.patch('/api/admin/stylists/:id', authMiddleware, async (req, res) => {
  const doc = await StylistModel.findByIdAndUpdate(req.params.id, req.body, { new: true })
  if (!doc) return res.status(404).json({ error: 'Not found' })
  res.json(doc)
})

app.delete('/api/admin/stylists/:id', authMiddleware, async (req, res) => {
  await StylistModel.findByIdAndDelete(req.params.id)
  res.status(204).end()
})

async function start() {
  await connectToDatabase()
  console.log('MongoDB connected')
  app.listen(PORT, () => {
    console.log(`API http://localhost:${PORT}`)
  })
}

export default app

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  start().catch((e) => {
    console.error(e)
    process.exit(1)
  })
}
