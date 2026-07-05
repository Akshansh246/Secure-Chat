import User from '../models/User.js';
import AppError from '../utils/AppError.js';

/**
 * Get the currently authenticated user's profile.
 */
export const getMe = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }
  return user;
};

/**
 * Search users by username or email (excludes the current user).
 * Returns at most 20 results, case-insensitive.
 */
export const searchUsers = async (query, currentUserId) => {
  if (!query || query.trim().length < 2) {
    throw new AppError('Search query must be at least 2 characters', 400);
  }

  const users = await User.find({
    _id: { $ne: currentUserId },
    $or: [
      { username: { $regex: query, $options: 'i' } },
      { email: { $regex: query, $options: 'i' } },
    ],
  })
    .select('username email profileImage lastSeen')
    .limit(20);

  return users;
};
