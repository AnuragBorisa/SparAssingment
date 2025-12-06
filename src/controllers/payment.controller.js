
import {
  processPaymentService,
  refundPaymentService,
  getPaymentStatusService,
} from '../services/payment.service.js';

import { success } from '../utils/response.js';

export const processPaymentController = (req, res, next) => {
  try {
    const user = req.user;
    const { orderId } = req.params;
    const { method } = req.body;

    const payment = processPaymentService({ user, orderId, method });
    return success(res, payment);
  } catch (err) {
    next(err);
  }
};

export const refundPaymentController = (req, res, next) => {
  try {
    const user = req.user;
    const { orderId } = req.params;

    const payment = refundPaymentService({ user, orderId });
    return success(res, payment);
  } catch (err) {
    next(err);
  }
};

export const paymentStatusController = (req, res, next) => {
  try {
    const user = req.user;
    const { orderId } = req.params;

    const payment = getPaymentStatusService({ user, orderId });
    return success(res, payment);
  } catch (err) {
    next(err);
  }
};
