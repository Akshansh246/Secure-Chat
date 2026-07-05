import * as keyService from '../services/keyService.js';
import catchAsync from '../utils/catchAsync.js';

export const storePublicKey = catchAsync(async (req, res) => {
  const { publicKey } = req.body;
  const result = await keyService.storePublicKey(req.user._id, publicKey);

  res.status(200).json({
    status: 'success',
    data: result,
  });
});

export const getPublicKey = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const result = await keyService.getPublicKey(userId);

  res.status(200).json({
    status: 'success',
    data: result,
  });
});
