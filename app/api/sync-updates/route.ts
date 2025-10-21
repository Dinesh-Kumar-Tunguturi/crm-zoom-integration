
//api/sync-updates/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

// 🧩 Supabase setup
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { lead_id } = body;

    if (!lead_id) {
      return NextResponse.json(
        { message: "you got an error message", error: "lead_id is required" },
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // use post method in postman or hoppscotch to test this api, 
    // if you use any other method like options, get,put it will give an error

    

    // ----------------- 1️⃣ client_onborading_details -----------------
    const clientFields = [
      "full_name",
      "personal_email",
      "whatsapp_number",
      "company_email",
      "job_role_preferences",
      "salary_range",
      "location_preferences",
      "work_auth_details",
      "visatypes",
      "needs_sponsorship",
    ];
    const clientUpdates = filterFields(body, clientFields);
    const clientResult = await updateIfExists("client_onborading_details", "lead_id", lead_id, clientUpdates);

    // ----------------- 2️⃣ sales_closure -----------------
    const salesMap: Record<string, string> = {
      full_name: "lead_name",
      personal_email: "email",
      company_email: "company_application_email",
      onboarded_date: "onboarded_date",
      associates_tl_email: "associates_tl_email",
      associates_tl_name: "associates_tl_name",
      associates_name: "associates_name",
      associates_email: "associates_email",
    };
    const salesUpdates = mapFields(body, salesMap);
    const salesResult = await updateIfExists("sales_closure", "lead_id", lead_id, salesUpdates);

    // ----------------- 3️⃣ leads -----------------
    const leadsMap: Record<string, string> = {
      full_name: "name",
      phone: "phone",
      personal_email: "email",
    };
    const leadsUpdates = mapFields(body, leadsMap);
    const leadsResult = await updateIfExists("leads", "business_id", lead_id, leadsUpdates);

    // ----------------- Combine Results -----------------
    const allResults = [clientResult, salesResult, leadsResult];
    const anyUpdated = allResults.some((r) => r.success);

    if (anyUpdated) {
      return NextResponse.json(
        { message: "data updated" },
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    } else {
      return NextResponse.json(
        { message: "you got an error message" },
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
  } catch (err: any) {
    return NextResponse.json(
      { message: "you got an error message", details: err.message },
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json(
    { message: "OK" },
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}

// ---------- Helper Functions ----------
function filterFields(source: Record<string, any>, allowed: string[]) {
  const result: Record<string, any> = {};
  for (const field of allowed) {
    if (source[field] !== undefined && source[field] !== null && source[field] !== "")
      result[field] = source[field];
  }
  return result;
}

function mapFields(source: Record<string, any>, fieldMap: Record<string, string>) {
  const result: Record<string, any> = {};
  for (const [inputKey, column] of Object.entries(fieldMap)) {
    if (source[inputKey] !== undefined && source[inputKey] !== null && source[inputKey] !== "")
      result[column] = source[inputKey];
  }
  return result;
}

async function updateIfExists(
  table: string,
  key: string,
  value: string,
  updates: Record<string, any>
) {
  if (!Object.keys(updates).length) return { success: false };

  const { data: exists, error: fetchError } = await supabase
    .from(table)
    .select("id")
    .eq(key, value)
    .maybeSingle();

  if (fetchError || !exists) return { success: false };

  const { error } = await supabase.from(table).update(updates).eq(key, value);
  if (error) return { success: false };

  return { success: true };
}
