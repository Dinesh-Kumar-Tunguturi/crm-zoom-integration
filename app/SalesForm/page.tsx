// "use client";

// import { useMemo, useState } from "react";
// // ⬇️ Adjust this import if your client path differs (you showed "@/utils/supabase/client")
// import { supabase } from "@/utils/supabase/client";
// import ProtectedRoute from "@/components/auth/ProtectedRoute";
// import { DashboardLayout } from "@/components/layout/dashboard-layout";

// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Label } from "@/components/ui/label";
// import { Input } from "@/components/ui/input";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { Button } from "@/components/ui/button";

// // ---------- Helpers ----------
// const n = (v: string | number | null | undefined) => {
//   const num = typeof v === "string" ? parseFloat(v.trim() || "0") : Number(v ?? 0);
//   return Number.isFinite(num) ? num : 0;
// };

// const plusDays = (yyyyMmDd: string, days: number) => {
//   if (!yyyyMmDd) return "";
//   const d = new Date(yyyyMmDd + "T00:00:00");
//   d.setDate(d.getDate() + days);
//   const y = d.getFullYear();
//   const m = String(d.getMonth() + 1).padStart(2, "0");
//   const day = String(d.getDate()).padStart(2, "0");
//   return `${y}-${m}-${day}`;
// };

// // ---------- Page ----------
// export default function SalesFormPage() {
//   // Client details
//   const [clientName, setClientName] = useState("");
//   const [clientEmail, setClientEmail] = useState("");
//   const [contactNumber, setContactNumber] = useState("");
//   const [city, setCity] = useState("");
//   const [onboardingDate, setOnboardingDate] = useState(""); // YYYY-MM-DD

//   // Subscription & payment
//   const [paymentMode, setPaymentMode] = useState<string>("");
//   const [subscriptionCycle, setSubscriptionCycle] = useState<string>(""); // "15" | "30" | "60" | "90"
//   const [subscriptionSaleValue, setSubscriptionSaleValue] = useState<string>("");

//   // Add-ons
//   const [resumeValue, setResumeValue] = useState<string>("");
//   const [portfolioValue, setPortfolioValue] = useState<string>("");
//   const [linkedinValue, setLinkedinValue] = useState<string>("");
//   const [githubValue, setGithubValue] = useState<string>("");

//   // Not in this table (kept for UI)
//   const [subscriptionSource, setSubscriptionSource] = useState<string>("");

//   const [loading, setLoading] = useState(false);

//   // Derived
//   const autoTotal = useMemo(() => n(subscriptionSaleValue), [subscriptionSaleValue]);

//   const totalSale = useMemo(
//     () =>
//       n(subscriptionSaleValue) +
//       n(resumeValue) +
//       n(portfolioValue) +
//       n(linkedinValue) +
//       n(githubValue),
//     [subscriptionSaleValue, resumeValue, portfolioValue, linkedinValue, githubValue]
//   );

//   const nextDueDate = useMemo(() => {
//     const cyc = parseInt(subscriptionCycle || "0", 10);
//     if (!onboardingDate || !cyc) return "-";
//     return plusDays(onboardingDate, cyc);
//   }, [onboardingDate, subscriptionCycle]);

//   const handleSubmit = async () => {
//     try {
//       // Front-end validations mapped to table constraints
//       if (!clientName.trim()) return alert("Client name is required.");
//       if (!clientEmail.trim()) return alert("Client email is required.");
//       if (!paymentMode) return alert("Payment mode is required.");
//       if (!subscriptionCycle) return alert("Subscription duration is required.");
//       if (!onboardingDate) return alert("Onboarding date is required.");
//       if (totalSale <= 0) return alert("Total sale value must be greater than 0.");

//       // Required by table (NOT NULL). Replace with your real lead id if you have one.
//       const newLeadId = `LD-${Date.now()}`;

//       const durationInDays = parseInt(subscriptionCycle, 10);

//       // Prepare payload (correct types for Postgres)
//       const payload = {
//         lead_id: newLeadId,                                // text NOT NULL
//         email: clientEmail.trim(),                         // text NOT NULL
//         lead_name: clientName.trim(),                      // text
//         payment_mode: paymentMode,                         // text (must be allowed by constraint)
//         subscription_cycle: durationInDays,                // integer NOT NULL
//         sale_value: totalSale,                             // numeric(12,2) NOT NULL
//         closed_at: onboardingDate || null,                 // timestamp (optional)
//         onboarded_date: onboardingDate || null,            // date
//         finance_status: "Paid" as const,                   // text (allowed value)
//         resume_sale_value: n(resumeValue) || null,         // numeric
//         linkedin_sale_value: n(linkedinValue) || null,     // numeric
//         github_sale_value: n(githubValue) || null,         // numeric
//         portfolio_sale_value: n(portfolioValue) || null,   // numeric
//         // Optional/defaulted fields from your schema:
//         associates_email: "",
//         associates_name: "",
//         associates_tl_email: "",
//         associates_tl_name: "",
//         checkout_date: nextDueDate !== "-" ? nextDueDate : null, // date
//         invoice_url: "",
//         // NOTE: contactNumber, city, subscriptionSource are NOT columns in this table.
//       };

//       setLoading(true);
//       const { error: salesInsertError } = await supabase
//         .from("sales_closure")
//         .insert(payload);

//       setLoading(false);

//       if (salesInsertError) throw salesInsertError;

//       // Reset
//       setClientName("");
//       setClientEmail("");
//       setContactNumber("");
//       setCity("");
//       setOnboardingDate("");
//       setSubscriptionCycle("");
//       setSubscriptionSaleValue("");
//       setPaymentMode("");
//       setResumeValue("");
//       setPortfolioValue("");
//       setLinkedinValue("");
//       setGithubValue("");
//       setSubscriptionSource("");

//       alert("✅ Client onboarded successfully!");
//     } catch (err: any) {
//       console.error("❌ Error onboarding client:", err?.message || err);
//       alert(`Failed to onboard client: ${err?.message || "Unknown error"}`);
//     }
//   };

//   return (
//      <ProtectedRoute allowedRoles={["Sales","Sales Associate", "Super Admin"]}>
    
//           <DashboardLayout>
//     <main className="mx-auto max-w-5xl p-6 space-y-6">
//       <Card>
//         <CardHeader>
//           <CardTitle>🧾 Onboard New Client</CardTitle>
//         </CardHeader>
//         <CardContent className="space-y-6">
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//             {/* Client Details */}
//             <div className="border rounded-md p-4 space-y-3">
//               <Label className="font-semibold">
//                 Client Details <span className="text-red-500">*</span>
//               </Label>

//               <Input
//                 placeholder="Client Full Name"
//                 value={clientName}
//                 onChange={(e) => setClientName(e.target.value)}
//               />

//               <Input
//                 placeholder="Client Email"
//                 value={clientEmail}
//                 onChange={(e) => setClientEmail(e.target.value)}
//               />

//               <Input
//                 placeholder="Contact Number with country code"
//                 value={contactNumber}
//                 onChange={(e) => setContactNumber(e.target.value)}
//               />

//               <Input
//                 placeholder="City"
//                 value={city}
//                 onChange={(e) => setCity(e.target.value)}
//               />

