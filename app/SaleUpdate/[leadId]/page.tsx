// // app/SaleUpdate/[leadId]/page.tsx
// "use client";

// import { useEffect, useMemo, useState } from "react";
// import { useParams, useRouter } from "next/navigation";
// import { supabase } from "@/utils/supabase/client";

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

// // --- Types matching your DB schema (subset you use) ---
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
//   subscription_cycle: 15 | 30 | 60 | 90 | null;
//   payment_mode: PaymentMode | null;
//   closed_at: string | null;
//   email: string | null;
//   finance_status: FinanceStatus | null;
//   reason_for_close: string | null;
//   resume_sale_value: number | null;
//   portfolio_sale_value: number | null;
//   linkedin_sale_value: number | null;
//   github_sale_value: number | null;
//   lead_name: string | null;
//   onboarded_date: string | null; // date (YYYY-MM-DD)
//   invoice_url: string | null;
//   associates_tl_email: string | null;
//   associates_email: string | null;
//   associates_name: string | null;
//   associates_tl_name: string | null;
//   checkout_date: string | null; // date
//   courses_sale_value: number | null;
//   custom_label: string | null;
//   custom_sale_value: number | null;
//   commitments: string | null;
//   company_application_email: string | null;
// };

// // Helpers
// const num = (v: string | number | null | undefined) =>
//   v === null || v === undefined || v === "" ? null : Number(v);

// export default function SaleUpdatePage() {
//   const { leadId } = useParams<{ leadId: string }>();
//   const router = useRouter();

//   // --- Loading/Error/Record ---
//   const [loading, setLoading] = useState(true);
//   const [saving, setSaving] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [recordId, setRecordId] = useState<string | null>(null);

//   // --- Form state (mapped to your UI) ---
//   const [clientName, setClientName] = useState("");
//   const [clientEmail, setClientEmail] = useState("");
//   const [companyApplicationEmail, setCompanyApplicationEmail] = useState("");
//   // const [closedAt, setClosedAt] = useState<string | null>(null);


//   const [paymentMode, setPaymentMode] = useState<PaymentMode | "">("");
//   const [subscriptionCycle, setSubscriptionCycle] = useState<"15" | "30" | "60" | "90" | "">("");

//   const [subscriptionSaleValue, setSubscriptionSaleValue] = useState<string>(""); // sale_value
//   const [financeStatus, setFinanceStatus] = useState<FinanceStatus | "">("");

//   const [resumeValue, setResumeValue] = useState<string>("");
//   const [portfolioValue, setPortfolioValue] = useState<string>("");
//   const [linkedinValue, setLinkedinValue] = useState<string>("");
//   const [githubValue, setGithubValue] = useState<string>("");
//   const [coursesValue, setCoursesValue] = useState<string>("");

//   const [customLabel, setCustomLabel] = useState<string>("");
//   const [customValue, setCustomValue] = useState<string>("");

//   const [commitments, setCommitments] = useState<string>("");
//   const [saleClosingDate, setsaleClosingDate] = useState<string>(""); // YYYY-MM-DD
//   const [nextDueDate, setNextDueDate] = useState<string>(""); // derived? (you can compute if needed)

//   // You had a "closerName" display-only; not present in schema. Keep optional:
//   const [closerName, setCloserName] = useState<string>("");

//   // --- helpers ---
// const toDateOnly = (iso?: string | null) =>
//   iso ? new Date(iso).toISOString().slice(0, 10) : "";

// // sum of add-ons
// const sumAddons = (...vals: (string | number | null | undefined)[]) =>
//   vals.reduce((acc, v) => acc + (Number(v || 0) || 0), 0);

// // --- state ---
// const [originalTotal, setOriginalTotal] = useState<number>(0);   // DB total (contract) if that's what sale_value holds now
// const [saleValueTouched, setSaleValueTouched] = useState(false); // avoid overwriting user typing


// // replace BOTH of your date states with just this one:
// const [closedAt, setClosedAt] = useState<string | null>(null);

//   // Auto totals
// //   const autoTotal = useMemo(() => {
// //     const base = Number(subscriptionSaleValue || 0);
// //     return base;
// //   }, [subscriptionSaleValue]);

//   const cycleFactor = (cycle: string | ""): number => {
//   switch (cycle) {
//     case "15": return 0.5;
//     case "30": return 1;
//     case "60": return 2;
//     case "90": return 3;
//     default:   return 0; // no cycle selected
//   }
// };

// const cycleDays = (cycle: string | ""): number => {
//   switch (cycle) {
//     case "15": return 15;
//     case "30": return 30;
//     case "60": return 60;
//     case "90": return 90;
//     default:   return 0;
//   }
// };

// const addDays = (isoDate: string, days: number): string => {
//   const d = new Date(isoDate);
//   if (Number.isNaN(d.getTime())) return ""; // invalid -> blank
//   d.setDate(d.getDate() + days);
//   // format YYYY-MM-DD
//   const y = d.getFullYear();
//   const m = String(d.getMonth() + 1).padStart(2, "0");
//   const dd = String(d.getDate()).padStart(2, "0");
//   return `${y}-${m}-${dd}`;
// };

// const autoTotal = useMemo(() => {
//   const base = Number(subscriptionSaleValue || 0);
//   return base * cycleFactor(subscriptionCycle);
// }, [subscriptionSaleValue, subscriptionCycle]);


// const totalSale = useMemo(() => {
//   return (
//     Number(autoTotal || 0) +                // <-- use autoTotal here
//     Number(resumeValue || 0) +
//     Number(portfolioValue || 0) +
//     Number(linkedinValue || 0) +
//     Number(githubValue || 0) +
//     Number(coursesValue || 0) +
//     Number(customValue || 0)
//   );
// }, [
//   autoTotal,            // <-- include autoTotal
//   resumeValue,
//   portfolioValue,
//   linkedinValue,
//   githubValue,
//   coursesValue,
//   customValue,
// ]);


//   // --- Fetch latest record on mount ---
//   useEffect(() => {
//     let mounted = true;
//     (async () => {
//       try {
//         setLoading(true);
//         setError(null);

//         const { data, error } = await supabase
//           .from("sales_closure")
//           .select("*")
//           .eq("lead_id", leadId)
//           .order("closed_at", { ascending: false, nullsFirst: false })
//           .limit(1)
//           .maybeSingle<SalesClosureRow>();

//         if (error) throw error;

//         if (!data) {
//           setError(`No sales_closure found for lead_id=${leadId}`);
//           return;
//         }

//         if (!mounted) return;

//         // keep the row id for updating
//         setRecordId(data.id);

//      setFinanceStatus((data.finance_status as FinanceStatus) ?? "");
// setClientName(data.lead_name ?? "");
// setClientEmail(data.email ?? "");
// setCompanyApplicationEmail(data.company_application_email ?? "");
//         setCompanyApplicationEmail(data.company_application_email ?? "");

//         setPaymentMode((data.payment_mode as PaymentMode) ?? "");
//         setSubscriptionCycle(data.subscription_cycle ? String(data.subscription_cycle) as "15" | "30" | "60" | "90" : "");

//         // setSubscriptionSaleValue(data.sale_value?.toString() ?? "");

//         // cycle
// setSubscriptionCycle(
//   data.subscription_cycle ? (String(data.subscription_cycle) as "15" | "30" | "60" | "90") : ""
// );

//         // setFinanceStatus((data.finance_status as FinanceStatus) ?? "");

//         // keep the row id
// setRecordId(data.id);

// // capture DB "total" into state (per your current data)
// setOriginalTotal(Number(data.sale_value || 0));

//         setResumeValue(data.resume_sale_value?.toString() ?? "");
//         setPortfolioValue(data.portfolio_sale_value?.toString() ?? "");
//         setLinkedinValue(data.linkedin_sale_value?.toString() ?? "");
//         setGithubValue(data.github_sale_value?.toString() ?? "");
//         setCoursesValue(data.courses_sale_value?.toString() ?? "");

