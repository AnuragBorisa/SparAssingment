
import { Router } from 'express';

import { authenticateToken, authorizeRoles } from '../middleware/auth.middleware.js';
import { handleValidation } from '../middleware/validation.middleware.js';

import {
  createProductController,
  listProductsController,
  getProductByIdController,
  updateProductController,
  deleteProductController,
  updateStockController,
} from '../controllers/product.controller.js';

import {
  createProductValidation,
  updateProductValidation,
  updateStockValidation,
} from '../validations/product.validation.js';

import { ROLES } from '../utils/constants.js';

const router = Router();


router.get('/', listProductsController);


router.get('/:id', getProductByIdController);


router.post(
  '/',
  authenticateToken,
  authorizeRoles(ROLES.ADMIN, ROLES.SELLER),
  createProductValidation,
  handleValidation,
  createProductController
);


router.patch(
  '/:id',
  authenticateToken,
  authorizeRoles(ROLES.ADMIN, ROLES.SELLER),
  updateProductValidation,
  handleValidation,
  updateProductController
);


router.delete(
  '/:id',
  authenticateToken,
  authorizeRoles(ROLES.ADMIN, ROLES.SELLER),
  deleteProductController
);


router.patch(
  '/:id/stock',
  authenticateToken,
  authorizeRoles(ROLES.ADMIN, ROLES.SELLER),
  updateStockValidation,
  handleValidation,
  updateStockController
);

export default router;