//               <Input
//                 type="date"
//                 value={onboardingDate}
//                 onChange={(e) => setOnboardingDate(e.target.value)}
//                 placeholder="dd-mm-yyyy"
//               />
//             </div>

//             {/* Subscription & Payment Info */}
//             <div className="border rounded-md p-4 space-y-3">
//               <Label className="font-semibold">
//                 Subscription & Payment Info <span className="text-red-500">*</span>
//               </Label>

//               <Select value={paymentMode} onValueChange={setPaymentMode}>
//                 <SelectTrigger>
//                   <SelectValue placeholder="Select Payment Mode" />
//                 </SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value="UPI">UPI</SelectItem>
//                   <SelectItem value="PayPal">PayPal</SelectItem>
//                   <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
//                   <SelectItem value="Credit/Debit Card">Credit/Debit Card</SelectItem>
//                   {/* schema also allows "Stripe" and "Other" */}
//                   <SelectItem value="Stripe">Stripe</SelectItem>
//                   <SelectItem value="Other">Other</SelectItem>
//                 </SelectContent>
//               </Select>

//               <Select
//                 value={subscriptionCycle}
//                 onValueChange={setSubscriptionCycle}
//               >
//                 <SelectTrigger>
//                   <SelectValue placeholder="Select Subscription Duration" />
//                 </SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value="15">15 Days</SelectItem>
//                   <SelectItem value="30">1 Month</SelectItem>
//                   <SelectItem value="60">2 Months</SelectItem>
//                   <SelectItem value="90">3 Months</SelectItem>
//                 </SelectContent>
//               </Select>

//               <Input
//                 type="number"
//                 inputMode="decimal"
//                 placeholder="Subscription Sale Value ($)"
//                 value={subscriptionSaleValue}
//                 onChange={(e) => setSubscriptionSaleValue(e.target.value)}
//               />

//               <Input
//                 placeholder="Auto Total (Subscription Only)"
//                 value={autoTotal.toFixed(2)}
//                 disabled
//               />

//               {/* Not stored in this table, but kept for UI */}
//               <Select
//                 value={subscriptionSource}
//                 onValueChange={setSubscriptionSource}
//               >
//                 <SelectTrigger>
//                   <SelectValue placeholder="Select Client Source" />
//                 </SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value="Referral">Referral</SelectItem>
//                   <SelectItem value="NEW">NEW</SelectItem>
//                 </SelectContent>
//               </Select>
//             </div>
//           </div>

//           {/* Add-on Services */}
//           <div className="border rounded-md p-4 space-y-3">
//             <Label className="font-semibold">Optional Add-On Services</Label>
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               <Input
//                 type="number"
//                 inputMode="decimal"
//                 placeholder="Resume Sale Value ($)"
//                 value={resumeValue}
//                 onChange={(e) => setResumeValue(e.target.value)}
//               />
//               <Input
//                 type="number"
//                 inputMode="decimal"
//                 placeholder="Portfolio Creation Value ($)"
//                 value={portfolioValue}
//                 onChange={(e) => setPortfolioValue(e.target.value)}
//               />
//               <Input
//                 type="number"
//                 inputMode="decimal"
//                 placeholder="LinkedIn Optimization Value ($)"
//                 value={linkedinValue}
//                 onChange={(e) => setLinkedinValue(e.target.value)}
//               />
//               <Input
//                 type="number"
//                 inputMode="decimal"
//                 placeholder="GitHub Optimization Value ($)"
//                 value={githubValue}
//                 onChange={(e) => setGithubValue(e.target.value)}
//               />
//             </div>
//           </div>

//           {/* Auto Calculated */}
//           <div className="border rounded-md p-4">
//             <Label className="font-semibold">Auto Calculated</Label>
//             <div className="flex flex-col sm:flex-row sm:justify-between gap-2 mt-2">
//               <p>
//                 Total Sale Value: <strong>${totalSale.toFixed(2)}</strong>
//               </p>
//               <p>
//                 Next Payment Due Date:{" "}
//                 <strong>{nextDueDate || "-"}</strong>
//               </p>
//             </div>
//           </div>

//           {/* Submit */}
//           <div className="pt-2">
//             <Button
//               className="bg-green-600 text-white hover:bg-green-700"
//               onClick={handleSubmit}
//               disabled={loading}
//             >
//               {loading ? "Submitting..." : "Submit"}
//             </Button>
//           </div>
//         </CardContent>
//       </Card>
//     </main>
//     </DashboardLayout>
//         </ProtectedRoute>
//   );
// }


// "use client";

// import { useMemo, useState } from "react";
// import { supabase } from "@/utils/supabase/client";
// import ProtectedRoute from "@/components/auth/ProtectedRoute";
// import { DashboardLayout } from "@/components/layout/dashboard-layout";

// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Label } from "@/components/ui/label";
// import { Input } from "@/components/ui/input";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { Button } from "@/components/ui/button";

// // ---------- Helpers ----------
// const n = (v: string | number | null | undefined) => {
//   const num = typeof v === "string" ? parseFloat(v.trim() || "0") : Number(v ?? 0);
//   return Number.isFinite(num) ? num : 0;
// };

// const plusDays = (yyyyMmDd: string, days: number) => {
//   if (!yyyyMmDd) return "";
//   const d = new Date(yyyyMmDd + "T00:00:00");
//   d.setDate(d.getDate() + days);
//   const y = d.getFullYear();
//   const m = String(d.getMonth() + 1).padStart(2, "0");
//   const day = String(d.getDate()).padStart(2, "0");
//   return `${y}-${m}-${day}`;
// };

// // ---------- Page ----------
// export default function SalesFormPage() {
//   // Client details (MAIN FORM)
//   const [clientName, setClientName] = useState("");
//   const [clientEmail, setClientEmail] = useState("");
//   const [contactNumber, setContactNumber] = useState("");
//   const [city, setCity] = useState("");
//   const [onboardingDate, setOnboardingDate] = useState(""); // YYYY-MM-DD
//   const [leadId, setLeadId] = useState(""); // can be set by the quick form

//   // Subscription & payment
//   const [paymentMode, setPaymentMode] = useState<string>("");
//   const [subscriptionCycle, setSubscriptionCycle] = useState<string>(""); // "15" | "30" | "60" | "90"
//   const [subscriptionSaleValue, setSubscriptionSaleValue] = useState<string>("");

//   // Add-ons
//   const [resumeValue, setResumeValue] = useState<string>("");
//   const [portfolioValue, setPortfolioValue] = useState<string>("");
//   const [linkedinValue, setLinkedinValue] = useState<string>("");
//   const [githubValue, setGithubValue] = useState<string>("");

//   // Not in this table (kept for UI)
//   const [subscriptionSource, setSubscriptionSource] = useState<string>("");

//   const [loading, setLoading] = useState(false);

//   const durationFactor = useMemo(() => {
//   switch (parseInt(subscriptionCycle || "0", 10)) {
//     case 15: return 0.5; // half-month
//     case 30: return 1;   // 1 month
//     case 60: return 2;   // 2 months
//     case 90: return 3;   // 3 months
//     default: return 0;
//   }
// }, [subscriptionCycle]);


//   // Derived
// //   const autoTotal = useMemo(() => n(subscriptionSaleValue), [subscriptionSaleValue]);
// const autoTotal = useMemo(
//   () => n(subscriptionSaleValue) * durationFactor,
//   [subscriptionSaleValue, durationFactor]
// );


