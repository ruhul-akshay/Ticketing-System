import jwt         from 'jsonwebtoken';
import ClientUser   from '../models/ClientUser.js';
import { logger }   from '../utils/logger.js';
import { AppError } from '../utils/AppError.js';

/* ─────────────────────────────────────────────────────────────────────────────
   authenticate — Verifies the Bearer JWT, loads the user from DB, and
   attaches them to req.user.  Calls next(AppError) on any failure so the
   centralised error handler can respond correctly.
   ───────────────────────────────────────────────────────────────────────────── */
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.slice(7)   // more efficient than .replace()
      : null;

    if (!token) {
      return next(new AppError('Authentication required. Please log in again.', 401));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded?.userId) {
      return next(new AppError('Invalid session. Please log in again.', 401));
    }

    const user = await ClientUser.findById(decoded.userId).populate('department');

    if (!user) {
      return next(new AppError('User not found. Please log in again.', 401));
    }

    if (user.status === 'suspended') {
      return next(new AppError('Your account has been suspended. Please contact the administrator.', 403));
    }

    if (user.status === 'frozen') {
      return next(new AppError('Your account has been frozen. Please contact the administrator.', 403));
    }

    req.user = user;

    logger.debug('Auth OK', {
      email:      user.email,
      role:       user.role,
      department: user.department?.name ?? 'none',
      status:     user.status,
      requestId:  req.id,
    });

    next();
  } catch (error) {
    // jwt.verify throws JsonWebTokenError / TokenExpiredError — let the
    // central error handler map those to proper 401 responses.
    logger.warn(`Auth failed: ${error.message}`, { requestId: req.id });
    next(error);
  }
};

/* ─────────────────────────────────────────────────────────────────────────────
   authorize — Role-based access control gate.
   Pass the allowed roles as arguments:  authorize('superadmin', 'consultant')
   ───────────────────────────────────────────────────────────────────────────── */
export const authorize = (...roles) => (req, res, next) => {
  const normalised = roles.map((r) => {
    const lr = r.toLowerCase();
    return lr === 'admin' ? 'consultant' : lr;
  });

  const userRole = req.user?.role?.toLowerCase() ?? '';

  if (!req.user || !normalised.includes(userRole)) {
    return next(new AppError('You do not have permission to perform this action.', 403));
  }

  // Block non-primary client users from performing manager-level operations
  if (userRole === 'clientuser' && !req.user.isPrimaryContact) {
    return next(
      new AppError('Access denied. Only the primary client account can manage the team.', 403)
    );
  }

  next();
};
