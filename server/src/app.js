const path = require('path');
const fs = require('node:fs');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const authRoutes    = require('./routes/auth.routes');
const userRoutes    = require('./routes/user.routes');
const postRoutes    = require('./routes/post.routes');
const documentRoutes = require('./routes/document.routes');
const commentRoutes = require('./routes/comment.routes');
const likeRoutes    = require('./routes/like.routes');
const adminRoutes   = require('./routes/admin.routes');

const { errorHandler } = require('./middlewares/error.middleware');

const app = express();

// ─── Security Middlewares ────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));

// ─── Rate Limiting ───────────────────────────────────────────────
// Preserve production limit. More requests are allowed ONLY on the
// explicitly disposable GitHub Actions Chromium harness (single localhost IP).
const isolatedChromiumCI =
  process.env.GITHUB_ACTIONS === 'true' &&
  Boolean(process.env.RUNNER_TEMP) &&
  process.env.NODE_ENV === 'test' &&
  process.env.E2E_DISPOSABLE_DB === 'true' &&
  process.env.DB_AUTO_SYNC === 'false' &&
  process.env.DB_HOST === '127.0.0.1' &&
  process.env.DB_NAME === 'mini_study_network' &&
  process.env.FE74_CI_RATE_LIMIT === 'EXPLICIT_DISPOSABLE_E2E_ONLY';
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: isolatedChromiumCI ? 1000 : (process.env.NODE_ENV === 'development' ? 1000 : 100),
  message: { success: false, message: 'Quá nhiều request, vui lòng thử lại sau.' },
});
app.use('/api/', limiter);

// ─── Body Parsers ────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Logging ─────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// ─── Static Files (uploads) ──────────────────────────────────────
// No public static mount for protected PDFs (SEC-01).
// Public post illustrations only (SEC-01 safe: images only, no PDFs).
app.use('/uploads/post-images', express.static(path.join(__dirname, '../uploads/post-images'), {
  dotfiles: 'ignore',
  index: false,
  maxAge: '1d',
}));
app.use('/uploads/avatars', express.static(path.join(__dirname, '../uploads/avatars'), {
  dotfiles: 'ignore',
  index: false,
  maxAge: '7d',
}));

// ─── Health Check ────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'API is running 🚀', timestamp: new Date() });
});

// ─── Routes ──────────────────────────────────────────────────────
app.use('/api/auth',     authRoutes);
app.use('/api/users',    userRoutes);
app.use('/api/posts',    postRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/likes',    likeRoutes);
app.use('/api/admin',    adminRoutes);

// In the deployed release, Express serves the compiled React SPA on the same origin.
if (process.env.NODE_ENV === 'production') {
  const dist = path.resolve(__dirname, '../../client/dist');
  const indexFile = path.join(dist, 'index.html');
  if (!fs.existsSync(indexFile)) {
    throw new Error('Production frontend missing: build client/dist before starting Express.');
  }
  app.use(express.static(dist, { index: false, maxAge: '1h' }));
  app.get(/^\/(?!api(?:\/|$)|uploads(?:\/|$)).*/, (req, res, next) => {
    if (path.extname(req.path)) return next();
    res.sendFile(indexFile);
  });
}

// ─── 404 Handler ─────────────────────────────────────────────────
app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: 'Route không tồn tại.' });
});

// ─── Global Error Handler ────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
