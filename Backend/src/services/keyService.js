import User from '../models/User.js';
import AppError from '../utils/AppError.js';

/**
 * Update the current user's Kyber public key.
 */
export const storePublicKey = async (userId, publicKey) => {
  const user = await User.findByIdAndUpdate(
    userId,
    { kyberPublicKey: publicKey },
    { new: true }
  );

  if (!user) {
    throw new AppError('User not found', 404);
  }

  return { publicKey: user.kyberPublicKey };
};

/**
 * Retrieve a user's Kyber public key for key exchange.
 */
export const getPublicKey = async (userId) => {
  const user = await User.findById(userId).select('username kyberPublicKey');

  if (!user) {
    throw new AppError('User not found', 404);
  }

  if (!user.kyberPublicKey) {
    throw new AppError('Public key not found for this user', 404);
  }

  return {
    userId: user._id,
    username: user.username,
    publicKey: user.kyberPublicKey,
  };
};
