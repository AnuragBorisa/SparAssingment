
import { Router } from 'express';

import { authenticateToken, authorizeRoles } from '../middleware/auth.middleware.js';
import { ROLES } from '../utils/constants.js';
import { getOrdersForUserAdminController } from '../controllers/user.controller.js';

const router = Router();


router.get(
  '/:userId/orders',
  authenticateToken,
  authorizeRoles(ROLES.ADMIN),
  getOrdersForUserAdminController
);

export default router;
