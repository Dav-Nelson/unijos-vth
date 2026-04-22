-- =============================================================================
-- Migration: 001 — Foundation Schema
-- Unijos VTH Clinic Management System
-- =============================================================================
-- Run this in: Supabase Dashboard → SQL Editor → New query → Run
-- =============================================================================


-- =============================================================================
-- SECTION 1: CLINICS
-- The three physical clinics at Unijos VTH.
-- Seeded here — not created via admin UI. Clinic list is fixed for v1.
-- =============================================================================

CREATE TABLE clinics (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  code        text NOT NULL UNIQUE,  -- SAC, LAC, AAC
  clinic_type text NOT NULL,         -- SMALL_LARGE | AVIAN_AQUATIC
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Seed the three clinics
INSERT INTO clinics (name, code, clinic_type) VALUES
  ('Small Animal Clinic',    'SAC', 'SMALL_LARGE'),
  ('Large Animal Clinic',    'LAC', 'SMALL_LARGE'),
  ('Avian & Aquatic Clinic', 'AAC', 'AVIAN_AQUATIC');


-- =============================================================================
-- SECTION 2: USERS
-- Extends Supabase Auth (auth.users) with app-level fields.
-- One row per user. Created by admin — no self-registration.
-- =============================================================================

CREATE TABLE users (
  id                   uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name            text NOT NULL,
  role                 text NOT NULL,  -- ADMIN | RECEPTIONIST | STUDENT | INTERN |
                                       -- RESIDENT_VET | LECTURER | CONSULTANT |
                                       -- PROFESSOR | PHARMACIST
  clinic_id            uuid REFERENCES clinics(id),  -- NULL for ADMIN, CONSULTANT,
                                                      -- PROFESSOR, PHARMACIST
  must_change_password boolean NOT NULL DEFAULT false,
  created_at           timestamptz NOT NULL DEFAULT now()
);

-- Valid roles constraint
ALTER TABLE users ADD CONSTRAINT users_role_valid CHECK (
  role IN (
    'ADMIN', 'RECEPTIONIST', 'STUDENT', 'INTERN',
    'RESIDENT_VET', 'LECTURER', 'CONSULTANT', 'PROFESSOR', 'PHARMACIST'
  )
);

-- Clinic-scoped roles must have a clinic_id; system-wide roles must not
ALTER TABLE users ADD CONSTRAINT users_clinic_scope_valid CHECK (
  (role IN ('RECEPTIONIST', 'STUDENT', 'INTERN', 'RESIDENT_VET', 'LECTURER')
    AND clinic_id IS NOT NULL)
  OR
  (role IN ('ADMIN', 'CONSULTANT', 'PROFESSOR', 'PHARMACIST')
    AND clinic_id IS NULL)
);


-- =============================================================================
-- SECTION 3: OWNERS
-- Animal owners (clients). Deduplicated by phone number.
-- =============================================================================

CREATE TABLE owners (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name  text NOT NULL,
  phone      text NOT NULL,
  address    text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Phone must be unique — this is how we prevent duplicate owner records
ALTER TABLE owners ADD CONSTRAINT owners_phone_unique UNIQUE (phone);


-- =============================================================================
-- SECTION 4: CASE NUMBER SEQUENCES + GENERATOR
-- Generates VTH-YYYY-NNNNN format, race-condition-free.
-- Called at CHECKED_IN transition (when case row is created), not at scheduling.
-- =============================================================================

CREATE TABLE case_number_sequences (
  year     int PRIMARY KEY,
  next_val int NOT NULL DEFAULT 1
);

CREATE OR REPLACE FUNCTION generate_case_number()
RETURNS text AS $$
DECLARE
  current_year int := EXTRACT(YEAR FROM now());
  seq_val      int;
BEGIN
  INSERT INTO case_number_sequences (year, next_val)
  VALUES (current_year, 1)
  ON CONFLICT (year) DO UPDATE
    SET next_val = case_number_sequences.next_val + 1
  RETURNING next_val INTO seq_val;

  RETURN 'VTH-' || current_year || '-' || LPAD(seq_val::text, 5, '0');
END;
$$ LANGUAGE plpgsql;


-- =============================================================================
-- SECTION 5: CASES
-- One row per visit. The central table the whole system revolves around.
-- patient_type drives which satellite table has the patient details.
-- case_type drives whether an ambulatory_trips row exists.
-- =============================================================================

CREATE TABLE cases (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_number  text UNIQUE NOT NULL DEFAULT generate_case_number(),
  patient_type text NOT NULL,  -- INDIVIDUAL | FLOCK | POUND
  case_type    text NOT NULL DEFAULT 'IN_CLINIC',  -- IN_CLINIC | AMBULATORY
  clinic_id    uuid NOT NULL REFERENCES clinics(id),
  owner_id     uuid NOT NULL REFERENCES owners(id),
  status       text NOT NULL DEFAULT 'OPEN',  -- OPEN | CLOSED
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE cases ADD CONSTRAINT cases_patient_type_valid CHECK (
  patient_type IN ('INDIVIDUAL', 'FLOCK', 'POUND')
);

ALTER TABLE cases ADD CONSTRAINT cases_case_type_valid CHECK (
  case_type IN ('IN_CLINIC', 'AMBULATORY')
);

ALTER TABLE cases ADD CONSTRAINT cases_status_valid CHECK (
  status IN ('OPEN', 'CLOSED')
);


-- =============================================================================
-- SECTION 6: PATIENT DETAIL TABLES
-- One row per case in exactly one of these tables, based on patient_type.
-- =============================================================================

-- INDIVIDUAL: dogs, cats, cattle, horses, exotic birds, etc.
CREATE TABLE individual_patients (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id    uuid NOT NULL UNIQUE REFERENCES cases(id) ON DELETE CASCADE,
  species    text NOT NULL,
  breed      text,
  age_months int,   -- nullable — owner may not know exact age
  weight_kg  numeric(6,2),
  sex        text,  -- M | F | UNKNOWN
  photo_url  text,  -- nullable — photo is optional
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE individual_patients ADD CONSTRAINT individual_sex_valid CHECK (
  sex IS NULL OR sex IN ('M', 'F', 'UNKNOWN')
);

-- FLOCK: poultry (not individual birds)
CREATE TABLE flock_patients (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id      uuid NOT NULL UNIQUE REFERENCES cases(id) ON DELETE CASCADE,
  species      text NOT NULL,  -- e.g. Broiler, Layer, Turkey
  flock_size   int NOT NULL,
  sick_count   int NOT NULL DEFAULT 0,
  avg_weight_kg numeric(6,2),
  housing_type text,           -- e.g. Deep litter, Battery cage, Free range
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE flock_patients ADD CONSTRAINT flock_size_positive CHECK (flock_size >= 1);
ALTER TABLE flock_patients ADD CONSTRAINT sick_count_valid CHECK (
  sick_count >= 0 AND sick_count <= flock_size
);

-- POUND: fish ponds
CREATE TABLE pound_patients (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id             uuid NOT NULL UNIQUE REFERENCES cases(id) ON DELETE CASCADE,
  species             text NOT NULL,  -- e.g. Catfish, Tilapia
  pond_size_m2        numeric(8,2),
  fish_count_estimate int,
  created_at          timestamptz NOT NULL DEFAULT now()
);


-- =============================================================================
-- SECTION 7: AMBULATORY TRIPS
-- Only exists for cases where case_type = AMBULATORY.
-- travel_fee is required — set at estimate creation before the farm visit.
-- =============================================================================

CREATE TABLE ambulatory_trips (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id             uuid NOT NULL UNIQUE REFERENCES cases(id) ON DELETE CASCADE,
  farm_location       text NOT NULL,
  travel_fee          numeric(10,2) NOT NULL,  -- required, set at Stage 1 estimate
  departure_datetime  timestamptz,             -- set when team departs
  return_datetime     timestamptz,             -- null until returned
  created_at          timestamptz NOT NULL DEFAULT now()
);


-- =============================================================================
-- SECTION 8: INDEXES
-- Required for the appointment list query (plan §Performance Requirements).
-- =============================================================================

CREATE INDEX idx_cases_clinic    ON cases (clinic_id);
CREATE INDEX idx_cases_owner     ON cases (owner_id);
CREATE INDEX idx_cases_status    ON cases (status);
CREATE INDEX idx_owners_phone    ON owners (phone);  -- for phone-search lookup


-- =============================================================================
-- SECTION 9: ROW LEVEL SECURITY
-- Enable RLS on all tables. Policies added in next migration (auth middleware first).
-- For now: no public access to any table. Only service role can read/write.
-- =============================================================================

ALTER TABLE clinics              ENABLE ROW LEVEL SECURITY;
ALTER TABLE users                ENABLE ROW LEVEL SECURITY;
ALTER TABLE owners               ENABLE ROW LEVEL SECURITY;
ALTER TABLE cases                ENABLE ROW LEVEL SECURITY;
ALTER TABLE individual_patients  ENABLE ROW LEVEL SECURITY;
ALTER TABLE flock_patients       ENABLE ROW LEVEL SECURITY;
ALTER TABLE pound_patients       ENABLE ROW LEVEL SECURITY;
ALTER TABLE ambulatory_trips     ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_number_sequences ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read clinics (needed for dropdown lists)
CREATE POLICY clinics_read_authenticated ON clinics
  FOR SELECT TO authenticated
  USING (true);

-- Allow authenticated users to read their own user row
CREATE POLICY users_read_own ON users
  FOR SELECT TO authenticated
  USING (id = auth.uid());

-- =============================================================================
-- END OF MIGRATION 001
-- =============================================================================
