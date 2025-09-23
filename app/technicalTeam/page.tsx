
// "use client";
// import Link from "next/link";

// import { useEffect, useState } from "react";
// import { useRouter } from "next/navigation";
// import { supabase } from "@/utils/supabase/client";
// import Papa from "papaparse";
// import * as XLSX from "xlsx";



// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@/components/ui/table";
// import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
// import { Button } from "@/components/ui/button";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { Input } from "@/components/ui/input";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogFooter,
// } from "@/components/ui/dialog";

// import ProtectedRoute from "@/components/auth/ProtectedRoute";
// import { DashboardLayout } from "@/components/layout/dashboard-layout";
// import { useAuth } from "@/components/providers/auth-provider";

// /* =========================
//    Types & Constants
//    ========================= */

// type FinanceStatus = "Paid" | "Unpaid" | "Paused" | "Closed" | "Got Placed";

// type ResumeStatus =
//   | "not_started"
//   | "pending"
//   | "waiting_client_approval"
//   | "completed";

// const STATUS_LABEL: Record<ResumeStatus, string> = {
//   not_started: "Not started",
//   pending: "Pending",
//   waiting_client_approval: "Waiting for client approval",
//   completed: "Completed",
// };

// /** NEW: Portfolio status is now separate in portfolio_progress */
// type PortfolioStatus =
//   | "not_started"
//   | "pending"
//   | "waiting_client_approval"
//   | "success";

// const PORTFOLIO_STATUS_LABEL: Record<PortfolioStatus, string> = {
//   not_started: "Not started",
//   pending: "Pending",
//   waiting_client_approval: "Waiting for Client approval",
//   success: "Success",
// };

// const PORTFOLIO_STATUS_OPTIONS: PortfolioStatus[] = [
//   "not_started",
//   "pending",
//   "waiting_client_approval",
//   "success",
// ];

// interface SalesClosure {
//   id: string;
//   lead_id: string; // text in DB
//   email: string;
//   finance_status: FinanceStatus;
//   closed_at: string | null;
//   portfolio_sale_value?: number | null;
//   github_sale_value?: number | null;

//   // legacy fields on sales_closure (we are NOT using these for portfolio assignee anymore)
//   associates_email?: string | null;
//   associates_name?: string | null;
//   associates_tl_email?: string | null;
//   associates_tl_name?: string | null;

//   // joined
//   leads?: { name: string; phone: string };

//   // resume_progress (read-only for resume build)
//   rp_status?: ResumeStatus;
//   rp_pdf_path?: string | null;

//   // portfolio_progress (authoritative for portfolio)
//   pp_status?: PortfolioStatus | null;
//   pp_link?: string | null;
//   pp_assigned_email?: string | null;
//   pp_assigned_name?: string | null;
// }

// interface TeamUser {
//   full_name: string;
//   user_email: string;
//   roles: "Technical Head" | "Technical Associate";
// }

// const PORTFOLIO_COLUMNS = [
//   "S.No",
//   "Client ID",
//   "Name",
//   "Email",
//   "Phone",
//   "Status",
//   "Resume Status",
//   "Resume PDF",
//   "Portfolio Status",
//   "Portfolio Link",
//   "Assignee",
//   "Closed At",
// ] as const;

// const GITHUB_COLUMNS = [
//     "S.No",
//   "Client ID",
//   "Name",
//   "Email",
//   "Phone",
//   "Status",
//   "GitHub Sale Value",
//   "Closed At",
// ] as const;

// /* =========================
//    Component
//    ========================= */

// export default function TechnicalTeamPage() {
//   const [loading, setLoading] = useState(true);

//   const [portfolioRows, setPortfolioRows] = useState<SalesClosure[]>([]);
//   const [githubRows, setGithubRows] = useState<SalesClosure[]>([]);
//   const [teamMembers, setTeamMembers] = useState<TeamUser[]>([]);

//   // Success dialog state (for entering portfolio link)
//   const [linkDraft, setLinkDraft] = useState<Record<string, string>>({});
//   const [linkDialogOpen, setLinkDialogOpen] = useState(false);
//   const [linkTargetLeadId, setLinkTargetLeadId] = useState<string | null>(null);
//   const [linkTargetRowId, setLinkTargetRowId] = useState<string | null>(null);

//   // CSV/XLSX import dialog state
// const [importOpen, setImportOpen] = useState(false);
// const [importFile, setImportFile] = useState<File | null>(null);
// const [parsing, setParsing] = useState(false);
// const [importing, setImporting] = useState(false);

// // parsed info
// const [rawRows, setRawRows] = useState<any[]>([]);
// const [validRowsToInsert, setValidRowsToInsert] = useState<any[]>([]);
// const [invalidRowsInfo, setInvalidRowsInfo] = useState<
//   { index: number; errors: string[] }[]
// >([]);





// // NEW: update-by-lead_id bookkeeping
// const [updatesToApply, setUpdatesToApply] = useState<
//   { lead_id: string; patch: Record<string, any> }[]
// >([]);
// const [latestIdByLead, setLatestIdByLead] = useState<Record<string, string>>({});
// const [missingLeadIds, setMissingLeadIds] = useState<string[]>([]);



//   // Controlled Assignee value per portfolio row (keyed by sales_closure.id)
//   const [assigneeByRow, setAssigneeByRow] = useState<
//     Record<string, string | undefined>
//   >({});

//   const { user } = useAuth();
//   const router = useRouter();

//   /* =========================
//      Helpers
//      ========================= */


//      // --- helpers to only add non-empty values ---
// const addIfPresent = (obj: any, key: string, value: any) => {
//   const v = value;
//   if (v === undefined || v === null) return;
//   if (typeof v === "string" && v.trim() === "") return;
//   obj[key] = v;
// };

// // Map ONE CSV row -> { lead_id, patch }  (patch only has columns that exist in the row)
// const rowToPatch = (r: any) => {
//   const patch: any = {};

//   // strings
//   addIfPresent(patch, "lead_name", pick(r, "lead_name"));
//   addIfPresent(
//     patch,
//     "company_application_email",
//     pick(r, "company_application_mail", "company_applicati_mail", "company_mail") // extra fallbacks just in case
//   );
//   addIfPresent(
//     patch,
//     "email",
//     pick(r, "persoanl_mail_id", "personal_mail_id", "personal_mailid")
//   );
//   addIfPresent(patch, "commitments", pick(r, "commitments"));
//   addIfPresent(patch, "custom_label", pick(r, "custom_add_on_name", "custom_add_on_name_"));

//   // dates
//   const closedAt = parseDateTime(pick(r, "closed_at") ?? null);
//   if (closedAt) patch.closed_at = closedAt;

//   const onboard = parseDateOnly(pick(r, "onboarded_date") ?? null);
//   if (onboard) patch.onboarded_date = onboard;

//   // ints
//   const cycle = cleanIntCycle(pick(r, "subscription_cycle") ?? null);
//   if (cycle !== null) patch.subscription_cycle = cycle;

//   // money fields
//   const saleValue = cleanMoney(pick(r, "total_amount"));
//   if (saleValue !== null) patch.sale_value = saleValue;

//   const appVal = cleanMoney(pick(r, "application_sale_value"));
//   if (appVal !== null) patch.application_sale_value = appVal;

//   const resumeVal = cleanMoney(pick(r, "resume_value"));
//   if (resumeVal !== null) patch.resume_sale_value = resumeVal;

//   const portfolioVal = cleanMoney(pick(r, "portfolio_value"));
//   if (portfolioVal !== null) patch.portfolio_sale_value = portfolioVal;

//   const linkedinVal = cleanMoney(pick(r, "linkedin_value"));
//   if (linkedinVal !== null) patch.linkedin_sale_value = linkedinVal;

//   const githubVal = cleanMoney(pick(r, "github_value"));
//   if (githubVal !== null) patch.github_sale_value = githubVal;

//   const coursesVal = cleanMoney(pick(r, "courses_value"));
//   if (coursesVal !== null) patch.courses_sale_value = coursesVal;

//   const addonsVal = cleanMoney(pick(r, "addons_value"));
//   if (addonsVal !== null) patch.custom_sale_value = addonsVal;

//   // associates
//   addIfPresent(patch, "associates_tl_email", pick(r, "associate_tl_email"));
//   addIfPresent(patch, "associates_tl_name", pick(r, "associate_tl_name"));
//   addIfPresent(patch, "associates_email", pick(r, "associate_email"));
//   addIfPresent(patch, "associates_name", pick(r, "associate_name"));

//   return patch;
// };


// const buildUpdatesFromRows = (rows: any[]) => {
//   const items: { lead_id: string; patch: Record<string, any> }[] = [];
//   const invalids: { index: number; errors: string[] }[] = [];

//   rows.forEach((r, i) => {
//     // after transformHeader, the key is guaranteed as 'lead_id' (no BOM, no spaces)
//     const rawLead = r.lead_id ?? r.leadid ?? r.lead_i_d;
//     const lead_id = rawLead ? String(rawLead).trim() : "";

//     if (!lead_id) {
//       invalids.push({ index: i + 1, errors: ["lead_id missing"] });
//       return;
//     }

//     const patch = rowToPatch(r);
//     if (!patch || Object.keys(patch).length === 0) {
//       invalids.push({ index: i + 1, errors: ["no recognized columns to update"] });
//       return;
//     }

//     items.push({ lead_id, patch });
//   });

//   return { items, invalids };
// };

// // Prefetch LATEST row-id (by closed_at) per lead_id from DB to avoid N fetches
// const prefetchLatestIds = async (leadIds: string[]) => {
//   const unique = Array.from(new Set(leadIds.filter(Boolean)));
//   if (!unique.length) {
//     setLatestIdByLead({});
//     setMissingLeadIds([]);
//     return;
//   }

//   const latest: Record<string, { id: string; closed_at: string | null }> = {};

//   // chunk IN(...) to be safe
//   const CHUNK = 1000;
//   for (let i = 0; i < unique.length; i += CHUNK) {
//     const slice = unique.slice(i, i + CHUNK);
//     const { data, error } = await supabase
//       .from("sales_closure")
//       .select("id, lead_id, closed_at")
//       .in("lead_id", slice);

//     if (error) {
//       console.error("prefetchLatestIds error:", error);
//       continue;
//     }
//     for (const row of data ?? []) {
//       const cur = latest[row.lead_id];
//       const curTs = cur?.closed_at ? new Date(cur.closed_at).getTime() : -Infinity;
//       const rowTs = row.closed_at ? new Date(row.closed_at).getTime() : -Infinity;
//       if (!cur || rowTs > curTs) latest[row.lead_id] = { id: row.id, closed_at: row.closed_at };
//     }
//   }

//   const idMap: Record<string, string> = {};
//   unique.forEach((lid) => {
//     if (latest[lid]) idMap[lid] = latest[lid].id;
//   });

//   setLatestIdByLead(idMap);
//   setMissingLeadIds(unique.filter((lid) => !idMap[lid]));
// };



// // const handleParseSelectedFile = async (file: File) => {
// //   setParsing(true);
// //   setRawRows([]);
// //   setValidRowsToInsert([]); // legacy (insert) – we won't use it for update, but keep clear
// //   setInvalidRowsInfo([]);
// //   setUpdatesToApply([]);
// //   setLatestIdByLead({});
// //   setMissingLeadIds([]);

// //   try {
// //     const ext = file.name.split(".").pop()?.toLowerCase();
// //     let rows: any[] = [];

// //     if (ext === "xlsx" || ext === "xls") {
// //       const buf = await file.arrayBuffer();
// //       const wb = XLSX.read(buf, { type: "array" });
// //       const ws = wb.Sheets[wb.SheetNames[0]];
// //       const csv = XLSX.utils.sheet_to_csv(ws, { blankrows: false });
// //       rows = await parseCsvString(csv);
// //     } else {
// //       const text = await file.text();
// //       rows = await parseCsvString(text);
// //     }

// //     setRawRows(rows);

// //     // Build updates (by lead_id)
// //     const { items, invalids } = buildUpdatesFromRows(rows);
// //     setUpdatesToApply(items);
// //     setInvalidRowsInfo(invalids);

// //     // Prefetch latest ids for these lead_ids so the dialog can show match counts
// //     await prefetchLatestIds(items.map((i) => i.lead_id));
// //   } catch (e: any) {
// //     alert(e?.message || "Failed to parse the selected file");
// //   } finally {
// //     setParsing(false);
// //   }
// // };



// // const handleParseSelectedFile = async (file: File) => {
// //   setParsing(true);
// //   setRawRows([]);
// //   setValidRowsToInsert([]); // legacy (insert) – we won't use it for update, but keep clear
// //   setInvalidRowsInfo([]);
// //   setUpdatesToApply([]);
// //   setLatestIdByLead({});
// //   setMissingLeadIds([]);

// //   try {
// //     const ext = file.name.split(".").pop()?.toLowerCase();
// //     let rows: any[] = [];

// //     if (ext === "xlsx" || ext === "xls") {
// //       const buf = await file.arrayBuffer();
// //       const wb = XLSX.read(buf, { type: "array" });
// //       const ws = wb.Sheets[wb.SheetNames[0]];
// //       const csv = XLSX.utils.sheet_to_csv(ws, { blankrows: false });
// //       rows = await parseCsvString(csv);
// //     } else {
// //       const text = await file.text();
// //       rows = await parseCsvString(text);
// //     }

// //     setRawRows(rows);

// //     // Build updates (by lead_id)
// //     const { items, invalids } = buildUpdatesFromRows(rows);
// //     setUpdatesToApply(items);
// //     setInvalidRowsInfo(invalids);

// //     // Prefetch latest ids for these lead_ids so the dialog can show match counts
// //     await prefetchLatestIds(items.map((i) => i.lead_id));
// //   } catch (e: any) {
// //     alert(e?.message || "Failed to parse the selected file");
// //   } finally {
// //     setParsing(false);
// //   }
// // };



// const handleUpdateSubmitByLeadId = async () => {
//   if (!updatesToApply.length) {
//     alert("No valid rows to update.");
//     return;
//   }

//   setImporting(true);
//   let updated = 0;
//   let failed = 0;

//   try {
//     // Perform individual updates (each row has a different patch)
//     for (const item of updatesToApply) {
//       const rowId = latestIdByLead[item.lead_id];
//       if (!rowId) continue; // unmatched – reported separately

//       const { error } = await supabase
//         .from("sales_closure")
//         .update(item.patch)
//         .eq("id", rowId);

//       if (error) {
//         failed++;
//         console.error("Update failed for", item.lead_id, error);
//       } else {
//         updated++;
//       }
//     }

//     await fetchData();

//     alert(
//       `Update complete.\nUpdated: ${updated}\nUnmatched lead_ids (no row in DB): ${missingLeadIds.length}\nFailed: ${failed}`
//     );

