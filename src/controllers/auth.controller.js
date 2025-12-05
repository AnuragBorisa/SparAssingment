
import { register, login, getProfile } from '../services/auth.service.js';
import { success } from '../utils/response.js';

export const registerController = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const result = await register({ name, email, password });
    return success(res, result);
  } catch (err) {
    next(err);
  }
};

export const loginController = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await login({ email, password });
    return success(res, result);
  } catch (err) {
    next(err);
  }
};

export const profileController = (req, res, next) => {
  try {
    const userId = req.user.id;
    const user = getProfile(userId);
    return success(res, user);
  } catch (err) {
    next(err);
  }
};
