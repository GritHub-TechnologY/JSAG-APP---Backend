import Attendance from '../models/attendance.model.js';
import User from '../models/user.model.js';
import { logger } from '../config/logger.config.js';

class AnalyticsService {
  /**
   * Get attendance trends
   */
  static async getAttendanceTrends(startDate, endDate, dayGroup) {
    try {
      const cacheKey = `trends:${startDate}:${endDate}:${dayGroup}`;
      
      // Try to get from cache
      const cachedResult = await redisClient.get(cacheKey);
      if (cachedResult) {
        return JSON.parse(cachedResult);
      }

      // Get members for day group
      const memberQuery = { role: 'member', status: 'active' };
      if (dayGroup) {
        memberQuery.dayGroup = dayGroup;
      }
      const members = await User.find(memberQuery);
      const memberIds = members.map(m => m._id);

      // Get attendance records
      const records = await Attendance.find({
        date: { $gte: new Date(startDate), $lte: new Date(endDate) },
        member: { $in: memberIds }
      }).sort({ date: 1 });

      // Calculate weekly trends
      const weeklyTrends = this.calculateWeeklyTrends(records, startDate, endDate);

      // Calculate patterns by day of week
      const dayPatterns = this.calculateDayPatterns(records);

      // Calculate attendance stability
      const stabilityMetrics = this.calculateStabilityMetrics(records, members);

      // Identify attendance patterns
      const patterns = this.identifyPatterns(records, members);

      const result = {
        weeklyTrends,
        dayPatterns,
        stabilityMetrics,
        patterns,
        summary: {
          period: { startDate, endDate },
          totalMembers: members.length,
          dayGroup: dayGroup || 'All'
        }
      };

      // Cache result for 1 hour
      await redisClient.set(cacheKey, JSON.stringify(result), 'EX', 3600);

      return result;
    } catch (error) {
      logger.error('Trend analysis error:', error);
      throw error;
    }
  }

  /**
   * Calculate weekly attendance trends
   */
  static calculateWeeklyTrends(records, startDate, endDate) {
    const weeks = new Map();
    
    records.forEach(record => {
      const weekStart = this.getWeekStart(record.date);
      const weekKey = weekStart.toISOString().split('T')[0];

      if (!weeks.has(weekKey)) {
        weeks.set(weekKey, {
          present: 0,
          absent: 0,
          systemAbsent: 0,
          total: 0
        });
      }

      const weekStats = weeks.get(weekKey);
      weekStats.total++;
      weekStats[record.status === 'present' ? 'present' :
                record.status === 'absent' ? 'absent' : 'systemAbsent']++;
    });

    // Convert to array and calculate rates
    return Array.from(weeks.entries()).map(([week, stats]) => ({
      week,
      presentRate: (stats.present / stats.total) * 100,
      absentRate: ((stats.absent + stats.systemAbsent) / stats.total) * 100,
      systemAbsentRate: (stats.systemAbsent / stats.total) * 100,
      total: stats.total
    }));
  }

  /**
   * Calculate attendance patterns by day of week
   */
  static calculateDayPatterns(records) {
    const days = new Map();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    records.forEach(record => {
      const dayOfWeek = record.date.getDay();
      const dayName = dayNames[dayOfWeek];

      if (!days.has(dayName)) {
        days.set(dayName, {
          present: 0,
          absent: 0,
          systemAbsent: 0,
          total: 0
        });
      }

      const dayStats = days.get(dayName);
      dayStats.total++;
      dayStats[record.status === 'present' ? 'present' :
               record.status === 'absent' ? 'absent' : 'systemAbsent']++;
    });

    // Convert to array and calculate rates
    return Array.from(days.entries())
      .filter(([day]) => day !== 'Sunday' && day !== 'Saturday')
      .map(([day, stats]) => ({
        day,
        presentRate: (stats.present / stats.total) * 100,
        absentRate: ((stats.absent + stats.systemAbsent) / stats.total) * 100,
        systemAbsentRate: (stats.systemAbsent / stats.total) * 100,
        total: stats.total
      }));
  }

  /**
   * Calculate attendance stability metrics
   */
  static calculateStabilityMetrics(records, members) {
    const memberMetrics = new Map();

    members.forEach(member => {
      const memberRecords = records.filter(r => 
        r.member.toString() === member._id.toString()
      );

      const stability = this.calculateMemberStability(memberRecords);
      memberMetrics.set(member._id.toString(), {
        memberId: member._id,
        name: member.name,
        ...stability
      });
    });

    return Array.from(memberMetrics.values());
  }

