// lib/pdfBuilder.tsx
import { pdf } from "@react-pdf/renderer";
import { InvoicePDF } from "@/components/generate-invoice";

// 🔁 Return PDF as Blob
export async function buildInvoicePDF(data: any): Promise<Blob> {
  return await pdf(<InvoicePDF data={data} />).toBlob();
}
