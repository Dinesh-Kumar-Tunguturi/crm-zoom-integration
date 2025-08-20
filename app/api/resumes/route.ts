// // // app/api/resumes/route.ts
// // import { NextRequest, NextResponse } from "next/server";
// // import { createClient } from "@supabase/supabase-js";

// // // ⚠️ Use service key (server-side only)
// // const supabase = createClient(
// //   process.env.NEXT_PUBLIC_SUPABASE_URL!,
// //   process.env.SUPABASE_SERVICE_ROLE_KEY! // do NOT expose this to the client
// // );

// // // If your bucket name is different, change here:
// // const BUCKET = "resumes";

// // export async function GET(req: NextRequest) {
// //   try {
// //     const { searchParams } = new URL(req.url);
// //     const path = searchParams.get("path"); // e.g. "AWL-1379/Resume.pdf"
// //     const name = searchParams.get("name") || "resume.pdf";

// //     if (!path) {
// //       return new NextResponse("Missing path", { status: 400 });
// //     }

// //     // Create a 60s signed URL that forces download with filename
// //     const { data, error } = await supabase.storage
// //       .from(BUCKET)
// //       .createSignedUrl(path, 60, { download: name });

// //     if (error || !data?.signedUrl) {
// //       console.error("createSignedUrl error:", error);
// //       return new NextResponse("File not found", { status: 404 });
// //     }

// //     // Redirect browser to Supabase signed URL; Supabase will set Content-Disposition
// //     return NextResponse.redirect(data.signedUrl, { status: 302 });
// //   } catch (e: any) {
// //     console.error("resumes route error:", e?.message || e);
// //     return new NextResponse("Internal error", { status: 500 });
// //   }
// // }


// // app/api/resumes/route.ts
// import { NextRequest, NextResponse } from "next/server";
// import { createClient } from "@supabase/supabase-js";

// // Force Node runtime (Service Role not available on Edge)
// export const runtime = "nodejs";
// export const dynamic = "force-dynamic";

// const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
// const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
// const BUCKET = "resumes";

// if (!url || !key) {
//   console.error("Supabase env missing:", { url: !!url, key: !!key });
// }

// const supabase = createClient(url!, key!);

// export async function GET(req: NextRequest) {
//   const { searchParams } = new URL(req.url);
//   const path = searchParams.get("path");
//   const name = searchParams.get("name") || "resume.pdf";

//   if (!path) {
//     return new NextResponse("Missing path", { status: 400 });
//   }

//   try {
//     const { data, error } = await supabase
//       .storage
//       .from(BUCKET)
//       .createSignedUrl(path, 60, { download: name });

//     if (error || !data?.signedUrl) {
//       console.error("createSignedUrl error:", error);
//       return new NextResponse(error?.message || "File not found", { status: 400 });
//     }

//     return NextResponse.redirect(data.signedUrl, { status: 302 });
//   } catch (e: any) {
//     console.error("resumes route fatal:", e?.message || e);
//     return new NextResponse("Internal error", { status: 500 });
//   }
// }
