# API Documentation

## Overview

The Attendance Management System provides a RESTful API for managing users, attendance, and analytics. All endpoints require authentication unless specified otherwise.

## Base URL

```
https://your-domain.com/api
```

## Authentication

All authenticated endpoints require a JWT token in the Authorization header:

```http
Authorization: Bearer <your-jwt-token>
```

## Response Format

### Success Response
```json
{
  "status": "success",
  "message": "Operation successful",
  "data": {
    // Response data
  }
}
```

### Error Response
```json
{
  "status": "error",
  "message": "Error message",
  "errors": {
    // Detailed error information
  }
}
```

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | User login |
| POST | `/auth/refresh` | Refresh access token |
| POST | `/auth/logout` | User logout |
| POST | `/auth/forgot-password` | Request password reset |
| POST | `/auth/reset-password` | Reset password |

### Users

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/users` | List all users |
| GET | `/users/:id` | Get user details |
| POST | `/users` | Create new user |
| PUT | `/users/:id` | Update user |
| DELETE | `/users/:id` | Delete user |
| GET | `/users/me` | Get current user |
| PUT | `/users/me` | Update current user |

### Attendance

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/attendance` | Mark attendance |
| GET | `/attendance` | List attendance records |
| GET | `/attendance/:id` | Get attendance details |
| PUT | `/attendance/:id` | Update attendance |
| DELETE | `/attendance/:id` | Delete attendance |
| GET | `/attendance/user/:userId` | Get user attendance |

### Analytics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/analytics/attendance` | Get attendance analytics |
| GET | `/analytics/trends` | Get attendance trends |
| GET | `/analytics/export` | Export attendance data |
| GET | `/analytics/reports` | Generate reports |

## Detailed Documentation

- [Authentication API](auth.md)
- [User API](users.md)
- [Attendance API](attendance.md)
- [Analytics API](analytics.md)

## Rate Limiting

API requests are limited to:
- 100 requests per minute for authenticated users
- 20 requests per minute for unauthenticated users

## Pagination

List endpoints support pagination using query parameters:

```http
GET /api/users?page=1&limit=10
```

Response includes pagination metadata:
```json
{
  "status": "success",
  "data": {
    "data": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "totalPages": 10,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

## Filtering

List endpoints support filtering using query parameters:

```http
GET /api/attendance?startDate=2024-01-01&endDate=2024-03-31&status=present
```

## Sorting

List endpoints support sorting using query parameters:

```http
GET /api/users?sortBy=name&sortOrder=asc
```

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 429 | Too Many Requests |
| 500 | Internal Server Error |

## Data Formats

### Dates
- All dates should be in ISO 8601 format
- Timezone should be specified
```
YYYY-MM-DDTHH:mm:ss.sssZ
```

### IDs
- All IDs are MongoDB ObjectIDs
- 24 character hexadecimal strings

### Enums

**User Roles**
- `admin`
- `leader`
- `member`

**Day Groups**
- `Monday`
- `Tuesday`
- `Wednesday`
- `Thursday`
- `Friday`

**Attendance Status**
- `present`
- `absent`
- `system-absent`

## Examples

### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "dayGroup": "Monday",
  "role": "member"
}
```

### Mark Attendance
```http
POST /api/attendance
Content-Type: application/json
Authorization: Bearer <token>

{
  "userId": "507f1f77bcf86cd799439011",
  "date": "2024-03-15T09:00:00.000Z",
  "status": "present"
}
```

### Get Analytics
```http
GET /api/analytics/attendance?startDate=2024-01-01&endDate=2024-03-31&dayGroup=Monday
Authorization: Bearer <token>
```

## SDKs and Libraries

- [JavaScript SDK](https://github.com/your-org/attendance-sdk-js)
- [Python SDK](https://github.com/your-org/attendance-sdk-python)
- [Postman Collection](https://github.com/your-org/attendance-postman)

## Support

For API support:
- Create an issue in the repository
- Contact the development team
- Check the documentation

## Changelog

### v1.0.0 (2024-03-15)
- Initial API release
- Basic CRUD operations
- Authentication system
- Analytics features

### v1.1.0 (Coming Soon)
- Enhanced analytics
- Bulk operations
- Real-time updates
- Advanced filtering 