//         setCustomLabel(data.custom_label ?? "");
//         setCustomValue(data.custom_sale_value?.toString() ?? "");

//         setCommitments(data.commitments ?? "");
//       // dates
// setClosedAt(data.closed_at ?? null);

// // closer (optional)
// // setCloserName(data.associates_name || "");


//         // setOnboardingDate(data.onboarded_date ?? "");

//         // optional, if you compute due date elsewhere:
//         setNextDueDate("");

//         // closerName is display-only; set from associates_name if you want:
//         // setCloserName(data.associates_name || "");
//       } catch (e: any) {
//         setError(e?.message ?? "Failed to load record");
//       } finally {
//         setLoading(false);
//       }
//     })();
//     return () => {
//       mounted = false;
//     };
//   }, [leadId]);

//   useEffect(() => {
//   const days = cycleDays(subscriptionCycle);
//   const baseDateISO =
//     closedAt ??
//     new Date().toISOString(); // fallback to today if closed_at is null

//   if (!days || !baseDateISO) {
//     setNextDueDate("");
//     return;
//   }

//   // If closedAt is timestamp with time, trim to date for nicer display
//   const baseISODateOnly = (baseDateISO || "").slice(0, 10); // YYYY-MM-DD
//   const next = addDays(baseISODateOnly, days);
//   setNextDueDate(next || "");
// }, [closedAt, subscriptionCycle]);


// // Recompute MONTHLY if user hasn't manually typed into the field.
// // monthly = (originalTotal - addonsTotal) / factor
// useEffect(() => {
//   if (saleValueTouched) return;

//   const factor = cycleFactor(subscriptionCycle);
//   if (!factor) {
//     // no cycle selected – show 0 to avoid divide-by-zero confusion
//     setSubscriptionSaleValue("0");
//     return;
//   }

//   const addonsTotal = sumAddons(
//     resumeValue,
//     portfolioValue,
//     linkedinValue,
//     githubValue,
//     coursesValue,
//     customValue
//   );

//   const baseTotal = Number(originalTotal || 0);
//   const monthly = Math.max((baseTotal - addonsTotal) / factor, 0); // no negatives
//   setSubscriptionSaleValue(monthly.toFixed(2));
// }, [
//   originalTotal,
//   resumeValue,
//   portfolioValue,
//   linkedinValue,
//   githubValue,
//   coursesValue,
//   customValue,
//   subscriptionCycle,
//   saleValueTouched, // to avoid overwriting when user edits manually
// ]);



//   // --- Submit handler -> UPDATE the same record ---
//   const handleUpdate = async () => {
//     if (!recordId) {
//       setError("Missing record id to update.");
//       return;
//     }
//     try {
//       setSaving(true);
//       setError(null);

//       const payload = {
//         // identity
//         lead_id: leadId as string,

//         // main
//         lead_name: clientName || null,
//         email: clientEmail || null,
//         company_application_email: companyApplicationEmail || null,

//         payment_mode: paymentMode || null,
//         subscription_cycle: subscriptionCycle ? Number(subscriptionCycle) : null,

//         sale_value: num(subscriptionSaleValue),
//         finance_status: financeStatus || null,

//         resume_sale_value: num(resumeValue),
//         portfolio_sale_value: num(portfolioValue),
//         linkedin_sale_value: num(linkedinValue),
//         github_sale_value: num(githubValue),
//         courses_sale_value: num(coursesValue),

//         custom_label: customLabel || null,
//         custom_sale_value: num(customValue),

//         commitments: commitments || null,
//         closed_at : saleClosingDate || null,
//         // onboarded_date: onboardingDate || null,

//         // you can also set checkout_date, invoice_url, etc. if needed
//       };

//       const { error } = await supabase
//         .from("sales_closure")
//         .update(payload)
//         .eq("id", recordId);

//       if (error) throw error;

//       // Optional: navigate back or toast
//       // router.push("/leads"); // or stay here
//       alert("Sale closure updated successfully.");
//     } catch (e: any) {
//       setError(e?.message ?? "Failed to update record");
//     } finally {
//       setSaving(false);
//     }
//   };

//   return (
//     <div className="p-6">
//       <div className="mb-4 flex items-center justify-between">
//         <h1 className="text-2xl font-bold">Edit Sale Close — {leadId}</h1>
//         <Button variant="outline" onClick={() => router.back()}>
//           Back
//         </Button>
//       </div>

//       {loading ? (
//         <Card>
//           <CardContent className="p-6">Loading latest sale record…</CardContent>
//         </Card>
//       ) : error ? (
//         <Card>
//           <CardContent className="p-6 text-red-600">{error}</CardContent>
//         </Card>
//       ) : (
//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//           {/* LEFT: Main Onboarding Form */}
//           <Card className="lg:col-span-2">
//             <CardHeader>
//               <CardTitle>🧾 Update Client Sale</CardTitle>
//             </CardHeader>
//             <CardContent className="space-y-6">
//               {/* Client Details */}
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <div className="border rounded-md p-4 space-y-3">
//                   <Label className="font-semibold">
//                     Client Details <span className="text-red-500">*</span>
//                   </Label>

//                   <Input
//                     placeholder="Client Full Name"
//                     value={clientName}
//                     onChange={(e) => setClientName(e.target.value)}
//                   />
//                   <Input
//                     placeholder="Client Email"
//                     value={clientEmail}
//                     onChange={(e) => setClientEmail(e.target.value)}
//                   />
//                   <Input
//                     placeholder="Company Application Email PWD: Created@123"
//                     value={companyApplicationEmail}
//                     onChange={(e) => setCompanyApplicationEmail(e.target.value)}
//                   />
//                   {/* You had phone in UI, but sales_closure schema doesn't have a phone column.
//                       Keep it in your leads table instead or add column if required. */}
//                   <Input
//                     placeholder="City (optional/local UI only)"
//                     // no DB mapping shown in schema
//                     onChange={() => {}}
//                   />
//                   <Input
//                     type="date"
//                     value={saleClosingDate || ""}
//                     onChange={(e) => setClosedAt(e.target.value)}
//                     placeholder="dd-mm-yyyy"
//                   />
//                 </div>

//                 {/* Subscription & Payment Info */}
//                 <div className="border rounded-md p-4 space-y-3">
//                   <Label className="font-semibold">
//                     Subscription & Payment Info <span className="text-red-500">*</span>
//                   </Label>

//                   <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
//                     <div className="md:col-span-3">
//                       <Select value={paymentMode} onValueChange={(v) => setPaymentMode(v as PaymentMode)}>
//                         <SelectTrigger>
//                           <SelectValue placeholder="Select Payment Mode" />
//                         </SelectTrigger>
//                         <SelectContent>
//                           <SelectItem value="UPI">UPI</SelectItem>
//                           <SelectItem value="PayPal">PayPal</SelectItem>
//                           <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
//                           <SelectItem value="Credit/Debit Card">Credit/Debit Card</SelectItem>
//                           <SelectItem value="Stripe">Stripe</SelectItem>
//                           <SelectItem value="Razorpay">Razorpay</SelectItem>
//                           <SelectItem value="Other">Other</SelectItem>
//                         </SelectContent>
//                       </Select>
//                     </div>

//                     <div className="md:col-span-3">
//                       <Select
//                         value={subscriptionCycle}
//                         onValueChange={(v) => setSubscriptionCycle(v as "15" | "30" | "60" | "90")}
//                       >
//                         <SelectTrigger>
//                           <SelectValue placeholder="Select Subscription Duration" />
//                         </SelectTrigger>
//                         <SelectContent>
//                           <SelectItem value="15">15 Days</SelectItem>
//                           <SelectItem value="30">1 Month</SelectItem>
//                           <SelectItem value="60">2 Months</SelectItem>
//                           <SelectItem value="90">3 Months</SelectItem>
//                         </SelectContent>
//                       </Select>
//                     </div>

