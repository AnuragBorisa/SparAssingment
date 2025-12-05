import { validationResult } from 'express-validator';
import { ApiError } from '../utils/ApiError.js';
import { ERROR_CODES } from '../utils/constants.js';

export const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const first = errors.array()[0];
    return next(
      new ApiError(400, ERROR_CODES.VALIDATION_ERROR, first.msg)
    );
  }
  next();
};
