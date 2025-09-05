// lib/pendingSupabaseAdmin.ts
import { createClient } from '@supabase/supabase-js';

const url = process.env.TICKETING_SUPABASE_URL!;
const serviceKey = process.env.TICKETING_SUPABASE_SERVICE_ROLE_KEY!;

if (!url || !serviceKey) {
  throw new Error('Missing TICKETING_SUPABASE_URL or TICKETING_SUPABASE_SERVICE_ROLE_KEY');
}

export const pendingDb = createClient(url, serviceKey, {
  auth: { persistSession: false },
  global: { headers: { 'X-Client-Info': 'applywizz/dual-db' } },
});