//                    <div className="md:col-span-3 grid grid-cols-2 gap-3">
//   <Input
//     type="number"
//     inputMode="decimal"
//     min="0"
//     step="0.01"
//     placeholder="Subscription Sale Value ($) — monthly"
//     value={subscriptionSaleValue}
//     onChange={(e) => setSubscriptionSaleValue(e.target.value)}
//   />
//   <Input
//     placeholder="Auto Total (Subscription Only)"
//     value={autoTotal.toFixed(2)}
//     disabled
//   />
// </div>


//                     {/* Finance status (you had it in schema; add to UI if needed) */}
//                     <div className="md:col-span-3">
//                       <Select
//                         value={financeStatus}
//                         onValueChange={(v) => setFinanceStatus(v as FinanceStatus)}
//                       >
//                         <SelectTrigger>
//                           <SelectValue placeholder="Finance Status" />
//                         </SelectTrigger>
//                         <SelectContent>
//                           <SelectItem value="Paid">Paid</SelectItem>
//                           <SelectItem value="Unpaid">Unpaid</SelectItem>
//                           <SelectItem value="Paused">Paused</SelectItem>
//                           <SelectItem value="Closed">Closed</SelectItem>
//                           <SelectItem value="Got Placed">Got Placed</SelectItem>
//                         </SelectContent>
//                       </Select>
//                     </div>

//                     {/* Closer display-only (optional) */}
//                     <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-3">
//                       <Input
//                         value="Sale Closing By"
//                         disabled
//                         readOnly
//                         className="mt-1 text-gray-900 bg-gray-50 disabled:opacity-100 disabled:cursor-default"
//                       />
//                       <Input
//                         value={closerName || "—"}
//                         disabled
//                         readOnly
//                         className="mt-1 text-gray-900 bg-gray-50 disabled:opacity-100 disabled:cursor-default"
//                         style={{ opacity: 1 }}
//                       />
//                     </div>
//                   </div>
//                 </div>
//               </div>

//               {/* Add-on Services */}
//               <div className="border rounded-md p-4 space-y-3">
//                 <Label className="font-semibold">Optional Add-On Services</Label>
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                   <Input
//                     type="number"
//                     inputMode="decimal"
//                     min="0"
//                     step="0.01"
//                     placeholder="Resume Sale Value ($)"
//                     value={resumeValue}
//                     onChange={(e) => setResumeValue(e.target.value)}
//                   />
//                   <Input
//                     type="number"
//                     inputMode="decimal"
//                     min="0"
//                     step="0.01"
//                     placeholder="Portfolio Creation Value ($)"
//                     value={portfolioValue}
//                     onChange={(e) => setPortfolioValue(e.target.value)}
//                   />
//                   <Input
//                     type="number"
//                     inputMode="decimal"
//                     min="0"
//                     step="0.01"
//                     placeholder="LinkedIn Optimization Value ($)"
//                     value={linkedinValue}
//                     onChange={(e) => setLinkedinValue(e.target.value)}
//                   />
//                   <Input
//                     type="number"
//                     inputMode="decimal"
//                     min="0"
//                     step="0.01"
//                     placeholder="GitHub Optimization Value ($)"
//                     value={githubValue}
//                     onChange={(e) => setGithubValue(e.target.value)}
//                   />
//                   <Input
//                     type="number"
//                     inputMode="decimal"
//                     min="0"
//                     step="0.01"
//                     placeholder="Courses / Certifications Value ($)"
//                     value={coursesValue}
//                     onChange={(e) => setCoursesValue(e.target.value)}
//                   />
//                   <div className="flex gap-2">
//                     <Input
//                       placeholder="Custom Add-on (e.g., Courses)"
//                       value={customLabel}
//                       onChange={(e) => setCustomLabel(e.target.value)}
//                       className="w-1/2"
//                     />
//                     <Input
//                       type="number"
//                       inputMode="decimal"
//                       min="0"
//                       step="0.01"
//                       placeholder="Custom Add-on Value ($)"
//                       value={customValue}
//                       onChange={(e) => setCustomValue(e.target.value)}
//                       className="w-1/2"
//                     />
//                   </div>
//                 </div>

//                 {/* Commitments */}
//                 <div className="border rounded-md p-4 space-y-2">
//                   <Label className="font-semibold">Commitments</Label>
//                   <Textarea
//                     placeholder="Enter commitments…"
//                     value={commitments}
//                     onChange={(e) => setCommitments(e.target.value)}
//                   />
//                 </div>
//               </div>

//               {/* Auto Calculated + Submit */}
//               <div className="border rounded-md p-4">
//                 <Label className="font-semibold">Auto Calculated</Label>
//                 <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-2">
//                   <p>
//                     Total Sale Value: <strong>${totalSale.toFixed(2)}</strong>
//                   </p>
//                   <p>
//                     Next Payment Due Date: <strong>{nextDueDate || "-"}</strong>
//                   </p>
//                   <Button
//                     className="bg-green-600 text-white hover:bg-green-700"
//                     onClick={handleUpdate}
//                     disabled={saving}
//                   >
//                     {saving ? "Updating..." : "Update"}
//                   </Button>
//                 </div>
//               </div>
//             </CardContent>
//           </Card>

//           {/* RIGHT: Quick Lead Info (unchanged UI shell; you can wire it if needed) */}
//           <Card className="lg:col-span-1">
//             <CardHeader>
//               <CardTitle>Quick Lead Info</CardTitle>
//             </CardHeader>
//             <CardContent>
//               <p className="text-sm text-gray-500">
//                 (Optional) Keep your existing quick search widget here.
//               </p>
//             </CardContent>
//           </Card>
//         </div>
//       )}
//     </div>
//   );
// }


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

// // --- Types matching your DB schema (subset you use) ---
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
//   sale_value: number | null; // we treat this as TOTAL stored in DB
//   application_sale_value: number | null;
//   subscription_cycle: 15 | 30 | 60 | 90 | null;
//   payment_mode: PaymentMode | null;
//   closed_at: string | null;
//   email: string | null;
//   finance_status: FinanceStatus | null;
//   reason_for_close: string | null;
//   resume_sale_value: number | null;
//   portfolio_sale_value: number | null;
//   linkedin_sale_value: number | null;
//   github_sale_value: number | null;
//   lead_name: string | null;
//   onboarded_date: string | null;
//   invoice_url: string | null;
//   associates_tl_email: string | null;
//   associates_email: string | null;
//   associates_name: string | null;
//   associates_tl_name: string | null;
//   checkout_date: string | null;
//   courses_sale_value: number | null;
//   custom_label: string | null;
//   custom_sale_value: number | null;
//   commitments: string | null;
//   company_application_email: string | null;
//   no_of_job_applications: number | null;
// };

// // ---------- Helpers ----------
// const num = (v: string | number | null | undefined) =>
//   v === null || v === undefined || v === "" ? null : Number(v);

// const toDateOnly = (iso?: string | null) =>
//   iso ? new Date(iso).toISOString().slice(0, 10) : "";

// const sumAddons = (...vals: (string | number | null | undefined)[]) =>
//   vals.reduce((acc: number, v) => acc + (Number(v) || 0), 0);

// const round2 = (x: number) => Math.round((Number.isFinite(x) ? x : 0) * 100) / 100;

// const cycleFactor = (cycle: string | ""): number => {
//   switch (cycle) {
//     case "15": return 0.5;
//     case "30": return 1;
//     case "60": return 2;
//     case "90": return 3;
//     default:   return 0;
//   }
// };

// const cycleDays = (cycle: string | ""): number => {
//   switch (cycle) {
//     case "15": return 15;
//     case "30": return 30;
//     case "60": return 60;
//     case "90": return 90;
//     default:   return 0;
//   }
// };

// const addDays = (isoDate: string, days: number): string => {
//   const d = new Date(isoDate);
//   if (Number.isNaN(d.getTime())) return "";
//   d.setDate(d.getDate() + days);
//   const y = d.getFullYear();
//   const m = String(d.getMonth() + 1).padStart(2, "0");
//   const dd = String(d.getDate()).padStart(2, "0");
//   return `${y}-${m}-${dd}`;
// };

