
import { ApiError } from '../utils/ApiError.js';
import { ERROR_CODES, PAYMENT_STATUS, ROLES, ORDER_STATUS } from '../utils/constants.js';

import { findOrderById, updateOrder } from '../repositories/order.repository.js';
import { createPayment, findPaymentByOrderId, updatePayment } from '../repositories/payment.repository.js';


const generateTransactionRef = () => {
  const ts = Date.now();
  const rand = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0');
  return `TXN-${ts}-${rand}`;
};

export const processPaymentService = ({ user, orderId, method }) => {
  const order = findOrderById(orderId);
  if (!order) {
    throw new ApiError(404, ERROR_CODES.NOT_FOUND, 'Order not found');
  }


  if (user.role === ROLES.CUSTOMER && order.userId !== user.id) {
    throw new ApiError(403, ERROR_CODES.FORBIDDEN, 'Forbidden');
  }

  if (!order.totals?.grandTotal) {
    throw new ApiError(400, ERROR_CODES.VALIDATION_ERROR, 'Order total is invalid');
  }

  const existing = findPaymentByOrderId(orderId);
  if (existing && existing.status === PAYMENT_STATUS.SUCCESS) {
    throw new ApiError(400, ERROR_CODES.VALIDATION_ERROR, 'Payment already completed for this order');
  }

  const amount = order.totals.grandTotal;
  const transactionRef = generateTransactionRef();

  const status = PAYMENT_STATUS.SUCCESS;

  let payment;
  if (!existing) {
    payment = createPayment({
      orderId,
      method,
      amount,
      status,
      transactionRef,
    });
  } else {
    payment = updatePayment(existing.id, {
      method,
      amount,
      status,
      transactionRef,
    });
  }


  const newOrderStatus =
    order.status === ORDER_STATUS.PENDING ? ORDER_STATUS.CONFIRMED : order.status;

  updateOrder(orderId, {
    paymentId: payment.id,
    status: newOrderStatus,
  });

  return payment;
};

export const refundPaymentService = ({ user, orderId }) => {
  const order = findOrderById(orderId);
  if (!order) {
    throw new ApiError(404, ERROR_CODES.NOT_FOUND, 'Order not found');
  }

  
  if (user.role === ROLES.CUSTOMER && order.userId !== user.id) {
    throw new ApiError(403, ERROR_CODES.FORBIDDEN, 'Forbidden');
  }

  const payment = findPaymentByOrderId(orderId);
  if (!payment) {
    throw new ApiError(404, ERROR_CODES.NOT_FOUND, 'No payment found for this order');
  }

  if (payment.status !== PAYMENT_STATUS.SUCCESS) {
    throw new ApiError(
      400,
      ERROR_CODES.VALIDATION_ERROR,
      'Only successful payments can be refunded'
    );
  }

  const updated = updatePayment(payment.id, {
    status: PAYMENT_STATUS.REFUNDED,
  });

  return updated;
};

export const getPaymentStatusService = ({ user, orderId }) => {
  const order = findOrderById(orderId);
  if (!order) {
    throw new ApiError(404, ERROR_CODES.NOT_FOUND, 'Order not found');
  }

  if (user.role === ROLES.CUSTOMER && order.userId !== user.id) {
    throw new ApiError(403, ERROR_CODES.FORBIDDEN, 'Forbidden');
  }

  const payment = findPaymentByOrderId(orderId);
  if (!payment) {
    throw new ApiError(404, ERROR_CODES.NOT_FOUND, 'No payment found for this order');
  }

  return payment;
};


export const refundIfPaidForOrder = (orderId) => {
  const payment = findPaymentByOrderId(orderId);
  if (!payment) return null;

  if (payment.status === PAYMENT_STATUS.SUCCESS) {
    return updatePayment(payment.id, {
      status: PAYMENT_STATUS.REFUNDED,
    });
  }

  return payment;
};
