// import { NextRequest, NextResponse } from "next/server";
// import { createClient } from "@supabase/supabase-js";

// // force Node runtime so envs are available
// export const runtime = "nodejs";
// const BUCKET = "resumes";

// const supabase = createClient(
//   process.env.NEXT_PUBLIC_SUPABASE_URL!,
//   process.env.SUPABASE_SERVICE_ROLE_KEY! // bypasses RLS
// );

// export async function POST(req: NextRequest) {
//   const form = await req.formData();
//   const file = form.get("file") as File | null;
//   const leadId = String(form.get("leadId") ?? "");
//   if (!file || !leadId) return new NextResponse("Missing file/leadId", { status: 400 });

//   if (file.type !== "application/pdf") return new NextResponse("PDF only", { status: 400 });

//   const clean = file.name.replace(/[^\w.\-]+/g, "_");
//   const path = `${leadId}/${Date.now()}_${clean}`;

//   // Upload bytes to Storage
//   const arrayBuf = await file.arrayBuffer();
//   const { error } = await supabase.storage.from(BUCKET).upload(path, arrayBuf, {
//     contentType: "application/pdf",
//     cacheControl: "3600",
//   });
//   if (error) return new NextResponse(error.message, { status: 400 });

//   return NextResponse.json({ path });
// }