// // ---------- Component ----------
// export default function SaleUpdatePage() {
//   const { leadId } = useParams<{ leadId: string }>();
//   const router = useRouter();

//   // --- Loading/Error/Record ---
//   const [loading, setLoading] = useState(true);
//   const [saving, setSaving] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [recordId, setRecordId] = useState<string | null>(null);

//   // --- Form state ---
//   const [clientName, setClientName] = useState("");
//   const [clientEmail, setClientEmail] = useState("");
//   const [companyApplicationEmail, setCompanyApplicationEmail] = useState("");

//   const [paymentMode, setPaymentMode] = useState<PaymentMode | "">("");
//   const [subscriptionCycle, setSubscriptionCycle] = useState<"15" | "30" | "60" | "90" | "">("");

//   // Displayed monthly subscription (we keep it STABLE unless the user edits it)
//   const [subscriptionSaleValue, setSubscriptionSaleValue] = useState<string>(""); // monthly
//   const [monthlyInitialized, setMonthlyInitialized] = useState(false); // after initial compute, lock it

//   const [financeStatus, setFinanceStatus] = useState<FinanceStatus | "">("");

//   const [resumeValue, setResumeValue] = useState<string>("");
//   const [portfolioValue, setPortfolioValue] = useState<string>("");
//   const [linkedinValue, setLinkedinValue] = useState<string>("");
//   const [githubValue, setGithubValue] = useState<string>("");
//   const [coursesValue, setCoursesValue] = useState<string>("");

//   const [customLabel, setCustomLabel] = useState<string>("");
//   const [customValue, setCustomValue] = useState<string>("");
//   const [no_of_job_applications, set_no_of_job_applications] = useState<string>("");
//   const [commitments, setCommitments] = useState<string>("");

//   // Dates
//   const [closedAt, setClosedAt] = useState<string | null>(null); // ISO string (UTC)
//   const [nextDueDate, setNextDueDate] = useState<string>("");

//   // Display-only
//   const [closerName, setCloserName] = useState<string>("");

//   // We treat `sale_value` in DB as the TOTAL contract value
//   const [originalTotal, setOriginalTotal] = useState<number>(0);
//   const [applicationSaleValue, setApplicationSaleValue] = useState<number>(0);

//   // --- Fetch latest record on mount ---
//   useEffect(() => {
//     let mounted = true;

//     (async () => {
//       try {
//         setLoading(true);
//         setError(null);

//         const { data, error } = await supabase
//           .from("sales_closure")
//           .select("*")
//           .eq("lead_id", leadId)
//           .order("closed_at", { ascending: false, nullsFirst: false })
//           .limit(1)
//           .maybeSingle<SalesClosureRow>();

//         if (error) throw error;
//         if (!data) {
//           setError(`No sales_closure found for lead_id=${leadId}`);
//           return;
//         }
//         if (!mounted) return;

//         // record id
//         setRecordId(data.id);

//         // total from DB
//         setOriginalTotal(Number(data.sale_value || 0));
//         setApplicationSaleValue(Number(data.application_sale_value || 0));

//         // map addons
//         setResumeValue(data.resume_sale_value?.toString() ?? "");
//         setPortfolioValue(data.portfolio_sale_value?.toString() ?? "");
//         setLinkedinValue(data.linkedin_sale_value?.toString() ?? "");
//         setGithubValue(data.github_sale_value?.toString() ?? "");
//         setCoursesValue(data.courses_sale_value?.toString() ?? "");
//         setCustomLabel(data.custom_label ?? "");
//         setCustomValue(data.custom_sale_value?.toString() ?? "");

//         // meta
//         setFinanceStatus((data.finance_status as FinanceStatus) ?? "");
//         setPaymentMode((data.payment_mode as PaymentMode) ?? "");         // <-- FIX: show payment mode
//         setCommitments(data.commitments ?? "");                            // <-- FIX: show commitments
//         setClientName(data.lead_name ?? "");
//         setClientEmail(data.email ?? "");
//         setCompanyApplicationEmail(data.company_application_email ?? "");
//         set_no_of_job_applications(data.no_of_job_applications?.toString() || "");

//         // cycle
//         setSubscriptionCycle(
//           data.subscription_cycle
//             ? (String(data.subscription_cycle) as "15" | "30" | "60" | "90")
//             : ""
//         );

//         // dates
//         setClosedAt(data.closed_at ?? null);

//         // closer
//         setCloserName(data.associates_name || "");

//         // We'll compute monthly ONCE after all fields are in place
//         setMonthlyInitialized(false);
//       } catch (e: any) {
//         setError(e?.message ?? "Failed to load record");
//       } finally {
//         setLoading(false);
//       }
//     })();

//     return () => {
//       mounted = false;
//     };
//   }, [leadId]);

//   // --- INITIAL monthly = (TOTAL - ADDONS) / factor, then LOCK it (won't change on add-on edits)
//   useEffect(() => {
//     if (monthlyInitialized) return;

//     const factor = cycleFactor(subscriptionCycle);
//     if (!factor) return; // wait until cycle is known

//     const addonsTotal = sumAddons(
//       resumeValue,
//       portfolioValue,
//       linkedinValue,
//       githubValue,
//       coursesValue,
//       customValue
//     );

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
//   ]);

//   // --- Auto Total (Subscription Only) ---
//   const autoTotal = useMemo(() => {
//     return round2(Number(subscriptionSaleValue || 0) * cycleFactor(subscriptionCycle));
//   }, [subscriptionSaleValue, subscriptionCycle]);

//   // --- Total Sale Value (display) = autoTotal + addons (MONTHLY remains stable) ---
//   const totalSale = useMemo(() => {
//     const addons = sumAddons(
//       resumeValue,
//       portfolioValue,
//       linkedinValue,
//       githubValue,
//       coursesValue,
//       customValue
//     );
//     return round2(Number(autoTotal || 0) + addons);
//   }, [
//     autoTotal,
//     resumeValue,
//     portfolioValue,
//     linkedinValue,
//     githubValue,
//     coursesValue,
//     customValue,
//   ]);

//   // --- Next Payment Due Date = closed_at + cycleDays (fallback: today) ---
//   useEffect(() => {
//     const days = cycleDays(subscriptionCycle);
//     const base = closedAt ?? new Date().toISOString();
//     if (!days || !base) {
//       setNextDueDate("");
//       return;
//     }
//     const next = addDays(toDateOnly(base), days);
//     setNextDueDate(next || "");
//   }, [closedAt, subscriptionCycle]);

//   // --- Submit handler -> UPDATE same record ---
//   const handleUpdate = async () => {
//     if (!recordId) {
//       setError("Missing record id to update.");
//       return;
//     }

//     try {
//       setSaving(true);
//       setError(null);

//       const payload = {
//         lead_id: leadId as string,

//         // main identifiers
//         lead_name: clientName || null,
//         email: clientEmail || null,
//         company_application_email: companyApplicationEmail || null,

//         payment_mode: paymentMode || null,
//         subscription_cycle: subscriptionCycle ? Number(subscriptionCycle) : null,

//         // Save TOTAL to DB
//    sale_value: Number(totalSale.toFixed(2)),
// application_sale_value: Number(autoTotal.toFixed(2)),

//         finance_status: financeStatus || null,

//         // addons
//         resume_sale_value: num(resumeValue),
//         portfolio_sale_value: num(portfolioValue),
//         linkedin_sale_value: num(linkedinValue),
//         github_sale_value: num(githubValue),
//         courses_sale_value: num(coursesValue),

//         custom_label: customLabel || null,
//         custom_sale_value: num(customValue),

//         commitments: commitments || null,
//         no_of_job_applications: num(no_of_job_applications),

//         // dates
//         closed_at: closedAt || null,
//       };

//       const { error } = await supabase.from("sales_closure").update(payload).eq("id", recordId);
//       if (error) throw error;