//   // Referral extras (UI-only)
// const [referrerId, setReferrerId] = useState("");
// const [referrerName, setReferrerName] = useState("");


//   const totalSale = useMemo(
//   () =>
//     autoTotal +
//     n(resumeValue) +
//     n(portfolioValue) +
//     n(linkedinValue) +
//     n(githubValue),
//   [autoTotal, resumeValue, portfolioValue, linkedinValue, githubValue]
// );

//   const nextDueDate = useMemo(() => {
//     const cyc = parseInt(subscriptionCycle || "0", 10);
//     if (!onboardingDate || !cyc) return "-";
//     return plusDays(onboardingDate, cyc);
//   }, [onboardingDate, subscriptionCycle]);

//   const handleSubmit = async () => {
//     try {
//       // Front-end validations mapped to table constraints
//       if (!clientName.trim()) return alert("Client name is required.");
//       if (!clientEmail.trim()) return alert("Client email is required.");
//       if (!paymentMode) return alert("Payment mode is required.");
//       if (!subscriptionCycle) return alert("Subscription duration is required.");
//       if (!onboardingDate) return alert("Onboarding date is required.");
//       if (totalSale <= 0) return alert("Total sale value must be greater than 0.");

//       // Use Lead ID from quick form if provided, else auto-generate.
//       const newLeadId = leadId.trim() || `LD-${Date.now()}`;
//       const durationInDays = parseInt(subscriptionCycle, 10);

//       // Prepare payload (correct types for Postgres)
//       const payload = {
//         lead_id: newLeadId,                                 // text NOT NULL
//         email: clientEmail.trim(),                          // text NOT NULL
//         lead_name: clientName.trim(),                       // text
//         payment_mode: paymentMode,                          // text (must be allowed by constraint)
//         subscription_cycle: durationInDays,                 // integer NOT NULL
//         sale_value: totalSale,                              // numeric(12,2) NOT NULL
//         closed_at: onboardingDate || null,                  // timestamp (optional)
//         onboarded_date: onboardingDate || null,             // date
//         finance_status: "Paid" as const,                    // text (allowed value)
//         resume_sale_value: n(resumeValue) || null,          // numeric
//         linkedin_sale_value: n(linkedinValue) || null,      // numeric
//         github_sale_value: n(githubValue) || null,          // numeric
//         portfolio_sale_value: n(portfolioValue) || null,    // numeric
//         // Optional/defaulted fields from your schema:
//         associates_email: "",
//         associates_name: "",
//         associates_tl_email: "",
//         associates_tl_name: "",
//         checkout_date: nextDueDate !== "-" ? nextDueDate : null, // date
//         invoice_url: "",
//         // NOTE: contactNumber, city, subscriptionSource are NOT columns in this table.
//       };

//       setLoading(true);
//       const { error: salesInsertError } = await supabase
//         .from("sales_closure")
//         .insert(payload);
//       setLoading(false);

//       if (salesInsertError) throw salesInsertError;

//       // Reset
//       setClientName("");
//       setClientEmail("");
//       setContactNumber("");
//       setCity("");
//       setOnboardingDate("");
//       setSubscriptionCycle("");
//       setSubscriptionSaleValue("");
//       setPaymentMode("");
//       setResumeValue("");
//       setPortfolioValue("");
//       setLinkedinValue("");
//       setGithubValue("");
//       setSubscriptionSource("");
//       setLeadId("");

//       alert("✅ Client onboarded successfully!");
//     } catch (err: any) {
//       console.error("❌ Error onboarding client:", err?.message || err);
//       alert(`Failed to onboard client: ${err?.message || "Unknown error"}`);
//     }
//   };

//   // ---------- Quick Lead Info (RIGHT FORM) ----------
//   const [qlName, setQlName] = useState("");
//   const [qlEmail, setQlEmail] = useState("");
//   const [qlPhone, setQlPhone] = useState("");
//   const [qlLeadId, setQlLeadId] = useState("");

//   const applyQuickLeadToMain = () => {
//     // Put the quick form values into the main form
//     if (qlName) setClientName(qlName);
//     if (qlEmail) setClientEmail(qlEmail);
//     if (qlPhone) setContactNumber(qlPhone);
//     if (qlLeadId) setLeadId(qlLeadId);
//     alert("➡️ Quick Lead Info applied to the main form.");
//   };

//   const resetQuickLead = () => {
//     setQlName("");
//     setQlEmail("");
//     setQlPhone("");
//     setQlLeadId("");
//   };

//   return (
//     <ProtectedRoute allowedRoles={["Sales", "Sales Associate", "Super Admin"]}>
//       <DashboardLayout>
//         {/* Two columns: Left = Main form, Right = Quick Lead Info */}
//         <main className="py-0 px-0 mx-0 my-0 max-w-full p-6">
//           <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//             {/* LEFT: Main Onboarding Form */}
//             <Card className="lg:col-span-2">
//               <CardHeader>
//                 <CardTitle>🧾 Onboard New Client</CardTitle>
//               </CardHeader>
//               <CardContent className="space-y-6">
//                 {/* Show current Lead ID (optional) */}
//                 <div>
//                   <Label className="font-medium">Lead ID (optional; will auto-generate if empty)</Label>
//                   <Input
//                     placeholder="LD-1234567890"
//                     value={leadId}
//                     onChange={(e) => setLeadId(e.target.value)}
//                     className="mt-1"
//                   />
//                 </div>

//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                   {/* Client Details */}
//                   <div className="border rounded-md p-4 space-y-3">
//                     <Label className="font-semibold">
//                       Client Details <span className="text-red-500">*</span>
//                     </Label>

//                     <Input
//                       placeholder="Client Full Name"
//                       value={clientName}
//                       onChange={(e) => setClientName(e.target.value)}
//                     />

//                     <Input
//                       placeholder="Client Email"
//                       value={clientEmail}
//                       onChange={(e) => setClientEmail(e.target.value)}
//                     />

//                     <Input
//                       placeholder="Contact Number with country code"
//                       value={contactNumber}
//                       onChange={(e) => setContactNumber(e.target.value)}
//                     />

//                     <Input
//                       placeholder="City"
//                       value={city}
//                       onChange={(e) => setCity(e.target.value)}
//                     />

//                     <Input
//                       type="date"
//                       value={onboardingDate}
//                       onChange={(e) => setOnboardingDate(e.target.value)}
//                       placeholder="dd-mm-yyyy"
//                     />
//                   </div>

//                   {/* <div className="border rounded-md p-4 space-y-3">
//                     <Label className="font-semibold">
//                       Subscription & Payment Info <span className="text-red-500">*</span>
//                     </Label>

//                     <Select value={paymentMode} onValueChange={setPaymentMode}>
//                       <SelectTrigger>
//                         <SelectValue placeholder="Select Payment Mode" />
//                       </SelectTrigger>
//                       <SelectContent>
//                         <SelectItem value="UPI">UPI</SelectItem>
//                         <SelectItem value="PayPal">PayPal</SelectItem>
//                         <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
//                         <SelectItem value="Credit/Debit Card">Credit/Debit Card</SelectItem>
//                         <SelectItem value="Stripe">Stripe</SelectItem>
//                         <SelectItem value="Other">Other</SelectItem>
//                       </SelectContent>
//                     </Select>

