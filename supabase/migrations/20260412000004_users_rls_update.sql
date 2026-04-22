-- =============================================================================
-- Migration: 004 — Users RLS Update Policy
-- =============================================================================
-- Adds an UPDATE policy so authenticated users can clear their own
-- must_change_password flag after changing their password.
--
-- Migration 001 only created a SELECT policy on users. Without an UPDATE
-- policy, supabase.from('users').update(...) is silently blocked by RLS.
-- =============================================================================

CREATE POLICY users_update_own ON users
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());
