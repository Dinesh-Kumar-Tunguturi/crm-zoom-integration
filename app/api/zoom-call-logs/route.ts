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

// Helper to extract last 10 digits for robust matching
function getCleanDigits(p: string) {
    return (p || "").replace(/[^\d]/g, "");
}

// ─── GET /api/zoom-call-logs ───────────────────────────────────
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const phoneFilter = searchParams.get("phone") || "";
        const dateFilter = searchParams.get("date") || new Date().toISOString().split("T")[0];

        const accessToken = await getZoomAccessToken();

        const from = `${dateFilter}T00:00:00Z`;
        const to = `${dateFilter}T23:59:59Z`;

        // 1. Fetch Call Logs
        const zoomUrl = `https://api.zoom.us/v2/phone/call_history?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&page_size=100&type=all`;
        const callLogsResponse = await fetch(zoomUrl, {
            headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
        });

        if (!callLogsResponse.ok) {
            const errorText = await callLogsResponse.text();
            throw new Error(`Zoom Call Logs API failed: ${errorText}`);
        }

        const callLogsData = await callLogsResponse.json();
        const callLogs = callLogsData.call_logs || [];

        // 2. Fetch Recordings for the same period
        const recordingsUrl = `https://api.zoom.us/v2/phone/recordings?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&page_size=100`;
        const recordingsResponse = await fetch(recordingsUrl, {
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        const recordingsData = recordingsResponse.ok ? await recordingsResponse.json() : { recordings: [] };
        const recordings = recordingsData.recordings || [];

        // Filter logs by phone digits if provided
        const cleanFilter = getCleanDigits(phoneFilter);
        const filteredLogs = cleanFilter
            ? callLogs.filter((log: any) =>
                getCleanDigits(log.callee_number).includes(cleanFilter) ||
                getCleanDigits(log.caller_number).includes(cleanFilter)
            )
            : callLogs;

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        let syncedCount = 0;

        for (const log of filteredLogs) {
            const rawPhone = log.direction === "outbound" ? log.callee_number : log.caller_number;
            const duration = log.duration || 0;
            const callDate = log.date_time ? new Date(log.date_time).toISOString().split("T")[0] : dateFilter;
            const callId = log.id;

            if (rawPhone) {
                const cleanDigits = getCleanDigits(rawPhone);
                const matchPattern = cleanDigits.length >= 10 ? `%${cleanDigits.slice(-10)}` : `%${cleanDigits}`;

                // Find matching recording by call_id or phone/time
                const recording = recordings.find((r: any) => r.call_id === callId);
                const downloadUrl = recording?.download_url || null;

                console.log(`[Manual Sync] Processing: ${rawPhone}, Duration: ${duration}s, Recording: ${!!downloadUrl}`);

                const { data: records } = await supabase
                    .from("call_history")
                    .select("id")
                    .filter("phone", "ilike", matchPattern)
                    .gte("followup_date", callDate)
                    .lte("followup_date", callDate)
                    .order("created_at", { ascending: false });

                if (records && records.length > 0) {
                    const targetId = records[0].id;
                    const updateData: any = { call_duration_seconds: duration };
                    if (downloadUrl) updateData.recording_url = downloadUrl;

                    await supabase
                        .from("call_history")
                        .update(updateData)
                        .eq("id", targetId);

                    syncedCount++;
                }
            }
        }

        return NextResponse.json({
            success: true,
            total_zoom_logs: callLogs.length,
            synced_to_db: syncedCount,
            logs_processed: filteredLogs.length
        });

    } catch (error: any) {
        console.error("Zoom Sync Error:", error);
        return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
    }
}
