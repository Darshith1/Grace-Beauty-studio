/**
 * Replace all services in MongoDB with the full menu from `menuSeedData.ts`.
 * Point MONGODB_URI at Atlas (or local) — uses `server/.env` or env vars.
 *
 *   cd server && npm run seed:menu
 */
import 'dotenv/config'
import mongoose from 'mongoose'
import { ServiceModel } from './models.js'
import { MENU_SERVICES } from './menuSeedData.js'

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/grace-beauty-studio'

async function main() {
  await mongoose.connect(MONGODB_URI)
  console.log('Connected to MongoDB')

  const deleted = await ServiceModel.deleteMany({})
  console.log(`Removed ${deleted.deletedCount} existing service documents`)

  const inserted = await ServiceModel.insertMany(MENU_SERVICES)
  console.log(`Inserted ${inserted.length} services from menu`)

  await mongoose.disconnect()
  console.log('Done.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