  /**
   * Calculate individual member's attendance stability
   */
  static calculateMemberStability(records) {
    if (records.length === 0) return {
      stabilityScore: 0,
      variabilityIndex: 0,
      trend: 'insufficient_data'
    };

    // Sort records by date
    records.sort((a, b) => a.date - b.date);

    // Calculate stability score based on consistency
    let changes = 0;
    let presentCount = 0;

    for (let i = 1; i < records.length; i++) {
      if (records[i].status !== records[i-1].status) {
        changes++;
      }
      if (records[i].status === 'present') {
        presentCount++;
      }
    }

    const stabilityScore = 100 * (1 - (changes / records.length));
    const attendanceRate = (presentCount / records.length) * 100;
    const variabilityIndex = changes / records.length;

    // Determine trend
    const recentRecords = records.slice(-5);
    const recentPresent = recentRecords.filter(r => r.status === 'present').length;
    const trend = recentPresent >= 3 ? 'improving' :
                 recentPresent <= 1 ? 'declining' : 'stable';

    return {
      stabilityScore,
      attendanceRate,
      variabilityIndex,
      trend
    };
  }

  /**
   * Identify attendance patterns
   */
  static identifyPatterns(records, members) {
    const patterns = [];

    members.forEach(member => {
      const memberRecords = records.filter(r => 
        r.member.toString() === member._id.toString()
      );

      if (memberRecords.length === 0) return;

      // Identify specific patterns
      const dayPatterns = this.identifyDayPatterns(memberRecords);
      const streaks = this.identifyStreaks(memberRecords);
      const regularityScore = this.calculateRegularityScore(memberRecords);

      if (Object.keys(dayPatterns).length > 0 || streaks.length > 0) {
        patterns.push({
          memberId: member._id,
          name: member.name,
          dayPatterns,
          streaks,
          regularityScore
        });
      }
    });

    return patterns;
  }

  /**
   * Identify day-specific patterns
   */
  static identifyDayPatterns(records) {
    const dayStats = new Map();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    records.forEach(record => {
      const dayName = dayNames[record.date.getDay()];
      if (!dayStats.has(dayName)) {
        dayStats.set(dayName, { present: 0, absent: 0, total: 0 });
      }

      const stats = dayStats.get(dayName);
      stats.total++;
      stats[record.status === 'present' ? 'present' : 'absent']++;
    });

    const patterns = {};
    dayStats.forEach((stats, day) => {
      if (stats.total >= 3) {
        const presentRate = (stats.present / stats.total) * 100;
        if (presentRate >= 80) {
          patterns[day] = 'frequently_present';
        } else if (presentRate <= 20) {
          patterns[day] = 'frequently_absent';
        }
      }
    });

    return patterns;
  }

  /**
   * Identify attendance streaks
   */
  static identifyStreaks(records) {
    const streaks = [];
    let currentStreak = {
      type: null,
      start: null,
      length: 0
    };

    records.sort((a, b) => a.date - b.date);

    records.forEach((record, index) => {
      const isPresent = record.status === 'present';
      
      if (currentStreak.type === null) {
        currentStreak = {
          type: isPresent ? 'present' : 'absent',
          start: record.date,
          length: 1
        };
      } else if ((isPresent && currentStreak.type === 'present') ||
                (!isPresent && currentStreak.type === 'absent')) {
        currentStreak.length++;
      } else {
        if (currentStreak.length >= 3) {
          streaks.push({ ...currentStreak });
        }
        currentStreak = {
          type: isPresent ? 'present' : 'absent',
          start: record.date,
          length: 1
        };
      }
    });

    if (currentStreak.length >= 3) {
      streaks.push(currentStreak);
    }

    return streaks;
  }

  /**
   * Calculate attendance regularity score
   */
  static calculateRegularityScore(records) {
    if (records.length < 5) return 0;

    const intervals = [];
    let lastPresent = null;

    records.sort((a, b) => a.date - b.date);

    records.forEach(record => {
      if (record.status === 'present') {
        if (lastPresent) {
          intervals.push(record.date - lastPresent);
        }
        lastPresent = record.date;
      }
    });

    if (intervals.length < 2) return 0;

    // Calculate standard deviation of intervals
    const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / intervals.length;
    const stdDev = Math.sqrt(variance);

    // Convert to regularity score (0-100)
    const maxStdDev = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
    const regularityScore = 100 * (1 - Math.min(stdDev / maxStdDev, 1));

    return regularityScore;
  }

  /**
   * Get week start date
   */
  static getWeekStart(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - d.getDay() + 1);
    return d;
  }
}

export default AnalyticsService; 