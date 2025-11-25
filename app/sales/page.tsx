// //app/sales/page.tsx
// "use client";

// import { useEffect, useState } from "react";
// import { supabase } from '@/utils/supabase/client';
// import { DashboardLayout } from "@/components/layout/dashboard-layout";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
// import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Textarea } from "@/components/ui/textarea";
// import { EditIcon, Eye, Search } from "lucide-react";
// import ProtectedRoute from "@/components/auth/ProtectedRoute";
// import { createAndUploadInvoice } from '@/lib/createInvoice';
// import dayjs from 'dayjs';
// import relativeTime from 'dayjs/plugin/relativeTime';
// dayjs.extend(relativeTime);
// import isBetween from "dayjs/plugin/isBetween";
// import * as XLSX from "xlsx";


// dayjs.extend(isBetween);


// type SalesStage = "Prospect" | "DNP" | "Out of TG" | "Not Interested" | "Conversation Done" | "sale done" | "Target";

// interface CallHistory {
//   id: string;          // ← add id to update precisely
//   date: string;        // followup_date (YYYY-MM-DD)
//   stage: SalesStage;
//   notes: string;
// }

// type PRPaidFlag = "Paid" | "Not paid";
// type PRRow = {
//   lead_id: string;
//   name: string;
//   email: string;
//   closed_at: string | null; // oldest closure date (YYYY-MM-DD or null)

//   resumePaid: PRPaidFlag;
//   resumeStatus: string | null;
//   resumePdf: string | null;

//   portfolioPaid: PRPaidFlag;
//   portfolioStatus: string | null;
//   portfolioLink: string | null;

//   githubPaid: PRPaidFlag; // no status/link available for github in resume_progress
// };







// interface Lead {
//   id: string;
//   business_id: string;
//   client_name: string;
//   email: string;
//   phone: string;
//   status?: string;     // Optional, if you want to track status
//   assigned_to: string;
//   current_stage: SalesStage;
//   call_history: CallHistory[];
//   created_at: string | null;
//   assigned_at: string | null;
// }

// interface Profile {
//   full_name: string;
//   roles: string;
// }
// // interface SaleClosing {
// //   sale_value: number;
// //   subscription_cycle: 15 | 30 | 60 | 90; // Subscription cycle in days
// //   payment_mode: "UPI" | "PayPal" | "Bank Transfer" | "Stripe" | "Credit/Debit Card" | "Other";
// // }

// interface SaleClosing {
//   base_value: number;                 // price for 1-month
//   subscription_cycle: 0 | 15 | 30 | 60 | 90;
//   payment_mode: "UPI" | "PayPal" | "Bank Transfer" | "Stripe" | "Credit/Debit Card" | "Other";
//   closed_at: string;                  // YYYY-MM-DD picked from calendar
//   resume_value: number;
//   portfolio_value: number;
//   linkedin_value: number;
//   github_value: number;
//   badge_value: number | null;   // ✅ NEW
//   job_board_value: number;


//   // NEW
//   courses_value: number;   // Courses/Certifications ($)
//   custom_label: string;    // Custom label
//   custom_value: number;    // Custom ($)
//   commitments: string;     // Free-text commitments
//   company_application_email: string;

//   no_of_job_applications: number | null;

// }


// interface FollowUp {
//   follow_up_date: string;
//   notes: string;
// }

// const salesStages: SalesStage[] = [
//   "Prospect", "DNP", "Out of TG", "Not Interested", "Conversation Done", "Target", "sale done"
// ];

// const getStageColor = (stage: SalesStage) => {
//   switch (stage) {
//     case "Prospect": return "bg-blue-100 text-blue-800";
//     case "DNP": return "bg-yellow-100 text-yellow-800";
//     case "Out of TG":
//     case "Not Interested": return "bg-red-100 text-red-800";
//     case "Conversation Done": return "bg-purple-100 text-purple-800";
//     case "sale done": return "bg-green-100 text-green-800";
//     case "Target": return "bg-orange-100 text-orange-800";
//     default: return "bg-gray-100 text-gray-800";
//   }
// };



// export default function SalesPage() {
//   const [leads, setLeads] = useState<Lead[]>([]);
//   const [userProfile, setUserProfile] = useState<Profile | null>(null);
//   const [salesClosedTotal, setSalesClosedTotal] = useState(0);

//   const [salesUsers, setSalesUsers] = useState<{ full_name: string; user_email: string }[]>([]);

//   const [prDialogOpen, setPrDialogOpen] = useState(false);
//   const [prLoading, setPrLoading] = useState(false);
//   const [prRows, setPrRows] = useState<PRRow[]>([]);

//   const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
//   const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
//   const [followUpDialogOpen, setFollowUpDialogOpen] = useState(false);
//   const [saleClosingDialogOpen, setSaleClosingDialogOpen] = useState(false);
//   const [searchTerm, setSearchTerm] = useState("");
//   const [stageFilter, setStageFilter] = useState<string>("all");
//   const [followUpData, setFollowUpData] = useState<FollowUp>({ follow_up_date: "", notes: "" });
//   const [followUpSubmitted, setFollowUpSubmitted] = useState(false); // Track if follow-up was submitted
//   const [followUpsDialogOpen, setFollowUpsDialogOpen] = useState(false);
//   const [followUpsData, setFollowUpsData] = useState<any[]>([]);
//   const [followUpsFilter, setFollowUpsFilter] = useState<"today" | "all">("today");
//   const [pendingStageUpdate, setPendingStageUpdate] = useState<{ leadId: string, stage: SalesStage } | null>(null);
//   const [previousStage, setPreviousStage] = useState<SalesStage | null>(null);
//   const [totalAmount, setTotalAmount] = useState(0);
//   const [subscriptionEndsOn, setSubscriptionEndsOn] = useState<string>("");
//   const [startDate, setStartDate] = useState<string | null>(null);
//   const [editingNote, setEditingNote] = useState(false);
//   const [editedNote, setEditedNote] = useState("");


//   const [endDate, setEndDate] = useState<string | null>(null);
//   const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);
//   const [onboardDialogOpen, setOnboardDialogOpen] = useState(false);

//   // Client Info
//   const [clientName, setClientName] = useState("");
//   const [clientEmail, setClientEmail] = useState("");
//   const [contactNumber, setContactNumber] = useState("");
//   const [city, setCity] = useState("");
//   const [onboardingDate, setOnboardingDate] = useState("");

//   // Subscription
//   const [paymentMode, setPaymentMode] = useState("");
//   const [subscriptionCycle, setSubscriptionCycle] = useState(""); // Values: "15", "30", "60", "90"
//   const [subscriptionSaleValue, setSubscriptionSaleValue] = useState("");
//   const [subscriptionSource, setSubscriptionSource] = useState("");

//   // Add-ons
//   const [resumeValue, setResumeValue] = useState("");
//   const [portfolioValue, setPortfolioValue] = useState("");
//   const [linkedinValue, setLinkedinValue] = useState("");
//   const [githubValue, setGithubValue] = useState("");



//   // Calculated Fields
//   const [autoTotal, setAutoTotal] = useState(0);
//   const [totalSale, setTotalSale] = useState(0);
//   const [nextDueDate, setNextDueDate] = useState("-");

//   // Auto calculate subscription total
//   useEffect(() => {
//     const base = parseFloat(subscriptionSaleValue || "0");
//     const cycle = parseInt(subscriptionCycle || "0");

//     const multiplier =
//     cycle  === 0 ? 0 :
//       cycle === 15 ? 0.5 :
//         cycle === 30 ? 1 :
//           cycle === 60 ? 2 :
//             cycle === 90 ? 3 : 0;

//     setAutoTotal(base * multiplier);
//   }, [subscriptionSaleValue, subscriptionCycle]);

//   // Auto calculate total sale
//   useEffect(() => {
//     const resume = parseFloat(resumeValue || "0");
//     const linkedin = parseFloat(linkedinValue || "0");
//     const github = parseFloat(githubValue || "0");
//     const portfolio = parseFloat(portfolioValue || "0");

//     setTotalSale(autoTotal + resume + linkedin + github + portfolio);
//   }, [autoTotal, resumeValue, linkedinValue, githubValue, portfolioValue]);


// useEffect(() => {
//   fetchSalesUsers();
// }, []);


//   useEffect(() => {
//     fetchSalesClosureCount();
//   }, []);

//   useEffect(() => {
//     const run = async () => {
//       let q = supabase
//         .from("sales_closure")
//         .select("lead_id", { count: "exact", head: true });

//       if (startDate && endDate) {
//         q = q
//           .gte("closed_at", dayjs(startDate).format("YYYY-MM-DD"))
//           .lte("closed_at", dayjs(endDate).format("YYYY-MM-DD"));
//       }

//       const { count, error } = await q;
//       if (!error) setSalesClosedTotal(count ?? 0);
//     };
//     run();
//   }, [startDate, endDate]);

//   // Calculate next payment due date
//   useEffect(() => {
//     const days = parseInt(subscriptionCycle || "0");
//     if (days && onboardingDate) {
//       setNextDueDate(dayjs(onboardingDate).add(days, "day").format("YYYY-MM-DD"));
//     } else {
//       setNextDueDate("-");
//     }
//   }, [subscriptionCycle, onboardingDate]);






//   // const [saleData, setSaleData] = useState<SaleClosing>({
//   //   sale_value: 0,
//   //   subscription_cycle: "" as unknown as 15 | 30 | 60 | 90,  // ← trick to allow placeholder
//   //   payment_mode: "" as unknown as SaleClosing["payment_mode"]
//   // });

//   const [saleData, setSaleData] = useState<SaleClosing>({
//     base_value: 0,
//     subscription_cycle: "" as unknown as 0 | 15 | 30 | 60 | 90,
//     payment_mode: "" as unknown as SaleClosing["payment_mode"],
//     closed_at: "",
//     resume_value: 0,
//     portfolio_value: 0,
//     linkedin_value: 0,
//     github_value: 0,
//     // NEW
//     courses_value: 0,
//     custom_label: "",
//     custom_value: 0,
//     commitments: "",
//     company_application_email: "",  // Add this field
//     no_of_job_applications: null,
//     badge_value: null,                           // ✅ NEW
//     job_board_value: 0,



//   });



//   useEffect(() => {
//     fetchUserProfile();

//   }, []);

//   const fetchUserProfile = async () => {
//     const { data: { user }, error: authError } = await supabase.auth.getUser();
//     if (authError || !user) {
//       console.error("Error fetching auth user:", authError);
//       return;
//     }

//     const { data: profile, error: profileError } = await supabase
//       .from("profiles")
//       .select("full_name, roles")
//       .eq("auth_id", user.id)
//       .single();

//     if (profileError) {
//       console.error("Error fetching profile:", profileError);
//       return;
//     }

//     console.log("Fetched profile:", profile);

//     setUserProfile(profile);
//     fetchLeads(profile);   // pass profile here
//   };

//   const fetchLeads = async (profile: Profile) => {
//     let query = supabase
//       .from("leads")
//       .select(`
//       id, business_id, name, email, phone,
//       assigned_to, current_stage, status,
//       created_at, assigned_at
//     `)
//       .eq("status", "Assigned"); // ← only Assigned

//     // Sales Associate → only their leads by assigned_to
//     if (profile.roles === "Sales Associate") {
//       query = query.eq("assigned_to", profile.full_name);
//     } else {
//       // Admin / Sales see all Assigned
//       // query = query.not("assigned_to", "is", null).neq("assigned_to", "");
//     }

//     const { data, error } = await query;
//     if (error) {
//       console.error("Error fetching leads:", error);
//       return;
//     }

//     const leadsData: Lead[] = (data ?? []).map((lead: any) => ({
//       id: lead.id,
//       business_id: lead.business_id,
//       client_name: lead.name,
//       email: lead.email,
//       phone: lead.phone,
//       assigned_to: lead.assigned_to,
//       current_stage: lead.current_stage,
//       call_history: [], // Provide an empty array for call_history
//       created_at: lead.created_at,
//       assigned_at: lead.assigned_at,
//     }));

//     setLeads(leadsData);
//   };


//   /* 🔄 Re-compute total every time a relevant field changes */
//   useEffect(() => {
//     const multiplier =
//     saleData.subscription_cycle === 0 ? 0 :
//       saleData.subscription_cycle === 15 ? 0.5 :
//         saleData.subscription_cycle === 30 ? 1 :
//           saleData.subscription_cycle === 60 ? 2 : 3; // 90


//     const addOns =
//       saleData.resume_value +
//       saleData.portfolio_value +
//       saleData.linkedin_value +
//       saleData.github_value +
//       saleData.courses_value +   // NEW
//       saleData.custom_value;     // NEW
//       saleData.job_board_value;  // ✅ new field


//     setTotalAmount(saleData.base_value * multiplier + addOns);
//   }, [
//     saleData.base_value,
//     saleData.subscription_cycle,
//     saleData.resume_value,
//     saleData.portfolio_value,
//     saleData.linkedin_value,
//     saleData.github_value,
//     saleData.courses_value,   // NEW
//     saleData.custom_value,    // NEW
//     saleData.job_board_value, // ✅ new field
//   ]);




//   /* 📅  Compute subscription-end date preview */
//   useEffect(() => {
//     if (!saleData.closed_at || !saleData.subscription_cycle) {
//       setSubscriptionEndsOn(""); return;
//     }
//     const start = new Date(saleData.closed_at);
//     start.setDate(start.getDate() + saleData.subscription_cycle);
//     setSubscriptionEndsOn(start.toISOString().slice(0, 10));
//   }, [saleData.closed_at, saleData.subscription_cycle]);


//   const fetchFollowUps = async () => {
//     if (!userProfile) return [];

//     let leadsQuery = supabase
//       .from("leads")
//       .select("id, business_id, name, email, phone, assigned_to, current_stage")
//       .in("current_stage", ["DNP", "Conversation Done", "Target"]);

//     // 🔒 Filter by name if not Admin
//     if (userProfile.roles === "Sales Associate") {
//       leadsQuery = leadsQuery.eq("assigned_to", userProfile.full_name);
//     }

//     const { data: leadsData, error: leadsError } = await leadsQuery;
//     if (leadsError) {
//       console.error("❌ Error fetching leads:", leadsError);
//       return [];
//     }

//     const businessIds = leadsData.map((l) => l.business_id);

//     const { data: historyData, error: historyError } = await supabase
//       .from("call_history")
//       .select("id, lead_id, followup_date, notes")
//       .in("lead_id", businessIds)
//       .order("followup_date", { ascending: false });

//     if (historyError) {
//       console.error("❌ Error fetching call history:", historyError);
//       return [];
//     }

//     const mostRecentMap = new Map<string, { followup_date: string; notes: string }>();
//     for (const entry of historyData) {
//       if (!mostRecentMap.has(entry.lead_id)) {
//         mostRecentMap.set(entry.lead_id, {
//           followup_date: entry.followup_date ?? "N/A",
//           notes: entry.notes ?? "N/A",
//         });
//       }
//     }

//     return leadsData.map((lead) => ({
//       ...lead,
//       followup_date: mostRecentMap.get(lead.business_id)?.followup_date ?? "N/A",
//       notes: mostRecentMap.get(lead.business_id)?.notes ?? "N/A",
//     }));
//   };

//   async function openPortfolioResumesDialog() {
//     try {
//       setPrLoading(true);

//       // 1) Leads owned by this salesperson, stage = 'sale done'
//       let leadsQ = supabase
//         .from("leads")
//         .select("business_id, name, email, assigned_to")
//         .eq("current_stage", "sale done");

//       // Scope to the logged-in Sales Associate; Admin/Sales see all
//       if (userProfile?.roles === "Sales Associate") {
//         leadsQ = leadsQ.eq("assigned_to", userProfile.full_name);
//       }

//       const { data: leadRows, error: leadsErr } = await leadsQ;
//       if (leadsErr) throw leadsErr;

//       const ids = (leadRows ?? []).map((l) => l.business_id).filter(Boolean);
//       if (ids.length === 0) {
//         setPrRows([]);
//         setPrDialogOpen(true);
//         return;
//       }

//       const leadMeta = new Map(
//         (leadRows ?? []).map((l) => [l.business_id, { name: l.name, email: l.email }])
//       );

//       // 2) sales_closure → take the OLDEST record per lead_id (by closed_at ASC)
//       const { data: scRows, error: scErr } = await supabase
//         .from("sales_closure")
//         .select("lead_id, closed_at, resume_sale_value, portfolio_sale_value, github_sale_value")
//         .in("lead_id", ids)
//         .order("closed_at", { ascending: true });

//       if (scErr) throw scErr;

//       type OldestMapVal = {
//         closed_at: string | null;
//         resume_sale_value: number | null;
//         portfolio_sale_value: number | null;
//         github_sale_value: number | null;
//       };
//       const oldestMap = new Map<string, OldestMapVal>();

//       for (const r of scRows ?? []) {
//         if (!oldestMap.has(r.lead_id)) {
//           oldestMap.set(r.lead_id, {
//             closed_at: r.closed_at ? dayjs(r.closed_at).format("YYYY-MM-DD") : null,
//             resume_sale_value: r.resume_sale_value ?? null,
//             portfolio_sale_value: r.portfolio_sale_value ?? null,
//             github_sale_value: r.github_sale_value ?? null,
//           });
//         }
//       }

