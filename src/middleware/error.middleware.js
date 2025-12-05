import { fail } from '../utils/response.js';

export const notFound = (req, res, next) => {
  const err = new Error(`Not found - ${req.originalUrl}`);
  err.statusCode = 404;
  err.code = 'NOT_FOUND';
  next(err);
};

export const errorHandler = (err, req, res, next) => {

  if (!err.statusCode) err.statusCode = 500;
  if (!err.code) err.code = 'INTERNAL_ERROR';

  return fail(res, err);
};
