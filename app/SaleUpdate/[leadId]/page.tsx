// // app/SaleUpdate/[leadId]/page.tsx
// "use client";

// import { useEffect, useMemo, useState } from "react";
// import { useParams, useRouter } from "next/navigation";
// import { supabase } from "@/utils/supabase/client";
// import { DashboardLayout } from "@/components/layout/dashboard-layout";

// import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Textarea } from "@/components/ui/textarea";
// import { Label } from "@/components/ui/label";
// import {
//   Select,
//   SelectTrigger,
//   SelectValue,
//   SelectContent,
//   SelectItem,
// } from "@/components/ui/select";

// /* --- Types (subset) --- */
// type FinanceStatus = "Paid" | "Unpaid" | "Paused" | "Closed" | "Got Placed";
// type PaymentMode =
//   | "UPI"
//   | "Bank Transfer"
//   | "PayPal"
//   | "Stripe"
//   | "Credit/Debit Card"
//   | "Other"
//   | "Razorpay";

// type SalesClosureRow = {
//   id: string;
//   lead_id: string;
//   sale_value: number | null;
//   application_sale_value: number | null;
//   application_sale_value_raw?: number | null;
//   application_sale_value_text?: string | null;
//   application_sale_value_formatted?: string | null;
//   application_sale_value_from_db?: number | null;
//   // ... other fields (kept minimal for type safety)
//   subscription_cycle: number | null;
//   payment_mode: PaymentMode | null;
//   closed_at: string | null;
//   email: string | null;
//   company_application_email : string| null;
//   lead_name: string | null;
//   resume_sale_value: number | null;
//   portfolio_sale_value: number | null;
//   linkedin_sale_value: number | null;
//   badge_value: number | null;
//   github_sale_value: number | null;
//   courses_sale_value: number | null;
//   custom_label: string | null;
//   custom_sale_value: number | null;
//   commitments: string | null;
//   no_of_job_applications: number | null;
//   finance_status: FinanceStatus | null;
//   account_assigned_name : string | null;
// };

// type LeadRow = {
//   id: string;
//   name: string;
//   phone: string | null;
//   email: string | null;
//   business_id: string | null;
// };

// /* --- Helpers --- */
// const safeParseFloatOrNull = (v: string | number | null | undefined): number | null => {
//   if (v === null || v === undefined || v === "") return null;
//   const n = parseFloat(String(v));
//   return Number.isFinite(n) ? n : null;
// };
// const safeParseFloatOrZero = (v: string | number | null | undefined): number => {
//   const n = parseFloat(String(v ?? "0"));
//   return Number.isFinite(n) ? n : 0;
// };

// const sumAddons = (...vals: (string | number | null | undefined)[]) =>
//   vals.reduce((acc: number, v) => acc + safeParseFloatOrZero(v), 0);

// const round2 = (x: number) => Math.round((Number.isFinite(x) ? x : 0) * 100) / 100;

// const cycleFactor = (cycle: string | ""): number => {
//   switch (cycle) {
//     case "15":
//       return 0.5;
//     case "30":
//       return 1;
//     case "60":
//       return 2;
//     case "90":
//       return 3;
//     default:
//       return 0;
//   }
// };

// const cycleDays = (cycle: string | ""): number => {
//   switch (cycle) {
//     case "15":
//       return 15;
//     case "30":
//       return 30;
//     case "60":
//       return 60;
//     case "90":
//       return 90;
//     default:
//       return 0;
//   }
// };

// // Date helpers (store UI date as YYYY-MM-DD to avoid TZ shift)
// // const isoToDateOnly = (iso?: string | null) => (iso ? new Date(iso).toISOString().slice(0, 10) : "");

// const isoToDateOnly = (iso?: string | null) =>
//   iso ? iso.slice(0, 10) : "";

// const dateOnlyToIsoUTC = (yyyyMMdd?: string | null) =>
//   yyyyMMdd ? new Date(`${yyyyMMdd}T00:00:00Z`).toISOString() : null;
// const addDaysFromYYYYMMDD = (yyyyMMdd: string, days: number) => {
//   const parts = yyyyMMdd.split("-");
//   if (parts.length !== 3) return "";
//   const y = Number(parts[0]),
//     m = Number(parts[1]),
//     d = Number(parts[2]);
//   const dt = new Date(Date.UTC(y, m - 1, d));
//   dt.setUTCDate(dt.getUTCDate() + days);
//   return dt.toISOString().slice(0, 10);
// };

