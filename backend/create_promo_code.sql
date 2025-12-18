-- SQL script to create GOLDENKEY2025 promo code
-- Works for both SQLite (local) and PostgreSQL (production)

-- For SQLite (local development):
INSERT INTO promo_codes (code, type, max_uses, used_count, expires_at, is_active, created_at)
VALUES ('GOLDENKEY2025', 'unlimited_access', NULL, 0, NULL, 1, datetime('now'));

-- For PostgreSQL (production on Render):
-- Uncomment and use this version instead:
-- INSERT INTO promo_codes (code, type, max_uses, used_count, expires_at, is_active, created_at)
-- VALUES ('GOLDENKEY2025', 'unlimited_access', NULL, 0, NULL, true, NOW());



