
import { findById as findProductById, updateProduct as updateProductRepo } from '../repositories/product.repository.js';
import {
  createOrder,
  findOrderById,
  updateOrder,
  findOrdersByUserId,
  findAllOrders,
} from '../repositories/order.repository.js';
import { ApiError } from '../utils/ApiError.js';
import { ERROR_CODES, ORDER_STATUS, ROLES } from '../utils/constants.js';
import { getPagination } from '../utils/pagination.js';
import { refundIfPaidForOrder } from '../services/payment.service.js';



const allowedTransitions = {
  [ORDER_STATUS.PENDING]: [ORDER_STATUS.CONFIRMED, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.CONFIRMED]: [ORDER_STATUS.PROCESSING, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.PROCESSING]: [ORDER_STATUS.SHIPPED],
  [ORDER_STATUS.SHIPPED]: [ORDER_STATUS.DELIVERED],
  [ORDER_STATUS.DELIVERED]: [],
  [ORDER_STATUS.CANCELLED]: [],
};

const canTransition = (from, to) => {
  return allowedTransitions[from]?.includes(to);
};

const calculateTotals = (itemsWithPrice) => {
  const subTotal = itemsWithPrice.reduce(
    (sum, item) => sum + item.priceAtPurchase * item.quantity,
    0
  );
  const taxRate = 0.18; 
  const tax = Math.round(subTotal * taxRate);
  const discount = 0;
  const grandTotal = subTotal + tax - discount;

  return {
    subTotal,
    tax,
    discount,
    grandTotal,
  };
};

const validateAndPrepareItems = (items) => {
  if (!Array.isArray(items) || items.length === 0) {
    throw new ApiError(
      400,
      ERROR_CODES.VALIDATION_ERROR,
      'Order items are required'
    );
  }

  const prepared = [];

  for (const item of items) {
    const { productId, quantity } = item || {};

    if (!productId || !Number.isInteger(quantity) || quantity <= 0) {
      throw new ApiError(
        400,
        ERROR_CODES.VALIDATION_ERROR,
        'Each item must have a valid productId and positive integer quantity'
      );
    }

    const product = findProductById(productId);
    if (!product || !product.isActive) {
      throw new ApiError(
        404,
        ERROR_CODES.NOT_FOUND,
        `Product not found for id ${productId}`
      );
    }

    if (product.stock < quantity) {
      throw new ApiError(
        400,
        ERROR_CODES.INSUFFICIENT_STOCK,
        `Insufficient stock for product ${product.name}`
      );
    }

    prepared.push({
      productId,
      quantity,
      priceAtPurchase: product.price,
    });
  }

  return prepared;
};

const decrementStock = (itemsWithPrice) => {
  for (const item of itemsWithPrice) {
    const product = findProductById(item.productId);
    if (!product) continue;
    const newStock = product.stock - item.quantity;
    updateProductRepo(product.id, { stock: newStock });
  }
};

const incrementStock = (itemsWithPrice) => {
  for (const item of itemsWithPrice) {
    const product = findProductById(item.productId);
    if (!product) continue;
    const newStock = product.stock + item.quantity;
    updateProductRepo(product.id, { stock: newStock });
  }
};

export const createOrderService = ({ user, items, shippingAddress, paymentMethod }) => {
  
  if (!shippingAddress || !shippingAddress.line1 || !shippingAddress.city || !shippingAddress.postalCode || !shippingAddress.country) {
    throw new ApiError(
      400,
      ERROR_CODES.VALIDATION_ERROR,
      'Shipping address is incomplete'
    );
  }

  
  if (!paymentMethod) {
    throw new ApiError(
      400,
      ERROR_CODES.VALIDATION_ERROR,
      'Payment method is required'
    );
  }

  const itemsWithPrice = validateAndPrepareItems(items);
  const totals = calculateTotals(itemsWithPrice);


  decrementStock(itemsWithPrice);

  const order = createOrder({
    userId: user.id,
    items: itemsWithPrice,
    totals,
    shippingAddress,
    paymentId: null, 
    status: ORDER_STATUS.PENDING,
  });

  return order;
};

