# Attendance API

## Overview

The Attendance API provides endpoints for managing attendance records, including marking attendance, retrieving records, and managing attendance-related operations.

## Endpoints

### Mark Attendance

```http
POST /api/attendance
Authorization: Bearer <token>
Content-Type: application/json
```

Mark attendance for one or more users.

#### Request Body
```json
{
  "date": "2024-03-15T09:00:00.000Z",
  "members": [
    {
      "memberId": "507f1f77bcf86cd799439011",
      "status": "present",
      "notes": "On time"
    },
    {
      "memberId": "507f1f77bcf86cd799439012",
      "status": "absent",
      "notes": "Sick leave"
    }
  ]
}
```

#### Response
```json
{
  "status": "success",
  "message": "Attendance marked successfully",
  "data": {
    "date": "2024-03-15T09:00:00.000Z",
    "records": [
      {
        "id": "507f1f77bcf86cd799439013",
        "memberId": "507f1f77bcf86cd799439011",
        "status": "present",
        "notes": "On time",
        "markedBy": "507f1f77bcf86cd799439014",
        "createdAt": "2024-03-15T09:00:00.000Z"
      },
      {
        "id": "507f1f77bcf86cd799439015",
        "memberId": "507f1f77bcf86cd799439012",
        "status": "absent",
        "notes": "Sick leave",
        "markedBy": "507f1f77bcf86cd799439014",
        "createdAt": "2024-03-15T09:00:00.000Z"
      }
    ]
  }
}
```

### List Attendance Records

```http
GET /api/attendance
Authorization: Bearer <token>
```

Get attendance records with filtering options.

#### Query Parameters
- `startDate` (ISO date) - Start date for records
- `endDate` (ISO date) - End date for records
- `status` (string) - Filter by status
- `dayGroup` (string) - Filter by day group
- `page` (number) - Page number
- `limit` (number) - Records per page

#### Response
```json
{
  "status": "success",
  "data": {
    "data": [
      {
        "id": "507f1f77bcf86cd799439013",
        "memberId": {
          "id": "507f1f77bcf86cd799439011",
          "name": "John Doe",
          "dayGroup": "Monday"
        },
        "status": "present",
        "notes": "On time",
        "date": "2024-03-15T09:00:00.000Z",
        "markedBy": {
          "id": "507f1f77bcf86cd799439014",
          "name": "Team Leader"
        },
        "createdAt": "2024-03-15T09:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 45,
      "totalPages": 5,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

### Get Attendance Details

```http
GET /api/attendance/:id
Authorization: Bearer <token>
```

Get detailed information about a specific attendance record.

#### Response
```json
{
  "status": "success",
  "data": {
    "id": "507f1f77bcf86cd799439013",
    "memberId": {
      "id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com",
      "dayGroup": "Monday"
    },
    "status": "present",
    "notes": "On time",
    "date": "2024-03-15T09:00:00.000Z",
    "markedBy": {
      "id": "507f1f77bcf86cd799439014",
      "name": "Team Leader",
      "email": "leader@example.com"
    },
    "createdAt": "2024-03-15T09:00:00.000Z",
    "updatedAt": "2024-03-15T09:00:00.000Z"
  }
}
```

### Update Attendance

```http
PUT /api/attendance/:id
Authorization: Bearer <token>
Content-Type: application/json
```

Update an existing attendance record.

#### Request Body
```json
{
  "status": "present",
  "notes": "Updated notes",
  "reason": "Correction of status"
}
```

#### Response
```json
{
  "status": "success",
  "message": "Attendance updated successfully",
  "data": {
    "id": "507f1f77bcf86cd799439013",
    "status": "present",
    "notes": "Updated notes",
    "updatedAt": "2024-03-15T10:00:00.000Z"
  }
}
```

### Delete Attendance

```http
DELETE /api/attendance/:id
Authorization: Bearer <token>
```

Delete an attendance record.

#### Response
```json
{
  "status": "success",
  "message": "Attendance record deleted successfully"
}
```

### Get User Attendance

```http
GET /api/attendance/user/:userId
Authorization: Bearer <token>
```

Get attendance records for a specific user.

#### Query Parameters
- `startDate` (ISO date) - Start date for records
- `endDate` (ISO date) - End date for records
- `status` (string) - Filter by status
- `page` (number) - Page number
- `limit` (number) - Records per page

#### Response
```json
{
  "status": "success",
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "dayGroup": "Monday"
    },
    "records": {
      "data": [
        {
          "id": "507f1f77bcf86cd799439013",
          "status": "present",
          "notes": "On time",
          "date": "2024-03-15T09:00:00.000Z"
        }
      ],
      "pagination": {
        "page": 1,
        "limit": 10,
        "total": 20,
        "totalPages": 2,
        "hasNextPage": true,
        "hasPrevPage": false
      }
    },
    "summary": {
      "total": 20,
      "present": 18,
      "absent": 2,
      "attendanceRate": 0.9
    }
  }
}
```

## Validation Rules

### Date Validation
- Must be a valid ISO 8601 date
- Cannot be in the future
- Must be within allowed range (configurable)

### Status Values
- `present` - User was present
- `absent` - User was absent
- `system-absent` - System-marked absence

### Notes Requirements
- Maximum 500 characters
- Optional field

## Error Responses

### Invalid Date
```json
{
  "status": "error",
  "message": "Validation Error",
  "errors": {
    "date": "Invalid date or date in future"
  }
}
```

### Invalid Status
```json
{
  "status": "error",
  "message": "Validation Error",
  "errors": {
    "status": "Invalid attendance status"
  }
}
```

### Record Not Found
```json
{
  "status": "error",
  "message": "Attendance record not found",
  "errors": null
}
```

### Unauthorized Update
```json
{
  "status": "error",
  "message": "Not authorized to update this record",
  "errors": null
}
```

## Business Rules

1. **Marking Rules**
   - Can only mark attendance for assigned members
   - Cannot mark future attendance
   - Cannot mark attendance for non-working days
   - Cannot mark duplicate attendance for same date

2. **Update Rules**
   - Leaders can update their team's attendance
   - Admins can update any attendance
   - Updates require reason for change
   - Updates are logged for audit

3. **Delete Rules**
   - Only admins can delete records
   - Deletion is soft delete
   - Audit trail is maintained

## Examples

### Bulk Mark Attendance
```http
POST /api/attendance/bulk
Authorization: Bearer <token>
Content-Type: application/json

{
  "date": "2024-03-15T09:00:00.000Z",
  "members": [
    {
      "memberId": "507f1f77bcf86cd799439011",
      "status": "present"
    },
    {
      "memberId": "507f1f77bcf86cd799439012",
      "status": "absent",
      "notes": "Sick leave"
    }
  ]
}
```

### Update with Override
```http
PUT /api/attendance/507f1f77bcf86cd799439013/override
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "present",
  "notes": "System error correction",
  "reason": "System marked wrong status",
  "overrideType": "correction"
}
```

### Get Attendance Summary
```http
GET /api/attendance/summary?startDate=2024-03-01&endDate=2024-03-31&dayGroup=Monday
Authorization: Bearer <token>
```

## Best Practices

1. **Data Validation**
   - Validate dates and times
   - Check user permissions
   - Verify working days
   - Validate status changes

2. **Performance**
   - Use pagination for lists
   - Index frequently queried fields
   - Cache common queries
   - Optimize bulk operations

3. **Audit Trail**
   - Log all changes
   - Track who made changes
   - Record change reasons
   - Maintain history 