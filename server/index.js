// ======================= ENV =======================
import dotenv from 'dotenv';
dotenv.config();

// ======================= IMPORTS =======================
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import chalk from 'chalk';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import compression from 'compression';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

// ======================= ROUTES =======================
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import departmentRoutes from './routes/departments/department.routes.js';
import dashboardRoutes from './routes/dashboard.js';
import adminProfileRoutes from './routes/adminProfiles.js';
import adminStatsRoutes from './routes/adminStats.js';
import companyRoutes from './routes/companies.js';
import ticketRoutes from './routes/tickets/index.js';
import timeTrackingRoutes from './routes/timeTracking.js';
import notificationRoutes from './routes/notifications/notification.routes.js';

// ======================= DIR SETUP =======================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, 'uploads');

const ensureUploadsDir = async () => {
  try {
    await fs.mkdir(uploadsDir, { recursive: true });
    console.log(chalk.blue('📁 Uploads directory ready'));
  } catch (err) {
    console.error('Error creating uploads directory:', err);
  }
};

// ======================= APP =======================
const app = express();
const PORT = process.env.PORT || 5000;

// ======================= TRUST PROXY (IMPORTANT FOR HOSTING) =======================
app.set('trust proxy', 1);

// ======================= SECURITY =======================
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// ======================= CORS FIX =======================

// ✅ Allowed frontend origins
const allowedOrigins = [
  'http://ticketing.akshay.com',
  'https://ticketing.akshay.com',
  'http://localhost:5173', // optional for dev
];

// ✅ Dynamic CORS config
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // allow mobile apps / curl

    if (allowedOrigins.includes(origin)) {
      return callback(null, origin); // MUST return exact origin
    }

    return callback(new Error(`CORS not allowed for ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

// ✅ Apply CORS BEFORE everything
app.use(cors(corsOptions));

// ✅ Handle preflight requests (CRITICAL FIX)
app.options('*', cors(corsOptions));

// ======================= RATE LIMIT =======================
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
});
app.use(limiter);

// ======================= MIDDLEWARE =======================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());
app.use(mongoSanitize());
app.use(hpp());
app.use(compression());
app.use(morgan('dev'));

// ======================= STATIC =======================
app.use('/uploads', express.static(uploadsDir));

// ======================= HEALTH =======================
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    time: new Date(),
  });
});

app.get('/ping', (req, res) => {
  res.send('pong');
});

// ======================= ROUTES =======================
app.use('/api/auth', authRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/users', userRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin-profiles', adminProfileRoutes);
app.use('/api/admin-stats', adminStatsRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/time-tracking', timeTrackingRoutes);
app.use('/api/notifications', notificationRoutes);

// ======================= 404 =======================
app.all('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// ======================= ERROR =======================
app.use((err, req, res, next) => {
  console.error(chalk.red('💥 Error:'), err.message);

  // ✅ Ensure CORS headers still sent on error
  if (req.headers.origin && allowedOrigins.includes(req.headers.origin)) {
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// ======================= SERVER =======================
const startServer = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is required');
    }

    await ensureUploadsDir();
    await mongoose.connect(process.env.MONGODB_URI);

    console.log(chalk.green('✓ MongoDB Connected'));

    app.listen(PORT, () => {
      console.log(chalk.green(`🚀 Server running on http://localhost:${PORT}`));
    });
  } catch (err) {
    console.error(chalk.red('❌ Startup failed:'), err);
    process.exit(1);
  }
};

// ======================= SHUTDOWN =======================
process.on('SIGINT', async () => {
  console.log(chalk.yellow('Shutting down...'));
  await mongoose.connection.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await mongoose.connection.close();
  process.exit(0);
});

// ======================= START =======================
startServer();

export default app;