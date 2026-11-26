const successResponse = (res, message, data = {}, statusCode = 200, meta = undefined) => {
  const body = {
    success: true,
    message,
    data,
  };

  if (meta !== undefined) {
    body.meta = meta;
  }

  return res.status(statusCode).json(body);
};

const errorResponse = (res, message, statusCode = 500, details = undefined) => {
  const body = {
    success: false,
    message,
  };

  if (details !== undefined) {
    body.details = details;
  }

  return res.status(statusCode).json(body);
};

module.exports = {
  successResponse,
  errorResponse,
};