-- =============================================================================
-- Migration: 008 — Clinical Record Approval RPC
-- =============================================================================

CREATE OR REPLACE FUNCTION approve_clinical_record(
  p_record_id uuid,
  p_vet_id uuid,
  p_note text,
  p_hash text
) RETURNS void AS $$
BEGIN
  -- 1. Update status
  UPDATE clinical_records
  SET status = 'LOCKED', updated_at = now()
  WHERE id = p_record_id AND status = 'PENDING_REVIEW';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Record not found or not in PENDING_REVIEW status';
  END IF;

  -- 2. Insert approval record
  INSERT INTO approval_records (
    clinical_record_id, 
    approved_by_vet_id, 
    approval_note, 
    record_hash
  ) VALUES (
    p_record_id, 
    p_vet_id, 
    p_note, 
    p_hash
  );
END;
$$ LANGUAGE plpgsql;
