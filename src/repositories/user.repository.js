
import { v4 as uuid } from 'uuid';
import { createUserModel } from '../models/user.model.js';
import { ROLES } from '../utils/constants.js';

const users = [];


const seedAdmin = () => {
  const exists = users.find(u => u.email === 'admin@example.com');
  if (exists) return;

  const admin = createUserModel({
    id: uuid(),
    name: 'Admin User',
    email: 'admin@example.com',
    passwordHash: '', 
    role: ROLES.ADMIN,
  });

  users.push(admin);
};

export const createUser = ({ name, email, passwordHash, role }) => {
  const user = createUserModel({
    id: uuid(),
    name,
    email,
    passwordHash,
    role,
  });
  users.push(user);
  return user;
};

export const findByEmail = (email) => {
  return users.find(u => u.email.toLowerCase() === email.toLowerCase());
};

export const findById = (id) => {
  return users.find(u => u.id === id);
};

export const getAllUsers = () => users;


export const seedAdminUser = seedAdmin;
