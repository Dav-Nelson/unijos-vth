# Unijos Veterinary Teaching Hospital (VTH) Clinic Management System

A free, open-source clinic management system for the University of Jos Veterinary Teaching Hospital, Nigeria. Designed for low-resource environments (offline-friendly, low bandwidth).

## Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Database/Auth**: Supabase (PostgreSQL, Row Level Security)
- **Styling**: Tailwind CSS + shadcn/ui
- **Type Checking**: TypeScript

## Features
- **Multi-Clinic Reception**: Handles Small/Large Animal and Avian/Aquatic clinics.
- **Clinical Records**: DRAFT → PENDING_REVIEW → LOCKED lifecycle with supervisor approval.
- **Billing**: Two-stage billing for ambulatory field services and standard clinic invoices.
- **Rotation Scheduling**: Admin dashboard for clinical rotations across clinics and labs.

## Getting Started
1. Clone the repo.
2. Install dependencies: `npm install`.
3. Set up your Supabase project using the migration files in `supabase/migrations/`.
4. Configure `.env.local` with your Supabase URL and keys.
5. Run locally: `npm run dev`.

## Contributing
We welcome contributions. Please check `CONTRIBUTING.md` for guidelines.

## License
MIT
