/**
 * Upsert demo login users into MongoDB.
 * Usage: npm run seed
 */
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { connectDb } from './src/config/db.js';
import { User } from './src/modules/users/user.model.js';
import { Member } from './src/modules/members/member.model.js';

const societyId = 'default';

const accounts = [
  { role: 'admin', name: 'Demo Admin', email: 'admin@clave.demo', password: 'Admin@123' },
  { role: 'accountant', name: 'Demo Accountant', email: 'accountant@clave.demo', password: 'Account@123' },
  { role: 'member', name: 'Demo Member', email: 'member@clave.demo', password: 'Member@123', flatNumber: 'A-101' },
];

async function upsertMember(flatNumber, name, email) {
  return Member.findOneAndUpdate(
    { societyId, flatNumber },
    {
      societyId,
      flatNumber,
      name,
      email,
      phone: '9810845632',
      isOwner: true,
      familyMembers: 3,
      status: 'active',
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

async function upsertUser({ role, name, email, password, flatNumber, memberId }) {
  const passwordHash = await bcrypt.hash(String(password), 10);
  return User.findOneAndUpdate(
    { email: String(email).toLowerCase().trim() },
    {
      name,
      email: String(email).toLowerCase().trim(),
      passwordHash,
      role,
      societyId,
      flatNumber: flatNumber || null,
      memberId: memberId || null,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

async function main() {
  await connectDb();

  const memberAccount = accounts.find((a) => a.role === 'member');
  const memberRecord = await upsertMember(
    memberAccount.flatNumber,
    memberAccount.name,
    memberAccount.email
  );

  for (const account of accounts) {
    const memberId = account.role === 'member' ? memberRecord._id : null;
    const user = await upsertUser({ ...account, memberId });
    console.log(`✓ ${user.role.padEnd(11)} ${user.email}`);
  }

  console.log(`\nSeeded society "${societyId}".`);
  for (const a of accounts) {
    console.log(`  ${a.role}: ${a.email} / ${a.password}`);
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
