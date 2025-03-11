# Attendance Management System API

A robust MERN stack attendance management system with advanced security features, role-based access control, and real-time analytics.

## Features

- 🔐 JWT Authentication with refresh token rotation
- 👥 Role-Based Access Control (RBAC)
- 📊 Real-time analytics with Redis caching
- 📝 Automated attendance processing
- 🔍 Comprehensive audit trails
- 📚 API documentation with Swagger/OpenAPI

## Prerequisites

- Node.js >= 18.0.0
- MongoDB Atlas account
- Redis server
- npm or yarn

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd attendance-management-system
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   ```bash
   cp .env.example .env
   ```
   Edit the `.env` file with your configuration values.

4. Start the development server:
   ```bash
   npm run dev
   ```

## API Documentation

Once the server is running, access the API documentation at:
```
http://localhost:5000/api/v1/docs
```

## Project Structure

```
src/
├── config/         # Configuration files
├── controllers/    # Route controllers
├── middleware/     # Custom middleware
├── models/        # Mongoose models
├── routes/        # API routes
├── services/      # Business logic
├── utils/         # Utility functions
├── validators/    # Request validators
└── logs/          # Application logs
```

## Available Scripts

- `npm start`: Start production server
- `npm run dev`: Start development server
- `npm test`: Run tests
- `npm run lint`: Run ESLint
- `npm run swagger-autogen`: Generate API documentation

## Security Features

- JWT token rotation
- Rate limiting
- CORS protection
- Helmet security headers
- Input validation
- Password hashing
- CSRF protection
- Audit logging

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the ISC License. 