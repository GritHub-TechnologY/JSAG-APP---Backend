import Attendance from '../models/attendance.model.js';
import User from '../models/user.model.js';
// import { redisClient } from '../app.js';
import { logger } from '../config/logger.config.js';

class PredictiveService {
  /**
   * Generate attendance predictions and risk analysis
   */
  static async generatePredictions(startDate, endDate, dayGroup) {
    try {
      const cacheKey = `predictions:${startDate}:${endDate}:${dayGroup}`;
      
      // Try to get from cache
      // const cachedResult = await redisClient.get(cacheKey);
      // if (cachedResult) {
      //   return JSON.parse(cachedResult);
      // }

      // Get members and their attendance records
      const memberQuery = { role: 'member', status: 'active' };
      if (dayGroup) {
        memberQuery.dayGroup = dayGroup;
      }
      const members = await User.find(memberQuery);

      const records = await Attendance.find({
        date: { $gte: new Date(startDate), $lte: new Date(endDate) },
        member: { $in: members.map(m => m._id) }
      }).sort({ date: 1 });

      // Generate predictions
      const predictions = {
        memberPredictions: this.predictMemberAttendance(records, members),
        riskAnalysis: this.analyzeAttendanceRisks(records, members),
        trendPredictions: this.predictAttendanceTrends(records),
        interventionSuggestions: this.generateInterventionSuggestions(records, members)
      };

      // Cache results for 1 hour
      await redisClient.set(cacheKey, JSON.stringify(predictions), 'EX', 3600);

      return predictions;
    } catch (error) {
      logger.error('Prediction generation error:', error);
      throw error;
    }
  }

  /**
   * Predict individual member attendance
   */
  static predictMemberAttendance(records, members) {
    const predictions = [];

    members.forEach(member => {
      const memberRecords = records.filter(r => 
        r.member.toString() === member._id.toString()
      );

      if (memberRecords.length < 5) {
        return; // Insufficient data for prediction
      }

      // Calculate recent attendance pattern
      const recentRecords = memberRecords.slice(-10);
      const recentAttendanceRate = recentRecords.filter(r => 
        r.status === 'present'
      ).length / recentRecords.length;

      // Analyze day-specific patterns
      const dayPatterns = this.analyzeDaySpecificPatterns(memberRecords);

      // Calculate trend momentum
      const momentum = this.calculateTrendMomentum(memberRecords);

      // Generate prediction
      const prediction = {
        memberId: member._id,
        name: member.name,
        predictedAttendanceRate: this.calculatePredictedRate(
          recentAttendanceRate,
          momentum,
          dayPatterns
        ),
        riskLevel: this.assessRiskLevel(recentAttendanceRate, momentum),
        nextDayPrediction: this.predictNextDayAttendance(
          memberRecords,
          dayPatterns
        ),
        confidenceScore: this.calculateConfidenceScore(memberRecords.length),
        factors: {
          historicalAttendance: recentAttendanceRate,
          momentum,
          dayPatterns
        }
      };

      predictions.push(prediction);
    });

    return predictions;
  }

  /**
   * Analyze attendance risks
   */
  static analyzeAttendanceRisks(records, members) {
    const risks = {
      highRiskMembers: [],
      systemicIssues: [],
      dayGroupRisks: new Map(),
      attendanceTrends: []
    };

    // Analyze individual member risks
    members.forEach(member => {
      const memberRecords = records.filter(r => 
        r.member.toString() === member._id.toString()
      );

      const riskAnalysis = this.analyzeMemberRisk(memberRecords, member);
      if (riskAnalysis.riskLevel === 'high') {
        risks.highRiskMembers.push(riskAnalysis);
      }
    });

    // Analyze systemic issues
    const systemicIssues = this.analyzeSystemicIssues(records);
    risks.systemicIssues = systemicIssues;

    // Analyze day group risks
    const dayGroupRisks = this.analyzeDayGroupRisks(records, members);
    risks.dayGroupRisks = dayGroupRisks;

    // Analyze attendance trends
    risks.attendanceTrends = this.analyzeAttendanceTrends(records);

    return risks;
  }

