const { jwtVerify, SignJWT } = require('jose');
const db = require('../db');
const { HttpError, asyncHandler } = require('../lib/http');

const secret = () => {
  const value = process.env.JWT_SECRET;
  if (!value || value.length < 16) throw new Error('JWT_SECRET must be set (16+ characters)');
  return new TextEncoder().encode(value);
};

// Issues a 24h HS256 token carrying { userId, role }.
const signToken = (user) =>
  new SignJWT({ userId: user.id, role: user.role })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(secret());

const readToken = (req) => {
  const [scheme, token] = (req.headers.authorization || '').split(' ');
  return scheme === 'Bearer' && token ? token : null;
};

const verify = async (token) => (await jwtVerify(token, secret(), { algorithms: ['HS256'] })).payload;

// Rejects the request unless it carries a valid JWT; sets req.user = { userId, role }.
const requireAuth = asyncHandler(async (req, res, next) => {
  const token = readToken(req);
  if (!token) throw new HttpError(401, 'Authentication required');
  try {
    req.user = await verify(token);
  } catch {
    throw new HttpError(401, 'Invalid or expired token');
  }
  next();
});

// Sets req.user when a valid token is present, but never rejects.
const optionalAuth = asyncHandler(async (req, res, next) => {
  const token = readToken(req);
  if (token) {
    try {
      req.user = await verify(token);
    } catch {
      /* treated as anonymous */
    }
  }
  next();
});

// Admin only. The role is re-read from the database so a demoted admin loses access immediately.
const requireAdmin = [
  requireAuth,
  asyncHandler(async (req, res, next) => {
    const { rows } = await db.query('SELECT role FROM users WHERE id = $1', [req.user.userId]);
    if (!rows[0] || rows[0].role !== 'admin') throw new HttpError(403, 'Admin access required');
    next();
  }),
];

module.exports = { requireAuth, optionalAuth, requireAdmin, signToken };