//       // 3a) resume_progress → resume status + pdf_path
//       const { data: rpRows, error: rpErr } = await supabase
//         .from("resume_progress")
//         .select("lead_id, status, pdf_path")
//         .in("lead_id", ids);

//       if (rpErr) throw rpErr;

//       const rpMap = new Map<string, { status: string | null; pdf_path: string | null }>();
//       for (const r of rpRows ?? []) {
//         rpMap.set(r.lead_id, {
//           status: r.status ?? null,
//           pdf_path: r.pdf_path ?? null,
//         });
//       }

//       // 3b) portfolio_progress → portfolio status + link
//       const { data: ppRows, error: ppErr } = await supabase
//         .from("portfolio_progress")
//         .select("lead_id, status, link")
//         .in("lead_id", ids);

//       if (ppErr) throw ppErr;

//       const ppMap = new Map<string, { status: string | null; link: string | null }>();
//       for (const p of ppRows ?? []) {
//         ppMap.set(p.lead_id, {
//           status: p.status ?? null,
//           link: p.link ?? null,
//         });
//       }

//       // 4) Build dialog rows with Paid/Not paid flags and statuses/links
//       const paidFlag = (v: any): "Paid" | "Not paid" =>
//         v !== null && Number(v) !== 0 ? "Paid" : "Not paid";

//       const rows: PRRow[] = ids.map((id) => {
//         const meta = leadMeta.get(id) ?? { name: "-", email: "-" };
//         const o =
//           oldestMap.get(id) ?? {
//             closed_at: null,
//             resume_sale_value: null,
//             portfolio_sale_value: null,
//             github_sale_value: null,
//           };
//         const r = rpMap.get(id);
//         const p = ppMap.get(id);

//         return {
//           lead_id: id,
//           name: meta.name,
//           email: meta.email,
//           closed_at: o.closed_at,

//           // Resume
//           resumePaid: paidFlag(o.resume_sale_value),
//           resumeStatus: r?.status ?? null,
//           resumePdf: r?.pdf_path ?? null,

//           // Portfolio
//           portfolioPaid: paidFlag(o.portfolio_sale_value),
//           portfolioStatus: p?.status ?? null,
//           portfolioLink: p?.link ?? null,

//           // GitHub (sale only, per your spec)
//           githubPaid: paidFlag(o.github_sale_value),
//         };
//       });

//       setPrRows(rows);
//       setPrDialogOpen(true);
//     } catch (e: any) {
//       console.error("Portfolio/Resumes fetch failed:", e?.message || e);
//       alert("Failed to load Portfolio/Resumes.");
//     } finally {
//       setPrLoading(false);
//     }
//   }


//   // 🧭 Sorting Config
//   const [sortConfig, setSortConfig] = useState<{
//     key: keyof Lead | null;
//     direction: 'asc' | 'desc';
//   }>({ key: null, direction: 'asc' });

//   const handleSort = (key: keyof Lead) => {
//     setSortConfig((prev) => ({
//       key,
//       direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
//     }));
//   };

//   const handleSaleClosureUpdate = async () => {
//     if (!selectedLead || !pendingStageUpdate) return;

//     const {
//       base_value, subscription_cycle, payment_mode, closed_at,
//       resume_value, portfolio_value, linkedin_value, github_value, job_board_value,
//       courses_value, custom_label, custom_value, commitments, company_application_email
//     } = saleData;

//     if (!payment_mode ||   subscription_cycle === undefined || subscription_cycle === null || !closed_at || !company_application_email || !commitments) {
//       alert("Please fill all required fields.");
//       return;
//     }

//     const saleTotal = totalAmount;

//     try {
//       const payload: any = {
//         lead_id: selectedLead.business_id,
//         lead_name: selectedLead.client_name,
//         email: selectedLead.email,
//         payment_mode,
//         subscription_cycle,
//         sale_value: saleTotal,
//         closed_at: new Date(closed_at).toISOString(),
//         application_sale_value: applicationSaleValue,
//         resume_sale_value: resume_value || null,
//         portfolio_sale_value: portfolio_value || null,
//         linkedin_sale_value: linkedin_value || null,
//         github_sale_value: github_value || null,
//         company_application_email, // Add this field to the payload
//         badge_value: saleData.badge_value ?? null,     // ✅ NEW
//         job_board_value: job_board_value || 0,

//       };

//       // Conditionally add new fields (avoid error if columns not yet created)
//       if (courses_value) payload.courses_sale_value = courses_value;
//       if (custom_label) payload.custom_label = custom_label;
//       if (custom_value) payload.custom_sale_value = custom_value;
//       if (commitments) payload.commitments = commitments;

//       const { error: updateErr } = await supabase.from("sales_closure").upsert(payload, { onConflict: "lead_id,closed_at" });
//       if (updateErr) throw updateErr;

//       await supabase.from("leads")
//         .update({ current_stage: "sale done" })
//         .eq("id", pendingStageUpdate.leadId);

//       // Reset dialog state
//       setSaleClosingDialogOpen(false);
//       setSaleData({
//         base_value: 0,
//         subscription_cycle: "" as unknown as 0 | 15 | 30 | 60 | 90,
//         payment_mode: "" as unknown as SaleClosing["payment_mode"],
//         closed_at: "",
//         resume_value: 0,
//         portfolio_value: 0,
//         linkedin_value: 0,
//         github_value: 0,
//         courses_value: 0,
//         custom_label: "",
//         custom_value: 0,
//         commitments: "",
//         company_application_email: "", // Reset the email field
//         no_of_job_applications: null,
//         badge_value: 0,            // ✅ NEW
//         job_board_value: 0,

//       });

//       setPendingStageUpdate(null);
//       setPreviousStage(null);

//       const updatedFollowUps = await fetchFollowUps();
//       setFollowUpsData(updatedFollowUps);

//       const jobAppsU = saleData.no_of_job_applications;
//       if (jobAppsU !== null && jobAppsU !== undefined && !Number.isNaN(jobAppsU)) {
//         payload.no_of_job_applications = Math.max(0, Math.floor(jobAppsU));
//       }

//     } catch (err: any) {
//       console.error("Sale update failed:", err.message);
//       alert("Failed to save sale.");
//     }
//   };

// // const handleUpdateAssignedTo = async (leadId: string, selectedName: string, selectedEmail: string) => {
// //   try {
// //     const { error } = await supabase
// //       .from("leads")
// //       .update({
// //         assigned_to: selectedName,
// //         assigned_to_email:selectedEmail,
// //         assigned_at: new Date().toISOString(),
// //       })
// //       .eq("id", leadId);

// //     if (error) throw error;
// //     alert(`Lead assigned to ${selectedName}`);
// //     if (userProfile) await fetchLeads(userProfile);
// //   } catch (err: any) {
// //     console.error("Error updating assigned_to:", err.message);
// //     alert("Failed to update assignment.");
// //   }
// // };


// const handleUpdateAssignedTo = async (leadId: string, selectedName: string, selectedEmail: string) => {
//   try {
//     const { error } = await supabase
//       .from("leads")
//       .update({
//         assigned_to: selectedName,
//         assigned_to_email: selectedEmail,
//         assigned_at: new Date().toISOString(),
//       })
//       .eq("id", leadId);

//     if (error) throw error;
//     alert(`Lead assigned to ${selectedName}`);
//     if (userProfile) await fetchLeads(userProfile);
//   } catch (err: any) {
//     console.error("Error updating assigned_to:", err.message);
//     alert("Failed to update assignment.");
//   }
// };


//   const filteredLeads = leads.filter((lead) => {
//     if ((lead.status ?? "Assigned") !== "Assigned") return false;

//     const matchesSearch =
//       (lead.client_name ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
//       (lead.email ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
//       (lead.phone ?? "").includes(searchTerm);

//     const matchesStage = stageFilter === "all" || lead.current_stage === stageFilter;

//     const matchesDate =
//       !startDate || !endDate ||
//       (lead.assigned_at &&
//         dayjs(lead.assigned_at).isBetween(
//           dayjs(startDate).startOf("day"),
//           dayjs(endDate).endOf("day"),
//           null,
//           "[]"
//         ));

//     return matchesSearch && matchesStage && matchesDate;
//   });

//   const fetchLatestSaleClosure = async (leadId: string) => {
//     try {
//       const { data, error } = await supabase
//         .from("sales_closure")
//         .select("*")
//         .eq("lead_id", leadId)
//         .order("closed_at", { ascending: false })  // Get the most recent sale
//         .limit(1);  // Fetch only the most recent record

//       if (error) throw error;

//       // If a record is found, populate the fields
//       if (data?.length > 0) {
//         const latestSale = data[0];

//         setSaleData({
//           base_value: latestSale.sale_value ?? 0,
//           subscription_cycle: latestSale.subscription_cycle ?? 30,  // Default to 30 if undefined
//           payment_mode: latestSale.payment_mode ?? "UPI",
//           closed_at: latestSale.closed_at ?? "",
//           resume_value: latestSale.resume_sale_value ?? 0,
//           portfolio_value: latestSale.portfolio_sale_value ?? 0,
//           linkedin_value: latestSale.linkedin_sale_value ?? 0,
//           github_value: latestSale.github_sale_value ?? 0,
//           courses_value: latestSale.courses_sale_value ?? 0,
//           custom_label: latestSale.custom_label ?? "",
//           custom_value: latestSale.custom_sale_value ?? 0,
//           commitments: latestSale.commitments ?? "",
//           company_application_email: latestSale.company_application_email ?? "",
//           no_of_job_applications: latestSale.no_of_job_applications ?? null,
//           badge_value: latestSale.badge_value ?? null,            // ✅ NEW
//           job_board_value: latestSale.job_board_value ?? 0,


//         });

//         // Optionally, update the stage if it's being used in the dialog (you can skip if unnecessary)
//         setPendingStageUpdate({ leadId, stage: "sale done" });

//         // Open the dialog for editing
//         setSaleClosingDialogOpen(true);
//       } else {
//         console.log("No sale records found for this lead.");
//       }
//     } catch (error) {
//       console.error("Error fetching sale closure:", error);
//     }
//   };



//   const handleStageUpdate = async (leadId: string, newStage: SalesStage) => {
//     const lead = leads.find((l) => l.id === leadId);
//     if (!lead) return;

//     setSelectedLead(lead);
//     setPreviousStage(lead.current_stage); // Save current stage for revert

//     if (newStage === "DNP" || newStage === "Conversation Done" || newStage === "Target") {
//       setLeads((prev) =>
//         prev.map((l) => (l.id === leadId ? { ...l, current_stage: newStage } : l))
//       );
//       setPendingStageUpdate({ leadId, stage: newStage });
//       setFollowUpDialogOpen(true);
//       return;
//     }

//     if (newStage === "sale done") {
//       setPreviousStage(lead.current_stage); // Save current
//       setPendingStageUpdate({ leadId, stage: newStage });
//       // Save lead to act on after Save
//       setLeads((prev) =>
//         prev.map((l) =>
//           l.id === leadId ? { ...l, current_stage: "sale done" } : l
//         )
//       );
//       setSaleClosingDialogOpen(true);
//       return;
//     }

//     // Immediate update for other stages
//     const updatedLead = { ...lead, current_stage: newStage };
//     const { error } = await supabase.from("leads").update({ current_stage: newStage }).eq("id", leadId);
//     if (error) {
//       console.error("Error updating stage:", error);
//       return;
//     }

//     await supabase.from("call_history").insert([{
//       lead_id: lead.business_id,
//       email: lead.email,
//       phone: lead.phone,
//       assigned_to: lead.assigned_to,
//       current_stage: newStage,
//       // followup_date: new Date().toISOString().split("T")[0],
//       followup_date: todayLocalYMD(),

//       notes: `Stage changed to ${newStage}`
//     }]);

//     setLeads((prev) => prev.map((l) => (l.id === leadId ? updatedLead : l)));
//   };

//   const handleFollowUpSubmit = async () => {
//     if (!selectedLead || !pendingStageUpdate) return;

//     const { error: historyError } = await supabase.from("call_history").insert([{
//       lead_id: selectedLead.business_id,
//       email: selectedLead.email,
//       phone: selectedLead.phone,
//       assigned_to: selectedLead.assigned_to,
//       current_stage: pendingStageUpdate.stage,
//       followup_date: followUpData.follow_up_date,
//       notes: followUpData.notes
//     }]);

//     if (historyError) {
//       console.error("Error inserting follow-up:", historyError);
//       return;
//     }

//     const { error: stageError } = await supabase
//       .from("leads")
//       .update({ current_stage: pendingStageUpdate.stage })
//       .eq("id", pendingStageUpdate.leadId);

//     if (stageError) {
//       console.error("Error updating stage:", stageError);
//       return;
//     }

//     setLeads((prev) =>
//       prev.map((l) =>
//         l.id === pendingStageUpdate.leadId ? { ...l, current_stage: pendingStageUpdate.stage } : l
//       )
//     );
//     setFollowUpsData((prev) =>
//       prev.map((l) =>
//         l.id === pendingStageUpdate.leadId ? { ...l, current_stage: pendingStageUpdate.stage } : l
//       )
//     );

//     setFollowUpSubmitted(true);       // ← add this

//     setFollowUpDialogOpen(false);
//     setFollowUpData({ follow_up_date: "", notes: "" });
//     setPendingStageUpdate(null);
//     setPreviousStage(null);

//     // 👇 After updating stage and call_history
//     const updatedFollowUps = await fetchFollowUps();
//     setFollowUpsData(updatedFollowUps);
//     setFollowUpSubmitted(false);      // reset for next time

//   };

//   const handleFollowUpDialogClose = (open: boolean) => {
//     if (!open) {
//       if (!followUpSubmitted && pendingStageUpdate && previousStage) {
//         setLeads(prev =>
//           prev.map(l =>
//             l.id === pendingStageUpdate.leadId ? { ...l, current_stage: previousStage } : l
//           )
//         );
//       }
//       // full reset
//       setFollowUpSubmitted(false);
//       setPendingStageUpdate(null);
//       setPreviousStage(null);
//       setFollowUpDialogOpen(false);
//       return;
//     }
//     setFollowUpDialogOpen(true);
//   };


//   const handleSaleClosureSubmit = async () => {
//     if (!selectedLead || !pendingStageUpdate) return;

//     setFollowUpsData(prev =>
//       prev.map(f =>
//         f.id === pendingStageUpdate.leadId ? { ...f, current_stage: "sale done" } : f
//       )
//     );


//     const {
//       base_value, subscription_cycle, payment_mode, closed_at,
//       resume_value, portfolio_value, linkedin_value, github_value, job_board_value,
//       // NEW
//       courses_value, custom_label, custom_value, commitments, company_application_email
//     } = saleData;
// if (
//   !payment_mode ||
//   subscription_cycle === undefined ||
//   subscription_cycle === null ||
//   !closed_at
// ) {
//   alert("Please fill all required fields (Payment Mode, Subscription Cycle, Sale Date).");
//   return;
// }

//     const saleTotal = totalAmount;

//     try {
//       const payload: any = {
//         lead_id: selectedLead.business_id,
//         lead_name: selectedLead.client_name,
//         email: selectedLead.email,
//         payment_mode,
//         subscription_cycle,
//         sale_value: saleTotal,
//         closed_at: new Date(closed_at).toISOString(),
//         application_sale_value: applicationSaleValue,

//         resume_sale_value: resume_value || null,
//         portfolio_sale_value: portfolio_value || null,
//         linkedin_sale_value: linkedin_value || null,
//         github_sale_value: github_value || null,
//         company_application_email, // Add this field to the payload
//         no_of_job_applications: null,
//         badge_value: saleData.badge_value ?? null,      // ✅ NEW
//         job_board_value: job_board_value || 0,


//       };

//       // Conditionally add new fields (avoid error if columns not yet created)
//       if (courses_value) payload.courses_sale_value = courses_value;
//       if (custom_label) payload.custom_label = custom_label;
//       if (custom_value) payload.custom_sale_value = custom_value;
//       if (commitments) payload.commitments = commitments;
//       if (saleData.job_board_value) payload.job_board_value = saleData.job_board_value;


//       const jobApps = saleData.no_of_job_applications;
//       if (jobApps !== null && jobApps !== undefined && !Number.isNaN(jobApps)) {
//         payload.no_of_job_applications = Math.max(0, Math.floor(jobApps));
//       }

//       const { error: insertErr } = await supabase.from("sales_closure").insert(payload);
//       if (insertErr) throw insertErr;

//       await supabase.from("leads")
//         .update({ current_stage: "sale done" })
//         .eq("id", pendingStageUpdate.leadId);