//       alert("Sale closure updated successfully.");
//     } catch (e: any) {
//       setError(e?.message ?? "Failed to update record");
//     } finally {
//       setSaving(false);
//     }
//   };

//   // ---------- UI ----------
//   return (
//       <DashboardLayout>
//     <div className="p-6 pt-0">
//       <div className="mb-2 flex items-center justify-between">
//         <h1 className="text-2xl font-bold">Edit Sale Close — {leadId}</h1>
//         {/* <Button variant="outline" onClick={() => router.back()}>
//           Back
//         </Button> */}
//       </div>

//       {loading ? (
//         <Card>
//           <CardContent className="p-6">Loading latest sale record…</CardContent>
//         </Card>
//       ) : error ? (
//         <Card>
//           <CardContent className="p-6 text-red-600">{error}</CardContent>
//         </Card>
//       ) : (
//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//           {/* LEFT: Main Form */}
//           <Card className="lg:col-span-2">
//             <CardHeader>
//               <CardTitle>🧾 Update Client Sale</CardTitle>
//             </CardHeader>
//             <CardContent className="space-y-6">
//               {/* Client Details */}
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <div className="border rounded-md p-4 space-y-3">
//                   <Label className="font-semibold">
//                     Client Details <span className="text-red-500">*</span>
//                   </Label>

//                   <Input
//                     placeholder="Client Full Name"
//                     value={clientName}
//                     onChange={(e) => setClientName(e.target.value)}
//                   />
//                   <Input
//                     placeholder="Client Email"
//                     value={clientEmail}
//                     onChange={(e) => setClientEmail(e.target.value)}
//                   />
//                   <Input
//                     placeholder="Company Application Email PWD: Created@123"
//                     value={companyApplicationEmail}
//                     onChange={(e) => setCompanyApplicationEmail(e.target.value)}
//                   />

//                   {/* Sale Closed At */}
//                   <div className="space-y-1">
//                     <Label>Sale Closed At</Label>
//                     <Input
//                       type="date"
//                       value={toDateOnly(closedAt)}
//                       onChange={(e) =>
//                         setClosedAt(e.target.value ? new Date(e.target.value).toISOString() : null)
//                       }
//                     />
//                   </div>
//                 </div>

//                 {/* Subscription & Payment Info */}
//                 <div className="border rounded-md p-4 space-y-3">
//                   <Label className="font-semibold">
//                     Subscription & Payment Info <span className="text-red-500">*</span>
//                   </Label>

//                   <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
//                     {/* Payment Mode */}
//                     <div className="md:col-span-3">
//                       <Select
//                         value={paymentMode}
//                         onValueChange={(v) => setPaymentMode(v as PaymentMode)}
//                       >
//                         <SelectTrigger>
//                           <SelectValue placeholder="Select Payment Mode" />
//                         </SelectTrigger>
//                         <SelectContent>
//                           <SelectItem value="UPI">UPI</SelectItem>
//                           <SelectItem value="PayPal">PayPal</SelectItem>
//                           <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
//                           <SelectItem value="Credit/Debit Card">Credit/Debit Card</SelectItem>
//                           <SelectItem value="Stripe">Stripe</SelectItem>
//                           <SelectItem value="Razorpay">Razorpay</SelectItem>
//                           <SelectItem value="Other">Other</SelectItem>
//                         </SelectContent>
//                       </Select>
//                     </div>

//                     {/* Subscription Cycle */}
//                     <div className="md:col-span-3">
//                       <Select
//                         value={subscriptionCycle}
//                         onValueChange={(v) => {
//                           setSubscriptionCycle(v as "15" | "30" | "60" | "90");
//                           // We keep monthly STABLE; if you want to re-derive monthly on cycle change,
//                           // setMonthlyInitialized(false) here instead.
//                         }}
//                       >
//                         <SelectTrigger>
//                           <SelectValue placeholder="Select Subscription Duration" />
//                         </SelectTrigger>
//                         <SelectContent>
//                           <SelectItem value="15">15 Days</SelectItem>
//                           <SelectItem value="30">1 Month</SelectItem>
//                           <SelectItem value="60">2 Months</SelectItem>
//                           <SelectItem value="90">3 Months</SelectItem>
//                         </SelectContent>
//                       </Select>
//                     </div>

//                     {/* Subscription monthly (stable), and auto total box */}
//                     <div className="md:col-span-3 grid grid-cols-2 gap-3">
//                       <div>
//                         <Input
//                           type="number"
//                           inputMode="decimal"
//                           min="0"
//                           step="0.01"
//                           placeholder="Subscription Sale Value ($) — monthly"
//                           value={subscriptionSaleValue}
//                           onChange={(e) => {
//                             // user explicitly changes monthly
//                             setSubscriptionSaleValue(e.target.value);
//                           }}
//                         />
//                         <p className="text-xs text-gray-500 mt-1">
//                           Monthly stays stable when add-ons change.
//                         </p>
//                       </div>

//                       <Input
//                         placeholder="Auto Total (Subscription Only)"
//                         value={autoTotal.toFixed(2)}
//                         disabled
//                       />
//                     </div>

//                     {/* Finance status */}
//                     <div className="md:col-span-3">
//                       {/* <Select
//                         value={financeStatus}
//                         onValueChange={(v) => setFinanceStatus(v as FinanceStatus)}
//                       >
//                         <SelectTrigger>
//                           <SelectValue placeholder="Finance Status" />
//                         </SelectTrigger>
//                         <SelectContent>
//                           <SelectItem value="Paid">Paid</SelectItem>
//                           <SelectItem value="Unpaid">Unpaid</SelectItem>
//                           <SelectItem value="Paused">Paused</SelectItem>
//                           <SelectItem value="Closed">Closed</SelectItem>
//                           <SelectItem value="Got Placed">Got Placed</SelectItem>
//                         </SelectContent>
//                       </Select> */}

//                       <Input
//                     type="number"
//                     inputMode="decimal"
//                     min="0"
//                     step="0.01"
//                     placeholder="No. of applications for month"
//                     value={no_of_job_applications}
//                     onChange={(e) => set_no_of_job_applications(e.target.value)}
//                   />
//                     </div>

//                     {/* Closer display-only (optional) */}
//                     <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-3">
//                       <Input
//                         value="Sale Closing By"
//                         disabled
//                         readOnly
//                         className="mt-1 text-gray-900 bg-gray-50 disabled:opacity-100 disabled:cursor-default"
//                       />
//                       <Input
//                         value={closerName || "—"}
//                         disabled
//                         readOnly
//                         className="mt-1 text-gray-900 bg-gray-50 disabled:opacity-100 disabled:cursor-default"
//                         style={{ opacity: 1 }}
//                       />
//                     </div>
//                   </div>
//                 </div>
//               </div>

//               {/* Add-on Services */}
//               <div className="border rounded-md p-4 space-y-3">
//                 <Label className="font-semibold">Optional Add-On Services</Label>
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                   <Input
//                     type="number"
//                     inputMode="decimal"
//                     min="0"
//                     step="0.01"
//                     placeholder="Resume Sale Value ($)"
//                     value={resumeValue}
//                     onChange={(e) => setResumeValue(e.target.value)}
//                   />
//                   <Input
//                     type="number"
//                     inputMode="decimal"
//                     min="0"
//                     step="0.01"
//                     placeholder="Portfolio Creation Value ($)"
//                     value={portfolioValue}
//                     onChange={(e) => setPortfolioValue(e.target.value)}
//                   />
//                   <Input
//                     type="number"
//                     inputMode="decimal"
//                     min="0"
//                     step="0.01"
//                     placeholder="LinkedIn Optimization Value ($)"
//                     value={linkedinValue}
//                     onChange={(e) => setLinkedinValue(e.target.value)}
//                   />
//                   <Input
//                     type="number"
//                     inputMode="decimal"
//                     min="0"
//                     step="0.01"
//                     placeholder="GitHub Optimization Value ($)"
//                     value={githubValue}
//                     onChange={(e) => setGithubValue(e.target.value)}
//                   />
//                   <Input
//                     type="number"
//                     inputMode="decimal"
//                     min="0"
//                     step="0.01"
//                     placeholder="Courses / Certifications Value ($)"
//                     value={coursesValue}
//                     onChange={(e) => setCoursesValue(e.target.value)}
//                   />
//                   <div className="flex gap-2">
//                     <Input
//                       placeholder="Custom Add-on (e.g., Courses)"
//                       value={customLabel}
//                       onChange={(e) => setCustomLabel(e.target.value)}
//                       className="w-1/2"
//                     />
//                     <Input
//                       type="number"
//                       inputMode="decimal"
//                       min="0"
//                       step="0.01"
//                       placeholder="Custom Add-on Value ($)"
//                       value={customValue}
//                       onChange={(e) => setCustomValue(e.target.value)}
//                       className="w-1/2"
//                     />
//                   </div>
//                 </div>

