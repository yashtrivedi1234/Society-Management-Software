/**
 * Upsert demo login users into MongoDB.
 * Usage: npm run seed
 */
import mongoose from 'mongoose';
import { connectDb } from './src/config/db.js';
import { ensureDemoUsers, DEMO_ACCOUNTS } from './src/bootstrap/demoUsers.js';

async function main() {
  await connectDb();
  const emails = await ensureDemoUsers();
  console.log(`Seeded ${emails.length} demo users:`);
  for (const a of DEMO_ACCOUNTS) {
    console.log(`  ${a.role.padEnd(11)} ${a.email} / ${a.password}`);
  }
}

main()
  .catch((err) => {
    console.error('Seed failed:', err.message || err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect().catch(() => {});
  });