//     // reset dialog state
//     setImportOpen(false);
//     setImportFile(null);
//     setRawRows([]);
//     setUpdatesToApply([]);
//     setInvalidRowsInfo([]);
//     setLatestIdByLead({});
//     setMissingLeadIds([]);
//   } catch (e: any) {
//     alert(e?.message || "Bulk update failed");
//   } finally {
//     setImporting(false);
//   }
// };


//      // money like "1,00,000" or "₹20,000" → number | null
// const cleanMoney = (v: any): number | null => {
//   if (v === null || v === undefined || v === "") return null;
//   const s = String(v).replace(/[,\s₹]/g, "");
//   const n = parseFloat(s);
//   return Number.isFinite(n) ? n : null;
// };

// // 15/30/60/90 only
// const cleanIntCycle = (v: any): number | null => {
//   if (v === null || v === undefined || v === "") return null;
//   const n = parseInt(String(v).replace(/\D/g, ""), 10);
//   return [15, 30, 60, 90].includes(n) ? n : null;
// };

// // Parse date/time (supports dd/mm/yyyy, iso, and Excel serials)
// const parseDateTime = (v: any): string | null => {
//   if (v === null || v === undefined || v === "") return null;

//   // Excel serial number
//   if (typeof v === "number") {
//     const d = XLSX.SSF.parse_date_code(v);
//     if (d) {
//       const dt = new Date(Date.UTC(d.y, d.m - 1, d.d));
//       return dt.toISOString();
//     }
//   }

//   const s = String(v).trim();

//   // dd/mm/yyyy
//   if (/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(s)) {
//     const [d, m, y] = s.split("/").map(Number);
//     const yyyy = y < 100 ? 2000 + y : y;
//     const dt = new Date(yyyy, m - 1, d);
//     return isNaN(dt.getTime()) ? null : dt.toISOString();
//   }

//   // try native
//   const dt = new Date(s);
//   return isNaN(dt.getTime()) ? null : dt.toISOString();
// };

// // Date-only (YYYY-MM-DD)
// const parseDateOnly = (v: any): string | null => {
//   const iso = parseDateTime(v);
//   return iso ? iso.slice(0, 10) : null;
// };

// // Map one CSV row → object for sales_closure insert + validation fields
// const rowToInsert = (r: any) => {
//   // allow for spelling/case variants found in your headings
//   const lead_id =
//     (r.lead_id ?? r["Lead_id"] ?? r["lead id"] ?? r["Lead ID"])?.toString().trim();

//   const sale_value = cleanMoney(
//     r.total_amount ?? r.Total_amount ?? r["Total Amount"]
//   );

//   const subscription_cycle = cleanIntCycle(
//     r.subscription_cycle ?? r.Subscription_cycle
//   );

//   const email = (
//     r.persoanl_mail_id ??
//     r.personal_mail_id ??
//     r.Persoanl_mail_id ??
//     r["Personal_mail_id"] ??
//     r.company_application_mail ??
//     r.Company_application_mail
//   )?.toString().trim();

//   const record: any = {
//     // required
//     lead_id,
//     sale_value,
//     subscription_cycle,
//     payment_mode: "UPI",
//     email,

//     // optional / mapped
//     closed_at: parseDateTime(r.closed_at ?? r.Closed_at),
//     finance_status: "Paid", // leave default or set explicitly

//     lead_name: r.lead_name ?? r.Lead_name ?? null,

//     company_application_email:
//       r.company_application_mail ?? r.Company_application_mail ?? null,

//     application_sale_value: cleanMoney(
//       r.application_sale_value ?? r.Application_sale_value
//     ),
//     resume_sale_value: cleanMoney(r.resume_value ?? r.Resume_value),
//     portfolio_sale_value: cleanMoney(r.portfolio_value ?? r.Portfolio_value),
//     linkedin_sale_value: cleanMoney(r.linkedin_value ?? r.LinkedIn_value),
//     github_sale_value: cleanMoney(r.github_value ?? r.GitHub_value),
//     courses_sale_value: cleanMoney(r.courses_value ?? r.Courses_value),

//     custom_label:
//       r.custom_add_on_name ??
//       r["Custom Add-on_name"] ??
//       r["Custom Add-on Name"] ??
//       null,
//     custom_sale_value: cleanMoney(r.addons_value ?? r.Addons_value),

//     onboarded_date: parseDateOnly(r.onboarded_date ?? r.Onboarded_date),

//     associates_tl_email: r.associate_tl_email ?? "",
//     associates_tl_name: r.associate_tl_name ?? "",
//     associates_email: r.associate_email ?? "",
//     associates_name: r.associate_name ?? "",

//     commitments: r.commitments ?? null,
//   };

//   return { lead_id, sale_value, subscription_cycle, email, record };
// };

// const validateAndBuild = (rows: any[]) => {
//   const valids: any[] = [];
//   const invalids: { index: number; errors: string[] }[] = [];

//   rows.forEach((r, i) => {
//     const { lead_id, sale_value, subscription_cycle, email, record } = rowToInsert(r);
//     const errors: string[] = [];
//     if (!lead_id) errors.push("lead_id missing");
//     if (sale_value === null) errors.push("Total_amount (sale_value) missing/invalid");
//     if (subscription_cycle === null)
//       errors.push("subscription_cycle invalid (must be 15/30/60/90)");
//     if (!email) errors.push("email missing");

//     if (errors.length) invalids.push({ index: i + 1, errors });
//     else valids.push(record);
//   });

//   return { valids, invalids };
// };

// // Parse a CSV string with Papa
// // const parseCsvString = (csv: string) =>
// //   new Promise<any[]>((resolve, reject) => {
// //     Papa.parse(csv, {
// //       header: true,
// //       skipEmptyLines: true,
// //       complete: (res) => resolve(res.data as any[]),
// //       error: (err: any) => reject(err),
// //     });
// //   });

// // Normalize a header: strip BOM/space, lower-case, non-alnum -> _
// const normHeader = (h: string) =>
//   String(h || "")
//     .replace(/\uFEFF/g, "")       // remove BOM
//     .trim()
//     .toLowerCase()
//     .replace(/[^a-z0-9]+/g, "_")  // spaces, dashes -> _
//     .replace(/^_|_$/g, "");       // trim leading/trailing _

// const parseCsvString = (csv: string) =>
//   new Promise<any[]>((resolve, reject) => {
//     Papa.parse(csv, {
//       header: true,
//       skipEmptyLines: true,
//       transformHeader: normHeader, // 👈 normalize headers
//       complete: (res) => resolve(res.data as any[]),
//       error: (err: any) => reject(err),
//     });
//   });

//   // return first present, non-empty value among keys (keys are expected to be normalized)
// const pick = (row: any, ...keys: string[]) => {
//   for (const k of keys) {
//     if (row[k] !== undefined && row[k] !== null) {
//       const v = typeof row[k] === "string" ? row[k].trim() : row[k];
//       if (v !== "") return v;
//     }
//   }
//   return undefined;
// };



// // Handle file → rows
// const handleParseSelectedFile = async (file: File) => {
//   setParsing(true);
//   setRawRows([]);
//   setValidRowsToInsert([]);
//   setInvalidRowsInfo([]);

//   try {
//     const ext = file.name.split(".").pop()?.toLowerCase();
//     let rows: any[] = [];

//     if (ext === "xlsx" || ext === "xls") {
//       // Read Excel → CSV (first sheet) → Papa
//       const buf = await file.arrayBuffer();
//       const wb = XLSX.read(buf, { type: "array" });
//       const ws = wb.Sheets[wb.SheetNames[0]];
//       const csv = XLSX.utils.sheet_to_csv(ws, { blankrows: false });
//       rows = await parseCsvString(csv);
//     } else {
//       // CSV
//       const text = await file.text();
//       rows = await parseCsvString(text);
//     }

//     setRawRows(rows);
//     const { valids, invalids } = validateAndBuild(rows);
//     setValidRowsToInsert(valids);
//     setInvalidRowsInfo(invalids);
//   } catch (e: any) {
//     alert(e?.message || "Failed to parse the selected file");
//   } finally {
//     setParsing(false);
//   }
// };

// // Insert into Supabase in chunks
// const handleImportSubmit = async () => {
//   if (!validRowsToInsert.length) {
//     alert("No valid rows to insert.");
//     return;
//   }
//   setImporting(true);
//   try {
//     const CHUNK = 500;
//     for (let i = 0; i < validRowsToInsert.length; i += CHUNK) {
//       const chunk = validRowsToInsert.slice(i, i + CHUNK);
//       const { error } = await supabase.from("sales_closure").insert(chunk);
//       if (error) throw error;
//     }
//     // refresh the tables
//     await fetchData();
//     alert(`Imported ${validRowsToInsert.length} records successfully.`);
//     // reset dialog state
//     setImportOpen(false);
//     setImportFile(null);
//     setRawRows([]);
//     setValidRowsToInsert([]);
//     setInvalidRowsInfo([]);
//   } catch (e: any) {
//     alert(e?.message || "Import failed");
//   } finally {
//     setImporting(false);
//   }
// };


//   const latestByLead = (rows: any[]) => {
//     const map = new Map<string, any>();
//     for (const r of rows ?? []) {
//       const ex = map.get(r.lead_id);
//       const ed = ex?.closed_at ?? "";
//       const cd = r?.closed_at ?? "";
//       if (!ex || new Date(cd) > new Date(ed)) map.set(r.lead_id, r);
//     }
//     return Array.from(map.values()).sort(
//       (a, b) =>
//         new Date(b.closed_at || "").getTime() -
//         new Date(a.closed_at || "").getTime()
//     );
//   };

//   const toNiceMoney = (v?: number | null) =>
//     typeof v === "number"
//       ? v.toLocaleString("en-IN", { maximumFractionDigits: 2 })
//       : "-";

//   /* =========================
//      Data Fetch
//      ========================= */

//   const fetchData = async () => {
//     if (!user) return;

//     // portfolio rows from sales_closure (non-null and non-zero)
//     const qPortfolio = supabase
//       .from("sales_closure")
//       .select(
//         "id, lead_id, email, finance_status, closed_at, portfolio_sale_value, github_sale_value, associates_email, associates_name, associates_tl_email, associates_tl_name"
//       )
//       .not("portfolio_sale_value", "is", null)
//       .neq("portfolio_sale_value", 0);

//     // github rows
//     const qGithub = supabase
//       .from("sales_closure")
//       .select(
//         "id, lead_id, email, finance_status, closed_at, portfolio_sale_value, github_sale_value"
//       )
//       .not("github_sale_value", "is", null)
//       .neq("github_sale_value", 0);

//     const [{ data: pData, error: pErr }, { data: gData, error: gErr }] =
//       await Promise.all([qPortfolio, qGithub]);
//     if (pErr || gErr) {
//       console.error("Failed to fetch sales data:", pErr || gErr);
//       return;
//     }

//     const pLatest = latestByLead(pData || []);
//     const gLatest = latestByLead(gData || []);
//     const allLeadIds = Array.from(
//       new Set([...pLatest, ...gLatest].map((r) => r.lead_id))
//     );

//     // leads basics
//     const { data: leadsData, error: leadsErr } = await supabase
//       .from("leads")
//       .select("business_id, name, phone")
//       .in("business_id", allLeadIds);
//     if (leadsErr) {
//       console.error("Failed to fetch leads:", leadsErr);
//       return;
//     }
//     const leadMap = new Map(
//       (leadsData ?? []).map((l) => [
//         l.business_id,
//         { name: l.name, phone: l.phone },
//       ])
//     );

//     // resume_progress (resume build only)
//     const { data: resumeProg, error: resumeErr } = await supabase
//       .from("resume_progress")
//       .select("lead_id, status, pdf_path")
//       .in("lead_id", allLeadIds);
//     if (resumeErr) {
//       console.error("Failed to fetch resume_progress:", resumeErr);
//       return;
//     }
//     const resumeMap = new Map(
//       (resumeProg ?? []).map((p) => [
//         p.lead_id,
//         { status: p.status as ResumeStatus, pdf_path: p.pdf_path ?? null },
//       ])
//     );

//     // NEW: portfolio_progress (authoritative portfolio data)
//     const { data: portfolioProg, error: portErr } = await supabase
//       .from("portfolio_progress")
//       .select("lead_id, status, link, assigned_email, assigned_name")
//       .in("lead_id", allLeadIds);
//     if (portErr) {
//       console.error("Failed to fetch portfolio_progress:", portErr);
//       return;
//     }
//     const portfolioMap = new Map(
//       (portfolioProg ?? []).map((p) => [
//         p.lead_id,
//         {
//           status: (p.status ?? "not_started") as PortfolioStatus,
//           link: p.link ?? null,
//           assigned_email: p.assigned_email ?? null,
//           assigned_name: p.assigned_name ?? null,
//         },
//       ])
//     );

//     // Merge for portfolio tab
//     const mergedPortfolio: SalesClosure[] = pLatest.map((r) => ({
//       ...r,
//       leads: leadMap.get(r.lead_id) || { name: "-", phone: "-" },

//       // resume (read-only)
//       rp_status: resumeMap.get(r.lead_id)?.status ?? "not_started",
//       rp_pdf_path: resumeMap.get(r.lead_id)?.pdf_path ?? null,

//       // portfolio (from portfolio_progress)
//       pp_status: portfolioMap.get(r.lead_id)?.status ?? "not_started",
//       pp_link: portfolioMap.get(r.lead_id)?.link ?? null,
//       pp_assigned_email: portfolioMap.get(r.lead_id)?.assigned_email ?? null,
//       pp_assigned_name: portfolioMap.get(r.lead_id)?.assigned_name ?? null,
//     }));

//     // Merge for github tab (no portfolio/resume extras)
//     const mergedGithub: SalesClosure[] = gLatest.map((r) => ({
//       ...r,
//       leads: leadMap.get(r.lead_id) || { name: "-", phone: "-" },
//     }));

//     setPortfolioRows(mergedPortfolio);
//     setGithubRows(mergedGithub);
//   };

//   const fetchTeam = async () => {
//     const { data, error } = await supabase
//       .from("profiles")
//       .select("full_name, user_email, roles")
//       .in("roles", ["Technical Head", "Technical Associate"]);
//     if (error) {
//       console.error("Failed to fetch team users:", error);
//       return;
//     }
//     const sorted = (data as TeamUser[]).sort((a, b) =>
//       a.roles === b.roles
//         ? a.full_name.localeCompare(b.full_name)
//         : a.roles.localeCompare(b.roles)
//     );
//     setTeamMembers(sorted);
//   };

//   /* =========================
//      Actions
//      ========================= */

//   // Direct download from Supabase → auto-saves to Downloads
//   const downloadResume = async (path: string) => {
//   try {
//     // lead_id is the first segment of the storage path: "<lead_id>/<timestamp>_file.pdf"
//     const segments = (path || "").split("/");
//     const leadId = segments[0] || "unknown";
//     const fileName = `Resume-${leadId}.pdf`;

