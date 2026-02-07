import rateLimit from "express-rate-limit";

const MINUTE = 60 * 1000;

export const apiLimiter = rateLimit({
  windowMs: 15 * MINUTE,
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later" },
});

export const writeLimiter = rateLimit({
  windowMs: 15 * MINUTE,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later" },
});
