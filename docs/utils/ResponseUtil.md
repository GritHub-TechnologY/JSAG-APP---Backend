# ResponseUtil Documentation

The `ResponseUtil` class provides standardized methods for handling API responses, ensuring consistent response formats across the application.

## Table of Contents
- [Success Responses](#success-responses)
- [Error Responses](#error-responses)
- [Special Response Types](#special-response-types)
- [Data Export Responses](#data-export-responses)
- [Response Format](#response-format)

## Success Responses

### Basic Success Response
```javascript
// Basic success response
ResponseUtil.success(res, { user: { id: 1, name: 'John' } });
/*
{
  status: 'success',
  message: 'Success',
  data: {
    user: { id: 1, name: 'John' }
  }
}
*/

// Success with custom message
ResponseUtil.success(res, { count: 5 }, 'Items retrieved successfully');
/*
{
  status: 'success',
  message: 'Items retrieved successfully',
  data: { count: 5 }
}
*/
```

### Created Response (201)
```javascript
// Resource creation response
ResponseUtil.created(res, { id: 1, name: 'New Item' });
/*
{
  status: 'success',
  message: 'Resource Created',
  data: { id: 1, name: 'New Item' }
}
*/
```

### Accepted Response (202)
```javascript
// Long-running task acceptance
ResponseUtil.accepted(res, { taskId: 'abc123' });
/*
{
  status: 'success',
  message: 'Request Accepted',
  data: { taskId: 'abc123' }
}
*/
```

### No Content Response (204)
```javascript
// Response without content
ResponseUtil.noContent(res);
// Returns status 204 with no body
```

## Error Responses

### Basic Error Response
```javascript
// Basic error
ResponseUtil.error(res, 'Something went wrong');
/*
{
  status: 'error',
  message: 'Something went wrong',
  errors: null
}
*/

// Error with validation details
ResponseUtil.validationError(res, {
  email: 'Invalid email format',
  password: 'Password too short'
});
/*
{
  status: 'error',
  message: 'Validation Error',
  errors: {
    email: 'Invalid email format',
    password: 'Password too short'
  }
}
*/
```

### Common HTTP Error Responses
```javascript
// Unauthorized (401)
ResponseUtil.unauthorized(res, 'Invalid credentials');

// Forbidden (403)
ResponseUtil.forbidden(res, 'Insufficient permissions');

// Not Found (404)
ResponseUtil.notFound(res, 'User not found');

// Conflict (409)
ResponseUtil.conflict(res, 'Email already exists');

// Too Many Requests (429)
ResponseUtil.tooManyRequests(res, 'Rate limit exceeded');
```

### Server Error Response
```javascript
// Development environment
ResponseUtil.serverError(res, new Error('Database connection failed'));
/*
{
  status: 'error',
  message: 'Database connection failed',
  errors: {
    stack: '...',
    ...error details
  }
}
*/

// Production environment
// Note: Error details are hidden in production
ResponseUtil.serverError(res, new Error('Database connection failed'));
/*
{
  status: 'error',
  message: 'Internal Server Error',
  errors: null
}
*/
```

## Special Response Types

### Paginated Response
```javascript
const items = [/* array of items */];
ResponseUtil.paginated(res, items, 2, 10, 45);
/*
{
  status: 'success',
  data: {
    data: [...items],
    pagination: {
      page: 2,
      limit: 10,
      total: 45,
      totalPages: 5,
      hasNextPage: true,
      hasPrevPage: true
    }
  }
}
*/
```

### Bulk Operation Response
```javascript
const results = [
  { id: 1, success: true },
  { id: 2, success: false, error: 'Invalid data' }
];

ResponseUtil.bulkResponse(res, results);
/*
{
  status: 'success',
  data: {
    summary: {
      total: 2,
      successful: 1,
      failed: 1
    },
    results: [
      { id: 1, success: true },
      { id: 2, success: false, error: 'Invalid data' }
    ]
  }
}
*/
```

### Analytics Response
```javascript
const analyticsData = {
  totalAttendance: 150,
  averageRate: 0.85
};

const metadata = {
  period: 'March 2024',
  dayGroup: 'Monday'
};

ResponseUtil.analyticsResponse(res, analyticsData, metadata);
/*
{
  status: 'success',
  data: {
    metadata: {
      period: 'March 2024',
      dayGroup: 'Monday'
    },
    data: {
      totalAttendance: 150,
      averageRate: 0.85
    }
  }
}
*/
```

## Data Export Responses

### File Export Response
```javascript
// CSV Export
const csvData = 'name,email\nJohn,john@example.com';
ResponseUtil.exportResponse(res, csvData, 'csv');
// Sets appropriate headers and sends file

// PDF Export
const pdfData = Buffer.from('PDF content');
ResponseUtil.exportResponse(res, pdfData, 'pdf');
// Sets appropriate headers and sends file
```

### Streaming Response
```javascript
const dataStream = getDataStream(); // Some readable stream
ResponseUtil.streamResponse(res, dataStream);
// Pipes stream to response with error handling
```

## Best Practices

1. Always use appropriate status codes
2. Include meaningful error messages
3. Hide sensitive error details in production
4. Use consistent response formats
5. Include pagination when returning lists
6. Add metadata for analytics responses

## Error Handling Guidelines

1. Use specific error responses for different scenarios
2. Include validation details when applicable
3. Handle production vs development environments
4. Provide clear error messages
5. Include error tracking information when appropriate 