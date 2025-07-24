// lib/createInvoice.tsx
"use client";

import { supabase } from "@/utils/supabase/client";
import { buildInvoicePDF } from "@/lib/pdfBuilder";

export async function createAndUploadInvoice(data: any) {
  const timestamp = Date.now();
  const filename = `AWINV-${data.lead_id}-${timestamp}.pdf`;

  // 1️⃣ Generate the PDF blob
  const pdfBlob = await buildInvoicePDF({ ...data, timestamp });

  // 2️⃣ Upload to Supabase Storage
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from("invoices")
    .upload(filename, pdfBlob, {
      contentType: "application/pdf",
      upsert: true,
    });

  if (uploadError) {
    throw new Error(`Upload failed: ${uploadError.message}`);
  }

  // 3️⃣ Generate Signed URL
  const { data: signedUrlData, error: signedUrlErr } = await supabase.storage
    .from("invoices")
    .createSignedUrl(filename, 60 * 60 * 24 * 7); // valid 7 days

  if (signedUrlErr || !signedUrlData?.signedUrl) {
    throw new Error("Signed URL creation failed");
  }

  // 4️⃣ Return both
  return {
    signedUrl: signedUrlData.signedUrl,
    filename,
  };
}
