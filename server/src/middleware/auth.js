import jwt from 'jsonwebtoken';
import ClientUser from '../models/ClientUser.js';

export const authenticate = async (req, res, next) => {
  try {
    // ✅ Read Authorization header safely
    const authHeader = req.header('Authorization');
    const jwtToken = authHeader?.startsWith('Bearer ')
      ? authHeader.replace('Bearer ', '')
      : null;

    if (!jwtToken) {
      return res.status(401).json({
        message: 'Authentication required. Please login again.'
      });
    }

    // ✅ Verify JWT
    const decoded = jwt.verify(jwtToken, process.env.JWT_SECRET);

    if (!decoded?.userId) {
      return res.status(401).json({
        message: 'Invalid session. Please login again.'
      });
    }

    // ✅ Load user
    const user = await ClientUser.findById(decoded.userId).populate('department');

    if (!user) {
      return res.status(401).json({
        message: 'ClientUser not found. Please login again.'
      });
    }

    // ✅ Account status checks
    if (user.status === 'suspended') {
      return res.status(403).json({
        message: 'Your account has been suspended. Please contact administrator.'
      });
    }

    if (user.status === 'frozen') {
      return res.status(403).json({
        message: 'Your account has been frozen. Please contact administrator.'
      });
    }

    // ✅ Attach user to request
    req.user = user;

    // 🔍 Optional debug log (safe)
    console.log('AUTH OK:', {
      email: user.email,
      role: user.role,
      department: user.department?.name || 'none',
      status: user.status
    });

    next();
  } catch (error) {
    console.error('AUTH ERROR:', error.message);
    return res.status(401).json({
      message: 'Session expired or invalid. Please login again.'
    });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    const lowerRoles = roles.map(r => {
      const lr = r.toLowerCase();
      return lr === 'admin' ? 'consultant' : lr;
    });
    const userRole = req.user?.role?.toLowerCase() || '';
    if (!req.user || !lowerRoles.includes(userRole)) {
      return res.status(403).json({
        message: 'You do not have permission to perform this action.'
      });
    }
    next();
  };
};
