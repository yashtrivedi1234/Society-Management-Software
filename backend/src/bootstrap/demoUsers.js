/**
 * Ensure demo login users exist (idempotent). Used by `npm run seed` and server boot.
 */
import bcrypt from 'bcryptjs';
import { User } from '../modules/users/user.model.js';
import { Member } from '../modules/members/member.model.js';

const societyId = 'default';

// Keep both email sets so older and newer demo UIs can both sign in.
export const DEMO_ACCOUNTS = [
  { role: 'admin', name: 'Demo Admin', email: 'admin@greenvalley.demo', password: 'Admin@123' },
  { role: 'accountant', name: 'Demo Accountant', email: 'accountant@greenvalley.demo', password: 'Account@123' },
  { role: 'member', name: 'Demo Member', email: 'member@greenvalley.demo', password: 'Member@123', flatNumber: 'A-101' },
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

export async function ensureDemoUsers() {
  // A-101 is the resident portal demo flat (Rajesh / member@greenvalley.demo).
  const memberRecord = await upsertMember('A-101', 'Rajesh Sharma', 'member@greenvalley.demo');

  const created = [];
  for (const account of DEMO_ACCOUNTS) {
    const memberId = account.role === 'member' ? memberRecord._id : null;
    const user = await upsertUser({
      ...account,
      name: account.role === 'member' ? 'Rajesh Sharma' : account.name,
      flatNumber: account.role === 'member' ? 'A-101' : account.flatNumber,
      memberId,
    });
    created.push(user.email);
  }
  return created;
}
