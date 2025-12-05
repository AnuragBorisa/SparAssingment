export const success = (res, data = {}, meta) => {
  const responseBody = { success: true, data };
  if (meta) responseBody.meta = meta;
  return res.json(responseBody);
};

export const fail = (res, error) => {
  const statusCode = error.statusCode || 500;
  const code = error.code || 'INTERNAL_ERROR';
  const message = error.message || 'Internal server error';

  return res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      statusCode,
    },
  });
};
