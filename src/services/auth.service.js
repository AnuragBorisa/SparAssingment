
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import { createUser, findByEmail, findById } from '../repositories/user.repository.js';
import { ApiError } from '../utils/ApiError.js';
import { ERROR_CODES, ROLES } from '../utils/constants.js';
import { config } from '../config/env.js';

const SALT_ROUNDS = 10;
const TOKEN_EXPIRY = '1h';

const sanitizeUser = (user) => {
  if (!user) return null;
  const { passwordHash, ...safe } = user;
  return safe;
};

const signToken = (user) => {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
  };

  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: TOKEN_EXPIRY,
  });
};

export const register = async ({ name, email, password }) => {
  const existing = findByEmail(email);
  if (existing) {
    throw new ApiError(
      400,
      ERROR_CODES.VALIDATION_ERROR,
      'Email is already registered'
    );
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

 
  const user = createUser({
    name,
    email,
    passwordHash,
    role: ROLES.CUSTOMER,
  });

  const token = signToken(user);
  const safeUser = sanitizeUser(user);

  return { user: safeUser, token };
};

export const login = async ({ email, password }) => {
  const user = findByEmail(email);
  if (!user || !user.passwordHash) {
    throw new ApiError(
      401,
      ERROR_CODES.UNAUTHORIZED,
      'Invalid email or password'
    );
  }

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) {
    throw new ApiError(
      401,
      ERROR_CODES.UNAUTHORIZED,
      'Invalid email or password'
    );
  }

  const token = signToken(user);
  const safeUser = sanitizeUser(user);

  return { user: safeUser, token };
};

export const getProfile = (userId) => {
  const user = findById(userId);
  if (!user) {
    throw new ApiError(
      404,
      ERROR_CODES.NOT_FOUND,
      'User not found'
    );
  }

  return sanitizeUser(user);
};