// /* ---------- Component ---------- */
// export default function SaleUpdatePage() {
//   const { leadId } = useParams<{ leadId: string }>();
//   const router = useRouter();

//   // Loading / saving / errors
//   const [loading, setLoading] = useState(true);
//   const [saving, setSaving] = useState(false);
//   const [error, setError] = useState<string | null>(null);

//   // record
//   const [recordId, setRecordId] = useState<string | null>(null);
//   const [originalTotal, setOriginalTotal] = useState<number>(0);

//   // form fields (strings so inputs behave naturally)
//   const [clientName, setClientName] = useState("");
//   const [clientEmail, setClientEmail] = useState("");
//   const [companyApplicationEmail, setCompanyApplicationEmail] = useState("");

//   const [paymentMode, setPaymentMode] = useState<PaymentMode | "">("");
//   // const [subscriptionCycle, setSubscriptionCycle] = useState<"15" | "30" | "60" | "90" | "">("");

//   // Monthly (kept stable after first derive; user can still edit)
//   const [subscriptionSaleValue, setSubscriptionSaleValue] = useState<string>("");
//   const [monthlyInitialized, setMonthlyInitialized] = useState(false);

//   const [financeStatus, setFinanceStatus] = useState<FinanceStatus | "">("");

//   // add-ons
//   const [resumeValue, setResumeValue] = useState<string>("");
//   const [portfolioValue, setPortfolioValue] = useState<string>("");
//   const [linkedinValue, setLinkedinValue] = useState<string>("");
//   const [badgeValue, setBadgeValue] = useState<string>("");
//   const [githubValue, setGithubValue] = useState<string>("");
//   const [coursesValue, setCoursesValue] = useState<string>("");

//     const [account_assigned_name, setAccount_assigned_name] = useState<string>("");


//   const [customLabel, setCustomLabel] = useState<string>("");
//   const [customValue, setCustomValue] = useState<string>("");

//   const [no_of_job_applications, set_no_of_job_applications] = useState<string>("");
//   const [commitments, setCommitments] = useState<string>("");

//   // NEW: application_sale_value fetched from sales_closure; do NOT compute it
// const [applicationSaleValue, setApplicationSaleValue] = useState<number>(0);
// const [subscriptionValue, setSubscriptionValue] = useState<number>(0);
// const [subscriptionCycle, setSubscriptionCycle] = useState<number>(30); // default 1 month
//   // Dates
//   const [closedAtDate, setClosedAtDate] = useState<string>(""); // YYYY-MM-DD
//   const [nextDueDate, setNextDueDate] = useState<string>("");

//   // lead phone (from leads table, via business_id = leadId)
//   const [leadPhone, setLeadPhone] = useState<string>("");

//   // display-only
//   const [closerName, setCloserName] = useState<string>("");
//   const [autoCalculatedValue, setAutoCalculatedValue] = useState<number>(0);
  


//   // applicationSaleValue is not used to compute totals — we keep the existing
//   // total calculation which uses subscriptionSaleValue * factor + addons.
//   // This matches your request: don't derive applicationSaleValue from computed autoTotal.

//   /* ---------- Fetch sales_closure and leads in parallel ---------- */
// // 🔄 recalc whenever inputs change
// useEffect(() => {
//   if (applicationSaleValue && subscriptionCycle) {
//     const newAuto = (subscriptionCycle / 30) * applicationSaleValue;
//     setAutoCalculatedValue(newAuto);
//   } else {
//     setAutoCalculatedValue(0);
//   }
// }, [applicationSaleValue, subscriptionCycle]);

//   useEffect(() => {
//     let mounted = true;
//     (async () => {
//       try {
//         setLoading(true);
//         setError(null);

//         // 1) Fetch latest sales_closure for this leadId (you used lead_id = leadId)
//         const { data: scData, error: scError } = await supabase
//           .from("sales_closure")
//           .select("*")
//           .eq("lead_id", leadId)
//           .order("closed_at", { ascending: false, nullsFirst: false })
//           .limit(1)
//           .maybeSingle<SalesClosureRow>();

