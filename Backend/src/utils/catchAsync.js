/**
 * Wraps async route handlers to catch rejected promises
 * and forward errors to Express error handling middleware.
 */
const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

export default catchAsync;
