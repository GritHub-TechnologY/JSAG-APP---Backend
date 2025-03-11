# Getting Started

This guide will help you set up and run the Attendance Management System on your local machine.

## Prerequisites

Before you begin, ensure you have the following installed:

1. **Node.js and npm**
   - Node.js version 14.x or higher
   - npm version 6.x or higher
   ```bash
   # Check versions
   node --version
   npm --version
   ```

2. **MongoDB**
   - MongoDB version 4.4 or higher
   - MongoDB Compass (optional, for GUI)
   ```bash
   # Check version
   mongod --version
   ```

3. **Git**
   ```bash
   # Check version
   git --version
   ```

## Installation Steps

1. **Clone the Repository**
   ```bash
   git clone https://github.com/your-org/attendance-system.git
   cd attendance-system
   ```

2. **Install Dependencies**
   ```bash
   # Using npm
   npm install

   # Using yarn
   yarn install
   ```

3. **Environment Setup**
   ```bash
   # Copy example environment file
   cp .env.example .env

   # Edit .env file with your configuration
   nano .env
   ```

4. **Database Setup**
   ```bash
   # Start MongoDB service
   sudo service mongod start

   # Run database migrations
   npm run migrate
   ```

5. **Start Development Server**
   ```bash
   # Start in development mode
   npm run dev

   # Start in production mode
   npm start
   ```

## Configuration

### Environment Variables

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/attendance_db

# JWT Configuration
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=1d
JWT_REFRESH_EXPIRES_IN=7d

# Crypto Configuration
CRYPTO_KEY=your-crypto-key
CRYPTO_ALGORITHM=aes-256-cbc

# Email Configuration (optional)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-email
SMTP_PASS=your-password
```

### Available Scripts

```bash
# Development
npm run dev         # Start development server
npm run watch       # Start with hot reload

# Testing
npm test           # Run all tests
npm run test:watch # Run tests in watch mode
npm run test:coverage # Run tests with coverage

# Building
npm run build      # Build for production
npm start          # Start production server

# Database
npm run migrate    # Run database migrations
npm run seed       # Seed database with sample data

# Documentation
npm run docs       # Generate API documentation
```

## Project Structure

```
attendance-system/
├── src/
│   ├── config/        # Configuration files
│   ├── controllers/   # Request handlers
│   ├── models/        # Database models
│   ├── routes/        # API routes
│   ├── services/      # Business logic
│   ├── utils/         # Utility functions
│   ├── validators/    # Request validators
│   └── app.js         # Application entry point
├── tests/            # Test files
├── docs/             # Documentation
├── logs/             # Application logs
├── public/           # Static files
└── package.json      # Project metadata
```

## Basic Usage

### Creating a User

```javascript
// Using the API
fetch('/api/users', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer your-token'
  },
  body: JSON.stringify({
    name: 'John Doe',
    email: 'john@example.com',
    password: 'SecurePass123!',
    dayGroup: 'Monday',
    role: 'member'
  })
});
```

### Marking Attendance

```javascript
// Using the API
fetch('/api/attendance', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer your-token'
  },
  body: JSON.stringify({
    userId: 'user-id',
    date: new Date(),
    status: 'present'
  })
});
```

### Getting Analytics

```javascript
// Using the API
fetch('/api/analytics/attendance?startDate=2024-01-01&endDate=2024-03-31&dayGroup=Monday', {
  headers: {
    'Authorization': 'Bearer your-token'
  }
});
```

## Troubleshooting

### Common Issues

1. **MongoDB Connection Failed**
   ```bash
   # Check if MongoDB is running
   sudo service mongod status

   # Start MongoDB if not running
   sudo service mongod start
   ```

2. **Port Already in Use**
   ```bash
   # Find process using port
   lsof -i :3000

   # Kill process
   kill -9 <PID>
   ```

3. **JWT Token Issues**
   - Check if JWT_SECRET is properly set in .env
   - Verify token expiration time
   - Clear browser cookies/storage

### Getting Help

1. Check the [documentation](../README.md)
2. Search [existing issues](https://github.com/your-org/attendance-system/issues)
3. Create a new issue with:
   - Environment details
   - Steps to reproduce
   - Expected vs actual behavior
   - Error messages/logs

## Next Steps

1. Read the [Architecture Overview](../architecture/README.md)
2. Explore [API Documentation](../api/README.md)
3. Review [Security Guidelines](../security/README.md)
4. Check [Development Guide](../development/README.md) 