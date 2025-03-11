import UserService from '../services/user.service.js';
import { logger } from '../config/logger.config.js';

class UserController {
  /**
   * Create new user
   */
  static async createUser(req, res) {
    try {
      const userData = {
        ...req.body,
        createdBy: req.user.userId
      };

      const user = await UserService.createUser(userData);
      res.status(201).json({
        status: 'success',
        data: {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            phoneNumber: user.phoneNumber,
            role: user.role,
            dayGroup: user.dayGroup,
            status: user.status
          }
        }
      });
    } catch (error) {
      logger.error('User creation error:', error);
      res.status(400).json({
        status: 'error',
        message: error.message
      });
    }
  }

  /**
   * Get users with filters
   */
  static async getUsers(req, res) {
    try {
      const { role, dayGroup, status, search, page, limit, sortBy, sortOrder } = req.query;
      
      // Apply role-based filters
      const filters = {};
      if (req.user.role === 'leader') {
        filters._id = { $in: req.user.managedMembers };
      }

      const result = await UserService.getUsers(filters, {
        role,
        dayGroup,
        status,
        search,
        page,
        limit,
        sortBy,
        sortOrder
      });

      res.json({
        status: 'success',
        data: result
      });
    } catch (error) {
      logger.error('Get users error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to retrieve users'
      });
    }
  }

  /**
   * Get user by ID
   */
  static async getUserById(req, res) {
    try {
      const user = await UserService.getUserById(req.params.userId);
      
      // Check if user has access to view this user
      if (req.user.role === 'leader' && !req.user.managedMembers.includes(user._id)) {
        return res.status(403).json({
          status: 'error',
          message: 'Unauthorized access'
        });
      }

      res.json({
        status: 'success',
        data: { user }
      });
    } catch (error) {
      logger.error('Get user error:', error);
      res.status(404).json({
        status: 'error',
        message: error.message
      });
    }
  }

  /**
   * Update user
   */
  static async updateUser(req, res) {
    try {
      const { userId } = req.params;
      const updateData = req.body;

      const user = await UserService.updateUser(userId, updateData, req.user.userId);
      res.json({
        status: 'success',
        data: { user }
      });
    } catch (error) {
      logger.error('Update user error:', error);
      res.status(400).json({
        status: 'error',
        message: error.message
      });
    }
  }

  /**
   * Update password
   */
  static async updatePassword(req, res) {
    try {
      const { oldPassword, newPassword } = req.body;
      await UserService.updatePassword(req.user.userId, oldPassword, newPassword);

      res.json({
        status: 'success',
        message: 'Password updated successfully'
      });
    } catch (error) {
      logger.error('Password update error:', error);
      res.status(400).json({
        status: 'error',
        message: error.message
      });
    }
  }

  /**
   * Manage team members
   */
  static async manageTeamMembers(req, res) {
    try {
      const { memberIds } = req.body;
      const leader = await UserService.manageTeamMembers(req.user.userId, memberIds);

      res.json({
        status: 'success',
        data: {
          managedMembers: leader.managedMembers
        }
      });
    } catch (error) {
      logger.error('Team management error:', error);
      res.status(400).json({
        status: 'error',
        message: error.message
      });
    }
  }

  /**
   * Update user status
   */
  static async updateUserStatus(req, res) {
    try {
      const { userId } = req.params;
      const { status } = req.body;

      const user = await UserService.updateUserStatus(userId, status, req.user.userId);
      res.json({
        status: 'success',
        data: { user }
      });
    } catch (error) {
      logger.error('Status update error:', error);
      res.status(400).json({
        status: 'error',
        message: error.message
      });
    }
  }
}

export default UserController; 