import jwt from 'jsonwebtoken';
import { ApiError } from '../utils/ApiError.js';
import { ERROR_CODES } from '../utils/constants.js';
import { config } from '../config/env.js';

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return next(
      new ApiError(401, ERROR_CODES.UNAUTHORIZED, 'No token provided')
    );
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, config.jwtSecret);
    req.user = payload; 
    next();
  } catch (err) {
    next(
      new ApiError(401, ERROR_CODES.UNAUTHORIZED, 'Invalid or expired token')
    );
  }
};

export const authorizeRoles = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return next(
      new ApiError(403, ERROR_CODES.FORBIDDEN, 'Forbidden')
    );
  }
  next();
};