  /**
   * Predict attendance trends
   */
  static predictAttendanceTrends(records) {
    const recentRecords = records.slice(-30); // Last 30 days
    const weeklyTrends = new Map();

    // Group records by week
    recentRecords.forEach(record => {
      const weekStart = this.getWeekStart(record.date);
      const weekKey = weekStart.toISOString().split('T')[0];

      if (!weeklyTrends.has(weekKey)) {
        weeklyTrends.set(weekKey, {
          present: 0,
          total: 0
        });
      }

      const week = weeklyTrends.get(weekKey);
      week.total++;
      if (record.status === 'present') {
        week.present++;
      }
    });

    // Calculate trend line
    const trendData = Array.from(weeklyTrends.entries()).map(([week, data]) => ({
      week,
      rate: (data.present / data.total) * 100
    }));

    // Predict next week's rate using linear regression
    const prediction = this.calculateLinearRegression(trendData);

    return {
      historicalTrend: trendData,
      prediction: {
        nextWeekRate: prediction.nextValue,
        confidence: prediction.confidence,
        trend: prediction.trend
      }
    };
  }

  /**
   * Generate intervention suggestions
   */
  static generateInterventionSuggestions(records, members) {
    const suggestions = [];

    members.forEach(member => {
      const memberRecords = records.filter(r => 
        r.member.toString() === member._id.toString()
      );

      if (memberRecords.length === 0) return;

      const riskAnalysis = this.analyzeMemberRisk(memberRecords, member);
      if (riskAnalysis.riskLevel === 'high' || riskAnalysis.riskLevel === 'medium') {
        const intervention = this.suggestIntervention(riskAnalysis, memberRecords);
        if (intervention) {
          suggestions.push({
            memberId: member._id,
            name: member.name,
            ...intervention
          });
        }
      }
    });

    return suggestions;
  }

  /**
   * Analyze member risk
   */
  static analyzeMemberRisk(records, member) {
    if (records.length === 0) {
      return {
        memberId: member._id,
        name: member.name,
        riskLevel: 'unknown',
        factors: ['insufficient_data']
      };
    }

    const recentRecords = records.slice(-10);
    const factors = [];
    let riskScore = 0;

    // Calculate recent attendance rate
    const recentAttendanceRate = recentRecords.filter(r => 
      r.status === 'present'
    ).length / recentRecords.length;

    // Assess consecutive absences
    const consecutiveAbsences = this.calculateConsecutiveAbsences(records);
    if (consecutiveAbsences >= 3) {
      factors.push('consecutive_absences');
      riskScore += consecutiveAbsences * 10;
    }

    // Assess attendance rate
    if (recentAttendanceRate < 0.7) {
      factors.push('low_attendance_rate');
      riskScore += (1 - recentAttendanceRate) * 50;
    }

    // Assess pattern volatility
    const volatility = this.calculateVolatility(records);
    if (volatility > 0.5) {
      factors.push('high_volatility');
      riskScore += volatility * 20;
    }

    // Determine risk level
    const riskLevel = riskScore >= 70 ? 'high' :
                     riskScore >= 40 ? 'medium' : 'low';

    return {
      memberId: member._id,
      name: member.name,
      riskLevel,
      riskScore,
      factors,
      metrics: {
        recentAttendanceRate,
        consecutiveAbsences,
        volatility
      }
    };
  }

  /**
   * Suggest intervention based on risk analysis
   */
  static suggestIntervention(riskAnalysis, records) {
    const suggestions = {
      priority: riskAnalysis.riskLevel === 'high' ? 'immediate' : 'scheduled',
      actions: [],
      reasoning: []
    };

    // Analyze factors and suggest interventions
    riskAnalysis.factors.forEach(factor => {
      switch (factor) {
        case 'consecutive_absences':
          suggestions.actions.push('direct_contact');
          suggestions.reasoning.push('Multiple consecutive absences detected');
          break;
        case 'low_attendance_rate':
          suggestions.actions.push('performance_review');
          suggestions.reasoning.push('Consistently low attendance rate');
          break;
        case 'high_volatility':
          suggestions.actions.push('attendance_monitoring');
          suggestions.reasoning.push('Irregular attendance pattern');
          break;
      }
    });

    // Add specific recommendations
    if (riskAnalysis.metrics.recentAttendanceRate < 0.5) {
      suggestions.actions.push('formal_warning');
      suggestions.reasoning.push('Critical attendance rate below 50%');
    }

    return suggestions;
  }

