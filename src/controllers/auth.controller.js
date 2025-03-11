import AuthService from '../services/auth.service.js';
import { logger } from '../config/logger.config.js';

class AuthController {
  /**
   * Login user
   */
  static async login(req, res) {
    try {
      const { email, password } = req.body;

      // Authenticate user
      const user = await AuthService.authenticateUser(email, password);

      // Generate tokens
      const tokens = await AuthService.generateTokens(user);

      // Return user data and tokens
      res.json({
        status: 'success',
        data: {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            dayGroup: user.dayGroup
          },
          ...tokens
        }
      });
    } catch (error) {
      logger.error('Login error:', error);
      res.status(401).json({
        status: 'error',
        message: error.message || 'Authentication failed'
      });
    }
  }

  /**
   * Refresh access token
   */
  static async refresh(req, res) {
    try {
      const { refreshToken } = req.body;
      const tokens = await AuthService.refreshAccessToken(refreshToken);

      res.json({
        status: 'success',
        data: tokens
      });
    } catch (error) {
      logger.error('Token refresh error:', error);
      res.status(401).json({
        status: 'error',
        message: 'Invalid refresh token'
      });
    }
  }

  /**
   * Logout user
   */
  static async logout(req, res) {
    try {
      const { refreshToken } = req.body;
      await AuthService.logout(refreshToken);

      res.json({
        status: 'success',
        message: 'Logged out successfully'
      });
    } catch (error) {
      logger.error('Logout error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Logout failed'
      });
    }
  }
}

export default AuthController; 