//     // Get a signed URL (works for public or RLS-protected buckets)
//     const { data, error } = await supabase.storage
//       .from("resumes")
//       .createSignedUrl(path, 60 * 60); // 1 hour

//     if (error) throw error;
//     if (!data?.signedUrl) throw new Error("No signed URL");

//     // Fetch the file and trigger a client-side download with our custom filename
//     const res = await fetch(data.signedUrl);
//     if (!res.ok) throw new Error(`Download failed (${res.status})`);
//     const blob = await res.blob();
//     const objectUrl = URL.createObjectURL(blob);

//     const a = document.createElement("a");
//     a.href = objectUrl;
//     a.download = fileName; // 👈 force name = resume-<lead_id>.pdf
//     document.body.appendChild(a);
//     a.click();
//     a.remove();
//     URL.revokeObjectURL(objectUrl);
//   } catch (e: any) {
//     alert(e?.message || "Could not download PDF");
//   }
// };


//   // Update portfolio status (non-success) OR open dialog for success
//   const handlePortfolioStatusChange = async (
//     sale: SalesClosure,
//     next: PortfolioStatus
//   ) => {
//     if (next === "success") {
//       setLinkTargetLeadId(sale.lead_id);
//       setLinkTargetRowId(sale.id);
//       setLinkDraft((d) => ({ ...d, [sale.lead_id]: sale.pp_link ?? "" }));
//       setLinkDialogOpen(true);
//       return;
//     }

//     const { error } = await supabase
//       .from("portfolio_progress")
//       .upsert(
//         {
//           lead_id: sale.lead_id,
//           status: next,
//           updated_by: user?.email ?? null,
//         },
//         { onConflict: "lead_id" }
//       );
//     if (error) return alert(error.message);

//     setPortfolioRows((prev) =>
//       prev.map((r) =>
//         r.id === sale.id ? { ...r, pp_status: next, pp_link: null } : r
//       )
//     );
//   };

//   // Save success link
//   const handleSavePortfolioSuccess = async () => {
//     const link = linkTargetLeadId
//       ? (linkDraft[linkTargetLeadId] ?? "").trim()
//       : "";
//     if (!link || !linkTargetLeadId || !linkTargetRowId)
//       return alert("Please paste a link.");
//     if (!/^https?:\/\//i.test(link))
//       return alert("Enter a valid http(s) URL.");

//     const { error } = await supabase
//       .from("portfolio_progress")
//       .upsert(
//         {
//           lead_id: linkTargetLeadId,
//           status: "success",
//           link,
//           updated_by: user?.email ?? null, // if you switch to UUID, write user?.id here and change DB type
//         },
//         { onConflict: "lead_id" }
//       );
//     if (error) return alert(error.message);

//     setPortfolioRows((prev) =>
//       prev.map((r) =>
//         r.id === linkTargetRowId
//           ? { ...r, pp_status: "success", pp_link: link }
//           : r
//       )
//     );
//     setLinkDialogOpen(false);
//     setLinkDraft({});
//     setLinkTargetLeadId(null);
//     setLinkTargetRowId(null);
//   };

//   // Assign portfolio owner (stored in portfolio_progress)
//   const handleAssignPortfolio = async (
//     sale: SalesClosure,
//     memberEmail: string
//   ) => {
//     // optimistic UI
//     setAssigneeByRow((p) => ({ ...p, [sale.id]: memberEmail }));

//     const member = teamMembers.find((m) => m.user_email === memberEmail);
//     if (!member) return;

//     const { error } = await supabase
//       .from("portfolio_progress")
//       .upsert(
//         {
//           lead_id: sale.lead_id,
//           assigned_email: member.user_email,
//           assigned_name: member.full_name,
//           updated_by: user?.email ?? null,
//         },
//         { onConflict: "lead_id" }
//       );

//     if (error) {
//       alert(error.message || "Failed to assign portfolio owner");
//       setAssigneeByRow((p) => ({
//         ...p,
//         [sale.id]: sale.pp_assigned_email ?? undefined,
//       }));
//       return;
//     }

//     setPortfolioRows((prev) =>
//       prev.map((r) =>
//         r.id === sale.id
//           ? {
//               ...r,
//               pp_assigned_email: member.user_email,
//               pp_assigned_name: member.full_name,
//             }
//           : r
//       )
//     );
//   };

//   /* =========================
//      Effects
//      ========================= */

//   // Role gate
//   useEffect(() => {
//     if (user === null) return;
//     // console.log(user.name, user.role);
//     const allowed = [
//       "Super Admin",
//       "Technical Head",
//       "Technical Associate",
//     ] as const;
//     if (!user || !allowed.includes(user.role as any)) {
//       router.push("/unauthorized");
//       return;
//     }
//     setLoading(false);
//   }, [user, router]);

//   // Initial data load
//   useEffect(() => {
//     if (user) {
//       fetchData();
//       fetchTeam();
//     }
//   }, [user]);

//   // Seed/stick controlled Assignee values from portfolio_progress
//   useEffect(() => {
//     setAssigneeByRow((prev) => {
//       const next = { ...prev };
//       for (const r of portfolioRows) {
//         const current = r.pp_assigned_email ?? undefined;
//         if (next[r.id] === undefined) next[r.id] = current;
//       }
//       return next;
//     });
//   }, [portfolioRows, teamMembers]);

//   /* =========================
//      Renderers
//      ========================= */

//   const renderPortfolioTable = (rows: SalesClosure[]) => (
//     <div className="rounded-md border mt-4">
//       <Table>
//         <TableHeader>
//           <TableRow>
//             {PORTFOLIO_COLUMNS.map((c) => (
//               <TableHead key={c}>{c}</TableHead>
//             ))}
//           </TableRow>
//         </TableHeader>
//         <TableBody>
//           {rows.map((sale, index) => (
//             <TableRow key={sale.id}>
//               <TableCell>{index+1}</TableCell>
//               <TableCell>{sale.lead_id}</TableCell>

//               <TableCell
//                                 className="font-medium max-w-[150px] break-words whitespace-normal cursor-pointer text-blue-600 hover:underline"
//                                 onClick={() => window.open(`/leads/${sale.lead_id}`, "_blank")}
//                               >
//                                 {sale.leads?.name || "-"}
//                               </TableCell>

//               {/* <TableCell>{sale.leads?.name || "-"}</TableCell> */}
//               <TableCell>{sale.email}</TableCell>
//               <TableCell>{sale.leads?.phone || "-"}</TableCell>
//               <TableCell>{sale.finance_status}</TableCell>

//               {/* Resume Status (read-only) */}
//               <TableCell>
//                 {STATUS_LABEL[(sale.rp_status ?? "not_started") as ResumeStatus]}
//               </TableCell>

//               {/* Resume PDF */}
//               <TableCell>
//                 {sale.rp_pdf_path ? (
//                   <Button
//                     variant="outline"
//                     size="sm"
//                     onClick={() => downloadResume(sale.rp_pdf_path!)}
//                   >
//                     Download Resume
//                   </Button>
//                 ) : (
//                   <span className="text-gray-400 text-sm">—</span>
//                 )}
//               </TableCell>

//               {/* Portfolio Status (from portfolio_progress) */}
//               <TableCell className="space-y-2">
//                 {sale.pp_status === "success" && sale.pp_link ? (
//                   <a
//                     href={sale.pp_link}
//                     target="_blank"
//                     rel="noreferrer"
//                     className="text-blue-600 underline break-all"
//                     title="Open portfolio link"
//                   >
//                     {sale.pp_link}
//                   </a>
//                 ) : (
//                   <Select
//                     onValueChange={(v) =>
//                       handlePortfolioStatusChange(sale, v as PortfolioStatus)
//                     }
//                     value={(sale.pp_status ?? "not_started") as PortfolioStatus}
//                   >
//                     <SelectTrigger className="w-[260px]">
//                       <SelectValue placeholder="Set portfolio status" />
//                     </SelectTrigger>
//                     <SelectContent>
//                       {PORTFOLIO_STATUS_OPTIONS.map((s) => (
//                         <SelectItem key={s} value={s}>
//                           {PORTFOLIO_STATUS_LABEL[s]}
//                         </SelectItem>
//                       ))}
//                     </SelectContent>
//                   </Select>
//                 )}
//               </TableCell>
//              <TableCell className="max-w-[220px] truncate">
//   {sale.leads?.name && (
//     <a
//       href={`https://${sale.leads?.name
//         .toLowerCase()
//         .replace(/[^a-z0-9]/g, "")}-applywizz.vercel.app/`}
//       target="_blank"
//       rel="noreferrer"
//       className="text-blue-600 underline block truncate"
//       title={`https://${sale.leads?.name
//         .toLowerCase()
//         .replace(/[^a-z0-9]/g, "")}-applywizz.vercel.app/`} // tooltip shows full URL
//     >
//       https://{sale.leads?.name
//         .toLowerCase()
//         .replace(/[^a-z0-9]/g, "")}-applywizz.vercel.app/
//     </a>
//   )}
// </TableCell>



//               {/* Assignee (stored in portfolio_progress) */}
//               <TableCell>
//                 {(() => {
//                   const current =
//                     assigneeByRow[sale.id] ?? sale.pp_assigned_email ?? "";
//                   const inList = !!teamMembers.find(
//                     (m) => m.user_email === current
//                   );

//                   return (
//                     <Select
//                       value={current || undefined}
//                       onValueChange={(email) =>
//                         handleAssignPortfolio(sale, email)
//                       }
//                    disabled={user?.role =="Technical Associate"} >
//                       <SelectTrigger className="w-[240px] !opacity-100 bg-muted/20 text-foreground">
//                         <SelectValue placeholder="Assign to..." />
//                       </SelectTrigger>
//                       <SelectContent>
//                         {/* fallback so Select can show current even if not in the list */}
//                         {!inList && current && (
//                           <SelectItem value={current} className="hidden">
//                             {sale.pp_assigned_name || current}
//                           </SelectItem>
//                         )}

//                         <div className="px-2 py-1 text-xs text-muted-foreground">
//                           Technical Heads
//                         </div>
//                         {teamMembers
//                           .filter((m) => m.roles === "Technical Head")
//                           .map((m) => (
//                             <SelectItem key={m.user_email} value={m.user_email}>
//                               {m.full_name} • Head
//                             </SelectItem>
//                           ))}

//                         <div className="px-2 py-1 text-xs text-muted-foreground">
//                           Technical Associates
//                         </div>
//                         {teamMembers
//                           .filter((m) => m.roles === "Technical Associate")
//                           .map((m) => (
//                             <SelectItem key={m.user_email} value={m.user_email}>
//                               {m.full_name} • Associate
//                             </SelectItem>
//                           ))}
//                       </SelectContent>
//                     </Select>
//                   );
//                 })()}
//               </TableCell>

//               <TableCell>
//                 {sale.closed_at
//                   ? new Date(sale.closed_at).toLocaleDateString("en-GB")
//                   : "-"}
//               </TableCell>
//             </TableRow>
//           ))}
//           {rows.length === 0 && (
//             <TableRow>
//               <TableCell
//                 colSpan={PORTFOLIO_COLUMNS.length}
//                 className="text-center text-sm text-muted-foreground py-10"
//               >
//                 No records found.
//               </TableCell>
//             </TableRow>
//           )}
//         </TableBody>
//       </Table>
//     </div>
//   );

//   const renderGithubTable = (rows: SalesClosure[]) => (
//     <div className="rounded-md border mt-4">
//       <Table>
//         <TableHeader>
//           <TableRow>
//             {GITHUB_COLUMNS.map((c) => (
//               <TableHead key={c}>{c}</TableHead>
//             ))}
//           </TableRow>
//         </TableHeader>
//         <TableBody>
//           {rows.map((sale, index) => (
//             <TableRow key={sale.id}>
//               <TableCell>{index+1}</TableCell>
//               <TableCell>{sale.lead_id}</TableCell>
//               {/* <TableCell>{sale.leads?.name || "-"}</TableCell> */}

//               <TableCell
//                                 className="font-medium max-w-[150px] break-words whitespace-normal cursor-pointer text-blue-600 hover:underline"
//                                 onClick={() => window.open(`/leads/${sale.lead_id}`, "_blank")}
//                               >
//                                 {sale.leads?.name || "-"}
//                               </TableCell>

//               <TableCell>{sale.email}</TableCell>
//               <TableCell>{sale.leads?.phone || "-"}</TableCell>
//               <TableCell>{sale.finance_status}</TableCell>
//               <TableCell>{toNiceMoney(sale.github_sale_value)}</TableCell>
//               <TableCell>
//                 {sale.closed_at
//                   ? new Date(sale.closed_at).toLocaleDateString("en-GB")
//                   : "-"}
//               </TableCell>
//             </TableRow>
//           ))}
//           {rows.length === 0 && (
//             <TableRow>
//               <TableCell
//                 colSpan={GITHUB_COLUMNS.length}
//                 className="text-center text-sm text-muted-foreground py-10"
//               >
//                 No GitHub sales found.
//               </TableCell>
//             </TableRow>
//           )}
//         </TableBody>
//       </Table>
//     </div>
//   );

//   /* =========================
//      Render
//      ========================= */

//   return (
//     <ProtectedRoute
//       allowedRoles={["Super Admin", "Technical Head", "Technical Associate"]}
//     >
//       <DashboardLayout>
//         <div className="space-y-6">
//           {/* <div className="flex items-center justify-between">
//             <h1 className="text-3xl font-bold text-gray-900">Technical Page</h1>
//           </div> */}

//           <div className="flex items-center justify-between">
//   <h1 className="text-3xl font-bold text-gray-900">Technical Page</h1>
//   <div className="flex items-center gap-2">
//     <Button onClick={() => setImportOpen(true)}>Add sale done CSV</Button>
//     <Button onClick={() => setImportOpen(true)}>Update by CSV</Button>

//   </div>
// </div>


//           {loading ? (
//             <p className="p-6 text-gray-600">Loading...</p>
//           ) : (
//             <Tabs defaultValue="portfolio" className="w-full">
//               <TabsList className="grid grid-cols-2 w-full sm:w-auto">
//                 <TabsTrigger value="portfolio">Portfolios</TabsTrigger>
//                 <TabsTrigger value="github">GitHub</TabsTrigger>
//               </TabsList>

//               <TabsContent value="portfolio">
//                 {renderPortfolioTable(portfolioRows)}
//               </TabsContent>
//               <TabsContent value="github">
//                 {renderGithubTable(githubRows)}
//               </TabsContent>
//             </Tabs>
//           )}
//         </div>

//         {/* Success dialog */}
//         <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
//           <DialogContent>
//             <DialogHeader>
//               <DialogTitle>Mark as Success</DialogTitle>
//             </DialogHeader>

