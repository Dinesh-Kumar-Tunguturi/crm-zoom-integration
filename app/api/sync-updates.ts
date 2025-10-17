// import type { VercelRequest, VercelResponse } from '@vercel/node';
// import { createClient } from '@supabase/supabase-js';

// // ---------- SUPABASE ADMIN SETUP ----------
// const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
// const SUPABASE_SERVICE_ROLE_KEY =
//   process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

// if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
//   throw new Error('Missing Supabase environment variables');
// }

// const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
//   auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false }
// });

// // ---------- AUTHENTICATION ----------
// function authenticateRequest(req: VercelRequest): boolean {
//   const authHeader = req.headers['authorization'];
//   const expectedApiKey = process.env.SYNC_API_KEY;
//   if (!expectedApiKey) return true; // allow in dev mode

//   if (!authHeader || !authHeader.startsWith('Bearer ')) return false;
//   const apiKey = authHeader.substring(7);
//   return apiKey === expectedApiKey;
// }

// // ---------- VALIDATION ----------
// function validateApplywizzId(id?: string): { isValid: boolean; error?: string } {
//   if (!id) return { isValid: false, error: 'applywizz_id is required' };
//   if (!/^AWL-\d{1,6}$/.test(id))
//     return { isValid: false, error: 'applywizz_id must follow AWL-X to AWL-XXXXXX pattern' };
//   return { isValid: true };
// }

// // ---------- HELPER: Graceful Update ----------
// async function updateTable(
//   table: string,
//   matchColumn: string,
//   matchValue: string,
//   updates: Record<string, any>,
//   skipIfMissing = false
// ) {
//   if (!Object.keys(updates).length)
//     return { success: false, message: 'No update fields provided', details: {} };

//   try {
//     // First check if record exists
//     const { data: existing, error: fetchError } = await supabaseAdmin
//       .from(table)
//       .select(matchColumn)
//       .eq(matchColumn, matchValue)
//       .maybeSingle();

//     if (fetchError) {
//       return {
//         success: false,
//         message: `Failed to verify record existence in ${table}`,
//         details: { error: fetchError.message }
//       };
//     }

//     // If not present — skip silently (as per your new rule)
//     if (!existing) {
//       return {
//         success: true,
//         message: `No record found in ${table} for ${matchColumn} = '${matchValue}' (skipped update)`
//       };
//     }

//     // Perform update
//     const { data, error } = await supabaseAdmin
//       .from(table)
//       .update(updates)
//       .eq(matchColumn, matchValue)
//       .select('*');

//     if (error) {
//       console.error(`❌ Error updating ${table}:`, error);
//       return {
//         success: false,
//         message: `Update failed on ${table}`,
//         details: {
//           error: error.message,
//           hint: error.hint || 'Check column names or Supabase row-level security rules.'
//         }
//       };
//     }

//     return {
//       success: true,
//       message: `Updated ${data?.length || 0} row(s) successfully`,
//       updatedCount: data?.length || 0
//     };
//   } catch (err: any) {
//     console.error(`⚠️ Unexpected exception updating ${table}:`, err);
//     return {
//       success: false,
//       message: `Unexpected error while updating ${table}`,
//       details: { error: err.message }
//     };
//   }
// }

// // ---------- MAIN HANDLER ----------
// export default async function handler(req: VercelRequest, res: VercelResponse) {
//   res.setHeader('Access-Control-Allow-Origin', '*');
//   res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
//   res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

//   if (req.method === 'OPTIONS') return res.status(200).end();
//   if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

//   // Authenticate
//   if (!authenticateRequest(req)) {
//     return res.status(401).json({ error: 'Unauthorized' });
//   }

//   try {
//     let body = req.body;
//     if (typeof body === 'string') {
//       try {
//         body = JSON.parse(body);
//       } catch {
//         return res.status(400).json({
//           error: 'Invalid JSON body',
//           details: 'Ensure request body is valid JSON and Content-Type is application/json.'
//         });
//       }
//     }

//     const { applywizz_id } = body;
//     const validation = validateApplywizzId(applywizz_id);
//     if (!validation.isValid) return res.status(400).json({ error: validation.error });

//     // ---------- 1️⃣ client_onborading_details ----------
//     const onboardingUpdates: Record<string, any> = {};
//     const onboardingFields = [
//       'full_name',
//       'personal_email',
//       'whatsapp_number',
//       'company_email',
//       'job_role_preferences',
//       'salary_range',
//       'location_preferences',
//       'work_auth_details',
//       'visatypes',
//       'needs_sponsorship'
//     ];
//     onboardingFields.forEach((f) => {
//       if (body[f] !== undefined) onboardingUpdates[f] = body[f];
//     });

//     const onboardingResult = await updateTable(
//       'client_onborading_details',
//       'lead_id',
//       applywizz_id,
//       onboardingUpdates,
//       true // skip if missing
//     );

