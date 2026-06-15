import 'dotenv/config'
import { initDb, getDb } from '../services/db.js'

async function main() {
  await initDb()
  const db = getDb()
  const email = process.argv[2]
  if (!email) {
    console.error('Usage: tsx src/scripts/makeAdmin.ts your@email.com')
    process.exit(1)
  }
  const result = await db.collection('users').updateOne({ email }, { $set: { isAdmin: true } })
  if (result.matchedCount === 0) {
    console.error('User not found:', email)
    process.exit(1)
  }
  console.log(`✓ ${email} is now an admin`)
  process.exit(0)
}

main()
