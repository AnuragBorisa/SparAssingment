
import { Router } from 'express';

import { authenticateToken, authorizeRoles } from '../middleware/auth.middleware.js';
import { handleValidation } from '../middleware/validation.middleware.js';

import {
  processPaymentController,
  refundPaymentController,
  paymentStatusController,
} from '../controllers/payment.controller.js';

import { processPaymentValidation } from '../validations/payment.validation.js';
import { ROLES } from '../utils/constants.js';

const router = Router();


router.post(
  '/:orderId/process',
  authenticateToken,
  processPaymentValidation,
  handleValidation,
  processPaymentController
);


router.post(
  '/:orderId/refund',
  authenticateToken,
  authorizeRoles(ROLES.ADMIN),
  refundPaymentController
);


router.get(
  '/:orderId/status',
  authenticateToken,
  paymentStatusController
);

export default router;
