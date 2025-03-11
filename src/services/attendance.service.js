import Attendance from '../models/attendance.model.js';
import User from '../models/user.model.js';
import { logger, auditLogger } from '../config/logger.config.js';

class AttendanceService {
  /**
   * Mark attendance for multiple members
   */
  static async markAttendance(date, members, markedBy) {
    const operations = members.map(({ memberId, status, notes }) => ({
      updateOne: {
        filter: { member: memberId, date },
        update: {
          $set: {
            status,
            markedBy,
            notes
          }
        },
        upsert: true
      }
    }));

    const result = await Attendance.bulkWrite(operations);

    // Log attendance marking
    auditLogger.info('Attendance marked', {
      date,
      memberCount: members.length,
      markedBy
    });

    // Invalidate cache
    await this.invalidateCache(date);

    return result;
  }

  /**
   * Get attendance records with filtering and pagination
   */
  static async getAttendance(filters = {}, options = {}) {
    const {
      startDate,
      endDate,
      status,
      dayGroup,
      page = 1,
      limit = 10
    } = options;

    // Build query
    const query = { ...filters };
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    if (status) query.status = status;

    // Cache key
    const cacheKey = `attendance:${JSON.stringify({ query, page, limit, dayGroup })}`;
    
    // Try to get from cache
    const cachedResult = await redisClient.get(cacheKey);
    if (cachedResult) {
      return JSON.parse(cachedResult);
    }

    // Execute query
    const skip = (page - 1) * limit;
    let attendanceQuery = Attendance.find(query)
      .populate('member', 'name email dayGroup')
      .populate('markedBy', 'name role')
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit);

    // Apply day group filter if specified
    if (dayGroup) {
      const memberIds = await User.find({ dayGroup })
        .distinct('_id');
      attendanceQuery = attendanceQuery.where('member').in(memberIds);
    }

    const [records, total] = await Promise.all([
      attendanceQuery,
      Attendance.countDocuments(query)
    ]);

    const result = {
      records,
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
   * Override attendance status (admin only)
   */
  static async overrideAttendance(attendanceId, newStatus, admin, reason) {
    const attendance = await Attendance.findById(attendanceId);
    if (!attendance) {
      throw new Error('Attendance record not found');
    }

    // Add current status to override history
    attendance.overrideHistory.push({
      admin: admin,
      previousStatus: attendance.status,
      reason: reason
    });

    // Update status
    attendance.status = newStatus;
    await attendance.save();

    // Log override
    auditLogger.info('Attendance override', {
      attendanceId,
      previousStatus: attendance.status,
      newStatus,
      admin,
      reason
    });

    // Invalidate cache
    await this.invalidateCache(attendance.date);

    return attendance;
  }

  /**
   * Get attendance analytics
   */
  static async getAnalytics(startDate, endDate, dayGroup) {
    const cacheKey = `analytics:${startDate}:${endDate}:${dayGroup}`;
    
    // Try to get from cache
    const cachedResult = await redisClient.get(cacheKey);
    if (cachedResult) {
      return JSON.parse(cachedResult);
    }

    // Build base query
    const query = {
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    };

    // Get members for day group
    let memberIds = [];
    if (dayGroup) {
      memberIds = await User.find({ dayGroup, role: 'member' })
        .distinct('_id');
      query.member = { $in: memberIds };
    }

    // Aggregate attendance data
    const analytics = await Attendance.aggregate([
      { $match: query },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
            status: '$status'
          },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: '$_id.date',
          statuses: {
            $push: {
              status: '$_id.status',
              count: '$count'
            }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const result = {
      analytics,
      summary: {
        totalMembers: dayGroup ? memberIds.length : await User.countDocuments({ role: 'member' }),
        dateRange: { startDate, endDate },
        dayGroup
      }
    };

    // Cache result for 1 hour
    await redisClient.set(cacheKey, JSON.stringify(result), 'EX', 3600);

    return result;
  }

  /**
   * Process automatic absence marking
   */
  static async processAutomaticAbsence(date = new Date()) {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    // Get all members
    const members = await User.find({
      role: 'member',
      status: 'active'
    });

    // Find members without attendance records for the day
    const existingRecords = await Attendance.find({
      date: targetDate,
      member: { $in: members.map(m => m._id) }
    });

    const markedMembers = new Set(existingRecords.map(r => r.member.toString()));
    const unmarkedMembers = members.filter(m => !markedMembers.has(m._id.toString()));

    // Create system-absent records
    if (unmarkedMembers.length > 0) {
      const operations = unmarkedMembers.map(member => ({
        member: member._id,
        date: targetDate,
        status: 'system-absent'
      }));

      await Attendance.insertMany(operations);

      // Log automatic absence marking
      auditLogger.info('Automatic absence processed', {
        date: targetDate,
        count: unmarkedMembers.length
      });

      // Invalidate cache
      await this.invalidateCache(targetDate);
    }

    return unmarkedMembers.length;
  }

  /**
   * Invalidate cache for a specific date
   */
  static async invalidateCache(date) {
    // No-op since we're not using Redis
    return true;
  }
}

export default AttendanceService; 