//                     <Select
//                       value={subscriptionCycle}
//                       onValueChange={setSubscriptionCycle}
//                     >
//                       <SelectTrigger>
//                         <SelectValue placeholder="Select Subscription Duration" />
//                       </SelectTrigger>
//                       <SelectContent>
//                         <SelectItem value="15">15 Days</SelectItem>
//                         <SelectItem value="30">1 Month</SelectItem>
//                         <SelectItem value="60">2 Months</SelectItem>
//                         <SelectItem value="90">3 Months</SelectItem>
//                       </SelectContent>
//                     </Select>

//                     <Input
//                       type="number"
//                       inputMode="decimal"
//                       placeholder="Subscription Sale Value ($)"
//                       value={subscriptionSaleValue}
//                       onChange={(e) => setSubscriptionSaleValue(e.target.value)}
//                     />

//                     <Input
//                       placeholder="Auto Total (Subscription Only)"
//                       value={autoTotal.toFixed(2)}
//                       disabled
//                     />

//                     <Select
//                       value={subscriptionSource}
//                       onValueChange={setSubscriptionSource}
//                     >
//                       <SelectTrigger>
//                         <SelectValue placeholder="Select Client Source" />
//                       </SelectTrigger>
//                       <SelectContent>
//                         <SelectItem value="Referral">Referral</SelectItem>
//                         <SelectItem value="NEW">NEW</SelectItem>
//                       </SelectContent>
//                     </Select>
//                   </div> */}

//                   {/* Subscription & Payment Info */}
// <div className="border rounded-md p-4 space-y-3">
//   <Label className="font-semibold">
//     Subscription & Payment Info <span className="text-red-500">*</span>
//   </Label>

//   {/* Use a 3-col grid so we can make the 4th field span 2 cols */}
//   <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
//     {/* 1) Payment mode (full width) */}
//     <div className="md:col-span-3">
//       <Select value={paymentMode} onValueChange={setPaymentMode}>
//         <SelectTrigger>
//           <SelectValue placeholder="Select Payment Mode" />
//         </SelectTrigger>
//         <SelectContent>
//           <SelectItem value="UPI">UPI</SelectItem>
//           <SelectItem value="PayPal">PayPal</SelectItem>
//           <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
//           <SelectItem value="Credit/Debit Card">Credit/Debit Card</SelectItem>
//           {/* schema also allows "Stripe" and "Other" */}
//           <SelectItem value="Stripe">Stripe</SelectItem>
//           <SelectItem value="Other">Other</SelectItem>
//         </SelectContent>
//       </Select>
//     </div>

//     {/* 2) Subscription cycle (full width) */}
//     <div className="md:col-span-3">
//       <Select value={subscriptionCycle} onValueChange={setSubscriptionCycle}>
//         <SelectTrigger>
//           <SelectValue placeholder="Select Subscription Duration" />
//         </SelectTrigger>
//         <SelectContent>
//           <SelectItem value="15">15 Days</SelectItem>
//           <SelectItem value="30">1 Month</SelectItem>
//           <SelectItem value="60">2 Months</SelectItem>
//           <SelectItem value="90">3 Months</SelectItem>
//         </SelectContent>
//       </Select>
//     </div>

//     {/* 3) & 4) Same row: Sale value (1 col) + Auto Total (spans 2 cols) */}
//     {/* 3) & 4) Same row: equal width */}
// <div className="md:col-span-3 grid grid-cols-2 gap-3">
//   <Input
//     type="number"
//     inputMode="decimal"
//     placeholder="Subscription Sale Value ($)"
//     value={subscriptionSaleValue}
//     onChange={(e) => setSubscriptionSaleValue(e.target.value)}
//   />
//   <Input
//     placeholder="Auto Total (Subscription Only)"
//     value={autoTotal.toFixed(2)}
//     disabled
//   />
// </div>

//     {/* 5) Client Source (full width) */}
//     <div className="md:col-span-3">
//       <Select value={subscriptionSource} onValueChange={setSubscriptionSource}>
//         <SelectTrigger>
//           <SelectValue placeholder="Select Client Source" />
//         </SelectTrigger>
//         <SelectContent>
//           <SelectItem value="Referral">Referral</SelectItem>
//           <SelectItem value="NEW">NEW</SelectItem>
//         </SelectContent>
//       </Select>
//     </div>

//     {/* If Referral, show two inputs in one row */}
//     {subscriptionSource === "Referral" && (
//       <>
//         <div className="md:col-span-1">
//           <Input
//             placeholder="Referrer Id"
//             value={referrerId}
//             onChange={(e) => setReferrerId(e.target.value)}
//           />
//         </div>
//         <div className="md:col-span-2">
//           <Input
//             type="email"
//             placeholder="Referrer Name"
//             value={referrerName}
//             onChange={(e) => setReferrerName(e.target.value)}
//           />
//         </div>
//       </>
//     )}
//   </div>
// </div>

//                 </div>

//                 {/* Add-on Services */}
//                 <div className="border rounded-md p-4 space-y-3">
//                   <Label className="font-semibold">Optional Add-On Services</Label>
//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                     <Input
//                       type="number"
//                       inputMode="decimal"
//                       placeholder="Resume Sale Value ($)"
//                       value={resumeValue}
//                       onChange={(e) => setResumeValue(e.target.value)}
//                     />
//                     <Input
//                       type="number"
//                       inputMode="decimal"
//                       placeholder="Portfolio Creation Value ($)"
//                       value={portfolioValue}
//                       onChange={(e) => setPortfolioValue(e.target.value)}
//                     />
//                     <Input
//                       type="number"
//                       inputMode="decimal"
//                       placeholder="LinkedIn Optimization Value ($)"
//                       value={linkedinValue}
//                       onChange={(e) => setLinkedinValue(e.target.value)}
//                     />
//                     <Input
//                       type="number"
//                       inputMode="decimal"
//                       placeholder="GitHub Optimization Value ($)"
//                       value={githubValue}
//                       onChange={(e) => setGithubValue(e.target.value)}
//                     />
//                   </div>
//                 </div>

//                 {/* Auto Calculated */}
//                 <div className="border rounded-md p-4">
//                   <Label className="font-semibold">Auto Calculated</Label>
//                   <div className="flex flex-col sm:flex-row sm:justify-between gap-2 mt-2">
//                     <p>
//                       Total Sale Value: <strong>${totalSale.toFixed(2)}</strong>
//                     </p>
//                     <p>
//                       Next Payment Due Date:{" "}
//                       <strong>{nextDueDate || "-"}</strong>
//                     </p>
                    
//                   <Button
//                     className="bg-green-600 text-white hover:bg-green-700"
//                     onClick={handleSubmit}
//                     disabled={loading}
//                   >
//                     {loading ? "Submitting..." : "Submit"}
//                   </Button>
//                 </div>
//                   </div>
              

//                 {/* Submit */}
               
//               </CardContent>
//             </Card>

