import Message from '../models/Message.js';
import Conversation from '../models/Conversation.js';
import AppError from '../utils/AppError.js';

/**
 * Store an encrypted message blob and update the conversation's last message.
 * The blob is the dual-layer encrypted ciphertext2 — no plaintext or metadata is ever stored.
 */
export const sendMessage = async (encryptedBlob, conversationId, userId) => {
  const conversation = await Conversation.findOne({
    _id: conversationId,
    participants: userId,
  });

  if (!conversation) {
    throw new AppError('Conversation not found or access denied', 404);
  }

  const message = await Message.create({
    encryptedBlob,
    conversationId,
  });

  // Update the conversation's last message pointer
  conversation.lastMessage = {
    messageId: message._id,
    timestamp: message.createdAt,
  };
  await conversation.save();

  return message;
};

/**
 * Retrieve paginated encrypted messages for a conversation.
 * Returns newest-first ordering. Only participants can access.
 */
export const getMessages = async (conversationId, userId, page = 1, limit = 50) => {
  const conversation = await Conversation.findOne({
    _id: conversationId,
    participants: userId,
  });

  if (!conversation) {
    throw new AppError('Conversation not found or access denied', 404);
  }

  const skip = (page - 1) * limit;

  const messages = await Message.find({ conversationId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Message.countDocuments({ conversationId });

  return {
    messages,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};