//         if (scError) throw scError;
//         if (!scData) {
//           setError(`No sales_closure found for lead_id=${leadId}`);
//           // we'll still try to fetch lead phone below, but stop early here if needed
//         } else if (mounted) {
//           setRecordId(scData.id);
//           setOriginalTotal(Number(scData.sale_value || 0));

//           // Map addons & meta
//           setResumeValue(scData.resume_sale_value?.toString() ?? "");
//           setPortfolioValue(scData.portfolio_sale_value?.toString() ?? "");
//           setLinkedinValue(scData.linkedin_sale_value?.toString() ?? "");
//           setBadgeValue(scData.badge_value?.toString() ?? "");
//           setGithubValue(scData.github_sale_value?.toString() ?? "");
//           setCoursesValue(scData.courses_sale_value?.toString() ?? "");
//           setCustomLabel(scData.custom_label ?? "");
//           setCustomValue(scData.custom_sale_value?.toString() ?? "");

//           setFinanceStatus((scData.finance_status as FinanceStatus) ?? "");
//           setPaymentMode((scData.payment_mode as PaymentMode) ?? "");
//           setCommitments(scData.commitments ?? "");
//           setClientName(scData.lead_name ?? "");
//           setClientEmail(scData.email ?? "");
//           setCompanyApplicationEmail(scData.company_application_email ?? "");
//           set_no_of_job_applications(scData.no_of_job_applications?.toString() || "");

//           setSubscriptionCycle(
//             scData.subscription_cycle ? Number(scData.subscription_cycle) : 30
//           );

//           // IMPORTANT: application_sale_value should come directly from DB (do not recalc)
//           setApplicationSaleValue(
//             scData.application_sale_value !== null && scData.application_sale_value !== undefined
//               ? Number(scData.application_sale_value)
//               : 0
//           );

//           // store date-only in UI to avoid TZ issues
//           setClosedAtDate(scData.closed_at ? isoToDateOnly(scData.closed_at) : "");

//           setCloserName(scData.account_assigned_name || "");

//           // Allow monthly to initialize once after we mapped fields
//           setMonthlyInitialized(false);
//         }

//         // 2) Fetch lead row (phone) using business_id === leadId
//         const { data: leadData, error: leadError } = await supabase
//           .from("leads")
//           .select("id, phone, name, email, business_id")
//           .eq("business_id", leadId)
//           .maybeSingle<LeadRow>();

//         if (leadError) {
//           // don't crash entire flow; but surface error
//           console.warn("Failed to fetch lead:", leadError);
//           if (mounted && !scData) setError("Failed to fetch lead and no sales record found.");
//         } else if (leadData && mounted) {
//           setLeadPhone(leadData.phone ?? "");
//           // (Optionally map lead name/email into form if you want.)
//         }
//       } catch (e: any) {
//         console.error(e);
//         setError(e?.message ?? "Failed to load records");
//       } finally {
//         if (mounted) setLoading(false);
//       }
//     })();

//     return () => {
//       mounted = false;
//     };
//   }, [leadId]);

//   const handleSubscriptionValueChange = (val: number) => {
//   setSubscriptionValue(val);

//   // recalc application_sale_value in sync
//   const newAppVal = val * (subscriptionCycle / 30);
//   setApplicationSaleValue(newAppVal);
// };

// // auto-calculated back value (always shows as read-only beside field)
// // const autoCalculatedValue = subscriptionValue * (subscriptionCycle / 30);

//   /* ---------- INITIAL monthly derive (same as before) ---------- */
//   useEffect(() => {
//     if (monthlyInitialized) return;
//     const factor = cycleFactor(String(subscriptionCycle));
//     if (!factor) return;

//     const addonsTotal = sumAddons(resumeValue, portfolioValue, linkedinValue, githubValue, coursesValue, customValue, badgeValue);
//     const baseTotal = Number(originalTotal || 0);
//     const monthly = Math.max((baseTotal - addonsTotal) / factor, 0);
//     setSubscriptionSaleValue(round2(monthly).toFixed(2));
//     setMonthlyInitialized(true);
//   }, [
//     monthlyInitialized,
//     subscriptionCycle,
//     originalTotal,
//     resumeValue,
//     portfolioValue,
//     linkedinValue,
//     githubValue,
//     coursesValue,
//     customValue,
//     badgeValue,
//   ]);