//       // reset dialog state
//       setSaleClosingDialogOpen(false);
//       setSaleData({
//         base_value: 0,
//         subscription_cycle: "" as unknown as 0 | 15 | 30 | 60 | 90,
//         payment_mode: "" as unknown as SaleClosing["payment_mode"],
//         closed_at: "",
//         resume_value: 0,
//         portfolio_value: 0,
//         linkedin_value: 0,
//         github_value: 0,
//         // NEW
//         courses_value: 0,
//         custom_label: "",
//         custom_value: 0,
//         commitments: "",
//         company_application_email: "", // Reset the email field
//         no_of_job_applications: null,
//         badge_value: 0,            // ✅ NEW
//         job_board_value: 0,


//       });

//       setPendingStageUpdate(null);
//       setPreviousStage(null);

//       const upd = await fetchFollowUps();
//       setFollowUpsData(upd);
//     } catch (err: any) {
//       console.error("Sale insert failed:", err.message);
//       alert("Failed to save sale.");
//     }
//   };


//   const totalLeadsCount = filteredLeads.length;

//   const stageCounts = filteredLeads.reduce((acc, l) => {
//     acc[l.current_stage] = (acc[l.current_stage] || 0) as number + 1;
//     return acc;
//   }, {} as Record<SalesStage, number>);

//   const prospectCount = stageCounts["Prospect"] ?? 0;
//   const dnpCount = stageCounts["DNP"] ?? 0;
//   const convoDoneCount = stageCounts["Conversation Done"] ?? 0;
//   const targetCount = stageCounts["Target"] ?? 0;
//   const saleDoneCount = stageCounts["sale done"] ?? 0;

//   // If you still want an “Others” bucket using the same list:
//   const othersCount = totalLeadsCount - (prospectCount + dnpCount + convoDoneCount + saleDoneCount + targetCount);

//   const fetchCallHistory = async (leadId: string) => {
//     const lead = leads.find((l) => l.id === leadId);
//     if (!lead) return [];

//     const { data, error } = await supabase
//       .from("call_history")
//       .select("id, current_stage, followup_date, notes")   // ← add id
//       .eq("lead_id", lead.business_id)
//       .order("followup_date", { ascending: false });

//     if (error) {
//       console.error("Error fetching call history:", error);
//       return [];
//     }

//     const callHistoryData: CallHistory[] = data.map((r: any) => ({
//       id: r.id,
//       date: r.followup_date,
//       stage: r.current_stage,
//       notes: r.notes,
//     }));
//     return callHistoryData;
//   };


// const fetchSalesUsers = async () => {
//   const { data, error } = await supabase
//     .from("profiles")
//     .select("full_name, user_email")
//     .in("roles", ["Sales", "Sales Associate"]);

//   if (error) {
//     console.error("Error fetching sales users:", error);
//     return [];
//   }

//   setSalesUsers(data || []);
// };



//   // This function will go in your SalesPage component
//   // Add it after defining useState for all input fields used in the dialog
//   async function handleOnboardClientSubmit() {
//     try {
//       const confirmed = window.confirm("Are you sure you want to onboard this client?");
//       if (!confirmed) return;

//       const { data: idResult, error: idError } = await supabase.rpc('generate_custom_lead_id');
//       if (idError || !idResult) {
//         console.error("Failed to generate lead ID:", idError);
//         return alert("Could not generate Lead ID. Try again.");
//       }
//       const newLeadId = idResult;

//       const base = Number(subscriptionSaleValue || 0);
//       const resume = Number(resumeValue || 0);
//       const linkedin = Number(linkedinValue || 0);
//       const github = Number(githubValue || 0);
//       const portfolio = Number(portfolioValue || 0);
//       const cycle = Number(subscriptionCycle || 0);

//       const multiplier =
//         cycle === 0 ? 0 :
//         cycle === 15 ? 0.5 :
//           cycle === 30 ? 1 :
//             cycle === 60 ? 2 :
//               cycle === 90 ? 3 : 0;

//       const applicationSale = Number((base * multiplier).toFixed(2));

//       const totalSaleCalc = base * multiplier + resume + linkedin + github + portfolio;

//       // use local date strings for date columns stored as DATE in PG
//       const createdAt = dayjs().toISOString();
//       const onboardDate = toYMD(onboardingDate);   // "YYYY-MM-DD"

//       const { error: leadsInsertError } = await supabase.from("leads").insert({
//         business_id: newLeadId,
//         name: clientName,
//         email: clientEmail,
//         phone: contactNumber,
//         city: city,
//         created_at: createdAt,
//         source: subscriptionSource || "Onboarded Client",
//         status: "Assigned",
//         current_stage: "sale done", // optional: if you onboard only after closing
//       });
//       if (leadsInsertError) throw leadsInsertError;

//       const { error: salesInsertError } = await supabase.from("sales_closure").insert({
//         lead_id: newLeadId,
//         email: clientEmail,
//         lead_name: clientName,
//         payment_mode: paymentMode,
//         subscription_cycle: cycle,
//         sale_value: totalSaleCalc,
//         closed_at: onboardDate,                // if column is date
//         onboarded_date: onboardDate,          // if you store this too
//         finance_status: "Paid",
//         application_sale_value: applicationSale,
//         resume_sale_value: resume || null,
//         linkedin_sale_value: linkedin || null,
//         github_sale_value: github || null,
//         portfolio_sale_value: portfolio || null,
//         associates_email: "",
//         associates_name: "",
//         associates_tl_email: "",
//         associates_tl_name: "",
//         checkout_date: null,
//         invoice_url: "",
//         no_of_job_applications: null,
//         badge_value: saleData.badge_value ?? null,      // ✅ optional here

//       });
//       if (salesInsertError) throw salesInsertError;

//       // refresh list
//       if (userProfile) await fetchLeads(userProfile);

//       // reset
//       setClientName(""); setClientEmail(""); setContactNumber(""); setCity("");
//       setOnboardingDate(""); setSubscriptionCycle(""); setSubscriptionSaleValue("");
//       setPaymentMode(""); setResumeValue(""); setPortfolioValue(""); setLinkedinValue(""); setGithubValue("");
//       setOnboardDialogOpen(false);
//       alert("✅ Client onboarded successfully!");
//     } catch (err: any) {
//       console.error("❌ Error onboarding client:", err?.message || err);
//       alert(`Failed to onboard client: ${err?.message || "Unknown error"}`);
//     }
//   }

//   const handleUpdateNote = async (call: CallHistory) => {
//     try {
//       const { error } = await supabase
//         .from("call_history")
//         .update({ notes: editedNote })
//         .eq("id", call.id);                 // ← precise update

//       if (error) throw error;

//       const updated = await fetchCallHistory(selectedLead!.id);
//       setSelectedLead((prev) => (prev ? { ...prev, call_history: updated } : null));
//       setEditingNote(false);
//       alert("Note updated!");
//     } catch (err) {
//       console.error("Failed to update note:", err);
//       alert("Failed to update note.");
//     }
//   };

//   // Function to fetch data from all tables and export them as Excel
// const downloadAllTablesData = async () => {
//   try {
//     // Table names we want to fetch
//     const tables = ['call_history', 'client_feedback', 'client_onborading_details', 'leads', 'portfolio_progress', 'profiles', 'resume_progress', 'sales_closure'];
//     const data: { [key: string]: any } = {};

//     // Fetch data from all tables and store them in an object
//     for (const table of tables) {
//       const { data: tableData, error } = await supabase.from(table).select("*");
//       if (error) {
//         console.error(`Error fetching data from ${table}:`, error);
//         continue;
//       }
//       data[table] = tableData;
//     }

//     // Create a new workbook
//     const wb = XLSX.utils.book_new();

//     // Loop through the data object and add each table's data as a new sheet in the workbook
//     for (const table in data) {
//       if (data[table]) {
//         const ws = XLSX.utils.json_to_sheet(data[table]);
//         XLSX.utils.book_append_sheet(wb, ws, table); // Add a sheet with the table name
//       }
//     }

//     // Export the workbook to an Excel file
//     XLSX.writeFile(wb, "SalesData.xlsx");
//   } catch (error) {
//     console.error("Error downloading tables data:", error);
//   }
// };

// // Button to trigger the download


//   const downloadResume = async (path: string) => {
//     try {
//       // lead_id is the first folder in "leadId/<timestamp>_filename.pdf"
//       const leadId = (path || "").split("/")[0] || "unknown";
//       const fileName = `resume-${leadId}.pdf`;

//       const { data, error } = await supabase.storage
//         .from("resumes")
//         .createSignedUrl(path, 60 * 60); // 1 hour

//       if (error) throw error;
//       if (!data?.signedUrl) throw new Error("No signed URL");

//       const res = await fetch(data.signedUrl);
//       if (!res.ok) throw new Error(`Download failed (${res.status})`);

//       const blob = await res.blob();
//       const url = URL.createObjectURL(blob);

//       const a = document.createElement("a");
//       a.href = url;
//       a.download = fileName; // 👉 always "resume-<lead_id>.pdf"
//       document.body.appendChild(a);
//       a.click();
//       a.remove();

//       URL.revokeObjectURL(url);
//     } catch (e: any) {
//       alert(e?.message || "Could not download PDF");
//     }
//   };

//   // 2) Replace your PR dialog cell with this (no <a> tag, just a button that calls the helper)


//   // 📍 Place this just before rendering the table rows
//   // const sortedLeads = [...filteredLeads].sort((a, b) => {
//   //   const { key, direction } = sortConfig;
//   //   if (!key) return 0;

//   //   let aValue: any = a[key];
//   //   let bValue: any = b[key];

//   //   // Handle date sorting
//   //   if (key === 'created_at' || key === 'assigned_at') {
//   //     aValue = aValue ? new Date(aValue).getTime() : 0;
//   //     bValue = bValue ? new Date(bValue).getTime() : 0;
//   //     return direction === 'asc' ? aValue - bValue : bValue - aValue;
//   //   }

//   //   // Lead age (based on created_at)
//   //   if (key === 'created_at' && a.created_at && b.created_at) {
//   //     const aDays = dayjs().diff(dayjs(a.created_at), 'day');
//   //     const bDays = dayjs().diff(dayjs(b.created_at), 'day');
//   //     return direction === 'asc' ? aDays - bDays : bDays - aDays;
//   //   }

//   //   // Handle string sorting
//   //   if (typeof aValue === 'string' && typeof bValue === 'string') {
//   //     return direction === 'asc'
//   //       ? aValue.localeCompare(bValue)
//   //       : bValue.localeCompare(aValue);
//   //   }

//   //   // Handle number fallback
//   //   return direction === 'asc'
//   //     ? (aValue || 0) - (bValue || 0)
//   //     : (bValue || 0) - (aValue || 0);
//   // });
//   // —— helpers (local-date safe) ——
//   const toYMD = (d?: string | Date) => (d ? dayjs(d).format("YYYY-MM-DD") : "");
//   const todayLocalYMD = () => dayjs().format("YYYY-MM-DD");

//   const cycleMultiplier = (d?: number) =>
//    d === 0 ? 0 : d === 15 ? 0.5 : d === 30 ? 1 : d === 60 ? 2 : d === 90 ? 3 : 0;

//   // 👉 ADD THIS derived constant (place near your other derived consts)
//   const applicationSaleValue = Number(
//     (saleData.base_value * cycleMultiplier(saleData.subscription_cycle)).toFixed(2)
//   );

//   const sortedLeads = [...filteredLeads].sort((a, b) => {
//     const { key, direction } = sortConfig;
//     if (!key) return 0;

//     let aValue: any = a[key];
//     let bValue: any = b[key];

//     // 📅 Date fields
//     if (key === 'created_at' || key === 'assigned_at') {
//       const aTime = aValue ? new Date(aValue).getTime() : 0;
//       const bTime = bValue ? new Date(bValue).getTime() : 0;
//       return direction === 'asc' ? aTime - bTime : bTime - aTime;
//     }

//     // 🔤 String fields
//     if (typeof aValue === 'string' && typeof bValue === 'string') {
//       return direction === 'asc'
//         ? aValue.localeCompare(bValue)
//         : bValue.localeCompare(aValue);
//     }

//     // 🔢 Number fields fallback
//     return direction === 'asc'
//       ? (aValue || 0) - (bValue || 0)
//       : (bValue || 0) - (aValue || 0);
//   });

//   const fetchSalesClosureCount = async () => {
//     const { count, error } = await supabase
//       .from("sales_closure")
//       .select("lead_id", { count: "exact", head: true });

//     if (!error) setSalesClosedTotal(count ?? 0);
//   };

//   const PaidBadge = ({ paid }: { paid: "Paid" | "Not paid" }) => (
//     <Badge className={paid === "Paid" ? "bg-green-100 text-green-800" : "bg-red-500 text-white"}>
//       {paid}
//     </Badge>
//   );

//   const StatusBadge = ({ text }: { text?: string | null }) => (
//     <Badge variant="outline">{text ?? "—"}</Badge>
//   );

//   const LinkCell = ({ href, label }: { href?: string | null; label?: string }) =>
//     href ? (
//       <a href={href} target="_blank" rel="noreferrer" className="text-blue-600 underline">
//         {label ?? "Open"}
//       </a>
//     ) : (
//       <span>—</span>
//     );


//   return (
//     <ProtectedRoute allowedRoles={["Sales", "Sales Associate", "Super Admin"]}>

//       <DashboardLayout>
//         <div className="space-y-6">
//           <div className="flex justify-between items-center">
//             <h1 className="text-3xl font-bold">Sales CRM</h1>

//             <div className="justify-end flex gap-2">
//               {/* <Button
//   onClick={downloadAllTablesData}
//   className="ml-2"
// >
//   Download All Data
// </Button> */}

//  {userProfile?.roles === "Admin" && (
//         <Button
//           onClick={downloadAllTablesData}
//           className="ml-2"
//         >
//           Download All Database data
//         </Button>
//        )} 
//               <Button
//                 onClick={async () => {
//                   const followUps = await fetchFollowUps();
//                   setFollowUpsData(followUps);
//                   setFollowUpsDialogOpen(true);
//                 }}
//               >
//                 Follow Ups
//               </Button>

//               <Button onClick={openPortfolioResumesDialog}>
//                 Portfolio/Resumes
//               </Button>
//             </div>

//           </div>
//           <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
//             <Dialog open={followUpsDialogOpen} onOpenChange={setFollowUpsDialogOpen}>
//               {/* <DialogContent className="max-w-7xl"> */}
//               <DialogContent className="max-w-7xl" onPointerDownOutside={(e) => e.preventDefault()}>

//                 <DialogHeader>
//                   <DialogTitle>Follow Ups – DNP / Conversation Done</DialogTitle>
//                   <DialogDescription>Leads with scheduled follow-ups</DialogDescription>
//                   <div className="flex justify-end mb-4">
//                     <Select value={followUpsFilter} onValueChange={(val) => setFollowUpsFilter(val as "today" | "all")}>
//                       <SelectTrigger className="w-40">
//                         <SelectValue placeholder="Filter by Date" />
//                       </SelectTrigger>
//                       <SelectContent>
//                         <SelectItem value="today">Today</SelectItem>
//                         <SelectItem value="all">All Dates</SelectItem>
//                       </SelectContent>
//                     </Select>
//                   </div>

//                 </DialogHeader>

//                 <div className="max-h-[70vh] overflow-y-auto overflow-x-auto">
//                   <Table>
//                     <TableHeader>
//                       <TableRow>
//                         <TableHead>S.No</TableHead>
//                         <TableHead>Business ID</TableHead>
//                         <TableHead>Name</TableHead>
//                         <TableHead>Email</TableHead>
//                         <TableHead>Phone</TableHead>
//                         <TableHead>Assigned To</TableHead>
//                         <TableHead>Stage</TableHead>
//                         <TableHead>Follow-up Date</TableHead>
//                         <TableHead>Notes</TableHead>
//                       </TableRow>
//                     </TableHeader>

//                     <TableBody>
//                       {followUpsData.filter((item) => {
//                         if (followUpsFilter === "all") return true;
//                         if (!item.followup_date) return false;
//                         const today = todayLocalYMD();
//                         return item.followup_date === today;
//                       }).length === 0 ? (
//                         <TableRow>
//                           <TableCell colSpan={8} className="text-center text-muted-foreground py-6">
//                             {followUpsFilter === "all"
//                               ? "No follow-up data available."
//                               : "There are no follow ups today."}
//                           </TableCell>
//                         </TableRow>
//                       ) : (
//                         followUpsData
//                           .filter((item) => {
//                             if (followUpsFilter === "all") return true;
//                             if (!item.followup_date) return false;
//                             const today = todayLocalYMD();
//                             return item.followup_date === today;
//                           })
//                           .map((item, idx) => (
//                             <TableRow key={idx}>
//                               <TableCell>{idx + 1}</TableCell>
//                               <TableCell>{item.business_id}</TableCell>
//                               {/* <TableCell>{item.name}</TableCell> */}

//                               <TableCell
//                                 className="font-medium max-w-[150px] break-words whitespace-normal cursor-pointer text-blue-600 hover:underline"
//                                 onClick={() => window.open(`/leads/${item.business_id}`, "_blank")}
//                               >
//                                 {item.name}
//                               </TableCell>

