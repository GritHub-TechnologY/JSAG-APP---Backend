# Utility Functions Documentation

This documentation covers the utility functions used in the Attendance Management System.

## Overview

The system includes three main utility classes:

1. [DateUtil](DateUtil.md) - Date manipulation and calculations
2. [ResponseUtil](ResponseUtil.md) - API response handling
3. [CryptoUtil](CryptoUtil.md) - Security and cryptography

## Quick Start

### Date Operations
```javascript
import DateUtil from '../utils/date.util';

// Get working days in a date range
const startDate = new Date('2024-03-01');
const endDate = new Date('2024-03-31');
const workingDays = DateUtil.getWorkingDays(startDate, endDate);
```

### API Responses
```javascript
import ResponseUtil from '../utils/response.util';

// Send paginated response
const items = await getItems(page, limit);
ResponseUtil.paginated(res, items.data, page, limit, items.total);
```

### Security Operations
```javascript
import CryptoUtil from '../utils/crypto.util';

// Generate and verify JWT token
const token = CryptoUtil.generateToken({ userId: '123' });
const decoded = CryptoUtil.verifyToken(token);
```

## Common Use Cases

### Attendance Tracking
```javascript
// Check if date is valid for attendance
const isValid = DateUtil.isValidWorkingDay(date, userDayGroup);

// Format attendance record
const record = {
  date: DateUtil.formatDate(date),
  time: DateUtil.formatTime(date)
};
```

### API Response Handling
```javascript
// Success with created resource
ResponseUtil.created(res, newResource);

// Error with validation
ResponseUtil.validationError(res, validationErrors);

// Export data
ResponseUtil.exportResponse(res, csvData, 'csv');
```

### Security Implementation
```javascript
// Password management
const hashedPassword = await CryptoUtil.hashPassword(password);
const isValid = CryptoUtil.validatePasswordStrength(password);

// OTP verification
const otp = CryptoUtil.generateOTP();
const isValid = CryptoUtil.verifyOTP(userOtp, storedOtp, expiryTime);
```

## Integration Examples

### User Registration
```javascript
async function registerUser(req, res) {
  try {
    // Validate password
    const passwordValidation = CryptoUtil.validatePasswordStrength(req.body.password);
    if (!passwordValidation.isValid) {
      return ResponseUtil.validationError(res, passwordValidation.errors);
    }

    // Hash password
    const hashedPassword = await CryptoUtil.hashPassword(req.body.password);

    // Create user
    const user = await createUser({ ...req.body, password: hashedPassword });

    // Generate token
    const token = CryptoUtil.generateToken({ userId: user.id });

    // Return response
    return ResponseUtil.created(res, { user, token });
  } catch (error) {
    return ResponseUtil.serverError(res, error);
  }
}
```

### Attendance Marking
```javascript
async function markAttendance(req, res) {
  try {
    const { date, userId } = req.body;
    const user = await getUser(userId);

    // Validate attendance date
    if (!DateUtil.isValidWorkingDay(new Date(date), user.dayGroup)) {
      return ResponseUtil.validationError(res, {
        date: 'Invalid attendance date for user day group'
      });
    }

    // Create attendance record
    const attendance = await createAttendance({
      userId,
      date: DateUtil.formatDate(new Date(date)),
      time: DateUtil.formatTime(new Date())
    });

    return ResponseUtil.created(res, attendance);
  } catch (error) {
    return ResponseUtil.serverError(res, error);
  }
}
```

## Best Practices

1. **Date Handling**
   - Always use DateUtil for date operations
   - Consider timezone implications
   - Validate working days properly

2. **API Responses**
   - Use consistent response formats
   - Include appropriate status codes
   - Handle errors gracefully

3. **Security**
   - Follow security best practices
   - Implement proper error handling
   - Use secure configurations

## Contributing

When adding new utility functions:
1. Follow the established patterns
2. Add comprehensive documentation
3. Include usage examples
4. Consider security implications
5. Add appropriate error handling 