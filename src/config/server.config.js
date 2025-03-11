import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const config = {
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 5000,
  apiVersion: process.env.API_VERSION || 'v1',
  
  mongodb: {
    uri: process.env.MONGODB_URI,
    options: {
      minPoolSize: parseInt(process.env.MONGODB_MIN_POOL_SIZE || '5'),
      maxPoolSize: parseInt(process.env.MONGODB_MAX_POOL_SIZE || '10'),
    }
  },
  
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessExpiration: process.env.JWT_ACCESS_EXPIRATION || '15m',
    refreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '7d'
  },
  
  redis: {
    uri: process.env.REDIS_URI,
    password: process.env.REDIS_PASSWORD
  },
  
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '600000'),
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100')
  },
  
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    filePath: process.env.LOG_FILE_PATH || 'src/logs/app.log'
  },
  
  security: {
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '12')
  }
};

// Validate required configuration
const requiredConfigs = [
  'mongodb.uri',
  'jwt.accessSecret',
  'jwt.refreshSecret',
  'redis.uri'
];

for (const path of requiredConfigs) {
  const value = path.split('.').reduce((obj, key) => obj?.[key], config);
  if (!value) {
    throw new Error(`Missing required configuration: ${path}`);
  }
}

export default config; 