//             {/* RIGHT: Quick Lead Info (4 fields) */}
//             <Card className="lg:col-span-1">
//               <CardHeader>
//                 <CardTitle> Quick Lead Info</CardTitle>
//               </CardHeader>
//               <CardContent className="space-y-4">
//                 <div>
//                   <Label>Name</Label>
//                   <Input
//                     placeholder="Lead Full Name"
//                     value={qlName}
//                     onChange={(e) => setQlName(e.target.value)}
//                     className="mt-1"
//                   />
//                 </div>

//                 <div>
//                   <Label>Email</Label>
//                   <Input
//                     placeholder="lead@email.com"
//                     value={qlEmail}
//                     onChange={(e) => setQlEmail(e.target.value)}
//                     className="mt-1"
//                   />
//                 </div>

//                 <div>
//                   <Label>Phone Number</Label>
//                   <Input
//                     placeholder="+1 555 123 4567"
//                     value={qlPhone}
//                     onChange={(e) => setQlPhone(e.target.value)}
//                     className="mt-1"
//                   />
//                 </div>

//                 <div>
//                   <Label>Lead ID</Label>
//                   <Input
//                     placeholder="LD-XYZ-001"
//                     value={qlLeadId}
//                     onChange={(e) => setQlLeadId(e.target.value)}
//                     className="mt-1"
//                   />
//                 </div>

//                 <div className="flex gap-2 pt-2">
//                   <Button onClick={applyQuickLeadToMain} className="bg-blue-600 hover:bg-blue-700 text-white">
//                     Use in Main Form
//                   </Button>
//                   <Button variant="outline" onClick={resetQuickLead}>
//                     Reset
//                   </Button>
//                 </div>

//                 <p className="text-xs text-gray-500">
//                   Tip: After you “Use in Main Form”, complete the subscription details on the left and click Submit to save into <code>sales_closure</code>.
//                 </p>
//               </CardContent>
//             </Card>
//           </div>
//         </main>
//       </DashboardLayout>
//     </ProtectedRoute>
//   );
// }



// app/SalesForm/page.tsx
"use client";

import { useMemo, useState, useEffect } from "react";
import { supabase } from "@/utils/supabase/client";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useAuth } from "@/components/providers/auth-provider";
import { useRouter } from "next/navigation";

import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

// ---------- Helpers ----------
const n = (v: string | number | null | undefined) => {
  const num = typeof v === "string" ? parseFloat(v.trim() || "0") : Number(v ?? 0);
  return Number.isFinite(num) ? num : 0;
};

// return null only when the field is blank; keep 0 as 0
const numOrNull = (s: string) => (s.trim() === "" ? null : n(s));

// UTC-safe +days for YYYY-MM-DD strings
const plusDays = (yyyyMmDd: string, days: number) => {
  if (!yyyyMmDd) return "";
  const [Y, M, D] = yyyyMmDd.split("-").map(Number);
  const d = new Date(Date.UTC(Y, M - 1, D));
  d.setUTCDate(d.getUTCDate() + days);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};
// Enforce "AWL-" + digits only, remove spaces, uppercase
const formatReferrerId = (v: string) => {
  const noSpaces = (v || "").toUpperCase().replace(/\s+/g, "");
  const suffixDigits = noSpaces.replace(/^AWL-?/i, "").replace(/\D/g, "");
  return `AWL-${suffixDigits}`;
};


