import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../users/user.model.js';
import { Member } from '../members/member.model.js';
import { ApiError } from '../../utils/ApiError.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { env } from '../../config/env.js';

const ASSIGNABLE_ROLES = ['admin', 'accountant', 'member'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function signToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), role: user.role, societyId: user.societyId },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn }
  );
}

function publicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    societyId: user.societyId,
    flatNumber: user.flatNumber || null,
  };
}

// Creating accounts is an admin-only action (route is guarded by requireAuth + requireRole('admin')).
// The new user always inherits the creating admin's societyId, so an admin can never provision
// accounts into another tenant, and roles are restricted to the known set.
export const register = asyncHandler(async (req, res) => {
  const { name, email, password, role, memberId, flatNumber } = req.body;
  if (!name || !email || !password) {
    throw new ApiError(400, 'name, email and password are required');
  }
  if (typeof email !== 'string' || !EMAIL_RE.test(email)) throw new ApiError(400, 'A valid email is required');
  if (String(password).length < 8) {
    throw new ApiError(400, 'password must be at least 8 characters');
  }
  const assignedRole = role && ASSIGNABLE_ROLES.includes(role) ? role : 'member';

  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) throw new ApiError(409, 'Email already exists');

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({
    name,
    email,
    passwordHash,
    role: assignedRole,
    societyId: req.user.societyId,
    memberId: assignedRole === 'member' ? memberId || null : null,
    flatNumber: assignedRole === 'member' ? flatNumber || null : null,
  });

  res.status(201).json({ user: publicUser(user) });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) {
    throw new ApiError(400, 'email and password are required');
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) throw new ApiError(401, 'Invalid credentials');

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) throw new ApiError(401, 'Invalid credentials');

  // Auto-link a resident login to their flat: if a member account isn't linked yet but a member
  // record exists with the same email, connect them so the resident portal works.
  if (user.role === 'member' && !user.flatNumber) {
    const member = await Member.findOne({ societyId: user.societyId, email: user.email });
    if (member) {
      user.memberId = member._id;
      user.flatNumber = member.flatNumber;
      await user.save();
    }
  }

  const token = signToken(user);
  res.json({ token, user: publicUser(user) });
});

export const me = asyncHandler(async (req, res) => {
  res.json({ user: req.user });
});
