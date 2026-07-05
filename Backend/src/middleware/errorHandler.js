import config from '../config/index.js';

/**
 * Global error handling middleware.
 * Catches all errors, normalizes known Mongoose/JWT errors,
 * and returns structured JSON responses.
 * Hides stack traces in production.
 */
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let status = err.status || 'error';
  let message = err.message || 'Internal Server Error';

  // Mongoose duplicate key error
  if (err.code === 11000) {
    statusCode = 409;
    status = 'fail';
    const field = Object.keys(err.keyValue)[0];
    message = `${field} already exists.`;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    status = 'fail';
    const messages = Object.values(err.errors).map((e) => e.message);
    message = messages.join('. ');
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = 400;
    status = 'fail';
    message = `Invalid ${err.path}: ${err.value}`;
  }

  const response = {
    status,
    message,
  };

  // Include stack trace only in development
  if (config.nodeEnv === 'development') {
    response.stack = err.stack;
    response.error = err;
  }

  res.status(statusCode).json(response);
};

export default errorHandler;
