export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  
  let error = {
    success: false,
    message: err.message || 'Internal server error',
    status: err.status || 500
  };

  
  if (err.name === 'JsonWebTokenError') {
    error.message = 'Invalid token';
    error.status = 401;
  }

  if (err.name === 'TokenExpiredError') {
    error.message = 'Token expired';
    error.status = 401;
  }

  
  if (err.name === 'ValidationError') {
    error.message = Object.values(err.errors).map(e => e.message).join(', ');
    error.status = 400;
  }

  
  if (err.code === 11000) {
    error.message = 'Duplicate entry found';
    error.status = 409;
  }

  res.status(error.status).json({
    success: false,
    message: error.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};