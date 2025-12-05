
import {
  createOrderService,
  getOrdersForUserService,
  getOrderByIdService,
  updateOrderStatusService,
  cancelOrderService,
  bulkCreateOrdersService,
  getSummaryStatsService,
} from '../services/order.service.js';

import { success } from '../utils/response.js';

export const createOrderController = (req, res, next) => {
  try {
    const user = req.user;
    const { items, shippingAddress, paymentMethod } = req.body;
    const order = createOrderService({ user, items, shippingAddress, paymentMethod });
    return success(res, order);
  } catch (err) {
    next(err);
  }
};

export const listOrdersController = (req, res, next) => {
  try {
    const user = req.user;
    const result = getOrdersForUserService(user, req.query);
    return success(res, result.items, result.meta);
  } catch (err) {
    next(err);
  }
};

export const getOrderByIdController = (req, res, next) => {
  try {
    const user = req.user;
    const { id } = req.params;
    const order = getOrderByIdService(user, id);
    return success(res, order);
  } catch (err) {
    next(err);
  }
};

export const updateOrderStatusController = (req, res, next) => {
  try {
    const user = req.user;
    const { id } = req.params;
    const { status } = req.body;
    const updated = updateOrderStatusService(user, id, status);
    return success(res, updated);
  } catch (err) {
    next(err);
  }
};

export const cancelOrderController = (req, res, next) => {
  try {
    const user = req.user;
    const { id } = req.params;
    const updated = cancelOrderService(user, id);
    return success(res, updated);
  } catch (err) {
    next(err);
  }
};

export const bulkCreateOrdersController = (req, res, next) => {
  try {
    const user = req.user;
    const ordersPayload = req.body?.orders;
    const created = bulkCreateOrdersService({ user, ordersPayload });
    return success(res, created);
  } catch (err) {
    next(err);
  }
};

export const summaryStatsController = (req, res, next) => {
  try {
    const stats = getSummaryStatsService();
    return success(res, stats);
  } catch (err) {
    next(err);
  }
};
