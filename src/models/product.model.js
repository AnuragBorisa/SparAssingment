
export const createProductModel = ({
  id,
  name,
  description,
  price,
  stock,
  isActive = true,
}) => ({
  id,
  name,
  description: description || '',
  price,
  stock,
  isActive,
  createdAt: new Date(),
  updatedAt: new Date(),
});
