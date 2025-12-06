
import { createProduct, findAll, findById, updateProduct, softDeleteProduct } from '../repositories/product.repository.js';
import { ApiError } from '../utils/ApiError.js';
import { ERROR_CODES } from '../utils/constants.js';
import { getPagination } from '../utils/pagination.js';

export const createProductService = ({ name, description, price, stock }) => {
  const product = createProduct({
    name,
    description,
    price,
    stock,
    isActive: true,
  });
  return product;
};

export const listProductsService = (query) => {
  const { page, limit, skip } = getPagination(query);
  const { search, minPrice, maxPrice } = query;

  const searchLower = search ? String(search).toLowerCase() : null;
  const min = minPrice !== undefined ? Number(minPrice) : null;
  const max = maxPrice !== undefined ? Number(maxPrice) : null;

  const all = findAll(p => {
    if (!p.isActive) return false;

    if (searchLower) {
      const inName = p.name.toLowerCase().includes(searchLower);
      const inDesc = (p.description || '').toLowerCase().includes(searchLower);
      if (!inName && !inDesc) return false;
    }

    if (min !== null && p.price < min) return false;
    if (max !== null && p.price > max) return false;

    return true;
  });

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

export const getProductByIdService = (id) => {
  const product = findById(id);
  if (!product || !product.isActive) {
    throw new ApiError(404, ERROR_CODES.NOT_FOUND, 'Product not found');
  }
  return product;
};

export const updateProductService = (id, updates) => {
  const existing = findById(id);
  if (!existing || !existing.isActive) {
    throw new ApiError(404, ERROR_CODES.NOT_FOUND, 'Product not found');
  }

  const allowedFields = ['name', 'description', 'price', 'stock', 'isActive'];
  const safeUpdates = {};

  for (const key of allowedFields) {
    if (updates[key] !== undefined) safeUpdates[key] = updates[key];
  }

  const updated = updateProduct(id, safeUpdates);
  return updated;
};

export const deleteProductService = (id) => {
  const existing = findById(id);
  if (!existing || !existing.isActive) {
    throw new ApiError(404, ERROR_CODES.NOT_FOUND, 'Product not found');
  }

  const deleted = softDeleteProduct(id);
  return deleted;
};

export const updateStockService = (id, stock) => {
  const existing = findById(id);
  if (!existing || !existing.isActive) {
    throw new ApiError(404, ERROR_CODES.NOT_FOUND, 'Product not found');
  }

  const updated = updateProduct(id, { stock });
  return updated;
};
