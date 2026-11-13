'use strict';

const router = require('express').Router();
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { listReports, handleReport } = require('../controllers/report.controller');
const { listAccounts, setAccountStatus, listAccountAudit } = require('../controllers/account-moderation.controller');

// ADM-02: account moderation. Auth middleware checks active JWT users on every call.
router.get('/users', authenticate, authorize('admin'), listAccounts);
router.patch('/users/:id/status', authenticate, authorize('admin'), setAccountStatus);
router.get('/users/audit-logs', authenticate, authorize('admin'), listAccountAudit);

// Admin Reports Queue
router.get('/reports', authenticate, authorize('admin'), listReports);
router.patch('/reports/:id', authenticate, authorize('admin'), handleReport);

module.exports = router;

