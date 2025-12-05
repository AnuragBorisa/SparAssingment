
import { ROLES } from '../utils/constants.js';

export const createUserModel = ({ id, name, email, passwordHash, role }) => ({
  id,
  name,
  email,
  passwordHash,
  role: role || ROLES.CUSTOMER,
  createdAt: new Date(),
});
