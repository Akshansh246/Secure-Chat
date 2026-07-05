import * as userService from '../services/userService.js';
import catchAsync from '../utils/catchAsync.js';

export const getMe = catchAsync(async (req, res) => {
  const user = await userService.getMe(req.user._id);

  res.status(200).json({
    status: 'success',
    data: { user },
  });
});

export const updateMe = catchAsync(async (req, res) => {
  const user = await userService.updateMe(req.user._id, req.body);

  res.status(200).json({
    status: 'success',
    data: { user },
  });
});

export const searchUsers = catchAsync(async (req, res) => {
  const { q } = req.query;
  const users = await userService.searchUsers(q, req.user._id);

  res.status(200).json({
    status: 'success',
    results: users.length,
    data: { users },
  });
});