//             <div className="space-y-2">
//               <label className="text-sm text-muted-foreground">
//                 Success link
//               </label>
//               <Input
//                 placeholder="https://…"
//                 value={linkTargetLeadId ? linkDraft[linkTargetLeadId] ?? "" : ""}
//                 onChange={(e) =>
//                   setLinkDraft((prev) => ({
//                     ...prev,
//                     ...(linkTargetLeadId
//                       ? { [linkTargetLeadId]: e.target.value }
//                       : {}),
//                   }))
//                 }
//               />
//               <p className="text-xs text-muted-foreground">
//                 Paste the final portfolio link. It will be saved in{" "}
//                 <code>portfolio_progress</code>.
//               </p>
//             </div>

//             <DialogFooter className="mt-4">
//               <Button variant="outline" onClick={() => setLinkDialogOpen(false)}>
//                 Cancel
//               </Button>
//               <Button onClick={handleSavePortfolioSuccess}>Save</Button>
//             </DialogFooter>
//           </DialogContent>
//         </Dialog>

//         {/* Import Sales CSV/XLSX */}
// <Dialog open={importOpen} onOpenChange={setImportOpen}>
//   <DialogContent className="sm:max-w-[600px]">
//     <DialogHeader>
//       <DialogTitle>Import Sales (CSV / XLSX)</DialogTitle>
//     </DialogHeader>

//     <div className="space-y-4">
//       <div className="space-y-2">
//         <label className="text-sm text-muted-foreground">Select file</label>
//         <Input
//           type="file"
//           accept=".csv,.xlsx,.xls"
//           onChange={(e) => {
//             const f = e.target.files?.[0] || null;
//             setImportFile(f);
//             if (f) handleParseSelectedFile(f);
//           }}
//         />
//         <p className="text-xs text-muted-foreground">
//           We’ll parse with PapaParse. Excel files are first converted to CSV (in-browser) and then parsed.
//         </p>
//       </div>

//       {parsing && <p className="text-sm">Parsing…</p>}

//       {rawRows.length > 0 && !parsing && (
//         <div className="space-y-1 text-sm">
//           <div>Total rows in file: <b>{rawRows.length}</b></div>
//           <div className="text-green-700">
//             Valid rows to insert: <b>{validRowsToInsert.length}</b>
//           </div>
//           <div className="text-amber-700">
//             Skipped (errors): <b>{invalidRowsInfo.length}</b>
//           </div>

//           {invalidRowsInfo.length > 0 && (
//             <details className="mt-2">
//               <summary className="cursor-pointer">See invalid row details</summary>
//               <ul className="list-disc pl-6 mt-2">
//                 {invalidRowsInfo.slice(0, 20).map((row, idx) => (
//                   <li key={idx}>
//                     Row {row.index}: {row.errors.join(", ")}
//                   </li>
//                 ))}
//                 {invalidRowsInfo.length > 20 && (
//                   <li>…and {invalidRowsInfo.length - 20} more</li>
//                 )}
//               </ul>
//             </details>
//           )}

//           <p className="text-xs text-muted-foreground mt-2">
//             Note: <code>payment_mode</code> is set to <b>UPI</b> for all records. Required fields:
//             <code> lead_id</code>, <code>Total_amount</code>, <code>subscription_cycle (15/30/60/90)</code>, <code>email</code>.
//           </p>
//         </div>
//       )}
//     </div>

//     <DialogFooter className="mt-4">
//       <Button variant="outline" onClick={() => setImportOpen(false)}>
//         Cancel
//       </Button>
//       <Button
//         onClick={handleImportSubmit}
//         disabled={importing || parsing || validRowsToInsert.length === 0}
//       >
//         {importing ? "Importing…" : `Submit (${validRowsToInsert.length})`}
//       </Button>
//     </DialogFooter>
//   </DialogContent>
// </Dialog>


// <Dialog open={importOpen} onOpenChange={setImportOpen}>
//   <DialogContent className="sm:max-w-[600px]">
//     <DialogHeader>
//       <DialogTitle>Update Sales (by lead_id) — CSV / XLSX</DialogTitle>
//     </DialogHeader>

//     <div className="space-y-4">
//       <div className="space-y-2">
//         <label className="text-sm text-muted-foreground">Select file</label>
//         <Input
//           type="file"
//           accept=".csv,.xlsx,.xls"
//           onChange={(e) => {
//             const f = e.target.files?.[0] || null;
//             setImportFile(f);
//             if (f) handleParseSelectedFile(f);
//           }}
//         />
//         <p className="text-xs text-muted-foreground">
//           Excel files are converted to CSV in-browser, then parsed with PapaParse.
//           Only the columns present in your file will be updated. Everything else stays unchanged.
//         </p>
//       </div>

//       {parsing && <p className="text-sm">Parsing…</p>}

//       {rawRows.length > 0 && !parsing && (
//         <div className="space-y-2 text-sm">
//           <div>Total rows in file: <b>{rawRows.length}</b></div>
//           <div className="text-green-700">
//             Valid update rows: <b>{updatesToApply.length}</b>
//           </div>
//           <div className="text-amber-700">
//             Skipped (errors): <b>{invalidRowsInfo.length}</b>
//           </div>

//           <div className="pt-2">
//             <div>lead_ids matched in DB (latest row will be updated): <b>{Object.keys(latestIdByLead).length}</b></div>
//             <div className="text-amber-700">
//               lead_ids not found in DB: <b>{missingLeadIds.length}</b>
//             </div>
//             {missingLeadIds.length > 0 && (
//               <details className="mt-1">
//                 <summary className="cursor-pointer">See missing lead_ids</summary>
//                 <div className="mt-1 break-words">
//                   {missingLeadIds.slice(0, 50).join(", ")}
//                   {missingLeadIds.length > 50 && " …"}
//                 </div>
//               </details>
//             )}
//           </div>

//           {invalidRowsInfo.length > 0 && (
//             <details className="mt-2">
//               <summary className="cursor-pointer">See invalid row details</summary>
//               <ul className="list-disc pl-6 mt-2">
//                 {invalidRowsInfo.slice(0, 20).map((row, idx) => (
//                   <li key={idx}>
//                     Row {row.index}: {row.errors.join(", ")}
//                   </li>
//                 ))}
//                 {invalidRowsInfo.length > 20 && (
//                   <li>…and {invalidRowsInfo.length - 20} more</li>
//                 )}
//               </ul>
//             </details>
//           )}

//           <p className="text-xs text-muted-foreground mt-2">
//             We update the <b>latest</b> <code>sales_closure</code> row for each <code>lead_id</code> (by <code>closed_at</code>).
//             No other columns are touched.
//           </p>
//         </div>
//       )}
//     </div>

//     <DialogFooter className="mt-4">
//       <Button variant="outline" onClick={() => setImportOpen(false)}>
//         Cancel
//       </Button>
//       <Button
//         onClick={handleUpdateSubmitByLeadId}
//         disabled={importing || parsing || updatesToApply.length === 0}
//       >
//         {importing ? "Updating…" : `Update (${updatesToApply.length})`}
//       </Button>
//     </DialogFooter>
//   </DialogContent>
// </Dialog>


//       </DashboardLayout>
//     </ProtectedRoute>
//   );
// }






//app/technicalTeam/page.tsx


"use client";
import Link from "next/link";

// import { useEffect, useState } from "react";
import { useEffect, useState, useRef } from "react";

import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase/client";
import Papa from "papaparse";
import * as XLSX from "xlsx";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useAuth } from "@/components/providers/auth-provider";

/* =========================
   Types & Constants
   ========================= */

type FinanceStatus = "Paid" | "Unpaid" | "Paused" | "Closed" | "Got Placed";

// This is what Papa + normHeader produces for your file:
//
// lead_id, lead_name, company_application_mail, persoanl_mail_id,
// phone_number, whatsapp_number, sale_done_by, closed_at, source,
// total_amount, application_sale_value, resume_value, portfolio_value,
// linkedin_value, github_value, courses_value, addons_value,
// onboarded_date, subscription_cycle, custom_add_on_name,
// associate_tl_email, associate_tl_name, associate_email,
// associate_name, commitments
type RawCsv = {
  lead_id?: string;
  lead_name?: string;
  company_application_mail?: string;
  persoanl_mail_id?: string;
  phone_number?: string;
  whatsapp_number?: string;
  sale_done_by?: string;
  closed_at?: any;
  source?: string;
  total_amount?: any;
  application_sale_value?: any;
  resume_value?: any;
  portfolio_value?: any;
  linkedin_value?: any;
  github_value?: any;
  courses_value?: any;
  addons_value?: any;
  onboarded_date?: any;
  subscription_cycle?: any;
  custom_add_on_name?: string;
  associate_tl_email?: string;
  associate_tl_name?: string;
  associate_email?: string;
  associate_name?: string;
  commitments?: string;
};


type ResumeStatus =
  | "not_started"
  | "pending"
  | "waiting_client_approval"
  | "completed";

const STATUS_LABEL: Record<ResumeStatus, string> = {
  not_started: "Not started",
  pending: "Pending",
  waiting_client_approval: "Waiting for client approval",
  completed: "Completed",
};

/** NEW: Portfolio status is now separate in portfolio_progress */
type PortfolioStatus =
  | "not_started"
  | "pending"
  | "waiting_client_approval"
  | "success";

const PORTFOLIO_STATUS_LABEL: Record<PortfolioStatus, string> = {
  not_started: "Not started",
  pending: "Pending",
  waiting_client_approval: "Waiting for Client approval",
  success: "Success",
};

const PORTFOLIO_STATUS_OPTIONS: PortfolioStatus[] = [
  "not_started",
  "pending",
  "waiting_client_approval",
  "success",
];

interface SalesClosure {
  id: string;
  lead_id: string; // text in DB
  email: string;
  finance_status: FinanceStatus;
  closed_at: string | null;
  portfolio_sale_value?: number | null;
  github_sale_value?: number | null;

  // legacy fields on sales_closure (we are NOT using these for portfolio assignee anymore)
  associates_email?: string | null;
  associates_name?: string | null;
  associates_tl_email?: string | null;
  associates_tl_name?: string | null;

  // joined
  leads?: { name: string; phone: string };

  // resume_progress (read-only for resume build)
  rp_status?: ResumeStatus;
  rp_pdf_path?: string | null;

  // portfolio_progress (authoritative for portfolio)
  pp_status?: PortfolioStatus | null;
  pp_link?: string | null;
  pp_assigned_email?: string | null;
  pp_assigned_name?: string | null;
}

interface TeamUser {
  full_name: string;
  user_email: string;
  roles: "Technical Head" | "Technical Associate";
}

const PORTFOLIO_COLUMNS = [
  "S.No",
  "Client ID",
  "Name",
  "Email",
  "Phone",
  "Status",
  "Resume Status",
  "Resume PDF",
  "Portfolio Status",
  "Portfolio Link",
  "Assignee",
  "Closed At",
] as const;

const GITHUB_COLUMNS = [
  "S.No",
  "Client ID",
  "Name",
  "Email",
  "Phone",
  "Status",
  "GitHub Sale Value",
  "Closed At",
] as const;

/* =========================
   Component
   ========================= */

