import 'dotenv/config'
import mongoose from 'mongoose'
import bcrypt from 'bcrypt'
import {
  ServiceModel,
  StylistModel,
  AdminModel,
} from './models.js'

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/grace-beauty-studio'
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@gracebeautystudio.local'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'changeme123'

async function main() {
  await mongoose.connect(MONGODB_URI)
  console.log('Connected to MongoDB')

  const hash = await bcrypt.hash(ADMIN_PASSWORD, 10)
  await AdminModel.findOneAndUpdate(
    { email: ADMIN_EMAIL },
    { email: ADMIN_EMAIL, passwordHash: hash, name: 'Owner' },
    { upsert: true }
  )
  console.log('Admin upserted:', ADMIN_EMAIL)

  const serviceCount = await ServiceModel.countDocuments()
  if (serviceCount === 0) {
    await ServiceModel.insertMany([
      {
        category: 'Lashes',
        name: 'Classic Full Set',
        description: 'Natural-looking individual lash extensions tailored to your eye shape.',
        priceCents: 12000,
        durationMinutes: 120,
        imageUrl:
          'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=400&h=300&fit=crop',
        sortOrder: 1,
        active: true,
      },
      {
        category: 'Brows',
        name: 'Brow Shaping & Tint',
        description: 'Wax or tweeze with optional tint for defined brows.',
        priceCents: 4500,
        durationMinutes: 45,
        imageUrl:
          'https://images.unsplash.com/photo-1596462502278-27bfdc403368?w=400&h=300&fit=crop',
        sortOrder: 2,
        active: true,
      },
      {
        category: 'Facial',
        name: 'Signature Glow Facial',
        description: 'Cleanse, exfoliate, mask, and hydration for refreshed skin.',
        priceCents: 9500,
        durationMinutes: 60,
        imageUrl:
          'https://images.unsplash.com/photo-1570172619640-dfd03ed5d881?w=400&h=300&fit=crop',
        sortOrder: 3,
        active: true,
      },
      {
        category: 'Waxing',
        name: 'Brazilian Wax',
        description: 'Professional full wax with premium hard wax for comfort.',
        priceCents: 6500,
        durationMinutes: 45,
        imageUrl:
          'https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=400&h=300&fit=crop',
        sortOrder: 4,
        active: true,
      },
    ])
    console.log('Seeded services')
  }

  const stylistCount = await StylistModel.countDocuments()
  if (stylistCount === 0) {
    await StylistModel.insertMany([
      {
        name: 'Alex Morgan',
        bio: 'Lash and brow specialist with 8+ years experience.',
        avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=128&h=128&fit=crop',
        sortOrder: 1,
        active: true,
      },
      {
        name: 'Jordan Lee',
        bio: 'Facials and waxing; gentle technique, detail-oriented.',
        avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=128&h=128&fit=crop',
        sortOrder: 2,
        active: true,
      },
    ])
    console.log('Seeded stylists')
  }

  await mongoose.disconnect()
  console.log('Done.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
