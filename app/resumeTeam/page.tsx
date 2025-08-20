// // app/resumeTeam/page.tsx
// "use client";

// import { useEffect, useRef, useState } from "react";
// import { useRouter } from "next/navigation";
// import { supabase } from "@/utils/supabase/client";

// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
// import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

// import { Button } from "@/components/ui/button";

// import ProtectedRoute from "@/components/auth/ProtectedRoute";
// import { DashboardLayout } from "@/components/layout/dashboard-layout";
// import { useAuth } from "@/components/providers/auth-provider";

// /* =========================
//    Types & Labels
//    ========================= */

// type FinanceStatus = "Paid" | "Unpaid" | "Paused" | "Closed" | "Got Placed";

// type ResumeStatus = "not_started" | "pending" | "waiting_client_approval" | "completed";
// const STATUS_LABEL: Record<ResumeStatus, string> = {
//   not_started: "Not started",
//   pending: "Pending",
//   waiting_client_approval: "Waiting for Client approval",
//   completed: "Completed",
// };

// /** Portfolio status from the technical team (read-only here) */
// type PortfolioStatus = "not_started" | "pending" | "waiting_client_approval" | "success";
// const PORTFOLIO_STATUS_LABEL: Record<PortfolioStatus, string> = {
//   not_started: "Not started",
//   pending: "Pending",
//   waiting_client_approval: "Waiting for Client approval",
//   success: "Success",
// };

// interface SalesClosure {
//   id: string;
//   lead_id: string; // TEXT in DB
//   email: string;
//   finance_status: FinanceStatus;
//   closed_at: string | null;
//   resume_sale_value?: number | null;
//   commitments?: string | null; // JSONB in DB, but here we treat it as a string

//   // joined
//   leads?: { name: string; phone: string };

//   // resume_progress
//   rp_status?: ResumeStatus;
//   rp_pdf_path?: string | null;
//   assigned_to_email?: string | null; // <-- add this line
//   assigned_to_name?: string | null; // <-- add this line
//   // portfolio_progress (from technical team) — READ ONLY in this page
//   pp_status?: PortfolioStatus | null;
//   pp_assigned_email?: string | null;
//   pp_assigned_name?: string | null;
//   pp_link?: string | null; // link to portfolio, if available
// }

// type TeamMember = {
//   id: string;
//   name: string | null;
//   email: string | null;
//   role: string | null;
// };

// const RESUME_COLUMNS = [
//     "S.No",
//   "Client ID",
//   "Name",
//   "Email",
//   "Phone",
//   "Status",
//   "Resume Status",
//   // NEW COLUMN (your request)
//   "Assigned to",
//   "Resume PDF",
//   "Closed At",
//   // NEW (reflect what Technical Team updated)
//   "Portfolio Status",
//   "Portfolio Assignee",
//   "client requirements"
  
// ] as const;

// /* =========================
//    Component
//    ========================= */

// export default function ResumeTeamPage() {
//   const [loading, setLoading] = useState(true);
//   const [rows, setRows] = useState<SalesClosure[]>([]);
//   const [uploadForLead, setUploadForLead] = useState<string | null>(null);
//   const [replacingOldPath, setReplacingOldPath] = useState<string | null>(null);
//   const [reqDialogOpen, setReqDialogOpen] = useState(false);
// const [reqRow, setReqRow] = useState<SalesClosure | null>(null);


//   // NEW: team members (Resume Head + Resume Associate)
//   const [resumeTeamMembers, setResumeTeamMembers] = useState<TeamMember[]>([]);

//   const fileRef = useRef<HTMLInputElement | null>(null);
//   const router = useRouter();
//   const { user } = useAuth();

  
//   /* =========================
//      Fetch
//      ========================= */

//   const fetchData = async () => {
//     // 1) rows that have a resume sale
//     const { data: sales, error: salesErr } = await supabase
//       .from("sales_closure")
//       .select("id, lead_id, email, finance_status, closed_at, resume_sale_value, commitments")
//       .not("resume_sale_value", "is", null)
//       .neq("resume_sale_value", 0);

//     if (salesErr) {
//       console.error(salesErr);
//       return;
//     }

//     // 2) pick latest per lead_id
//     const latestByLead = (rs: any[]) => {
//       const map = new Map<string, any>();
//       for (const r of rs ?? []) {
//         const ex = map.get(r.lead_id);
//         const ed = ex?.closed_at ?? "";
//         const cd = r?.closed_at ?? "";
//         if (!ex || new Date(cd) > new Date(ed)) map.set(r.lead_id, r);
//       }
//       return Array.from(map.values()).sort(
//         (a, b) => new Date(b.closed_at || "").getTime() - new Date(a.closed_at || "").getTime()
//       );
//     };
//     const latest = latestByLead(sales || []);
//     const leadIds = latest.map((r) => r.lead_id);

//     // 3) join basic lead info
//     const { data: leadsData, error: leadsErr } = await supabase
//       .from("leads")
//       .select("business_id, name, phone")
//       .in("business_id", leadIds);

//     if (leadsErr) {
//       console.error(leadsErr);
//       return;
//     }
//     const leadMap = new Map(leadsData?.map((l) => [l.business_id, { name: l.name, phone: l.phone }]));

//     // 4) join resume progress
//     const { data: progress, error: progErr } = await supabase
//       .from("resume_progress")
//       // .select("lead_id, status, pdf_path")
//       .select("lead_id, status, pdf_path, assigned_to_email, assigned_to_name") // <-- add assigned_to_email and assigned_to_name

//       .in("lead_id", leadIds);

//     if (progErr) {
//       console.error(progErr);
//       return;
//     }
//     const progMap = new Map(
//       // (progress ?? []).map((p) => [p.lead_id, { status: p.status as ResumeStatus, pdf_path: p.pdf_path ?? null }])

