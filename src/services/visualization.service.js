import Attendance from '../models/attendance.model.js';
import User from '../models/user.model.js';
// import { redisClient } from '../app.js';
import { logger } from '../config/logger.config.js';

class VisualizationService {
  /**
   * Generate attendance heatmap data
   */
  static async generateHeatmapData(startDate, endDate, dayGroup) {
    try {
      const cacheKey = `viz:heatmap:${startDate}:${endDate}:${dayGroup}`;
      
      // Try to get from cache
      // const cachedResult = await redisClient.get(cacheKey);
      // if (cachedResult) {
      //   return JSON.parse(cachedResult);
      // }

      // Get members
      const memberQuery = { role: 'member', status: 'active' };
      if (dayGroup) {
        memberQuery.dayGroup = dayGroup;
      }
      const members = await User.find(memberQuery).select('name');

      // Get attendance records
      const records = await Attendance.find({
        date: { $gte: new Date(startDate), $lte: new Date(endDate) },
        member: { $in: members.map(m => m._id) }
      }).sort({ date: 1 });

      // Generate heatmap data
      const heatmapData = this.processHeatmapData(records, members);

      // Cache for 1 hour
      await redisClient.set(cacheKey, JSON.stringify(heatmapData), 'EX', 3600);

      return heatmapData;
    } catch (error) {
      logger.error('Heatmap data generation error:', error);
      throw error;
    }
  }

  /**
   * Generate attendance timeline data
   */
  static async generateTimelineData(startDate, endDate, dayGroup) {
    try {
      const cacheKey = `viz:timeline:${startDate}:${endDate}:${dayGroup}`;
      
      // Try to get from cache
      const cachedResult = await redisClient.get(cacheKey);
      if (cachedResult) {
        return JSON.parse(cachedResult);
      }

      // Get attendance records
      const query = {
        date: { $gte: new Date(startDate), $lte: new Date(endDate) }
      };

      if (dayGroup) {
        const members = await User.find({ dayGroup }).select('_id');
        query.member = { $in: members.map(m => m._id) };
      }

      const records = await Attendance.find(query).sort({ date: 1 });

      // Process timeline data
      const timelineData = this.processTimelineData(records);

      // Cache for 1 hour
      await redisClient.set(cacheKey, JSON.stringify(timelineData), 'EX', 3600);

      return timelineData;
    } catch (error) {
      logger.error('Timeline data generation error:', error);
      throw error;
    }
  }