//                               <TableCell>{item.email}</TableCell>
//                               <TableCell>{item.phone}</TableCell>
//                               <TableCell>{item.assigned_to}</TableCell>
//                               <TableCell>
//                                 <Select value={item.current_stage}
//                                   onValueChange={(value: SalesStage) => {
//                                     const selectedItem = followUpsData.find((f) => f.id === item.id);
//                                     if (!selectedItem) return;
//                                     handleStageUpdate(item.id, value);
//                                   }}

//                                 >
//                                   {/* <SelectTrigger className="w-40"><SelectValue /></SelectTrigger> */}
//                                   <SelectTrigger
//                                     className={`w-40 ${item.current_stage === "sale done"
//                                       ? "pointer-events-none opacity-100 text-black bg-gray-100 border border-gray-300 cursor-not-allowed"
//                                       : ""
//                                       }`}
//                                   >
//                                     <SelectValue />
//                                   </SelectTrigger>
//                                   <SelectContent>
//                                     {salesStages
//                                       .filter((stage) => item.current_stage === "Prospect" || stage !== "Prospect")
//                                       .map((stage) => (
//                                         <SelectItem key={stage} value={stage}>
//                                           <Badge className={getStageColor(stage)}>{stage}</Badge>
//                                         </SelectItem>
//                                       ))}
//                                   </SelectContent>
//                                 </Select>
//                               </TableCell>

//                               <TableCell>{item.followup_date}</TableCell>
//                               <TableCell>{item.notes}</TableCell>
//                             </TableRow>
//                           ))
//                       )}
//                     </TableBody>
//                   </Table>
//                 </div>
//               </DialogContent>
//             </Dialog>
//             <Card>
//               <CardHeader className="pb-2">
//                 <CardTitle className="text-sm font-medium">All leads</CardTitle>
//               </CardHeader>
//               <CardContent>
//                 <div className="text-2xl font-bold">{totalLeadsCount}</div>
//               </CardContent>
//             </Card>

//             <Card>
//               <CardHeader className="pb-2">
//                 <CardTitle className="text-sm font-medium">Prospects</CardTitle>
//               </CardHeader>
//               <CardContent>
//                 <div className="text-2xl font-bold">{prospectCount}</div>
//               </CardContent>
//             </Card>

//             <Card>
//               <CardHeader className="pb-2">
//                 <CardTitle className="text-sm font-medium">DNP & Conversation Done</CardTitle>
//               </CardHeader>
//               <CardContent>
//                 <div className="text-2xl font-bold">{(dnpCount + convoDoneCount)}</div>
//               </CardContent>
//             </Card>


//             <Card>
//               <CardHeader className="pb-2">
//                 <CardTitle className="text-sm font-medium">Sales Done (from leads)</CardTitle>
//               </CardHeader>
//               <CardContent>
//                 <div className="text-2xl font-bold">{saleDoneCount}</div>
//               </CardContent>
//             </Card>


//             <Card>
//               <CardHeader className="pb-2">
//                 <CardTitle className="text-sm font-medium">Others</CardTitle>
//               </CardHeader>
//               <CardContent>
//                 <div className="text-2xl font-bold">{othersCount}</div>
//               </CardContent>
//             </Card>


//           </div>

//           {/* Search & Filter */}
//           <div className="flex flex-col sm:flex-row gap-4 mb-6">
//             <div className="relative flex-1">
//               <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
//               <Input placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
//             </div>
//             <Select value={stageFilter} onValueChange={setStageFilter}>
//               <SelectTrigger className="w-full sm:w-48">
//                 <SelectValue placeholder="Filter by stage" />
//               </SelectTrigger>
//               <SelectContent>
//                 <SelectItem value="all">All Stages</SelectItem>
//                 {salesStages.map(stage => (<SelectItem key={stage} value={stage}>{stage}</SelectItem>))}
//               </SelectContent>
//             </Select>

//             <div className="relative w-full sm:w-[300px]">
//               {/* 📅 Button Trigger */}
//               <div
//                 onClick={() => setIsDateDropdownOpen(!isDateDropdownOpen)}
//                 className="bg-white border rounded-md shadow-sm px-4 py-2 cursor-pointer flex justify-between items-center"
//               >
//                 <span>
//                   {startDate && endDate
//                     ? `📅 ${dayjs(startDate).format('DD MMM')} → ${dayjs(endDate).format('DD MMM')}`
//                     : "📅 Date Range"}
//                 </span>
//                 <span className="text-gray-400">▼</span>
//               </div>

//               {/* 📅 Dropdown Content */}
//               {isDateDropdownOpen && (
//                 <div className="absolute z-50 mt-2 bg-white rounded-md shadow-lg p-4 w-[300px] border space-y-4">
//                   <div>
//                     <Label className="text-sm text-gray-600">Start Date</Label>
//                     <Input
//                       type="date"
//                       value={startDate ?? ""}
//                       onChange={(e) => setStartDate(e.target.value)}
//                     />
//                   </div>

//                   <div>
//                     <Label className="text-sm text-gray-600">End Date</Label>
//                     <Input
//                       type="date"
//                       value={endDate ?? ""}
//                       onChange={(e) => setEndDate(e.target.value)}
//                     />
//                   </div>

//                   <Button
//                     variant="ghost"
//                     className="text-red-500 text-sm p-0"
//                     onClick={() => {
//                       setStartDate(null);
//                       setEndDate(null);
//                       setIsDateDropdownOpen(false); // close on clear
//                     }}
//                   >
//                     ❌ Clear Filter
//                   </Button>
//                 </div>
//               )}
//             </div>

//           </div>
//           <Card>
//             <CardHeader>
//               <CardTitle>Sales Pipeline</CardTitle>
//             </CardHeader>
//             <CardContent>
//               <div className="rounded-md border">
//                 <Table>
//                   <TableHeader>
//                     <TableRow>
//                       <TableHead>S.No</TableHead>


//                       <TableHead onClick={() => handleSort("business_id")} className="cursor-pointer select-none">
//                         <div className="flex items-center gap-1">
//                           Business ID
//                           <span className="text-sm">
//                             <span className={sortConfig.key === "business_id" && sortConfig.direction === "asc" ? "font-bold text-blue-600" : "text-gray-400"}>
//                               ↓
//                             </span>
//                             <span className={sortConfig.key === "business_id" && sortConfig.direction === "desc" ? "font-bold text-blue-600" : "text-gray-400"}>
//                               ↑
//                             </span>
//                           </span>
//                         </div>
//                       </TableHead>

//                       <TableHead onClick={() => handleSort("client_name")} className="cursor-pointer select-none">
//                         <div className="flex items-center gap-1">
//                           Client Name
//                           <span className="text-sm">
//                             <span className={sortConfig.key === "client_name" && sortConfig.direction === "asc" ? "font-bold text-blue-600" : "text-gray-400"}>
//                               ↑
//                             </span>
//                             <span className={sortConfig.key === "client_name" && sortConfig.direction === "desc" ? "font-bold text-blue-600" : "text-gray-400"}>
//                               ↓
//                             </span>
//                           </span>
//                         </div>
//                       </TableHead>

//                       <TableHead className="w-32">Email</TableHead>
//                       <TableHead>Phone</TableHead>

//                       <TableHead onClick={() => handleSort("created_at")} className="cursor-pointer select-none w-40">
//                         <div className="flex items-center gap-1">
//                           Created At
//                           <span className="text-sm">
//                             <span className={sortConfig.key === "created_at" && sortConfig.direction === "asc" ? "font-bold text-blue-600" : "text-gray-400"}>
//                               ↑
//                             </span>
//                             <span className={sortConfig.key === "created_at" && sortConfig.direction === "desc" ? "font-bold text-blue-600" : "text-gray-400"}>
//                               ↓
//                             </span>
//                           </span>
//                         </div>
//                       </TableHead>
//                       <TableHead onClick={() => handleSort("created_at")} className="cursor-pointer select-none w-20">
//                         <div className="flex items-center gap-1">
//                           Lead Age
//                           <span className="text-sm">
//                             <span className={sortConfig.key === "created_at" && sortConfig.direction === "asc" ? "font-bold text-blue-600" : "text-gray-400"}>
//                               ↑
//                             </span>
//                             <span className={sortConfig.key === "created_at" && sortConfig.direction === "desc" ? "font-bold text-blue-600" : "text-gray-400"}>
//                               ↓
//                             </span>
//                           </span>
//                         </div>
//                       </TableHead>

//                       <TableHead onClick={() => handleSort("assigned_at")} className="cursor-pointer select-none w-40">
//                         <div className="flex items-center gap-1">
//                           Assigned At
//                           <span className="text-sm">
//                             <span className={sortConfig.key === "assigned_at" && sortConfig.direction === "asc" ? "font-bold text-blue-600" : "text-gray-400"}>
//                               ↑
//                             </span>
//                             <span className={sortConfig.key === "assigned_at" && sortConfig.direction === "desc" ? "font-bold text-blue-600" : "text-gray-400"}>
//                               ↓
//                             </span>
//                           </span>
//                         </div>
//                       </TableHead>

//                       <TableHead onClick={() => handleSort("assigned_to")} className="cursor-pointer select-none">
//                         <div className="flex items-center gap-1">
//                           Assigned To
//                           <span className="text-sm">
//                             <span className={sortConfig.key === "assigned_to" && sortConfig.direction === "asc" ? "font-bold text-blue-600" : "text-gray-400"}>
//                               ↑
//                             </span>
//                             <span className={sortConfig.key === "assigned_to" && sortConfig.direction === "desc" ? "font-bold text-blue-600" : "text-gray-400"}>
//                               ↓
//                             </span>
//                           </span>
//                         </div>
//                       </TableHead>
//                       <TableHead>Re-assign</TableHead>
//                       <TableHead>Stage</TableHead>
//                       <TableHead>Actions</TableHead>
//                     </TableRow>
//                   </TableHeader>

//                   <TableBody>
//                     {sortedLeads.map((lead, idx) => (
//                       <TableRow key={lead.id}>
//                         <TableCell>{idx + 1}</TableCell>
//                         <TableCell>{lead.business_id}</TableCell>
//                         {/* <TableCell>{lead.client_name}</TableCell> */}
//                         <TableCell
//                           className="font-medium max-w-[150px] break-words whitespace-normal cursor-pointer text-blue-600 hover:underline"
//                           onClick={() => window.open(`/leads/${lead.business_id}`, "_blank")}
//                         >
//                           {lead.client_name}
//                         </TableCell>
//                         <TableCell className="w-32 truncate">{lead.email}</TableCell>
//                         <TableCell>{lead.phone}</TableCell>

//                         <TableCell className="w-40">
//                           {lead.created_at ? dayjs(lead.created_at).format("DD MMM YYYY") : "N/A"}
//                         </TableCell>

//                         <TableCell>
//                           {lead.created_at ? `${dayjs().diff(dayjs(lead.created_at), "day")} days` : "N/A"}
//                         </TableCell>

//                         <TableCell className="w-40">
//                           {lead.assigned_at ? dayjs(lead.assigned_at).format("DD MMM YYYY") : "N/A"}
//                         </TableCell>

//                         <TableCell >{lead.assigned_to}</TableCell>

//                        <TableCell>
//   {/* <Select
//     value={lead.assigned_to || ""}
//     onValueChange={(selectedName) => handleUpdateAssignedTo(lead.id, selectedName)}
//   >
//     <SelectTrigger className="w-52">
//       <SelectValue placeholder="Assign to..." />
//     </SelectTrigger>
//     <SelectContent>
//       {salesUsers.map((user) => (
//         <SelectItem key={user.full_name} value={user.full_name}>
//           {user.full_name}{" "}
//           <span className="text-gray-500 text-xs">({user.user_email})</span>
//         </SelectItem>
//       ))}
//     </SelectContent>
//   </Select> */}

//   <Select
//   value={lead.assigned_to || ""}
//   onValueChange={(selectedName) => {
//     const selectedUser = salesUsers.find(user => user.full_name === selectedName);
//     const selectedEmail = selectedUser ? selectedUser.user_email : ""; // Get the email from the selected user
//     handleUpdateAssignedTo(lead.id, selectedName, selectedEmail); // Pass both name and email
//   }}
// >
//   <SelectTrigger className="w-52">
//     <SelectValue placeholder="Assign to..." />
//   </SelectTrigger>

//   <SelectContent>
//     {salesUsers.map((user) => (
//       <SelectItem key={user.full_name} value={user.full_name}>
//         {user.full_name}{" "}
//         <span className="text-gray-500 text-xs">({user.user_email})</span>
//       </SelectItem>
//     ))}
//   </SelectContent>
// </Select>

// </TableCell>



//                         <TableCell className="flex items-center gap-4">
//                           <Select
//                             value={lead.current_stage}
//                             onValueChange={(value: SalesStage) => handleStageUpdate(lead.id, value)}
//                           >
//                             <SelectTrigger
//                               className={`w-40 ${lead.current_stage === "sale done"
//                                   ? "pointer-events-none opacity-100 text-black bg-gray-100 border border-gray-300 cursor-not-allowed"
//                                   : ""
//                                 }`}
//                             >
//                               <SelectValue />
//                             </SelectTrigger>
//                             <SelectContent>
//                               {salesStages
//                                 .filter((stage) => lead.current_stage === "Prospect" || stage !== "Prospect")
//                                 .map((stage) => (
//                                   <SelectItem key={stage} value={stage}>
//                                     <Badge className={getStageColor(stage)}>{stage}</Badge>
//                                   </SelectItem>
//                                 ))}
//                             </SelectContent>
//                           </Select>
//                           {/* {lead.current_stage === "sale done" && (
//     <Button
//       size="icon"
//       variant="outline"
//       onClick={async () => {
//         const leadId = lead.business_id;  // or use `lead.id` based on your schema
//         await fetchLatestSaleClosure(leadId); // Fetch the most recent sale record
//       }}
//     >
//       <EditIcon className="h-5 w-5" /> 
//     </Button>
//   )} */}

//                           {lead.current_stage === "sale done" && (
//                             <Button
//                               size="icon"
//                               variant="outline"
//                               onClick={() => window.open(`/SaleUpdate/${lead.business_id}`, "_blank")}
//                               title="Edit sale close"
//                             >
//                               <EditIcon className="h-5 w-5" />
//                             </Button>
//                           )}

//                         </TableCell>



//                         <TableCell>
//                           <Button
//                             size="sm"
//                             variant="outline"
//                             onClick={async () => {
//                               const callHistory = await fetchCallHistory(lead.id);
//                               setSelectedLead({ ...lead, call_history: callHistory });
//                               setHistoryDialogOpen(true);
//                             }}
//                           >
//                             <Eye className="h-3 w-3" />
//                           </Button>
//                         </TableCell>
//                       </TableRow>
//                     ))}
//                   </TableBody>
//                 </Table>
//               </div>
//             </CardContent>
//           </Card>


//           {/* History Dialog */}
//           <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen} >
//             {/* <DialogContent className="max-w-2xl"> */}
//             <DialogContent className="max-w-5xl" onPointerDownOutside={(e) => e.preventDefault()}>

//               <DialogHeader>
//                 <DialogTitle>{selectedLead?.client_name} - Call History</DialogTitle>
//                 <DialogDescription>Complete call history</DialogDescription>
//               </DialogHeader>

//               {selectedLead && (
//                 <div className="space-y-6">
//                   <div className="grid grid-cols-2 gap-4">
//                     <div><Label>Email</Label><p>{selectedLead.email}</p></div>
//                     <div><Label>Phone</Label><p>{selectedLead.phone}</p></div>
//                     <div><Label>Assigned To</Label><p>{selectedLead.assigned_to}</p></div>
//                     <div><Label>Current Stage</Label><Badge className={getStageColor(selectedLead.current_stage)}>{selectedLead.current_stage}</Badge></div>
//                   </div>

//                   <div>
//                     <Label>Call History</Label>
//                     <div className="space-y-3 max-h-64 overflow-y-auto">

//                       {selectedLead.call_history.map((call, index) => {
//                         const isLatest = index === 0;
//                         return (
//                           <div key={index} className="p-3 bg-gray-50 rounded-lg space-y-1">
//                             <div className="flex justify-between items-center mb-1">
//                               <Badge className={getStageColor(call.stage)}>{call.stage}</Badge>
//                               <span className="text-xs text-gray-500">{call.date}</span>
//                             </div>

//                             {/* ✏️ Editable note for latest only */}
//                             {isLatest && editingNote ? (
//                               <div className="space-y-2">
//                                 <Textarea
//                                   value={editedNote}
//                                   onChange={(e) => setEditedNote(e.target.value)}
//                                 />
//                                 <Button size="sm" onClick={() => handleUpdateNote(call)}>
//                                   Save
//                                 </Button>
//                               </div>
//                             ) : (
//                               <div className="flex justify-between">
//                                 <p className="text-sm text-gray-600">{call.notes}</p>
//                                 {isLatest && (
//                                   <Button
//                                     size="icon"
//                                     variant="ghost"
//                                     className="h-5 w-5 text-lg text-gray-500"
//                                     onClick={() => {
//                                       setEditingNote(true);
//                                       setEditedNote(call.notes);
//                                     }}
//                                   >
//                                     Edit
//                                   </Button>
//                                 )}
//                               </div>
//                             )}
//                           </div>
//                         );
//                       })}