  /**
   * Calculate trend momentum
   */
  static calculateTrendMomentum(records) {
    if (records.length < 10) return 0;

    const recentRecords = records.slice(-10);
    const olderRecords = records.slice(-20, -10);

    const recentRate = recentRecords.filter(r => 
      r.status === 'present'
    ).length / recentRecords.length;

    const olderRate = olderRecords.filter(r => 
      r.status === 'present'
    ).length / olderRecords.length;

    return recentRate - olderRate;
  }

  /**
   * Calculate predicted attendance rate
   */
  static calculatePredictedRate(currentRate, momentum, dayPatterns) {
    let predictedRate = currentRate + (momentum * 0.5);

    // Adjust based on day patterns
    const dayFactors = Object.values(dayPatterns).reduce((acc, pattern) => {
      if (pattern === 'frequently_present') acc += 0.1;
      if (pattern === 'frequently_absent') acc -= 0.1;
      return acc;
    }, 0);

    predictedRate += dayFactors;

    // Ensure rate is between 0 and 1
    return Math.max(0, Math.min(1, predictedRate));
  }

  /**
   * Calculate confidence score
   */
  static calculateConfidenceScore(recordCount) {
    // More records = higher confidence, max out at 100 records
    return Math.min(recordCount / 100, 1) * 100;
  }

  /**
   * Analyze day-specific patterns
   */
  static analyzeDaySpecificPatterns(records) {
    const dayStats = new Map();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    records.forEach(record => {
      const dayName = dayNames[record.date.getDay()];
      if (!dayStats.has(dayName)) {
        dayStats.set(dayName, { present: 0, total: 0 });
      }

      const stats = dayStats.get(dayName);
      stats.total++;
      if (record.status === 'present') {
        stats.present++;
      }
    });

    const patterns = {};
    dayStats.forEach((stats, day) => {
      if (stats.total >= 3) {
        const rate = stats.present / stats.total;
        if (rate >= 0.8) patterns[day] = 'frequently_present';
        else if (rate <= 0.2) patterns[day] = 'frequently_absent';
      }
    });

    return patterns;
  }

  /**
   * Calculate linear regression for trend prediction
   */
  static calculateLinearRegression(data) {
    if (data.length < 2) {
      return {
        nextValue: null,
        confidence: 0,
        trend: 'insufficient_data'
      };
    }

    const n = data.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = data.map(d => d.rate);

    // Calculate means
    const meanX = x.reduce((a, b) => a + b, 0) / n;
    const meanY = y.reduce((a, b) => a + b, 0) / n;

    // Calculate coefficients
    let numerator = 0;
    let denominator = 0;

    for (let i = 0; i < n; i++) {
      numerator += (x[i] - meanX) * (y[i] - meanY);
      denominator += Math.pow(x[i] - meanX, 2);
    }

    const slope = numerator / denominator;
    const intercept = meanY - slope * meanX;

    // Predict next value
    const nextValue = slope * n + intercept;

    // Calculate R-squared for confidence
    const predictions = x.map(xi => slope * xi + intercept);
    const residuals = y.map((yi, i) => yi - predictions[i]);
    const ssRes = residuals.reduce((a, b) => a + Math.pow(b, 2), 0);
    const ssTotal = y.map(yi => yi - meanY)
                     .reduce((a, b) => a + Math.pow(b, 2), 0);
    const rSquared = 1 - (ssRes / ssTotal);

    return {
      nextValue: Math.max(0, Math.min(100, nextValue)),
      confidence: rSquared * 100,
      trend: slope > 0 ? 'improving' : 
             slope < 0 ? 'declining' : 'stable'
    };
  }

  /**
   * Calculate volatility
   */
  static calculateVolatility(records) {
    if (records.length < 5) return 0;

    let changes = 0;
    for (let i = 1; i < records.length; i++) {
      if (records[i].status !== records[i-1].status) {
        changes++;
      }
    }

    return changes / (records.length - 1);
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

export default PredictiveService; 