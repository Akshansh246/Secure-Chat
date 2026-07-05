import Conversation from '../models/Conversation.js';
import User from '../models/User.js';
import Message from '../models/Message.js';
import AppError from '../utils/AppError.js';

/**
 * Create a one-to-one conversation between two users.
 * Returns the existing conversation if one already exists.
 * Optionally stores the Kyber ciphertext for key exchange.
 */
export const createConversation = async (userId, participantId, kyberCiphertext) => {
  if (userId === participantId) {
    throw new AppError('Cannot create a conversation with yourself', 400);
  }

  const participant = await User.findById(participantId);
  if (!participant) {
    throw new AppError('Participant not found', 404);
  }

  // Check for an existing conversation between these two users
  const existing = await Conversation.findOne({
    participants: { $all: [userId, participantId], $size: 2 },
  }).populate('participants', 'username email profileImage lastSeen');

  if (existing) {
    // If conversation lacks a kyberCiphertext and one is provided, store it now.
    // NEVER overwrite an existing ciphertext — doing so would invalidate
    // the shared secret both parties already derived, breaking old messages.
    if (!existing.kyberCiphertext && kyberCiphertext) {
      existing.kyberCiphertext = kyberCiphertext;
      existing.initiator = userId;
      await existing.save();
    }
    return existing;
  }

  const conversation = await Conversation.create({
    participants: [userId, participantId],
    kyberCiphertext: kyberCiphertext || null,
    initiator: userId,
  });

  return conversation.populate('participants', 'username email profileImage lastSeen');
};

/**
 * Get all conversations for a user, sorted by most recently updated.
 */
export const getUserConversations = async (userId) => {
  const conversations = await Conversation.find({
    participants: userId,
  })
    .populate('participants', 'username email profileImage lastSeen')
    .sort({ updatedAt: -1 });

  // Calculate unread count for each conversation based on message sender and seen status
  const conversationsWithUnread = await Promise.all(
    conversations.map(async (conv) => {
      const unreadCount = await Message.countDocuments({
        conversationId: conv._id,
        senderId: { $ne: userId },
        status: { $ne: 'seen' },
      });
      return {
        ...conv.toObject(),
        unreadCount,
      };
    })
  );

  return conversationsWithUnread;
};

/**
 * Get a specific conversation by ID, verifying the user is a participant.
 */
export const getConversationById = async (conversationId, userId) => {
  const conversation = await Conversation.findOne({
    _id: conversationId,
    participants: userId,
  }).populate('participants', 'username email profileImage lastSeen');

  if (!conversation) {
    throw new AppError('Conversation not found', 404);
  }

  return conversation;
};