export default function TechnicalTeamPage() {
  const [loading, setLoading] = useState(true);

  const [portfolioRows, setPortfolioRows] = useState<SalesClosure[]>([]);
  const [githubRows, setGithubRows] = useState<SalesClosure[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamUser[]>([]);

  // Success dialog state (for entering portfolio link)
  const [linkDraft, setLinkDraft] = useState<Record<string, string>>({});
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkTargetLeadId, setLinkTargetLeadId] = useState<string | null>(null);
  const [linkTargetRowId, setLinkTargetRowId] = useState<string | null>(null);

  // =========================
  // INSERT dialog state
  // =========================
  const [importInsertOpen, setImportInsertOpen] = useState(false);
  const [insertFile, setInsertFile] = useState<File | null>(null);
  const [parsingInsert, setParsingInsert] = useState(false);
  const [importingInsert, setImportingInsert] = useState(false);
  const [rawRowsInsert, setRawRowsInsert] = useState<any[]>([]);
  const [validRowsToInsert, setValidRowsToInsert] = useState<any[]>([]);
  const [invalidRowsInsert, setInvalidRowsInsert] = useState<
    { index: number; errors: string[] }[]
  >([]);

  // =========================
  // UPDATE dialog state (by lead_id)
  // =========================
  const [importUpdateOpen, setImportUpdateOpen] = useState(false);
  const [updateFile, setUpdateFile] = useState<File | null>(null);
  const [parsingUpdate, setParsingUpdate] = useState(false);
  const [importingUpdate, setImportingUpdate] = useState(false);
  const [rawRowsUpdate, setRawRowsUpdate] = useState<any[]>([]);
  const [invalidRowsUpdate, setInvalidRowsUpdate] = useState<
    { index: number; errors: string[] }[]
  >([]);

  // --- "My Tasks" dialog state (portfolio only) ---
const [myTasksOpen, setMyTasksOpen] = useState(false);
const [myTasksRows, setMyTasksRows] = useState<SalesClosure[]>([]);
const [myTasksLoading, setMyTasksLoading] = useState(false);
const [myTasksError, setMyTasksError] = useState<string | null>(null);


  // update-by-lead_id bookkeeping
  const [updatesToApply, setUpdatesToApply] = useState<
    { lead_id: string; patch: Record<string, any> }[]
  >([]);
  const [latestIdByLead, setLatestIdByLead] = useState<Record<string, string>>(
    {}
  );
  const [missingLeadIds, setMissingLeadIds] = useState<string[]>([]);

  // Controlled Assignee value per portfolio row (keyed by sales_closure.id)
  const [assigneeByRow, setAssigneeByRow] = useState<
    Record<string, string | undefined>
  >({});

  const { user } = useAuth();
  const router = useRouter();

  /* =========================
     Helpers
     ========================= */

  // --- helpers to only add non-empty values ---
  const addIfPresent = (obj: any, key: string, value: any) => {
    const v = value;
    if (v === undefined || v === null) return;
    if (typeof v === "string" && v.trim() === "") return;
    obj[key] = v;
  };

  // money like "1,00,000" or "₹20,000" → number | null
  const cleanMoney = (v: any): number | null => {
    if (v === null || v === undefined || v === "") return null;
    const s = String(v).replace(/[,\s₹]/g, "");
    const n = parseFloat(s);
    return Number.isFinite(n) ? n : null;
  };

  // 15/30/60/90 only
  // const cleanIntCycle = (v: any): number | null => {
  //   if (v === null || v === undefined || v === "") return null;
  //   const n = parseInt(String(v).replace(/\D/g, ""), 10);
  //   return [15, 30, 60, 90].includes(n) ? n : null;
  // };

  const money = (v:any): number | null => {
  if (v === null || v === undefined) return null;
  const s = String(v).replace(/[,\s₹$]/g,"").trim();
  if (s === "" || s === "-") return null;
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : null;
};

const cleanIntCycle = (v:any): number | null => {
  if (v === null || v === undefined) return null;
  const n = parseInt(String(v).replace(/\D/g,""),10);
  return [15,30,60,90].includes(n) ? n : null;
};
// const toLeadRecord = (r: RawCsv) => {
//   const email = normEmpty(r.persoanl_mail_id) || normEmpty(r.company_application_mail);
//   return {
//     business_id: normEmpty(r.lead_id) || undefined, // respect provided ID
//     name: (r.lead_name ?? "").trim(),
//     email,
//     phone: normEmpty(r.phone_number) || normEmpty(r.whatsapp_number) || null,
//     source: (r.source ?? "").trim() || null,
//     status: "Assigned",
//     current_stage:'sale done',
//         assigned_to: normEmpty(r.assigned_to ?? "").trim() || null,

//     created_at: parseDateTime(r.closed_at),
//     assigned_to_email: normEmpty(r.sale_done_by) || null,
//   };
// };


const toSaleRecord = (r: RawCsv) => ({
  lead_id: (r.lead_id ?? "").trim(),                              // REQUIRED
  sale_value: money(r.total_amount) ?? 0,                         // REQUIRED
  subscription_cycle: cleanIntCycle(r.subscription_cycle) ?? 30,  // REQUIRED (validated)
  payment_mode: mapPaymentMode(r.source),
  closed_at: parseDateTime(r.closed_at),
  email: normEmpty(r.persoanl_mail_id) || normEmpty(r.company_application_mail) || "",
  finance_status: "Paid",
  lead_name: (r.lead_name ?? "").trim() || null,
  onboarded_date: parseDateOnly(r.onboarded_date),

  application_sale_value: money(r.application_sale_value),
  resume_sale_value: money(r.resume_value),
  portfolio_sale_value: money(r.portfolio_value),
  linkedin_sale_value: money(r.linkedin_value),
  github_sale_value: money(r.github_value),
  courses_sale_value: money(r.courses_value),
  custom_sale_value: money(r.addons_value),
  custom_label: normEmpty(r.custom_add_on_name) || null,

  company_application_email: normEmpty(r.company_application_mail) || null,

  associates_tl_email: normEmpty(r.associate_tl_email) || "",
  associates_tl_name: normEmpty(r.associate_tl_name) || "",
  associates_email: normEmpty(r.associate_email) || "",
  associates_name: normEmpty(r.associate_name) || "",
  account_assigned_email: normEmpty(r.sale_done_by) || "",

  commitments: normEmpty(r.commitments) || null,
});


const validateSalesOnly = (rows: RawCsv[]) => {
  const valids: RawCsv[] = [];
  const invalids: { index: number; errors: string[] }[] = [];

  rows.forEach((r, i) => {
    const errors: string[] = [];
    if (!r.lead_id || !r.lead_id.toString().trim())
      errors.push("lead_id missing");
    if (money(r.total_amount) === null)
      errors.push("total_amount missing/invalid");
    if (cleanIntCycle(r.subscription_cycle) === null)
      errors.push("subscription_cycle invalid (must be 15/30/60/90)");
    if (!normEmpty(r.persoanl_mail_id) && !normEmpty(r.company_application_mail))
      errors.push("email missing (persoanl_mail_id / company_application_mail)");

    if (errors.length) invalids.push({ index: i + 1, errors });
    else valids.push(r);
  });

  return { valids, invalids };
};


// const validateAndBuildBoth = (rows: RawCsv[]) => {
//   const valids: RawCsv[] = [];
//   const invalids: { index: number; errors: string[] }[] = [];

//   rows.forEach((r, i) => {
//     const errors: string[] = [];
//     if (!r.lead_name?.trim()) errors.push("lead_name missing");
//     if (!normEmpty(r.persoanl_mail_id) && !normEmpty(r.company_application_mail))
//       errors.push("email missing (persoanl_mail_id / company_application_mail)");
//     if (money(r.total_amount) === null) errors.push("total_amount missing/invalid");
//     if (cleanIntCycle(r.subscription_cycle) === null)
//       errors.push("subscription_cycle invalid (must be 15/30/60/90)");

//     if (errors.length) invalids.push({ index: i + 1, errors });
//     else valids.push(r);
//   });

//   return { valids, invalids };
// };


  // Parse date/time (supports dd/mm/yyyy, iso, and Excel serials)
  // const parseDateTime = (v: any): string | null => {
  //   if (v === null || v === undefined || v === "") return null;

  //   // Excel serial number
  //   if (typeof v === "number") {
  //     const d = XLSX.SSF.parse_date_code(v);
  //     if (d) {
  //       const dt = new Date(Date.UTC(d.y, d.m - 1, d.d));
  //       return dt.toISOString();
  //     }
  //   }

  //   const s = String(v).trim();

  //   // dd/mm/yyyy
  //   if (/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(s)) {
  //     const [d, m, y] = s.split("/").map(Number);
  //     const yyyy = y < 100 ? 2000 + y : y;
  //     const dt = new Date(yyyy, m - 1, d);
  //     return isNaN(dt.getTime()) ? null : dt.toISOString();
  //   }

  //   // try native
  //   const dt = new Date(s);
  //   return isNaN(dt.getTime()) ? null : dt.toISOString();
  // };

  // // Date-only (YYYY-MM-DD)
  // const parseDateOnly = (v: any): string | null => {
  //   const iso = parseDateTime(v);
  //   return iso ? iso.slice(0, 10) : null;
  // };

  const parseDateTime = (v: any): string | null => {
  if (v === null || v === undefined || v === "") return null;
  if (typeof v === "number") {
    const d = XLSX.SSF.parse_date_code(v);
    if (d) return new Date(Date.UTC(d.y, d.m - 1, d.d)).toISOString();
  }
  const s = String(v).trim();
  const m = s.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2}|\d{4})$/);
  if (m) {
    const d = +m[1], mo = +m[2], yy = +m[3];
    const yyyy = yy < 100 ? 2000 + yy : yy;
    const dt = new Date(yyyy, mo - 1, d);
    return isNaN(dt.getTime()) ? null : dt.toISOString();
  }
  const dt = new Date(s);
  return isNaN(dt.getTime()) ? null : dt.toISOString();
};
const parseDateOnly = (v:any) => {
  const iso = parseDateTime(v);
  return iso ? iso.slice(0,10) : null;
};

  // Normalize a header: strip BOM/space, lower-case, non-alnum -> _
  const normHeader = (h: string) =>
    String(h || "")
      .replace(/\uFEFF/g, "") // remove BOM
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_") // spaces, dashes -> _
      .replace(/^_|_$/g, ""); // trim leading/trailing _

  const parseCsvString = (csv: string) =>
    new Promise<any[]>((resolve, reject) => {
      Papa.parse(csv, {
        header: true,
        skipEmptyLines: true,
        transformHeader: normHeader, // normalize headers
        complete: (res) => resolve(res.data as any[]),
        error: (err: any) => reject(err),
      });
    });

  // return first present, non-empty value among keys (keys are expected to be normalized)
  const pick = (row: any, ...keys: string[]) => {
    for (const k of keys) {
      if (row[k] !== undefined && row[k] !== null) {
        const v = typeof row[k] === "string" ? row[k].trim() : row[k];
        if (v !== "") return v;
      }
    }
    return undefined;
  };


  const mapPaymentMode = (src: any): "UPI"|"Bank Transfer"|"PayPal"|"Stripe"|"Credit/Debit Card"|"Other"|"Razorpay" => {
  const s = String(src ?? "").trim().toLowerCase();
  if (["razor pay","razorpay","razor pay "].includes(s)) return "Razorpay";
  if (["phonepe","phone pe","phone pay"].includes(s)) return "UPI";
  if (s === "paypal") return "PayPal";
  if (s === "stripe") return "Stripe";
  if (s === "credit/debit card" || s === "card") return "Credit/Debit Card";
  if (s === "bank transfer" || s === "wire") return "Bank Transfer";
  // e.g. zelle, inr, cash, unknown → Other
  return "Other";
};

// ---- normalize possibly empty strings like "-" ----
const normEmpty = (x:any) => {
  const s = (x ?? "").toString().trim();
  return (s === "" || s === "-") ? "" : s;
};

  // -------------------------
  // UPDATE: Map ONE CSV row -> partial patch
  // -------------------------
  const rowToPatch = (r: any) => {
    const patch: any = {};

    // strings
    addIfPresent(patch, "lead_name", pick(r, "lead_name"));
    addIfPresent(
      patch,
      "company_application_email",
      pick(
        r,
        "company_application_mail",
        "company_applicati_mail",
        "company_mail"
      )
    );
    addIfPresent(
      patch,
      "email",
      pick(r, "persoanl_mail_id", "personal_mail_id", "personal_mailid")
    );
    addIfPresent(patch, "commitments", pick(r, "commitments"));
    addIfPresent(
      patch,
      "custom_label",
      pick(r, "custom_add_on_name", "custom_add_on_name_")
    );

    // dates
    const closedAt = parseDateTime(pick(r, "closed_at") ?? null);
    if (closedAt) patch.closed_at = closedAt;

    const onboard = parseDateOnly(pick(r, "onboarded_date") ?? null);
    if (onboard) patch.onboarded_date = onboard;

    // ints
    const cycle = cleanIntCycle(pick(r, "subscription_cycle") ?? null);
    if (cycle !== null) patch.subscription_cycle = cycle;

    // money fields
    const saleValue = cleanMoney(pick(r, "total_amount"));
    if (saleValue !== null) patch.sale_value = saleValue;

    const appVal = cleanMoney(pick(r, "application_sale_value"));
    if (appVal !== null) patch.application_sale_value = appVal;

    const resumeVal = cleanMoney(pick(r, "resume_value"));
    if (resumeVal !== null) patch.resume_sale_value = resumeVal;

    const portfolioVal = cleanMoney(pick(r, "portfolio_value"));
    if (portfolioVal !== null) patch.portfolio_sale_value = portfolioVal;

    const linkedinVal = cleanMoney(pick(r, "linkedin_value"));
    if (linkedinVal !== null) patch.linkedin_sale_value = linkedinVal;

    const githubVal = cleanMoney(pick(r, "github_value"));
    if (githubVal !== null) patch.github_sale_value = githubVal;

    const coursesVal = cleanMoney(pick(r, "courses_value"));
    if (coursesVal !== null) patch.courses_sale_value = coursesVal;

    const addonsVal = cleanMoney(pick(r, "addons_value"));
    if (addonsVal !== null) patch.custom_sale_value = addonsVal;

    // associates
    addIfPresent(patch, "associates_tl_email", pick(r, "associate_tl_email"));
    addIfPresent(patch, "associates_tl_name", pick(r, "associate_tl_name"));
    addIfPresent(patch, "associates_email", pick(r, "associate_email"));
    addIfPresent(patch, "associates_name", pick(r, "associate_name"));

    return patch;
  };

  const buildUpdatesFromRows = (rows: any[]) => {
    const items: { lead_id: string; patch: Record<string, any> }[] = [];
    const invalids: { index: number; errors: string[] }[] = [];

    rows.forEach((r, i) => {
      // after transformHeader, the key is normalized to 'lead_id'
      const rawLead = r.lead_id ?? r.leadid ?? r.lead_i_d;
      const lead_id = rawLead ? String(rawLead).trim() : "";

      if (!lead_id) {
        invalids.push({ index: i + 1, errors: ["lead_id missing"] });
        return;
      }

      const patch = rowToPatch(r);
      if (!patch || Object.keys(patch).length === 0) {
        invalids.push({
          index: i + 1,
          errors: ["no recognized columns to update"],
        });
        return;
      }

      items.push({ lead_id, patch });
    });

    return { items, invalids };
  };

  // Prefetch LATEST row-id (by closed_at) per lead_id
  const prefetchLatestIds = async (leadIds: string[]) => {
    const unique = Array.from(new Set(leadIds.filter(Boolean)));
    if (!unique.length) {
      setLatestIdByLead({});
      setMissingLeadIds([]);
      return;
    }

    const latest: Record<string, { id: string; closed_at: string | null }> = {};
    const CHUNK = 1000;

    for (let i = 0; i < unique.length; i += CHUNK) {
      const slice = unique.slice(i, i + CHUNK);
      const { data, error } = await supabase
        .from("sales_closure")
        .select("id, lead_id, closed_at")
        .in("lead_id", slice);

      if (error) {
        console.error("prefetchLatestIds error:", error);
        continue;
      }
      for (const row of data ?? []) {
        const cur = latest[row.lead_id];
        const curTs = cur?.closed_at
          ? new Date(cur.closed_at).getTime()
          : -Infinity;
        const rowTs = row.closed_at
          ? new Date(row.closed_at).getTime()
          : -Infinity;
        if (!cur || rowTs > curTs)
          latest[row.lead_id] = { id: row.id, closed_at: row.closed_at };
      }
    }

    const idMap: Record<string, string> = {};
    unique.forEach((lid) => {
      if (latest[lid]) idMap[lid] = latest[lid].id;
    });

    setLatestIdByLead(idMap);
    setMissingLeadIds(unique.filter((lid) => !idMap[lid]));
  };

  // -------------------------
  // INSERT: build object for insert + validation
  // -------------------------
  const rowToInsert = (r: any) => {
    // allow for spelling/case variants found in headings
    const lead_id =
      (r.lead_id ?? r["Lead_id"] ?? r["lead id"] ?? r["Lead ID"])
        ?.toString()
        .trim();

    const sale_value = cleanMoney(
      r.total_amount ?? r.Total_amount ?? r["Total Amount"]
    );

    const subscription_cycle = cleanIntCycle(
      r.subscription_cycle ?? r.Subscription_cycle
    );

    const email = (
      r.persoanl_mail_id ??
      r.personal_mail_id ??
      r.Persoanl_mail_id ??
      r["Personal_mail_id"] ??
      r.company_application_mail ??
      r.Company_application_mail
    )
      ?.toString()
      .trim();

    const record: any = {
      // required
      lead_id,
      sale_value,
      subscription_cycle,
      payment_mode: "UPI",
      email,

      // optional / mapped
      closed_at: parseDateTime(r.closed_at ?? r.Closed_at),
      finance_status: "Paid",

      lead_name: r.lead_name ?? r.Lead_name ?? null,

      company_application_email:
        r.company_application_mail ?? r.Company_application_mail ?? null,

      application_sale_value: cleanMoney(
        r.application_sale_value ?? r.Application_sale_value
      ),
      resume_sale_value: cleanMoney(r.resume_value ?? r.Resume_value),
      portfolio_sale_value: cleanMoney(r.portfolio_value ?? r.Portfolio_value),
      linkedin_sale_value: cleanMoney(r.linkedin_value ?? r.LinkedIn_value),
      github_sale_value: cleanMoney(r.github_value ?? r.GitHub_value),
      courses_sale_value: cleanMoney(r.courses_value ?? r.Courses_value),

      custom_label:
        r.custom_add_on_name ??
        r["Custom Add-on_name"] ??
        r["Custom Add-on Name"] ??
        null,
      custom_sale_value: cleanMoney(r.addons_value ?? r.Addons_value),

      onboarded_date: parseDateOnly(r.onboarded_date ?? r.Onboarded_date),

      associates_tl_email: r.associate_tl_email ?? "",
      associates_tl_name: r.associate_tl_name ?? "",
      associates_email: r.associate_email ?? "",
      associates_name: r.associate_name ?? "",

      commitments: r.commitments ?? null,
    };

    return { lead_id, sale_value, subscription_cycle, email, record };
  };

  const validateAndBuild = (rows: any[]) => {
    const valids: any[] = [];
    const invalids: { index: number; errors: string[] }[] = [];

    rows.forEach((r, i) => {
      const { lead_id, sale_value, subscription_cycle, email, record } =
        rowToInsert(r);
      const errors: string[] = [];
      if (!lead_id) errors.push("lead_id missing");
      if (sale_value === null)
        errors.push("Total_amount (sale_value) missing/invalid");
      if (subscription_cycle === null)
        errors.push("subscription_cycle invalid (must be 15/30/60/90)");
      if (!email) errors.push("email missing");

      if (errors.length) invalids.push({ index: i + 1, errors });
      else valids.push(record);
    });

    return { valids, invalids };
  };

  /* =========================
     File → rows handlers
     ========================= */

     // =========================
