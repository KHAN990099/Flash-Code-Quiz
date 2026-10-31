/**
 * Wraps an async route handler to catch errors and pass them to the next() error middleware.
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
