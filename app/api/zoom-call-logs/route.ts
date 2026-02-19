import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// ─── Zoom Server-to-Server OAuth Token ─────────────────────────
async function getZoomAccessToken(): Promise<string> {
    const accountId = (process.env.ZOOM_ACCOUNT_ID || "").trim();
    const clientId = (process.env.ZOOM_CLIENT_ID || "").trim();
    const clientSecret = (process.env.ZOOM_CLIENT_SECRET || "").trim();

    if (!accountId || !clientId || !clientSecret) {
        throw new Error("Missing Zoom credentials in .env");
    }

    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
    const tokenUrl = `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${accountId}`;

    const response = await fetch(tokenUrl, {
        method: "POST",
        headers: {
            "Authorization": `Basic ${credentials}`,
        },
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error("Zoom OAuth Full Error:", response.status, errorText);
        throw new Error(`Zoom OAuth failed (${response.status}): ${errorText}. Double-check your Client ID & Secret in .env.`);
    }

    const data = await response.json();
    return data.access_token;
}

// ─── GET /api/zoom-call-logs ───────────────────────────────────
// Fetches call logs from Zoom Phone API and syncs call_duration_seconds
// back to the call_history table in Supabase.
//
// Query params:
//   ?phone=+13147981482  (optional — filter by phone number)
//   ?date=2026-02-19     (optional — fetch logs for specific date, default: today)
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const phoneFilter = searchParams.get("phone") || "";
        const dateFilter = searchParams.get("date") || new Date().toISOString().split("T")[0];

        const accessToken = await getZoomAccessToken();

        // Fetch call logs from Zoom Phone API
        // Uses the account-level call logs endpoint
        const from = `${dateFilter}T00:00:00Z`;
        const to = `${dateFilter}T23:59:59Z`;

        const zoomUrl = `https://api.zoom.us/v2/phone/call_history?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&page_size=100&type=all`;

        const callLogsResponse = await fetch(zoomUrl, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
        });

        if (!callLogsResponse.ok) {
            const errorText = await callLogsResponse.text();
            console.error("Zoom Call Logs Error:", errorText);
            return NextResponse.json(
                { error: "Failed to fetch Zoom call logs. Ensure phone:read:admin scope is enabled.", details: errorText },
                { status: callLogsResponse.status }
            );
        }

        const callLogsData = await callLogsResponse.json();
        const callLogs = callLogsData.call_logs || [];

        // Filter by phone number if provided
        const filteredLogs = phoneFilter
            ? callLogs.filter((log: any) =>
                log.callee_number?.includes(phoneFilter) || log.caller_number?.includes(phoneFilter)
            )
            : callLogs;

        // Now sync durations to Supabase call_history
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        let synced = 0;

        for (const log of filteredLogs) {
            const phoneNumber = log.callee_number || log.caller_number || "";
            const duration = log.duration || 0; // Zoom returns duration in seconds
            const callDate = log.date_time ? new Date(log.date_time).toISOString().split("T")[0] : dateFilter;

            if (duration > 0 && phoneNumber) {
                // Match the phone number by checking if it ends with the Zoom phone number digits
                // e.g., if Zoom has '+13147981482', we match records ending in '3147981482'
                const matchPattern = phoneNumber.length >= 10 ? `%${phoneNumber.slice(-10)}` : `%${phoneNumber}`;

                console.log(`Syncing call: ${phoneNumber}, Duration: ${duration}s, Pattern: ${matchPattern}, Date: ${callDate}`);

                const { data: matchingRecords } = await supabase
                    .from("call_history")
                    .select("id, phone, call_started_at, call_duration_seconds")
                    .filter("phone", "ilike", matchPattern)
                    .gte("followup_date", callDate) // Match the date the call was made
                    .lte("followup_date", callDate)
                    .is("call_duration_seconds", null);

                if (matchingRecords && matchingRecords.length > 0) {
                    // Update the first matching record
                    const record = matchingRecords[0];
                    console.log(`Found matching record: ${record.id} for phone ${record.phone}`);
                    await supabase
                        .from("call_history")
                        .update({ call_duration_seconds: duration })
                        .eq("id", record.id);
                    synced++;
                } else {
                    console.log(`No matching call_history record found for pattern ${matchPattern} on ${callDate}`);
                }
            }
        }

        return NextResponse.json({
            success: true,
            total_zoom_logs: callLogs.length,
            filtered_logs: filteredLogs.length,
            synced_to_db: synced,
            call_logs: filteredLogs.map((log: any) => ({
                caller: log.caller_number,
                callee: log.callee_number,
                duration_seconds: log.duration,
                direction: log.direction,
                result: log.result,
                date_time: log.date_time,
            })),
        });

    } catch (error: any) {
        console.error("Zoom Call Logs Error:", error);
        return NextResponse.json(
            { error: error.message || "Internal server error" },
            { status: 500 }
        );
    }
}