// ---------- Page ----------
export default function SalesFormPage() {
  const { user } = useAuth() as any; // adjust typing if your provider exports a type
  const closerEmail: string = user?.email ?? "";
  const closerName: string = user?.name ?? "";

  // Client details (MAIN FORM)
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [companyApplicationEmail, setCompanyApplicationEmail] = useState(""); // NEW

  const [contactNumber, setContactNumber] = useState("");
  const [city, setCity] = useState("");
  const [onboardingDate, setOnboardingDate] = useState(""); // YYYY-MM-DD
  const [leadId, setLeadId] = useState(""); // optional manual override

  // Subscription & payment
  const [paymentMode, setPaymentMode] = useState<string>("");
  const [subscriptionCycle, setSubscriptionCycle] = useState<string>(""); // "15" | "30" | "60" | "90"
  const [subscriptionSaleValue, setSubscriptionSaleValue] = useState<string>("");

  // Add-ons
  const [resumeValue, setResumeValue] = useState<string>("");
  const [portfolioValue, setPortfolioValue] = useState<string>("");
  const [linkedinValue, setLinkedinValue] = useState<string>("");
  const [githubValue, setGithubValue] = useState<string>("");

  // NEW add-ons + notes
const [coursesValue, setCoursesValue] = useState<string>("");
const [customLabel, setCustomLabel] = useState<string>("");
const [customValue, setCustomValue] = useState<string>("");
const [commitments, setCommitments] = useState<string>("");


  // Source + referral
  const [subscriptionSource, setSubscriptionSource] = useState<string>("");
  const [referrerId, setReferrerId] = useState("");

  const [refLookupLoading, setRefLookupLoading] = useState(false);
const [refLookupError, setRefLookupError] = useState<string | null>(null);


  const [referrerName, setReferrerName] = useState("");

    const router = useRouter();


   useEffect(() => {
  if (user === null) return;
  type UserRole = "Super Admin" | "Sales" | "Sales Associate" | "Marketing" | "Account Management" | "Finance" | "Resume Head" | "Technical Head";
  const allowed: UserRole[] = [
    "Super Admin","Sales","Sales Associate",
    "Marketing","Account Management","Finance",
    "Resume Head","Technical Head",
  ];
  if (!user || !allowed.includes(user.role)) {
    router.push("/unauthorized");
    return;
  }
  setLoading(false);
}, [user, router]);


  useEffect(() => {
  if (!user) return;
  const allowed = new Set(["Super Admin", "Resume Head", "Technical Head", "Marketing","Account Management","Finance"]);

}, [user]);


  useEffect(() => {
  if (subscriptionSource === "Referral") {
    if (!referrerId) setReferrerId("AWL-"); // seed the prefix once
  } else {
    setReferrerId("");
    setReferrerName("");
  }
}, [subscriptionSource]);


  const [loading, setLoading] = useState(false);

  // ---- Quick search state ----
const [searchLoading, setSearchLoading] = useState(false);
const [searchError, setSearchError] = useState<string | null>(null);
const [searchResults, setSearchResults] = useState<any[]>([]);


// Get a unique Lead ID: prefer the typed one if it's unused, otherwise RPC-generate
const getUniqueLeadId = async (preferredId?: string): Promise<string> => {
  const typed = preferredId?.trim();
  if (typed) {
    const { data: existing, error } = await supabase
      .from("leads")
      .select("business_id")
      .eq("business_id", typed)
      .maybeSingle();
    if (!error && !existing) return typed; // free to use
  }

  const { data: newLeadIdResult, error: idError } = await supabase.rpc("generate_custom_lead_id");
  if (idError || !newLeadIdResult) {
    throw new Error("Failed to generate new Lead ID");
  }
  return String(newLeadIdResult);
};

// Format timestamp safely
const fmtDate = (s?: string | null) => {
  if (!s) return "—";
  try { return new Date(s).toLocaleString(); } catch { return s; }
};


  // ---------- Derived ----------
  // duration factor based on chosen days
  const durationFactor = useMemo(() => {
    switch (parseInt(subscriptionCycle || "0", 10)) {
      case 15: return 0.5;
      case 30: return 1;
      case 60: return 2;
      case 90: return 3;
      default: return 0;
    }
  }, [subscriptionCycle]);

  // subscription total for selected duration
  const autoTotal = useMemo(
    () => n(subscriptionSaleValue) * durationFactor,
    [subscriptionSaleValue, durationFactor]
  );

  // grand total (subscription for duration + add-ons)
  const totalSale = useMemo(
    () =>
      autoTotal +
      n(resumeValue) +
      n(portfolioValue) +
      n(linkedinValue) +
      n(githubValue)+
       n(coursesValue) +   // NEW
    n(customValue),     // NEW
    [autoTotal, resumeValue, portfolioValue, linkedinValue, githubValue, coursesValue, customValue]
  );

  const nextDueDate = useMemo(() => {
    const cyc = parseInt(subscriptionCycle || "0", 10);
    if (!onboardingDate || !cyc) return "-";
    return plusDays(onboardingDate, cyc);
  }, [onboardingDate, subscriptionCycle]);

  // Fetch referrer by cleaned AWL-#### id and fill the name
const handleReferrerLookup = async () => {
  const cleaned = formatReferrerId(referrerId || "");
  setReferrerId(cleaned);

  // only lookup if it looks like a real id: AWL-<digits>
  if (!/^AWL-\d+$/.test(cleaned)) {
    setReferrerName("");
    setRefLookupError(null);
    return;
  }

  try {
    setRefLookupLoading(true);
    setRefLookupError(null);

    const { data, error } = await supabase
      .from("leads")
      .select("name, source")
      .eq("business_id", cleaned)
      .maybeSingle();

    if (error) throw error;

    setReferrerName(data?.name ?? "");
  } catch (e: any) {
    setReferrerName("");
    setRefLookupError(e?.message || "Could not find referrer");
  } finally {
    setRefLookupLoading(false);
  }
};

  const handleSubmit = async () => {
  try {

    if (contactNumber && !/^\+?\d{7,15}$/.test(contactNumber)) {
  return alert("Enter a valid phone number: '+' optional, 7–15 digits.");
}

    // Front-end validations mapped to table constraints
    if (!clientName.trim()) return alert("Client name is required.");
    if (!clientEmail.trim()) return alert("Client email is required.");
    if (!paymentMode) return alert("Payment mode is required.");
    if (!subscriptionCycle) return alert("Subscription duration is required.");
    if (!onboardingDate) return alert("Onboarding date is required.");
    if (totalSale <= 0) return alert("Total sale value must be greater than 0.");

    const normalizedEmail = clientEmail.trim().toLowerCase();
    const durationInDays = parseInt(subscriptionCycle, 10);
    const createdAt = new Date().toISOString();

    setLoading(true);

    // 0) Always resolve a unique lead id (uses typed one if free, else RPC)
    let finalLeadId = await getUniqueLeadId(leadId);

   // Cleaned referrer id (AWL-####) if Referral
const cleanedRefId =
  subscriptionSource === "Referral" && referrerId.trim()
    ? formatReferrerId(referrerId)
    : null;

// Look up referrer's source using the cleaned id
let referrerSourceValue: string | null = null;
if (cleanedRefId) {
  const { data: refLead, error: refErr } = await supabase
    .from("leads")
    .select("source")
    .eq("business_id", cleanedRefId)
    .maybeSingle();
  if (refErr) {
    console.warn("Could not fetch referrer source", refErr.message);
  } else {
    referrerSourceValue = refLead?.source ?? null;
  }
}

// Incentives
const incentivesValue = subscriptionSource === "Referral" ? 1.5 : 0;


const normalizedCompanyAppEmail =
  (companyApplicationEmail || "").trim().toLowerCase() || null;

    // 1) Insert into leads first
   const leadsPayload: any = {
  business_id: finalLeadId,               // explicit; avoids relying on default
  name: clientName.trim(),
  phone: contactNumber.trim() || null,
  email: normalizedEmail,
    status:"Assigned",
    current_stage:"sale done",
  city: city.trim() || null,
  source: referrerSourceValue || null,     // "Referral" or "NEW"
  created_at: createdAt,
  assigned_to: closerName?.trim() || null,
  assigned_to_email: closerEmail || null,
referral_id: cleanedRefId,
  incentives: incentivesValue,            // <-- NEW
  metadata: cleanedRefId
  ? {
      referrer_name: referrerName.trim() || null,
      referrer_source: referrerSourceValue,
    }
  : null,
  // status/current_stage use DB defaults
};
    let leadInsert = await supabase
      .from("leads")
      .insert(leadsPayload)
      .select("business_id")
      .single();
console.log("Lead insert result:", leadInsert);
    // 1b) Rare race: if duplicate key, generate a new ID and retry once
    if (leadInsert.error && (leadInsert.error as any).code === "23505") {
      finalLeadId = await getUniqueLeadId(); // force RPC
      leadsPayload.business_id = finalLeadId;
      leadInsert = await supabase
        .from("leads")
        .insert(leadsPayload)
        .select("business_id")
        .single();
    }
    if (leadInsert.error) throw leadInsert.error;

    // 2) Insert into sales_closure using finalLeadId
    const salesPayload = {
      lead_id: finalLeadId,                       // text NOT NULL
      email: normalizedEmail,
      lead_name: clientName.trim(),
          company_application_email: normalizedCompanyAppEmail,

      payment_mode: paymentMode,
      subscription_cycle: durationInDays,
      sale_value: totalSale,
      // omit closed_at to use DB default now()
      onboarded_date: null,
      finance_status: "Paid" as const,
      resume_sale_value: numOrNull(resumeValue),
      linkedin_sale_value: numOrNull(linkedinValue),
      github_sale_value: numOrNull(githubValue),
      portfolio_sale_value: numOrNull(portfolioValue),

      courses_sale_value: numOrNull(coursesValue),
  custom_label: (customLabel.trim() || null),
  custom_sale_value: numOrNull(customValue),
  commitments: (commitments.trim() || null),

      checkout_date: null,
      invoice_url: "",
      associates_email: "",
      associates_name: "",
      associates_tl_email: "",
      associates_tl_name: "",
    };

    const { error: salesErr } = await supabase.from("sales_closure").insert(salesPayload);
    if (salesErr) {
      // cleanup if second insert fails
      await supabase.from("leads").delete().eq("business_id", finalLeadId);
      throw salesErr;
    }

    setLoading(false);

    // Reset the form
    setClientName("");
    setClientEmail("");
    setCompanyApplicationEmail("");

    setContactNumber("");
    setCity("");
    setOnboardingDate("");
    setSubscriptionCycle("");
    setSubscriptionSaleValue("");
    setPaymentMode("");
    setResumeValue("");
    setPortfolioValue("");
    setLinkedinValue("");
    setGithubValue("");
    setCoursesValue("");
setCustomLabel("");
setCustomValue("");
setCommitments("");

    setSubscriptionSource("");
    setReferrerId("");
    setReferrerName("");
    setLeadId("");

    alert(`✅ Saved! Lead ID: ${finalLeadId}`);
  } catch (err: any) {
    setLoading(false);
    console.error("❌ Error onboarding client:", err?.message || err);
    alert(`Failed to onboard client: ${err?.message || "Unknown error"}`);
  }
};


  const handleQuickSearch = async () => {
  // require at least one filter
  const hasAny =
    qlName.trim() || qlEmail.trim() || qlPhone.trim() || qlLeadId.trim();
  if (!hasAny) {
    alert("Enter at least one filter (Name / Email / Phone / Lead ID).");
    return;
  }

  try {
    setSearchLoading(true);
    setSearchError(null);

    let query: any = supabase
      .from("leads")
      .select("business_id,name,email,source,current_stage,created_at")
      .order("created_at", { ascending: false });

    if (qlName.trim())   query = query.ilike("name", `%${qlName.trim()}%`);
    if (qlEmail.trim())  query = query.ilike("email", `%${qlEmail.trim().toLowerCase()}%`);
    if (qlPhone.trim())  query = query.ilike("phone", `%${qlPhone.trim()}%`);
    if (qlLeadId.trim()) query = query.ilike("business_id", `%${qlLeadId.trim()}%`);

    const { data, error } = await query.limit(100);
    if (error) throw error;

    setSearchResults(data ?? []);
  } catch (err: any) {
    console.error(err);
    setSearchError(err?.message || "Search failed");
    setSearchResults([]);
  } finally {
    setSearchLoading(false);
  }
};


  // ---------- Quick Lead Info (RIGHT FORM) ----------
  const [qlName, setQlName] = useState("");
  const [qlEmail, setQlEmail] = useState("");
  const [qlPhone, setQlPhone] = useState("");
  const [qlLeadId, setQlLeadId] = useState("");

  const applyQuickLeadToMain = () => {
    if (qlName) setClientName(qlName);
    if (qlEmail) setClientEmail(qlEmail);
    if (qlPhone) setContactNumber(qlPhone);
    if (qlLeadId) setLeadId(qlLeadId);
    alert("➡️ Quick Lead Info applied to the main form.");
  };

  const resetQuickLead = () => {
    setQlName("");
    setQlEmail("");
    setQlPhone("");
    setQlLeadId("");
  };

  // Keep only one leading "+" and digits; cap to E.164 (max 15 digits)
const sanitizePhone = (input: string) => {
  const raw = (input || "").replace(/[^\d+]/g, ""); // strip everything except + and digits
  let out = "";
  for (const ch of raw) {
    if (ch === "+") {
      if (out.length === 0) out = "+"; // only allow + at the start, once
    } else {
      out += ch; // digits
    }
  }
  // limit to 15 digits total (E.164). Keep leading + if present.
  if (out.startsWith("+")) out = "+" + out.slice(1).replace(/\D/g, "").slice(0, 15);
  else out = out.replace(/\D/g, "").slice(0, 15);
  return out;
};

 
  return (
<ProtectedRoute
  allowedRoles={[
    "Sales",
    "Sales Associate",
    "Marketing",
    "Finance",
    "Account Management",  // ← was "Accounts"
    "Resume Head",
    "Technical Head",
    "Super Admin",
  ]}
>
      <DashboardLayout>
        <main className="py-0 px-0 mx-0 my-0 max-w-full p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* LEFT: Main Onboarding Form */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>🧾 Onboard New Client</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Lead ID (optional) */}
                {/* <div>
                  <Label className="font-medium">Lead ID (optional; will auto-generate if empty)</Label>
                  <Input
                    placeholder="LD-1234567890"
                    value={leadId}
                    onChange={(e) => setLeadId(e.target.value)}
                    className="mt-1"
                  />
                </div> */}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Client Details */}
                  <div className="border rounded-md p-4 space-y-3">
                    <Label className="font-semibold">
                      Client Details <span className="text-red-500">*</span>
                    </Label>

                    <Input
                      placeholder="Client Full Name"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                    />

                    <Input
                      placeholder="Client Email"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                    />
                    <Input
  placeholder="Company Application Email PWD: Created@123"
  value={companyApplicationEmail}
  onChange={(e) => setCompanyApplicationEmail(e.target.value)}
/>

                    <Input
  placeholder="Contact Number with country code"
  value={contactNumber}
  onChange={(e) => setContactNumber(sanitizePhone(e.target.value))}
  onBlur={() => setContactNumber(sanitizePhone(contactNumber))}
  inputMode="tel"
  maxLength={16} // "+" + up to 15 digits
  pattern="^\+?[0-9]{0,15}$"
  className="font-mono"
/>


                    <Input
                      placeholder="City"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                    />

                    <Input
                      type="date"
                      value={onboardingDate}
                      onChange={(e) => setOnboardingDate(e.target.value)}
                      placeholder="dd-mm-yyyy"
                    />
                  </div>

                  {/* Subscription & Payment Info */}
                  <div className="border rounded-md p-4 space-y-3">
                    <Label className="font-semibold">
                      Subscription & Payment Info <span className="text-red-500">*</span>
                    </Label>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {/* Payment mode */}
                      <div className="md:col-span-3">
                        <Select value={paymentMode} onValueChange={setPaymentMode}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Payment Mode" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="UPI">UPI</SelectItem>
                            <SelectItem value="PayPal">PayPal</SelectItem>
                            <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                            <SelectItem value="Credit/Debit Card">Credit/Debit Card</SelectItem>
                            <SelectItem value="Stripe">Stripe</SelectItem>
                              <SelectItem value="Razorpay">Razorpay</SelectItem> {/* NEW */}

                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Subscription cycle */}
                      <div className="md:col-span-3">
                        <Select value={subscriptionCycle} onValueChange={setSubscriptionCycle}>
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

                      {/* Sale value + Auto total (equal width) */}
                      <div className="md:col-span-3 grid grid-cols-2 gap-3">
                        <Input
                          type="number"
                          inputMode="decimal"
                          min="0"
                          step="0.01"
                          placeholder="Subscription Sale Value ($) — monthly"
                          value={subscriptionSaleValue}
                          onChange={(e) => setSubscriptionSaleValue(e.target.value)}
                        />
                        <Input
                          placeholder="Auto Total (Subscription Only)"
                          value={autoTotal.toFixed(2)}
                          disabled
                        />
                      </div>

                      {/* Source */}
                      <div className="md:col-span-3">
                        <Select value={subscriptionSource} onValueChange={setSubscriptionSource}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Client Source" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Referral">Referral</SelectItem>
                            <SelectItem value="NEW">NEW</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Referral extras */}
                   {subscriptionSource === "Referral" && (
  <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-3">
    <div className="space-y-1">
      <Input
        placeholder="Referrer ID (AWL-123)"
        value={referrerId || "AWL-"}
        onChange={(e) => setReferrerId(formatReferrerId(e.target.value))}
        onBlur={handleReferrerLookup}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            handleReferrerLookup();
          }
        }}
        inputMode="numeric"
        className="font-mono"
      />
      <p className="text-xs text-gray-500">
        {refLookupLoading ? "Looking up referrer…" :
         refLookupError ? <span className="text-red-600">{refLookupError}</span> :
         referrerName ? "Referrer found." : ""}
      </p>
    </div>

    <Input
      placeholder="Referrer Name"
      value={referrerName}
      onChange={(e) => setReferrerName(e.target.value)}
    />
  </div>
)}



                      {/* Sale Closing By (disabled) */}
                        <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                         <Input
                         value="Sale Closing By"
                          disabled
                            readOnly
                          placeholder="Sale Closing By" className="mt-1 text-gray-900 bg-gray-50 disabled:opacity-100 disabled:cursor-default"
                        />                      <Input
    value={closerName || "—"}
    disabled
    readOnly
    className="mt-1 text-gray-900 bg-gray-50 disabled:opacity-100 disabled:cursor-default"
    // If your Input base forces opacity via CSS, this guarantees full visibility:
    style={{ opacity: 1 }}
  />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Add-on Services */}
                <div className="border rounded-md p-4 space-y-3">
                  <Label className="font-semibold">Optional Add-On Services</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      type="number"
                      inputMode="decimal"
                      min="0"
                      step="0.01"
                      placeholder="Resume Sale Value ($)"
                      value={resumeValue}
                      onChange={(e) => setResumeValue(e.target.value)}
                    />
                    <Input
                      type="number"
                      inputMode="decimal"
                      min="0"
                      step="0.01"
                      placeholder="Portfolio Creation Value ($)"
                      value={portfolioValue}
                      onChange={(e) => setPortfolioValue(e.target.value)}
                    />
                    <Input
                      type="number"
                      inputMode="decimal"
                      min="0"
                      step="0.01"
                      placeholder="LinkedIn Optimization Value ($)"
                      value={linkedinValue}
                      onChange={(e) => setLinkedinValue(e.target.value)}
                    />
                    <Input
                      type="number"
                      inputMode="decimal"
                      min="0"
                      step="0.01"
                      placeholder="GitHub Optimization Value ($)"
                      value={githubValue}
                      onChange={(e) => setGithubValue(e.target.value)}
                    />
                                      {/* Courses / Certifications ($) */}

                    <Input
  type="number"
  inputMode="decimal"
  min="0"
  step="0.01"
  placeholder="Courses / Certifications Value ($)"
  value={coursesValue}
  onChange={(e) => setCoursesValue(e.target.value)}