//       (progress ?? []).map((p) => [
//   p.lead_id,
//   {
//     status: p.status as ResumeStatus,
//     pdf_path: p.pdf_path ?? null,
//     assigned_to_email: p.assigned_to_email ?? null,
//     assigned_to_name: p.assigned_to_name ?? null, // <-- store assigned_to_name
//   },
// ])

//     );

//     // 5) join portfolio progress (from Technical Team) — read-only here
//     const { data: portfolioProg, error: portErr } = await supabase
//       .from("portfolio_progress")
//       .select("lead_id, status, assigned_email, assigned_name, link")
//       .in("lead_id", leadIds);

//     if (portErr) {
//       console.error(portErr);
//       return;
//     }
//     const portMap = new Map(
//       (portfolioProg ?? []).map((p) => [
//         p.lead_id,
//         {
//           status: (p.status ?? "not_started") as PortfolioStatus,
//           assigned_email: p.assigned_email ?? null,
//           assigned_name: p.assigned_name ?? null,
//           link: p.link ?? null, // ✅ keep link
//         },
//       ])
//     );

// // 6) NEW: fetch ALL users who are Resume Head / Resume Associate
// const { data: teamUsers, error: teamErr } = await supabase
//   .from("profiles")
//   .select("user_id, full_name, user_email, roles")
//   .in("roles", ["Resume Head", "Resume Associate"])
// .order("full_name", { ascending: true, nullsFirst: false })
// .order("user_email", { ascending: true });

// if (teamErr) {
//   console.error("Team fetch error:", JSON.stringify(teamErr));
//   setResumeTeamMembers([]);
// } else {
//   setResumeTeamMembers(
//     (teamUsers ?? []).map((u: any) => ({
//       id: u.user_id,            // text (unique)
//       name: u.full_name,        // text
//       email: u.user_email,      // text (nullable)
//       role: u.roles,            // text
//     }))
//   );
// }



//     // 7) merge final rows
//     setRows(
//       latest.map((r) => ({
//         ...r,
//         leads: leadMap.get(r.lead_id) || { name: "-", phone: "-" },
//         rp_status: progMap.get(r.lead_id)?.status ?? "not_started",
//         rp_pdf_path: progMap.get(r.lead_id)?.pdf_path ?? null,
//         assigned_to_email: progMap.get(r.lead_id)?.assigned_to_email ?? null,
//         assigned_to_name: progMap.get(r.lead_id)?.assigned_to_name ?? null, // <-- add this line
//         // reflect technical team updates
//         pp_status: portMap.get(r.lead_id)?.status ?? "not_started",
//         pp_assigned_email: portMap.get(r.lead_id)?.assigned_email ?? null,
//         pp_assigned_name: portMap.get(r.lead_id)?.assigned_name ?? null,
//         pp_link: portMap.get(r.lead_id)?.link ?? null, // ✅ store link in row
//       }))
//     );
//   };

//   /* =========================
//      Gate
//      ========================= */

//   useEffect(() => {
//     if (user === null) return;
//     const allowed = ["Super Admin", "Resume Head", "Resume Associate"] as const;
//     if (!user || !allowed.includes(user.role as any)) {
//       router.push("/unauthorized");
//       return;
//     }
//     setLoading(false);
//   }, [user, router]);

//   useEffect(() => {
//     if (user) fetchData();
//   }, [user]);

//   /* =========================
//      PDF store helpers
//      ========================= */

//   const ensurePdf = (file: File) => {
//     if (file.type !== "application/pdf") throw new Error("Please select a PDF file.");
//     if (file.size > 20 * 1024 * 1024) throw new Error("Max file size is 20MB.");
//   };

//   const makeObjectPath = (leadId: string, fileName: string) => {
//     const cleanName = fileName.replace(/\s+/g, "_");
//     return `${leadId}/${Date.now()}_${cleanName}`; // stored under bucket 'resumes'
//   };

//   const uploadPdf = async (leadId: string, file: File, oldPath?: string | null) => {
//     ensurePdf(file);
//     const path = makeObjectPath(leadId, file.name);

//     // Storage upload (bucket must be named 'resumes' and exist)
//     const { error: upErr } = await supabase.storage
//       .from("resumes")
//       .upload(path, file, { cacheControl: "3600", upsert: true, contentType: "application/pdf" });

//     if (upErr) throw upErr;

//     // Optionally remove old blob if replacing
//     if (oldPath) {
//       await supabase.storage.from("resumes").remove([oldPath]);
//     }

//     // Upsert progress row
//     const { error: dbErr } = await supabase
//       .from("resume_progress")
//       .upsert(
//         { lead_id: leadId, status: "completed", pdf_path: path, pdf_uploaded_at: new Date().toISOString() },
//         { onConflict: "lead_id" } // requires unique or PK on lead_id
//       );

//     if (dbErr) throw dbErr;

//     return path;
//   };

//   const updateStatus = async (leadId: string, status: ResumeStatus) => {
//     const { error } = await supabase
//       .from("resume_progress")
//       .upsert({ lead_id: leadId, status }, { onConflict: "lead_id" });
//     if (error) throw error;
//   };

//  const updateAssignedTo = async (
//   leadId: string,
//   email: string | null,
//   name?: string | null
// ) => {
//   // 1) does a row exist for this lead?
//   const { data: existingRows, error: findErr } = await supabase
//     .from("resume_progress")
//     .select("id")
//     .eq("lead_id", leadId);

//   if (findErr) throw findErr;

//   if (existingRows && existingRows.length > 0) {
//     // 2) update
//     const { error: updErr } = await supabase
//       .from("resume_progress")
//       .update({
//         assigned_to_email: email,
//         assigned_to_name: name ?? null,
//       })
//       .eq("lead_id", leadId);