//   /* ---------- Auto Total = subscription monthly * factor (unchanged) ---------- */
//   const autoTotal = useMemo(() => {
//   if (applicationSaleValue && subscriptionCycle) {
//     return (subscriptionCycle / 30) * applicationSaleValue;
//   }
//   return 0;
// }, [applicationSaleValue, subscriptionCycle]);

// const totalSale = useMemo(() => {
//   const addons = sumAddons(
//     resumeValue,
//     portfolioValue,
//     linkedinValue,
//     githubValue,
//     coursesValue,
//     customValue,
//     badgeValue
//   );
//   return round2(autoTotal + addons);
// }, [
//   autoTotal,
//   resumeValue,
//   portfolioValue,
//   linkedinValue,
//   githubValue,
//   coursesValue,
//   customValue,
//   badgeValue,
// ]);

// // ----- Next Payment Due Date (unchanged, uses date-only) ---------- */
//   useEffect(() => {
//     const days = cycleDays(String(subscriptionCycle));
//     if (!days) {
//       setNextDueDate("");
//       return;
//     }
//     const base = closedAtDate || isoToDateOnly(new Date().toISOString());
//     if (!base) {
//       setNextDueDate("");
//       return;
//     }
//     setNextDueDate(addDaysFromYYYYMMDD(base, days) || "");
//   }, [closedAtDate, subscriptionCycle]);

//   /* ---------- Save handler: update sales_closure and leads.phone ---------- */
//   const handleUpdate = async () => {
//     if (!recordId) {
//       setError("Missing record id to update.");
//       return;
//     }

//     try {
//       setSaving(true);
//       setError(null);

//       // Build payload for sales_closure:
//       const payload: any = {
//         lead_id: leadId as string,
//         lead_name: clientName || null,
//         email: clientEmail || null,
//         company_application_email: companyApplicationEmail || null,
//         payment_mode: paymentMode || null,
//         subscription_cycle: subscriptionCycle ? Number(subscriptionCycle) : null,

//         // TOTAL is still computed from autoTotal + addons (as before)
//         sale_value: Number(totalSale.toFixed(2)),

//         // IMPORTANT: application_sale_value comes from the form (not autoTotal)
//         application_sale_value: safeParseFloatOrNull(applicationSaleValue),

//         finance_status: financeStatus || null,

//         // addons
//         resume_sale_value: safeParseFloatOrNull(resumeValue),
//         portfolio_sale_value: safeParseFloatOrNull(portfolioValue),
//         linkedin_sale_value: safeParseFloatOrNull(linkedinValue),
//         badge_value: safeParseFloatOrNull(badgeValue),
//         github_sale_value: safeParseFloatOrNull(githubValue),
//         courses_sale_value: safeParseFloatOrNull(coursesValue),

//         custom_label: customLabel || null,
//         custom_sale_value: safeParseFloatOrNull(customValue),

//         commitments: commitments || null,
//         no_of_job_applications: safeParseFloatOrNull(no_of_job_applications),

//         // closed_at: store as ISO UTC (midnight)
//         closed_at: dateOnlyToIsoUTC(closedAtDate),
//       };

//       // Update sales_closure
//       const { error: updateError } = await supabase.from("sales_closure").update(payload).eq("id", recordId);
//       if (updateError) throw updateError;

//       // Update leads.phone by business_id (if leadPhone changed)
//       // Note: update is best-effort — surface error if it fails
//       if (leadPhone !== undefined) {
//         const { error: leadUpdateError } = await supabase
//           .from("leads")
//           .update({ phone: leadPhone || null })
//           .eq("business_id", leadId);

//         if (leadUpdateError) {
//           // If leads update fails, we don't rollback the sales_closure change here.
//           // You can add server-side transaction logic if strict ACID across tables is required.
//           console.warn("Updated sales_closure but failed to update lead phone:", leadUpdateError);
//           setError("Saved sale record, but failed to update lead phone.");
//           setSaving(false);
//           return;
//         }
//       }

//       // Success
//       alert("Sale closure and lead phone updated successfully.");
//       router.back();
//     } catch (e: any) {
//       console.error(e);
//       setError(e?.message ?? "Failed to update record(s)");
//     } finally {
//       setSaving(false);
//     }
//   };

//   /* ---------- UI ---------- */
//   return (
//     <DashboardLayout>
//       <div className="p-6 pt-0">
//         <div className="mb-2 flex items-center justify-between">
//           <h1 className="text-2xl font-bold">Edit Sale Close — {leadId}</h1>
//         </div>

