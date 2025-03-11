import User from '../models/user.model.js';
import { logger, auditLogger } from '../config/logger.config.js';

class UserService {
  /**
   * Create a new user
   */
  static async createUser(userData) {
    const user = new User(userData);
    await user.save();

    // Log user creation
    auditLogger.info('User created', {
      userId: user._id,
      email: user.email,
      role: user.role,
      createdBy: userData.createdBy
    });

    return user;
  }

  /**
   * Get users with filtering and pagination
   */
  static async getUsers(filters = {}, options = {}) {
    const {
      role,
      dayGroup,
      status,
      search,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = options;

    // Build query
    const query = { ...filters };
    if (role) query.role = role;
    if (dayGroup) query.dayGroup = dayGroup;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Cache key based on query parameters
    const cacheKey = `users:${JSON.stringify({ query, page, limit, sortBy, sortOrder })}`;
    
    // Try to get from cache
    const cachedResult = await redisClient.get(cacheKey);
    if (cachedResult) {
      return JSON.parse(cachedResult);
    }

    // Execute query
    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      User.find(query)
        .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
        .skip(skip)
        .limit(limit)
        .select('-refreshToken'),
      User.countDocuments(query)
    ]);

    const result = {
      users,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    };

    // Cache result for 5 minutes
    await redisClient.set(cacheKey, JSON.stringify(result), 'EX', 300);

    return result;
  }

  /**
   * Get user by ID
   */
  static async getUserById(userId) {
    const user = await User.findById(userId).select('-refreshToken');
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  /**
   * Update user
   */
  static async updateUser(userId, updateData, updatedBy) {
    // Prevent updating sensitive fields
    const safeUpdateData = { ...updateData };
    delete safeUpdateData.password;
    delete safeUpdateData.refreshToken;

    const user = await User.findByIdAndUpdate(
      userId,
      safeUpdateData,
      { new: true, runValidators: true }
    ).select('-refreshToken');

    if (!user) {
      throw new Error('User not found');
    }

    // Log user update
    auditLogger.info('User updated', {
      userId,
      updatedFields: Object.keys(safeUpdateData),
      updatedBy
    });

    // Invalidate cache
    const cachePattern = 'users:*';
    const keys = await redisClient.keys(cachePattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
    }

    return user;
  }

  /**
   * Update user password
   */
  static async updatePassword(userId, oldPassword, newPassword) {
    const user = await User.findById(userId).select('+password');
    if (!user) {
      throw new Error('User not found');
    }

    const isValidPassword = await user.comparePassword(oldPassword);
    if (!isValidPassword) {
      throw new Error('Current password is incorrect');
    }

    user.password = newPassword;
    await user.save();

    auditLogger.info('Password updated', { userId });
    return true;
  }

  /**
   * Manage team members (for leaders)
   */
  static async manageTeamMembers(leaderId, memberIds) {
    const leader = await User.findById(leaderId);
    if (!leader || leader.role !== 'leader') {
      throw new Error('Invalid leader');
    }

    // Verify all members exist and are in the same day group
    const members = await User.find({
      _id: { $in: memberIds },
      role: 'member',
      dayGroup: leader.dayGroup
    });

    if (members.length !== memberIds.length) {
      throw new Error('Invalid member selection');
    }

    leader.managedMembers = memberIds;
    await leader.save();

    auditLogger.info('Team members updated', {
      leaderId,
      memberCount: memberIds.length
    });

    return leader;
  }

  /**
   * Suspend/Activate user
   */
  static async updateUserStatus(userId, status, updatedBy) {
    const user = await User.findByIdAndUpdate(
      userId,
      { status },
      { new: true }
    ).select('-refreshToken');

    if (!user) {
      throw new Error('User not found');
    }

    auditLogger.info('User status updated', {
      userId,
      status,
      updatedBy
    });

    return user;
  }
}

export default UserService; 