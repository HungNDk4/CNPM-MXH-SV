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

const { errorHandler } = require('./middlewares/error.middleware');

const app = express();

// ─── Security Middlewares ────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));

// ─── Rate Limiting ───────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 100,
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

// Only serve the compiled SPA from the reviewed production preview.
// /api/* routes precede this fallback; no source, DB or PDFs are static.
if (process.env.NODE_ENV === 'production' && process.env.SERVE_CLIENT_DIST === 'true') {
  const path = require('node:path');
  const dist = path.resolve(__dirname, '../../client/dist');
  app.use(express.static(dist, { index: false, dotfiles: 'deny' }));
  app.get('*', (req, res, next) => {
    if (req.path === '/api' || req.path.startsWith('/api/') ||
        req.path === '/uploads' || req.path.startsWith('/uploads/') ||
        req.path === '/private-documents' || req.path.startsWith('/private-documents/')) return next();
    res.sendFile(path.join(dist, 'index.html'), err => {
      if (err) next(err);
    });
  });
}

// ─── 404 Handler ─────────────────────────────────────────────────
app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: 'Route không tồn tại.' });
});

// ─── Global Error Handler ────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
