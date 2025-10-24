// // app/api/pending-clients/upsert/route.ts
// import { NextResponse } from 'next/server';
// import { z } from 'zod';
// import { pendingDb } from '@/lib/ticketingSupabaseAdmin';

// const Payload = z.object({
//   full_name: z.string().min(1),
//   personal_email: z.string().email(),
//   whatsapp_number: z.string().nullable().optional(),
//   callable_phone: z.string().nullable().optional(),
//   company_email: z.string().email().nullable().optional(),
//   job_role_preferences: z.array(z.string()).nullable().optional(),
//   salary_range: z.string().nullable().optional(),
//   location_preferences: z.array(z.string()).nullable().optional(),
//   work_auth_details: z.string().nullable().optional(),
//   submitted_by: z.string().uuid().nullable().optional(), // pass null if FK won't exist in Project-B
//   created_at: z.string().optional(),                     // ISO string (only used on first insert)
//   applywizz_id: z.string().nullable().optional(), // optional but recommended
  
//   // New fields:
//   visa_type: z.string().nullable().optional(),           // text
//   sponsorship: z.boolean().nullable().optional(),   // boolean
//     badge_value: z.coerce.number().nullable().optional(),


// });

// export async function POST(req: Request) {
//   try {
//     const body = await req.json();
//     const payload = Payload.parse(body);

//     // Check if already exists by personal_email (your UNIQUE constraint)
//     const { data: existing, error: existErr } = await pendingDb
//       .from('pending_clients')
//       .select('id')
//       .eq('personal_email', payload.personal_email)
//       .maybeSingle();
//     if (existErr) throw existErr;

//     const upsertPayload = existing
//       ? { ...payload } // update (do not override created_at)
//       : { ...payload, created_at: payload.created_at ?? new Date().toISOString() };

//     const { error: upsertErr } = await pendingDb
//       .from('pending_clients')
//       .upsert(upsertPayload, { onConflict: 'personal_email' });

//     if (upsertErr) throw upsertErr;

//     return NextResponse.json({ ok: true });
//   } catch (e: any) {
//     console.error('pending-clients upsert error', e);
//     return NextResponse.json({ ok: false, error: e?.message ?? 'Bad Request' }, { status: 400 });
//   }
// }



import { NextResponse } from 'next/server';
import { z } from 'zod';
import { pendingDb } from '@/lib/ticketingSupabaseAdmin';

// ✅ Full schema aligned with pending_clients table
const Payload = z.object({
  full_name: z.string().min(1),
  personal_email: z.string().email(),
  whatsapp_number: z.string().nullable().optional(),
  callable_phone: z.string().nullable().optional(),
  company_email: z.string().email().nullable().optional(),
  job_role_preferences: z.array(z.string()).nullable().optional(),
  salary_range: z.string().nullable().optional(),
  location_preferences: z.array(z.string()).nullable().optional(),
  work_auth_details: z.string().nullable().optional(),
  submitted_by: z.string().uuid().nullable().optional(),
  created_at: z.string().optional(),
  applywizz_id: z.string().nullable().optional(),

  // Extra fields from client_onborading_details
  visa_type: z.string().nullable().optional(),
  sponsorship: z.boolean().nullable().optional(),
  resume_url: z.string().nullable().optional(),
  resume_path: z.string().nullable().optional(),
  start_date: z.string().nullable().optional(),
  end_date: z.string().nullable().optional(),
  no_of_applications: z.number().nullable().optional(),
  badge_value: z.coerce.number().nullable().optional(),

  // All other boolean and text fields
  is_over_18: z.boolean().nullable().optional(),
  eligible_to_work_in_us: z.boolean().nullable().optional(),
  authorized_without_visa: z.boolean().nullable().optional(),
  require_future_sponsorship: z.boolean().nullable().optional(),
  can_perform_essential_functions: z.boolean().nullable().optional(),
  worked_for_company_before: z.boolean().nullable().optional(),
  discharged_for_policy_violation: z.boolean().nullable().optional(),
  referred_by_agency: z.boolean().nullable().optional(),
  highest_education: z.string().nullable().optional(),
  university_name: z.string().nullable().optional(),
  cumulative_gpa: z.string().nullable().optional(),
  desired_start_date: z.string().nullable().optional(),
  willing_to_relocate: z.boolean().nullable().optional(),
  can_work_3_days_in_office: z.boolean().nullable().optional(),
  role: z.string().nullable().optional(),
  experience: z.string().nullable().optional(),
  work_preferences: z.string().nullable().optional(),
  alternate_job_roles: z.string().nullable().optional(),
  exclude_companies: z.string().nullable().optional(),
  convicted_of_felony: z.boolean().nullable().optional(),
  felony_explanation: z.string().nullable().optional(),
  pending_investigation: z.boolean().nullable().optional(),
  willing_background_check: z.boolean().nullable().optional(),
  willing_drug_screen: z.boolean().nullable().optional(),
  failed_or_refused_drug_test: z.boolean().nullable().optional(),
  uses_substances_affecting_duties: z.boolean().nullable().optional(),
  substances_description: z.string().nullable().optional(),
  can_provide_legal_docs: z.boolean().nullable().optional(),
  gender: z.string().nullable().optional(),
  is_hispanic_latino: z.string().nullable().optional(),
  race_ethnicity: z.string().nullable().optional(),
  veteran_status: z.string().nullable().optional(),
  disability_status: z.string().nullable().optional(),
  has_relatives_in_company: z.boolean().nullable().optional(),
  relatives_details: z.string().nullable().optional(),
  state_of_residence: z.string().nullable().optional(),
  zip_or_country: z.string().nullable().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const payload = Payload.parse(body);

    const { data: existing, error: existErr } = await pendingDb
      .from('pending_clients')
      .select('id')
      .eq('personal_email', payload.personal_email)
      .maybeSingle();
    if (existErr) throw existErr;

    const upsertPayload = existing
      ? { ...payload } // update only
      : { ...payload, created_at: payload.created_at ?? new Date().toISOString() };

    const { error: upsertErr } = await pendingDb
      .from('pending_clients')
      .upsert(upsertPayload, { onConflict: 'personal_email' });

    if (upsertErr) throw upsertErr;

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('❌ pending-clients upsert error', e);
    return NextResponse.json({ ok: false, error: e?.message ?? 'Bad Request' }, { status: 400 });
  }
}