/>
<div className="flex gap-2">
  <Input
    placeholder="Custom Add-on (e.g., Courses)"
    value={customLabel}
    onChange={(e) => setCustomLabel(e.target.value)}
    className="w-1/2"
  />
  <Input
    type="number"
    inputMode="decimal"
    min="0"
    step="0.01"
    placeholder="Custom Add-on Value ($)"
    value={customValue}
    onChange={(e) => setCustomValue(e.target.value)}
    className="w-1/2"
  />
</div>
                  </div>


{/* Custom add-on: label + amount */}

{/* Commitments */}
<div className="border rounded-md p-4 space-y-2">
  <Label className="font-semibold">Commitments</Label>
  <Textarea
    placeholder="Enter commitments (e.g., # of applications per week, review calls, deliverables, timelines…)"
    value={commitments}
    onChange={(e) => setCommitments(e.target.value)}
    required
  />
</div>

                </div>

                {/* Auto Calculated + Submit */}
                <div className="border rounded-md p-4">
                  <Label className="font-semibold">Auto Calculated</Label>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-2">
                    <p>
                      Total Sale Value: <strong>${totalSale.toFixed(2)}</strong>
                    </p>
                    <p>
                      Next Payment Due Date: <strong>{nextDueDate || "-"}</strong>
                    </p>
                    <Button
                      className="bg-green-600 text-white hover:bg-green-700"
                      onClick={handleSubmit}
                      disabled={loading}
                    >
                      {loading ? "Submitting..." : "Submit"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* RIGHT: Quick Lead Info (4 fields) */}
            <div className="lg:col-span-1 grid grid-cols-1 gap-6 overflow-hidden">
         <Card className="lg:col-span-1">
  <CardHeader>
    <CardTitle>Quick Lead Info</CardTitle>
  </CardHeader>

  {/* Submit triggers search; Enter works in any field */}
  <CardContent>
    <form
      onSubmit={(e) => { e.preventDefault(); handleQuickSearch(); }}
      className="space-y-3"
    >
      {/* Lead ID */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
        <Label htmlFor="qlLeadId" className="sm:w-36 shrink-0 text-sm text-gray-600">
          Lead ID
        </Label>
        <Input
          id="qlLeadId"
          placeholder="AWL-000"
          value={qlLeadId}
          onChange={(e) => setQlLeadId(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleQuickSearch(); } }}
          className="sm:flex-1"
        />
      </div>

      {/* Name */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
        <Label htmlFor="qlName" className="sm:w-36 shrink-0 text-sm text-gray-600">
          Name
        </Label>
        <Input
          id="qlName"
          placeholder="Lead Full Name"
          value={qlName}
          onChange={(e) => setQlName(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleQuickSearch(); } }}
          className="sm:flex-1"
        />
      </div>

      {/* Email */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
        <Label htmlFor="qlEmail" className="sm:w-36 shrink-0 text-sm text-gray-600">
          Email
        </Label>
        <Input
          id="qlEmail"
          placeholder="lead@email.com"
          value={qlEmail}
          onChange={(e) => setQlEmail(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleQuickSearch(); } }}
          className="sm:flex-1"
        />
      </div>

      {/* Phone */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
        <Label htmlFor="qlPhone" className="sm:w-36 shrink-0 text-sm text-gray-600">
          Phone Number
        </Label>
        <Input
          id="qlPhone"
          placeholder="+1 555 123 4567"
          value={qlPhone}
          onChange={(e) => setQlPhone(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleQuickSearch(); } }}
          className="sm:flex-1"
        />
      </div>

      {/* Actions */}