//                 {/* Commitments */}
//                 <div className="border rounded-md p-4 space-y-2">
//                   <Label className="font-semibold">Commitments</Label>
//                   <Textarea
//                     placeholder="Enter commitments…"
//                     value={commitments}
//                     onChange={(e) => setCommitments(e.target.value)}
//                   />
//                 </div>
//               </div>

//               {/* Auto Calculated + Submit */}
//               <div className="border rounded-md p-4">
//                 <Label className="font-semibold">Auto Calculated</Label>
//                 <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-2">
//                   <p>
//                     Total Sale Value: <strong>${totalSale.toFixed(2)}</strong>
//                   </p>
//                   <p>
//                     Next Payment Due Date: <strong>{nextDueDate || "-"}</strong>
//                   </p>
//                   <Button
//                     className="bg-green-600 text-white hover:bg-green-700"
//                     onClick={handleUpdate}
//                     disabled={saving}
//                   >
//                     {saving ? "Updating..." : "Update"}
//                   </Button>
//                 </div>
//               </div>
//             </CardContent>
//           </Card>

//           {/* RIGHT: Quick Lead Info (placeholder) */}
//           {/* <Card className="lg:col-span-1">
//             <CardHeader>
//               <CardTitle>Quick Lead Info</CardTitle>
//             </CardHeader>
//             <CardContent>
//               <p className="text-sm text-gray-500">
//                 (Optional) Keep your quick search widget here.
//               </p>
//             </CardContent>
//           </Card> */}
//         </div>
//       )}
//     </div>
//     </DashboardLayout>
//   );
// }



// app/SaleUpdate/[leadId]/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase/client";
import { DashboardLayout } from "@/components/layout/dashboard-layout";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

/* --- Types (subset) --- */
type FinanceStatus = "Paid" | "Unpaid" | "Paused" | "Closed" | "Got Placed";
type PaymentMode =
  | "UPI"
  | "Bank Transfer"
  | "PayPal"
  | "Stripe"
  | "Credit/Debit Card"
  | "Other"
  | "Razorpay";

type SalesClosureRow = {
  id: string;
  lead_id: string;
  sale_value: number | null;
  application_sale_value: number | null;
  application_sale_value_raw?: number | null;
  application_sale_value_text?: string | null;
  application_sale_value_formatted?: string | null;
  application_sale_value_from_db?: number | null;
  // ... other fields (kept minimal for type safety)
  subscription_cycle: number | null;
  payment_mode: PaymentMode | null;
  closed_at: string | null;
  email: string | null;
  company_application_email : string| null;
  lead_name: string | null;
  resume_sale_value: number | null;
  portfolio_sale_value: number | null;
  linkedin_sale_value: number | null;
  badge_value: number | null;
  github_sale_value: number | null;
  courses_sale_value: number | null;
  custom_label: string | null;
  custom_sale_value: number | null;
  commitments: string | null;
  no_of_job_applications: number | null;
  finance_status: FinanceStatus | null;
  account_assigned_name : string | null;
};

type LeadRow = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  business_id: string | null;
};

/* --- Helpers --- */
const safeParseFloatOrNull = (v: string | number | null | undefined): number | null => {
  if (v === null || v === undefined || v === "") return null;
  const n = parseFloat(String(v));
  return Number.isFinite(n) ? n : null;
};
const safeParseFloatOrZero = (v: string | number | null | undefined): number => {
  const n = parseFloat(String(v ?? "0"));
  return Number.isFinite(n) ? n : 0;
};

const sumAddons = (...vals: (string | number | null | undefined)[]) =>
  vals.reduce((acc: number, v) => acc + safeParseFloatOrZero(v), 0);

const round2 = (x: number) => Math.round((Number.isFinite(x) ? x : 0) * 100) / 100;

const cycleFactor = (cycle: string | ""): number => {
  switch (cycle) {
    case "15":
      return 0.5;
    case "30":
      return 1;
    case "60":
      return 2;
    case "90":
      return 3;
    default:
      return 0;
  }
};

const cycleDays = (cycle: string | ""): number => {
  switch (cycle) {
    case "15":
      return 15;
    case "30":
      return 30;
    case "60":
      return 60;
    case "90":
      return 90;
    default:
      return 0;
  }
};

// Date helpers (store UI date as YYYY-MM-DD to avoid TZ shift)
// const isoToDateOnly = (iso?: string | null) => (iso ? new Date(iso).toISOString().slice(0, 10) : "");

const isoToDateOnly = (iso?: string | null) =>
  iso ? iso.slice(0, 10) : "";

const dateOnlyToIsoUTC = (yyyyMMdd?: string | null) =>
  yyyyMMdd ? new Date(`${yyyyMMdd}T00:00:00Z`).toISOString() : null;
const addDaysFromYYYYMMDD = (yyyyMMdd: string, days: number) => {
  const parts = yyyyMMdd.split("-");
  if (parts.length !== 3) return "";
  const y = Number(parts[0]),
    m = Number(parts[1]),
    d = Number(parts[2]);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
};

