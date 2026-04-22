-- =============================================================================
-- Migration: 002 — Appointments + Receptionist RLS Policies
-- =============================================================================
-- Run this in: Supabase Dashboard → SQL Editor → New query → Run
-- Run AFTER migration 001 (foundation schema).
-- =============================================================================


-- =============================================================================
-- SECTION 1: APPOINTMENTS TABLE
-- One row per visit slot (scheduled or walk-in).
-- case_id is NULL until CHECKED_IN — the case row is created at check-in.
-- =============================================================================

CREATE TABLE appointments (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id        uuid NOT NULL REFERENCES clinics(id),
  owner_id         uuid NOT NULL REFERENCES owners(id),
  case_id          uuid REFERENCES cases(id),         -- NULL until checked in
  assigned_vet_id  uuid REFERENCES users(id),          -- nullable
  created_by       uuid NOT NULL REFERENCES users(id), -- receptionist who booked
  scheduled_at     timestamptz NOT NULL,
  status           text NOT NULL DEFAULT 'SCHEDULED',
  chief_complaint  text NOT NULL,
  notes            text,
  created_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE appointments ADD CONSTRAINT appointments_status_valid CHECK (
  status IN ('SCHEDULED', 'CHECKED_IN', 'IN_PROGRESS', 'COMPLETED', 'NO_SHOW', 'CANCELLED')
);

-- Walk-ins: created directly in CHECKED_IN status (scheduled_at = now())
-- Scheduled: start in SCHEDULED status

-- Index for the daily queue query (plan §Performance Requirements)
-- Note: index scheduled_at directly (no cast) — timestamptz→date cast is not IMMUTABLE
-- in PostgreSQL because it depends on timezone. Query filters with a date range instead.
CREATE INDEX idx_appointments_clinic_date
  ON appointments (clinic_id, scheduled_at);

CREATE INDEX idx_appointments_status
  ON appointments (status);


-- =============================================================================
-- SECTION 2: RLS — APPOINTMENTS
-- Receptionist sees only their clinic's appointments.
-- =============================================================================

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Helper: extract clinic_id from JWT app_metadata
-- Usage: get_my_clinic_id() → uuid or null (for admin/system-wide roles)
CREATE OR REPLACE FUNCTION get_my_clinic_id()
RETURNS uuid AS $$
  SELECT (auth.jwt() -> 'app_metadata' ->> 'clinic_id')::uuid;
$$ LANGUAGE sql STABLE;

-- Helper: extract role from JWT app_metadata
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS text AS $$
  SELECT auth.jwt() -> 'app_metadata' ->> 'role';
$$ LANGUAGE sql STABLE;

-- Receptionist: read appointments for their clinic only
CREATE POLICY appointments_receptionist_select ON appointments
  FOR SELECT TO authenticated
  USING (
    get_my_role() = 'RECEPTIONIST'
    AND clinic_id = get_my_clinic_id()
  );

-- Receptionist: create appointments for their clinic only
CREATE POLICY appointments_receptionist_insert ON appointments
  FOR INSERT TO authenticated
  WITH CHECK (
    get_my_role() = 'RECEPTIONIST'
    AND clinic_id = get_my_clinic_id()
  );

-- Receptionist: update appointments for their clinic only
-- (status changes: SCHEDULED→CHECKED_IN, marking NO_SHOW, CANCELLED)
CREATE POLICY appointments_receptionist_update ON appointments
  FOR UPDATE TO authenticated
  USING (
    get_my_role() = 'RECEPTIONIST'
    AND clinic_id = get_my_clinic_id()
  );

-- Admin: full access to all appointments
CREATE POLICY appointments_admin_all ON appointments
  FOR ALL TO authenticated
  USING (get_my_role() = 'ADMIN');


-- =============================================================================
-- SECTION 3: RLS — OWNERS
-- Receptionist can create and search owners.
-- Admin has full access.
-- =============================================================================

-- Receptionist: read any owner (needed for phone-search deduplication)
CREATE POLICY owners_receptionist_select ON owners
  FOR SELECT TO authenticated
  USING (get_my_role() IN ('RECEPTIONIST', 'ADMIN'));

-- Receptionist: create new owners
CREATE POLICY owners_receptionist_insert ON owners
  FOR INSERT TO authenticated
  WITH CHECK (get_my_role() = 'RECEPTIONIST');

-- Admin: full access
CREATE POLICY owners_admin_all ON owners
  FOR ALL TO authenticated
  USING (get_my_role() = 'ADMIN');


-- =============================================================================
-- SECTION 4: RLS — CASES
-- Receptionist can create and read cases for their clinic.
-- =============================================================================

CREATE POLICY cases_receptionist_select ON cases
  FOR SELECT TO authenticated
  USING (
    get_my_role() = 'RECEPTIONIST'
    AND clinic_id = get_my_clinic_id()
  );

CREATE POLICY cases_receptionist_insert ON cases
  FOR INSERT TO authenticated
  WITH CHECK (
    get_my_role() = 'RECEPTIONIST'
    AND clinic_id = get_my_clinic_id()
  );

CREATE POLICY cases_admin_all ON cases
  FOR ALL TO authenticated
  USING (get_my_role() = 'ADMIN');


-- =============================================================================
-- SECTION 5: RLS — PATIENT DETAIL TABLES
-- Follows same pattern as cases.
-- =============================================================================

CREATE POLICY individual_patients_receptionist_select ON individual_patients
  FOR SELECT TO authenticated
  USING (
    get_my_role() IN ('RECEPTIONIST', 'ADMIN')
  );

CREATE POLICY individual_patients_receptionist_insert ON individual_patients
  FOR INSERT TO authenticated
  WITH CHECK (get_my_role() IN ('RECEPTIONIST', 'ADMIN'));

CREATE POLICY flock_patients_receptionist_select ON flock_patients
  FOR SELECT TO authenticated
  USING (get_my_role() IN ('RECEPTIONIST', 'ADMIN'));

CREATE POLICY flock_patients_receptionist_insert ON flock_patients
  FOR INSERT TO authenticated
  WITH CHECK (get_my_role() IN ('RECEPTIONIST', 'ADMIN'));

CREATE POLICY pound_patients_receptionist_select ON pound_patients
  FOR SELECT TO authenticated
  USING (get_my_role() IN ('RECEPTIONIST', 'ADMIN'));

CREATE POLICY pound_patients_receptionist_insert ON pound_patients
  FOR INSERT TO authenticated
  WITH CHECK (get_my_role() IN ('RECEPTIONIST', 'ADMIN'));

CREATE POLICY ambulatory_trips_receptionist_select ON ambulatory_trips
  FOR SELECT TO authenticated
  USING (get_my_role() IN ('RECEPTIONIST', 'ADMIN'));

CREATE POLICY ambulatory_trips_receptionist_insert ON ambulatory_trips
  FOR INSERT TO authenticated
  WITH CHECK (get_my_role() IN ('RECEPTIONIST', 'ADMIN'));


-- =============================================================================
-- SECTION 6: RLS — USERS TABLE
-- Admin can read and write all users.
-- Any authenticated user can read their own row (for must_change_password check).
-- =============================================================================

CREATE POLICY users_admin_all ON users
  FOR ALL TO authenticated
  USING (get_my_role() = 'ADMIN');

-- (users_read_own policy was already created in migration 001)


-- =============================================================================
-- END OF MIGRATION 002
-- =============================================================================
