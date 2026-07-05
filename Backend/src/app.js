import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
import config from './config/index.js';
import { globalLimiter } from './middleware/rateLimiter.js';
import errorHandler from './middleware/errorHandler.js';
import AppError from './utils/AppError.js';
import path from 'path';

// Route imports
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import conversationRoutes from './routes/conversationRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import keyRoutes from './routes/keyRoutes.js';

const app = express();

// --- Security Middleware ---

// Set security HTTP headers
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: config.clientUrl,
    credentials: true,
  })
);

// Rate limiting on all API routes
app.use('/api', globalLimiter);

// --- Body Parsing ---

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(express.static('./public'));

// --- Data Sanitization ---

// Redefine req.query as writable for Express 5 compatibility with express-mongo-sanitize
app.use((req, res, next) => {
  Object.defineProperty(req, 'query', {
    value: { ...req.query },
    writable: true,
    configurable: true,
    enumerable: true,
  });
  next();
});

// Prevent NoSQL injection attacks
app.use(mongoSanitize());

// Prevent HTTP parameter pollution
app.use(hpp());

// --- Performance ---

app.use(compression());

// --- Logging ---

if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
}

// --- Health Check ---

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// --- API Routes ---

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/keys', keyRoutes);

// --- 404 Handler ---

// API-only 404
app.all('/api/*path', (req, res, next) => {
  next(new AppError(`Route ${req.originalUrl} not found`, 404));
});

// React SPA fallback
app.get('/*path', (req, res) => {
  res.sendFile(path.resolve('public/index.html'));
});

// --- Global Error Handler ---

app.use(errorHandler);

export default app;
