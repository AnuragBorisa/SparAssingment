
import { Router } from 'express';

import { authRateLimiter } from '../middleware/rateLimit.middleware.js';
import { handleValidation } from '../middleware/validation.middleware.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

import {
  registerController,
  loginController,
  profileController,
} from '../controllers/auth.controller.js';

import {
  registerValidation,
  loginValidation,
} from '../validations/auth.validation.js';

const router = Router();


router.post(
  '/register',
  authRateLimiter,
  registerValidation,
  handleValidation,
  registerController
);


router.post(
  '/login',
  authRateLimiter,
  loginValidation,
  handleValidation,
  loginController
);


router.get(
  '/profile',
  authenticateToken,
  profileController
);

export default router;
