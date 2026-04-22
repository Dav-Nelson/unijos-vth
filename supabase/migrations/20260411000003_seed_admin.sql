-- =============================================================================
-- Migration: 003 — Seed Admin User
-- =============================================================================
-- Run this in: Supabase Dashboard → SQL Editor → New query → Run
-- Run AFTER creating the auth user in Authentication → Users.
-- =============================================================================

INSERT INTO users (id, full_name, role, clinic_id, must_change_password)
VALUES (
  '95590ffe-d450-446a-9d24-40ace25f8111',
  'System Administrator',
  'ADMIN',
  NULL,   -- ADMIN has no clinic scope
  TRUE    -- forced password change on first login
);
