import express from 'express';
import { protect } from '../middleware/auth.middleware.js';
import { validateRequest } from '../middleware/validation.middleware.js';
import AuthService from '../services/auth.service.js';
import { catchAsync } from '../utils/error.util.js';

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', catchAsync(async (req, res) => {
  const { name, email, password, phoneNumber, dayGroup, department } = req.body;
  const userAgent = req.headers['user-agent'];
  const ipAddress = req.ip;

  const { user, accessToken, refreshToken } = await AuthService.registerUser(
    { name, email, password, phoneNumber, dayGroup, department },
    userAgent,
    ipAddress
  );

  res.status(201).json({
    status: 'success',
    data: {
      user,
      accessToken,
      refreshToken
    }
  });
}));

/**
 * @route   POST /api/auth/login
 * @desc    Login user and return tokens
 * @access  Public
 */
router.post('/login', catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const userAgent = req.headers['user-agent'];
  const ipAddress = req.ip;

  const result = await AuthService.authenticateUser(email, password, userAgent, ipAddress);

  res.status(200).json({
    status: 'success',
    data: result
  });
}));

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post('/refresh', catchAsync(async (req, res) => {
  const { refreshToken } = req.body;
  const userAgent = req.headers['user-agent'];
  const ipAddress = req.ip;

  const tokens = await AuthService.refreshAccessToken(refreshToken, userAgent, ipAddress);

  res.status(200).json({
    status: 'success',
    data: tokens
  });
}));

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user and invalidate refresh token
 * @access  Protected
 */
router.post('/logout', protect, catchAsync(async (req, res) => {
  const { refreshToken } = req.body;
  await AuthService.logout(refreshToken);

  res.status(200).json({
    status: 'success',
    data: null
  });
}));

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Send password reset email
 * @access  Public
 */
router.post('/forgot-password', catchAsync(async (req, res) => {
  const { email } = req.body;
  await AuthService.forgotPassword(email);

  res.status(200).json({
    status: 'success',
    message: 'Password reset email sent'
  });
}));

/**
 * @route   POST /api/auth/reset-password/:token
 * @desc    Reset password
 * @access  Public
 */
router.post('/reset-password/:token', catchAsync(async (req, res) => {
  const { password } = req.body;
  const { token } = req.params;

  await AuthService.resetPassword(token, password);

  res.status(200).json({
    status: 'success',
    message: 'Password reset successful'
  });
}));

/**
 * @route   POST /api/auth/change-password
 * @desc    Change password
 * @access  Protected
 */
router.post('/change-password', protect, catchAsync(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.id;

  await AuthService.changePassword(userId, currentPassword, newPassword);

  res.status(200).json({
    status: 'success',
    message: 'Password changed successfully'
  });
}));

export default router; 