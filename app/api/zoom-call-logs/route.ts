// import { NextRequest, NextResponse } from "next/server";
// import { createClient } from "@supabase/supabase-js";

// // ─── ZOOM AUTH ───────────────────────────────────────────────────
// async function getZoomAccessToken(): Promise<string> {
//     const accountId = (process.env.ZOOM_ACCOUNT_ID || "").trim();
//     const clientId = (process.env.ZOOM_CLIENT_ID || "").trim();
//     const clientSecret = (process.env.ZOOM_CLIENT_SECRET || "").trim();

//     if (!accountId || !clientId || !clientSecret) {
//         throw new Error("Missing Zoom credentials in .env");
//     }

//     const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
//     const tokenUrl = `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${accountId}`;

//     const response = await fetch(tokenUrl, {
//         method: "POST",
//         headers: {
//             "Authorization": `Basic ${credentials}`,
//         },
//     });

//     if (!response.ok) {
//         const errorText = await response.text();
//         throw new Error(`Zoom OAuth failed: ${errorText}`);
//     }

//     const data = await response.json();
//     return data.access_token;
// }

// // Helper to extract last 10 digits for robust matching
// function getCleanDigits(p: string) {
//     if (!p) return "";
//     const digits = p.replace(/[^\d]/g, "");
//     return digits;
// }

// // ─── GET /api/zoom-call-logs ───────────────────────────────────
// export async function GET(request: NextRequest) {
//     try {
//         const { searchParams } = new URL(request.url);
//         const filterPhone = searchParams.get("phone");
//         const cleanFilterPhone = filterPhone ? getCleanDigits(filterPhone) : null;

//         const accessToken = await getZoomAccessToken();

//         // Range: Last 7 days to now
//         const now = new Date();
//         const sevenDaysAgo = new Date();
//         sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

//         const fromStr = `${sevenDaysAgo.toISOString().split("T")[0]}T00:00:00Z`;
//         const toStr = `${now.toISOString().split("T")[0]}T23:59:59Z`;

//         // 1. Fetch ALL Call Logs (with pagination)
//         const fetchAllLogs = async (url: string, all: any[] = []): Promise<any[]> => {
//             const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
//             if (!res.ok) {
//                 console.error(`Fetch Logs Batch Failed: ${res.status}`);
//                 return all;
//             }
//             const data = await res.json();
//             const combined = [...all, ...(data.call_logs || [])];
//             if (data.next_page_token) {
//                 const nextUrl = new URL(url);
//                 nextUrl.searchParams.set("next_page_token", data.next_page_token);
//                 return fetchAllLogs(nextUrl.toString(), combined);
//             }
//             return combined;
//         };

//         // 2. Fetch ALL Recordings (with pagination)
//         const fetchAllRecordings = async (url: string, all: any[] = []): Promise<any[]> => {
//             const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
//             if (!res.ok) {
//                 console.error(`Fetch Recordings Batch Failed: ${res.status}`);
//                 return all;
//             }
//             const data = await res.json();
//             const combined = [...all, ...(data.recordings || [])];
//             if (data.next_page_token) {
//                 const nextUrl = new URL(url);
//                 nextUrl.searchParams.set("next_page_token", data.next_page_token);
//                 return fetchAllRecordings(nextUrl.toString(), combined);
//             }
//             return combined;
//         };

//         const logsUrlInitial = `https://api.zoom.us/v2/phone/call_history?from=${encodeURIComponent(fromStr)}&to=${encodeURIComponent(toStr)}&page_size=300&type=all`;
//         const recUrlInitial = `https://api.zoom.us/v2/phone/recordings?from=${encodeURIComponent(fromStr)}&to=${encodeURIComponent(toStr)}&page_size=300`;

//         const [allCallLogs, recordings] = await Promise.all([
//             fetchAllLogs(logsUrlInitial),
//             fetchAllRecordings(recUrlInitial)
//         ]);

//         // Filter logs if phone is provided
//         const callLogs = cleanFilterPhone
//             ? allCallLogs.filter(log => {
//                 const isOutbound = log.direction === "outbound";
//                 const rawP = isOutbound
//                     ? (log.callee_number || log.to?.number || log.callee_number_display || "")
//                     : (log.caller_number || log.from?.number || log.caller_number_display || "");
//                 const cleanP = getCleanDigits(rawP);
//                 return cleanP.endsWith(cleanFilterPhone.slice(-10)) || cleanFilterPhone.endsWith(cleanP.slice(-10));
//             })
//             : allCallLogs;

//         console.log(`Syncing: ${callLogs.length} logs (filtered from ${allCallLogs.length}) and ${recordings.length} recordings`);

//         // 3. Supabase Setup
//         const supabase = createClient(
//             process.env.NEXT_PUBLIC_SUPABASE_URL!,
//             process.env.SUPABASE_SERVICE_ROLE_KEY!
//         );

//         // Pre-fetch DB history for matching (7 days)
//         const { data: dbHistory } = await supabase
//             .from("call_history")
//             .select("*")
//             .gte("followup_date", sevenDaysAgo.toISOString().split("T")[0]);

