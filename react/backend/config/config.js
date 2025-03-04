require('dotenv').config();

module.exports = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/avaass',
  jwtSecret: process.env.JWT_SECRET || 'your_jwt_secret_key_here',
  jwtExpire: process.env.JWT_EXPIRE || '30d',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
  
  // Email configuration
  emailService: process.env.EMAIL_SERVICE || 'gmail',
  emailUsername: process.env.EMAIL_USERNAME,
  emailPassword: process.env.EMAIL_PASSWORD,
  emailFrom: process.env.EMAIL_FROM || 'noreply@avaass.com',
  
  // Whisper configuration
  whisperModel: process.env.WHISPER_MODEL || 'medium',
  whisperLanguage: process.env.WHISPER_LANGUAGE || 'auto',
  whisperTranslate: process.env.WHISPER_TRANSLATE === 'true',
  
  // File paths
  uploadDir: process.env.UPLOAD_DIR || '../shared/uploads',
  publicDir: process.env.PUBLIC_DIR || '../shared/public',
  profilesDir: process.env.PROFILES_DIR || '../shared/profiles',
  tempDir: process.env.TEMP_DIR || '../shared/temp',
};