  /**
   * Generate attendance pattern radar data
   */
  static async generateRadarData(memberId, timeframe = 30) {
    try {
      const cacheKey = `viz:radar:${memberId}:${timeframe}`;
      
      // Try to get from cache
      const cachedResult = await redisClient.get(cacheKey);
      if (cachedResult) {
        return JSON.parse(cachedResult);
      }

      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - timeframe);

      // Get attendance records
      const records = await Attendance.find({
        member: memberId,
        date: { $gte: startDate, $lte: endDate }
      }).sort({ date: 1 });

      // Process radar data
      const radarData = this.processRadarData(records);

      // Cache for 1 hour
      await redisClient.set(cacheKey, JSON.stringify(radarData), 'EX', 3600);

      return radarData;
    } catch (error) {
      logger.error('Radar data generation error:', error);
      throw error;
    }
  }

  /**
   * Generate trend comparison data
   */
  static async generateTrendComparisonData(dayGroups, timeframe = 30) {
    try {
      const cacheKey = `viz:trends:${dayGroups.join('-')}:${timeframe}`;
      
      // Try to get from cache
      const cachedResult = await redisClient.get(cacheKey);
      if (cachedResult) {
        return JSON.parse(cachedResult);
      }

      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - timeframe);

      // Get members for each day group
      const dayGroupMembers = await User.find({
        dayGroup: { $in: dayGroups },
        role: 'member',
        status: 'active'
      }).select('dayGroup _id');

      // Group members by day group
      const membersByGroup = dayGroupMembers.reduce((acc, member) => {
        acc[member.dayGroup] = acc[member.dayGroup] || [];
        acc[member.dayGroup].push(member._id);
        return acc;
      }, {});

      // Get attendance records for each group
      const trendData = {};
      for (const dayGroup of dayGroups) {
        const members = membersByGroup[dayGroup] || [];
        const records = await Attendance.find({
          member: { $in: members },
          date: { $gte: startDate, $lte: endDate }
        }).sort({ date: 1 });

        trendData[dayGroup] = this.processTrendData(records);
      }

      // Cache for 1 hour
      await redisClient.set(cacheKey, JSON.stringify(trendData), 'EX', 3600);

      return trendData;
    } catch (error) {
      logger.error('Trend comparison data generation error:', error);
      throw error;
    }
  }

  /**
   * Process heatmap data
   */
  static processHeatmapData(records, members) {
    const heatmap = [];
    const memberMap = new Map(members.map(m => [m._id.toString(), m.name]));

    records.forEach(record => {
      heatmap.push({
        member: memberMap.get(record.member.toString()),
        date: record.date.toISOString().split('T')[0],
        value: record.status === 'present' ? 1 : 0
      });
    });

    return {
      data: heatmap,
      members: Array.from(memberMap.values()),
      dates: [...new Set(heatmap.map(h => h.date))].sort()
    };
  }

  /**
   * Process timeline data
   */
  static processTimelineData(records) {
    const timeline = {};
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    records.forEach(record => {
      const date = record.date.toISOString().split('T')[0];
      const dayOfWeek = dayNames[record.date.getDay()];

      if (!timeline[date]) {
        timeline[date] = {
          date,
          dayOfWeek,
          present: 0,
          absent: 0,
          total: 0
        };
      }

      timeline[date].total++;
      if (record.status === 'present') {
        timeline[date].present++;
      } else {
        timeline[date].absent++;
      }
    });

    return Object.values(timeline).map(day => ({
      ...day,
      presentRate: (day.present / day.total) * 100
    }));
  }

  /**
   * Process radar data
   */
  static processRadarData(records) {
    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const metrics = {
      attendanceByDay: {},
      punctuality: 0,
      consistency: 0,
      longestStreak: 0,
      volatility: 0
    };

    // Initialize day stats
    dayNames.forEach(day => {
      metrics.attendanceByDay[day] = {
        total: 0,
        present: 0,
        rate: 0
      };
    });

    // Process records
    let currentStreak = 0;
    let previousStatus = null;
    let statusChanges = 0;

    records.forEach(record => {
      const dayName = dayNames[record.date.getDay() - 1];
      if (dayName) { // Skip weekends
        const dayStats = metrics.attendanceByDay[dayName];
        dayStats.total++;
        
        if (record.status === 'present') {
          dayStats.present++;
          currentStreak++;
          metrics.longestStreak = Math.max(metrics.longestStreak, currentStreak);
        } else {
          currentStreak = 0;
        }

        if (previousStatus !== null && previousStatus !== record.status) {
          statusChanges++;
        }
        previousStatus = record.status;
      }
    });

    // Calculate rates and metrics
    dayNames.forEach(day => {
      const stats = metrics.attendanceByDay[day];
      stats.rate = stats.total > 0 ? (stats.present / stats.total) * 100 : 0;
    });

    metrics.volatility = records.length > 1 ? 
      (statusChanges / (records.length - 1)) * 100 : 0;

    metrics.consistency = 100 - metrics.volatility;

    return {
      labels: dayNames,
      datasets: [
        {
          label: 'Attendance Rate',
          data: dayNames.map(day => metrics.attendanceByDay[day].rate)
        },
        {
          label: 'Consistency',
          data: dayNames.map(() => metrics.consistency)
        }
      ],
      metrics
    };
  }

  /**
   * Process trend data
   */
  static processTrendData(records) {
    const trends = {
      daily: [],
      weekly: [],
      overall: {
        total: records.length,
        present: 0,
        absent: 0,
        rate: 0
      }
    };

    // Group by date
    const dailyGroups = new Map();
    records.forEach(record => {
      const date = record.date.toISOString().split('T')[0];
      if (!dailyGroups.has(date)) {
        dailyGroups.set(date, { present: 0, total: 0 });
      }
      const group = dailyGroups.get(date);
      group.total++;
      if (record.status === 'present') {
        group.present++;
        trends.overall.present++;
      } else {
        trends.overall.absent++;
      }
    });

    // Calculate daily trends
    trends.daily = Array.from(dailyGroups.entries()).map(([date, stats]) => ({
      date,
      rate: (stats.present / stats.total) * 100
    }));

    // Group by week
    const weeklyGroups = new Map();
    records.forEach(record => {
      const weekStart = this.getWeekStart(record.date);
      const weekKey = weekStart.toISOString().split('T')[0];
      if (!weeklyGroups.has(weekKey)) {
        weeklyGroups.set(weekKey, { present: 0, total: 0 });
      }
      const group = weeklyGroups.get(weekKey);
      group.total++;
      if (record.status === 'present') {
        group.present++;
      }
    });

    // Calculate weekly trends
    trends.weekly = Array.from(weeklyGroups.entries()).map(([week, stats]) => ({
      week,
      rate: (stats.present / stats.total) * 100
    }));

    // Calculate overall rate
    trends.overall.rate = (trends.overall.present / trends.overall.total) * 100;

    return trends;
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

export default VisualizationService; 