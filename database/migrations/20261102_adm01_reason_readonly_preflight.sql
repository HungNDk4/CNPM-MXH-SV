-- ADM-01 READ-ONLY TiDB/MySQL preflight. No DDL/DML or stored procedures.
-- Connect explicitly to the intended cluster/database using the database console.
-- Stop if connected_database is not the approved project DB.
SELECT DATABASE() AS connected_database, VERSION() AS engine_version;
SELECT TABLE_NAME, ENGINE
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME IN ('users','posts','moderation_audit_logs')
ORDER BY TABLE_NAME;
SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT, ORDINAL_POSITION
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'moderation_audit_logs'
ORDER BY ORDINAL_POSITION;
SELECT CASE WHEN COUNT(*) = 0 THEN 'MISSING_REASON__MIGRATION_REQUIRED'
            WHEN COUNT(*) = 1 THEN 'REASON_PRESENT__VERIFY_TYPE_AND_SKIP_ALTER'
            ELSE 'UNEXPECTED_SCHEMA__STOP' END AS migration_state
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'moderation_audit_logs'
  AND COLUMN_NAME = 'reason';
-- Run the following only if moderation_audit_logs is present:
-- SELECT COUNT(*) AS audit_row_count FROM moderation_audit_logs;
-- SHOW CREATE TABLE moderation_audit_logs;
