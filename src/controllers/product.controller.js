
import {
  createProductService,
  listProductsService,
  getProductByIdService,
  updateProductService,
  deleteProductService,
  updateStockService,
} from '../services/product.service.js';

import { success } from '../utils/response.js';

export const createProductController = (req, res, next) => {
  try {
    const { name, description, price, stock } = req.body;
    const product = createProductService({ name, description, price, stock });
    return success(res, product);
  } catch (err) {
    next(err);
  }
};

export const listProductsController = (req, res, next) => {
  try {
    const result = listProductsService(req.query);
    return success(res, result.items, result.meta);
  } catch (err) {
    next(err);
  }
};

export const getProductByIdController = (req, res, next) => {
  try {
    const { id } = req.params;
    const product = getProductByIdService(id);
    return success(res, product);
  } catch (err) {
    next(err);
  }
};

export const updateProductController = (req, res, next) => {
  try {
    const { id } = req.params;
    const updated = updateProductService(id, req.body);
    return success(res, updated);
  } catch (err) {
    next(err);
  }
};

export const deleteProductController = (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = deleteProductService(id);
    return success(res, deleted);
  } catch (err) {
    next(err);
  }
};

export const updateStockController = (req, res, next) => {
  try {
    const { id } = req.params;
    const { stock } = req.body;
    const updated = updateStockService(id, stock);
    return success(res, updated);
  } catch (err) {
    next(err);
  }
};