//         // Pre-fetch Leads for auto-insert
//         const { data: allLeads } = await supabase
//             .from("leads")
//             .select("business_id, email, phone, current_stage");

//         // ─── ENSURE INTERNAL LEAD EXISTS ───
//         const INTERNAL_ID = "AWL-00000";
//         let internalLead = allLeads?.find(l => l.business_id === INTERNAL_ID);

//         if (!internalLead) {
//             console.log(`Checking/Creating ${INTERNAL_ID} placeholder lead...`);
//             const { data: upserted, error: upsertErr } = await supabase
//                 .from("leads")
//                 .upsert([{
//                     business_id: INTERNAL_ID,
//                     name: "Internal/Unlinked Zoom Calls",
//                     phone: "INTERNAL",
//                     email: "internal@zoom.com",
//                     source: "Zoom System",
//                     status: "Assigned",
//                     current_stage: "Prospective",
//                     created_at: new Date().toISOString()
//                 }], { onConflict: 'business_id' })
//                 .select("business_id, email, phone, current_stage")
//                 .maybeSingle();

//             if (upserted) {
//                 internalLead = upserted;
//             } else if (upsertErr) {
//                 console.error("Failed to ensure internal lead:", upsertErr);
//             }
//         }

//         const processedCallIds = new Set<string>();
//         let syncedCount = 0;
//         let skippedCount = 0;
//         const errors: any[] = [];
//         const matchingSamples: any[] = [];

//         for (const log of callLogs) {
//             const internalCallId = log.call_id;
//             if (processedCallIds.has(internalCallId)) continue;
//             processedCallIds.add(internalCallId);

//             const isOutbound = log.direction === "outbound";
//             const rawPhone = isOutbound
//                 ? (log.callee_number || log.to?.number || log.callee_number_display || log.callee_ext_number || "")
//                 : (log.caller_number || log.from?.number || log.caller_number_display || log.caller_ext_number || "");

//             const cleanDigits = getCleanDigits(rawPhone);
//             const isShortNumber = cleanDigits.length > 0 && cleanDigits.length < 7;

//             const startTimeStr = log.start_time;
//             const startTimeTs = new Date(startTimeStr).getTime();
//             const callDate = new Date(startTimeStr).toISOString().split("T")[0];

//             // Match Recording
//             const recording = recordings.find((r: any) =>
//                 r.call_log_id === log.id || r.call_id === log.call_id
//             );

//             const zoomRecordingUrl = recording
//                 ? (recording.share_url || recording.play_url || `https://zoom.us/recording/detail/${recording.id}`)
//                 : null;

//             // Match DB Record
//             const matchedRecord = dbHistory?.find(r => {
//                 if (r.notes && r.notes.includes(internalCallId)) return true;

//                 const dbPhone = getCleanDigits(r.phone);
//                 if (!dbPhone || !cleanDigits) return false;

//                 // Priority for short numbers (internal extensions)
//                 if (isShortNumber) return dbPhone === cleanDigits;

//                 const phoneMatch = cleanDigits.length >= 7
//                     ? dbPhone.endsWith(cleanDigits.slice(-10)) || cleanDigits.endsWith(dbPhone.slice(-10))
//                     : dbPhone === cleanDigits;

//                 if (!phoneMatch) return false;

//                 if (r.followup_date === callDate) return true;
//                 if (r.call_started_at) {
//                     const dbTs = new Date(r.call_started_at).getTime();
//                     if (Math.abs(dbTs - startTimeTs) < 30 * 60 * 2000) return true;
//                 }
//                 return false;
//             });

//             if (matchingSamples.length < 5) {
//                 matchingSamples.push({
//                     logPhone: rawPhone,
//                     clean: cleanDigits,
//                     matched: !!matchedRecord,
//                     isOutbound,
//                     startTime: startTimeStr,
//                     duration: log.duration
//                 });
//             }

//             if (matchedRecord) {
//                 // UPDATE (duration and recording)
//                 const { error: updErr } = await supabase.from("call_history").update({
//                     call_duration_seconds: log.duration || 0,
//                     recording_url: zoomRecordingUrl,
//                     notes: (matchedRecord.notes?.includes(internalCallId))
//                         ? matchedRecord.notes
//                         : `${matchedRecord.notes || ""}\n[Zoom ID: ${internalCallId}]`.trim()
//                 }).eq("id", matchedRecord.id);

//                 if (updErr) {
//                     errors.push({ type: "update", id: matchedRecord.id, error: updErr });
//                 } else {
//                     syncedCount++;
//                 }
//             } else {
//                 // INSERT
//                 let lead = null;

//                 // Only seek a real lead if it's not a short internal extension
//                 if (!isShortNumber) {
//                     lead = allLeads?.find(l => {
//                         const dbPhone = getCleanDigits(l.phone);
//                         if (!dbPhone || !cleanDigits) return false;
//                         return cleanDigits.length >= 7
//                             ? dbPhone.endsWith(cleanDigits.slice(-10)) || cleanDigits.endsWith(dbPhone.slice(-10))
//                             : dbPhone === cleanDigits;
//                     });
//                 }