//     if (updErr) throw updErr;
//   } else {
//     // 3) insert (status has a DEFAULT, so we can omit it)
//     const { error: insErr } = await supabase
//       .from("resume_progress")
//       .insert({
//         lead_id: leadId,
//         assigned_to_email: email,
//         assigned_to_name: name ?? null,
//       });

//     if (insErr) throw insErr;
//   }
// };



//   // Handle change in status select
//   const onChangeStatus = async (row: SalesClosure, newStatus: ResumeStatus) => {
//     try {
//       await updateStatus(row.lead_id, newStatus);

//       if (newStatus === "completed" && !row.rp_pdf_path) {
//         // Ask for a file only if there's no PDF yet
//         setUploadForLead(row.lead_id);
//         setReplacingOldPath(null);
//         fileRef.current?.click();
//       } else {
//         // Reflect in UI immediately
//         setRows((rs) => rs.map((r) => (r.lead_id === row.lead_id ? { ...r, rp_status: newStatus } : r)));
//       }
//     } catch (e: any) {
//       alert(e.message || "Failed to update status");
//     }
//   };

//   // Handle click on Replace button
//   const onReplacePdf = (row: SalesClosure) => {
//     setUploadForLead(row.lead_id);
//     setReplacingOldPath(row.rp_pdf_path ?? null);
//     fileRef.current?.click();
//   };

//   // Single hidden file input shared by all rows
//   const onFilePicked = async (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0] || null;
//     const leadId = uploadForLead;
//     const oldPath = replacingOldPath;
//     // reset so user can re-pick same file next time
//     e.target.value = "";
//     setUploadForLead(null);
//     setReplacingOldPath(null);

//     if (!file || !leadId) return;

//     try {
//       await uploadPdf(leadId, file, oldPath || undefined);
//       // refresh table
//       await fetchData();
//       alert("PDF uploaded.");
//     } catch (err: any) {
//       alert(err.message || "Upload failed");
//     }
//   };

//   const openPdf = async (path: string) => {
//     try {
//       const { data, error } = await supabase.storage.from("resumes").createSignedUrl(path, 60 * 60);
//       if (error) throw error;
//       if (data?.signedUrl) window.open(data.signedUrl, "_blank", "noopener,noreferrer");
//     } catch (e: any) {
//       alert(e.message || "Could not open PDF");
//     }
//   };

//   /* =========================
//      UI
//      ========================= */

//   const renderTable = (data: SalesClosure[]) => (
//     <div className="rounded-md border mt-4">
//       <input ref={fileRef} type="file" accept="application/pdf" className="hidden" onChange={onFilePicked} />

//       <Table>
//         <TableHeader>
//           <TableRow>
//             {RESUME_COLUMNS.map((c) => (
//               <TableHead key={c}>{c}</TableHead>
//             ))}
//           </TableRow>
//         </TableHeader>
//         <TableBody>
//           {data.map((row, index) => (
//             <TableRow key={row.id}>
//               <TableCell className="text-center">{index + 1}</TableCell>
//               <TableCell>{row.lead_id}</TableCell>
//               <TableCell>{row.leads?.name || "-"}</TableCell>
//               <TableCell >{row.email}</TableCell>
//               <TableCell>{row.leads?.phone || "-"}</TableCell>
//               <TableCell>{row.finance_status}</TableCell>

//               {/* Resume Status */}
//               <TableCell className="min-w-[220px]">
//                 <Select value={row.rp_status || "not_started"} onValueChange={(v) => onChangeStatus(row, v as ResumeStatus)}>
//                   <SelectTrigger>
//                     <SelectValue placeholder="Select status" />
//                   </SelectTrigger>
//                   <SelectContent>
//                     {(["not_started", "pending", "waiting_client_approval", "completed"] as ResumeStatus[]).map((s) => (
//                       <SelectItem key={s} value={s}>
//                         {STATUS_LABEL[s]}
//                       </SelectItem>
//                     ))}
//                   </SelectContent>
//                 </Select>
//               </TableCell>
//                {/* NEW: Assigned to (list of all Resume Heads/Associates) */}
//               {/* Assigned to (persist to resume_progress) */}
// <TableCell className="min-w-[260px]">
//   <Select
//     value={row.assigned_to_email ?? "__none__"}   // keep in sync after refresh
//     onValueChange={async (value) => {
//       try {
//         const chosen = value === "__none__" ? null : value;
//         const member = resumeTeamMembers.find((u) => u.email === chosen) || null;

//         await updateAssignedTo(row.lead_id, chosen, member?.name ?? null);

//         // optimistic UI update
//         setRows((rs) =>
//           rs.map((r) =>
//             r.lead_id === row.lead_id
//               ? {
//                   ...r,
//                   assigned_to_email: chosen,
//                   assigned_to_name: member?.name ?? null,
//                 }
//               : r
//           )
//         );
//       } catch (e: any) {
//         console.error("Assign failed:", e);
//         alert(e.message || "Failed to assign");
//       }
//     }}
//   disabled={user?.role == "Resume Associate"}>
//     <SelectTrigger     className="!opacity-100 bg-muted/20 text-foreground">
//       <SelectValue placeholder="Assign to…" />
//     </SelectTrigger>
//     <SelectContent className="max-h-72">
//       <SelectItem value="__none__">Unassigned</SelectItem>
//       {resumeTeamMembers.length === 0 ? (
//         <SelectItem value="__disabled__" disabled>
//           No team members found
//         </SelectItem>
//       ) : (
//         resumeTeamMembers.map((u) => (
//           <SelectItem key={u.id} value={u.email ?? ""} disabled={!u.email}>
//             {(u.name )}
//             — {u.role}
//           </SelectItem>
//         ))
//       )}
//     </SelectContent>
//   </Select>
// </TableCell>