//                     </div>
//                   </div>
//                 </div>
//               )}
//             </DialogContent>
//           </Dialog>



//           <Dialog open={prDialogOpen} onOpenChange={setPrDialogOpen}>
//             <DialogContent className="max-w-max" onPointerDownOutside={(e) => e.preventDefault()}>
//               <DialogHeader>
//                 <DialogTitle>Portfolio / Resumes</DialogTitle>
//                 <DialogDescription>
//                   Leads for <b>{userProfile?.full_name ?? "—"}</b> with stage <b>sale done</b> (oldest closure per lead).
//                 </DialogDescription>
//               </DialogHeader>

//               <div className="max-h-[70vh] overflow-auto rounded-md border">
//                 <Table>
//                   <TableHeader>
//                     <TableRow>
//                       <TableHead>S.No</TableHead>
//                       <TableHead>Lead ID</TableHead>
//                       <TableHead>Name</TableHead>
//                       <TableHead>Email</TableHead>
//                       <TableHead>Closed At (oldest)</TableHead>

//                       {/* Resume */}
//                       <TableHead className="text-center">Resume Sale</TableHead>
//                       <TableHead className="text-center">Resume Status</TableHead>
//                       <TableHead className="text-center">Resume Link</TableHead>

//                       {/* Portfolio */}
//                       <TableHead className="text-center">Portfolio Sale</TableHead>
//                       <TableHead className="text-center">Portfolio Status</TableHead>
//                       <TableHead className="text-center">Portfolio Link</TableHead>

//                       {/* GitHub */}
//                       <TableHead className="text-center">GitHub Sale</TableHead>
//                       <TableHead className="text-center">GitHub Status</TableHead>
//                     </TableRow>
//                   </TableHeader>

//                   <TableBody>
//                     {prLoading ? (
//                       <TableRow>
//                         <TableCell colSpan={13} className="py-8 text-center text-muted-foreground">
//                           Loading…
//                         </TableCell>
//                       </TableRow>
//                     ) : prRows.length === 0 ? (
//                       <TableRow>
//                         <TableCell colSpan={13} className="py-8 text-center text-muted-foreground">
//                           No records found.
//                         </TableCell>
//                       </TableRow>
//                     ) : (
//                       prRows.map((r, i) => (
//                         <TableRow key={r.lead_id}>
//                           <TableCell>{i + 1}</TableCell>
//                           <TableCell>{r.lead_id}</TableCell>
//                           <TableCell>{r.name}</TableCell>
//                           <TableCell className="w-56 truncate">{r.email}</TableCell>
//                           <TableCell>{r.closed_at ?? "—"}</TableCell>

//                           {/* Resume */}
//                           <TableCell className="text-center">
//                             <PaidBadge paid={r.resumePaid} />
//                           </TableCell>
//                           <TableCell className="text-center">
//                             {/* Only show work status if they paid; else show — */}
//                             {r.resumePaid === "Paid" ? <StatusBadge text={r.resumeStatus} /> : <span>—</span>}
//                           </TableCell>
//                           <TableCell className="text-center">
//                             {r.resumePdf ? (
//                               <Button
//                                 variant="outline"
//                                 size="sm"
//                                 onClick={() => downloadResume(r.resumePdf!)}
//                               >
//                                 Download
//                               </Button>
//                             ) : (
//                               <span>—</span>
//                             )}
//                           </TableCell>

//                           {/* Portfolio */}
//                           <TableCell className="text-center">
//                             <PaidBadge paid={r.portfolioPaid} />
//                           </TableCell>
//                           <TableCell className="text-center">
//                             {r.portfolioPaid === "Paid" ? <StatusBadge text={r.portfolioStatus} /> : <span>—</span>}
//                           </TableCell>
//                           <TableCell className="text-center">
//                             {r.portfolioPaid === "Paid" ? (
//                               <LinkCell href={r.portfolioLink} label="Open" />
//                             ) : (
//                               <span>—</span>
//                             )}
//                           </TableCell>

//                           {/* GitHub */}
//                           <TableCell className="text-center">
//                             <PaidBadge paid={r.githubPaid} />
//                           </TableCell>
//                           <TableCell className="text-center">—</TableCell>
//                         </TableRow>
//                       ))
//                     )}
//                   </TableBody>
//                 </Table>

//               </div>
//             </DialogContent>
//           </Dialog>



//           <Dialog open={followUpDialogOpen} onOpenChange={handleFollowUpDialogClose}>
//             <DialogContent onPointerDownOutside={(e) => e.preventDefault()}>

//               <DialogHeader><DialogTitle>Schedule Follow-up</DialogTitle></DialogHeader>
//               <div className="space-y-4">
//                 <div>
//                   <Label>Follow-up Date</Label>
//                   <Input type="date" value={followUpData.follow_up_date} onChange={(e) =>
//                     setFollowUpData((prev) => ({ ...prev, follow_up_date: e.target.value }))} />
//                 </div>
//                 <div>
//                   <Label>Notes</Label>
//                   <Textarea placeholder="Add notes..." value={followUpData.notes} onChange={(e) =>
//                     setFollowUpData((prev) => ({ ...prev, notes: e.target.value }))} />
//                 </div>
//               </div>
//               <DialogFooter><Button onClick={handleFollowUpSubmit}>Save Follow-up</Button></DialogFooter>
//             </DialogContent>
//           </Dialog>

//           <Dialog open={onboardDialogOpen} onOpenChange={setOnboardDialogOpen}>
//             <DialogContent className="max-w-5xl" onPointerDownOutside={(e) => e.preventDefault()}>
//               <DialogHeader>
//                 <DialogTitle className="flex items-center gap-2">
//                   🧾 Onboard New Client
//                 </DialogTitle>
//               </DialogHeader>

//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 {/* Client Details */}
//                 <div className="border rounded-md p-4 space-y-3">
//                   <Label className="font-semibold">Client Details <span className="text-red-500">*</span></Label>
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
//                     placeholder="Contact Number with country code"
//                     value={contactNumber}
//                     onChange={(e) => setContactNumber(e.target.value)}
//                   />

//                   <Input
//                     placeholder="City"
//                     value={city}
//                     onChange={(e) => setCity(e.target.value)}
//                   />

//                   <Input
//                     type="date"
//                     value={onboardingDate}
//                     onChange={(e) => setOnboardingDate(e.target.value)}
//                     placeholder="dd-mm-yyyy"
//                   />


//                 </div>

//                 {/* Subscription & Payment Info */}
//                 <div className="border rounded-md p-4 space-y-3">
//                   <Label className="font-semibold">Subscription & Payment Info <span className="text-red-500">*</span></Label>
//                   <Select value={paymentMode} onValueChange={setPaymentMode}>
//                     <SelectTrigger>
//                       <SelectValue placeholder="Select Payment Mode" />
//                     </SelectTrigger>
//                     <SelectContent>
//                       <SelectItem value="UPI">UPI</SelectItem>
//                       <SelectItem value="PayPal">PayPal</SelectItem>
//                       <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
//                       <SelectItem value="Credit/Debit Card">Credit/Debit Card</SelectItem>
//                     </SelectContent>
//                   </Select>

//                   <Select value={subscriptionCycle} onValueChange={setSubscriptionCycle}>
//                     <SelectTrigger>
//                       <SelectValue placeholder="Select Subscription Duration" />
//                     </SelectTrigger>
//                     <SelectContent>
//                       <SelectItem value="0">No applications subscription</SelectItem>
//                       <SelectItem value="15">15 Days</SelectItem>
//                       <SelectItem value="30">1 Month</SelectItem>
//                       <SelectItem value="60">2 Months</SelectItem>
//                       <SelectItem value="90">3 Months</SelectItem>
//                     </SelectContent>
//                   </Select>

//                   <Input
//                     placeholder="Subscription Sale Value ($)"
//                     value={subscriptionSaleValue}
//                     onChange={(e) => setSubscriptionSaleValue(e.target.value)}
//                   />

//                   <Input
//                     placeholder="Auto Total (Subscription Only)"
//                     value={autoTotal}
//                     disabled
//                   />

//                   <Select value={subscriptionSource} onValueChange={setSubscriptionSource}>
//                     <SelectTrigger>
//                       <SelectValue placeholder="Select Client Source" />
//                     </SelectTrigger>
//                     <SelectContent>
//                       <SelectItem value="Referral">Referral</SelectItem>
//                       <SelectItem value="NEW">NEW</SelectItem>
//                     </SelectContent>
//                   </Select>

//                 </div>
//               </div>

//               {/* Add-on Services */}
//               <div className="border rounded-md p-4 mt-4 space-y-3">
//                 <Label className="font-semibold">Optional Add-On Services</Label>
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                   <Input
//                     placeholder="Resume Sale Value ($)"
//                     value={resumeValue}
//                     onChange={(e) => setResumeValue(e.target.value)}
//                   />

//                   <Input
//                     placeholder="Portfolio Creation Value ($)"
//                     value={portfolioValue}
//                     onChange={(e) => setPortfolioValue(e.target.value)}
//                   />

//                   <Input
//                     placeholder="LinkedIn Optimization Value ($)"
//                     value={linkedinValue}
//                     onChange={(e) => setLinkedinValue(e.target.value)}
//                   />

//                   <Input
//                     placeholder="GitHub Optimization Value ($)"
//                     value={githubValue}
//                     onChange={(e) => setGithubValue(e.target.value)}
//                   />

//                 </div>
//               </div>

//               {/* Auto Calculated Section */}
//               <div className="border rounded-md p-4 mt-4">
//                 <Label className="font-semibold">Auto Calculated</Label>
//                 <div className="flex justify-between mt-2">
//                   {/* <p>Total Sale Value: <strong>$0</strong></p>
//         <p>Next Payment Due Date: <strong>-</strong></p> */}
//                   <p>Total Sale Value: <strong>${totalSale}</strong></p>
//                   <p>Next Payment Due Date: <strong>{nextDueDate}</strong></p>

//                 </div>
//               </div>

//               {/* Submit */}
//               <DialogFooter className="pt-4">
//                 <Button
//                   className="bg-green-600 text-white hover:bg-green-700"
//                   onClick={handleOnboardClientSubmit}
//                 >
//                   Submit
//                 </Button>

//               </DialogFooter>
//             </DialogContent>
//           </Dialog>


//           <Dialog open={saleClosingDialogOpen} onOpenChange={(open) => {
//             if (!open && pendingStageUpdate && previousStage) {


//               setLeads(prev =>
//                 prev.map(l =>
//                   l.id === pendingStageUpdate.leadId
//                     ? { ...l, current_stage: previousStage }
//                     : l
//                 )
//               );
//               setFollowUpsData(prev =>
//                 prev.map(l =>
//                   l.id === pendingStageUpdate.leadId
//                     ? { ...l, current_stage: previousStage }
//                     : l
//                 )
//               );

//               setPendingStageUpdate(null);
//               setPreviousStage(null);
//             }
//             setSaleClosingDialogOpen(open);
//           }}>

//             <DialogContent className="max-w-3xl" onPointerDownOutside={(e) => e.preventDefault()}>
//               <DialogHeader><DialogTitle>Close Sale</DialogTitle></DialogHeader>


//               <div className="space-y-4">

//                 <div className="grid grid-cols-2 gap-4">
//                   <div>
//                     <Label>Sale Closed On</Label>
//                     <Input
//                       type="date"
//                       value={saleData.closed_at}
//                       onChange={e => setSaleData(p => ({ ...p, closed_at: e.target.value }))}
//                       required
//                     />
//                   </div>
//                   <div>
//                     <Label>Company Application Email</Label>
//                     <Input
//                       type="email"
//                       value={saleData.company_application_email}
//                       onChange={e => setSaleData(p => ({ ...p, company_application_email: e.target.value }))}
//                       placeholder="The email password needs to 'Created@123'"
//                       required
//                     />
//                   </div>

//                 </div>
//                 <div className="grid grid-cols-2 gap-4">
//                   <div>
//                     <Label>Subscription Cycle</Label>
//                     <Select
//                       // value={saleData.subscription_cycle ? saleData.subscription_cycle.toString() : ""}

//  value={
//         saleData.subscription_cycle !== undefined && saleData.subscription_cycle !== null
//           ? saleData.subscription_cycle.toString()
//           : ""
//       }                      onValueChange={v => setSaleData(p => ({ ...p, subscription_cycle: Number(v) as 0 | 15 | 30 | 60 | 90 }))}
//                     >
//                       <SelectTrigger><SelectValue placeholder="Choose" /></SelectTrigger>
//                       <SelectContent>
//                         <SelectItem value="0">No subscription</SelectItem>
//                         <SelectItem value="15">15 days</SelectItem>
//                         <SelectItem value="30">1 month</SelectItem>
//                         <SelectItem value="60">2 months</SelectItem>
//                         <SelectItem value="90">3 months</SelectItem>
//                       </SelectContent>
//                     </Select>
//                   </div>

//                   <div >
//                     <Label>Applications Sale Value (1 month)</Label>
//                     <Input
//                       type="number"
//                       value={saleData.base_value}
//                       onChange={e => setSaleData(p => ({ ...p, base_value: Number(e.target.value) }))}
//                       required
//                     />
//                   </div>
//                 </div>




//                 <div className="grid grid-cols-2 gap-4">
//                   <div>
//                     <Label>Resume Enhancement ($)</Label>
//                     <Input type="number" value={saleData.resume_value}
//                       onChange={e => setSaleData(p => ({ ...p, resume_value: Number(e.target.value) }))} />
//                   </div>
//                   <div>
//                     <Label>Portfolio Service ($)</Label>
//                     <Input type="number" value={saleData.portfolio_value}
//                       onChange={e => setSaleData(p => ({ ...p, portfolio_value: Number(e.target.value) }))} />
//                   </div>
//                   <div>
//                     <Label>LinkedIn Optimization ($)</Label>
//                     <Input type="number" value={saleData.linkedin_value}
//                       onChange={e => setSaleData(p => ({ ...p, linkedin_value: Number(e.target.value) }))} />
//                   </div>
//                   <div>
//                     <Label>GitHub Optimization ($)</Label>
//                     <Input type="number" value={saleData.github_value}
//                       onChange={e => setSaleData(p => ({ ...p, github_value: Number(e.target.value) }))} />
//                   </div>
//                 </div>

//                 {/* EXTRA ADD-ONS + COMMITMENTS */}
//                 <div className="grid grid-cols-2 gap-4">
//                   {/* Courses / Certifications ($) */}
//                   <div>
//                     <Label>Courses / Certifications ($)</Label>
//                     <Input
//                       type="number"
//                       value={saleData.courses_value}
//                       onChange={e => setSaleData(p => ({ ...p, courses_value: Number(e.target.value) }))}
//                     />
//                   </div>

//                   {/* Custom add-on: label + amount */}
//                   <div>
//                     <Label>Custom Add-on</Label>
//                     <div className="flex gap-2">
//                       <Input
//                         placeholder="Label (e.g., Coaching)"
//                         value={saleData.custom_label}
//                         onChange={e => setSaleData(p => ({ ...p, custom_label: e.target.value }))}
//                         className="w-1/2"
//                       />
//                       <Input
//                         type="number"
//                         placeholder="$"
//                         value={saleData.custom_value}
//                         onChange={e => setSaleData(p => ({ ...p, custom_value: Number(e.target.value) }))}
//                         className="w-1/2"
//                       />
//                     </div>
//                   </div>

//                   {/* Commitments textarea */}
//                   <div className="grid-cols-2">
//                     <Label>Commitments</Label>
//                     <Textarea
//                       placeholder="Enter commitments (e.g., # of applications, calls, deliverables, timelines…)"
//                       value={saleData.commitments}
//                       onChange={e => setSaleData(p => ({ ...p, commitments: e.target.value }))}
//                       required
//                     />
//                   </div>
//                   {/* NEW: No. of job applications per month */}
//                   {/* <div>
//                     <Label>No. of job applications per month</Label>
//                     <Input
//                       type="number"
//                       inputMode="numeric"
//                       min={0}
//                       step={1}
//                       value={saleData.no_of_job_applications ?? ""}
//                       onChange={e =>
//                         setSaleData(p => ({
//                           ...p,
//                           no_of_job_applications:
//                             e.target.value === "" ? null : Math.max(0, parseInt(e.target.value, 10) || 0),
//                         }))
//                       }
//                       placeholder="20 or 40 applications"
//                     />
//                   </div>
//                   */}

//                   <div>
//   <Label>No. of job applications per month</Label>
//   <select
//     className="border rounded-md p-2 w-full mt-1"
//     value={saleData.no_of_job_applications ?? ""}
//     required
//     onChange={e =>
//       setSaleData(p => ({
//         ...p,
//         no_of_job_applications:
//           e.target.value === "" ? null : Number(e.target.value),
//       }))
//     }
//   >
//     <option value="">Select number of job applications</option>
//     <option value="0"> No applications</option>
//     <option value="20">20+</option>
//     <option value="40">40+</option>
//   </select>
// </div>


