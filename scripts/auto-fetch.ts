

// #!/usr/bin/env node
// scripts/auto-fetch.ts
import cron from 'node-cron';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { setTimeout } from 'timers/promises';

import { fileURLToPath } from 'url';
import Papa from 'papaparse';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(process.cwd(), '.env');


dotenv.config({ path: envPath, override: true });

// 3. VERBOSE ENV DEBUGGING
// console.log('🔍 Current Environment Variables:');
// console.log({
//   NODE_ENV: process.env.NODE_ENV,
//   NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? '*****' + process.env.NEXT_PUBLIC_SUPABASE_URL.slice(-5) : 'MISSING',
//   SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? '*****' + process.env.SUPABASE_SERVICE_ROLE_KEY.slice(-5) : 'MISSING',
//   NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'MISSING',
//   CRON_SECRET: process.env.CRON_SECRET ? '*****' + process.env.CRON_SECRET.slice(-5) : 'MISSING'
// });

// 4. VALIDATION WITH SUGGESTIONS
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'NEXT_PUBLIC_SITE_URL',
  'CRON_SECRET'
];

const missingVars = requiredEnvVars.filter(v => !process.env[v]);
if (missingVars.length) {
  
  process.exit(1);
}

// 5. MAIN APPLICATION CODE
console.log('✅ Environment successfully loaded!');
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);
process.on('unhandledRejection', (error) => {
});

process.on('uncaughtException', (error) => {
});

function formatIST(date: Date): string {
  return date.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour12: true,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}