//               {/* Resume PDF */}
//               <TableCell className="space-x-2 min-w-[220px] ">
//                 {row.rp_pdf_path ? (
//                   <>
//                     <Button variant="outline" size="sm" onClick={() => openPdf(row.rp_pdf_path!)}>
//                       View PDF
//                     </Button>
//                     <Button variant="secondary" size="sm" onClick={() => onReplacePdf(row)}>
//                       Replace
//                     </Button>
//                   </>
//                 ) : row.rp_status === "completed" ? (
//                   <Button
//                     size="sm"
//                     onClick={() => {
//                       setUploadForLead(row.lead_id);
//                       setReplacingOldPath(null);
//                       fileRef.current?.click();
//                     }}
//                   >
//                     Upload PDF
//                   </Button>
//                 ) : (
//                   <span className="text-gray-400 text-sm">—</span>
//                 )}
//               </TableCell>

//               {/* Closed At */}
//               <TableCell>{row.closed_at ? new Date(row.closed_at).toLocaleDateString("en-GB") : "-"}</TableCell>

//               {/* Portfolio Status (from portfolio_progress) */}
//               <TableCell>
//                 {row.pp_status === "success" && row.pp_link ? (
//                   <a
//                     href={row.pp_link}
//                     target="_blank"
//                     rel="noreferrer"
//                     className="text-blue-600 underline break-all"
//                     title="Open portfolio link"
//                   >
//                     {row.pp_link}
//                   </a>
//                 ) : (
//                   PORTFOLIO_STATUS_LABEL[(row.pp_status ?? "not_started") as PortfolioStatus]
//                 )}
//               </TableCell>

//               {/* Portfolio Assignee (from portfolio_progress) */}
//               <TableCell>
//                 {row.pp_assigned_name
//                   ? `${row.pp_assigned_name}${row.pp_assigned_email ? ` • ${row.pp_assigned_email}` : ""}`
//                   : row.pp_assigned_email || <span className="text-gray-400 text-sm">—</span>}
//               </TableCell>
//                   {/* <TableCell>{row.commitments}</TableCell> */}
//                   <TableCell className="min-w-[140px] text-center">
//                     {row.commitments?.trim() ? (
//   <Button className="bg-gray-900 hover:bg-gray-400 text-white"
//     size="sm"
//     variant="outline"
//     onClick={() => { setReqRow(row); setReqDialogOpen(true); }}
//   >
//     Requirements
//   </Button>) : (
//   <span className="text-gray-400 text-sm">—</span>
// )}
// </TableCell>

             
//             </TableRow>
//           ))}
//           {data.length === 0 && (
//             <TableRow>
//               <TableCell colSpan={RESUME_COLUMNS.length} className="text-center text-sm text-muted-foreground py-10">
//                 No records found.
//               </TableCell>
              
//             </TableRow>
            
//           )}
         
//         </TableBody>
//       </Table>
//     </div>
//   );

//   return (
//     <ProtectedRoute allowedRoles={["Super Admin", "Resume Head", "Resume Associate"]}>
//       <DashboardLayout>
//         <div className="space-y-6">
//           <div className="flex items-center justify-between">
//             <h1 className="text-3xl font-bold text-gray-900">Resume Page</h1>
//           </div>

//           {loading ? (
//             <p className="p-6 text-gray-600">Loading...</p>
//           ) : (
//             <Tabs defaultValue="resume" className="w-full">
//               <TabsList className="grid grid-cols-1 w-full sm:w-auto">
//                 <TabsTrigger value="resume">Resumes</TabsTrigger>
//               </TabsList>
//               <TabsContent value="resume">{renderTable(rows)}</TabsContent>
//             </Tabs>
//           )}
//         </div>
//         <Dialog open={reqDialogOpen} onOpenChange={setReqDialogOpen}>
//   <DialogContent
//     className="max-w-3xl"
//     onPointerDownOutside={(e) => e.preventDefault()}
//   >
//     <DialogHeader>
//       <DialogTitle>
//         Requirements — {reqRow?.lead_id ?? ""}
//       </DialogTitle>
//       <DialogDescription>
//         Commitment details captured at sale closure.
//       </DialogDescription>
//     </DialogHeader>

//     <div className="space-y-4">
//       <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
//         <div>
//           <div className="text-xs text-muted-foreground">Lead ID</div>
//           <div className="font-medium">{reqRow?.lead_id ?? "—"}</div>
//         </div>
//         <div>
//           <div className="text-xs text-muted-foreground">Name</div>
//           <div className="font-medium">{reqRow?.leads?.name ?? "—"}</div>
//         </div>
//         <div>
//           <div className="text-xs text-muted-foreground">Email</div>
//           <div className="font-medium break-all">{reqRow?.email ?? "—"}</div>
//         </div>
//         <div>
//           <div className="text-xs text-muted-foreground">Closed At</div>
//           <div className="font-medium">
//             {reqRow?.closed_at ? new Date(reqRow.closed_at).toLocaleDateString("en-GB") : "—"}
//           </div>
//         </div>
//       </div>

//       <div>
//         <div className="text-xs text-muted-foreground mb-1">Commitments</div>
//         <div className="rounded-md border bg-muted/30 p-3 max-h-[50vh] overflow-y-auto whitespace-pre-wrap">
//           {reqRow?.commitments?.trim() ? reqRow.commitments : "—"}
//         </div>
//       </div>
//     </div>

