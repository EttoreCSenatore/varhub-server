const { jwtVerify, SignJWT } = require('jose');

const secret = () => {
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is not set');
  return new TextEncoder().encode(process.env.JWT_SECRET);
};

// Issues a 24h HS256 token carrying { userId }.
const signToken = (userId) =>
  new SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(secret());

const readToken = (req) => {
  const [scheme, token] = (req.headers.authorization || '').split(' ');
  return scheme === 'Bearer' && token ? token : null;
};

const verify = async (token) => (await jwtVerify(token, secret(), { algorithms: ['HS256'] })).payload;

// Rejects the request unless it carries a valid JWT; sets req.user = { userId }.
async function requireAuth(req, res, next) {
  const token = readToken(req);
  if (!token) return res.status(401).json({ message: 'Authentication required' });
  try {
    req.user = await verify(token);
    return next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

// Sets req.user when a valid token is present, but never rejects.
async function optionalAuth(req, res, next) {
  const token = readToken(req);
  if (token) {
    try { req.user = await verify(token); } catch { /* anonymous */ }
  }
  next();
}

module.exports = { requireAuth, optionalAuth, signToken };