//     // ---------- 2️⃣ sales_closure ----------
//     const salesUpdates: Record<string, any> = {};
//     const salesFieldMap: Record<string, string> = {
//       full_name: 'lead_name',
//       personal_email: 'email',
//       company_email: 'company_application_email',
//       onboarded_date: 'onboarded_date',
//       associates_tl_email: 'associates_tl_email',
//       associates_tl_name: 'associates_tl_name',
//       associates_name: 'associates_name',
//       associates_email: 'associates_email'
//     };
//     Object.entries(salesFieldMap).forEach(([inputKey, column]) => {
//       if (body[inputKey] !== undefined) salesUpdates[column] = body[inputKey];
//     });

//     const salesResult = await updateTable('sales_closure', 'lead_id', applywizz_id, salesUpdates);

//     // ---------- 3️⃣ leads ----------
//     const leadUpdates: Record<string, any> = {};
//     const leadFieldMap: Record<string, string> = {
//       full_name: 'name',
//       phone: 'phone',
//       email: 'email'
//     };
//     Object.entries(leadFieldMap).forEach(([inputKey, column]) => {
//       if (body[inputKey] !== undefined) leadUpdates[column] = body[inputKey];
//     });

//     const leadsResult = await updateTable('leads', 'business_id', applywizz_id, leadUpdates);

//     // ---------- COMBINE RESULTS ----------
//     const allResults = {
//       client_onborading_details: onboardingResult,
//       sales_closure: salesResult,
//       leads: leadsResult
//     };

//     const hasErrors = Object.values(allResults).some((r: any) => !r.success);
//     const statusCode = hasErrors ? 207 : 200;

//     return res.status(statusCode).json({
//       message: hasErrors
//         ? 'Partial success — some updates failed or records not found. See details below.'
//         : 'All updates completed successfully.',
//       applywizz_id,
//       results: allResults
//     });
//   } catch (err: any) {
//     console.error('🔥 Fatal error in sync-updates:', err);
//     return res.status(500).json({
//       error: 'Internal Server Error',
//       details: err.message || err.toString()
//     });
//   }
// }



// import type { VercelRequest, VercelResponse } from "@vercel/node";
// import { createClient } from "@supabase/supabase-js";

// // ---------- CONFIG ----------
// export const config = {
//   runtime: "nodejs",
// };

// // ---------- SUPABASE SETUP ----------
// const SUPABASE_URL =
//   process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
// const SUPABASE_SERVICE_ROLE_KEY =
//   process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY ||
//   process.env.SUPABASE_SERVICE_ROLE_KEY;

// if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
//   throw new Error("❌ Missing Supabase environment variables");
// }

// const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
//   auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
// });

// // ---------- AUTH ----------
// function authenticateRequest(req: VercelRequest): boolean {
//   const authHeader = req.headers["authorization"];
//   const expectedApiKey = process.env.SYNC_API_KEY;

//   if (!expectedApiKey) return true; // allow all in dev mode
//   if (!authHeader || !authHeader.startsWith("Bearer ")) return false;
//   const apiKey = authHeader.substring(7);
//   return apiKey === expectedApiKey;
// }

// // ---------- HELPER FUNCTION ----------
// async function updateSalesClosure(
//   lead_id: string,
//   updates: Record<string, any>
// ) {
//   if (!Object.keys(updates).length) {
//     return { success: false, message: "No fields provided to update." };
//   }

//   try {
//     // Check if record exists first
//     const { data: existing, error: selectError } = await supabaseAdmin
//       .from("sales_closure")
//       .select("id")
//       .eq("lead_id", lead_id)
//       .maybeSingle();

//     if (selectError) {
//       return {
//         success: false,
//         message: "Failed to verify record existence.",
//         details: selectError.message,
//       };
//     }

//     if (!existing) {
//       return {
//         success: true,
//         message: `No record found for lead_id = '${lead_id}'. Update skipped.`,
//       };
//     }

//     // ✅ Update only given fields
//     const { data, error } = await supabaseAdmin
//       .from("sales_closure")
//       .update(updates)
//       .eq("lead_id", lead_id)
//       .select("*");

//     if (error) {
//       return {
//         success: false,
//         message: "Update failed on sales_closure.",
//         details: error.message,
//       };
//     }

//     return {
//       success: true,
//       message: `Updated ${data?.length || 0} row(s) successfully.`,
//       updatedRow: data?.[0] || null,
//     };
//   } catch (err: any) {
//     return {
//       success: false,
//       message: "Unexpected error while updating sales_closure.",
//       details: err.message,
//     };
//   }
// }

// // ---------- MAIN HANDLER ----------
// export default async function handler(req: VercelRequest, res: VercelResponse) {
//   // CORS headers
//   res.setHeader("Access-Control-Allow-Origin", "*");
//   res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
//   res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");

//   if (req.method === "OPTIONS") return res.status(200).end();
//   if (req.method !== "POST") {
//     console.warn(`Received unsupported method: ${req.method}`);
//     return res
//       .status(405)
//       .json({ error: `Method ${req.method} not allowed. Use POST.` });
//   }

//   if (!authenticateRequest(req)) {
//     return res.status(401).json({ error: "Unauthorized. Invalid API key." });
//   }

//   // for update and pull request, working