//     <DialogFooter className="gap-2">
//       <Button
//         variant="outline"
//         onClick={async () => {
//           try {
//             await navigator.clipboard.writeText(reqRow?.commitments ?? "");
//           } catch {}
//         }}
//       >
//         Copy Text
//       </Button>
//       <Button onClick={() => setReqDialogOpen(false)}>Close</Button>
//     </DialogFooter>
//   </DialogContent>
// </Dialog>

//       </DashboardLayout>
//     </ProtectedRoute>
//   );
// }




// app/resumeTeam/page.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase/client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useAuth } from "@/components/providers/auth-provider";

/* =========================
   Types & Labels
   ========================= */

type FinanceStatus = "Paid" | "Unpaid" | "Paused" | "Closed" | "Got Placed";

type ResumeStatus = "not_started" | "pending" | "waiting_client_approval" | "completed";
const STATUS_LABEL: Record<ResumeStatus, string> = {
  not_started: "Not started",
  pending: "Pending",
  waiting_client_approval: "Waiting for Client approval",
  completed: "Completed",
};

/** Portfolio status from the technical team (read-only here) */
type PortfolioStatus = "not_started" | "pending" | "waiting_client_approval" | "success";
const PORTFOLIO_STATUS_LABEL: Record<PortfolioStatus, string> = {
  not_started: "Not started",
  pending: "Pending",
  waiting_client_approval: "Waiting for Client approval",
  success: "Success",
};

interface SalesClosure {
  id: string;
  lead_id: string; // TEXT in DB
  email: string;
  finance_status: FinanceStatus;
  closed_at: string | null;
  resume_sale_value?: number | null;
  commitments?: string | null;

  // joined
  leads?: { name: string; phone: string };

  // resume_progress
  rp_status?: ResumeStatus;
  rp_pdf_path?: string | null;
  assigned_to_email?: string | null;
  assigned_to_name?: string | null;

  // portfolio_progress (read-only here)
  pp_status?: PortfolioStatus | null;
  pp_assigned_email?: string | null;
  pp_assigned_name?: string | null;
  pp_link?: string | null;
}

type TeamMember = {
  id: string;
  name: string | null;
  email: string | null;
  role: string | null;
};

const RESUME_COLUMNS = [
  "S.No",
  "Client ID",
  "Name",
  "Email",
  "Phone",
  "Status",
  "Resume Status",
  "Assigned to",
  "Resume PDF",
  "Closed At",
  "Portfolio Status",
  "Portfolio Assignee",
  "client requirements",
] as const;

/* =========================
   Component
   ========================= */

