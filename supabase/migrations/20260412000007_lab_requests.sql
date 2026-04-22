-- =============================================================================
-- Migration: 007 — Lab Requests & Results
-- Cytology, Haematology, Bacteriology/Mycology, Parasitology/Entomology
-- Based on the four physical lab forms used at Unijos VTH.
-- =============================================================================
-- Run in: Supabase Dashboard → SQL Editor → New query → Run
-- Run AFTER migrations 001–006.
-- =============================================================================


-- =============================================================================
-- SECTION 1: LAB NUMBER SEQUENCE
-- Generates LAB-YYYY-NNNNN identifiers, atomic, race-condition-free.
-- SECURITY DEFINER so the function can always write the sequence row
-- even when called by a non-privileged user inside an INSERT DEFAULT.
-- =============================================================================

CREATE TABLE lab_number_sequences (
  year     int PRIMARY KEY,
  next_val int NOT NULL DEFAULT 1
);

ALTER TABLE lab_number_sequences ENABLE ROW LEVEL SECURITY;
CREATE POLICY lab_seq_admin_only ON lab_number_sequences
  FOR ALL TO authenticated USING (get_my_role() = 'ADMIN');

CREATE OR REPLACE FUNCTION generate_lab_number()
RETURNS text AS $$
DECLARE
  current_year int := EXTRACT(YEAR FROM now());
  seq_val      int;
BEGIN
  INSERT INTO lab_number_sequences (year, next_val)
  VALUES (current_year, 1)
  ON CONFLICT (year) DO UPDATE
    SET next_val = lab_number_sequences.next_val + 1
  RETURNING next_val INTO seq_val;

  RETURN 'LAB-' || current_year || '-' || LPAD(seq_val::text, 5, '0');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- =============================================================================
-- SECTION 2: LAB REQUESTS
-- One row per lab test request regardless of form type.
-- lab_number is auto-assigned via DEFAULT on INSERT.
-- clinician_id = who requested the test (student, intern, or vet)
-- =============================================================================

CREATE TABLE lab_requests (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id                uuid NOT NULL REFERENCES cases(id) ON DELETE RESTRICT,
  lab_id                 uuid NOT NULL REFERENCES labs(id),
  request_type           text NOT NULL,
  lab_number             text UNIQUE NOT NULL DEFAULT generate_lab_number(),
  previous_lab_number    text,
  clinician_id           uuid REFERENCES users(id),
  date_of_collection     timestamptz,
  specimen               text,
  history_clinical_signs text,
  tentative_diagnosis    text,
  investigation_required text,   -- BACTERIOLOGY_MYCOLOGY only
  status                 text NOT NULL DEFAULT 'PENDING',
  requested_at           timestamptz NOT NULL DEFAULT now(),
  completed_at           timestamptz
);

ALTER TABLE lab_requests ADD CONSTRAINT lab_requests_type_valid CHECK (
  request_type IN ('CYTOLOGY', 'HAEMATOLOGY', 'BACTERIOLOGY_MYCOLOGY', 'PARASITOLOGY_ENTOMOLOGY')
);
ALTER TABLE lab_requests ADD CONSTRAINT lab_requests_status_valid CHECK (
  status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED')
);

CREATE INDEX idx_lab_requests_case   ON lab_requests (case_id);
CREATE INDEX idx_lab_requests_status ON lab_requests (status);
CREATE INDEX idx_lab_requests_lab    ON lab_requests (lab_id);

ALTER TABLE lab_requests ENABLE ROW LEVEL SECURITY;

-- All clinical staff + admin: can read
CREATE POLICY lab_requests_read_all ON lab_requests
  FOR SELECT TO authenticated
  USING (
    get_my_role() IN ('STUDENT', 'INTERN', 'RESIDENT_VET', 'LECTURER',
                      'CONSULTANT', 'PROFESSOR', 'RECEPTIONIST', 'ADMIN')
  );

-- Clinical staff: can submit requests
CREATE POLICY lab_requests_insert_clinical ON lab_requests
  FOR INSERT TO authenticated
  WITH CHECK (
    get_my_role() IN ('STUDENT', 'INTERN', 'RESIDENT_VET', 'LECTURER',
                      'CONSULTANT', 'PROFESSOR', 'RECEPTIONIST')
  );

-- Vets + admin: can update status / mark completed
CREATE POLICY lab_requests_update_vets ON lab_requests
  FOR UPDATE TO authenticated
  USING (
    get_my_role() IN ('RESIDENT_VET', 'LECTURER', 'CONSULTANT', 'PROFESSOR', 'ADMIN')
  );


-- =============================================================================
-- SECTION 3: CYTOLOGY RESULTS  (Pathology Lab — Cytology Report Form)
-- =============================================================================

CREATE TABLE cytology_results (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_request_id        uuid UNIQUE NOT NULL REFERENCES lab_requests(id) ON DELETE CASCADE,
  cytology_report       text,
  cytological_diagnosis text,
  recommendations       text,
  pathologist_id        uuid REFERENCES users(id),
  reported_at           timestamptz
);

ALTER TABLE cytology_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY cytology_results_read ON cytology_results
  FOR SELECT TO authenticated
  USING (
    get_my_role() IN ('STUDENT', 'INTERN', 'RESIDENT_VET', 'LECTURER',
                      'CONSULTANT', 'PROFESSOR', 'ADMIN')
  );
CREATE POLICY cytology_results_write ON cytology_results
  FOR ALL TO authenticated
  USING (
    get_my_role() IN ('RESIDENT_VET', 'LECTURER', 'CONSULTANT', 'PROFESSOR', 'ADMIN')
  );


