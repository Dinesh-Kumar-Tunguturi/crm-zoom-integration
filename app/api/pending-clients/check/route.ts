import { NextResponse } from "next/server";
import { pendingDb } from "@/lib/ticketingSupabaseAdmin";

export async function POST(req: Request) {
  try {
    const { email, lead_id } = await req.json();

    if (!email && !lead_id) {
       return NextResponse.json({ error: "Missing email or lead_id" }, { status: 400 });
    }

    // Check if exists in pending_clients
    // We check both personal_email and applywizz_id if possible, or just one.
    // The previous code uses personal_email for upsert conflict.
    
    let query = pendingDb.from("pending_clients").select("id");

    if (email) {
      query = query.eq("personal_email", email);
    } 
    // If we want to check applywizz_id as fallback or AND condition?
    // Let's assume OR for now, effectively checking if the person is there.
    // Actually, usually applywizz_id is the unique identifier if available.
    // The previous upsert uses personal_email as key.
    
    const { data: byEmail, error: emailErr } = await query.maybeSingle();
    
    let existsInPending = !!byEmail;
    
    // If not found by email and lead_id is provided, try that?
    if (!existsInPending && lead_id) {
         const { data: byId } = await pendingDb
            .from("pending_clients")
            .select("id")
            .eq("applywizz_id", lead_id)
            .maybeSingle();
         if (byId) existsInPending = true;
    }

    // We can't check the "ticketing tool database" (main table) as we don't know the table name.
    // We will rely on pending_clients check for now.

    return NextResponse.json({ existsInPending });

  } catch (e: any) {
    console.error("Check pending client error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
