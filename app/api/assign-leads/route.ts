

import { supabaseAdmin } from '@/lib/supabaseAdmin';


export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { selectedLeads, assignedTo, assignedAt } = body;

    if (!Array.isArray(selectedLeads) || selectedLeads.length === 0 || !assignedTo || typeof assignedTo !== "string") {
      console.warn("⚠️ Invalid payload", { selectedLeads, assignedTo });
      return new Response(JSON.stringify({ error: "Invalid input: leads or assignee missing" }), { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from("leads")
      .update({
        status: "Assigned",
        assigned_to: assignedTo,
        assigned_at: assignedAt || new Date().toISOString(),
      })
      .in("id", selectedLeads);

    if (error) {
      console.error("❌ Supabase update error:", error.message);
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    return new Response(JSON.stringify({ message: "Leads assigned successfully" }), { status: 200 });
  } catch (err: any) {
    console.error("❌ Unexpected error in assign-leads:", err.message);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
