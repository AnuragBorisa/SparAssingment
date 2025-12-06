
import { getOrdersForSpecificUserService } from '../services/order.service.js';
import { success } from '../utils/response.js';

export const getOrdersForUserAdminController = (req, res, next) => {
  try {
    const adminUser = req.user;
    const { userId } = req.params;

    const result = getOrdersForSpecificUserService(adminUser, userId, req.query);
    return success(res, result.items, result.meta);
  } catch (err) {
    next(err);
  }
};
