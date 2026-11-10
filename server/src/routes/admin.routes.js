'use strict';

const router = require('express').Router();
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { listReports, handleReport } = require('../controllers/report.controller');

// Admin Reports Queue
router.get('/reports', authenticate, authorize('admin'), listReports);
router.patch('/reports/:id', authenticate, authorize('admin'), handleReport);

module.exports = router;