//                   {/* <div className="grid grid-cols-2 gap-4"> */}
//                     <div>
//                     <Label>Badge Value ($)</Label>
//                     <Input
//                       type="number"
//                       inputMode="decimal"
//                       min={0}
//                       step="0.01"
//                       value={saleData.badge_value ?? ""}          // show blank when null
//                       onChange={(e) =>
//                         setSaleData((p) => ({
//                           ...p,
//                           badge_value: e.target.value === "" ? null : Number(e.target.value),
//                         }))
//                       }
//                       placeholder="e.g., 100"
//                     />
//                   </div>

//                   <div>
//   <Label>Job Board Value ($)</Label>
//   <Input
//     type="number"
//     value={saleData.job_board_value}
//     onChange={e =>
//       setSaleData(p => ({ ...p, job_board_value: Number(e.target.value) }))
//     }
//     placeholder="e.g., 150"
//   />
// </div>


// {/* </div> */}
//                 </div>


//                 <div className="p-3 bg-gray-50 rounded-md text-sm">
//                   <p><strong>Total Amount →</strong> ${totalAmount.toLocaleString()}</p>
//                   {subscriptionEndsOn && (
//                     <p>
//                       <strong>Subscription ends:</strong> {subscriptionEndsOn}&nbsp;(
//                       {saleData.subscription_cycle} days)
//                     </p>
//                   )}
                  
// {saleData.subscription_cycle === 0 && (
//   <p className="text-gray-600 italic">No active applications cycle</p>
// )}
//                 </div>

//                 <div>
//                   <Label>Payment Mode</Label>
//                   <Select value={saleData.payment_mode}
//                     onValueChange={v => setSaleData(p => ({ ...p, payment_mode: v as SaleClosing["payment_mode"] }))}>
//                     <SelectTrigger><SelectValue placeholder="Pick one" /></SelectTrigger>
//                     <SelectContent>
//                       <SelectItem value="UPI">UPI</SelectItem>
//                       <SelectItem value="PayPal">PayPal</SelectItem>
//                       <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
//                       <SelectItem value="Stripe">Stripe</SelectItem>
//                       <SelectItem value="Credit/Debit Card">Credit/Debit Card</SelectItem>
//                       <SelectItem value="Razorpay">Razorpay</SelectItem>
//                       <SelectItem value="Other">Other</SelectItem>
//                     </SelectContent>
//                   </Select>
//                 </div>
//               </div>

//               <DialogFooter><Button onClick={handleSaleClosureSubmit}>Save</Button></DialogFooter>
//             </DialogContent>
//           </Dialog>
//         </div>
//       </DashboardLayout>


//     </ProtectedRoute>
//   );
// }




//app/sales/page.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from '@/utils/supabase/client';
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EditIcon, Eye, Search } from "lucide-react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);
import isBetween from "dayjs/plugin/isBetween";
import * as XLSX from "xlsx";
import { useRouter } from "next/navigation";


dayjs.extend(isBetween);


type SalesStage = "Prospect" | "DNP" | "Out of TG" | "Not Interested" | "Conversation Done" | "sale done" | "Target";

interface CallHistory {
  id: string;          // ← add id to update precisely
  date: string;        // followup_date (YYYY-MM-DD)
  stage: SalesStage;
  notes: string;
}

type PRPaidFlag = "Paid" | "Not paid";
type PRRow = {
  lead_id: string;
  name: string;
  email: string;
  closed_at: string | null; // oldest closure date (YYYY-MM-DD or null)

  resumePaid: PRPaidFlag;
  resumeStatus: string | null;
  resumePdf: string | null;

  portfolioPaid: PRPaidFlag;
  portfolioStatus: string | null;
  portfolioLink: string | null;

  githubPaid: PRPaidFlag; // no status/link available for github in resume_progress
};
interface Lead {
  id: string;
  business_id: string;
  client_name: string;
  email: string;
  phone: string;
  status?: string;     // Optional, if you want to track status
  assigned_to: string;
  current_stage: SalesStage;
  call_history: CallHistory[];
  created_at: string | null;
  assigned_at: string | null;
}

interface Profile {
  full_name: string;
  roles: string;
}
interface SaleClosing {
  base_value: number;                 // price for 1-month
  subscription_cycle: 0 | 15 | 30 | 60 | 90;
  payment_mode: "UPI" | "PayPal" | "Bank Transfer" | "Stripe" | "Credit/Debit Card" | "Other";
  closed_at: string;                  // YYYY-MM-DD picked from calendar
  resume_value: number;
  portfolio_value: number;
  linkedin_value: number;
  github_value: number;
  badge_value: number | null;   // ✅ NEW
  job_board_value: number;


  // NEW
  courses_value: number;   // Courses/Certifications ($)
  custom_label: string;    // Custom label
  custom_value: number;    // Custom ($)
  commitments: string;     // Free-text commitments
  company_application_email: string;

  no_of_job_applications: number | null;

}


interface FollowUp {
  follow_up_date: string;
  notes: string;
}

const salesStages: SalesStage[] = [
  "Prospect", "DNP", "Out of TG", "Not Interested", "Conversation Done", "Target", "sale done"
];

const getStageColor = (stage: SalesStage) => {
  switch (stage) {
    case "Prospect": return "bg-blue-100 text-blue-800";
    case "DNP": return "bg-yellow-100 text-yellow-800";
    case "Out of TG":
    case "Not Interested": return "bg-red-100 text-red-800";
    case "Conversation Done": return "bg-purple-100 text-purple-800";
    case "sale done": return "bg-green-100 text-green-800";
    case "Target": return "bg-orange-100 text-orange-800";
    default: return "bg-gray-100 text-gray-800";
  }
};



export default function SalesPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [salesClosedTotal, setSalesClosedTotal] = useState(0);

  const [salesUsers, setSalesUsers] = useState<{ full_name: string; user_email: string }[]>([]);



  const [isChecking, setIsChecking] = useState(false);

  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [followUpDialogOpen, setFollowUpDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [followUpData, setFollowUpData] = useState<FollowUp>({ follow_up_date: "", notes: "" });
  const [followUpSubmitted, setFollowUpSubmitted] = useState(false); // Track if follow-up was submitted
  const [followUpsDialogOpen, setFollowUpsDialogOpen] = useState(false);
  const [followUpsData, setFollowUpsData] = useState<any[]>([]);
  const [followUpsFilter, setFollowUpsFilter] = useState<"today" | "all">("today");
  const [pendingStageUpdate, setPendingStageUpdate] = useState<{ leadId: string, stage: SalesStage } | null>(null);
  const [previousStage, setPreviousStage] = useState<SalesStage | null>(null);
  const [totalAmount, setTotalAmount] = useState(0);
  const [subscriptionEndsOn, setSubscriptionEndsOn] = useState<string>("");
  const [startDate, setStartDate] = useState<string | null>(null);
  const [editingNote, setEditingNote] = useState(false);
  const [editedNote, setEditedNote] = useState("");



  const [page, setPage] = useState(1);
const [pageSize, setPageSize] = useState(30); // default
const [totalRecords, setTotalRecords] = useState(0);


  const [endDate, setEndDate] = useState<string | null>(null);
  const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);
  const [onboardDialogOpen, setOnboardDialogOpen] = useState(false);

  // Client Info
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [city, setCity] = useState("");
  const [onboardingDate, setOnboardingDate] = useState("");

  // Subscription
  const [paymentMode, setPaymentMode] = useState("");
  const [subscriptionCycle, setSubscriptionCycle] = useState(""); // Values: "15", "30", "60", "90"
  const [subscriptionSaleValue, setSubscriptionSaleValue] = useState("");
  const [subscriptionSource, setSubscriptionSource] = useState("");

  // Add-ons
  const [resumeValue, setResumeValue] = useState("");
  const [portfolioValue, setPortfolioValue] = useState("");
  const [linkedinValue, setLinkedinValue] = useState("");
  const [githubValue, setGithubValue] = useState("");

const [inputSearch, setInputSearch] = useState("");
const [isHoveringClear, setIsHoveringClear] = useState(false);

  // Calculated Fields
  const [autoTotal, setAutoTotal] = useState(0);
  const [totalSale, setTotalSale] = useState(0);
  const [nextDueDate, setNextDueDate] = useState("-");

  const router = useRouter();


  // Auto calculate subscription total
  useEffect(() => {
    const base = parseFloat(subscriptionSaleValue || "0");
    const cycle = parseInt(subscriptionCycle || "0");

    const multiplier =
    cycle  === 0 ? 0 :
      cycle === 15 ? 0.5 :
        cycle === 30 ? 1 :
          cycle === 60 ? 2 :
            cycle === 90 ? 3 : 0;

    setAutoTotal(base * multiplier);
  }, [subscriptionSaleValue, subscriptionCycle]);

  // Auto calculate total sale
  useEffect(() => {
    const resume = parseFloat(resumeValue || "0");
    const linkedin = parseFloat(linkedinValue || "0");
    const github = parseFloat(githubValue || "0");
    const portfolio = parseFloat(portfolioValue || "0");

    setTotalSale(autoTotal + resume + linkedin + github + portfolio);
  }, [autoTotal, resumeValue, linkedinValue, githubValue, portfolioValue]);




useEffect(() => {
  fetchSalesUsers();
}, []);


  useEffect(() => {
    fetchSalesClosureCount();
  }, []);

  useEffect(() => {
    const run = async () => {
      let q = supabase
        .from("sales_closure")
        .select("lead_id", { count: "exact", head: true });

      if (startDate && endDate) {
        q = q
          .gte("closed_at", dayjs(startDate).format("YYYY-MM-DD"))
          .lte("closed_at", dayjs(endDate).format("YYYY-MM-DD"));
      }

      const { count, error } = await q;
      if (!error) setSalesClosedTotal(count ?? 0);
    };
    run();
  }, [startDate, endDate]);

  // Calculate next payment due date
  useEffect(() => {
    const days = parseInt(subscriptionCycle || "0");
    if (days && onboardingDate) {
      setNextDueDate(dayjs(onboardingDate).add(days, "day").format("YYYY-MM-DD"));
    } else {
      setNextDueDate("-");
    }
  }, [subscriptionCycle, onboardingDate]);

  const [saleData, setSaleData] = useState<SaleClosing>({
    base_value: 0,
    subscription_cycle: "" as unknown as 0 | 15 | 30 | 60 | 90,
    payment_mode: "" as unknown as SaleClosing["payment_mode"],
    closed_at: "",
    resume_value: 0,
    portfolio_value: 0,
    linkedin_value: 0,
    github_value: 0,
    // NEW
    courses_value: 0,
    custom_label: "",
    custom_value: 0,
    commitments: "",
    company_application_email: "",  // Add this field
    no_of_job_applications: null,
    badge_value: null,                           // ✅ NEW
    job_board_value: 0,



  });



  useEffect(() => {
    fetchUserProfile();

  }, []);

  const fetchUserProfile = async () => {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error("Error fetching auth user:", authError);
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("full_name, roles")
      .eq("auth_id", user.id)
      .single();

    if (profileError) {
      console.error("Error fetching profile:", profileError);
      return;
    }

    console.log("Fetched profile:", profile);

    setUserProfile(profile);
    fetchLeads(profile);   // pass profile here
  };


useEffect(() => {
  if (userProfile) fetchLeads(userProfile);
}, [page, pageSize]);


  const fetchLeads = async (profile: Profile) => {
  try {
    // Count total leads FIRST (for pagination display)
    let countQuery = supabase
      .from("leads")
      .select("*", { count: "exact", head: true })
      .eq("status", "Assigned");

    if (profile.roles === "Sales Associate") {
      countQuery = countQuery.eq("assigned_to", profile.full_name);
    }

    const { count } = await countQuery;
    setTotalRecords(count ?? 0);

    // Now fetch paginated leads
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
  .from("leads")
  .select(`
    id, business_id, name, email, phone,
    assigned_to, current_stage, status,
    created_at, assigned_at
  `)
  .eq("status", "Assigned")
  .order("assigned_at", { ascending: false })   // 👈 NEW SORT
  .range(from, to);


    if (profile.roles === "Sales Associate") {
      query = query.eq("assigned_to", profile.full_name);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching leads:", error);
      return;
    }

    const leadsData = (data ?? []).map((lead: any) => ({
      id: lead.id,
      business_id: lead.business_id,
      client_name: lead.name,
      email: lead.email,
      phone: lead.phone,
      assigned_to: lead.assigned_to,
      current_stage: lead.current_stage,
      call_history: [],
      created_at: lead.created_at,
      assigned_at: lead.assigned_at,
    }));

    setLeads(leadsData);

  } catch (err) {
    console.error("Pagination fetch error:", err);
  }
};

const searchLeadsGlobally = async (term: string) => {
  try {
    const { data, error } = await supabase
      .from("leads")
      .select(`
        id, business_id, name, email, phone,
        assigned_to, assigned_to_email, current_stage,
        status, created_at, assigned_at
      `)
      .or(`name.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${term}%,business_id.ilike.%${term}%`)
      .eq("status", "Assigned")
      .order("assigned_at", { ascending: false });

    if (error) {
      console.error("Global search error:", error);
      return;
    }

    const leadsData = (data ?? []).map((lead: any) => ({
      id: lead.id,
      business_id: lead.business_id,
      client_name: lead.name,
      email: lead.email,
      phone: lead.phone,
      assigned_to: lead.assigned_to,
      assigned_to_email: lead.assigned_to_email,
      current_stage: lead.current_stage,
      call_history: [],
      created_at: lead.created_at,
      assigned_at: lead.assigned_at,
    }));

    setLeads(leadsData);
    setTotalRecords(leadsData.length);
  } catch (err) {
    console.error("Global search failed:", err);
  }
};

useEffect(() => {
  if (!searchTerm.trim()) {
    if (userProfile) fetchLeads(userProfile);
  }
}, [searchTerm]);



useEffect(() => {
  const multiplier =
    saleData.subscription_cycle === 0 ? 0 :
    saleData.subscription_cycle === 15 ? 0.5 :
    saleData.subscription_cycle === 30 ? 1 :
    saleData.subscription_cycle === 60 ? 2 :
    saleData.subscription_cycle === 90 ? 3 : 0;

  const applicationSale = saleData.base_value * multiplier;

  const addOns =
    (saleData.resume_value || 0) +
    (saleData.portfolio_value || 0) +
    (saleData.linkedin_value || 0) +
    (saleData.github_value || 0) +
    (saleData.courses_value || 0) +
    (saleData.custom_value || 0) +
    (saleData.badge_value || 0) +
    (saleData.job_board_value || 0);

  setTotalAmount(applicationSale + addOns);
}, [
  saleData.base_value,
  saleData.subscription_cycle,
  saleData.resume_value,
  saleData.portfolio_value,
  saleData.linkedin_value,
  saleData.github_value,
  saleData.courses_value,
  saleData.custom_value,
  saleData.badge_value,
  saleData.job_board_value
]);




  /* 📅  Compute subscription-end date preview */
  useEffect(() => {
    if (!saleData.closed_at || !saleData.subscription_cycle) {
      setSubscriptionEndsOn(""); return;
    }
    const start = new Date(saleData.closed_at);
    start.setDate(start.getDate() + saleData.subscription_cycle);
    setSubscriptionEndsOn(start.toISOString().slice(0, 10));
  }, [saleData.closed_at, saleData.subscription_cycle]);


  const fetchFollowUps = async () => {
    if (!userProfile) return [];

    let leadsQuery = supabase
      .from("leads")
      .select("id, business_id, name, email, phone, assigned_to, current_stage")
      .in("current_stage", ["DNP", "Conversation Done", "Target"]);

    // 🔒 Filter by name if not Admin
    if (userProfile.roles === "Sales Associate") {
      leadsQuery = leadsQuery.eq("assigned_to", userProfile.full_name);
    }

    const { data: leadsData, error: leadsError } = await leadsQuery;
    if (leadsError) {
      console.error("❌ Error fetching leads:", leadsError);
      return [];
    }

    const businessIds = leadsData.map((l) => l.business_id);

    const { data: historyData, error: historyError } = await supabase
      .from("call_history")
      .select("id, lead_id, followup_date, notes")
      .in("lead_id", businessIds)
      .order("followup_date", { ascending: false });

    if (historyError) {
      console.error("❌ Error fetching call history:", historyError);
      return [];
    }

    const mostRecentMap = new Map<string, { followup_date: string; notes: string }>();
    for (const entry of historyData) {
      if (!mostRecentMap.has(entry.lead_id)) {
        mostRecentMap.set(entry.lead_id, {
          followup_date: entry.followup_date ?? "N/A",
          notes: entry.notes ?? "N/A",
        });
      }
    }

    return leadsData.map((lead) => ({
      ...lead,
      followup_date: mostRecentMap.get(lead.business_id)?.followup_date ?? "N/A",
      notes: mostRecentMap.get(lead.business_id)?.notes ?? "N/A",
    }));
  };

  // 🧭 Sorting Config
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Lead | null;
    direction: 'asc' | 'desc';
  }>({ key: null, direction: 'asc' });

  const handleSort = (key: keyof Lead) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleUpdateAssignedTo = async (leadId: string, selectedName: string, selectedEmail: string) => {
  try {
    const { error } = await supabase
      .from("leads")
      .update({
        assigned_to: selectedName,
        assigned_to_email: selectedEmail,
        assigned_at: new Date().toISOString(),
      })
      .eq("id", leadId);

    if (error) throw error;
    alert(`Lead assigned to ${selectedName}`);
    if (userProfile) await fetchLeads(userProfile);
  } catch (err: any) {
    console.error("Error updating assigned_to:", err.message);
    alert("Failed to update assignment.");
  }
};


