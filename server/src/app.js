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

// ── Trust Proxy ───────────────────────────────────────────────────────────────
app.set('trust proxy', 1);

// ── Security Headers ──────────────────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

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