async function fetchSheets() {
  const cycleId = Math.random().toString(36).substring(2, 8);
  const startTime = Date.now();
  
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  
  // console.log(`\n Starting fetch at ${now.toISOString()}`);
  // console.log(`  ⏳ Fetching records between ${oneHourAgo.toISOString()} and ${now.toISOString()}`);
  console.log(`\n Starting fetch at ${formatIST(now)}`);
console.log(`  ⏳ Fetching records between ${formatIST(oneHourAgo)} and ${formatIST(now)}`);

  try {
    const { data: sheets, error: sheetsError } = await supabase
      .from('google_sheets_config')
      .select('*');

    if (sheetsError) throw sheetsError;
    if (!sheets?.length) {
      return;
    }

    let totalNewLeads = 0;
    const results = [];

    for (const sheet of sheets) {
      const sheetStart = Date.now();
      const sheetResult: any = {
        sheetId: sheet.id,
        sheetName: sheet.name,
        status: 'skipped',
        reason: '',
        newLeads: 0,
        timeWindow: {
          start: oneHourAgo.toISOString(),
          end: now.toISOString()
        }
      };

      try {
        console.log(`  📊 Processing sheet: ${sheet.name}`);

        // Fetch CSV data
        const res = await fetch(sheet.url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const csvText = await res.text();
        const { data: parsedRows } = Papa.parse(csvText, { 
          header: true, 
          skipEmptyLines: true,
          transform: (value) => value ? value.trim() : value
        });

        if (!parsedRows.length) {
          sheetResult.reason = 'Empty sheet';
          results.push(sheetResult);
          continue;
        }

        const newLeads = parsedRows.filter((row: any) => {
          try {
            const rowTimestamp = row['Timestamp'] ? parseGoogleSheetsTimestamp(row['Timestamp']) : null;
            if (!rowTimestamp) return false;
            
            return rowTimestamp >= oneHourAgo && rowTimestamp <= now;
          } catch (e) {
            return false;
          }
        });

        if (!newLeads.length) {
          sheetResult.reason = 'No records in time window';
          results.push(sheetResult);
          continue;
        }

        // Get existing leads in the 1-hour window to avoid full duplicates
const existingCheck = await supabase
  .from('leads')
  .select('name, email, phone, city, created_at')
  .gte('created_at', oneHourAgo.toISOString())
  .lte('created_at', now.toISOString());

const existing = existingCheck.data || [];

const leadsToInsert = newLeads
  .filter((row: any) => {
    const name = row['Full name']?.trim();
    const email = row['Email']?.toLowerCase().trim();
    const phone = row['Phone Number (Country Code)']?.trim();
    const city = row['city']?.trim();
    const timestamp = parseGoogleSheetsTimestamp(row['Timestamp'])?.toISOString();

    // If timestamp couldn't be parsed, consider it unique (safe fallback)
    if (!timestamp) return true;

    return !existing.some(e =>
      e.name?.trim() === name &&
      e.email?.toLowerCase().trim() === email &&
      e.phone?.trim() === phone &&
      e.city?.trim() === city &&
      new Date(e.created_at).toISOString() === timestamp
    );
  })
  .map((row: any) => ({
    name: row['Full name'] || '',
    phone: row['Phone Number (Country Code)'] || '',
    email: row['Email']?.toLowerCase() || '',
    city: row['city'] || '',
    source: sheet.name,
    status: 'New',
    created_at: row['Timestamp']
      ? parseGoogleSheetsTimestamp(row['Timestamp'])?.toISOString() || new Date().toISOString()
      : new Date().toISOString(),
    metadata: {
      original_timestamp: row['Timestamp'],
      sheet_id: sheet.id,
      import_cycle: cycleId,
      import_window: {
        start: oneHourAgo.toISOString(),
        end: now.toISOString()
      }
    }
  }));


        // Prepare data for insertion
  //       const leadsToInsert = newLeads.map((row: any) => ({
  //         name: row['Full name'] || '',
  //         phone: row['Phone Number (Country Code)'] || '',
  //         email: row['Email']?.toLowerCase() || '',
  //         city: row['city'] || '',
  //         source: sheet.name,
  //         status: 'New',
  //         // created_at: new Date().toISOString(),
  //         created_at: row['Timestamp']
  // ? parseGoogleSheetsTimestamp(row['Timestamp'])?.toISOString() || new Date().toISOString()
  // : new Date().toISOString(),

  //         metadata: {
  //           original_timestamp: row['Timestamp'],
  //           sheet_id: sheet.id,
  //           import_cycle: cycleId,
  //           import_window: {
  //             start: oneHourAgo.toISOString(),
  //             end: now.toISOString()
  //           }
  //         }
  //       }));

        // Insert new leads
        const { error: insertError, count } = await supabase
          .from('leads')
          .insert(leadsToInsert, { count: 'exact' });

        if (insertError) throw insertError;

        sheetResult.status = 'success';
        sheetResult.newLeads = count || leadsToInsert.length;
        totalNewLeads += sheetResult.newLeads;

        console.log(`    ✅ Added ${sheetResult.newLeads} new leads from ${sheet.name}`);
      } catch (error) {
        sheetResult.status = 'error';
        sheetResult.error = error instanceof Error ? error.message : 'Unknown error';
        console.error(`    ❌ Sheet processing failed:`, sheetResult.error);
      } finally {
        sheetResult.duration = Date.now() - sheetStart;
        results.push(sheetResult);
      }
    }

    // Log results
    const { error: logError } = await supabase
      .from('auto_fetch_logs')
      .insert({
        cycle_id: cycleId,
        status: 'success',
        execution_time: Date.now() - startTime,
        sheets_processed: sheets.length,
        leads_added: totalNewLeads,
        time_window_start: oneHourAgo.toISOString(),
        time_window_end: now.toISOString(),
        details: {
          results,
          summary: {
            totalSheets: sheets.length,
            sheetsWithNewData: results.filter(r => r.status === 'success').length,
            totalNewLeads
          }
        }
      });

    console.log(`✅${totalNewLeads} new leads from ${results.filter(r => r.status === 'success').length}/${sheets.length} sheets`);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    // console.error(`❌ [Cycle ${cycleId}] Failed:`, errorMsg);

    await supabase.from('auto_fetch_logs').insert({
      cycle_id: cycleId,
      status: 'error',
      execution_time: Date.now() - startTime,
      error: errorMsg
    });
  }
}

// Enhanced timestamp parser
function parseGoogleSheetsTimestamp(timestamp: string): Date | null {
  if (!timestamp) return null;
  
  const formats = [
    // Format: "DD/MM/YYYY HH:MM:SS"
    { regex: /(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2}):(\d{2})/, handler: (d: string, m: string, y: string) => `${y}-${m}-${d}` },
    // Format: "MM/DD/YYYY HH:MM:SS" 
    { regex: /(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2}):(\d{2})/, handler: (m: string, d: string, y: string) => `${y}-${m}-${d}` },
    // Format: "DD-MM-YYYY HH:MM:SS"
    { regex: /(\d{2})-(\d{2})-(\d{4}) (\d{2}):(\d{2}):(\d{2})/, handler: (d: string, m: string, y: string) => `${y}-${m}-${d}` },
    // Format: "YYYY-MM-DD HH:MM:SS"
    { regex: /(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})/, handler: (y: string, m: string, d: string) => `${y}-${m}-${d}` }
  ];

  for (const { regex, handler } of formats) {
    const match = timestamp.match(regex);
    if (match) {
      try {
        const [, p1, p2, p3, hours, minutes, seconds] = match;
        const datePart = handler(p1, p2, p3);
        return new Date(`${datePart}T${hours}:${minutes}:${seconds}`);
      } catch (e) {
        continue;
      }
    }
  }

  return null;
}

// Configure scheduling to run at every one hour
cron.schedule('0 * * * *', fetchSheets, {
  timezone: "UTC",
  schedule: true
}as any);

const schedule = process.env.NODE_ENV === 'production'
  ? '0 * * * *'    // Every hour at :00 in production
  : '0 * * * *'; // Every 2 minutes in development (: '*/2 * * * *';)


const job = cron.schedule(schedule, fetchSheets, {
  timezone: "UTC"
});

const shutdown = async (signal: string) => {
  job.stop();
  
  await setTimeout(500); 
  
  process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

if (process.env.NODE_ENV !== 'production') {
  fetchSheets().catch(console.error);
}