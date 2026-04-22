# TODOS — Unijos VTH

Tracked deferred items with full context. Each item is a conscious decision to build later,
not something forgotten. Items without context are worse than no item at all.

---

## TODO-001: Procedure-Level Sign-off (Surgery / Ultrasound / X-ray)

**What:** Design and build a second approval gate for high-risk clinical procedures.

**Why:** Currently, a Resident Vet or Lecturer can approve ANY clinical record from a
student/intern. But surgical procedures, ultrasounds, and x-rays may require a senior
vet (Consultant or Professor level) to sign off specifically on the procedure — not just
the overall clinical record. This is a patient safety feature.

**Current state:** Deferred because the exact procedure list has not been confirmed with
clinical staff. Building the gate before knowing the list risks designing the wrong thing.

**What to confirm first:**
1. Sit with the Head of Small Animal Clinic and ask: "Which procedures require a senior
   vet sign-off before a student can perform them?"
2. Confirm whether the rule is: any vet can supervise, OR specifically Consultant/Professor
   for surgical/imaging procedures.
3. Ask whether the sign-off happens before the procedure (pre-authorization) or after
   (post-procedure review). This changes the data model significantly.

**Likely implementation (once confirmed):**
- Add `requires_senior_approval: boolean DEFAULT false` to clinical_records or procedures table
- Add a second `approval_records` row with `approval_type: STANDARD | SENIOR`
- Extend the approval queue to show "SENIOR REVIEW REQUIRED" badge
- RLS: SENIOR approval only by Consultant or Professor

**Depends on:** Clinical staff interview. Do NOT build until procedure list is confirmed.

**Phase:** Phase C+ (after Phase C clinical workflow ships)

---

## TODO-002: Form B Gate — Avian/Aquatic Registration Form

**What:** Build the Avian/Aquatic patient registration form (Form B) for flock (poultry),
pound (fish), and individual exotic bird patients.

**Why:** The Avian/Aquatic Clinic has a different registration form from Small/Large Animal
Clinic. The system supports FLOCK and POUND patient types in the schema from day one, but
the UI form cannot be built until the actual paper form is obtained.

**Current state:** Blocked. The physical paper registration form used at Avian/Aquatic
reception has not been obtained. Building Form B without seeing the real form risks
implementing the wrong fields, which is painful to fix once real patient data exists.

**What to do:**
1. Visit the Avian/Aquatic Clinic reception desk in person.
2. Ask the receptionist for a blank copy of the patient registration form.
3. Photograph or scan it.
4. Compare against the provisional fields in the CEO plan:
   - Patient category: FLOCK | INDIVIDUAL_EXOTIC | POUND
   - [if FLOCK] Species, Flock size, Sick count, Avg weight (kg), Housing type
   - [if INDIVIDUAL] Species (exotic bird), Age, Weight (kg), Photo
   - [if POUND] Species, Pond size (m²), Estimated fish count
   - Owner: Name, Phone, Address
   - Visit: Chief complaint, Referral source, Vaccinated? Y/N
5. Update the plan with any differences before building.

**Depends on:** Physical paper form from Avian/Aquatic reception. Unblocks Form B build.

**Phase:** Phase A+ (after core Phase A ships for Small/Large Animal)

---

## TODO-003: Pre-coding Observation Sessions (from original design doc)

**What:** Sit with hospital staff before writing Phase A code to observe real workflows.

**Why:** The design doc explicitly flagged these as prerequisites. Building without
observing real workflows risks implementing the wrong thing.

**Sessions needed:**
1. Sit with the Small Animal Clinic receptionist for ~2 hours. Watch a full morning:
   - How are walk-ins handled vs. appointments?
   - What information do they collect at check-in?
   - How do they handle the paper patient card today?
   - What's the most painful part of the current process?
2. Observe the paper workflow end-to-end (reception → vet → billing).

**When:** Before Phase A coding begins. This is a prerequisite, not optional.

**Phase:** Pre-Phase A

---

## TODO-004: Full Design System (DESIGN.md)

**What:** Run `/design-consultation` to build a formal DESIGN.md with the full design system.

**Why:** Phase A ships with a minimal design system seed (teal-600/slate color tokens, Inter font,
shadcn component list). A full DESIGN.md — with named spacing scale, complete color palette, all
component variants, icon set, and motion spec — prevents every new Phase C screen from needing
ad-hoc design decisions. Without it, different screens will drift visually over time.

**What to confirm first:**
After Phase A ships, get 2-3 real users to use the system for a week. Design system should be
informed by actual usage patterns (what do receptionists do 20x per day?) not assumptions.

**When:** After Phase A ships and real receptionists are using the system.
Building a full design system before real usage risks optimizing the wrong things.

**Likely implementation (once confirmed):**
- Run `/design-consultation` with the existing seed decisions as input
- Generate color palette, typography scale, spacing scale
- Document all shadcn component customizations
- Add icon set decision (Lucide is shadcn default — confirm or override)
- Commit DESIGN.md to repo root

**Depends on:** Phase A go-live + at least 2 weeks of real usage feedback.

**Phase:** Phase A+ (after Phase A reception flow ships)

---

*Last updated: 2026-04-09 by /plan-design-review*