/* ---------- Component ---------- */
export default function SaleUpdatePage() {
  const { leadId } = useParams<{ leadId: string }>();
  const router = useRouter();

  // Loading / saving / errors
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // record
  const [recordId, setRecordId] = useState<string | null>(null);
  const [originalTotal, setOriginalTotal] = useState<number>(0);

  // form fields (strings so inputs behave naturally)
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [companyApplicationEmail, setCompanyApplicationEmail] = useState("");

  const [paymentMode, setPaymentMode] = useState<PaymentMode | "">("");
  // const [subscriptionCycle, setSubscriptionCycle] = useState<"15" | "30" | "60" | "90" | "">("");

  // Monthly (kept stable after first derive; user can still edit)
  const [subscriptionSaleValue, setSubscriptionSaleValue] = useState<string>("");
  const [monthlyInitialized, setMonthlyInitialized] = useState(false);

  const [financeStatus, setFinanceStatus] = useState<FinanceStatus | "">("");

  // add-ons
  const [resumeValue, setResumeValue] = useState<string>("");
  const [portfolioValue, setPortfolioValue] = useState<string>("");
  const [linkedinValue, setLinkedinValue] = useState<string>("");
  const [badgeValue, setBadgeValue] = useState<string>("");
  const [githubValue, setGithubValue] = useState<string>("");
  const [coursesValue, setCoursesValue] = useState<string>("");

    const [account_assigned_name, setAccount_assigned_name] = useState<string>("");


  const [customLabel, setCustomLabel] = useState<string>("");
  const [customValue, setCustomValue] = useState<string>("");

  const [no_of_job_applications, set_no_of_job_applications] = useState<string>("");
  const [commitments, setCommitments] = useState<string>("");

  // NEW: application_sale_value fetched from sales_closure; do NOT compute it
const [applicationSaleValue, setApplicationSaleValue] = useState<number>(0);
const [subscriptionValue, setSubscriptionValue] = useState<number>(0);
const [subscriptionCycle, setSubscriptionCycle] = useState<number>(30); // default 1 month
  // Dates
  const [closedAtDate, setClosedAtDate] = useState<string>(""); // YYYY-MM-DD
  const [nextDueDate, setNextDueDate] = useState<string>("");

  // lead phone (from leads table, via business_id = leadId)
  const [leadPhone, setLeadPhone] = useState<string>("");

  // display-only
  const [closerName, setCloserName] = useState<string>("");
  const [autoCalculatedValue, setAutoCalculatedValue] = useState<number>(0);
  


  // applicationSaleValue is not used to compute totals — we keep the existing
  // total calculation which uses subscriptionSaleValue * factor + addons.
  // This matches your request: don't derive applicationSaleValue from computed autoTotal.

  /* ---------- Fetch sales_closure and leads in parallel ---------- */
// 🔄 recalc whenever inputs change
useEffect(() => {
  if (applicationSaleValue && subscriptionCycle) {
    const newAuto = (subscriptionCycle / 30) * applicationSaleValue;
    setAutoCalculatedValue(newAuto);
  } else {
    setAutoCalculatedValue(0);
  }
}, [applicationSaleValue, subscriptionCycle]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);

        // 1) Fetch latest sales_closure for this leadId (you used lead_id = leadId)
        const { data: scData, error: scError } = await supabase
          .from("sales_closure")
          .select("*")
          .eq("lead_id", leadId)
          .order("closed_at", { ascending: false, nullsFirst: false })
          .limit(1)
          .maybeSingle<SalesClosureRow>();

        if (scError) throw scError;
        if (!scData) {
          setError(`No sales_closure found for lead_id=${leadId}`);
          // we'll still try to fetch lead phone below, but stop early here if needed
        } else if (mounted) {
          setRecordId(scData.id);
          setOriginalTotal(Number(scData.sale_value || 0));

          // Map addons & meta
          setResumeValue(scData.resume_sale_value?.toString() ?? "");
          setPortfolioValue(scData.portfolio_sale_value?.toString() ?? "");
          setLinkedinValue(scData.linkedin_sale_value?.toString() ?? "");
          setBadgeValue(scData.badge_value?.toString() ?? "");
          setGithubValue(scData.github_sale_value?.toString() ?? "");
          setCoursesValue(scData.courses_sale_value?.toString() ?? "");
          setCustomLabel(scData.custom_label ?? "");
          setCustomValue(scData.custom_sale_value?.toString() ?? "");

          setFinanceStatus((scData.finance_status as FinanceStatus) ?? "");
          setPaymentMode((scData.payment_mode as PaymentMode) ?? "");
          setCommitments(scData.commitments ?? "");
          setClientName(scData.lead_name ?? "");
          setClientEmail(scData.email ?? "");
          setCompanyApplicationEmail(scData.company_application_email ?? "");
          set_no_of_job_applications(scData.no_of_job_applications?.toString() || "");

          setSubscriptionCycle(
            scData.subscription_cycle ? Number(scData.subscription_cycle) : 30
          );

          // IMPORTANT: application_sale_value should come directly from DB (do not recalc)
          setApplicationSaleValue(
            scData.application_sale_value !== null && scData.application_sale_value !== undefined
              ? Number(scData.application_sale_value)
              : 0
          );

          // store date-only in UI to avoid TZ issues
          setClosedAtDate(scData.closed_at ? isoToDateOnly(scData.closed_at) : "");

          setCloserName(scData.account_assigned_name || "");

          // Allow monthly to initialize once after we mapped fields
          setMonthlyInitialized(false);
        }

        // 2) Fetch lead row (phone) using business_id === leadId
        const { data: leadData, error: leadError } = await supabase
          .from("leads")
          .select("id, phone, name, email, business_id")
          .eq("business_id", leadId)
          .maybeSingle<LeadRow>();

        if (leadError) {
          // don't crash entire flow; but surface error
          console.warn("Failed to fetch lead:", leadError);
          if (mounted && !scData) setError("Failed to fetch lead and no sales record found.");
        } else if (leadData && mounted) {
          setLeadPhone(leadData.phone ?? "");
          // (Optionally map lead name/email into form if you want.)
        }
      } catch (e: any) {
        console.error(e);
        setError(e?.message ?? "Failed to load records");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [leadId]);

  const handleSubscriptionValueChange = (val: number) => {
  setSubscriptionValue(val);

  // recalc application_sale_value in sync
  const newAppVal = val * (subscriptionCycle / 30);
  setApplicationSaleValue(newAppVal);
};

// auto-calculated back value (always shows as read-only beside field)
// const autoCalculatedValue = subscriptionValue * (subscriptionCycle / 30);

  /* ---------- INITIAL monthly derive (same as before) ---------- */
  useEffect(() => {
    if (monthlyInitialized) return;
    const factor = cycleFactor(String(subscriptionCycle));
    if (!factor) return;

    const addonsTotal = sumAddons(resumeValue, portfolioValue, linkedinValue, githubValue, coursesValue, customValue, badgeValue);
    const baseTotal = Number(originalTotal || 0);
    const monthly = Math.max((baseTotal - addonsTotal) / factor, 0);
    setSubscriptionSaleValue(round2(monthly).toFixed(2));
    setMonthlyInitialized(true);
  }, [
    monthlyInitialized,
    subscriptionCycle,
    originalTotal,
    resumeValue,
    portfolioValue,
    linkedinValue,
    githubValue,
    coursesValue,
    customValue,
    badgeValue,
  ]);

  /* ---------- Auto Total = subscription monthly * factor (unchanged) ---------- */
  const autoTotal = useMemo(() => {
  if (applicationSaleValue && subscriptionCycle) {
    return (subscriptionCycle / 30) * applicationSaleValue;
  }
  return 0;
}, [applicationSaleValue, subscriptionCycle]);

const totalSale = useMemo(() => {
  const addons = sumAddons(
    resumeValue,
    portfolioValue,
    linkedinValue,
    githubValue,
    coursesValue,
    customValue,
    badgeValue
  );
  return round2(autoTotal + addons);
}, [
  autoTotal,
  resumeValue,
  portfolioValue,
  linkedinValue,
  githubValue,
  coursesValue,
  customValue,
  badgeValue,
]);

