
import { PAYMENT_STATUS } from '../utils/constants.js';

export const createPaymentModel = ({
  id,
  orderId,
  method,
  amount,
  status = PAYMENT_STATUS.PENDING,
  transactionRef = null,
}) => ({
  id,
  orderId,
  method,
  amount,
  status,
  transactionRef,
  createdAt: new Date(),
  updatedAt: new Date(),
});
