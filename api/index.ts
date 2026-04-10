import app, { connectToDatabase } from '../server/src/index.js'

export default async function handler(req: any, res: any) {
  await connectToDatabase()
  return app(req, res)
}