const filteredLeads = leads.filter((lead) => {
  const matchesStage = stageFilter === "all" || lead.current_stage === stageFilter;

  const matchesDate =
    !startDate || !endDate ||
    (lead.assigned_at &&
      dayjs(lead.assigned_at).isBetween(
        dayjs(startDate).startOf("day"),
        dayjs(endDate).endOf("day"),
        null,
        "[]"
      ));

  return matchesStage && matchesDate;
});

  const handleStageUpdate = async (leadId: string, newStage: SalesStage) => {
    const lead = leads.find((l) => l.id === leadId);
    if (!lead) return;

    setSelectedLead(lead);
    setPreviousStage(lead.current_stage); // Save current stage for revert

    if (newStage === "DNP" || newStage === "Conversation Done" || newStage === "Target") {
      setLeads((prev) =>
        prev.map((l) => (l.id === leadId ? { ...l, current_stage: newStage } : l))
      );
      setPendingStageUpdate({ leadId, stage: newStage });
      setFollowUpDialogOpen(true);
      return;
    }

    if (newStage === "sale done") {
     
        window.open(`/SaleUpdate/${lead.business_id}?mode=new`, "_blank");

      return;
    }

    // Immediate update for other stages
    const updatedLead = { ...lead, current_stage: newStage };
    const { error } = await supabase.from("leads").update({ current_stage: newStage }).eq("id", leadId);
    if (error) {
      console.error("Error updating stage:", error);
      return;
    }

    await supabase.from("call_history").insert([{
      lead_id: lead.business_id,
      email: lead.email,
      phone: lead.phone,
      assigned_to: lead.assigned_to,
      current_stage: newStage,
      // followup_date: new Date().toISOString().split("T")[0],
      followup_date: todayLocalYMD(),

      notes: `Stage changed to ${newStage}`
    }]);

    setLeads((prev) => prev.map((l) => (l.id === leadId ? updatedLead : l)));
  };

  const handleFollowUpSubmit = async () => {
    if (!selectedLead || !pendingStageUpdate) return;

    const { error: historyError } = await supabase.from("call_history").insert([{
      lead_id: selectedLead.business_id,
      email: selectedLead.email,
      phone: selectedLead.phone,
      assigned_to: selectedLead.assigned_to,
      current_stage: pendingStageUpdate.stage,
      followup_date: followUpData.follow_up_date,
      notes: followUpData.notes
    }]);

    if (historyError) {
      console.error("Error inserting follow-up:", historyError);
      return;
    }

    const { error: stageError } = await supabase
      .from("leads")
      .update({ current_stage: pendingStageUpdate.stage })
      .eq("id", pendingStageUpdate.leadId);

    if (stageError) {
      console.error("Error updating stage:", stageError);
      return;
    }

    setLeads((prev) =>
      prev.map((l) =>
        l.id === pendingStageUpdate.leadId ? { ...l, current_stage: pendingStageUpdate.stage } : l
      )
    );
    setFollowUpsData((prev) =>
      prev.map((l) =>
        l.id === pendingStageUpdate.leadId ? { ...l, current_stage: pendingStageUpdate.stage } : l
      )
    );

    setFollowUpSubmitted(true);       // ← add this

    setFollowUpDialogOpen(false);
    setFollowUpData({ follow_up_date: "", notes: "" });
    setPendingStageUpdate(null);
    setPreviousStage(null);

    // 👇 After updating stage and call_history
    const updatedFollowUps = await fetchFollowUps();
    setFollowUpsData(updatedFollowUps);
    setFollowUpSubmitted(false);      // reset for next time

  };

  const handleFollowUpDialogClose = (open: boolean) => {
    if (!open) {
      if (!followUpSubmitted && pendingStageUpdate && previousStage) {
        setLeads(prev =>
          prev.map(l =>
            l.id === pendingStageUpdate.leadId ? { ...l, current_stage: previousStage } : l
          )
        );
      }
      // full reset
      setFollowUpSubmitted(false);
      setPendingStageUpdate(null);
      setPreviousStage(null);
      setFollowUpDialogOpen(false);
      return;
    }
    setFollowUpDialogOpen(true);
  };

  const totalLeadsCount = filteredLeads.length;

  const stageCounts = filteredLeads.reduce((acc, l) => {
    acc[l.current_stage] = (acc[l.current_stage] || 0) as number + 1;
    return acc;
  }, {} as Record<SalesStage, number>);

  const prospectCount = stageCounts["Prospect"] ?? 0;
  const dnpCount = stageCounts["DNP"] ?? 0;
  const convoDoneCount = stageCounts["Conversation Done"] ?? 0;
  const targetCount = stageCounts["Target"] ?? 0;
  const saleDoneCount = stageCounts["sale done"] ?? 0;

  // If you still want an “Others” bucket using the same list:
  const othersCount = totalLeadsCount - (prospectCount + dnpCount + convoDoneCount + saleDoneCount + targetCount);

  const fetchCallHistory = async (leadId: string) => {
    const lead = leads.find((l) => l.id === leadId);
    if (!lead) return [];

    const { data, error } = await supabase
      .from("call_history")
      .select("id, current_stage, followup_date, notes")   // ← add id
      .eq("lead_id", lead.business_id)
      .order("followup_date", { ascending: false });

    if (error) {
      console.error("Error fetching call history:", error);
      return [];
    }

    const callHistoryData: CallHistory[] = data.map((r: any) => ({
      id: r.id,
      date: r.followup_date,
      stage: r.current_stage,
      notes: r.notes,
    }));
    return callHistoryData;
  };


const fetchSalesUsers = async () => {
  const { data, error } = await supabase
    .from("profiles")
    .select("full_name, user_email")
    .in("roles", ["Sales", "Sales Associate"]);

  if (error) {
    console.error("Error fetching sales users:", error);
    return [];
  }

  setSalesUsers(data || []);
};

  async function handleOnboardClientSubmit() {
    try {
      const confirmed = window.confirm("Are you sure you want to onboard this client?");
      if (!confirmed) return;

      const { data: idResult, error: idError } = await supabase.rpc('generate_custom_lead_id');
      if (idError || !idResult) {
        console.error("Failed to generate lead ID:", idError);
        return alert("Could not generate Lead ID. Try again.");
      }
      const newLeadId = idResult;

      const base = Number(subscriptionSaleValue || 0);
      const resume = Number(resumeValue || 0);
      const linkedin = Number(linkedinValue || 0);
      const github = Number(githubValue || 0);
      const portfolio = Number(portfolioValue || 0);
      const cycle = Number(subscriptionCycle || 0);

      const multiplier =
        cycle === 0 ? 0 :
        cycle === 15 ? 0.5 :
          cycle === 30 ? 1 :
            cycle === 60 ? 2 :
              cycle === 90 ? 3 : 0;

      const applicationSale = Number((base * multiplier).toFixed(2));

      const totalSaleCalc = base * multiplier + resume + linkedin + github + portfolio;

      // use local date strings for date columns stored as DATE in PG
      const createdAt = dayjs().toISOString();
      const onboardDate = toYMD(onboardingDate);   // "YYYY-MM-DD"

      const { error: leadsInsertError } = await supabase.from("leads").insert({
        business_id: newLeadId,
        name: clientName,
        email: clientEmail,
        phone: contactNumber,
        city: city,
        created_at: createdAt,
        source: subscriptionSource || "Onboarded Client",
        status: "Assigned",
        current_stage: "sale done", // optional: if you onboard only after closing
      });
      if (leadsInsertError) throw leadsInsertError;

      const { error: salesInsertError } = await supabase.from("sales_closure").insert({
        lead_id: newLeadId,
        email: clientEmail,
        lead_name: clientName,
        payment_mode: paymentMode,
        subscription_cycle: cycle,
        sale_value: totalSaleCalc,
        closed_at: onboardDate,                // if column is date
        onboarded_date: onboardDate,          // if you store this too
        finance_status: "Paid",
        application_sale_value: applicationSale,
        resume_sale_value: resume || null,
        linkedin_sale_value: linkedin || null,
        github_sale_value: github || null,
        portfolio_sale_value: portfolio || null,
        associates_email: "",
        associates_name: "",
        associates_tl_email: "",
        associates_tl_name: "",
        checkout_date: null,
        invoice_url: "",
        no_of_job_applications: null,
        badge_value: saleData.badge_value ?? null,      // ✅ optional here

      });
      if (salesInsertError) throw salesInsertError;

      // refresh list
      if (userProfile) await fetchLeads(userProfile);

      // reset
      setClientName(""); setClientEmail(""); setContactNumber(""); setCity("");
      setOnboardingDate(""); setSubscriptionCycle(""); setSubscriptionSaleValue("");
      setPaymentMode(""); setResumeValue(""); setPortfolioValue(""); setLinkedinValue(""); setGithubValue("");
      setOnboardDialogOpen(false);
      alert("✅ Client onboarded successfully!");
    } catch (err: any) {
      console.error("❌ Error onboarding client:", err?.message || err);
      alert(`Failed to onboard client: ${err?.message || "Unknown error"}`);
    }
  }

  const handleUpdateNote = async (call: CallHistory) => {
    try {
      const { error } = await supabase
        .from("call_history")
        .update({ notes: editedNote })
        .eq("id", call.id);                 // ← precise update

      if (error) throw error;

      const updated = await fetchCallHistory(selectedLead!.id);
      setSelectedLead((prev) => (prev ? { ...prev, call_history: updated } : null));
      setEditingNote(false);
      alert("Note updated!");
    } catch (err) {
      console.error("Failed to update note:", err);
      alert("Failed to update note.");
    }
  };

  // Function to fetch data from all tables and export them as Excel