// QUICK IMPORT (choose file → parse → insert → alerts only)
// =========================
const quickFileInputRef = useRef<HTMLInputElement | null>(null);

const quickParseAndInsert = async (file: File) => {
  try {
    // 1) Parse
    const ext = file.name.split(".").pop()?.toLowerCase();
    let rows: any[] = [];
    if (ext === "xlsx" || ext === "xls") {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const csv = XLSX.utils.sheet_to_csv(ws, { blankrows: false });
      rows = await parseCsvString(csv);
    } else {
      const text = await file.text();
      rows = await parseCsvString(text);
    }

    // 2) Validate & build records
    const { valids, invalids } = validateAndBuild(rows);
    alert(
      `Parsed ${rows.length} rows.\n` +
      `Valid: ${valids.length}\n` +
      `Skipped (errors): ${invalids.length}`
    );

    if (!valids.length) {
      alert("No valid rows to insert. Aborting.");
      return;
    }

    // 3) Insert in chunks
    let inserted = 0;
    const CHUNK = 500;
    for (let i = 0; i < valids.length; i += CHUNK) {
      const chunk = valids.slice(i, i + CHUNK);
      const { error } = await supabase.from("sales_closure").insert(chunk);
      if (error) throw error;
      inserted += chunk.length;
    }

    // 4) Refresh page data + report
    await fetchData();
    alert(`Imported ${inserted} records successfully.`);
  } catch (e: any) {
    alert(e?.message || "Quick import failed");
  } finally {
    // reset the file input so selecting the same file again will trigger onChange
    if (quickFileInputRef.current) quickFileInputRef.current.value = "";
  }
};


const fetchMyTasks = async () => {
  try {
    setMyTasksLoading(true);
    setMyTasksError(null);

    const assigneeEmail = (user?.email || "").trim().toLowerCase();
    const assigneeName  = (user?.name  || "").trim();
    const leadIds = new Set<string>();

    // Collect lead_ids by email
    if (assigneeEmail) {
      const { data: byEmail, error: e1 } = await supabase
        .from("portfolio_progress")
        .select("lead_id")
        .eq("assigned_email", assigneeEmail);
      if (e1) throw e1;
      (byEmail ?? []).forEach(r => r.lead_id && leadIds.add(r.lead_id));
    }

    // Collect lead_ids by name (case-insensitive contains)
    if (assigneeName) {
      const { data: byName, error: e2 } = await supabase
        .from("portfolio_progress")
        .select("lead_id")
        .ilike("assigned_name", `%${assigneeName}%`);
      if (e2) throw e2;
      (byName ?? []).forEach(r => r.lead_id && leadIds.add(r.lead_id));
    }

    const allowLeadIds = Array.from(leadIds);
    if (!allowLeadIds.length) {
      setMyTasksRows([]);
      setMyTasksOpen(true);
      return;
    }

    // sales_closure (portfolio only)
    const { data: sales, error: salesErr } = await supabase
      .from("sales_closure")
      .select("id, lead_id, email, finance_status, closed_at, portfolio_sale_value, github_sale_value, associates_email, associates_name, associates_tl_email, associates_tl_name")
      .in("lead_id", allowLeadIds)
      .not("portfolio_sale_value", "is", null)
      .neq("portfolio_sale_value", 0);
    if (salesErr) throw salesErr;

    // latest per lead (by closed_at)
    const latest = (() => {
      const map = new Map<string, any>();
      for (const r of sales ?? []) {
        const ex = map.get(r.lead_id);
        const ed = ex?.closed_at ?? "";
        const cd = r?.closed_at ?? "";
        if (!ex || new Date(cd) > new Date(ed)) map.set(r.lead_id, r);
      }
      return Array.from(map.values());
    })();

    const leadIdList = latest.map(r => r.lead_id);

    // joins
    const [{ data: leadsData }, { data: resumeProg }, { data: portfolioProg }] = await Promise.all([
      supabase.from("leads").select("business_id, name, phone").in("business_id", leadIdList),
      supabase.from("resume_progress").select("lead_id, status, pdf_path").in("lead_id", leadIdList),
      supabase.from("portfolio_progress").select("lead_id, status, link, assigned_email, assigned_name").in("lead_id", leadIdList),
    ]);

    const leadMap = new Map((leadsData ?? []).map(l => [l.business_id, { name: l.name, phone: l.phone }]));
    const resumeMap = new Map((resumeProg ?? []).map(p => [p.lead_id, { status: p.status as ResumeStatus, pdf_path: p.pdf_path ?? null }]));
    const portfolioMap = new Map((portfolioProg ?? []).map(p => [
      p.lead_id,
      {
        status: (p.status ?? "not_started") as PortfolioStatus,
        link: p.link ?? null,
        assigned_email: p.assigned_email ?? null,
        assigned_name: p.assigned_name ?? null,
      },
    ]));

    const merged: SalesClosure[] = latest.map((r) => ({
      ...r,
      leads: leadMap.get(r.lead_id) || { name: "-", phone: "-" },
      rp_status: resumeMap.get(r.lead_id)?.status ?? "not_started",
      rp_pdf_path: resumeMap.get(r.lead_id)?.pdf_path ?? null,
      pp_status: portfolioMap.get(r.lead_id)?.status ?? "not_started",
      pp_link: portfolioMap.get(r.lead_id)?.link ?? null,
      pp_assigned_email: portfolioMap.get(r.lead_id)?.assigned_email ?? null,
      pp_assigned_name: portfolioMap.get(r.lead_id)?.assigned_name ?? null,
    }));

    setMyTasksRows(merged);
    setMyTasksOpen(true);
  } catch (e: any) {
    console.error(e);
    setMyTasksError(e?.message || "Failed to load your tasks");
    setMyTasksRows([]);
    setMyTasksOpen(true);
  } finally {
    setMyTasksLoading(false);
  }
};


const handleQuickFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const f = e.target.files?.[0];
  if (f) await quickParseAndInsert(f);
};

