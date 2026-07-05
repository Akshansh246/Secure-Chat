import * as messageService from '../services/messageService.js';
import catchAsync from '../utils/catchAsync.js';

export const sendMessage = catchAsync(async (req, res) => {
  const { encryptedBlob, conversationId } = req.body;
  const message = await messageService.sendMessage(
    encryptedBlob,
    conversationId,
    req.user._id
  );

  res.status(201).json({
    status: 'success',
    data: { message },
  });
});

export const getMessages = catchAsync(async (req, res) => {
  const { conversationId } = req.params;
  const { page, limit } = req.query;

  const result = await messageService.getMessages(
    conversationId,
    req.user._id,
    parseInt(page) || 1,
    parseInt(limit) || 50
  );

  res.status(200).json({
    status: 'success',
    data: result,
  });
});
