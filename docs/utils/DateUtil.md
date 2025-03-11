# DateUtil Documentation

The `DateUtil` class provides a comprehensive set of static methods for date manipulation and calculations, specifically designed for attendance tracking and analytics.

## Table of Contents
- [Basic Date Operations](#basic-date-operations)
- [Date Range Operations](#date-range-operations)
- [Time Period Calculations](#time-period-calculations)
- [Working Day Operations](#working-day-operations)
- [Formatting and Names](#formatting-and-names)
- [Analytics Support](#analytics-support)

## Basic Date Operations

### Get Start/End of Day
```javascript
const date = new Date('2024-03-15T15:30:00');

// Get start of day (2024-03-15 00:00:00)
const startOfDay = DateUtil.getStartOfDay(date);

// Get end of day (2024-03-15 23:59:59.999)
const endOfDay = DateUtil.getEndOfDay(date);
```

### Add/Subtract Days
```javascript
const date = new Date('2024-03-15');

// Add 5 days (2024-03-20)
const futureDate = DateUtil.addDays(date, 5);

// Subtract 3 days (2024-03-12)
const pastDate = DateUtil.subtractDays(date, 3);
```

## Date Range Operations

### Get Date Range
```javascript
const startDate = new Date('2024-03-01');
const endDate = new Date('2024-03-05');

// Get array of dates between start and end
const dateRange = DateUtil.getDateRange(startDate, endDate);
// Returns: [2024-03-01, 2024-03-02, 2024-03-03, 2024-03-04, 2024-03-05]

// Get only working days
const workingDays = DateUtil.getWorkingDays(startDate, endDate);
// Excludes weekends
```

### Calculate Difference
```javascript
const date1 = new Date('2024-03-01');
const date2 = new Date('2024-03-15');

const daysDiff = DateUtil.getDaysDifference(date1, date2); // 14
```

## Time Period Calculations

### Week Operations
```javascript
const date = new Date('2024-03-15'); // A Friday

// Get start of week (2024-03-11 Monday)
const weekStart = DateUtil.getStartOfWeek(date);

// Get end of week (2024-03-17 Sunday)
const weekEnd = DateUtil.getEndOfWeek(date);

// Get week number
const weekNum = DateUtil.getWeekNumber(date); // e.g., 11
```

### Month Operations
```javascript
const date = new Date('2024-03-15');

// Get start of month (2024-03-01)
const monthStart = DateUtil.getStartOfMonth(date);

// Get end of month (2024-03-31)
const monthEnd = DateUtil.getEndOfMonth(date);

// Get month name
const monthName = DateUtil.getMonthName(date); // "March"
```

## Working Day Operations

### Working Day Validation
```javascript
const date = new Date('2024-03-15');
const dayGroup = 'Friday';

// Check if date is weekend
const isWeekend = DateUtil.isWeekend(date); // false

// Check if valid working day for group
const isValidDay = DateUtil.isValidWorkingDay(date, dayGroup); // true

// Get next working day
const nextWorkDay = DateUtil.getNextWorkingDay(date); // 2024-03-18
```

## Formatting and Names

### Date Formatting
```javascript
const date = new Date('2024-03-15T14:30:00');

// Format date (YYYY-MM-DD)
const formattedDate = DateUtil.formatDate(date); // "2024-03-15"

// Format time (12-hour)
const formattedTime = DateUtil.formatTime(date); // "02:30 PM"

// Get day name
const dayName = DateUtil.getDayName(date); // "Friday"
```

## Analytics Support

### Period Calculations
```javascript
const date = new Date('2024-03-15');

// Get week period
const weekPeriod = DateUtil.getDatePeriods(date, 'week');
// { start: 2024-03-11, end: 2024-03-17 }

// Get month period
const monthPeriod = DateUtil.getDatePeriods(date, 'month');
// { start: 2024-03-01, end: 2024-03-31 }

// Get quarter
const quarter = DateUtil.getQuarter(date); // 1 (Q1)
```

## Best Practices

1. Always use the utility methods instead of direct date manipulation
2. Be aware of timezone implications
3. Use appropriate period calculations for analytics
4. Consider working days vs calendar days for attendance calculations

## Error Handling

All methods handle invalid dates gracefully:
- Invalid date inputs are converted to valid Date objects
- Weekend checks account for different calendar systems
- Period calculations handle month boundaries correctly 