-- ADM-01: additive audit reason field for previously initialized MySQL8 database.
-- Apply ONCE to a verified database with moderation_audit_logs existing.
-- Do not apply blindly to a shared or production database. See docs/ADM01_BACKEND_CONTRACT.md.
USE mini_study_network;
ALTER TABLE moderation_audit_logs
  ADD COLUMN reason VARCHAR(500) NULL AFTER new_status;
