import { Parser } from 'json2csv';
import Attendance from '../models/attendance.model.js';
import User from '../models/user.model.js';
import { logger } from '../config/logger.config.js';

class ExportService {
  /**
   * Generate CSV report for attendance data
   */
  static async generateAttendanceCSV(filters = {}, options = {}) {
    try {
      const { startDate, endDate, dayGroup } = options;

      // Build query
      const query = { ...filters };
      if (startDate && endDate) {
        query.date = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        };
      }

      // Get members for day group
      if (dayGroup) {
        const memberIds = await User.find({ dayGroup })
          .distinct('_id');
        query.member = { $in: memberIds };
      }

      // Fetch attendance records with populated fields
      const records = await Attendance.find(query)
        .populate('member', 'name email dayGroup')
        .populate('markedBy', 'name role')
        .sort({ date: 1 });

      // Transform data for CSV
      const data = records.map(record => ({
        Date: record.formattedDate,
        'Member Name': record.member.name,
        'Member Email': record.member.email,
        'Day Group': record.member.dayGroup,
        Status: record.status,
        'Marked By': record.markedBy?.name || 'System',
        'Marked At': record.createdAt.toISOString(),
        Notes: record.notes || ''
      }));

      // Define CSV fields
      const fields = [
        'Date',
        'Member Name',
        'Member Email',
        'Day Group',
        'Status',
        'Marked By',
        'Marked At',
        'Notes'
      ];

      // Generate CSV
      const json2csvParser = new Parser({ fields });
      return json2csvParser.parse(data);
    } catch (error) {
      logger.error('CSV generation error:', error);
      throw error;
    }
  }

  /**
   * Generate detailed analytics report
   */
  static async generateAnalyticsReport(startDate, endDate, dayGroup) {
    try {
      // Get all members for the day group
      const memberQuery = { role: 'member', status: 'active' };
      if (dayGroup) {
        memberQuery.dayGroup = dayGroup;
      }
      const members = await User.find(memberQuery);

      // Calculate working days in the date range
      const workingDays = this.calculateWorkingDays(startDate, endDate);

      // Get attendance records for all members
      const attendanceRecords = await Attendance.find({
        date: { $gte: new Date(startDate), $lte: new Date(endDate) },
        member: { $in: members.map(m => m._id) }
      });

      // Process attendance data
      const memberStats = {};
      members.forEach(member => {
        memberStats[member._id] = {
          name: member.name,
          email: member.email,
          dayGroup: member.dayGroup,
          present: 0,
          absent: 0,
          systemAbsent: 0,
          attendanceRate: 0,
          consecutiveAbsences: 0,
          maxConsecutiveAbsences: 0
        };
      });

      // Calculate statistics
      attendanceRecords.forEach(record => {
        const stats = memberStats[record.member];
        if (stats) {
          stats[record.status === 'present' ? 'present' : 
                record.status === 'absent' ? 'absent' : 'systemAbsent']++;
        }
      });

      // Calculate attendance rates and identify patterns
      members.forEach(member => {
        const stats = memberStats[member._id];
        const totalDays = workingDays;
        const totalPresent = stats.present;
        
        stats.attendanceRate = (totalPresent / totalDays) * 100;
        stats.consecutiveAbsences = this.calculateConsecutiveAbsences(
          attendanceRecords.filter(r => r.member.toString() === member._id.toString()),
          startDate,
          endDate
        );
      });

      return {
        summary: {
          period: { startDate, endDate },
          totalWorkingDays: workingDays,
          totalMembers: members.length,
          dayGroup: dayGroup || 'All'
        },
        memberStats: Object.values(memberStats)
      };
    } catch (error) {
      logger.error('Analytics report generation error:', error);
      throw error;
    }
  }

  /**
   * Calculate working days between two dates
   */
  static calculateWorkingDays(startDate, endDate) {
    let count = 0;
    const current = new Date(startDate);
    const end = new Date(endDate);

    while (current <= end) {
      const day = current.getDay();
      if (day > 0 && day < 6) {
        count++;
      }
      current.setDate(current.getDate() + 1);
    }

    return count;
  }

  /**
   * Calculate consecutive absences
   */
  static calculateConsecutiveAbsences(records, startDate, endDate) {
    let maxConsecutive = 0;
    let currentConsecutive = 0;
    
    const dateMap = new Map();
    records.forEach(record => {
      dateMap.set(record.formattedDate, record.status);
    });

    const current = new Date(startDate);
    const end = new Date(endDate);

    while (current <= end) {
      if (current.getDay() > 0 && current.getDay() < 6) {
        const dateStr = current.toISOString().split('T')[0];
        const status = dateMap.get(dateStr);

        if (status === 'absent' || status === 'system-absent') {
          currentConsecutive++;
          maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
        } else {
          currentConsecutive = 0;
        }
      }
      current.setDate(current.getDate() + 1);
    }

    return maxConsecutive;
  }
}

export default ExportService; 