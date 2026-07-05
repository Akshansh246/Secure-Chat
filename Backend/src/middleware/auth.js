import jwt from 'jsonwebtoken';
import config from '../config/index.js';
import User from '../models/User.js';
import AppError from '../utils/AppError.js';

/**
 * JWT authentication middleware.
 * Extracts Bearer token from the Authorization header, verifies it,
 * and attaches the user document to req.user.
 */
const protect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new AppError('Authentication required. Please log in.', 401));
    }

    const decoded = jwt.verify(token, config.jwt.secret);

    const user = await User.findById(decoded.id);
    if (!user) {
      return next(
        new AppError('The user associated with this token no longer exists.', 401)
      );
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(new AppError('Invalid token. Please log in again.', 401));
    }
    if (error.name === 'TokenExpiredError') {
      return next(new AppError('Token expired. Please log in again.', 401));
    }
    next(error);
  }
};

export default protect;
