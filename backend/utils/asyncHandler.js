const asyncHandler = (requestHandler) => {
  //It takes a route handler (which is usually an async function) as input and returns a new function.
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
  };
};

export { asyncHandler };