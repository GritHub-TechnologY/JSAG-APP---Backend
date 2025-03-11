/**
 * Date utility functions
 */
class DateUtil {
  /**
   * Get start of day
   */
  static getStartOfDay(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  /**
   * Get end of day
   */
  static getEndOfDay(date) {
    const d = new Date(date);
    d.setHours(23, 59, 59, 999);
    return d;
  }

  /**
   * Get start of week (Monday)
   */
  static getStartOfWeek(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  /**
   * Get end of week (Sunday)
   */
  static getEndOfWeek(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? 0 : 7);
    d.setDate(diff);
    d.setHours(23, 59, 59, 999);
    return d;
  }

  /**
   * Get start of month
   */
  static getStartOfMonth(date) {
    const d = new Date(date);
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  /**
   * Get end of month
   */
  static getEndOfMonth(date) {
    const d = new Date(date);
    d.setMonth(d.getMonth() + 1);
    d.setDate(0);
    d.setHours(23, 59, 59, 999);
    return d;
  }

  /**
   * Format date to ISO string without time
   */
  static formatDate(date) {
    return date.toISOString().split('T')[0];
  }

  /**
   * Check if date is weekend
   */
  static isWeekend(date) {
    const day = date.getDay();
    return day === 0 || day === 6;
  }

  /**
   * Get day name
   */
  static getDayName(date) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[date.getDay()];
  }

  /**
   * Calculate date difference in days
   */
  static getDaysDifference(date1, date2) {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const diffTime = Math.abs(d2 - d1);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Add days to date
   */
  static addDays(date, days) {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
  }

  /**
   * Subtract days from date
   */
  static subtractDays(date, days) {
    const d = new Date(date);
    d.setDate(d.getDate() - days);
    return d;
  }

  /**
   * Get date range array
   */
  static getDateRange(startDate, endDate) {
    const dates = [];
    const current = new Date(startDate);
    const end = new Date(endDate);

    while (current <= end) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return dates;
  }

  /**
   * Get working days in range
   */
  static getWorkingDays(startDate, endDate) {
    return this.getDateRange(startDate, endDate).filter(date => !this.isWeekend(date));
  }

  /**
   * Get week number
   */
  static getWeekNumber(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const yearStart = new Date(d.getFullYear(), 0, 1);
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  }

  /**
   * Get month name
   */
  static getMonthName(date) {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                   'July', 'August', 'September', 'October', 'November', 'December'];
    return months[date.getMonth()];
  }

  /**
   * Get quarter
   */
  static getQuarter(date) {
    return Math.floor(date.getMonth() / 3) + 1;
  }

  /**
   * Check if date is valid working day
   */
  static isValidWorkingDay(date, dayGroup) {
    if (this.isWeekend(date)) return false;
    return this.getDayName(date) === dayGroup;
  }

  /**
   * Get next working day
   */
  static getNextWorkingDay(date) {
    const next = new Date(date);
    do {
      next.setDate(next.getDate() + 1);
    } while (this.isWeekend(next));
    return next;
  }

  /**
   * Format time
   */
  static formatTime(date) {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  }

  /**
   * Get date periods for analytics
   */
  static getDatePeriods(date, type = 'week') {
    const periods = {
      week: {
        start: this.getStartOfWeek(date),
        end: this.getEndOfWeek(date)
      },
      month: {
        start: this.getStartOfMonth(date),
        end: this.getEndOfMonth(date)
      },
      quarter: {
        start: new Date(date.getFullYear(), Math.floor(date.getMonth() / 3) * 3, 1),
        end: new Date(date.getFullYear(), Math.floor(date.getMonth() / 3) * 3 + 3, 0)
      }
    };
    return periods[type] || periods.week;
  }
}

export default DateUtil; 