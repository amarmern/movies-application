const devErrors = (res, error) => {
  res.status(error.statusCode).json({
    status: error.statusCode,
    message: error.message,
    stackTrace: error.stack,
    error: error,
  });
};

module.exports = (error, req, res, next) => {
  error.statusCode = error.statusCode || 500;
  error.status = error.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    devErrors(res, error);
  }
  //   else if (process.env.NODE_ENV === 'production') {
  //     if (error.name === 'CastError') error = castErrorHandler(error);
  //     if (error.code === 11000) error = duplicateKeyErrorHandler(error);
  //     if (error.name === 'ValidationError') error = validationErrorHandler(error);

  //     prodErrors(res, error);
  //   }
};
