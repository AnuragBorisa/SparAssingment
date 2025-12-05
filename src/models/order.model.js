
import { ORDER_STATUS } from '../utils/constants.js';

export const createOrderModel = ({
  id,
  userId,
  items,
  totals,
  shippingAddress,
  paymentId = null,
  status = ORDER_STATUS.PENDING,
}) => ({
  id,
  userId,
  items, 
  status,
  totals, 
  shippingAddress, 
  paymentId,
  createdAt: new Date(),
  updatedAt: new Date(),
});