const downloadAllTablesData = async () => {
  try {
    // Table names we want to fetch
    const tables = ['call_history', 'client_feedback', 'client_onborading_details', 'leads', 'portfolio_progress', 'profiles', 'resume_progress', 'sales_closure'];
    const data: { [key: string]: any } = {};

    // Fetch data from all tables and store them in an object
    for (const table of tables) {
      const { data: tableData, error } = await supabase.from(table).select("*");
      if (error) {
        console.error(`Error fetching data from ${table}:`, error);
        continue;
      }
      data[table] = tableData;
    }

    // Create a new workbook
    const wb = XLSX.utils.book_new();

    // Loop through the data object and add each table's data as a new sheet in the workbook
    for (const table in data) {
      if (data[table]) {
        const ws = XLSX.utils.json_to_sheet(data[table]);
        XLSX.utils.book_append_sheet(wb, ws, table); // Add a sheet with the table name
      }
    }

    // Export the workbook to an Excel file
    XLSX.writeFile(wb, "SalesData.xlsx");
  } catch (error) {
    console.error("Error downloading tables data:", error);
  }
};

  // —— helpers (local-date safe) ——
  const toYMD = (d?: string | Date) => (d ? dayjs(d).format("YYYY-MM-DD") : "");
  const todayLocalYMD = () => dayjs().format("YYYY-MM-DD");

  const cycleMultiplier = (d?: number) =>
   d === 0 ? 0 : d === 15 ? 0.5 : d === 30 ? 1 : d === 60 ? 2 : d === 90 ? 3 : 0;

  // 👉 ADD THIS derived constant (place near your other derived consts)
  const applicationSaleValue = Number(
    (saleData.base_value * cycleMultiplier(saleData.subscription_cycle)).toFixed(2)
  );

  const sortedLeads = [...filteredLeads].sort((a, b) => {
    const { key, direction } = sortConfig;
    if (!key) return 0;

    let aValue: any = a[key];
    let bValue: any = b[key];

    // 📅 Date fields
    if (key === 'created_at' || key === 'assigned_at') {
      const aTime = aValue ? new Date(aValue).getTime() : 0;
      const bTime = bValue ? new Date(bValue).getTime() : 0;
      return direction === 'asc' ? aTime - bTime : bTime - aTime;
    }

    // 🔤 String fields
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return direction === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    // 🔢 Number fields fallback
    return direction === 'asc'
      ? (aValue || 0) - (bValue || 0)
      : (bValue || 0) - (aValue || 0);
  });

  const fetchSalesClosureCount = async () => {
    const { count, error } = await supabase
      .from("sales_closure")
      .select("lead_id", { count: "exact", head: true });

    if (!error) setSalesClosedTotal(count ?? 0);
  };


  return (
    <ProtectedRoute allowedRoles={["Sales", "Sales Associate", "Super Admin"]}>

      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">Sales CRM</h1>

            <div className="justify-end flex gap-2">
            

 {userProfile?.roles === "Admin" && (
        <Button
          onClick={downloadAllTablesData}
          className="ml-2"
        >
          Download All Database data
        </Button>
       )} 
            
          <Button onClick={() => window.open("/sales/followups", "_blank")}>Follow Ups</Button>
             <Button
  onClick={() => window.open("/SalesAddonsInfo", "_blank")}
>
  Portfolio/Resumes
</Button>


            </div>

          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <Dialog open={followUpsDialogOpen} onOpenChange={setFollowUpsDialogOpen}>
              <DialogContent className="max-w-7xl" onPointerDownOutside={(e) => e.preventDefault()}>

                <DialogHeader>
                  <DialogTitle>Follow Ups – DNP / Conversation Done</DialogTitle>
                  <DialogDescription>Leads with scheduled follow-ups</DialogDescription>
                  <div className="flex justify-end mb-4">
                    <Select value={followUpsFilter} onValueChange={(val) => setFollowUpsFilter(val as "today" | "all")}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Filter by Date" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="today">Today</SelectItem>
                        <SelectItem value="all">All Dates</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                </DialogHeader>

                <div className="max-h-[70vh] overflow-y-auto overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>S.No</TableHead>
                        <TableHead>Business ID</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Assigned To</TableHead>
                        <TableHead>Stage</TableHead>
                        <TableHead>Follow-up Date</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {followUpsData.filter((item) => {
                        if (followUpsFilter === "all") return true;
                        if (!item.followup_date) return false;
                        const today = todayLocalYMD();
                        return item.followup_date === today;
                      }).length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center text-muted-foreground py-6">
                            {followUpsFilter === "all"
                              ? "No follow-up data available."
                              : "There are no follow ups today."}
                          </TableCell>
                        </TableRow>
                      ) : (
                        followUpsData
                          .filter((item) => {
                            if (followUpsFilter === "all") return true;
                            if (!item.followup_date) return false;
                            const today = todayLocalYMD();
                            return item.followup_date === today;
                          })
                          .map((item, idx) => (
                            <TableRow key={idx}>
                              <TableCell>{idx + 1}</TableCell>
                              <TableCell>{item.business_id}</TableCell>
                              {/* <TableCell>{item.name}</TableCell> */}

                              <TableCell
                                className="font-medium max-w-[150px] break-words whitespace-normal cursor-pointer text-blue-600 hover:underline"
                                onClick={() => window.open(`/leads/${item.business_id}`, "_blank")}
                              >
                                {item.name}
                              </TableCell>

                              <TableCell>{item.email}</TableCell>
                              <TableCell>{item.phone}</TableCell>
                              <TableCell>{item.assigned_to}</TableCell>
                              <TableCell>
                                <Select value={item.current_stage}
                                  onValueChange={(value: SalesStage) => {
                                    const selectedItem = followUpsData.find((f) => f.id === item.id);
                                    if (!selectedItem) return;
                                    handleStageUpdate(item.id, value);
                                  }}

                                >
                                  {/* <SelectTrigger className="w-40"><SelectValue /></SelectTrigger> */}
                                  <SelectTrigger
                                    className={`w-40 ${item.current_stage === "sale done"
                                      ? "pointer-events-none opacity-100 text-black bg-gray-100 border border-gray-300 cursor-not-allowed"
                                      : ""
                                      }`}
                                  >
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {salesStages
                                      .filter((stage) => item.current_stage === "Prospect" || stage !== "Prospect")
                                      .map((stage) => (
                                        <SelectItem key={stage} value={stage}>
                                          <Badge className={getStageColor(stage)}>{stage}</Badge>
                                        </SelectItem>
                                      ))}
                                  </SelectContent>
                                </Select>
                              </TableCell>

                              <TableCell>{item.followup_date}</TableCell>
                              <TableCell>{item.notes}</TableCell>
                            </TableRow>
                          ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </DialogContent>
            </Dialog>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">All leads</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalLeadsCount}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Prospects</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{prospectCount}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">DNP & Conversation Done</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{(dnpCount + convoDoneCount)}</div>
              </CardContent>
            </Card>


            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Sales Done (from leads)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{saleDoneCount}</div>
              </CardContent>
            </Card>


            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Others</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{othersCount}</div>
              </CardContent>
            </Card>


          </div>

          {/* Search & Filter */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
          

            <div className="flex gap-3 flex-1">
  <div className="relative flex-1">
    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
   <Input
  placeholder="Search..."
  value={inputSearch}
  onChange={(e) => setInputSearch(e.target.value)}
  className="pl-10"
/>

  </div>

 <Button
  disabled={isChecking || !inputSearch.trim()}
  onClick={async () => {
    setIsChecking(true);

    setSearchTerm(inputSearch.trim()); // <- assign here
    await searchLeadsGlobally(inputSearch.trim());

    setIsChecking(false);
  }}
  className="w-28"
>
  {isChecking ? "Searching..." : "Search"}
</Button>
<Button
  variant="outline"
  disabled={isChecking}
  onMouseEnter={() => setIsHoveringClear(true)}
  onMouseLeave={() => setIsHoveringClear(false)}
  onClick={() => {
    setInputSearch("");
    setSearchTerm("");
    if (userProfile) fetchLeads(userProfile);
  }}
  className="px-4 bg-red-50 text-gray-900 hover:bg-red-300 focus:ring-red-500 transition-all duration-200"
>
  {isHoveringClear ? "Clear Search" : "❌"}
</Button>


</div>

            <Select value={String(pageSize)} onValueChange={(v) => {
  if (v === "all") {
    setPageSize(totalRecords);
    setPage(1);
  } else {
    setPageSize(Number(v));
    setPage(1);
  }
}}>
  <SelectTrigger className="w-40">
    <SelectValue placeholder="Rows per page" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="30">30 per page</SelectItem>
    <SelectItem value="50">50 per page</SelectItem>
    <SelectItem value="100">100 per page</SelectItem>
    <SelectItem value="200">200 per page</SelectItem>
    <SelectItem value="500">500 per page</SelectItem>
    <SelectItem value="1000">1000 per page</SelectItem>

    <SelectItem value="all">All</SelectItem>
  </SelectContent>
</Select>
            <Select value={stageFilter} onValueChange={setStageFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by stage" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stages</SelectItem>
                {salesStages.map(stage => (<SelectItem key={stage} value={stage}>{stage}</SelectItem>))}
              </SelectContent>
            </Select>

            <div className="relative w-full sm:w-[300px]">
              {/* 📅 Button Trigger */}
              <div
                onClick={() => setIsDateDropdownOpen(!isDateDropdownOpen)}
                className="bg-white border rounded-md shadow-sm px-4 py-2 cursor-pointer flex justify-between items-center"
              >
                <span>
                  {startDate && endDate
                    ? `📅 ${dayjs(startDate).format('DD MMM')} → ${dayjs(endDate).format('DD MMM')}`
                    : "📅 Date Range"}
                </span>
                <span className="text-gray-400">▼</span>
              </div>

              {/* 📅 Dropdown Content */}
              {isDateDropdownOpen && (
                <div className="absolute z-50 mt-2 bg-white rounded-md shadow-lg p-4 w-[300px] border space-y-4">
                  <div>
                    <Label className="text-sm text-gray-600">Start Date</Label>
                    <Input
                      type="date"
                      value={startDate ?? ""}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label className="text-sm text-gray-600">End Date</Label>
                    <Input
                      type="date"
                      value={endDate ?? ""}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>

                  <Button
                    variant="ghost"
                    className="text-red-500 text-sm p-0"
                    onClick={() => {
                      setStartDate(null);
                      setEndDate(null);
                      setIsDateDropdownOpen(false); // close on clear
                    }}
                  >
                    ❌ Clear Filter
                  </Button>
                </div>
              )}
            </div>

          </div>
          <Card>
            <CardHeader>
              <CardTitle>Sales Pipeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>S.No</TableHead>


                      <TableHead onClick={() => handleSort("business_id")} className="cursor-pointer select-none">
                        <div className="flex items-center gap-1">
                          Business ID
                          <span className="text-sm">
                            <span className={sortConfig.key === "business_id" && sortConfig.direction === "asc" ? "font-bold text-blue-600" : "text-gray-400"}>
                              ↓
                            </span>
                            <span className={sortConfig.key === "business_id" && sortConfig.direction === "desc" ? "font-bold text-blue-600" : "text-gray-400"}>
                              ↑
                            </span>
                          </span>
                        </div>
                      </TableHead>

                      <TableHead onClick={() => handleSort("client_name")} className="cursor-pointer select-none">
                        <div className="flex items-center gap-1">
                          Client Name
                          <span className="text-sm">
                            <span className={sortConfig.key === "client_name" && sortConfig.direction === "asc" ? "font-bold text-blue-600" : "text-gray-400"}>
                              ↑
                            </span>
                            <span className={sortConfig.key === "client_name" && sortConfig.direction === "desc" ? "font-bold text-blue-600" : "text-gray-400"}>
                              ↓
                            </span>
                          </span>
                        </div>
                      </TableHead>

                      <TableHead className="w-32">Email</TableHead>
                      <TableHead>Phone</TableHead>

                      <TableHead onClick={() => handleSort("created_at")} className="cursor-pointer select-none w-40">
                        <div className="flex items-center gap-1">
                          Created At
                          <span className="text-sm">
                            <span className={sortConfig.key === "created_at" && sortConfig.direction === "asc" ? "font-bold text-blue-600" : "text-gray-400"}>
                              ↑
                            </span>
                            <span className={sortConfig.key === "created_at" && sortConfig.direction === "desc" ? "font-bold text-blue-600" : "text-gray-400"}>
                              ↓
                            </span>
                          </span>
                        </div>
                      </TableHead>
                      <TableHead onClick={() => handleSort("created_at")} className="cursor-pointer select-none w-20">
                        <div className="flex items-center gap-1">
                          Lead Age
                          <span className="text-sm">
                            <span className={sortConfig.key === "created_at" && sortConfig.direction === "asc" ? "font-bold text-blue-600" : "text-gray-400"}>
                              ↑
                            </span>
                            <span className={sortConfig.key === "created_at" && sortConfig.direction === "desc" ? "font-bold text-blue-600" : "text-gray-400"}>
                              ↓
                            </span>
                          </span>
                        </div>
                      </TableHead>

                      <TableHead onClick={() => handleSort("assigned_at")} className="cursor-pointer select-none w-40">
                        <div className="flex items-center gap-1">
                          Assigned At
                          <span className="text-sm">
                            <span className={sortConfig.key === "assigned_at" && sortConfig.direction === "asc" ? "font-bold text-blue-600" : "text-gray-400"}>
                              ↑
                            </span>
                            <span className={sortConfig.key === "assigned_at" && sortConfig.direction === "desc" ? "font-bold text-blue-600" : "text-gray-400"}>
                              ↓
                            </span>
                          </span>
                        </div>
                      </TableHead>

                      <TableHead onClick={() => handleSort("assigned_to")} className="cursor-pointer select-none">
                        <div className="flex items-center gap-1">
                          Assigned To
                          <span className="text-sm">
                            <span className={sortConfig.key === "assigned_to" && sortConfig.direction === "asc" ? "font-bold text-blue-600" : "text-gray-400"}>
                              ↑
                            </span>
                            <span className={sortConfig.key === "assigned_to" && sortConfig.direction === "desc" ? "font-bold text-blue-600" : "text-gray-400"}>
                              ↓
                            </span>
                          </span>
                        </div>
                      </TableHead>
                      <TableHead>Re-assign</TableHead>
                      <TableHead>Stage</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {sortedLeads.map((lead, idx) => (
                      <TableRow key={lead.id}>
                        <TableCell>{idx + 1}</TableCell>
                        <TableCell>{lead.business_id}</TableCell>
                        {/* <TableCell>{lead.client_name}</TableCell> */}
                        <TableCell
                          className="font-medium max-w-[150px] break-words whitespace-normal cursor-pointer text-blue-600 hover:underline"
                          onClick={() => window.open(`/leads/${lead.business_id}`, "_blank")}
                        >
                          {lead.client_name}
                        </TableCell>
                        <TableCell className="w-32 truncate">{lead.email}</TableCell>
                        <TableCell>{lead.phone}</TableCell>

                        <TableCell className="w-40">
                          {lead.created_at ? dayjs(lead.created_at).format("DD MMM YYYY") : "N/A"}
                        </TableCell>

                        <TableCell>
                          {lead.created_at ? `${dayjs().diff(dayjs(lead.created_at), "day")} days` : "N/A"}
                        </TableCell>

                        <TableCell className="w-40">
                          {lead.assigned_at ? dayjs(lead.assigned_at).format("DD MMM YYYY") : "N/A"}
                        </TableCell>

                        <TableCell >{lead.assigned_to}</TableCell>

                       <TableCell>
  <Select
  value={lead.assigned_to || ""}
  onValueChange={(selectedName) => {
    const selectedUser = salesUsers.find(user => user.full_name === selectedName);
    const selectedEmail = selectedUser ? selectedUser.user_email : ""; // Get the email from the selected user
    handleUpdateAssignedTo(lead.id, selectedName, selectedEmail); // Pass both name and email
  }}
>
  <SelectTrigger className="w-52">
    <SelectValue placeholder="Assign to..." />
  </SelectTrigger>

  <SelectContent>
    {salesUsers.map((user) => (
      <SelectItem key={user.full_name} value={user.full_name}>
        {user.full_name}{" "}
        <span className="text-gray-500 text-xs">({user.user_email})</span>
      </SelectItem>
    ))}
  </SelectContent>
</Select>

</TableCell>



                        <TableCell className="flex items-center gap-4">
                          <Select
                            value={lead.current_stage}
                            onValueChange={(value: SalesStage) => handleStageUpdate(lead.id, value)}
                          >
                            <SelectTrigger
                              className={`w-40 ${lead.current_stage === "sale done"
                                  ? "pointer-events-none opacity-100 text-black bg-gray-100 border border-gray-300 cursor-not-allowed"
                                  : ""
                                }`}
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {salesStages
                                .filter((stage) => lead.current_stage === "Prospect" || stage !== "Prospect")
                                .map((stage) => (
                                  <SelectItem key={stage} value={stage}>
                                    <Badge className={getStageColor(stage)}>{stage}</Badge>
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                                                  {lead.current_stage === "sale done" && (
                          
                            <Button
  size="icon"
  variant="outline"
  onClick={() =>
    window.open(`/SaleUpdate/${lead.business_id}?mode=edit`, "_blank")
  }
  title="Edit sale close"
>
  <EditIcon className="h-5 w-5" />
</Button>


                          )}

                        </TableCell>



                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={async () => {
                              const callHistory = await fetchCallHistory(lead.id);
                              setSelectedLead({ ...lead, call_history: callHistory });
                              setHistoryDialogOpen(true);
                            }}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <div className="flex items-center justify-between py-4">

  <div className="text-sm text-gray-600">
    Page {page} of {Math.ceil(totalRecords / pageSize)}
  </div>

  <div className="flex gap-2">
    <Button
      variant="outline"
      disabled={page === 1}
      onClick={() => setPage((p) => p - 1)}
    >
      Previous
    </Button>

    <Button
      variant="outline"
      disabled={page === Math.ceil(totalRecords / pageSize)}
      onClick={() => setPage((p) => p + 1)}
    >
      Next
    </Button>
  </div>
</div>

              </div>
            </CardContent>
          </Card>


          {/* History Dialog */}
          <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen} >
            {/* <DialogContent className="max-w-2xl"> */}
            <DialogContent className="max-w-5xl" onPointerDownOutside={(e) => e.preventDefault()}>

              <DialogHeader>
                <DialogTitle>{selectedLead?.client_name} - Call History</DialogTitle>
                <DialogDescription>Complete call history</DialogDescription>
              </DialogHeader>

              {selectedLead && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label>Email</Label><p>{selectedLead.email}</p></div>
                    <div><Label>Phone</Label><p>{selectedLead.phone}</p></div>
                    <div><Label>Assigned To</Label><p>{selectedLead.assigned_to}</p></div>
                    <div><Label>Current Stage</Label><Badge className={getStageColor(selectedLead.current_stage)}>{selectedLead.current_stage}</Badge></div>
                  </div>

                  <div>
                    <Label>Call History</Label>
                    <div className="space-y-3 max-h-64 overflow-y-auto">

                      {selectedLead.call_history.map((call, index) => {
                        const isLatest = index === 0;
                        return (
                          <div key={index} className="p-3 bg-gray-50 rounded-lg space-y-1">
                            <div className="flex justify-between items-center mb-1">
                              <Badge className={getStageColor(call.stage)}>{call.stage}</Badge>
                              <span className="text-xs text-gray-500">{call.date}</span>
                            </div>

                            {/* ✏️ Editable note for latest only */}
                            {isLatest && editingNote ? (
                              <div className="space-y-2">
                                <Textarea
                                  value={editedNote}
                                  onChange={(e) => setEditedNote(e.target.value)}
                                />
                                <Button size="sm" onClick={() => handleUpdateNote(call)}>
                                  Save
                                </Button>
                              </div>
                            ) : (
                              <div className="flex justify-between">
                                <p className="text-sm text-gray-600">{call.notes}</p>
                                {isLatest && (
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-5 w-5 text-lg text-gray-500"
                                    onClick={() => {
                                      setEditingNote(true);
                                      setEditedNote(call.notes);
                                    }}
                                  >
                                    Edit
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}

                    </div>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          <Dialog open={followUpDialogOpen} onOpenChange={handleFollowUpDialogClose}>
            <DialogContent onPointerDownOutside={(e) => e.preventDefault()}>

              <DialogHeader><DialogTitle>Schedule Follow-up</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Follow-up Date</Label>
                  <Input type="date" value={followUpData.follow_up_date} onChange={(e) =>
                    setFollowUpData((prev) => ({ ...prev, follow_up_date: e.target.value }))} />
                </div>
                <div>
                  <Label>Notes</Label>
                  <Textarea placeholder="Add notes..." value={followUpData.notes} onChange={(e) =>
                    setFollowUpData((prev) => ({ ...prev, notes: e.target.value }))} />
                </div>
              </div>
              <DialogFooter><Button onClick={handleFollowUpSubmit}>Save Follow-up</Button></DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={onboardDialogOpen} onOpenChange={setOnboardDialogOpen}>
            <DialogContent className="max-w-5xl" onPointerDownOutside={(e) => e.preventDefault()}>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  🧾 Onboard New Client
                </DialogTitle>
              </DialogHeader>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Client Details */}
                <div className="border rounded-md p-4 space-y-3">
                  <Label className="font-semibold">Client Details <span className="text-red-500">*</span></Label>
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
                    placeholder="Contact Number with country code"
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
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
                  <Label className="font-semibold">Subscription & Payment Info <span className="text-red-500">*</span></Label>
                  <Select value={paymentMode} onValueChange={setPaymentMode}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Payment Mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UPI">UPI</SelectItem>
                      <SelectItem value="PayPal">PayPal</SelectItem>
                      <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                      <SelectItem value="Credit/Debit Card">Credit/Debit Card</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={subscriptionCycle} onValueChange={setSubscriptionCycle}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Subscription Duration" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">No applications subscription</SelectItem>
                      <SelectItem value="15">15 Days</SelectItem>
                      <SelectItem value="30">1 Month</SelectItem>
                      <SelectItem value="60">2 Months</SelectItem>
                      <SelectItem value="90">3 Months</SelectItem>
                    </SelectContent>
                  </Select>

                  <Input
                    placeholder="Subscription Sale Value ($)"
                    value={subscriptionSaleValue}
                    onChange={(e) => setSubscriptionSaleValue(e.target.value)}
                  />

                  <Input
                    placeholder="Auto Total (Subscription Only)"
                    value={autoTotal}
                    disabled
                  />

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
              </div>

              {/* Add-on Services */}
              <div className="border rounded-md p-4 mt-4 space-y-3">
                <Label className="font-semibold">Optional Add-On Services</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    placeholder="Resume Sale Value ($)"
                    value={resumeValue}
                    onChange={(e) => setResumeValue(e.target.value)}
                  />

                  <Input
                    placeholder="Portfolio Creation Value ($)"
                    value={portfolioValue}
                    onChange={(e) => setPortfolioValue(e.target.value)}
                  />

                  <Input
                    placeholder="LinkedIn Optimization Value ($)"
                    value={linkedinValue}
                    onChange={(e) => setLinkedinValue(e.target.value)}
                  />

                  <Input
                    placeholder="GitHub Optimization Value ($)"
                    value={githubValue}
                    onChange={(e) => setGithubValue(e.target.value)}
                  />

                </div>
              </div>

              <div className="border rounded-md p-4 mt-4">
                <Label className="font-semibold">Auto Calculated</Label>
                <div className="flex justify-between mt-2">
                 
                  <p>Total Sale Value: <strong>${totalSale}</strong></p>
                  <p>Next Payment Due Date: <strong>{nextDueDate}</strong></p>

                </div>
              </div>

              {/* Submit */}
              <DialogFooter className="pt-4">
                <Button
                  className="bg-green-600 text-white hover:bg-green-700"
                  onClick={handleOnboardClientSubmit}
                >
                  Submit
                </Button>

              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </DashboardLayout>


    </ProtectedRoute>
  );
}



