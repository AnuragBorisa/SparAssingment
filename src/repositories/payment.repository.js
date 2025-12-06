
import { v4 as uuid } from 'uuid';
import { createPaymentModel } from '../models/payment.model.js';

const payments = [];

export const createPayment = ({ orderId, method, amount, status, transactionRef }) => {
  const payment = createPaymentModel({
    id: uuid(),
    orderId,
    method,
    amount,
    status,
    transactionRef,
  });

  payments.push(payment);
  return payment;
};

export const findPaymentById = (id) => {
  return payments.find(p => p.id === id);
};

export const findPaymentByOrderId = (orderId) => {
  return payments.find(p => p.orderId === orderId);
};

export const updatePayment = (id, updates) => {
  const index = payments.findIndex(p => p.id === id);
  if (index === -1) return null;

  payments[index] = {
    ...payments[index],
    ...updates,
    updatedAt: new Date(),
  };

  return payments[index];
};

export const _payments = payments; 
