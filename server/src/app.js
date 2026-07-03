import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import compression from 'compression';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
import path from 'path';
import { fileURLToPath } from 'url';

// Central Router import
import router from './routes/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const rootDir = path.join(__dirname, '..');
export const uploadsDir = path.join(rootDir, 'uploads');

const app = express();

// ======================= TRUST PROXY =======================
app.set('trust proxy', 1);

// ======================= SECURITY =======================
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// ======================= CORS =======================
app.use((req, res, next) => {
  const allowedOrigins = [
    'http://ticketing.akshay.com',
    'https://ticketing.akshay.com',
    'http://localhost:5173',
    'http://localhost:3000'
  ];
  
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', 'http://ticketing.akshay.com');
  }
  
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, *');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// ======================= RATE LIMIT =======================
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
});
app.use(limiter);

// ======================= MIDDLEWARES =======================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(mongoSanitize());
app.use(hpp());
app.use(compression());
app.use(morgan('dev'));

// ======================= STATIC FILES =======================
app.use('/uploads', express.static(uploadsDir));

// ======================= HEALTH CHECK =======================
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    time: new Date(),
  });
});

app.get('/ping', (req, res) => {
  res.send('pong');
});

// ======================= ROUTING =======================
app.use('/api', router);

// ======================= 404 HANDLER =======================
app.all('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// ======================= GLOBAL ERROR HANDLER =======================
app.use((err, req, res, next) => {
  console.error('💥 Error:', err.message);

  if (req.headers.origin) {
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

export default app;
