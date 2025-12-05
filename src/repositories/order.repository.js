
import { createOrderModel } from '../models/order.model.js';

const orders = [];

const generateOrderId = () => {
  const ts = Date.now();
  const rand = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0');
  return `ORD-${ts}-${rand}`;
};

export const createOrder = ({
  userId,
  items,
  totals,
  shippingAddress,
  paymentId,
  status,
}) => {
  const order = createOrderModel({
    id: generateOrderId(),
    userId,
    items,
    totals,
    shippingAddress,
    paymentId,
    status,
  });
  orders.push(order);
  return order;
};

export const findOrderById = (id) => {
  return orders.find(o => o.id === id);
};

export const updateOrder = (id, updates) => {
  const index = orders.findIndex(o => o.id === id);
  if (index === -1) return null;

  orders[index] = {
    ...orders[index],
    ...updates,
    updatedAt: new Date(),
  };
  return orders[index];
};

export const findOrdersByUserId = (userId, filterFn = () => true) => {
  return orders.filter(o => o.userId === userId && filterFn(o));
};

export const findAllOrders = (filterFn = () => true) => {
  return orders.filter(filterFn);
};

export const _orders = orders; 
