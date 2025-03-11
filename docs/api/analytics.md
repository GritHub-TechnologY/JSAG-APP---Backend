# Analytics API

## Overview

The Analytics API provides endpoints for generating attendance analytics, trends, and reports. It supports various data formats and customizable metrics.

## Endpoints

### Get Attendance Analytics

```http
GET /api/analytics/attendance
Authorization: Bearer <token>
```

Get comprehensive attendance analytics for specified period.

#### Query Parameters
- `startDate` (ISO date) - Start date for analysis
- `endDate` (ISO date) - End date for analysis
- `dayGroup` (string) - Filter by day group
- `groupBy` (string) - Group results by (day, week, month)

#### Response
```json
{
  "status": "success",
  "data": {
    "period": {
      "start": "2024-03-01T00:00:00.000Z",
      "end": "2024-03-31T23:59:59.999Z"
    },
    "summary": {
      "totalDays": 23,
      "workingDays": 20,
      "totalMembers": 50,
      "averageAttendance": 0.85
    },
    "metrics": {
      "present": 850,
      "absent": 150,
      "attendanceRate": 0.85,
      "absenteeRate": 0.15
    },
    "trends": {
      "daily": [
        {
          "date": "2024-03-01",
          "present": 45,
          "absent": 5,
          "rate": 0.9
        }
      ],
      "weekly": [
        {
          "week": 10,
          "present": 225,
          "absent": 25,
          "rate": 0.9
        }
      ]
    }
  }
}
```

### Get Attendance Trends

```http
GET /api/analytics/trends
Authorization: Bearer <token>
```

Get detailed attendance trends and patterns.

#### Query Parameters
- `startDate` (ISO date) - Start date
- `endDate` (ISO date) - End date
- `dayGroup` (string) - Filter by day group
- `timeframe` (number) - Analysis timeframe in days

#### Response
```json
{
  "status": "success",
  "data": {
    "trends": {
      "overall": {
        "trend": "improving",
        "changeRate": 0.05
      },
      "weekly": [
        {
          "week": "2024-W10",
          "average": 0.85,
          "trend": "stable"
        }
      ],
      "patterns": {
        "bestDay": "Monday",
        "worstDay": "Friday",
        "consistency": 0.8
      }
    },
    "predictions": {
      "nextWeek": {
        "expected": 0.87,
        "confidence": 0.9
      }
    }
  }
}
```

### Export Attendance Data

```http
GET /api/analytics/export
Authorization: Bearer <token>
```

Export attendance data in various formats.

#### Query Parameters
- `startDate` (ISO date) - Start date
- `endDate` (ISO date) - End date
- `format` (string) - Export format (csv, pdf)
- `dayGroup` (string) - Filter by day group
- `includeMetrics` (boolean) - Include analytics metrics

#### Response
```http
Content-Type: text/csv
Content-Disposition: attachment; filename=attendance-2024-03.csv

Date,Name,Status,Notes
2024-03-01,John Doe,present,On time
2024-03-01,Jane Smith,absent,Sick leave
```

### Generate Reports

```http
GET /api/analytics/reports
Authorization: Bearer <token>
```

Generate detailed attendance reports.

#### Query Parameters
- `startDate` (ISO date) - Start date
- `endDate` (ISO date) - End date
- `type` (string) - Report type (summary, detailed, trends)
- `format` (string) - Report format (pdf, excel)

#### Response
```json
{
  "status": "success",
  "data": {
    "reportUrl": "https://storage.example.com/reports/attendance-2024-03.pdf",
    "metadata": {
      "type": "summary",
      "period": "March 2024",
      "generated": "2024-03-31T23:59:59.999Z"
    }
  }
}
```

## Analytics Metrics

### Basic Metrics
- Total attendance days
- Working days
- Present count
- Absent count
- Attendance rate
- Absentee rate

### Advanced Metrics
- Attendance trends
- Pattern analysis
- Consistency scores
- Prediction models
- Comparative analysis

### Custom Metrics
- Day group analysis
- Team comparisons
- Individual trends
- Historical patterns

## Report Types

### Summary Report
- Overall attendance rates
- Group summaries
- Key metrics
- Trend indicators

### Detailed Report
- Individual records
- Daily breakdowns
- Notes and comments
- Audit trails

### Trends Report
- Pattern analysis
- Predictive metrics
- Comparative data
- Graphical representations

## Data Formats

### CSV Format
```csv
Date,User ID,Name,Status,Notes
2024-03-01,123,John Doe,present,On time
2024-03-01,124,Jane Smith,absent,Sick leave
```

### Excel Format
- Multiple sheets
- Formatted tables
- Charts and graphs
- Pivot tables

### PDF Format
- Professional layout
- Charts and graphs
- Summary tables
- Header/footer

## Error Responses

### Invalid Date Range
```json
{
  "status": "error",
  "message": "Validation Error",
  "errors": {
    "dateRange": "Invalid date range or exceeds maximum period"
  }
}
```

### Export Error
```json
{
  "status": "error",
  "message": "Export failed",
  "errors": {
    "reason": "Unsupported export format"
  }
}
```

### Report Generation Error
```json
{
  "status": "error",
  "message": "Report generation failed",
  "errors": {
    "reason": "Insufficient data for analysis"
  }
}
```

## Best Practices

1. **Data Analysis**
   - Use appropriate time ranges
   - Consider timezone differences
   - Handle missing data
   - Validate input parameters

2. **Performance**
   - Cache frequent reports
   - Use background processing
   - Implement data aggregation
   - Optimize queries

3. **Export Handling**
   - Stream large files
   - Set appropriate timeouts
   - Handle memory efficiently
   - Provide progress updates

## Examples

### Get Monthly Analytics
```http
GET /api/analytics/attendance?startDate=2024-03-01&endDate=2024-03-31&groupBy=week
Authorization: Bearer <token>
```

### Export Custom Report
```http
GET /api/analytics/export?startDate=2024-03-01&endDate=2024-03-31&format=pdf&includeMetrics=true
Authorization: Bearer <token>
```

### Get Predictive Trends
```http
GET /api/analytics/trends?startDate=2024-01-01&endDate=2024-03-31&timeframe=90
Authorization: Bearer <token>
```

## Security Considerations

1. **Data Access**
   - Role-based access control
   - Data filtering by permission
   - Audit logging
   - Rate limiting

2. **Export Security**
   - File size limits
   - Format validation
   - Secure file storage
   - Download expiration

3. **Report Security**
   - Data anonymization
   - Access controls
   - Secure delivery
   - Audit trails 