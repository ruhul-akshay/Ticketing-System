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

// ======================= CORS =======================
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow all origins dynamically (required for credentials: true)
      callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
    allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
    maxAge: 86400,
  })
);

// ======================= TRUST PROXY =======================
app.set('trust proxy', 1);

// ======================= SECURITY =======================
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// ======================= RATE LIMIT =======================
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  skip: (req) => req.method === 'OPTIONS',
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
app.get('/', (req, res) => {
  res.status(200).send('OK');
});

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