-- =============================================================================
-- SECTION 4: HAEMATOLOGY RESULTS  (Pathology Lab — Haematology Request Form)
-- Full blood count, blood smear, differential, parasite check, interpretation.
-- =============================================================================

CREATE TABLE haematology_results (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_request_id         uuid UNIQUE NOT NULL REFERENCES lab_requests(id) ON DELETE CASCADE,
  -- Plasma
  plasma_colour          text,
  plasma_protein_gdl     numeric,
  fibrinogen_gdl         numeric,
  -- Erythrocytes
  hb_gdl                 numeric,
  pcv_pct                numeric,
  rbc_x10_6_ul           numeric,
  mcv_fl                 numeric,
  mchc_gdl               numeric,
  reticulocytosis        text,
  platelets              text,
  -- Blood smear (free text: e.g. +, ++, Mild, Moderate, Absent)
  anisocytosis           text,
  poikilocytosis         text,
  microcytosis           text,
  macrocytosis           text,
  spherocytosis          text,
  leptocytosis           text,
  polychromatophilia     text,
  howell_jolly_bodies    text,
  rouleaux_formation     text,
  red_cell_agglutination text,
  -- Leucocytes
  total_wbc_x10_3_ul     numeric,
  -- Differential
  seg_neutrophils_pct    numeric,
  seg_neutrophils_abs    numeric,
  band_neutrophils_pct   numeric,
  band_neutrophils_abs   numeric,
  lymphocytes_pct        numeric,
  lymphocytes_abs        numeric,
  monocytes_pct          numeric,
  monocytes_abs          numeric,
  eosinophils_pct        numeric,
  eosinophils_abs        numeric,
  basophils_pct          numeric,
  basophils_abs          numeric,
  -- Parasites
  parasites_wet_mount    text,
  parasites_buffy_coat   text,
  parasites_blood_smear  text,
  -- Interpretation (free text)
  interpretation         text,
  pathologist_id         uuid REFERENCES users(id),
  reported_at            timestamptz
);

ALTER TABLE haematology_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY haematology_results_read ON haematology_results
  FOR SELECT TO authenticated
  USING (
    get_my_role() IN ('STUDENT', 'INTERN', 'RESIDENT_VET', 'LECTURER',
                      'CONSULTANT', 'PROFESSOR', 'ADMIN')
  );
CREATE POLICY haematology_results_write ON haematology_results
  FOR ALL TO authenticated
  USING (
    get_my_role() IN ('RESIDENT_VET', 'LECTURER', 'CONSULTANT', 'PROFESSOR', 'ADMIN')
  );


-- =============================================================================
-- SECTION 5: BACTERIOLOGY & MYCOLOGY RESULTS  (Microbiology Lab)
-- =============================================================================

CREATE TABLE bacteriology_results (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_request_id            uuid UNIQUE NOT NULL REFERENCES lab_requests(id) ON DELETE CASCADE,
  specimens_for_examination text,
  investigation_required    text,
  laboratory_findings       text,
  technologist_id           uuid REFERENCES users(id),
  veterinarian_id           uuid REFERENCES users(id),
  reported_at               timestamptz
);

ALTER TABLE bacteriology_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY bacteriology_results_read ON bacteriology_results
  FOR SELECT TO authenticated
  USING (
    get_my_role() IN ('STUDENT', 'INTERN', 'RESIDENT_VET', 'LECTURER',
                      'CONSULTANT', 'PROFESSOR', 'ADMIN')
  );
CREATE POLICY bacteriology_results_write ON bacteriology_results
  FOR ALL TO authenticated
  USING (
    get_my_role() IN ('RESIDENT_VET', 'LECTURER', 'CONSULTANT', 'PROFESSOR', 'ADMIN')
  );


-- =============================================================================
-- SECTION 6: PARASITOLOGY & ENTOMOLOGY RESULTS  (Parasitology Lab)
-- sample_types and tests_requested stored as text arrays.
-- Valid codes documented in the app layer — no DB constraint needed
-- (avoids migration on future form additions).
-- =============================================================================

CREATE TABLE parasitology_results (
  id                               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_request_id                   uuid UNIQUE NOT NULL REFERENCES lab_requests(id) ON DELETE CASCADE,
  -- Sample type checkboxes (codes: whole_blood | faeces | skin_scraping | sputum |
  --   csf | brain | intestinal_segment | endo_ectoparasite | other)
  sample_types                     text[],
  endo_ectoparasite_retrieval_site text,
  sample_type_other                text,
  -- Test request checkboxes (codes: simple_flotation | sedimentation | mcmaster |
  --   baermann | tbs | hct_bct | intestinal_scraping |
  --   cryptosporidium_giardia | parasite_identification | other)
  tests_requested                  text[],
  test_other                       text,
  -- History
  anti_parasite_treatment          text,
  -- Results
  laboratory_result                text,
  diagnostician_id                 uuid REFERENCES users(id),
  reported_at                      timestamptz
);

ALTER TABLE parasitology_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY parasitology_results_read ON parasitology_results
  FOR SELECT TO authenticated
  USING (
    get_my_role() IN ('STUDENT', 'INTERN', 'RESIDENT_VET', 'LECTURER',
                      'CONSULTANT', 'PROFESSOR', 'ADMIN')
  );
CREATE POLICY parasitology_results_write ON parasitology_results
  FOR ALL TO authenticated
  USING (
    get_my_role() IN ('RESIDENT_VET', 'LECTURER', 'CONSULTANT', 'PROFESSOR', 'ADMIN')
  );


-- =============================================================================
-- END OF MIGRATION 007
-- =============================================================================