//         {loading ? (
//           <Card>
//             <CardContent className="p-6">Loading latest sale record…</CardContent>
//           </Card>
//         ) : error ? (
//           <Card>
//             <CardContent className="p-6 text-red-600">{error}</CardContent>
//           </Card>
//         ) : (
//           <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//             <Card className="lg:col-span-2">
//               <CardHeader>
//                 <CardTitle>🧾 Update Client Sale</CardTitle>
//               </CardHeader>
//               <CardContent className="space-y-6">
//                 {/* Client Details + Phone */}
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                   <div className="border rounded-md p-4 space-y-3">
//                     <Label className="font-semibold">
//                       Client Details <span className="text-red-500">*</span>
//                     </Label>

//                     <Input placeholder="Client Full Name" value={clientName} onChange={(e) => setClientName(e.target.value)} />
//                     <Input placeholder="Client Email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} />
//                     <Input placeholder="Company Application Email PWD: Created@123" value={companyApplicationEmail} onChange={(e) => setCompanyApplicationEmail(e.target.value)} />

//                     {/* Sale Closed At */}
//                     <div className="space-y-1">
//                       <Label>Sale Closed At</Label>
//                       <Input type="date" value={closedAtDate} onChange={(e) => setClosedAtDate(e.target.value)} />
//                     </div>

//                     {/* NEW: Lead Phone (fetched from leads table by business_id = leadId) */}
//                     <div className="space-y-1">
//                       <Label>Lead Phone</Label>
//                       <Input placeholder="Phone" value={leadPhone} onChange={(e) => setLeadPhone(e.target.value)} />
//                       <p className="text-xs text-gray-500">This value is read from leads.business_id and will update the leads table on save.</p>
//                     </div>
//                   </div>

//                   {/* Subscription & Payment Info */}
//                   <div className="border rounded-md p-4 space-y-3">
//                     <Label className="font-semibold">Subscription & Payment Info <span className="text-red-500">*</span></Label>

//                     <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
//                       <div className="md:col-span-3">
//                         <Select value={paymentMode} onValueChange={(v) => setPaymentMode(v as PaymentMode)}>
//                           <SelectTrigger><SelectValue placeholder="Select Payment Mode" /></SelectTrigger>
//                           <SelectContent>
//                             <SelectItem value="UPI">UPI</SelectItem>
//                             <SelectItem value="PayPal">PayPal</SelectItem>
//                             <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
//                             <SelectItem value="Credit/Debit Card">Credit/Debit Card</SelectItem>
//                             <SelectItem value="Stripe">Stripe</SelectItem>
//                             <SelectItem value="Razorpay">Razorpay</SelectItem>
//                             <SelectItem value="Other">Other</SelectItem>
//                           </SelectContent>
//                         </Select>
//                       </div>
// {/* Subscription Cycle */}
// <div className="md:col-span-3">
//   <Select
//     value={String(subscriptionCycle)}
//     onValueChange={(v) => setSubscriptionCycle(Number(v))}
//   >
//     <SelectTrigger>
//       <SelectValue placeholder="Select Subscription Duration" />
//     </SelectTrigger>
//     <SelectContent>
//       <SelectItem value="15">15 Days</SelectItem>
//       <SelectItem value="30">1 Month</SelectItem>
//       <SelectItem value="60">2 Months</SelectItem>
//       <SelectItem value="90">3 Months</SelectItem>
//     </SelectContent>
//   </Select>
// </div>

// {/* Application Sale Value */}
// <div className="md:col-span-3 grid grid-cols-1 gap-2 mt-2">
//   <Label className="text-sm">Application Sale Value (from DB)</Label>
//   <Input
//     type="number"
//     inputMode="decimal"
//     min="0"
//     // step="0.01"
//     value={applicationSaleValue}
//     onChange={(e) =>
//       setApplicationSaleValue(parseFloat(e.target.value) || 0)
//     }
//   />
// </div>

// {/* Auto-calculated */}
// <div className="md:col-span-3 grid grid-cols-1 gap-2 mt-2">
//   <Label className="text-sm">Auto-Calculated Value</Label>
//   <Input type="number" value={autoCalculatedValue} disabled />
//   <p className="text-xs text-gray-500">
//     Always = <code>(subscription_cycle / 30) × application_sale_value</code>
//   </p>
// </div>



