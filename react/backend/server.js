const express = require('express');
const http = require('http');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const cookieParser = require('cookie-parser');
const config = require('./config/config');
const connectDB = require('./config/db');
const setupSpeechWebSocket = require('./websocket/speechSocket');

// Route imports
const authRoutes = require('./routes/authRoutes');
const ttsRoutes = require('./routes/ttsRoutes');

// Connect to MongoDB
connectDB();

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Set up WebSocket for speech
setupSpeechWebSocket(server);

// Middleware
app.use(cors({
  origin: config.clientUrl,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(morgan('dev'));

// Serve static files from the shared public directory
app.use('/public', express.static(path.join(__dirname, '..', 'shared', 'public')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/tts', ttsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: err.message || 'Something went wrong!',
    stack: config.nodeEnv === 'production' ? '🍰' : err.stack,
  });
});

// Start server
const PORT = config.port;
server.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════╗
║                                                    ║
║   AVAASS - Backend Server                          ║
║   Running on port ${PORT}                          ║
║   Environment: ${config.nodeEnv}                   ║
║                                                    ║
╚════════════════════════════════════════════════════╝
  `);
});

// Handle graceful shutdown
const shutdownGracefully = () => {
  console.log('Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
};

process.on('SIGTERM', shutdownGracefully);
process.on('SIGINT', shutdownGracefully);
