// This file is auto-generated from the Supabase schema.
// Run: npx supabase gen types typescript --project-id yyvadppyiwwufpkuwhvz > src/types/database.types.ts
// DO NOT edit manually — regenerate after every schema migration.
//
// NOTE: The types below are hand-written stubs that match the real schema exactly.
// Relationships are defined so supabase-js can infer joined-query types correctly.

export type Database = {
  public: {
    Tables: {
      clinics: {
        Row: {
          id: string
          name: string
          code: string
          clinic_type: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          code: string
          clinic_type: string
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['clinics']['Insert']>
        Relationships: []
      }
      users: {
        Row: {
          id: string
          full_name: string
          role: string
          clinic_id: string | null
          must_change_password: boolean
          created_at: string
        }
        Insert: {
          id: string
          full_name: string
          role: string
          clinic_id?: string | null
          must_change_password?: boolean
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['users']['Insert']>
        Relationships: []
      }
      owners: {
        Row: {
          id: string
          full_name: string
          phone: string
          address: string | null
          created_at: string
        }
        Insert: {
          id?: string
          full_name: string
          phone: string
          address?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['owners']['Insert']>
        Relationships: []
      }
      cases: {
        Row: {
          id: string
          case_number: string
          patient_type: 'INDIVIDUAL' | 'FLOCK' | 'POUND'
          case_type: 'IN_CLINIC' | 'AMBULATORY'
          clinic_id: string
          owner_id: string
          status: 'OPEN' | 'CLOSED'
          created_at: string
        }
        Insert: {
          id?: string
          case_number?: string
          patient_type: 'INDIVIDUAL' | 'FLOCK' | 'POUND'
          case_type?: 'IN_CLINIC' | 'AMBULATORY'
          clinic_id: string
          owner_id: string
          status?: 'OPEN' | 'CLOSED'
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['cases']['Insert']>
        Relationships: [
          {
            foreignKeyName: 'cases_owner_id_fkey'
            columns: ['owner_id']
            isOneToOne: false
            referencedRelation: 'owners'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'cases_clinic_id_fkey'
            columns: ['clinic_id']
            isOneToOne: false
            referencedRelation: 'clinics'
            referencedColumns: ['id']
          },
        ]
      }
      individual_patients: {
        Row: {
          id: string
          case_id: string
          species: string
          breed: string | null
          age_months: number | null
          weight_kg: number | null
          sex: 'M' | 'F' | 'UNKNOWN' | null
          photo_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          case_id: string
          species: string
          breed?: string | null
          age_months?: number | null
          weight_kg?: number | null
          sex?: 'M' | 'F' | 'UNKNOWN' | null
          photo_url?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['individual_patients']['Insert']>
        Relationships: [
          {
            foreignKeyName: 'individual_patients_case_id_fkey'
            columns: ['case_id']
            isOneToOne: true
            referencedRelation: 'cases'
            referencedColumns: ['id']
          },
        ]
      }
      flock_patients: {
        Row: {
          id: string
          case_id: string
          species: string
          flock_size: number
          sick_count: number
          avg_weight_kg: number | null
          housing_type: string | null
          created_at: string
        }
        Insert: {
          id?: string
          case_id: string
          species: string
          flock_size: number
          sick_count?: number
          avg_weight_kg?: number | null
          housing_type?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['flock_patients']['Insert']>
        Relationships: [
          {
            foreignKeyName: 'flock_patients_case_id_fkey'
            columns: ['case_id']
            isOneToOne: true
            referencedRelation: 'cases'
            referencedColumns: ['id']
          },
        ]
      }
      pound_patients: {
        Row: {
          id: string
          case_id: string
          species: string
          pond_size_m2: number | null
          fish_count_estimate: number | null
          created_at: string
        }
        Insert: {
          id?: string
          case_id: string
          species: string
          pond_size_m2?: number | null
          fish_count_estimate?: number | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['pound_patients']['Insert']>
        Relationships: [
          {
            foreignKeyName: 'pound_patients_case_id_fkey'
            columns: ['case_id']
            isOneToOne: true
            referencedRelation: 'cases'
            referencedColumns: ['id']
          },
        ]
      }
      ambulatory_trips: {
        Row: {
          id: string
          case_id: string
          farm_location: string
          travel_fee: number
          departure_datetime: string | null
          return_datetime: string | null
          created_at: string
        }
        Insert: {
          id?: string
          case_id: string
          farm_location: string
          travel_fee: number
          departure_datetime?: string | null
          return_datetime?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['ambulatory_trips']['Insert']>
        Relationships: [
          {
            foreignKeyName: 'ambulatory_trips_case_id_fkey'
            columns: ['case_id']
            isOneToOne: false
            referencedRelation: 'cases'
            referencedColumns: ['id']
          },
        ]
      }
      appointments: {
        Row: {
          id: string
          clinic_id: string
          owner_id: string
          case_id: string | null
          assigned_vet_id: string | null
          created_by: string
          scheduled_at: string
          status: 'SCHEDULED' | 'CHECKED_IN' | 'IN_PROGRESS' | 'COMPLETED' | 'NO_SHOW' | 'CANCELLED'
          chief_complaint: string
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          clinic_id: string
          owner_id: string
          case_id?: string | null
          assigned_vet_id?: string | null
          created_by: string
          scheduled_at: string
          status?: 'SCHEDULED' | 'CHECKED_IN' | 'IN_PROGRESS' | 'COMPLETED' | 'NO_SHOW' | 'CANCELLED'
          chief_complaint: string
          notes?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['appointments']['Insert']>
        Relationships: [
          {
            foreignKeyName: 'appointments_owner_id_fkey'
            columns: ['owner_id']
            isOneToOne: false
            referencedRelation: 'owners'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'appointments_clinic_id_fkey'
            columns: ['clinic_id']
            isOneToOne: false
            referencedRelation: 'clinics'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'appointments_case_id_fkey'
            columns: ['case_id']
            isOneToOne: false
            referencedRelation: 'cases'
            referencedColumns: ['id']
          },
        ]
      }
      labs: {
        Row: {
          id: string
          name: string
          lab_type: 'PATHOLOGY' | 'MICROBIOLOGY' | 'PARASITOLOGY'
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          lab_type: 'PATHOLOGY' | 'MICROBIOLOGY' | 'PARASITOLOGY'
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['labs']['Insert']>
        Relationships: []
      }
      rotations: {
        Row: {
          id: string
          student_id: string
          entity_id: string
          entity_type: 'CLINIC' | 'LAB'
          start_date: string
          end_date: string
          semester: string
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          student_id: string
          entity_id: string
          entity_type: 'CLINIC' | 'LAB'
          start_date: string
          end_date: string
          semester: string
          created_by: string
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['rotations']['Insert']>
        Relationships: [
          {
            foreignKeyName: 'rotations_student_id_fkey'
            columns: ['student_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      clinical_records: {
        Row: {
          id: string
          case_id: string
          author_id: string
          status: 'DRAFT' | 'PENDING_REVIEW' | 'REJECTED' | 'LOCKED'
          chief_complaint: string | null
          history: string | null
          examination_findings: string | null
          diagnosis: string | null
          treatment_plan: string | null
          prescriptions: string | null
          rejection_note: string | null
          flagged_for_research: boolean
          record_hash: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          case_id: string
          author_id: string
          status?: 'DRAFT' | 'PENDING_REVIEW' | 'REJECTED' | 'LOCKED'
          chief_complaint?: string | null
          history?: string | null
          examination_findings?: string | null
          diagnosis?: string | null
          treatment_plan?: string | null
          prescriptions?: string | null
          rejection_note?: string | null
          flagged_for_research?: boolean
          record_hash?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['clinical_records']['Insert']>
        Relationships: [
          {
            foreignKeyName: 'clinical_records_case_id_fkey'
            columns: ['case_id']
            isOneToOne: true
            referencedRelation: 'cases'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'clinical_records_author_id_fkey'
            columns: ['author_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      approval_records: {
        Row: {
          id: string
          clinical_record_id: string
          approved_by_vet_id: string
          approved_at: string
          approval_note: string | null
          record_hash: string
        }
        Insert: {
          id?: string
          clinical_record_id: string
          approved_by_vet_id: string
          approved_at?: string
          approval_note?: string | null
          record_hash: string
        }
        Update: Partial<Database['public']['Tables']['approval_records']['Insert']>
        Relationships: [
          {
            foreignKeyName: 'approval_records_clinical_record_id_fkey'
            columns: ['clinical_record_id']
            isOneToOne: true
            referencedRelation: 'clinical_records'
            referencedColumns: ['id']
          },
        ]
      }
      case_assignments: {
        Row: {
          id: string
          case_id: string
          student_id: string
          assigned_by: string
          assigned_at: string
        }
        Insert: {
          id?: string
          case_id: string
          student_id: string
          assigned_by: string
          assigned_at?: string
        }
        Update: Partial<Database['public']['Tables']['case_assignments']['Insert']>
        Relationships: [
          {
            foreignKeyName: 'case_assignments_case_id_fkey'
            columns: ['case_id']
            isOneToOne: false
            referencedRelation: 'cases'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'case_assignments_student_id_fkey'
            columns: ['student_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      drugs: {
        Row: {
          id: string
          name: string
          generic_name: string | null
          form: 'TABLET' | 'INJECTION' | 'LIQUID' | 'POWDER' | 'CREAM' | 'OTHER'
          unit: string
          is_deprecated: boolean
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          generic_name?: string | null
          form: 'TABLET' | 'INJECTION' | 'LIQUID' | 'POWDER' | 'CREAM' | 'OTHER'
          unit: string
          is_deprecated?: boolean
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['drugs']['Insert']>
        Relationships: [
          {
            foreignKeyName: 'drugs_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      export_audit_log: {
        Row: {
          id: string
          case_id: string
          exported_by: string
          exported_at: string
        }
        Insert: {
          id?: string
          case_id: string
          exported_by: string
          exported_at?: string
        }
        Update: Partial<Database['public']['Tables']['export_audit_log']['Insert']>
        Relationships: []
      }
      invoices: {
        Row: {
          id: string
          case_id: string
          invoice_type: 'STANDARD' | 'AMBULATORY'
          status: 'PENDING' | 'PAID' | 'ESTIMATED' | 'DEPOSIT_PAID' | 'VISIT_COMPLETED' | 'FINAL_INVOICE' | 'FULLY_PAID'
          estimated_total: number | null
          final_total: number | null
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          case_id: string
          invoice_type: 'STANDARD' | 'AMBULATORY'
          status?: 'PENDING' | 'PAID' | 'ESTIMATED' | 'DEPOSIT_PAID' | 'VISIT_COMPLETED' | 'FINAL_INVOICE' | 'FULLY_PAID'
          estimated_total?: number | null
          final_total?: number | null
          created_by: string
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['invoices']['Insert']>
        Relationships: [
          {
            foreignKeyName: 'invoices_case_id_fkey'
            columns: ['case_id']
            isOneToOne: false
            referencedRelation: 'cases'
            referencedColumns: ['id']
          },
        ]
      }
      payments: {
        Row: {
          id: string
          invoice_id: string
          payment_type: 'DEPOSIT' | 'FINAL' | 'FULL'
          amount: number
          method: 'CASH' | 'BANK_TRANSFER'
          recorded_by: string
          paid_at: string
          receipt_number: string
        }
        Insert: {
          id?: string
          invoice_id: string
          payment_type: 'DEPOSIT' | 'FINAL' | 'FULL'
          amount: number
          method: 'CASH' | 'BANK_TRANSFER'
          recorded_by: string
          paid_at?: string
          receipt_number: string
        }
        Update: Partial<Database['public']['Tables']['payments']['Insert']>
        Relationships: [
          {
            foreignKeyName: 'payments_invoice_id_fkey'
            columns: ['invoice_id']
            isOneToOne: false
            referencedRelation: 'invoices'
            referencedColumns: ['id']
          },
        ]
      }
      case_number_sequences: {
        Row: { year: number; next_val: number }
        Insert: { year: number; next_val?: number }
        Update: Partial<Database['public']['Tables']['case_number_sequences']['Insert']>
        Relationships: []
      }
      lab_number_sequences: {
        Row: { year: number; next_val: number }
        Insert: { year: number; next_val?: number }
        Update: Partial<Database['public']['Tables']['lab_number_sequences']['Insert']>
        Relationships: []
      }
      lab_requests: {
        Row: {
          id: string
          case_id: string
          lab_id: string
          request_type: 'CYTOLOGY' | 'HAEMATOLOGY' | 'BACTERIOLOGY_MYCOLOGY' | 'PARASITOLOGY_ENTOMOLOGY'
          lab_number: string
          previous_lab_number: string | null
          clinician_id: string | null
          date_of_collection: string | null
          specimen: string | null
          history_clinical_signs: string | null
          tentative_diagnosis: string | null
          investigation_required: string | null
          status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'
          requested_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          case_id: string
          lab_id: string
          request_type: 'CYTOLOGY' | 'HAEMATOLOGY' | 'BACTERIOLOGY_MYCOLOGY' | 'PARASITOLOGY_ENTOMOLOGY'
          lab_number?: string
          previous_lab_number?: string | null
          clinician_id?: string | null
          date_of_collection?: string | null
          specimen?: string | null
          history_clinical_signs?: string | null
          tentative_diagnosis?: string | null
          investigation_required?: string | null
          status?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'
          requested_at?: string
          completed_at?: string | null
        }
        Update: Partial<Database['public']['Tables']['lab_requests']['Insert']>
        Relationships: [
          {
            foreignKeyName: 'lab_requests_case_id_fkey'
            columns: ['case_id']
            isOneToOne: false
            referencedRelation: 'cases'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'lab_requests_lab_id_fkey'
            columns: ['lab_id']
            isOneToOne: false
            referencedRelation: 'labs'
            referencedColumns: ['id']
          },
        ]
      }
      cytology_results: {
        Row: {
          id: string
          lab_request_id: string
          cytology_report: string | null
          cytological_diagnosis: string | null
          recommendations: string | null
          pathologist_id: string | null
          reported_at: string | null
        }
        Insert: {
          id?: string
          lab_request_id: string
          cytology_report?: string | null
          cytological_diagnosis?: string | null
          recommendations?: string | null
          pathologist_id?: string | null
          reported_at?: string | null
        }
        Update: Partial<Database['public']['Tables']['cytology_results']['Insert']>
        Relationships: [
          {
            foreignKeyName: 'cytology_results_lab_request_id_fkey'
            columns: ['lab_request_id']
            isOneToOne: true
            referencedRelation: 'lab_requests'
            referencedColumns: ['id']
          },
        ]
      }
      haematology_results: {
        Row: {
          id: string
          lab_request_id: string
          plasma_colour: string | null
          plasma_protein_gdl: number | null
          fibrinogen_gdl: number | null
          hb_gdl: number | null
          pcv_pct: number | null
          rbc_x10_6_ul: number | null
          mcv_fl: number | null
          mchc_gdl: number | null
          reticulocytosis: string | null
          platelets: string | null
          anisocytosis: string | null
          poikilocytosis: string | null
          microcytosis: string | null
          macrocytosis: string | null
          spherocytosis: string | null
          leptocytosis: string | null
          polychromatophilia: string | null
          howell_jolly_bodies: string | null
          rouleaux_formation: string | null
          red_cell_agglutination: string | null
          total_wbc_x10_3_ul: number | null
          seg_neutrophils_pct: number | null
          seg_neutrophils_abs: number | null
          band_neutrophils_pct: number | null
          band_neutrophils_abs: number | null
          lymphocytes_pct: number | null
          lymphocytes_abs: number | null
          monocytes_pct: number | null
          monocytes_abs: number | null
          eosinophils_pct: number | null
          eosinophils_abs: number | null
          basophils_pct: number | null
          basophils_abs: number | null
          parasites_wet_mount: string | null
          parasites_buffy_coat: string | null
          parasites_blood_smear: string | null
          interpretation: string | null
          pathologist_id: string | null
          reported_at: string | null
        }
        Insert: {
          id?: string
          lab_request_id: string
          plasma_colour?: string | null
          plasma_protein_gdl?: number | null
          fibrinogen_gdl?: number | null
          hb_gdl?: number | null
          pcv_pct?: number | null
          rbc_x10_6_ul?: number | null
          mcv_fl?: number | null
          mchc_gdl?: number | null
          reticulocytosis?: string | null
          platelets?: string | null
          anisocytosis?: string | null
          poikilocytosis?: string | null
          microcytosis?: string | null
          macrocytosis?: string | null
          spherocytosis?: string | null
          leptocytosis?: string | null
          polychromatophilia?: string | null
          howell_jolly_bodies?: string | null
          rouleaux_formation?: string | null
          red_cell_agglutination?: string | null
          total_wbc_x10_3_ul?: number | null
          seg_neutrophils_pct?: number | null
          seg_neutrophils_abs?: number | null
          band_neutrophils_pct?: number | null
          band_neutrophils_abs?: number | null
          lymphocytes_pct?: number | null
          lymphocytes_abs?: number | null
          monocytes_pct?: number | null
          monocytes_abs?: number | null
          eosinophils_pct?: number | null
          eosinophils_abs?: number | null
          basophils_pct?: number | null
          basophils_abs?: number | null
          parasites_wet_mount?: string | null
          parasites_buffy_coat?: string | null
          parasites_blood_smear?: string | null
          interpretation?: string | null
          pathologist_id?: string | null
          reported_at?: string | null
        }
        Update: Partial<Database['public']['Tables']['haematology_results']['Insert']>
        Relationships: [
          {
            foreignKeyName: 'haematology_results_lab_request_id_fkey'
            columns: ['lab_request_id']
            isOneToOne: true
            referencedRelation: 'lab_requests'
            referencedColumns: ['id']
          },
        ]
      }
      bacteriology_results: {
        Row: {
          id: string
          lab_request_id: string
          specimens_for_examination: string | null
          investigation_required: string | null
          laboratory_findings: string | null
          technologist_id: string | null
          veterinarian_id: string | null
          reported_at: string | null
        }
        Insert: {
          id?: string
          lab_request_id: string
          specimens_for_examination?: string | null
          investigation_required?: string | null
          laboratory_findings?: string | null
          technologist_id?: string | null
          veterinarian_id?: string | null
          reported_at?: string | null
        }
        Update: Partial<Database['public']['Tables']['bacteriology_results']['Insert']>
        Relationships: [
          {
            foreignKeyName: 'bacteriology_results_lab_request_id_fkey'
            columns: ['lab_request_id']
            isOneToOne: true
            referencedRelation: 'lab_requests'
            referencedColumns: ['id']
          },
        ]
      }
      parasitology_results: {
        Row: {
          id: string
          lab_request_id: string
          sample_types: string[] | null
          endo_ectoparasite_retrieval_site: string | null
          sample_type_other: string | null
          tests_requested: string[] | null
          test_other: string | null
          anti_parasite_treatment: string | null
          laboratory_result: string | null
          diagnostician_id: string | null
          reported_at: string | null
        }
        Insert: {
          id?: string
          lab_request_id: string
          sample_types?: string[] | null
          endo_ectoparasite_retrieval_site?: string | null
          sample_type_other?: string | null
          tests_requested?: string[] | null
          test_other?: string | null
          anti_parasite_treatment?: string | null
          laboratory_result?: string | null
          diagnostician_id?: string | null
          reported_at?: string | null
        }
        Update: Partial<Database['public']['Tables']['parasitology_results']['Insert']>
        Relationships: [
          {
            foreignKeyName: 'parasitology_results_lab_request_id_fkey'
            columns: ['lab_request_id']
            isOneToOne: true
            referencedRelation: 'lab_requests'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
