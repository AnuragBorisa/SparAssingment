
import { body } from 'express-validator';

export const processPaymentValidation = [
  body('method')
    .notEmpty()
    .withMessage('Payment method is required'),
];
