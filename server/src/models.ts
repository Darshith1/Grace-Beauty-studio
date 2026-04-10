/* eslint-disable @typescript-eslint/no-explicit-any -- Mongoose `models.X || model()` needs a callable Model; plain `any` avoids TS2349 on Vercel. */
import mongoose, { type Model } from 'mongoose'

const lineItemSchema = new mongoose.Schema(
  {
    serviceId: { type: String, required: true },
    serviceName: { type: String, required: true },
    priceCents: { type: Number, required: true },
    durationMinutes: { type: Number, required: true },
    stylistId: { type: String, default: null },
    stylistName: { type: String, default: null },
    serviceNoPhoto: { type: Boolean, default: false },
    stylistNoPhoto: { type: Boolean, default: false },
  },
  { _id: false }
)

/**
 * `mongoose.models.X || mongoose.model(...)` can infer a type where static helpers
 * like `.find()` are not callable (TS2349) under some TS / CI setups (e.g. Vercel).
 */
export const ServiceModel = (
  mongoose.models.Service ||
  mongoose.model(
    'Service',
    new mongoose.Schema(
      {
        category: { type: String, required: true },
        name: { type: String, required: true },
        description: { type: String, default: '' },
        priceCents: { type: Number, required: true },
        durationMinutes: { type: Number, required: true },
        imageUrl: { type: String, default: '' },
        /** When true, booking site shows text only (no service image). */
        noPhoto: { type: Boolean, default: false },
        sortOrder: { type: Number, default: 0 },
        active: { type: Boolean, default: true },
      },
      { timestamps: true }
    )
  )
) as Model<any>

export const StylistModel = (
  mongoose.models.Stylist ||
  mongoose.model(
    'Stylist',
    new mongoose.Schema(
      {
        name: { type: String, required: true },
        bio: { type: String, default: '' },
        avatarUrl: { type: String, default: '' },
        /** When true, booking site shows text only (no staff photo). */
        noPhoto: { type: Boolean, default: false },
        sortOrder: { type: Number, default: 0 },
        active: { type: Boolean, default: true },
      },
      { timestamps: true }
    )
  )
) as Model<any>

export const AppointmentModel = (
  mongoose.models.Appointment ||
  mongoose.model(
    'Appointment',
    new mongoose.Schema(
      {
        customerPhone: { type: String, default: '' },
        customerEmail: { type: String, required: true },
        firstName: { type: String, default: '' },
        lastName: { type: String, default: '' },
        notes: { type: String, default: '' },
        scheduledAt: { type: Date, required: true },
        timezone: { type: String, default: 'America/New_York' },
        lineItems: { type: [lineItemSchema], default: [] },
        status: { type: String, default: 'pending' },
        cancellationToken: { type: String, default: null },
        confirmationEmailSentAt: { type: Date, default: null },
        confirmationEmailError: { type: String, default: null },
      },
      { timestamps: true }
    )
  )
) as Model<any>

export const AdminModel = (
  mongoose.models.Admin ||
  mongoose.model(
    'Admin',
    new mongoose.Schema({
      email: { type: String, unique: true, required: true },
      passwordHash: { type: String, required: true },
      name: { type: String, default: '' },
    })
  )
) as Model<any>
