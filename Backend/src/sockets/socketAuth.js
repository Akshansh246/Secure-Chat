import jwt from 'jsonwebtoken';
import config from '../config/index.js';
import User from '../models/User.js';

/**
 * Socket.IO authentication middleware.
 * Verifies the JWT from the handshake auth payload before allowing connection.
 */
const socketAuth = async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error('Authentication required'));
    }

    const decoded = jwt.verify(token, config.jwt.secret);
    const user = await User.findById(decoded.id);

    if (!user) {
      return next(new Error('User not found'));
    }

    // Attach user data to the socket for use in event handlers
    socket.userId = user._id.toString();
    socket.user = user;
    next();
  } catch (error) {
    next(new Error('Invalid authentication token'));
  }
};

export default socketAuth;