export default function ResumeTeamPage() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<SalesClosure[]>([]);
  const [uploadForLead, setUploadForLead] = useState<string | null>(null);
  const [replacingOldPath, setReplacingOldPath] = useState<string | null>(null);
  const [reqDialogOpen, setReqDialogOpen] = useState(false);
  const [reqRow, setReqRow] = useState<SalesClosure | null>(null);

  // NEW: team members (Resume Head + Resume Associate)
  const [resumeTeamMembers, setResumeTeamMembers] = useState<TeamMember[]>([]);

  const fileRef = useRef<HTMLInputElement | null>(null);
  const router = useRouter();
  const { user } = useAuth();

  /* =========================
     Fetch
     ========================= */

  const fetchData = async () => {
    // 1) rows that have a resume sale
    const { data: sales, error: salesErr } = await supabase
      .from("sales_closure")
      .select("id, lead_id, email, finance_status, closed_at, resume_sale_value, commitments")
      .not("resume_sale_value", "is", null)
      .neq("resume_sale_value", 0);

    if (salesErr) {
      console.error(salesErr);
      return;
    }

    // 2) pick latest per lead_id
    const latestByLead = (rs: any[]) => {
      const map = new Map<string, any>();
      for (const r of rs ?? []) {
        const ex = map.get(r.lead_id);
        const ed = ex?.closed_at ?? "";
        const cd = r?.closed_at ?? "";
        if (!ex || new Date(cd) > new Date(ed)) map.set(r.lead_id, r);
      }
      return Array.from(map.values()).sort(
        (a, b) => new Date(b.closed_at || "").getTime() - new Date(a.closed_at || "").getTime()
      );
    };
    const latest = latestByLead(sales || []);
    const leadIds = latest.map((r) => r.lead_id);

    // 3) join basic lead info
    const { data: leadsData, error: leadsErr } = await supabase
      .from("leads")
      .select("business_id, name, phone")
      .in("business_id", leadIds);

    if (leadsErr) {
      console.error(leadsErr);
      return;
    }
    const leadMap = new Map(leadsData?.map((l) => [l.business_id, { name: l.name, phone: l.phone }]));

    // 4) join resume progress
    const { data: progress, error: progErr } = await supabase
      .from("resume_progress")
      .select("lead_id, status, pdf_path, assigned_to_email, assigned_to_name")
      .in("lead_id", leadIds);

    if (progErr) {
      console.error(progErr);
      return;
    }
    const progMap = new Map(
      (progress ?? []).map((p) => [
        p.lead_id,
        {
          status: p.status as ResumeStatus,
          pdf_path: p.pdf_path ?? null,
          assigned_to_email: p.assigned_to_email ?? null,
          assigned_to_name: p.assigned_to_name ?? null,
        },
      ])
    );

    // 5) join portfolio progress (from Technical Team) — read-only here
    const { data: portfolioProg, error: portErr } = await supabase
      .from("portfolio_progress")
      .select("lead_id, status, assigned_email, assigned_name, link")
      .in("lead_id", leadIds);

    if (portErr) {
      console.error(portErr);
      return;
    }
    const portMap = new Map(
      (portfolioProg ?? []).map((p) => [
        p.lead_id,
        {
          status: (p.status ?? "not_started") as PortfolioStatus,
          assigned_email: p.assigned_email ?? null,
          assigned_name: p.assigned_name ?? null,
          link: p.link ?? null,
        },
      ])
    );

    // 6) NEW: fetch ALL users who are Resume Head / Resume Associate
    const { data: teamUsers, error: teamErr } = await supabase
      .from("profiles")
      .select("user_id, full_name, user_email, roles")
      .in("roles", ["Resume Head", "Resume Associate"])
      .order("full_name", { ascending: true, nullsFirst: false })
      .order("user_email", { ascending: true });

    if (teamErr) {
      console.error("Team fetch error:", JSON.stringify(teamErr));
      setResumeTeamMembers([]);
    } else {
      setResumeTeamMembers(
        (teamUsers ?? []).map((u: any) => ({
          id: u.user_id,
          name: u.full_name,
          email: u.user_email,
          role: u.roles,
        }))
      );
    }

    // 7) merge final rows
    setRows(
      latest.map((r) => ({
        ...r,
        leads: leadMap.get(r.lead_id) || { name: "-", phone: "-" },
        rp_status: progMap.get(r.lead_id)?.status ?? "not_started",
        rp_pdf_path: progMap.get(r.lead_id)?.pdf_path ?? null,
        assigned_to_email: progMap.get(r.lead_id)?.assigned_to_email ?? null,
        assigned_to_name: progMap.get(r.lead_id)?.assigned_to_name ?? null,
        pp_status: portMap.get(r.lead_id)?.status ?? "not_started",
        pp_assigned_email: portMap.get(r.lead_id)?.assigned_email ?? null,
        pp_assigned_name: portMap.get(r.lead_id)?.assigned_name ?? null,
        pp_link: portMap.get(r.lead_id)?.link ?? null,
      }))
    );
  };

  /* =========================
     Gate
     ========================= */

  useEffect(() => {
    if (user === null) return;
    const allowed = ["Super Admin", "Resume Head", "Resume Associate"] as const;
    if (!user || !allowed.includes(user.role as any)) {
      router.push("/unauthorized");
      return;
    }
    setLoading(false);
  }, [user, router]);

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  /* =========================
     PDF store helpers (Bucket + Optional DB copy)
     ========================= */

  const BUCKET = "resumes"; // must match your bucket name exactly
  const ENABLE_DB_COPY = false; // set true ONLY if you've created public.resume_files (see helper below)

  const ensurePdf = (file: File) => {
    if (file.type !== "application/pdf") throw new Error("Please select a PDF file.");
    if (file.size > 20 * 1024 * 1024) throw new Error("Max file size is 20MB.");
  };

  const cleanName = (name: string) => name.replace(/[^\w.\-]+/g, "_");

  const fileToHexBytea = async (file: File) => {
    const buf = await file.arrayBuffer();
    const bytes = new Uint8Array(buf);
    let hex = "";
    for (let i = 0; i < bytes.length; i++) hex += bytes[i].toString(16).padStart(2, "0");
    return "\\x" + hex;
  };

  // Upload or replace: Storage -> (optional) delete old -> upsert resume_progress -> (optional) DB copy
  const uploadOrReplaceResume = async (leadId: string, file: File, previousPath?: string | null) => {
    ensurePdf(file);

    const path = `${leadId}/${Date.now()}_${cleanName(file.name)}`.replace(/^\/+/, "");

    // 1) Storage upload
    const up = await supabase.storage.from(BUCKET).upload(path, file, {
      cacheControl: "3600",
      upsert: true,
      contentType: "application/pdf",
    });
    if (up.error) {
      console.error("STORAGE UPLOAD ERROR:", up.error);
      throw new Error(up.error.message || "Upload to Storage failed");
    }

    // 2) Remove old blob if it was under same lead folder
    if (previousPath && previousPath.startsWith(`${leadId}/`)) {
      const del = await supabase.storage.from(BUCKET).remove([previousPath]);
      if (del.error) console.warn("STORAGE REMOVE WARNING:", del.error);
    }

    // 3) Upsert progress row (this is where table RLS could fail)
    const db = await supabase
      .from("resume_progress")
      .upsert(
        {
          lead_id: leadId,
          status: "completed",
          pdf_path: path,
          pdf_uploaded_at: new Date().toISOString(),
        },
        { onConflict: "lead_id" }
      );
    if (db.error) {
      console.error("DB UPSERT ERROR resume_progress:", db.error);
      throw new Error(db.error.message || "DB upsert failed");
    }

    // 4) (Optional) also persist file bytes in a table for backup/audit
    if (ENABLE_DB_COPY) {
      try {
        const bytea = await fileToHexBytea(file);
        const ins = await supabase.from("resume_files").insert({
          lead_id: leadId,
          filename: cleanName(file.name),
          mime: "application/pdf",
          size_bytes: file.size,
          content: bytea,
        });
        if (ins.error) console.error("DB COPY INSERT ERROR resume_files:", ins.error);
      } catch (e) {
        console.error("DB COPY CONVERSION ERROR:", e);
      }
    }

    const publicUrl = supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
    return { path, publicUrl };
  };

  // const downloadPublicPdf = async (path: string) => {
  //   const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  //   if (!data?.publicUrl) return;
  //   const a = document.createElement("a");
  //   a.href = data.publicUrl;
  //   a.download = path.split("/").pop() || "resume.pdf";
  //   document.body.appendChild(a);
  //   a.click();
  //   a.remove();
  // };

   // Always download as "resume-<lead_id>.pdf"