// ----- Next Payment Due Date (unchanged, uses date-only) ---------- */
  useEffect(() => {
    const days = cycleDays(String(subscriptionCycle));
    if (!days) {
      setNextDueDate("");
      return;
    }
    const base = closedAtDate || isoToDateOnly(new Date().toISOString());
    if (!base) {
      setNextDueDate("");
      return;
    }
    setNextDueDate(addDaysFromYYYYMMDD(base, days) || "");
  }, [closedAtDate, subscriptionCycle]);

  /* ---------- Save handler: update sales_closure and leads.phone ---------- */
  const handleUpdate = async () => {
    if (!recordId) {
      setError("Missing record id to update.");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      // Build payload for sales_closure:
      const payload: any = {
        lead_id: leadId as string,
        lead_name: clientName || null,
        email: clientEmail || null,
        company_application_email: companyApplicationEmail || null,
        payment_mode: paymentMode || null,
        subscription_cycle: subscriptionCycle ? Number(subscriptionCycle) : null,

        // TOTAL is still computed from autoTotal + addons (as before)
        sale_value: Number(totalSale.toFixed(2)),

        // IMPORTANT: application_sale_value comes from the form (not autoTotal)
        application_sale_value: safeParseFloatOrNull(applicationSaleValue),

        finance_status: financeStatus || null,

        // addons
        resume_sale_value: safeParseFloatOrNull(resumeValue),
        portfolio_sale_value: safeParseFloatOrNull(portfolioValue),
        linkedin_sale_value: safeParseFloatOrNull(linkedinValue),
        badge_value: safeParseFloatOrNull(badgeValue),
        github_sale_value: safeParseFloatOrNull(githubValue),
        courses_sale_value: safeParseFloatOrNull(coursesValue),

        custom_label: customLabel || null,
        custom_sale_value: safeParseFloatOrNull(customValue),

        commitments: commitments || null,
        no_of_job_applications: safeParseFloatOrNull(no_of_job_applications),

        // closed_at: store as ISO UTC (midnight)
        closed_at: dateOnlyToIsoUTC(closedAtDate),
      };

      // Update sales_closure
      const { error: updateError } = await supabase.from("sales_closure").update(payload).eq("id", recordId);
      if (updateError) throw updateError;

      // Update leads.phone by business_id (if leadPhone changed)
      // Note: update is best-effort — surface error if it fails
      if (leadPhone !== undefined) {
        const { error: leadUpdateError } = await supabase
          .from("leads")
          .update({ phone: leadPhone || null })
          .eq("business_id", leadId);

        if (leadUpdateError) {
          // If leads update fails, we don't rollback the sales_closure change here.
          // You can add server-side transaction logic if strict ACID across tables is required.
          console.warn("Updated sales_closure but failed to update lead phone:", leadUpdateError);
          setError("Saved sale record, but failed to update lead phone.");
          setSaving(false);
          return;
        }
      }

      // Success
      alert("Sale closure and lead phone updated successfully.");
      router.back();
    } catch (e: any) {
      console.error(e);
      setError(e?.message ?? "Failed to update record(s)");
    } finally {
      setSaving(false);
    }
  };

  /* ---------- UI ---------- */
  return (
    <DashboardLayout>
      <div className="p-6 pt-0">
        <div className="mb-2 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Edit Sale Close — {leadId}</h1>
        </div>

        {loading ? (
          <Card>
            <CardContent className="p-6">Loading latest sale record…</CardContent>
          </Card>
        ) : error ? (
          <Card>
            <CardContent className="p-6 text-red-600">{error}</CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>🧾 Update Client Sale</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Client Details + Phone */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border rounded-md p-4 space-y-3">
                    <Label className="font-semibold">
                      Client Details <span className="text-red-500">*</span>
                    </Label>

                    <Input placeholder="Client Full Name" value={clientName} onChange={(e) => setClientName(e.target.value)} />
                    <Input placeholder="Client Email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} />
                    <Input placeholder="Company Application Email PWD: Created@123" value={companyApplicationEmail} onChange={(e) => setCompanyApplicationEmail(e.target.value)} />

                    {/* Sale Closed At */}
                    <div className="space-y-1">
                      <Label>Sale Closed At</Label>
                      <Input type="date" value={closedAtDate} onChange={(e) => setClosedAtDate(e.target.value)} />
                    </div>

                    {/* NEW: Lead Phone (fetched from leads table by business_id = leadId) */}
                    <div className="space-y-1">
                      <Label>Lead Phone</Label>
                      <Input placeholder="Phone" value={leadPhone} onChange={(e) => setLeadPhone(e.target.value)} />
                      <p className="text-xs text-gray-500">This value is read from leads.business_id and will update the leads table on save.</p>
                    </div>
                  </div>

                  {/* Subscription & Payment Info */}
                  <div className="border rounded-md p-4 space-y-3">
                    <Label className="font-semibold">Subscription & Payment Info <span className="text-red-500">*</span></Label>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="md:col-span-3">
                        <Select value={paymentMode} onValueChange={(v) => setPaymentMode(v as PaymentMode)}>
                          <SelectTrigger><SelectValue placeholder="Select Payment Mode" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="UPI">UPI</SelectItem>
                            <SelectItem value="PayPal">PayPal</SelectItem>
                            <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                            <SelectItem value="Credit/Debit Card">Credit/Debit Card</SelectItem>
                            <SelectItem value="Stripe">Stripe</SelectItem>
                            <SelectItem value="Razorpay">Razorpay</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
{/* Subscription Cycle */}
<div className="md:col-span-3">
  <Select
    value={String(subscriptionCycle)}
    onValueChange={(v) => setSubscriptionCycle(Number(v))}
  >
    <SelectTrigger>
      <SelectValue placeholder="Select Subscription Duration" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="15">15 Days</SelectItem>
      <SelectItem value="30">1 Month</SelectItem>
      <SelectItem value="60">2 Months</SelectItem>
      <SelectItem value="90">3 Months</SelectItem>
    </SelectContent>
  </Select>
</div>

{/* Application Sale Value */}
<div className="md:col-span-3 grid grid-cols-1 gap-2 mt-2">
  <Label className="text-sm">Application Sale Value (from DB)</Label>
  <Input
    type="number"
    inputMode="decimal"
    min="0"
    // step="0.01"
    value={applicationSaleValue}
    onChange={(e) =>
      setApplicationSaleValue(parseFloat(e.target.value) || 0)
    }
  />
</div>

{/* Auto-calculated */}
<div className="md:col-span-3 grid grid-cols-1 gap-2 mt-2">
  <Label className="text-sm">Auto-Calculated Value</Label>
  <Input type="number" value={autoCalculatedValue} disabled />
  <p className="text-xs text-gray-500">
    Always = <code>(subscription_cycle / 30) × application_sale_value</code>
  </p>
</div>



                      <div className="md:col-span-3">
                        <Input type="number" inputMode="decimal" min="0"  placeholder="No. of applications for month" value={no_of_job_applications} onChange={(e) => set_no_of_job_applications(e.target.value)} />
                      </div>

                      <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Input value="Sale Closing By" disabled readOnly className="mt-1 text-gray-900 bg-gray-50 disabled:opacity-100 disabled:cursor-default" />
                        <Input value={closerName || "—"} disabled readOnly className="mt-1 text-gray-900 bg-gray-50 disabled:opacity-100 disabled:cursor-default" style={{ opacity: 1 }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Add-ons (unchanged) */}
                <div className="border rounded-md p-4 space-y-3">
                  <Label className="font-semibold">Optional Add-On Services</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input type="number" inputMode="decimal" min="0"  placeholder="Resume Sale Value ($)" value={resumeValue} onChange={(e) => setResumeValue(e.target.value)} />
                    <Input type="number" inputMode="decimal" min="0"  placeholder="Portfolio Creation Value ($)" value={portfolioValue} onChange={(e) => setPortfolioValue(e.target.value)} />
                    <Input type="number" inputMode="decimal" min="0"  placeholder="LinkedIn Optimization Value ($)" value={linkedinValue} onChange={(e) => setLinkedinValue(e.target.value)} />
                    <Input type="number" inputMode="decimal" min="0"  placeholder="Badge Value ($)" value={badgeValue} onChange={(e) => setBadgeValue(e.target.value)} />

                    <Input type="number" inputMode="decimal" min="0"  placeholder="GitHub Optimization Value ($)" value={githubValue} onChange={(e) => setGithubValue(e.target.value)} />
                    <Input type="number" inputMode="decimal" min="0"  placeholder="Courses / Certifications Value ($)" value={coursesValue} onChange={(e) => setCoursesValue(e.target.value)} />
                    <div className="flex gap-2">
                      <Input placeholder="Custom Add-on (e.g., Courses)" value={customLabel} onChange={(e) => setCustomLabel(e.target.value)} className="w-1/2" />
                      <Input type="number" inputMode="decimal" min="0"  placeholder="Custom Add-on Value ($)" value={customValue} onChange={(e) => setCustomValue(e.target.value)} className="w-1/2" />
                    </div>
                  </div>

                  <div className="border rounded-md p-4 space-y-2">
                    <Label className="font-semibold">Commitments</Label>
                    <Textarea placeholder="Enter commitments…" value={commitments} onChange={(e) => setCommitments(e.target.value)} />
                  </div>
                </div>

                <div className="border rounded-md p-4">
                  <Label className="font-semibold">Auto Calculated</Label>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-2">
                    <p>Total Sale Value: <strong>${totalSale.toFixed(2)}</strong></p>
                    <p>Next Payment Due Date: <strong>{nextDueDate || "-"}</strong></p>
                    <Button className="bg-green-600 text-white hover:bg-green-700" onClick={handleUpdate} disabled={saving}>
                      {saving ? "Updating..." : "Update"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
