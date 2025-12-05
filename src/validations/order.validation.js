
import { body } from 'express-validator';
import { ORDER_STATUS } from '../utils/constants.js';

export const createOrderValidation = [
  body('items')
    .isArray({ min: 1 })
    .withMessage('Items must be a non-empty array'),
  body('items.*.productId')
    .notEmpty()
    .withMessage('Each item must have a productId'),
  body('items.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Each item quantity must be at least 1'),
  body('shippingAddress.line1')
    .notEmpty()
    .withMessage('Shipping address line1 is required'),
  body('shippingAddress.city')
    .notEmpty()
    .withMessage('Shipping address city is required'),
  body('shippingAddress.postalCode')
    .notEmpty()
    .withMessage('Shipping address postalCode is required'),
  body('shippingAddress.country')
    .notEmpty()
    .withMessage('Shipping address country is required'),
  body('paymentMethod')
    .notEmpty()
    .withMessage('Payment method is required'),
];

export const updateOrderStatusValidation = [
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .bail()
    .isIn(Object.values(ORDER_STATUS))
    .withMessage('Invalid order status'),
];

export const bulkCreateOrdersValidation = [
  body('orders')
    .isArray({ min: 1 })
    .withMessage('Orders must be a non-empty array'),
  body('orders.*.items')
    .isArray({ min: 1 })
    .withMessage('Each order must have at least one item'),
  body('orders.*.items.*.productId')
    .notEmpty()
    .withMessage('Each item must have a productId'),
  body('orders.*.items.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Each item quantity must be at least 1'),
];