<div className="flex w-full items-center justify-end gap-2 pt-2">
        <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white">
          Search
        </Button>
       
        <Button
          type="button"
          variant="outline"
          onClick={() => { resetQuickLead(); setSearchResults([]); }}
        >
          Reset
        </Button>
      </div>

      <p className="text-xs text-gray-500">
        Type any combination (Name, Email, Phone, Lead ID) then press Enter or click Search.
      </p>
    </form>
  </CardContent>
</Card>

<Card className="lg:col-span-1 mt-4 h-[56vh] flex flex-col">
  <CardHeader className="shrink-0">
    <CardTitle>Search Results </CardTitle>
    <p className="text-gray-400">slide to left to see complete data</p>
  </CardHeader>
  <CardContent className="flex-1 overflow-y-auto overflow-x-hidden p-0">
    {searchLoading && <p className="p-4 text-sm text-gray-600">Searching…</p>}
    {searchError && <p className="p-4 text-sm text-red-600">{searchError}</p>}

    {!searchLoading && !searchError && searchResults.length === 0 && (
      <p className="p-4 text-sm text-gray-500">No results yet. Enter filters and search.</p>
    )}

    {!searchLoading && !searchError && searchResults.length > 0 && (
      <div className="overflow-x-auto">
        <Table className="w-full">
          {/* Keep header visible when scrolling */}
          <TableHeader className="sticky top-0 bg-white z-10">
            <TableRow>
              <TableHead>Lead ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {searchResults.map((row) => (
              <TableRow key={row.business_id}>
                <TableCell className="font-medium">{row.business_id}</TableCell>
                <TableCell>{row.name}</TableCell>
                <TableCell>{row.email}</TableCell>
                <TableCell>{row.source ?? "—"}</TableCell>
                <TableCell>{row.current_stage ?? "—"}</TableCell>
                <TableCell>{fmtDate(row.created_at)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )}
  </CardContent>
</Card>
</div>

          </div>
        </main>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
