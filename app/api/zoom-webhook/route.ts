import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

/**
 * ZOOM WEBHOOK ENDPOINT
 * Handles automated call logging and duration syncing from Zoom.
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // 1. Zoom Webhook URL Validation
        // Zoom sends this when you first add the URL to verify our ownership.
        if (body.event === "endpoint.url_validation") {
            const plainToken = body.payload.plainToken;
            const secretToken = process.env.ZOOM_WEBHOOK_SECRET_TOKEN || "";

            if (!secretToken) {
                console.error("ZOOM_WEBHOOK_SECRET_TOKEN is missing in .env");
            }

            const hashForValidate = crypto
                .createHmac("sha256", secretToken)
                .update(plainToken)
                .digest("hex");

            return NextResponse.json({
                plainToken: plainToken,
                encryptedToken: hashForValidate,
            }, { status: 200 });
        }

        // 2. Handle Call Log Completed Event
        // Triggered when a call finishes.
        if (body.event === "phone.call_log_completed") {
            const callData = body.payload.object;
            const calleeNumber = callData.callee_number || "";
            const callerNumber = callData.caller_number || "";
            const duration = callData.duration || 0; // Duration in seconds
            const callTime = callData.date_time; // When the call happened

            // We look for the number that isn't ours (the client)
            // Usually the callee for outbound, or caller for inbound.
            const rawPhoneNumber = callData.direction === "outbound" ? calleeNumber : callerNumber;

            if (rawPhoneNumber && duration > 0) {
                const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
                const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
                const supabase = createClient(supabaseUrl, supabaseServiceKey);

                const callDateYMD = new Date(callTime).toISOString().split("T")[0];

                // Match by last 10 digits to handle prefix differences (+1, +91 etc)
                const cleanDigits = rawPhoneNumber.replace(/[^\d]/g, "");
                const matchPattern = cleanDigits.length >= 10 ? `%${cleanDigits.slice(-10)}` : `%${cleanDigits}`;

                console.log(`[Zoom Webhook] Matching call: ${rawPhoneNumber}, Duration: ${duration}s, Date: ${callDateYMD}`);

                // Update the most recent matching record for today that hasn't been synced yet
                const { data: matchingRecords, error: fetchError } = await supabase
                    .from("call_history")
                    .select("id, phone")
                    .filter("phone", "ilike", matchPattern)
                    .gte("followup_date", callDateYMD)
                    .lte("followup_date", callDateYMD)
                    .is("call_duration_seconds", null)
                    .order("created_at", { ascending: false });

                if (fetchError) throw fetchError;

                if (matchingRecords && matchingRecords.length > 0) {
                    const targetId = matchingRecords[0].id;
                    const { error: updateError } = await supabase
                        .from("call_history")
                        .update({
                            call_duration_seconds: duration,
                            notes: `[Auto-Sync] Call completed. Duration: ${Math.floor(duration / 60)}m ${duration % 60}s.`
                        })
                        .eq("id", targetId);

                    if (updateError) throw updateError;
                    console.log(`[Zoom Webhook] Successfully updated record ${targetId}`);
                } else {
                    console.log(`[Zoom Webhook] No matching record found for ${rawPhoneNumber} on ${callDateYMD}`);
                }
            }
        }

        // 3. Handle Recording Completed (Optional but helpful)
        if (body.event === "phone.recording_completed") {
            // You could logic here to save the recording URL to Supabase if needed
            console.log("[Zoom Webhook] Recording completed for call");
        }

        return NextResponse.json({ message: "Received" }, { status: 200 });

    } catch (error: any) {
        console.error("Zoom Webhook Processing Error:", error.message);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
