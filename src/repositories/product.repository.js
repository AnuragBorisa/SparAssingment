
import { v4 as uuid } from 'uuid';
import { createProductModel } from '../models/product.model.js';

const products = [];

export const createProduct = ({
  name,
  description,
  price,
  stock,
  isActive = true,
}) => {
  const product = createProductModel({
    id: uuid(),
    name,
    description,
    price,
    stock,
    isActive,
  });
  products.push(product);
  return product;
};

export const findById = (id) => {
  return products.find(p => p.id === id);
};

export const findAll = (filterFn = () => true) => {
  return products.filter(filterFn);
};

export const updateProduct = (id, updates) => {
  const index = products.findIndex(p => p.id === id);
  if (index === -1) return null;

  products[index] = {
    ...products[index],
    ...updates,
    updatedAt: new Date(),
  };
  return products[index];
};

export const softDeleteProduct = (id) => {
  const index = products.findIndex(p => p.id === id);
  if (index === -1) return null;

  products[index].isActive = false;
  products[index].updatedAt = new Date();
  return products[index];
};


export const _products = products;
