import * as conversationService from '../services/conversationService.js';
import catchAsync from '../utils/catchAsync.js';

export const createConversation = catchAsync(async (req, res) => {
  const { participantId, kyberCiphertext } = req.body;
  const conversation = await conversationService.createConversation(
    req.user._id.toString(),
    participantId,
    kyberCiphertext
  );

  res.status(201).json({
    status: 'success',
    data: { conversation },
  });
});

export const getUserConversations = catchAsync(async (req, res) => {
  const conversations = await conversationService.getUserConversations(req.user._id);

  res.status(200).json({
    status: 'success',
    results: conversations.length,
    data: { conversations },
  });
});
