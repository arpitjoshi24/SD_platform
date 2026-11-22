const successResponse = (res, message, data = {}, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

const errorResponse = (res, message, statusCode = 500, details) => {
  const body = { success: false, message };

  if (details !== undefined) {
    body.details = details;
  }

  return res.status(statusCode).json(body);
};

module.exports = {
  successResponse,
  errorResponse,
};
