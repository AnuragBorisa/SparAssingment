
import { Router } from 'express';

import { authenticateToken, authorizeRoles } from '../middleware/auth.middleware.js';
import { handleValidation } from '../middleware/validation.middleware.js';

import {
  createOrderController,
  listOrdersController,
  getOrderByIdController,
  updateOrderStatusController,
  cancelOrderController,
  bulkCreateOrdersController,
  summaryStatsController,
  getOrderInvoiceController,
} from '../controllers/order.controller.js';

import {
  createOrderValidation,
  updateOrderStatusValidation,
  bulkCreateOrdersValidation,
} from '../validations/order.validation.js';

import { ROLES } from '../utils/constants.js';

const router = Router();


router.post(
  '/',
  authenticateToken,
  createOrderValidation,
  handleValidation,
  createOrderController
);


router.get(
  '/',
  authenticateToken,
  listOrdersController
);

router.get(
  '/:id/invoice',
  authenticateToken,
  getOrderInvoiceController
);

router.get(
  '/:id',
  authenticateToken,
  getOrderByIdController
);


router.patch(
  '/:id/status',
  authenticateToken,
  authorizeRoles(ROLES.ADMIN, ROLES.SELLER),
  updateOrderStatusValidation,
  handleValidation,
  updateOrderStatusController
);


router.post(
  '/:id/cancel',
  authenticateToken,
  cancelOrderController
);


router.post(
  '/bulk',
  authenticateToken,
  authorizeRoles(ROLES.ADMIN, ROLES.SELLER),
  bulkCreateOrdersValidation,
  handleValidation,
  bulkCreateOrdersController
);


router.get(
  '/stats/summary',
  authenticateToken,
  authorizeRoles(ROLES.ADMIN),
  summaryStatsController
);

export default router;