//   try {
//     // Safe parse JSON
//     let body = req.body;
//     if (typeof body === "string") {
//       try {
//         body = JSON.parse(body);
//       } catch {
//         return res.status(400).json({
//           error: "Invalid JSON body.",
//           details:
//             "Ensure the request body is valid JSON and Content-Type is application/json.",
//         });
//       }
//     }

//     const { lead_id } = body;
//     if (!lead_id || typeof lead_id !== "string") {
//       return res
//         .status(400)
//         .json({ error: "lead_id is required and must be a string." });
//     }

//     // ✅ Build updates dynamically (every field optional)
//     const allowedFields = [
//       "lead_name",
//       "email",
//       "company_application_email",
//       "onboarded_date",
//       "associates_tl_email",
//       "associates_tl_name",
//       "associates_name",
//       "associates_email",
//       "account_assigned_email",
//       "account_assigned_name",
//       "badge_value",
//       "no_of_job_applications",
//       "finance_status",
//       "reason_for_close",
//     ];

//     const updates: Record<string, any> = {};
//     for (const field of allowedFields) {
//       if (body[field] !== undefined && body[field] !== null && body[field] !== "") {
//         updates[field] = body[field];
//       }
//     }

//     // Call updater
//     const result = await updateSalesClosure(lead_id, updates);

//     const status = result.success ? 200 : 400;
//     return res.status(status).json(result);
//   } catch (err: any) {
//     console.error("🔥 Fatal error:", err);
//     return res
//       .status(500)
//       .json({ error: "Internal Server Error", details: err.message });
//   }
// }



import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

// ---------- CONFIG ----------
export const config = {
  runtime: "nodejs", // Ensure Node.js runtime
};

// ---------- SUPABASE SETUP ----------
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("❌ Missing Supabase environment variables");
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
});

// ---------- AUTH ----------
function authenticateRequest(req: VercelRequest): boolean {
  const authHeader = req.headers["authorization"];
  const expectedApiKey = process.env.SYNC_API_KEY;

  if (!expectedApiKey) return true; // allow all in dev mode
  if (!authHeader || !authHeader.startsWith("Bearer ")) return false;
  const apiKey = authHeader.substring(7);
  return apiKey === expectedApiKey;
}

// ---------- HELPER FUNCTION ----------
async function updateSalesClosure(
  lead_id: string,
  updates: Record<string, any>
) {
  if (!Object.keys(updates).length) {
    return { success: false, message: "No fields provided to update." };
  }

  try {
    // Check if record exists first
    const { data: existing, error: selectError } = await supabaseAdmin
      .from("sales_closure")
      .select("id")
      .eq("lead_id", lead_id)
      .maybeSingle();

    if (selectError) {
      return {
        success: false,
        message: "Failed to verify record existence.",
        details: selectError.message,
      };
    }

    if (!existing) {
      return {
        success: true,
        message: `No record found for lead_id = '${lead_id}'. Update skipped.`,
      };
    }

    // ✅ Update only given fields
    const { data, error } = await supabaseAdmin
      .from("sales_closure")
      .update(updates)
      .eq("lead_id", lead_id)
      .select("*");

    if (error) {
      return {
        success: false,
        message: "Update failed on sales_closure.",
        details: error.message,
      };
    }

    return {
      success: true,
      message: `Updated ${data?.length || 0} row(s) successfully.`,
      updatedRow: data?.[0] || null,
    };
  } catch (err: any) {
    return {
      success: false,
      message: "Unexpected error while updating sales_closure.",
      details: err.message,
    };
  }
}

// ---------- MAIN HANDLER ----------
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");

  // Handle OPTIONS request for preflight
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Handle only POST requests
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ error: `Method ${req.method} not allowed. Use POST.` });
  }

  // Authentication
  if (!authenticateRequest(req)) {
    return res.status(401).json({ error: "Unauthorized. Invalid API key." });
  }

  try {
    // Safe parse JSON
    let body = req.body;
    if (typeof body === "string") {
      try {
        body = JSON.parse(body);
      } catch {
        return res.status(400).json({
          error: "Invalid JSON body.",
          details:
            "Ensure the request body is valid JSON and Content-Type is application/json.",
        });
      }
    }

    const { lead_id } = body;
    if (!lead_id || typeof lead_id !== "string") {
      return res
        .status(400)
        .json({ error: "lead_id is required and must be a string." });
    }

    // ✅ Build updates dynamically (every field optional)
    const allowedFields = [
      "lead_name",
      "email",
      "company_application_email",
      "onboarded_date",
      "associates_tl_email",
      "associates_tl_name",
      "associates_name",
      "associates_email",
      "account_assigned_email",
      "account_assigned_name",
      "badge_value",
      "no_of_job_applications",
      "finance_status",
      "reason_for_close",
    ];

    const updates: Record<string, any> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined && body[field] !== null && body[field] !== "") {
        updates[field] = body[field];
      }
    }

    // Call updater
    const result = await updateSalesClosure(lead_id, updates);

    const status = result.success ? 200 : 400;
    return res.status(status).json(result);
  } catch (err: any) {
    console.error("🔥 Fatal error:", err);
    return res
      .status(500)
      .json({ error: "Internal Server Error", details: err.message });
  }
}