const downloadResume = async (path: string) => {
  try {
    // lead_id is the first segment of the storage path: "<lead_id>/<timestamp>_file.pdf"
    const segments = (path || "").split("/");
    const leadId = segments[0] || "unknown";
    const fileName = `Resume-${leadId}.pdf`;

    // Get a signed URL (works for public or RLS-protected buckets)
    const { data, error } = await supabase.storage
      .from("resumes")
      .createSignedUrl(path, 60 * 60); // 1 hour

    if (error) throw error;
    if (!data?.signedUrl) throw new Error("No signed URL");

    // Fetch the file and trigger a client-side download with our custom filename
    const res = await fetch(data.signedUrl);
    if (!res.ok) throw new Error(`Download failed (${res.status})`);
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = fileName; // 👈 force name = resume-<lead_id>.pdf
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(objectUrl);
  } catch (e: any) {
    alert(e?.message || "Could not download PDF");
  }
};

  /* =========================
     Resume status & assignment
     ========================= */

  const updateStatus = async (leadId: string, status: ResumeStatus) => {
    const { error } = await supabase.from("resume_progress").upsert({ lead_id: leadId, status }, { onConflict: "lead_id" });
    if (error) throw error;
  };

  const updateAssignedTo = async (leadId: string, email: string | null, name?: string | null) => {
    // does a row exist?
    const { data: existingRows, error: findErr } = await supabase.from("resume_progress").select("id").eq("lead_id", leadId);
    if (findErr) throw findErr;

    if (existingRows && existingRows.length > 0) {
      const { error: updErr } = await supabase
        .from("resume_progress")
        .update({ assigned_to_email: email, assigned_to_name: name ?? null })
        .eq("lead_id", leadId);
      if (updErr) throw updErr;
    } else {
      const { error: insErr } = await supabase
        .from("resume_progress")
        .insert({ lead_id: leadId, assigned_to_email: email, assigned_to_name: name ?? null });
      if (insErr) throw insErr;
    }
  };

  // Handle change in status select
  const onChangeStatus = async (row: SalesClosure, newStatus: ResumeStatus) => {
    try {
      await updateStatus(row.lead_id, newStatus);

      if (newStatus === "completed" && !row.rp_pdf_path) {
        // Ask for a file only if there's no PDF yet
        setUploadForLead(row.lead_id);
        setReplacingOldPath(null);
        fileRef.current?.click();
      } else {
        setRows((rs) => rs.map((r) => (r.lead_id === row.lead_id ? { ...r, rp_status: newStatus } : r)));
      }
    } catch (e: any) {
      alert(e.message || "Failed to update status");
    }
  };

  // Handle click on Replace button
  const onReplacePdf = (row: SalesClosure) => {
    setUploadForLead(row.lead_id);
    setReplacingOldPath(row.rp_pdf_path ?? null);
    fileRef.current?.click();
  };

  // Single hidden file input shared by all rows
  const onFilePicked = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    const leadId = uploadForLead;
    const oldPath = replacingOldPath;
    e.target.value = "";
    setUploadForLead(null);
    setReplacingOldPath(null);

    if (!file || !leadId) return;

    try {
      const { path } = await uploadOrReplaceResume(leadId, file, oldPath || undefined);
      // reflect in UI
      await fetchData();
      // or optimistic:
      // setRows(rs => rs.map(r => r.lead_id === leadId ? ({ ...r, rp_status: "completed", rp_pdf_path: path }) : r));
      alert("PDF uploaded.");
    } catch (err: any) {
      alert(err.message || "Upload failed");
    }
  };

  /* =========================
     UI
     ========================= */

  const renderTable = (data: SalesClosure[]) => (
    <div className="rounded-md border mt-4">
      <input ref={fileRef} type="file" accept="application/pdf" className="hidden" onChange={onFilePicked} />

      <Table>
        <TableHeader>
          <TableRow>
            {RESUME_COLUMNS.map((c) => (
              <TableHead key={c}>{c}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, index) => (
            <TableRow key={row.id}>
              <TableCell className="text-center">{index + 1}</TableCell>
              <TableCell>{row.lead_id}</TableCell>
              <TableCell>{row.leads?.name || "-"}</TableCell>
              <TableCell>{row.email}</TableCell>
              <TableCell>{row.leads?.phone || "-"}</TableCell>
              <TableCell>{row.finance_status}</TableCell>

              {/* Resume Status */}
              <TableCell className="min-w-[220px]">
                <Select value={row.rp_status || "not_started"} onValueChange={(v) => onChangeStatus(row, v as ResumeStatus)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {(["not_started", "pending", "waiting_client_approval", "completed"] as ResumeStatus[]).map((s) => (
                      <SelectItem key={s} value={s}>
                        {STATUS_LABEL[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableCell>

              {/* Assigned to */}
              <TableCell className="min-w-[260px]">
                <Select
                  value={row.assigned_to_email ?? "__none__"}
                  onValueChange={async (value) => {
                    try {
                      const chosen = value === "__none__" ? null : value;
                      const member = resumeTeamMembers.find((u) => u.email === chosen) || null;
                      await updateAssignedTo(row.lead_id, chosen, member?.name ?? null);
                      setRows((rs) =>
                        rs.map((r) =>
                          r.lead_id === row.lead_id
                            ? { ...r, assigned_to_email: chosen, assigned_to_name: member?.name ?? null }
                            : r
                        )
                      );
                    } catch (e: any) {
                      console.error("Assign failed:", e);
                      alert(e.message || "Failed to assign");
                    }
                  }}
                  disabled={user?.role == "Resume Associate"}
                >
                  <SelectTrigger className="!opacity-100 bg-muted/20 text-foreground">
                    <SelectValue placeholder="Assign to…" />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    <SelectItem value="__none__">Unassigned</SelectItem>
                    {resumeTeamMembers.length === 0 ? (
                      <SelectItem value="__disabled__" disabled>
                        No team members found
                      </SelectItem>
                    ) : (
                      resumeTeamMembers.map((u) => (
                        <SelectItem key={u.id} value={u.email ?? ""} disabled={!u.email}>
                          {u.name} — {u.role}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </TableCell>

              {/* Resume PDF */}
              <TableCell className="space-x-2 min-w-[220px]">
                {row.rp_pdf_path ? (
                  <>
                  
                  <Button variant="outline" size="sm" onClick={() => downloadResume(row.rp_pdf_path!)}>
  Download
</Button>

                    <Button variant="secondary" size="sm" onClick={() => onReplacePdf(row)}>
                      Replace
                    </Button>
                  </>
                ) : row.rp_status === "completed" ? (
                  <Button
                    size="sm"
                    onClick={() => {
                      setUploadForLead(row.lead_id);
                      setReplacingOldPath(null);
                      fileRef.current?.click();
                    }}
                  >
                    Upload PDF
                  </Button>
                ) : (
                  <span className="text-gray-400 text-sm">—</span>
                )}
              </TableCell>

              {/* <TableCell className="space-x-2 min-w-[220px]">
  {row.rp_pdf_path ? (
    <>
      <a
        href={row.rp_pdf_path}
        target="_blank"
        rel="noopener noreferrer"
      >
        <Button variant="outline" size="sm">
          Open PDF
        </Button>
      </a>

      <Button variant="secondary" size="sm" onClick={() => onReplacePdf(row)}>
        Replace
      </Button>
    </>
  ) : row.rp_status === "completed" ? (
    <Button
      size="sm"
      onClick={() => {
        setUploadForLead(row.lead_id);
        setReplacingOldPath(null);
        fileRef.current?.click();
      }}
    >
      Upload PDF
    </Button>
  ) : (
    <span className="text-gray-400 text-sm">—</span>
  )}
</TableCell>
 */}

              {/* Closed At */}
              <TableCell>{row.closed_at ? new Date(row.closed_at).toLocaleDateString("en-GB") : "-"}</TableCell>

              {/* Portfolio Status (from portfolio_progress) */}
              <TableCell>
                {row.pp_status === "success" && row.pp_link ? (
                  <a
                    href={row.pp_link}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 underline break-all"
                    title="Open portfolio link"
                  >
                    {row.pp_link}
                  </a>
                ) : (
                  PORTFOLIO_STATUS_LABEL[(row.pp_status ?? "not_started") as PortfolioStatus]
                )}
              </TableCell>

              {/* Portfolio Assignee */}
              <TableCell>
                {row.pp_assigned_name
                  ? `${row.pp_assigned_name}${row.pp_assigned_email ? ` • ${row.pp_assigned_email}` : ""}`
                  : row.pp_assigned_email || <span className="text-gray-400 text-sm">—</span>}
              </TableCell>

              {/* Commitments */}
              <TableCell className="min-w-[140px] text-center">
                {row.commitments?.trim() ? (
                  <Button
                    className="bg-gray-900 hover:bg-gray-400 text-white"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setReqRow(row);
                      setReqDialogOpen(true);
                    }}
                  >
                    Requirements
                  </Button>
                ) : (
                  <span className="text-gray-400 text-sm">—</span>
                )}
              </TableCell>
            </TableRow>
          ))}
          {data.length === 0 && (
            <TableRow>
              <TableCell colSpan={RESUME_COLUMNS.length} className="text-center text-sm text-muted-foreground py-10">
                No records found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <ProtectedRoute allowedRoles={["Super Admin", "Resume Head", "Resume Associate"]}>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">Resume Page</h1>
          </div>

          {loading ? (
            <p className="p-6 text-gray-600">Loading...</p>
          ) : (
            <Tabs defaultValue="resume" className="w-full">
              <TabsList className="grid grid-cols-1 w-full sm:w-auto">
                <TabsTrigger value="resume">Resumes</TabsTrigger>
              </TabsList>
              <TabsContent value="resume">{renderTable(rows)}</TabsContent>
            </Tabs>
          )}
        </div>

        <Dialog open={reqDialogOpen} onOpenChange={setReqDialogOpen}>
          <DialogContent className="max-w-3xl" onPointerDownOutside={(e) => e.preventDefault()}>
            <DialogHeader>
              <DialogTitle>Requirements — {reqRow?.lead_id ?? ""}</DialogTitle>
              <DialogDescription>Commitment details captured at sale closure.</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <div className="text-xs text-muted-foreground">Lead ID</div>
                  <div className="font-medium">{reqRow?.lead_id ?? "—"}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Name</div>
                  <div className="font-medium">{reqRow?.leads?.name ?? "—"}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Email</div>
                  <div className="font-medium break-all">{reqRow?.email ?? "—"}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Closed At</div>
                  <div className="font-medium">
                    {reqRow?.closed_at ? new Date(reqRow.closed_at).toLocaleDateString("en-GB") : "—"}
                  </div>
                </div>
              </div>

              <div>
                <div className="text-xs text-muted-foreground mb-1">Commitments</div>
                <div className="rounded-md border bg-muted/30 p-3 max-h-[50vh] overflow-y-auto whitespace-pre-wrap">
                  {reqRow?.commitments?.trim() ? reqRow.commitments : "—"}
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(reqRow?.commitments ?? "");
                  } catch {}
                }}
              >
                Copy Text
              </Button>
              <Button onClick={() => setReqDialogOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

/*
OPTIONAL table to keep a DB copy of each PDF (set ENABLE_DB_COPY=true to use):

create table if not exists public.resume_files (
  id bigserial primary key,
  lead_id text not null,
  filename text not null,
  mime text not null,
  size_bytes int8 not null,
  content bytea not null,
  uploaded_at timestamptz not null default now()
);
*/