const triggerQuickImport = () => {
  quickFileInputRef.current?.click();
};


  // INSERT: parse selected file
 const handleParseSelectedFileInsert = async (file: File) => {
  setParsingInsert(true);
  setRawRowsInsert([]);
  setValidRowsToInsert([]);
  setInvalidRowsInsert([]);

  try {
    const ext = file.name.split(".").pop()?.toLowerCase();
    let rows: any[] = [];

    if (ext === "xlsx" || ext === "xls") {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const csv = XLSX.utils.sheet_to_csv(ws, { blankrows: false });
      rows = await parseCsvString(csv);
    } else {
      const text = await file.text();
      rows = await parseCsvString(text);
    }

    setRawRowsInsert(rows);
   // inside handleParseSelectedFileInsert(...)
const { valids, invalids } = validateSalesOnly(rows as RawCsv[]);
setValidRowsToInsert(valids);
setInvalidRowsInsert(invalids);

    // No alerts here; counts are shown inside the dialog UI above.
  } catch (e: any) {
    alert(e?.message || "Failed to parse the selected file"); // keep error alert
  } finally {
    setParsingInsert(false);
  }
};


  // UPDATE: parse selected file
  const handleParseSelectedFileUpdate = async (file: File) => {
    setParsingUpdate(true);
    setRawRowsUpdate([]);
    setInvalidRowsUpdate([]);
    setUpdatesToApply([]);
    setLatestIdByLead({});
    setMissingLeadIds([]);

    try {
      const ext = file.name.split(".").pop()?.toLowerCase();
      let rows: any[] = [];

      if (ext === "xlsx" || ext === "xls") {
        const buf = await file.arrayBuffer();
        const wb = XLSX.read(buf, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const csv = XLSX.utils.sheet_to_csv(ws, { blankrows: false });
        rows = await parseCsvString(csv);
      } else {
        const text = await file.text();
        rows = await parseCsvString(text);
      }

      setRawRowsUpdate(rows);

      const { items, invalids } = buildUpdatesFromRows(rows);
      setUpdatesToApply(items);
      setInvalidRowsUpdate(invalids);

      await prefetchLatestIds(items.map((i) => i.lead_id));
    } catch (e: any) {
      alert(e?.message || "Failed to parse the selected file");
    } finally {
      setParsingUpdate(false);
    }
  };

  /* =========================
     Submit handlers
     ========================= */

  // INSERT into Supabase in chunks
  // const handleImportSubmit = async () => {
  //   if (!validRowsToInsert.length) {
  //     alert("No valid rows to insert.");
  //     return;
  //   }
  //   setImportingInsert(true);
  //   try {
  //     const CHUNK = 500;
  //     for (let i = 0; i < validRowsToInsert.length; i += CHUNK) {
  //       const chunk = validRowsToInsert.slice(i, i + CHUNK);
  //       const { error } = await supabase.from("sales_closure").insert(chunk);
  //       if (error) throw error;
  //     }
  //     await fetchData();
  //     alert(`Imported ${validRowsToInsert.length} records successfully.`);
  //     // reset dialog state
  //     setImportInsertOpen(false);
  //     setInsertFile(null);
  //     setRawRowsInsert([]);
  //     setValidRowsToInsert([]);
  //     setInvalidRowsInsert([]);
  //   } catch (e: any) {
  //     alert(e?.message || "Import failed");
  //   } finally {
  //     setImportingInsert(false);
  //   }
  // };

const handleImportSubmit = async () => {
  if (!validRowsToInsert.length) {
    alert("No valid rows to insert.");
    return;
  }
  setImportingInsert(true);

  let closuresInserted = 0;
  let failed = 0;

  try {
    // Build all sale records first
    const saleRecords = (validRowsToInsert as RawCsv[]).map(r => toSaleRecord(r));

    // Insert in chunks (faster & atomic by chunk)
    const CHUNK = 500;
    for (let i = 0; i < saleRecords.length; i += CHUNK) {
      const chunk = saleRecords.slice(i, i + CHUNK);
      const { error } = await supabase.from("sales_closure").insert(chunk);
      if (error) {
        // if a chunk fails, fall back to row-by-row to count
        for (const row of chunk) {
          const { error: e } = await supabase.from("sales_closure").insert(row);
          if (e) failed++; else closuresInserted++;
        }
      } else {
        closuresInserted += chunk.length;
      }
    }

    await fetchData();

    alert(
      `Import finished.\n` +
      `Sales closures inserted: ${closuresInserted}\n` +
      `Skipped/failed rows: ${failed}`
    );

    // reset dialog state
    setImportInsertOpen(false);
    setInsertFile(null);
    setRawRowsInsert([]);
    setValidRowsToInsert([]);
    setInvalidRowsInsert([]);
  } catch (e: any) {
    alert(e?.message || "Import failed");
  } finally {
    setImportingInsert(false);
  }
};


  // UPDATE latest row per lead_id
  const handleUpdateSubmitByLeadId = async () => {
    if (!updatesToApply.length) {
      alert("No valid rows to update.");
      return;
    }

    setImportingUpdate(true);
    let updated = 0;
    let failed = 0;

    try {
      for (const item of updatesToApply) {
        const rowId = latestIdByLead[item.lead_id];
        if (!rowId) continue; // unmatched – reported separately

        const { error } = await supabase
          .from("sales_closure")
          .update(item.patch)
          .eq("id", rowId);

        if (error) {
          failed++;
          console.error("Update failed for", item.lead_id, error);
        } else {
          updated++;
        }
      }

      await fetchData();

      alert(
        `Update complete.\nUpdated: ${updated}\nUnmatched lead_ids (no row in DB): ${missingLeadIds.length}\nFailed: ${failed}`
      );

      // reset dialog state
      setImportUpdateOpen(false);
      setUpdateFile(null);
      setRawRowsUpdate([]);
      setUpdatesToApply([]);
      setInvalidRowsUpdate([]);
      setLatestIdByLead({});
      setMissingLeadIds([]);
    } catch (e: any) {
      alert(e?.message || "Bulk update failed");
    } finally {
      setImportingUpdate(false);
    }
  };

  /* =========================
     Data Fetch
     ========================= */

  const latestByLead = (rows: any[]) => {
    const map = new Map<string, any>();
    for (const r of rows ?? []) {
      const ex = map.get(r.lead_id);
      const ed = ex?.closed_at ?? "";
      const cd = r?.closed_at ?? "";
      if (!ex || new Date(cd) > new Date(ed)) map.set(r.lead_id, r);
    }
    return Array.from(map.values()).sort(
      (a, b) =>
        new Date(b.closed_at || "").getTime() -
        new Date(a.closed_at || "").getTime()
    );
    // eslint-disable-next-line
  };

  const toNiceMoney = (v?: number | null) =>
    typeof v === "number"
      ? v.toLocaleString("en-IN", { maximumFractionDigits: 2 })
      : "-";

  const fetchData = async () => {
    if (!user) return;

    // portfolio rows from sales_closure (non-null and non-zero)
    const qPortfolio = supabase
      .from("sales_closure")
      .select(
        "id, lead_id, email, finance_status, closed_at, portfolio_sale_value, github_sale_value, associates_email, associates_name, associates_tl_email, associates_tl_name"
      )
      .not("portfolio_sale_value", "is", null)
      .neq("portfolio_sale_value", 0);

    // github rows
    const qGithub = supabase
      .from("sales_closure")
      .select(
        "id, lead_id, email, finance_status, closed_at, portfolio_sale_value, github_sale_value"
      )
      .not("github_sale_value", "is", null)
      .neq("github_sale_value", 0);

    const [{ data: pData, error: pErr }, { data: gData, error: gErr }] =
      await Promise.all([qPortfolio, qGithub]);
    if (pErr || gErr) {
      console.error("Failed to fetch sales data:", pErr || gErr);
      return;
    }

    const pLatest = latestByLead(pData || []);
    const gLatest = latestByLead(gData || []);
    const allLeadIds = Array.from(
      new Set([...pLatest, ...gLatest].map((r) => r.lead_id))
    );

    // leads basics
    const { data: leadsData, error: leadsErr } = await supabase
      .from("leads")
      .select("business_id, name, phone")
      .in("business_id", allLeadIds);
    if (leadsErr) {
      console.error("Failed to fetch leads:", leadsErr);
      return;
    }
    const leadMap = new Map(
      (leadsData ?? []).map((l) => [
        l.business_id,
        { name: l.name, phone: l.phone },
      ])
    );

    // resume_progress (resume build only)
    const { data: resumeProg, error: resumeErr } = await supabase
      .from("resume_progress")
      .select("lead_id, status, pdf_path")
      .in("lead_id", allLeadIds);
    if (resumeErr) {
      console.error("Failed to fetch resume_progress:", resumeErr);
      return;
    }
    const resumeMap = new Map(
      (resumeProg ?? []).map((p) => [
        p.lead_id,
        { status: p.status as ResumeStatus, pdf_path: p.pdf_path ?? null },
      ])
    );

    // NEW: portfolio_progress (authoritative portfolio data)
    const { data: portfolioProg, error: portErr } = await supabase
      .from("portfolio_progress")
      .select("lead_id, status, link, assigned_email, assigned_name")
      .in("lead_id", allLeadIds);
    if (portErr) {
      console.error("Failed to fetch portfolio_progress:", portErr);
      return;
    }
    const portfolioMap = new Map(
      (portfolioProg ?? []).map((p) => [
        p.lead_id,
        {
          status: (p.status ?? "not_started") as PortfolioStatus,
          link: p.link ?? null,
          assigned_email: p.assigned_email ?? null,
          assigned_name: p.assigned_name ?? null,
        },
      ])
    );

    // Merge for portfolio tab
    const mergedPortfolio: SalesClosure[] = pLatest.map((r) => ({
      ...r,
      leads: leadMap.get(r.lead_id) || { name: "-", phone: "-" },

      // resume (read-only)
      rp_status: resumeMap.get(r.lead_id)?.status ?? "not_started",
      rp_pdf_path: resumeMap.get(r.lead_id)?.pdf_path ?? null,

      // portfolio (from portfolio_progress)
      pp_status: portfolioMap.get(r.lead_id)?.status ?? "not_started",
      pp_link: portfolioMap.get(r.lead_id)?.link ?? null,
      pp_assigned_email: portfolioMap.get(r.lead_id)?.assigned_email ?? null,
      pp_assigned_name: portfolioMap.get(r.lead_id)?.assigned_name ?? null,
    }));

    // Merge for github tab (no portfolio/resume extras)
    const mergedGithub: SalesClosure[] = gLatest.map((r) => ({
      ...r,
      leads: leadMap.get(r.lead_id) || { name: "-", phone: "-" },
    }));

    setPortfolioRows(mergedPortfolio);
    setGithubRows(mergedGithub);
  };

  const fetchTeam = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("full_name, user_email, roles")
      .in("roles", ["Technical Head", "Technical Associate"]);
    if (error) {
      console.error("Failed to fetch team users:", error);
      return;
    }
    const sorted = (data as TeamUser[]).sort((a, b) =>
      a.roles === b.roles
        ? a.full_name.localeCompare(b.full_name)
        : a.roles.localeCompare(b.roles)
    );
    setTeamMembers(sorted);
  };

  /* =========================
     Actions
     ========================= */

  // Direct download from Supabase → auto-saves to Downloads
  const downloadResume = async (path: string) => {
    try {
      const segments = (path || "").split("/");
      const leadId = segments[0] || "unknown";
      const fileName = `Resume-${leadId}.pdf`;

      const { data, error } = await supabase.storage
        .from("resumes")
        .createSignedUrl(path, 60 * 60); // 1 hour

      if (error) throw error;
      if (!data?.signedUrl) throw new Error("No signed URL");

      const res = await fetch(data.signedUrl);
      if (!res.ok) throw new Error(`Download failed (${res.status})`);
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (e: any) {
      alert(e?.message || "Could not download PDF");
    }
  };

  // Update portfolio status
  // const handlePortfolioStatusChange = async (
  //   sale: SalesClosure,
  //   next: PortfolioStatus
  // ) => {
  //   if (next === "success") {
  //     setLinkTargetLeadId(sale.lead_id);
  //     setLinkTargetRowId(sale.id);
  //     setLinkDraft((d) => ({ ...d, [sale.lead_id]: sale.pp_link ?? "" }));
  //     setLinkDialogOpen(true);
  //     return;
  //   }

  //   const { error } = await supabase
  //     .from("portfolio_progress")
  //     .upsert(
  //       {
  //         lead_id: sale.lead_id,
  //         status: next,
  //         updated_by: user?.email ?? null,
  //       },
  //       { onConflict: "lead_id" }
  //     );
  //   if (error) return alert(error.message);

  //   setPortfolioRows((prev) =>
  //     prev.map((r) =>
  //       r.id === sale.id ? { ...r, pp_status: next, pp_link: null } : r
  //     )
  //   );
  // };


  const handlePortfolioStatusChange = async (sale: SalesClosure, next: PortfolioStatus) => {
  if (next === "success") {
    setLinkTargetLeadId(sale.lead_id);
    setLinkTargetRowId(sale.id);
    setLinkDraft((d) => ({ ...d, [sale.lead_id]: sale.pp_link ?? "" }));
    setLinkDialogOpen(true);
    return;
  }

  const { error } = await supabase
    .from("portfolio_progress")
    .upsert(
      { lead_id: sale.lead_id, status: next, updated_by: user?.email ?? null },
      { onConflict: "lead_id" }
    );
  if (error) return alert(error.message);

  setPortfolioRows(prev => prev.map(r => r.id === sale.id ? { ...r, pp_status: next, pp_link: null } : r));
  // keep MyTasks dialog in sync
  setMyTasksRows(prev => prev.map(r => r.id === sale.id ? { ...r, pp_status: next, pp_link: null } : r));
};


  // Save success link
  // const handleSavePortfolioSuccess = async () => {
  //   const link = linkTargetLeadId
  //     ? (linkDraft[linkTargetLeadId] ?? "").trim()
  //     : "";
  //   if (!link || !linkTargetLeadId || !linkTargetRowId)
  //     return alert("Please paste a link.");
  //   if (!/^https?:\/\//i.test(link))
  //     return alert("Enter a valid http(s) URL.");

  //   const { error } = await supabase
  //     .from("portfolio_progress")
  //     .upsert(
  //       {
  //         lead_id: linkTargetLeadId,
  //         status: "success",
  //         link,
  //         updated_by: user?.email ?? null,
  //       },
  //       { onConflict: "lead_id" }
  //     );
  //   if (error) return alert(error.message);

  //   setPortfolioRows((prev) =>
  //     prev.map((r) =>
  //       r.id === linkTargetRowId
  //         ? { ...r, pp_status: "success", pp_link: link }
  //         : r
  //     )
  //   );
  //   setLinkDialogOpen(false);
  //   setLinkDraft({});
  //   setLinkTargetLeadId(null);
  //   setLinkTargetRowId(null);
  // };


  const handleSavePortfolioSuccess = async () => {
  const link = linkTargetLeadId ? (linkDraft[linkTargetLeadId] ?? "").trim() : "";
  if (!link || !linkTargetLeadId || !linkTargetRowId) return alert("Please paste a link.");
  if (!/^https?:\/\//i.test(link)) return alert("Enter a valid http(s) URL.");

  const { error } = await supabase
    .from("portfolio_progress")
    .upsert(
      { lead_id: linkTargetLeadId, status: "success", link, updated_by: user?.email ?? null },
      { onConflict: "lead_id" }
    );
  if (error) return alert(error.message);

  setPortfolioRows(prev => prev.map(r => r.id === linkTargetRowId ? { ...r, pp_status: "success", pp_link: link } : r));
  setMyTasksRows(prev => prev.map(r => r.id === linkTargetRowId ? { ...r, pp_status: "success", pp_link: link } : r));

  setLinkDialogOpen(false);
  setLinkDraft({});
  setLinkTargetLeadId(null);
  setLinkTargetRowId(null);
};


  // // Assign portfolio owner (stored in portfolio_progress)
  // const handleAssignPortfolio = async (
  //   sale: SalesClosure,
  //   memberEmail: string
  // ) => {
  //   setAssigneeByRow((p) => ({ ...p, [sale.id]: memberEmail }));

  //   const member = teamMembers.find((m) => m.user_email === memberEmail);
  //   if (!member) return;

  //   const { error } = await supabase
  //     .from("portfolio_progress")
  //     .upsert(
  //       {
  //         lead_id: sale.lead_id,
  //         assigned_email: member.user_email,
  //         assigned_name: member.full_name,
  //         updated_by: user?.email ?? null,
  //       },
  //       { onConflict: "lead_id" }
  //     );

  //   if (error) {
  //     alert(error.message || "Failed to assign portfolio owner");
  //     setAssigneeByRow((p) => ({
  //       ...p,
  //       [sale.id]: sale.pp_assigned_email ?? undefined,
  //     }));
  //     return;
  //   }

  //   setPortfolioRows((prev) =>
  //     prev.map((r) =>
  //       r.id === sale.id
  //         ? {
  //             ...r,
  //             pp_assigned_email: member.user_email,
  //             pp_assigned_name: member.full_name,
  //           }
  //         : r
  //     )
  //   );
  // };

  const handleAssignPortfolio = async (sale: SalesClosure, memberEmail: string) => {
  setAssigneeByRow((p) => ({ ...p, [sale.id]: memberEmail }));
  const member = teamMembers.find((m) => m.user_email === memberEmail);
  if (!member) return;

  const { error } = await supabase
    .from("portfolio_progress")
    .upsert(
      { lead_id: sale.lead_id, assigned_email: member.user_email, assigned_name: member.full_name, updated_by: user?.email ?? null },
      { onConflict: "lead_id" }
    );

  if (error) {
    alert(error.message || "Failed to assign portfolio owner");
    setAssigneeByRow((p) => ({ ...p, [sale.id]: sale.pp_assigned_email ?? undefined }));
    return;
  }

  setPortfolioRows(prev =>
    prev.map(r =>
      r.id === sale.id ? { ...r, pp_assigned_email: member.user_email, pp_assigned_name: member.full_name } : r
    )
  );
  setMyTasksRows(prev =>
    prev.map(r =>
      r.id === sale.id ? { ...r, pp_assigned_email: member.user_email, pp_assigned_name: member.full_name } : r
    )
  );
};


  /* =========================
     Effects
     ========================= */

  // Role gate
  useEffect(() => {
    if (user === null) return;
    const allowed = [
      "Super Admin",
      "Technical Head",
      "Technical Associate",
    ] as const;
    if (!user || !allowed.includes(user.role as any)) {
      router.push("/unauthorized");
      return;
    }
    setLoading(false);
  }, [user, router]);

  // Initial data load
  useEffect(() => {
    if (user) {
      fetchData();
      fetchTeam();
    }
  }, [user]);

  // Seed/stick controlled Assignee values from portfolio_progress
  useEffect(() => {
    setAssigneeByRow((prev) => {
      const next = { ...prev };
      for (const r of portfolioRows) {
        const current = r.pp_assigned_email ?? undefined;
        if (next[r.id] === undefined) next[r.id] = current;
      }
      return next;
    });
  }, [portfolioRows, teamMembers]);

  /* =========================
     Renderers
     ========================= */

  const renderPortfolioTable = (rows: SalesClosure[]) => (
    <div className="rounded-md border mt-4">
      <Table>
        <TableHeader>
          <TableRow>
            {PORTFOLIO_COLUMNS.map((c) => (
              <TableHead key={c}>{c}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((sale, index) => (
            <TableRow key={sale.id}>
              <TableCell>{index + 1}</TableCell>
              <TableCell>{sale.lead_id}</TableCell>

              <TableCell
                className="font-medium max-w-[150px] break-words whitespace-normal cursor-pointer text-blue-600 hover:underline"
                onClick={() => window.open(`/leads/${sale.lead_id}`, "_blank")}
              >
                {sale.leads?.name || "-"}
              </TableCell>

              <TableCell>{sale.email}</TableCell>
              <TableCell>{sale.leads?.phone || "-"}</TableCell>
              <TableCell>{sale.finance_status}</TableCell>

              {/* Resume Status (read-only) */}
              <TableCell>
                {STATUS_LABEL[(sale.rp_status ?? "not_started") as ResumeStatus]}
              </TableCell>

              {/* Resume PDF */}
              <TableCell>
                {sale.rp_pdf_path ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadResume(sale.rp_pdf_path!)}
                  >
                    Download Resume
                  </Button>
                ) : (
                  <span className="text-gray-400 text-sm">—</span>
                )}
              </TableCell>

              {/* Portfolio Status (from portfolio_progress) */}
              <TableCell className="space-y-2">
                {sale.pp_status === "success" && sale.pp_link ? (
                  <a
                    href={sale.pp_link}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 underline break-all"
                    title="Open portfolio link"
                  >
                    {sale.pp_link}
                  </a>
                ) : (
                  <Select
                    onValueChange={(v) =>
                      handlePortfolioStatusChange(sale, v as PortfolioStatus)
                    }
                    value={(sale.pp_status ?? "not_started") as PortfolioStatus}
                  >
                    <SelectTrigger className="w-[260px]">
                      <SelectValue placeholder="Set portfolio status" />
                    </SelectTrigger>
                    <SelectContent>
                      {PORTFOLIO_STATUS_OPTIONS.map((s) => (
                        <SelectItem key={s} value={s}>
                          {PORTFOLIO_STATUS_LABEL[s]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </TableCell>
              {/* <TableCell className="max-w-[220px] truncate">
                {sale.leads?.name && (
                  <a
                    href={`https://${sale.leads?.name
                      .toLowerCase()
                      .replace(/[^a-z0-9]/g, "")}-applywizz.vercel.app/`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 underline block truncate"
                    title={`https://${sale.leads?.name
                      .toLowerCase()
                      .replace(/[^a-z0-9]/g, "")}-applywizz.vercel.app/`}
                  >
                    https://
                    {sale.leads?.name
                      .toLowerCase()
                      .replace(/[^a-z0-9]/g, "")}
                    -applywizz.vercel.app/
                  </a>
                )}
              </TableCell> */}

               <TableCell className="max-w-[220px] truncate">
                {sale.leads?.name && (
                  <a
                    href={`https://applywizz-${sale.leads?.name
                      .toLowerCase()
                      .replace(/[^a-z0-9]/g, "")}.vercel.app/`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 underline block truncate"
                    title={`https://applywizz-${sale.leads?.name
                      .toLowerCase()
                      .replace(/[^a-z0-9]/g, "")}.vercel.app/`}
                  >
                    https://applywizz-
                    {sale.leads?.name
                      .toLowerCase()
                      .replace(/[^a-z0-9]/g, "")}
                    .vercel.app/
                  </a>
                )}
              </TableCell>

              {/* Assignee */}
              <TableCell>
                {(() => {
                  const current =
                    assigneeByRow[sale.id] ?? sale.pp_assigned_email ?? "";
                  const inList = !!teamMembers.find(
                    (m) => m.user_email === current
                  );

                  return (
                    <Select
                      value={current || undefined}
                      onValueChange={(email) =>
                        handleAssignPortfolio(sale, email)
                      }
                      disabled={user?.role == "Technical Associate"}
                    >
                      <SelectTrigger className="w-[240px] !opacity-100 bg-muted/20 text-foreground">
                        <SelectValue placeholder="Assign to..." />
                      </SelectTrigger>
                      <SelectContent>
                        {!inList && current && (
                          <SelectItem value={current} className="hidden">
                            {sale.pp_assigned_name || current}
                          </SelectItem>
                        )}

                        <div className="px-2 py-1 text-xs text-muted-foreground">
                          Technical Heads
                        </div>
                        {teamMembers
                          .filter((m) => m.roles === "Technical Head")
                          .map((m) => (
                            <SelectItem key={m.user_email} value={m.user_email}>
                              {m.full_name} • Head
                            </SelectItem>
                          ))}

                        <div className="px-2 py-1 text-xs text-muted-foreground">
                          Technical Associates
                        </div>
                        {teamMembers
                          .filter((m) => m.roles === "Technical Associate")
                          .map((m) => (
                            <SelectItem key={m.user_email} value={m.user_email}>
                              {m.full_name} • Associate
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  );
                })()}
              </TableCell>

              <TableCell>
                {sale.closed_at
                  ? new Date(sale.closed_at).toLocaleDateString("en-GB")
                  : "-"}
              </TableCell>
            </TableRow>
          ))}
          {rows.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={PORTFOLIO_COLUMNS.length}
                className="text-center text-sm text-muted-foreground py-10"
              >
                No records found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );

  const renderGithubTable = (rows: SalesClosure[]) => (
    <div className="rounded-md border mt-4">
      <Table>
        <TableHeader>
          <TableRow>
            {GITHUB_COLUMNS.map((c) => (
              <TableHead key={c}>{c}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((sale, index) => (
            <TableRow key={sale.id}>
              <TableCell>{index + 1}</TableCell>
              <TableCell>{sale.lead_id}</TableCell>
              <TableCell
                className="font-medium max-w-[150px] break-words whitespace-normal cursor-pointer text-blue-600 hover:underline"
                onClick={() => window.open(`/leads/${sale.lead_id}`, "_blank")}
              >
                {sale.leads?.name || "-"}
              </TableCell>
              <TableCell>{sale.email}</TableCell>
              <TableCell>{sale.leads?.phone || "-"}</TableCell>
              <TableCell>{sale.finance_status}</TableCell>
              <TableCell>{toNiceMoney(sale.github_sale_value)}</TableCell>
              <TableCell>
                {sale.closed_at
                  ? new Date(sale.closed_at).toLocaleDateString("en-GB")
                  : "-"}
              </TableCell>
            </TableRow>
          ))}
          {rows.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={GITHUB_COLUMNS.length}
                className="text-center text-sm text-muted-foreground py-10"
              >
                No GitHub sales found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );

  /* =========================
     Render
     ========================= */

  return (
    <ProtectedRoute
      allowedRoles={["Super Admin", "Technical Head", "Technical Associate"]}
    >
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">Technical Page</h1>
            {/* <div className="flex items-center gap-2">
              <Button onClick={() => setImportInsertOpen(true)}>
                Add sale done CSV
              </Button>
              <Button onClick={() => setImportUpdateOpen(true)}>
                Update by CSV
              </Button>
            </div> */}

            {/* <div className="flex items-center gap-2">
  <Button onClick={() => setImportInsertOpen(true)}>
    Add sale done CSV
  </Button>
  <Button onClick={() => setImportUpdateOpen(true)}>
    Update by CSV
  </Button>

  <input
    ref={quickFileInputRef}
    type="file"
    accept=".csv,.xlsx,.xls"
    onChange={handleQuickFileChange}
    className="hidden"
  />
  <Button variant="outline" onClick={triggerQuickImport}>
    Quick Import (CSV/XLSX)
  </Button>
</div> */}


<div className="flex items-center gap-2">
      <Button variant="outline" onClick={fetchMyTasks}>My Tasks</Button>

  {/* INSERT dialog lives next to the trigger */}
  <Dialog open={importInsertOpen} onOpenChange={setImportInsertOpen}>
    <DialogTrigger asChild>
      <Button>Add sale done CSV</Button>
    </DialogTrigger>

    <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto z-[1000]">
      <DialogHeader>
        <DialogTitle>Import Sales (CSV / XLSX)</DialogTitle>
      </DialogHeader>

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">Select file</label>
          <Input
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={(e) => {
              const f = e.target.files?.[0] || null;
              setInsertFile(f);
              if (f) handleParseSelectedFileInsert(f); // parses + fills counts (no alerts)
            }}
          />
          <p className="text-xs text-muted-foreground">
            Excel files are converted to CSV in-browser, then parsed.
          </p>
        </div>

        {parsingInsert && <p className="text-sm">Parsing…</p>}

        {rawRowsInsert.length > 0 && !parsingInsert && (
          <div className="space-y-1 text-sm">
            <div>
              Total rows in file: <b>{rawRowsInsert.length}</b>
            </div>
            <div className="text-green-700">
              Valid rows to insert: <b>{validRowsToInsert.length}</b>
            </div>
            <div className="text-amber-700">
              Skipped (errors): <b>{invalidRowsInsert.length}</b>
            </div>

            {invalidRowsInsert.length > 0 && (
              <details className="mt-2">
                <summary className="cursor-pointer">See invalid row details</summary>
                <ul className="list-disc pl-6 mt-2">
                  {invalidRowsInsert.slice(0, 20).map((row, idx) => (
                    <li key={idx}>Row {row.index}: {row.errors.join(", ")}</li>
                  ))}
                  {invalidRowsInsert.length > 20 && (
                    <li>…and {invalidRowsInsert.length - 20} more</li>
                  )}
                </ul>
              </details>
            )}

            {/* <p className="text-xs text-muted-foreground mt-2">
              Required: <code>lead_id</code>, <code>Total_amount</code>,{" "}
              <code>subscription_cycle (15/30/60/90)</code>, <code>email</code>.{" "}
              <br />
              Note: <code>payment_mode</code> is set to <b>UPI</b> for all records;{" "}
              <code>finance_status</code> defaults to <b>Paid</b>.
            </p> */}

           <p className="text-xs text-muted-foreground mt-2">
  This will insert into <b>public.sales_closure</b> only.
  Required columns: <code>lead_id</code>, <code>total_amount</code>,
  <code>subscription_cycle</code> (15/30/60/90), and either
  <code> persoanl_mail_id</code> or <code> company_application_mail</code>.
</p>


          </div>
        )}
      </div>

      <DialogFooter className="mt-4">
        <Button variant="outline" onClick={() => setImportInsertOpen(false)}>
          Cancel
        </Button>
        <Button
          onClick={handleImportSubmit}
          disabled={importingInsert || parsingInsert || validRowsToInsert.length === 0}
        >
          {importingInsert ? "Importing…" : `Submit (${validRowsToInsert.length})`}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>

  {/* Update stays as a separate dialog like you had */}
  <Button onClick={() => setImportUpdateOpen(true)}>
    Update by CSV
  </Button>
</div>


          </div>

          {loading ? (
            <p className="p-6 text-gray-600">Loading...</p>
          ) : (
            <Tabs defaultValue="portfolio" className="w-full">
              <TabsList className="grid grid-cols-2 w-full sm:w-auto">
                <TabsTrigger value="portfolio">Portfolios</TabsTrigger>
                <TabsTrigger value="github">GitHub</TabsTrigger>
              </TabsList>

              <TabsContent value="portfolio">
                {renderPortfolioTable(portfolioRows)}
              </TabsContent>
              <TabsContent value="github">
                {renderGithubTable(githubRows)}
              </TabsContent>
            </Tabs>
          )}
        </div>


<Dialog open={myTasksOpen} onOpenChange={setMyTasksOpen}>
  <DialogContent className="max-w-7xl overflow-scroll">
    <DialogHeader>
      <DialogTitle>My Tasks</DialogTitle>
    </DialogHeader>

    {myTasksLoading ? (
      <div className="p-6 text-sm text-muted-foreground">Loading…</div>
    ) : myTasksError ? (
      <div className="p-6 text-sm text-red-600">{myTasksError}</div>
    ) : (
      // reuse the same portfolio table renderer with full actions
      renderPortfolioTable(myTasksRows)
    )}

    <DialogFooter className="gap-2">
      <Button variant="outline" onClick={fetchMyTasks}>Refresh</Button>
      <Button onClick={() => setMyTasksOpen(false)}>Close</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>


        {/* Success dialog */}
        <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Mark as Success</DialogTitle>
            </DialogHeader>

            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">
                Success link
              </label>
              <Input
                placeholder="https://…"
                value={
                  linkTargetLeadId ? linkDraft[linkTargetLeadId] ?? "" : ""
                }
                onChange={(e) =>
                  setLinkDraft((prev) => ({
                    ...prev,
                    ...(linkTargetLeadId
                      ? { [linkTargetLeadId]: e.target.value }
                      : {}),
                  }))
                }
              />
              <p className="text-xs text-muted-foreground">
                Paste the final portfolio link. It will be saved in{" "}
                <code>portfolio_progress</code>.
              </p>
            </div>

            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => setLinkDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSavePortfolioSuccess}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* INSERT dialog */}
        <Dialog open={importInsertOpen} onOpenChange={setImportInsertOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Import Sales (CSV / XLSX)</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">
                  Select file
                </label>
                <Input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={(e) => {
                    const f = e.target.files?.[0] || null;
                    setInsertFile(f);
                    if (f) handleParseSelectedFileInsert(f);
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  We’ll parse with PapaParse. Excel files are first converted to
                  CSV (in-browser) and then parsed.
                </p>
              </div>

              {parsingInsert && <p className="text-sm">Parsing…</p>}

              {rawRowsInsert.length > 0 && !parsingInsert && (
                <div className="space-y-1 text-sm">
                  <div>
                    Total rows in file: <b>{rawRowsInsert.length}</b>
                  </div>
                  <div className="text-green-700">
                    Valid rows to insert: <b>{validRowsToInsert.length}</b>
                  </div>
                  <div className="text-amber-700">
                    Skipped (errors): <b>{invalidRowsInsert.length}</b>
                  </div>

                  {invalidRowsInsert.length > 0 && (
                    <details className="mt-2">
                      <summary className="cursor-pointer">
                        See invalid row details
                      </summary>
                      <ul className="list-disc pl-6 mt-2">
                        {invalidRowsInsert.slice(0, 20).map((row, idx) => (
                          <li key={idx}>
                            Row {row.index}: {row.errors.join(", ")}
                          </li>
                        ))}
                        {invalidRowsInsert.length > 20 && (
                          <li>
                            …and {invalidRowsInsert.length - 20} more
                          </li>
                        )}
                      </ul>
                    </details>
                  )}

                  <p className="text-xs text-muted-foreground mt-2">
                    Note: <code>payment_mode</code> is set to <b>UPI</b> for
                    all records. Required fields:
                    <code> lead_id</code>, <code>Total_amount</code>,{" "}
                    <code>subscription_cycle (15/30/60/90)</code>,{" "}
                    <code>email</code>.
                  </p>
                </div>
              )}
            </div>

            <DialogFooter className="mt-4">
              <Button
                variant="outline"
                onClick={() => setImportInsertOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleImportSubmit}
                disabled={
                  importingInsert ||
                  parsingInsert ||
                  validRowsToInsert.length === 0
                }
              >
                {importingInsert
                  ? "Importing…"
                  : `Submit (${validRowsToInsert.length})`}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* UPDATE dialog */}
        <Dialog open={importUpdateOpen} onOpenChange={setImportUpdateOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Update Sales (by lead_id) — CSV / XLSX</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">
                  Select file
                </label>
                <Input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={(e) => {
                    const f = e.target.files?.[0] || null;
                    setUpdateFile(f);
                    if (f) handleParseSelectedFileUpdate(f);
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  Excel files are converted to CSV in-browser, then parsed with
                  PapaParse. Only the columns present in your file will be
                  updated. Everything else stays unchanged.
                </p>
              </div>

              {parsingUpdate && <p className="text-sm">Parsing…</p>}

              {rawRowsUpdate.length > 0 && !parsingUpdate && (
                <div className="space-y-2 text-sm">
                  <div>
                    Total rows in file: <b>{rawRowsUpdate.length}</b>
                  </div>
                  <div className="text-green-700">
                    Valid update rows: <b>{updatesToApply.length}</b>
                  </div>
                  <div className="text-amber-700">
                    Skipped (errors): <b>{invalidRowsUpdate.length}</b>
                  </div>

                  <div className="pt-2">
                    <div>
                      lead_ids matched in DB (latest row will be updated):{" "}
                      <b>{Object.keys(latestIdByLead).length}</b>
                    </div>
                    <div className="text-amber-700">
                      lead_ids not found in DB: <b>{missingLeadIds.length}</b>
                    </div>
                    {missingLeadIds.length > 0 && (
                      <details className="mt-1">
                        <summary className="cursor-pointer">
                          See missing lead_ids
                        </summary>
                        <div className="mt-1 break-words">
                          {missingLeadIds.slice(0, 50).join(", ")}
                          {missingLeadIds.length > 50 && " …"}
                        </div>
                      </details>
                    )}
                  </div>

                  {invalidRowsUpdate.length > 0 && (
                    <details className="mt-2">
                      <summary className="cursor-pointer">
                        See invalid row details
                      </summary>
                      <ul className="list-disc pl-6 mt-2">
                        {invalidRowsUpdate.slice(0, 20).map((row, idx) => (
                          <li key={idx}>
                            Row {row.index}: {row.errors.join(", ")}
                          </li>
                        ))}
                        {invalidRowsUpdate.length > 20 && (
                          <li>
                            …and {invalidRowsUpdate.length - 20} more
                          </li>
                        )}
                      </ul>
                    </details>
                  )}

                  <p className="text-xs text-muted-foreground mt-2">
                    We update the <b>latest</b> <code>sales_closure</code> row
                    for each <code>lead_id</code> (by <code>closed_at</code>).
                    No other columns are touched.
                  </p>
                </div>
              )}
            </div>

            <DialogFooter className="mt-4">
              <Button
                variant="outline"
                onClick={() => setImportUpdateOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateSubmitByLeadId}
                disabled={
                  importingUpdate ||
                  parsingUpdate ||
                  updatesToApply.length === 0
                }
              >
                {importingUpdate
                  ? "Updating…"
                  : `Update (${updatesToApply.length})`}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