//                 // Use internalLead fallback if no real lead found OR it's a short extension
//                 const finalLead = lead || internalLead;

//                 if (finalLead?.business_id) {
//                     const { error: insErr } = await supabase.from("call_history").insert([{
//                         lead_id: finalLead.business_id,
//                         email: finalLead.email || "",
//                         phone: rawPhone,
//                         assigned_to: isOutbound ? (log.caller_name || "Zoom") : (log.callee_name || "Zoom"),
//                         current_stage: finalLead.current_stage || "Prospective",
//                         followup_date: callDate,
//                         call_started_at: startTimeStr,
//                         call_duration_seconds: log.duration || 0,
//                         recording_url: zoomRecordingUrl,
//                         notes: `[Zoom Sync - ${log.connect_type || 'internal'}] ${log.call_id}`
//                     }]);

//                     if (insErr) {
//                         errors.push({ type: "insert", call_id: internalCallId, error: insErr });
//                     } else {
//                         syncedCount++;
//                     }
//                 } else {
//                     skippedCount++;
//                 }
//             }
//         }

//         return NextResponse.json({
//             success: true,
//             total_zoom_logs: allCallLogs.length,
//             filtered_logs: callLogs.length,
//             total_recordings: recordings.length,
//             unique_calls_found: processedCallIds.size,
//             synced_to_db: syncedCount,
//             debug: {
//                 skipped_count: skippedCount,
//                 db_history_count: dbHistory?.length || 0,
//                 all_leads_count: allLeads?.length || 0,
//                 internal_lead_id: internalLead?.business_id,
//                 samples: matchingSamples,
//                 errors: errors.slice(0, 5)
//             }
//         });

//     } catch (error: any) {
//         console.error("Zoom Sync Error:", error);
//         return NextResponse.json({ success: false, error: error.message }, { status: 500 });
//     }
// }









// app/api/zoom-call-logs/route.ts

import { NextRequest, NextResponse } from "next/server";

function cleanDigits(num: string = "") {
    return num.replace(/[^\d]/g, "");
}

async function getZoomAccessToken(): Promise<string> {
    const accountId = process.env.ZOOM_ACCOUNT_ID!;
    const clientId = process.env.ZOOM_CLIENT_ID!;
    const clientSecret = process.env.ZOOM_CLIENT_SECRET!;

    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

    const res = await fetch(
        `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${accountId}`,
        {
            method: "POST",
            headers: { Authorization: `Basic ${credentials}` },
        }
    );

    if (!res.ok) {
        throw new Error("Zoom OAuth failed");
    }

    const data = await res.json();
    return data.access_token;
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const phone = searchParams.get("phone");

        if (!phone) {
            return NextResponse.json({ success: false, error: "Phone required" });
        }

        const digits = cleanDigits(phone);
        const accessToken = await getZoomAccessToken();

        const now = new Date();
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const from = `${sevenDaysAgo.toISOString().split("T")[0]}T00:00:00Z`;
        const to = `${now.toISOString().split("T")[0]}T23:59:59Z`;

        const logsRes = await fetch(
            `https://api.zoom.us/v2/phone/call_history?from=${from}&to=${to}&page_size=300&type=all`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
        );

        if (!logsRes.ok) throw new Error("Zoom call history fetch failed");

        const logsData = await logsRes.json();
        const callLogs = logsData.call_logs || [];

        const recRes = await fetch(
            `https://api.zoom.us/v2/phone/recordings?from=${from}&to=${to}&page_size=300`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
        );

        const recData = recRes.ok ? await recRes.json() : { recordings: [] };
        const recordings = recData.recordings || [];

        const matchedCalls = callLogs
            .filter((log: any) => {
                const isOutbound = log.direction === "outbound";
                const raw = isOutbound
                    ? (log.callee_number || log.to?.number || log.callee_number_display || "")
                    : (log.caller_number || log.from?.number || log.caller_number_display || "");

                const clean = cleanDigits(raw);
                if (!clean || clean.length < 7) return false;

                // Robust 10-digit match
                return (
                    clean.endsWith(digits.slice(-10)) ||
                    digits.endsWith(clean.slice(-10))
                );
            })
            .map((log: any) => {
                const recording = recordings.find(
                    (r: any) =>
                        r.call_log_id === log.id || r.call_id === log.call_id
                );

                return {
                    call_id: log.call_id,
                    start_time: log.start_time,
                    duration: log.duration || 0,
                    direction: log.direction,
                    recording_url: recording
                        ? recording.share_url ||
                        recording.play_url ||
                        `https://zoom.us/recording/detail/${recording.id}`
                        : null,
                };
            });

        return NextResponse.json({
            success: true,
            total: matchedCalls.length,
            calls: matchedCalls,
        });
    } catch (err: any) {
        return NextResponse.json(
            { success: false, error: err.message },
            { status: 500 }
        );
    }
}