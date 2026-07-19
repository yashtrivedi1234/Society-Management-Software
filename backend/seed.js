/**
 * Upsert demo login users + sample society data into MongoDB.
 * Usage: npm run seed
 */
import mongoose from 'mongoose';
import { connectDb } from './src/config/db.js';
import { ensureDemoUsers, DEMO_ACCOUNTS } from './src/bootstrap/demoUsers.js';
import { ensureDemoDataset } from './src/bootstrap/demoDataset.js';

async function main() {
  await connectDb();

  const emails = await ensureDemoUsers();
  const dataset = await ensureDemoDataset();

  console.log(`Users (${emails.length}):`);
  for (const a of DEMO_ACCOUNTS) {
    console.log(`  ${a.role.padEnd(11)} ${a.email} / ${a.password}`);
  }
  console.log(`\nSample data for month ${dataset.month}:`);
  console.log(`  members: ${dataset.members}`);
  console.log('  payments, expenses, notices, complaints, visitors: seeded');
}

main()
  .catch((err) => {
    console.error('Seed failed:', err.message || err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect().catch(() => {});
  });
