import * as authService from '../services/authService.js';
import catchAsync from '../utils/catchAsync.js';

export const register = catchAsync(async (req, res) => {
  const result = await authService.register(req.body);

  res.status(201).json({
    status: 'success',
    data: {
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      kyberPrivateKey: result.kyberPrivateKey,
    },
  });
});

export const login = catchAsync(async (req, res) => {
  const result = await authService.login(req.body);

  res.status(200).json({
    status: 'success',
    data: {
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      kyberPrivateKey: result.kyberPrivateKey,
    },
  });
});

export const refresh = catchAsync(async (req, res) => {
  const { refreshToken } = req.body;
  const tokens = await authService.refresh(refreshToken);

  res.status(200).json({
    status: 'success',
    data: tokens,
  });
});

export const logout = catchAsync(async (req, res) => {
  const { refreshToken } = req.body;
  await authService.logout(refreshToken);

  res.status(200).json({
    status: 'success',
    message: 'Logged out successfully',
  });
});
