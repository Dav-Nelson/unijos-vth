-- =============================================================================
-- Migration: 006 — Phase C + B Schema
-- Clinical records, approvals, rotations, drugs, invoices, payments
-- =============================================================================
-- Run in: Supabase Dashboard → SQL Editor → New query → Run
-- Run AFTER migrations 001–005.
-- =============================================================================


-- =============================================================================
-- SECTION 1: FIX case_number GENERATOR
-- generate_case_number() must be SECURITY DEFINER so it can access
-- case_number_sequences even when called by a non-privileged auth user.
-- Without this, INSERT into cases by a receptionist silently fails.
-- =============================================================================

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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Allow authenticated users to read their own sequence row (needed if ever queried directly)
CREATE POLICY seq_admin_only ON case_number_sequences
  FOR ALL TO authenticated
  USING (get_my_role() = 'ADMIN');


-- =============================================================================
-- SECTION 2: LABS (stub for Phase C+ rotation entity_type = LAB)
-- Seeded with the three VTH labs. No clinical workflow in Phase C.
-- =============================================================================

CREATE TABLE labs (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  lab_type   text NOT NULL,  -- PATHOLOGY | MICROBIOLOGY | PARASITOLOGY
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE labs ADD CONSTRAINT labs_type_valid CHECK (
  lab_type IN ('PATHOLOGY', 'MICROBIOLOGY', 'PARASITOLOGY')
);

INSERT INTO labs (name, lab_type) VALUES
  ('Pathology Lab',      'PATHOLOGY'),
  ('Microbiology Lab',   'MICROBIOLOGY'),
  ('Parasitology Lab',   'PARASITOLOGY');

ALTER TABLE labs ENABLE ROW LEVEL SECURITY;
CREATE POLICY labs_read_authenticated ON labs
  FOR SELECT TO authenticated USING (true);
CREATE POLICY labs_admin_all ON labs
  FOR ALL TO authenticated USING (get_my_role() = 'ADMIN');


-- =============================================================================
-- SECTION 3: ROTATIONS
-- Admin assigns students to clinic blocks (CLINIC type) or lab sub-rotations (LAB type).
-- CLINIC rotations drive RLS case access. LAB rotations are display-only in Phase C.
-- =============================================================================

CREATE TABLE rotations (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id  uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  entity_id   uuid NOT NULL,  -- FK → clinics.id if CLINIC, labs.id if LAB
  entity_type text NOT NULL,
  start_date  date NOT NULL,
  end_date    date NOT NULL,
  semester    text NOT NULL,  -- e.g. '2026-SEM1'
  created_by  uuid NOT NULL REFERENCES users(id),
  created_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT rotations_entity_type_valid CHECK (entity_type IN ('CLINIC', 'LAB')),
  CONSTRAINT rotations_date_valid CHECK (end_date >= start_date)
);

CREATE INDEX idx_rotations_student_dates ON rotations (student_id, start_date, end_date);
CREATE INDEX idx_rotations_entity        ON rotations (entity_id, entity_type, start_date, end_date);

ALTER TABLE rotations ENABLE ROW LEVEL SECURITY;
-- Admin: full access
CREATE POLICY rotations_admin_all ON rotations
  FOR ALL TO authenticated USING (get_my_role() = 'ADMIN');
-- Student/Intern: read own rotations only
CREATE POLICY rotations_student_read_own ON rotations
  FOR SELECT TO authenticated
  USING (
    get_my_role() IN ('STUDENT', 'INTERN')
    AND student_id = auth.uid()
  );
-- Supervisors (Resident Vet, Lecturer, Consultant, Professor): read all rotations for their clinic
CREATE POLICY rotations_supervisor_read ON rotations
  FOR SELECT TO authenticated
  USING (
    get_my_role() IN ('RESIDENT_VET', 'LECTURER', 'CONSULTANT', 'PROFESSOR')
  );


-- =============================================================================
-- SECTION 4: CLINICAL RECORDS
-- One record per case. Lifecycle: DRAFT → PENDING_REVIEW → LOCKED (approved)
--                                                        → REJECTED → DRAFT
-- =============================================================================

CREATE TABLE clinical_records (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id               uuid NOT NULL UNIQUE REFERENCES cases(id) ON DELETE CASCADE,
  author_id             uuid NOT NULL REFERENCES users(id),
  status                text NOT NULL DEFAULT 'DRAFT',
  -- Clinical fields (all optional until submitted for review)
  chief_complaint       text,
  history               text,
  examination_findings  text,
  diagnosis             text,
  treatment_plan        text,
  prescriptions         text,
  -- Review fields
  rejection_note        text,   -- set when status → REJECTED
  flagged_for_research  boolean NOT NULL DEFAULT false,
  -- Integrity
  record_hash           text,   -- SHA-256 set at LOCKED (approval) time
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE clinical_records ADD CONSTRAINT clinical_records_status_valid CHECK (
  status IN ('DRAFT', 'PENDING_REVIEW', 'REJECTED', 'LOCKED')
);

CREATE INDEX idx_clinical_records_case   ON clinical_records (case_id);
CREATE INDEX idx_clinical_records_author ON clinical_records (author_id);
CREATE INDEX idx_clinical_records_status ON clinical_records (status);

ALTER TABLE clinical_records ENABLE ROW LEVEL SECURITY;

-- Admin: full access
CREATE POLICY clinical_records_admin ON clinical_records
  FOR ALL TO authenticated USING (get_my_role() = 'ADMIN');

-- Author (Student/Intern): can create, read own, update own DRAFT records only
CREATE POLICY clinical_records_author_insert ON clinical_records
  FOR INSERT TO authenticated
  WITH CHECK (
    get_my_role() IN ('STUDENT', 'INTERN')
    AND author_id = auth.uid()
  );
CREATE POLICY clinical_records_author_select ON clinical_records
  FOR SELECT TO authenticated
  USING (
    get_my_role() IN ('STUDENT', 'INTERN')
    AND author_id = auth.uid()
  );
CREATE POLICY clinical_records_author_update ON clinical_records
  FOR UPDATE TO authenticated
  USING (
    get_my_role() IN ('STUDENT', 'INTERN')
    AND author_id = auth.uid()
    AND status IN ('DRAFT', 'REJECTED')
  );

-- Supervisors (Resident Vet / Lecturer): read all records for their clinic
CREATE POLICY clinical_records_supervisor_clinic_select ON clinical_records
  FOR SELECT TO authenticated
  USING (
    get_my_role() IN ('RESIDENT_VET', 'LECTURER')
    AND EXISTS (
      SELECT 1 FROM cases
      WHERE cases.id = clinical_records.case_id
        AND cases.clinic_id = get_my_clinic_id()
    )
  );

-- Supervisors: update to LOCKED or REJECTED (approve/reject workflow)
CREATE POLICY clinical_records_supervisor_update ON clinical_records
  FOR UPDATE TO authenticated
  USING (
    get_my_role() IN ('RESIDENT_VET', 'LECTURER')
    AND EXISTS (
      SELECT 1 FROM cases
      WHERE cases.id = clinical_records.case_id
        AND cases.clinic_id = get_my_clinic_id()
    )
    AND status = 'PENDING_REVIEW'
  );

-- Consultants / Professors: read + approve across all clinics
CREATE POLICY clinical_records_senior_select ON clinical_records
  FOR SELECT TO authenticated
  USING (get_my_role() IN ('CONSULTANT', 'PROFESSOR'));
CREATE POLICY clinical_records_senior_update ON clinical_records
  FOR UPDATE TO authenticated
  USING (
    get_my_role() IN ('CONSULTANT', 'PROFESSOR')
    AND status = 'PENDING_REVIEW'
  );

-- Receptionists: no access to clinical records


-- =============================================================================
-- SECTION 5: APPROVAL RECORDS
-- Created atomically with the LOCKED status update.
-- One per clinical_record (UNIQUE constraint prevents double-approval).
-- =============================================================================

CREATE TABLE approval_records (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinical_record_id  uuid NOT NULL UNIQUE REFERENCES clinical_records(id),
  approved_by_vet_id  uuid NOT NULL REFERENCES users(id),
  approved_at         timestamptz NOT NULL DEFAULT now(),
  approval_note       text,
  record_hash         text NOT NULL  -- SHA-256 of fixed field set
);

ALTER TABLE approval_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY approval_records_admin ON approval_records
  FOR ALL TO authenticated USING (get_my_role() = 'ADMIN');
CREATE POLICY approval_records_read_authenticated ON approval_records
  FOR SELECT TO authenticated
  USING (get_my_role() IN ('STUDENT', 'INTERN', 'RESIDENT_VET', 'LECTURER',
                           'CONSULTANT', 'PROFESSOR'));


-- =============================================================================
-- SECTION 6: CASE ASSIGNMENTS
-- Explicit supervisor→student/intern assignment for a specific case.
-- Supplements rotation-based access (student may be assigned to cases
-- outside their current rotation by a supervisor).
-- =============================================================================

CREATE TABLE case_assignments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id     uuid NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  student_id  uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_by uuid NOT NULL REFERENCES users(id),
  assigned_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (case_id, student_id)
);

CREATE INDEX idx_case_assignments_student ON case_assignments (student_id);

ALTER TABLE case_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY case_assignments_admin ON case_assignments
  FOR ALL TO authenticated USING (get_my_role() = 'ADMIN');
CREATE POLICY case_assignments_supervisor_all ON case_assignments
  FOR ALL TO authenticated
  USING (get_my_role() IN ('RESIDENT_VET', 'LECTURER', 'CONSULTANT', 'PROFESSOR'));
CREATE POLICY case_assignments_student_read ON case_assignments
  FOR SELECT TO authenticated
  USING (
    get_my_role() IN ('STUDENT', 'INTERN')
    AND student_id = auth.uid()
  );


-- =============================================================================
-- SECTION 7: EXTEND cases RLS FOR CLINICAL ROLES
-- Students see cases from their active rotation clinic.
-- Supervisors see cases from their clinic (or all, for Consultant/Professor).
-- =============================================================================

-- Students/Interns: cases from their currently active rotation clinic
CREATE POLICY cases_student_rotation ON cases
  FOR SELECT TO authenticated
  USING (
    get_my_role() IN ('STUDENT', 'INTERN')
    AND EXISTS (
      SELECT 1 FROM rotations r
      WHERE r.student_id = auth.uid()
        AND r.entity_id = cases.clinic_id
        AND r.entity_type = 'CLINIC'
        AND NOW()::date BETWEEN r.start_date AND r.end_date
    )
  );

-- Students/Interns: cases explicitly assigned to them
CREATE POLICY cases_student_assigned ON cases
  FOR SELECT TO authenticated
  USING (
    get_my_role() IN ('STUDENT', 'INTERN')
    AND EXISTS (
      SELECT 1 FROM case_assignments ca
      WHERE ca.case_id = cases.id
        AND ca.student_id = auth.uid()
    )
  );

-- Supervisors (Resident Vet / Lecturer): all cases in their clinic
CREATE POLICY cases_supervisor_clinic ON cases
  FOR SELECT TO authenticated
  USING (
    get_my_role() IN ('RESIDENT_VET', 'LECTURER')
    AND clinic_id = get_my_clinic_id()
  );

-- Senior supervisors (Consultant / Professor): all cases
CREATE POLICY cases_senior_all ON cases
  FOR SELECT TO authenticated
  USING (get_my_role() IN ('CONSULTANT', 'PROFESSOR'));


-- =============================================================================
-- SECTION 8: DRUG FORMULARY
-- Pharmacist manages the formulary. Vets/students read it.
-- =============================================================================

CREATE TABLE drugs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  generic_name  text,
  form          text NOT NULL,  -- TABLET | INJECTION | LIQUID | POWDER | CREAM | OTHER
  unit          text NOT NULL,  -- e.g. mg, mL, g, unit
  is_deprecated boolean NOT NULL DEFAULT false,
  created_by    uuid NOT NULL REFERENCES users(id),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE drugs ADD CONSTRAINT drugs_form_valid CHECK (
  form IN ('TABLET', 'INJECTION', 'LIQUID', 'POWDER', 'CREAM', 'OTHER')
);

CREATE INDEX idx_drugs_name ON drugs (name);
CREATE INDEX idx_drugs_deprecated ON drugs (is_deprecated);

ALTER TABLE drugs ENABLE ROW LEVEL SECURITY;
-- Pharmacist: full management
CREATE POLICY drugs_pharmacist_all ON drugs
  FOR ALL TO authenticated USING (get_my_role() = 'PHARMACIST');
-- All clinical staff + admin: read active drugs
CREATE POLICY drugs_read_clinical ON drugs
  FOR SELECT TO authenticated
  USING (
    get_my_role() IN ('STUDENT', 'INTERN', 'RESIDENT_VET', 'LECTURER',
                      'CONSULTANT', 'PROFESSOR', 'ADMIN')
  );


-- =============================================================================
-- SECTION 9: EXPORT AUDIT LOG
-- Tracks who exported which anonymized case (for admin audit trail).
-- =============================================================================

CREATE TABLE export_audit_log (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id      uuid NOT NULL REFERENCES cases(id),
  exported_by  uuid NOT NULL REFERENCES users(id),
  exported_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE export_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY export_audit_admin_only ON export_audit_log
  FOR ALL TO authenticated USING (get_my_role() = 'ADMIN');


-- =============================================================================
-- SECTION 10: INVOICES
-- Standard: PENDING → PAID
-- Ambulatory: ESTIMATED → DEPOSIT_PAID → VISIT_COMPLETED → FINAL_INVOICE → FULLY_PAID
-- =============================================================================

CREATE TABLE invoices (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id          uuid NOT NULL REFERENCES cases(id) ON DELETE RESTRICT,
  invoice_type     text NOT NULL,
  status           text NOT NULL,
  estimated_total  numeric(10,2),  -- ambulatory only, set at Stage 1
  final_total      numeric(10,2),  -- null until FINAL_INVOICE status
  created_by       uuid NOT NULL REFERENCES users(id),
  created_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE invoices ADD CONSTRAINT invoices_type_valid CHECK (
  invoice_type IN ('STANDARD', 'AMBULATORY')
);
ALTER TABLE invoices ADD CONSTRAINT invoices_status_valid CHECK (
  status IN (
    'PENDING', 'PAID',
    'ESTIMATED', 'DEPOSIT_PAID', 'VISIT_COMPLETED', 'FINAL_INVOICE', 'FULLY_PAID'
  )
);

-- DB trigger: enforce valid status transitions
CREATE OR REPLACE FUNCTION validate_invoice_transition()
RETURNS trigger AS $$
BEGIN
  -- Standard: PENDING → PAID only
  IF OLD.invoice_type = 'STANDARD' THEN
    IF NOT (OLD.status = 'PENDING' AND NEW.status = 'PAID') THEN
      RAISE EXCEPTION 'Invalid standard invoice transition: % → %', OLD.status, NEW.status;
    END IF;
  END IF;
  -- Ambulatory: ordered sequence only
  IF OLD.invoice_type = 'AMBULATORY' THEN
    IF NOT (
      (OLD.status = 'ESTIMATED'       AND NEW.status = 'DEPOSIT_PAID')     OR
      (OLD.status = 'DEPOSIT_PAID'    AND NEW.status = 'VISIT_COMPLETED')   OR
      (OLD.status = 'VISIT_COMPLETED' AND NEW.status = 'FINAL_INVOICE')     OR
      (OLD.status = 'FINAL_INVOICE'   AND NEW.status = 'FULLY_PAID')
    ) THEN
      RAISE EXCEPTION 'Invalid ambulatory invoice transition: % → %', OLD.status, NEW.status;
    END IF;
    -- final_total must be set when entering FINAL_INVOICE
    IF NEW.status = 'FINAL_INVOICE' AND NEW.final_total IS NULL THEN
      RAISE EXCEPTION 'final_total is required when status = FINAL_INVOICE';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER invoice_transition_check
  BEFORE UPDATE ON invoices
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION validate_invoice_transition();

CREATE INDEX idx_invoices_case ON invoices (case_id);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY invoices_receptionist ON invoices
  FOR ALL TO authenticated
  USING (
    get_my_role() = 'RECEPTIONIST'
    AND EXISTS (
      SELECT 1 FROM cases
      WHERE cases.id = invoices.case_id
        AND cases.clinic_id = get_my_clinic_id()
    )
  );
CREATE POLICY invoices_admin_all ON invoices
  FOR ALL TO authenticated USING (get_my_role() = 'ADMIN');


-- =============================================================================
-- SECTION 11: PAYMENTS
-- One row per payment event. Receipt number is globally unique.
-- =============================================================================

CREATE TABLE payments (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id     uuid NOT NULL REFERENCES invoices(id) ON DELETE RESTRICT,
  payment_type   text NOT NULL,  -- DEPOSIT | FINAL | FULL
  amount         numeric(10,2) NOT NULL CHECK (amount > 0),
  method         text NOT NULL,  -- CASH | BANK_TRANSFER
  recorded_by    uuid NOT NULL REFERENCES users(id),
  paid_at        timestamptz NOT NULL DEFAULT now(),
  receipt_number text NOT NULL UNIQUE
);

ALTER TABLE payments ADD CONSTRAINT payments_type_valid CHECK (
  payment_type IN ('DEPOSIT', 'FINAL', 'FULL')
);
ALTER TABLE payments ADD CONSTRAINT payments_method_valid CHECK (
  method IN ('CASH', 'BANK_TRANSFER')
);

CREATE INDEX idx_payments_invoice ON payments (invoice_id);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY payments_receptionist ON payments
  FOR ALL TO authenticated
  USING (
    get_my_role() = 'RECEPTIONIST'
    AND EXISTS (
      SELECT 1 FROM invoices i
        JOIN cases c ON c.id = i.case_id
      WHERE i.id = payments.invoice_id
        AND c.clinic_id = get_my_clinic_id()
    )
  );
CREATE POLICY payments_admin_all ON payments
  FOR ALL TO authenticated USING (get_my_role() = 'ADMIN');


-- =============================================================================
-- SECTION 12: UPDATED_AT TRIGGERS
-- Auto-update updated_at on clinical_records and drugs.
-- =============================================================================

CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER clinical_records_updated_at
  BEFORE UPDATE ON clinical_records
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

CREATE TRIGGER drugs_updated_at
  BEFORE UPDATE ON drugs
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();


-- =============================================================================
-- END OF MIGRATION 006
-- =============================================================================
