'use strict';
const router = require('express').Router();
const multer = require('multer');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { createError } = require('../middlewares/error.middleware');
const { uploadDocument } = require('../controllers/document.controller');

const MAX_PDF_BYTES = 10 * 1024 * 1024;
const parser = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_PDF_BYTES, files: 1, fields: 4, parts: 5,
    fieldSize: 6 * 1024, fieldNameSize: 50,
  },
}).single('file');

function parseUpload(req, res, next) {
  parser(req, res, error => {
    if (!error) return next();
    if (error.code === 'LIMIT_FILE_SIZE') return next(createError('PDF vượt quá 10 MiB.', 413));
    if (error instanceof multer.MulterError) return next(createError('Multipart không hợp lệ: ' + error.code, 422));
    return next(error);
  });
}

router.post('/', authenticate, authorize('student'), parseUpload, uploadDocument);

module.exports = router;
