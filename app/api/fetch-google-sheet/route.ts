
// app/api/fetch-google-sheet/route.ts
import { supabase } from "@/utils/supabase/client";
import { NextResponse } from 'next/server';
import Papa from "papaparse";

function parseGoogleSheetsTimestamp(timestamp: string): Date | null {
  if (!timestamp) return null;
  
  try {
    if (timestamp.includes('/')) {
      // Format: "DD/MM/YYYY HH:MM:SS"
      const [datePart, timePart] = timestamp.split(' ');
      const [day, month, year] = datePart.split('/');
      return new Date(`${year}-${month}-${day}T${timePart}`);
    } else if (timestamp.includes('-')) {
      // Format: "DD-MM-YYYY HH:MM:SS"
      const [datePart, timePart] = timestamp.split(' ');
      const [day, month, year] = datePart.split('-');
      return new Date(`${year}-${month}-${day}T${timePart}`);
    }
    return null;
  } catch (error) {
    console.error('Failed to parse timestamp:', timestamp, error);
    return null;
  }
}

export async function POST(request: Request) {
  console.log('🔵 [API] Fetch Google Sheets endpoint hit');
  
  const authHeader = request.headers.get('Authorization');
  const CRON_SECRET = process.env.CRON_SECRET;
  
  if (!CRON_SECRET) {
    // console.error('❌ CRON_SECRET is not configured');
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 }
    );
  }
  
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    // console.error('❌ Unauthorized access attempt');
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    console.log("📥 [API] Fetching Google Sheets configuration...");

    // Get all configured sheets from Supabase with error handling
    const { data: sheets, error: fetchError } = await supabase
      .from("google_sheets_config")
      .select("*")
      .order("last_imported_at", { ascending: true, nullsFirst: true });

    if (fetchError) {
      // console.error('❌ Supabase fetch error:', fetchError);
      throw new Error(`Supabase error: ${fetchError.message}`);
    }

    if (!sheets?.length) {
      // console.log('ℹ️ No Google Sheets configured');
      return Response.json(
        { message: "No Google Sheets configured" },
        { status: 200 }
      );
    }

    // console.log(`ℹ️ Found ${sheets.length} sheets to process`);
    const results = [];
    let totalInserted = 0;

    for (const [index, sheet] of sheets.entries()) {
      const sheetStartTime = Date.now();
      console.log(`\n🔄 [${index + 1}/${sheets.length}] Processing sheet: ${sheet.name} (ID: ${sheet.id})`);
      
      try {
        // 1. Fetch CSV from Google Sheets
        // console.log(`  ⏳ Fetching sheet from URL: ${sheet.url}`);
        const fetchStart = Date.now();
        const res = await fetch(sheet.url, {
          cache: 'no-store', // Ensure fresh data
        });
        const fetchTime = Date.now() - fetchStart;
        
        if (!res.ok) {
          throw new Error(`HTTP ${res.status} - ${res.statusText}`);
        }

        const csvText = await res.text();
        // console.log(`  ✅ Fetched ${csvText.length} bytes in ${fetchTime}ms`);

        // 2. Parse CSV
        // console.log('  ⏳ Parsing CSV...');
        const { data: parsedRows, errors: parseErrors } = Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          transform: (value) => value.trim(), // Trim all values
        });

        if (parseErrors?.length) {
          // console.warn('  ⚠️ CSV parse warnings:', parseErrors);
        }

        if (!parsedRows.length) {
          console.log('  ℹ️ No data rows found in sheet');
          results.push({
            sheetId: sheet.id,
            name: sheet.name,
            status: "skipped",
            reason: "No data rows",
          });
          continue;
        }

        console.log(`  ℹ️ Found ${parsedRows.length} rows in sheet`);

        // 3. Filter and transform data
        // console.log('  ⏳ Processing rows...');
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const newLeads = [];

        for (const rowRaw of parsedRows) {
          const row = rowRaw as Record<string, string>;
          try {
            const timestamp = row["Timestamp"];
            const rowDate = timestamp ? parseGoogleSheetsTimestamp(timestamp) : null;
            
            // Skip if no valid date or older than 1 hour
            if (!rowDate || rowDate < oneHourAgo) continue;

            newLeads.push({
              name: row["Full name"]?.trim() || "",
              phone: row["Phone Number (Country Code)"]?.trim() || "",
              email: row["Email"]?.trim()?.toLowerCase() || "",
              city: row["city"]?.trim() || "",
              source: sheet.name,
              status: "New",
              assigned_to: "",
              // created_at: new Date().toISOString(),
              created_at: row['Timestamp']
  ? parseGoogleSheetsTimestamp(row['Timestamp'])?.toISOString() || new Date().toISOString()
  : new Date().toISOString(),
              metadata: {
                original_timestamp: timestamp,
                sheet_id: sheet.id,
              }
            });
          } catch (rowError) {
            // console.warn(`  ⚠️ Error processing row:`, rowError);
          }
        }

        if (!newLeads.length) {
          console.log('  ℹ️ No recent leads found in sheet');
          results.push({
            sheetId: sheet.id,
            name: sheet.name,
            status: "skipped",
            reason: "No recent data",
          });
          continue;
        }

        console.log(`  ✅ Found ${newLeads.length} new leads to insert`);

        // 4. Insert into leads table
        // console.log('  ⏳ Inserting leads...');
        const { error: insertError, count } = await supabase
          .from("leads")
          .insert(newLeads, { count: 'exact' });

        if (insertError) {
          throw new Error(`Supabase insert error: ${insertError.message}`);
        }

        // 5. Update last_imported_at
        // console.log('  ⏳ Updating last imported timestamp...');
        const { error: updateError } = await supabase
          .from("google_sheets_config")
          .update({ 
            last_imported_at: new Date().toISOString(),
            last_import_count: newLeads.length
          })
          .eq("id", sheet.id);

        if (updateError) {
          // console.warn('  ⚠️ Failed to update last_imported_at:', updateError);
        }

        totalInserted += newLeads.length;
        results.push({
          sheetId: sheet.id,
          name: sheet.name,
          status: "success",
          leadsAdded: newLeads.length,
          executionTime: Date.now() - sheetStartTime,
        });

        console.log(`  ✅ Successfully processed sheet in ${Date.now() - sheetStartTime}ms`);

      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        // console.error(`  ❌ Error processing sheet ${sheet.name}:`, error);
        
        results.push({
          sheetId: sheet.id,
          name: sheet.name,
          status: "error",
          error: errorMsg,
          executionTime: Date.now() - sheetStartTime,
        });
      }
    }

    console.log(`\n🎉 Processed ${sheets.length} sheets | ${totalInserted} new leads added`);
    return Response.json(
      {
        message: `Processed ${sheets.length} sheets | ${totalInserted} new leads`,
        results,
      },
      { status: 200 }
    );

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    return Response.json(
      {
        error: "Internal server error",
        details: errorMsg,
      },
      { status: 500 }
    );
  }
}