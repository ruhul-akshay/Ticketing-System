import express        from 'express';
import cors           from 'cors';
import cookieParser   from 'cookie-parser';
import morgan         from 'morgan';
import rateLimit      from 'express-rate-limit';
import helmet         from 'helmet';
import compression    from 'compression';
import mongoSanitize  from 'express-mongo-sanitize';
import hpp            from 'hpp';
import path           from 'path';
import { fileURLToPath } from 'url';

import router               from './routes/index.js';
import { requestId }        from './middleware/requestId.js';
import { errorHandler, notFound } from './middleware/error.js';
import { stream }           from './utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

export const rootDir    = path.join(__dirname, '..');
export const uploadsDir = path.join(rootDir, 'uploads');

const app = express();

// ── Request ID ───────────────────────────────────────────────────────────────
// Assign a unique ID to every request so it can be correlated across logs.
app.use(requestId);

// ── CORS ─────────────────────────────────────────────────────────────────────
const corsOptions = {
  origin: (origin, cb) => cb(null, true),   // Allow all origins (credentials support)
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
  allowedHeaders: ['*'],
  exposedHeaders: ['*'],
  optionsSuccessStatus: 200,   // Return 200 OK for preflight OPTIONS to prevent proxies from stripping CORS headers
  maxAge: 86400,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// ── Explicit CORS Safety Net ──────────────────────────────────────────────────
// Force Access-Control-Allow-Origin header on EVERY response, including
// preflight OPTIONS. This is needed when Easypanel / reverse-proxy strips the
// cors() middleware headers before they reach the browser.
app.use((req, res, next) => {
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS,HEAD');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Request-Id'
  );
  res.setHeader('Access-Control-Max-Age', '86400');

  // Respond immediately to preflight requests so they never reach Helmet/routes
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// ── Trust Proxy ───────────────────────────────────────────────────────────────
app.set('trust proxy', 1);

// ── Security Headers ──────────────────────────────────────────────────────────
// crossOriginResourcePolicy cross-origin keeps Helmet from blocking cross-origin responses
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  // Disable contentSecurityPolicy to prevent it from blocking API calls in development
  contentSecurityPolicy: false,
}));

// ── Rate Limiting ─────────────────────────────────────────────────────────────
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,   // 15 minutes
    max:      300,
    skip:     (req) => req.method === 'OPTIONS',
    standardHeaders: true,
    legacyHeaders:   false,
  })
);

// ── Body Parsing & Security ───────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(mongoSanitize());   // Sanitize MongoDB operator injection
app.use(hpp());             // Prevent HTTP Parameter Pollution
app.use(compression());

// ── HTTP Request Logging (via Winston stream) ─────────────────────────────────
app.use(morgan('combined', { stream }));

// ── Static Files ──────────────────────────────────────────────────────────────
app.use('/uploads', express.static(uploadsDir));

// ── Health / Utility Endpoints ────────────────────────────────────────────────
app.get('/', (_req, res) => res.status(200).send('OK'));
app.get('/ping', (_req, res) => res.send('pong'));
app.get('/api/health', (_req, res) =>
  res.json({ status: 'ok', time: new Date().toISOString() })
);

// ── Application Routes ────────────────────────────────────────────────────────
app.use('/api', router);

// ── 404 Handler ───────────────────────────────────────────────────────────────
// Must come after all routes so only truly unmatched requests reach it.
app.use(notFound);

// ── Centralised Error Handler ─────────────────────────────────────────────────
// Must be the last middleware — Express identifies error middleware by its 4-arg signature.
app.use(errorHandler);

export default app;