//                       <div className="md:col-span-3">
//                         <Input type="number" inputMode="decimal" min="0"  placeholder="No. of applications for month" value={no_of_job_applications} onChange={(e) => set_no_of_job_applications(e.target.value)} />
//                       </div>

//                       <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-3">
//                         <Input value="Sale Closing By" disabled readOnly className="mt-1 text-gray-900 bg-gray-50 disabled:opacity-100 disabled:cursor-default" />
//                         <Input value={closerName || "—"} disabled readOnly className="mt-1 text-gray-900 bg-gray-50 disabled:opacity-100 disabled:cursor-default" style={{ opacity: 1 }} />
//                       </div>
//                     </div>
//                   </div>
//                 </div>

//                 {/* Add-ons (unchanged) */}
//                 <div className="border rounded-md p-4 space-y-3">
//                   <Label className="font-semibold">Optional Add-On Services</Label>
//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                     <Input type="number" inputMode="decimal" min="0"  placeholder="Resume Sale Value ($)" value={resumeValue} onChange={(e) => setResumeValue(e.target.value)} />
//                     <Input type="number" inputMode="decimal" min="0"  placeholder="Portfolio Creation Value ($)" value={portfolioValue} onChange={(e) => setPortfolioValue(e.target.value)} />
//                     <Input type="number" inputMode="decimal" min="0"  placeholder="LinkedIn Optimization Value ($)" value={linkedinValue} onChange={(e) => setLinkedinValue(e.target.value)} />
//                     <Input type="number" inputMode="decimal" min="0"  placeholder="Badge Value ($)" value={badgeValue} onChange={(e) => setBadgeValue(e.target.value)} />

//                     <Input type="number" inputMode="decimal" min="0"  placeholder="GitHub Optimization Value ($)" value={githubValue} onChange={(e) => setGithubValue(e.target.value)} />
//                     <Input type="number" inputMode="decimal" min="0"  placeholder="Courses / Certifications Value ($)" value={coursesValue} onChange={(e) => setCoursesValue(e.target.value)} />
//                     <div className="flex gap-2">
//                       <Input placeholder="Custom Add-on (e.g., Courses)" value={customLabel} onChange={(e) => setCustomLabel(e.target.value)} className="w-1/2" />
//                       <Input type="number" inputMode="decimal" min="0"  placeholder="Custom Add-on Value ($)" value={customValue} onChange={(e) => setCustomValue(e.target.value)} className="w-1/2" />
//                     </div>
//                   </div>

//                   <div className="border rounded-md p-4 space-y-2">
//                     <Label className="font-semibold">Commitments</Label>
//                     <Textarea placeholder="Enter commitments…" value={commitments} onChange={(e) => setCommitments(e.target.value)} />
//                   </div>
//                 </div>

//                 <div className="border rounded-md p-4">
//                   <Label className="font-semibold">Auto Calculated</Label>
//                   <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-2">
//                     <p>Total Sale Value: <strong>${totalSale.toFixed(2)}</strong></p>
//                     <p>Next Payment Due Date: <strong>{nextDueDate || "-"}</strong></p>
//                     <Button className="bg-green-600 text-white hover:bg-green-700" onClick={handleUpdate} disabled={saving}>
//                       {saving ? "Updating..." : "Update"}
//                     </Button>
//                   </div>
//                 </div>
//               </CardContent>
//             </Card>
//           </div>
//         )}
//       </div>
//     </DashboardLayout>
//   );
// }



//app/SaleUpdate/[leadId]/page.tsx
"use client";


import { useSearchParams, useParams } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import NewSaleCloseForm from "@/app/SaleUpdate/[leadId]/NewSaleCloseForm";
import EditSaleCloseForm from "./EditSaleCloseForm";


export default function SaleUpdatePage() {
  const params = useParams<{ leadId: string }>();
  const searchParams = useSearchParams();


  const leadId = params.leadId;
  const mode = searchParams.get("mode") || "edit";


  return (
    <DashboardLayout>
      {mode === "new" ? (
        <NewSaleCloseForm leadId={leadId} />
      ) : (
        <EditSaleCloseForm leadId={leadId} />
      )}
    </DashboardLayout>
  );
}



