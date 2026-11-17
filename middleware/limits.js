const rateLimit = require('express-rate-limit');

const make = (windowMs, limit) =>
  rateLimit({ windowMs, limit, standardHeaders: true, legacyHeaders: false, message: { message: 'Too many requests, try again later' } });

module.exports = {
  authLimiter: make(15 * 60 * 1000, 30),
  feedbackLimiter: make(60 * 60 * 1000, 20),
  eventLimiter: make(15 * 60 * 1000, 300),
};
