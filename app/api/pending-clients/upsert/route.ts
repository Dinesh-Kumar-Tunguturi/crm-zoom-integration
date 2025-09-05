// app/api/pending-clients/upsert/route.ts
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { pendingDb } from '@/lib/ticketingSupabaseAdmin';

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
  submitted_by: z.string().uuid().nullable().optional(), // pass null if FK won't exist in Project-B
  created_at: z.string().optional(),                     // ISO string (only used on first insert)
  applywizz_id: z.string().nullable().optional(), // optional but recommended
  // New fields:
  visa_type: z.string().nullable().optional(),           // text
  sponsorship: z.boolean().nullable().optional(),   // boolean

});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const payload = Payload.parse(body);

    // Check if already exists by personal_email (your UNIQUE constraint)
    const { data: existing, error: existErr } = await pendingDb
      .from('pending_clients')
      .select('id')
      .eq('personal_email', payload.personal_email)
      .maybeSingle();
    if (existErr) throw existErr;

    const upsertPayload = existing
      ? { ...payload } // update (do not override created_at)
      : { ...payload, created_at: payload.created_at ?? new Date().toISOString() };

    const { error: upsertErr } = await pendingDb
      .from('pending_clients')
      .upsert(upsertPayload, { onConflict: 'personal_email' });

    if (upsertErr) throw upsertErr;

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('pending-clients upsert error', e);
    return NextResponse.json({ ok: false, error: e?.message ?? 'Bad Request' }, { status: 400 });
  }
}