export const getOrdersForUserService = (user, query) => {
  const { page, limit, skip } = getPagination(query);
  const { status, dateFrom, dateTo, minTotal, maxTotal } = query;

  const statusFilter = status ? String(status) : null;
  const min = minTotal !== undefined ? Number(minTotal) : null;
  const max = maxTotal !== undefined ? Number(maxTotal) : null;
  const fromDate = dateFrom ? new Date(dateFrom) : null;
  const toDate = dateTo ? new Date(dateTo) : null;

  const filterFn = (o) => {
    if (statusFilter && o.status !== statusFilter) return false;

    if (fromDate && o.createdAt < fromDate) return false;
    if (toDate && o.createdAt > toDate) return false;

    if (min !== null && o.totals?.grandTotal < min) return false;
    if (max !== null && o.totals?.grandTotal > max) return false;

    return true;
  };

  let all;
  if (user.role === ROLES.CUSTOMER) {
    all = findOrdersByUserId(user.id, filterFn);
  } else {
   
    all = findAllOrders(filterFn);
  }

  const total = all.length;
  const items = all.slice(skip, skip + limit);

  return {
    items,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
};

export const getOrderByIdService = (user, orderId) => {
  const order = findOrderById(orderId);
  if (!order) {
    throw new ApiError(404, ERROR_CODES.NOT_FOUND, 'Order not found');
  }

  if (user.role === ROLES.CUSTOMER && order.userId !== user.id) {
    throw new ApiError(403, ERROR_CODES.FORBIDDEN, 'Forbidden');
  }

  return order;
};

export const updateOrderStatusService = (user, orderId, newStatus) => {
  const order = findOrderById(orderId);
  if (!order) {
    throw new ApiError(404, ERROR_CODES.NOT_FOUND, 'Order not found');
  }

  const from = order.status;
  const to = newStatus;

  if (!canTransition(from, to)) {
    throw new ApiError(
      400,
      ERROR_CODES.VALIDATION_ERROR,
      `Cannot change status from ${from} to ${to}`
    );
  }

  const updated = updateOrder(orderId, { status: to });
  return updated;
};

export const cancelOrderService = (user, orderId) => {
  const order = findOrderById(orderId);
  if (!order) {
    throw new ApiError(404, ERROR_CODES.NOT_FOUND, 'Order not found');
  }

  if (user.role === ROLES.CUSTOMER && order.userId !== user.id) {
    throw new ApiError(403, ERROR_CODES.FORBIDDEN, 'Forbidden');
  }

  if (
    order.status !== ORDER_STATUS.PENDING &&
    order.status !== ORDER_STATUS.CONFIRMED
  ) {
    throw new ApiError(
      400,
      ERROR_CODES.VALIDATION_ERROR,
      'Order cannot be cancelled in its current status'
    );
  }


  incrementStock(order.items);

  
  refundIfPaidForOrder(orderId);

  const updated = updateOrder(orderId, { status: ORDER_STATUS.CANCELLED });
  return updated;
};


export const bulkCreateOrdersService = ({ user, ordersPayload }) => {
  if (!Array.isArray(ordersPayload) || ordersPayload.length === 0) {
    throw new ApiError(
      400,
      ERROR_CODES.VALIDATION_ERROR,
      'Orders payload must be a non-empty array'
    );
  }

  const createdOrders = [];
  for (const payload of ordersPayload) {
    const { items, shippingAddress, paymentMethod } = payload;
    const order = createOrderService({
      user,
      items,
      shippingAddress,
      paymentMethod,
    });
    createdOrders.push(order);
  }

  return createdOrders;
};

export const getSummaryStatsService = () => {
  const all = findAllOrders();

  const totalOrders = all.length;
  const totalRevenue = all.reduce(
    (sum, o) => sum + (o.totals?.grandTotal || 0),
    0
  );

  const byStatus = {};
  for (const o of all) {
    byStatus[o.status] = (byStatus[o.status] || 0) + 1;
  }

  return {
    totalOrders,
    totalRevenue,
    byStatus,
  };
};
