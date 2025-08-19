
// //app/// resumeTeam/page.tsx
// "use client";

// import { useEffect, useState } from "react";
// import { useRouter } from "next/navigation";
// import { supabase } from "@/utils/supabase/client";
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
// import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
// import ProtectedRoute from "@/components/auth/ProtectedRoute";
// import { DashboardLayout } from "@/components/layout/dashboard-layout";
// import { useAuth } from "@/components/providers/auth-provider";

// type FinanceStatus = "Paid" | "Unpaid" | "Paused" | "Closed" | "Got Placed";

// interface SalesClosure {
//   id: string;
//   lead_id: string;
//   email: string;
//   finance_status: FinanceStatus;
//   closed_at: string;
//   resume_sale_value?: number | null;
//   // github_sale_value?: number | null;
//   leads?: { name: string; phone: string };
// }

// // ✅ move columns outside the component (no hooks)
// const RESUME_COLUMNS = ["Client ID", "Name", "Email", "Phone", "Status", "Closed At"] as const;
// // const GITHUB_COLUMNS    = ["Client ID", "Name", "Email", "Phone", "Status", "GitHub Sale", "Closed At"] as const;

// export default function TechnicalPage() {
//   const [loading, setLoading] = useState(true);
//   const [resumeRows, setresumeRows] = useState<SalesClosure[]>([]);
//   const [githubRows, setGithubRows] = useState<SalesClosure[]>([]);
//   const { user, hasAccess } = useAuth();
//   const router = useRouter();

//   const fetchBoth = async () => {
//     if (!user) return;

//     let qresume = supabase
//       .from("sales_closure")
//       .select("*")
//       .not("resume_sale_value", "is", null)
//       .neq("resume_sale_value", 0);

//     let qGithub = supabase
//       .from("sales_closure")
//       .select("*")
//       .not("github_sale_value", "is", null)
//       .neq("github_sale_value", 0);

//     if (user.role === "Technical Associate" || user.role === "Finance Associate") {
//       qresume = qresume.eq("associates_email", user.email);
//       qGithub = qGithub.eq("associates_email", user.email);
//     }

//     const [{ data: pData, error: pErr }, { data: gData, error: gErr }] = await Promise.all([qresume, qGithub]);
//     if (pErr || gErr) {
//       console.error("Failed to fetch sales data:", pErr || gErr);
//       return;
//     }

//     const latestByLead = (rows: SalesClosure[]) => {
//       const map = new Map<string, SalesClosure>();
//       for (const r of rows ?? []) {
//         const ex = map.get(r.lead_id);
//         const ed = ex?.closed_at ?? "";
//         const cd = r?.closed_at ?? "";
//         if (!ex || new Date(cd) > new Date(ed)) map.set(r.lead_id, r);
//       }
//       return Array.from(map.values()).sort(
//         (a, b) => new Date(b.closed_at || "").getTime() - new Date(a.closed_at || "").getTime()
//       );
//     };

//     const pLatest = latestByLead((pData as SalesClosure[]) ?? []);
//     const gLatest = latestByLead((gData as SalesClosure[]) ?? []);

//     const allLeadIds = Array.from(new Set([...pLatest, ...gLatest].map((r) => r.lead_id)));
//     const { data: leadsData, error: leadsError } = await supabase
//       .from("leads")
//       .select("business_id, name, phone")
//       .in("business_id", allLeadIds);

//     if (leadsError) {
//       console.error("Failed to fetch leads:", leadsError);
//       return;
//     }
//     const leadMap = new Map(leadsData?.map((l) => [l.business_id, { name: l.name, phone: l.phone }]));

//     setresumeRows(pLatest.map((r) => ({ ...r, leads: leadMap.get(r.lead_id) || { name: "-", phone: "-" } })));
//     setGithubRows(gLatest.map((r) => ({ ...r, leads: leadMap.get(r.lead_id) || { name: "-", phone: "-" } })));
//   };

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
//   if (!user) return;
//   const allowed = new Set(["Super Admin", "Resume Head", "Resume Associate"]);
//   if (allowed.has(user.role as any)) fetchBoth();
// }, [user]);

//   const renderTable = (rows: SalesClosure[], which: "resume" | "github") => {
//     // const columns = which === "resume" ? RESUME_COLUMNS : GITHUB_COLUMNS;
//     return (
//       <div className="rounded-md border mt-4">
//         <Table>
//           <TableHeader>
//             <TableRow>
//               {RESUME_COLUMNS.map((c) => (
//                 <TableHead key={c}>{c}</TableHead>
//               ))}
//             </TableRow>
//           </TableHeader>
//           <TableBody>
//             {rows.map((sale) => (
//               <TableRow key={sale.id}>
//                 <TableCell>{sale.lead_id}</TableCell>
//                 <TableCell>{sale.leads?.name || "-"}</TableCell>
//                 <TableCell>{sale.email}</TableCell>
//                 <TableCell>{sale.leads?.phone || "-"}</TableCell>
//                 <TableCell>{sale.finance_status}</TableCell>
             
//                   {/* <TableCell>{sale.resume_sale_value ?? "-"}</TableCell> */}
               
//                 <TableCell>{sale.closed_at ? new Date(sale.closed_at).toLocaleDateString("en-GB") : "-"}</TableCell>
//               </TableRow>
//             ))}
//             {rows.length === 0 && (
//               <TableRow>
//                 <TableCell colSpan={RESUME_COLUMNS.length} className="text-center text-sm text-muted-foreground py-10">
//                   No records found.
//                 </TableCell>
//               </TableRow>
//             )}
//           </TableBody>
//         </Table>
//       </div>
//     );
//   };

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
//                 {/* <TabsTrigger value="github">GitHub</TabsTrigger> */}
//               </TabsList>

//               <TabsContent value="resume">{renderTable(resumeRows, "resume")}</TabsContent>
//               {/* <TabsContent value="github">{renderTable(githubRows, "github")}</TabsContent> */}
//             </Tabs>
//           )}
//         </div>
//       </DashboardLayout>
//     </ProtectedRoute>
//   );
// }



// // app/resumeTeam/page.tsx
// "use client";

// import { useEffect, useMemo, useRef, useState } from "react";
// import { useRouter } from "next/navigation";
// import { supabase } from "@/utils/supabase/client";

// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
// import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { Button } from "@/components/ui/button";

// import ProtectedRoute from "@/components/auth/ProtectedRoute";
// import { DashboardLayout } from "@/components/layout/dashboard-layout";
// import { useAuth } from "@/components/providers/auth-provider";

// type FinanceStatus = "Paid" | "Unpaid" | "Paused" | "Closed" | "Got Placed";

// // resume status values must match the DB enum
// type ResumeStatus = "not_started" | "pending" | "waiting_client_approval" | "completed";

// const STATUS_LABEL: Record<ResumeStatus, string> = {
//   not_started: "Not started",
//   pending: "Pending",
//   waiting_client_approval: "Waiting for Client approval",
//   completed: "Completed",
// };

// interface SalesClosure {
//   id: string;
//   lead_id: string;
//   email: string;
//   finance_status: FinanceStatus;
//   closed_at: string | null;
//   resume_sale_value?: number | null;
//   leads?: { name: string; phone: string };
//   // attached progress (joined from resume_progress)
//   rp_status?: ResumeStatus;
//   rp_pdf_path?: string | null;
// }

// // Columns now include the 2 new ones
// const RESUME_COLUMNS = [
//   "Client ID",
//   "Name",
//   "Email",
//   "Phone",
//   "Status",
//   "Resume Status",
//   "Resume PDF",
//   "Closed At",
// ] as const;

// export default function ResumeTeamPage() {
//   const [loading, setLoading] = useState(true);
//   const [rows, setRows] = useState<SalesClosure[]>([]);
//   const { user } = useAuth();
//   const router = useRouter();

//   // single hidden file input for uploads
//   const fileRef = useRef<HTMLInputElement | null>(null);
//   const [uploadForLead, setUploadForLead] = useState<string | null>(null);

//   // ---------- Data fetch ----------
//   const fetchData = async () => {
//     if (!user) return;

//     // 1) get sales_closure that have resume sales
//     let qResume = supabase
//       .from("sales_closure")
//       .select("*")
//       .not("resume_sale_value", "is", null)
//       .neq("resume_sale_value", 0);

//     // If you want to scope by associate email, add it back here.
//     // (Heads usually see all; Associates can be filtered by email.)
//     // Example:
//     // if (user.role === "Resume Associate") {
//     //   qResume = qResume.eq("associates_email", user.email);
//     // }

//     const { data: sales, error: salesErr } = await qResume;
//     if (salesErr) {
//       console.error(salesErr);
//       return;
//     }

//     // 2) pick the latest per lead_id
//     const latestByLead = (rows: any[]) => {
//       const map = new Map<string, any>();
//       for (const r of rows ?? []) {
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

//     // 3) fetch basic lead info
//     const { data: leadsData, error: leadsErr } = await supabase
//       .from("leads")
//       .select("business_id, name, phone")
//       .in("business_id", leadIds);

//     if (leadsErr) {
//       console.error(leadsErr);
//       return;
//     }
//     const leadMap = new Map(leadsData?.map((l) => [l.business_id, { name: l.name, phone: l.phone }]));

//     // 4) fetch resume progress for those leads
//     const { data: progress, error: progErr } = await supabase
//       .from("resume_progress")
//       .select("lead_id, status, pdf_path")
//       .in("lead_id", leadIds);

//     if (progErr) {
//       console.error(progErr);
//       return;
//     }
//     const progMap = new Map(progress?.map((p) => [p.lead_id, { status: p.status as ResumeStatus, pdf_path: p.pdf_path }]));

//     // 5) merge
//     const merged: SalesClosure[] = latest.map((r) => ({
//       ...r,
//       leads: leadMap.get(r.lead_id) || { name: "-", phone: "-" },
//       rp_status: progMap.get(r.lead_id)?.status ?? "not_started",
//       rp_pdf_path: progMap.get(r.lead_id)?.pdf_path ?? null,
//     }));

//     setRows(merged);
//   };

//   // gate by role
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

//   // ---------- Actions ----------
//   const upsertStatus = async (leadId: string, status: ResumeStatus) => {
//     const { error } = await supabase
//       .from("resume_progress")
//       .upsert({ lead_id: leadId, status }, { onConflict: "lead_id" });
//     if (error) throw error;
//   };

//   const uploadPdf = async (leadId: string, file: File) => {
//     if (file.type !== "application/pdf") throw new Error("Please select a PDF file.");
//     if (file.size > 20 * 1024 * 1024) throw new Error("Max file size is 20MB."); // safety

//     const sanitized = file.name.replace(/\s+/g, "_");
//     const path = `${leadId}/${Date.now()}_${sanitized}`;

//     const { error: upErr } = await supabase
//       .storage
//       .from("resumes")
//       .upload(path, file, { cacheControl: "3600", upsert: true, contentType: "application/pdf" });
//     if (upErr) throw upErr;

//     const { error: dbErr } = await supabase
//       .from("resume_progress")
//       .upsert(
//         { lead_id: leadId, status: "completed", pdf_path: path, pdf_uploaded_at: new Date().toISOString() },
//         { onConflict: "lead_id" }
//       );
//     if (dbErr) throw dbErr;
//   };

//   const handleStatusChange = async (leadId: string, newStatus: ResumeStatus, currentPdf: string | null) => {
//     try {
//       await upsertStatus(leadId, newStatus);

//       // if completed and no pdf yet, ask for one
//       if (newStatus === "completed" && !currentPdf) {
//         setUploadForLead(leadId);
//         fileRef.current?.click();
//       } else {
//         // update UI immediately
//         setRows((rs) => rs.map(r => r.lead_id === leadId ? { ...r, rp_status: newStatus } : r));
//       }
//     } catch (e: any) {
//       alert(e.message || "Failed to update status");
//     }
//   };

//   const onFileChosen = async (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     const leadId = uploadForLead;
//     // reset input so selecting same file again works later
//     e.target.value = "";
//     setUploadForLead(null);

//     if (!file || !leadId) return;

//     try {
//       await uploadPdf(leadId, file);
//       await fetchData();
//       alert("PDF uploaded.");
//     } catch (err: any) {
//       alert(err.message || "Upload failed");
//     }
//   };

//   const openSignedPdf = async (path: string) => {
//     try {
//       const { data, error } = await supabase.storage.from("resumes").createSignedUrl(path, 60 * 60); // 1 hour
//       if (error) throw error;
//       if (data?.signedUrl) window.open(data.signedUrl, "_blank");
//     } catch (e: any) {
//       alert(e.message || "Could not open PDF");
//     }
//   };

//   // ---------- UI ----------
//   const renderTable = (data: SalesClosure[]) => {
//     return (
//       <div className="rounded-md border mt-4">
//         {/* hidden file input for all uploads */}
//         <input
//           ref={fileRef}
//           type="file"
//           accept="application/pdf"
//           className="hidden"
//           onChange={onFileChosen}
//         />

//         <Table>
//           <TableHeader>
//             <TableRow>
//               {RESUME_COLUMNS.map((c) => (
//                 <TableHead key={c}>{c}</TableHead>
//               ))}
//             </TableRow>
//           </TableHeader>
//           <TableBody>
//             {data.map((row) => (
//               <TableRow key={row.id}>
//                 <TableCell>{row.lead_id}</TableCell>
//                 <TableCell>{row.leads?.name || "-"}</TableCell>
//                 <TableCell>{row.email}</TableCell>
//                 <TableCell>{row.leads?.phone || "-"}</TableCell>
//                 <TableCell>{row.finance_status}</TableCell>

//                 {/* Resume Status */}
//                 <TableCell className="min-w-[220px]">
//                   <Select
//                     value={row.rp_status || "not_started"}
//                     onValueChange={(v) => handleStatusChange(row.lead_id, v as ResumeStatus, row.rp_pdf_path || null)}
//                   >
//                     <SelectTrigger>
//                       <SelectValue placeholder="Select status" />
//                     </SelectTrigger>
//                     <SelectContent>
//                       {(
//                         ["not_started", "pending", "waiting_client_approval", "completed"] as ResumeStatus[]
//                       ).map((s) => (
//                         <SelectItem key={s} value={s}>
//                           {STATUS_LABEL[s]}
//                         </SelectItem>
//                       ))}
//                     </SelectContent>
//                   </Select>
//                 </TableCell>

//                 {/* Resume PDF */}
//                 <TableCell className="space-x-2">
//                   {row.rp_pdf_path ? (
//                     <>
//                       <Button variant="outline" size="sm" onClick={() => openSignedPdf(row.rp_pdf_path!)}>
//                         View PDF
//                       </Button>
//                       <Button
//                         variant="secondary"
//                         size="sm"
//                         onClick={() => {
//                           setUploadForLead(row.lead_id);
//                           fileRef.current?.click();
//                         }}
//                       >
//                         Replace
//                       </Button>
//                     </>
//                   ) : row.rp_status === "completed" ? (
//                     <Button
//                       size="sm"
//                       onClick={() => {
//                         setUploadForLead(row.lead_id);
//                         fileRef.current?.click();
//                       }}
//                     >
//                       Upload PDF
//                     </Button>
//                   ) : (
//                     <span className="text-gray-400 text-sm">—</span>
//                   )}
//                 </TableCell>

//                 <TableCell>
//                   {row.closed_at ? new Date(row.closed_at).toLocaleDateString("en-GB") : "-"}
//                 </TableCell>
//               </TableRow>
//             ))}
//             {data.length === 0 && (
//               <TableRow>
//                 <TableCell colSpan={RESUME_COLUMNS.length} className="text-center text-sm text-muted-foreground py-10">
//                   No records found.
//                 </TableCell>
//               </TableRow>
//             )}
//           </TableBody>
//         </Table>
//       </div>
//     );
//   };

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
//       </DashboardLayout>
//     </ProtectedRoute>
//   );
// }





// // app/resumeTeam/page.tsx
// "use client";

// import { useEffect, useRef, useState } from "react";
// import { useRouter } from "next/navigation";
// import { supabase } from "@/utils/supabase/client";

// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
// import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { Button } from "@/components/ui/button";

// import ProtectedRoute from "@/components/auth/ProtectedRoute";
// import { DashboardLayout } from "@/components/layout/dashboard-layout";
// import { useAuth } from "@/components/providers/auth-provider";

// type FinanceStatus = "Paid" | "Unpaid" | "Paused" | "Closed" | "Got Placed";
// type ResumeStatus = "not_started" | "pending" | "waiting_client_approval" | "completed";

// const STATUS_LABEL: Record<ResumeStatus, string> = {
//   not_started: "Not started",
//   pending: "Pending",
//   waiting_client_approval: "Waiting for Client approval",
//   completed: "Completed",
// };

// interface SalesClosure {
//   id: string;
//   lead_id: string;
//   email: string;
//   finance_status: FinanceStatus;
//   closed_at: string | null;
//   resume_sale_value?: number | null;
//   leads?: { name: string; phone: string };
//   rp_status?: ResumeStatus;
//   rp_pdf_path?: string | null;
// }

// const RESUME_COLUMNS = [
//   "Client ID",
//   "Name",
//   "Email",
//   "Phone",
//   "Status",
//   "Resume Status",
//   "Resume PDF",
//   "Closed At",
// ] as const;

// export default function ResumeTeamPage() {
//   const [loading, setLoading] = useState(true);
//   const [rows, setRows] = useState<SalesClosure[]>([]);
//   const [uploadForLead, setUploadForLead] = useState<string | null>(null);
//   const [replacingOldPath, setReplacingOldPath] = useState<string | null>(null);

//   const fileRef = useRef<HTMLInputElement | null>(null);
//   const router = useRouter();
//   const { user } = useAuth();

//   // ---------- Fetch ----------
//   const fetchData = async () => {
//     // 1) rows that have a resume sale
//     const { data: sales, error: salesErr } = await supabase
//       .from("sales_closure")
//       .select("*")
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
//       .select("lead_id, status, pdf_path")
//       .in("lead_id", leadIds);

//     if (progErr) {
//       console.error(progErr);
//       return;
//     }
//     const progMap = new Map(progress?.map((p) => [p.lead_id, { status: p.status as ResumeStatus, pdf_path: p.pdf_path }]));

//     // 5) merge
//     setRows(
//       latest.map((r) => ({
//         ...r,
//         leads: leadMap.get(r.lead_id) || { name: "-", phone: "-" },
//         rp_status: progMap.get(r.lead_id)?.status ?? "not_started",
//         rp_pdf_path: progMap.get(r.lead_id)?.pdf_path ?? null,
//       }))
//     );
//   };

//   // ---------- Gate ----------
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

//   // ---------- PDF store helpers ----------
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
//     const { error: upErr } = await supabase
//       .storage
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
//       const path = await uploadPdf(leadId, file, oldPath || undefined);
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

//   // ---------- UI ----------
//   const renderTable = (data: SalesClosure[]) => (
//     <div className="rounded-md border mt-4">
//       <input
//         ref={fileRef}
//         type="file"
//         accept="application/pdf"
//         className="hidden"
//         onChange={onFilePicked}
//       />

//       <Table>
//         <TableHeader>
//           <TableRow>
//             {RESUME_COLUMNS.map((c) => (
//               <TableHead key={c}>{c}</TableHead>
//             ))}
//           </TableRow>
//         </TableHeader>
//         <TableBody>
//           {data.map((row) => (
//             <TableRow key={row.id}>
//               <TableCell>{row.lead_id}</TableCell>
//               <TableCell>{row.leads?.name || "-"}</TableCell>
//               <TableCell>{row.email}</TableCell>
//               <TableCell>{row.leads?.phone || "-"}</TableCell>
//               <TableCell>{row.finance_status}</TableCell>

//               {/* Resume Status */}
//               <TableCell className="min-w-[220px]">
//                 <Select
//                   value={row.rp_status || "not_started"}
//                   onValueChange={(v) => onChangeStatus(row, v as ResumeStatus)}
//                 >
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

//               {/* Resume PDF */}
//               <TableCell className="space-x-2">
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
//                   <Button size="sm" onClick={() => { setUploadForLead(row.lead_id); setReplacingOldPath(null); fileRef.current?.click(); }}>
//                     Upload PDF
//                   </Button>
//                 ) : (
//                   <span className="text-gray-400 text-sm">—</span>
//                 )}
//               </TableCell>

//               <TableCell>{row.closed_at ? new Date(row.closed_at).toLocaleDateString("en-GB") : "-"}</TableCell>
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
//       </DashboardLayout>
//     </ProtectedRoute>
//   );
// }

// // app/resumeTeam/page.tsx
// "use client";

// import { useEffect, useRef, useState } from "react";
// import { useRouter } from "next/navigation";
// import { supabase } from "@/utils/supabase/client";

// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
// import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

//   // joined
//   leads?: { name: string; phone: string };

//   // resume_progress
//   rp_status?: ResumeStatus;
//   rp_pdf_path?: string | null;

//   // portfolio_progress (from technical team) — READ ONLY in this page
//   pp_status?: PortfolioStatus | null;
//   pp_assigned_email?: string | null;
//   pp_assigned_name?: string | null;
//   pp_link?: string | null; // link to portfolio, if available 
// }

// const RESUME_COLUMNS = [
//   "Client ID",
//   "Name",
//   "Email",
//   "Phone",
//   "Status",
//   "Resume Status",
//   "Resume PDF",
//   "Closed At",
//   // NEW (reflect what Technical Team updated)
//   "Portfolio Status",
//   "Portfolio Assignee",
// ] as const;

// /* =========================
//    Component
//    ========================= */

// export default function ResumeTeamPage() {
//   const [loading, setLoading] = useState(true);
//   const [rows, setRows] = useState<SalesClosure[]>([]);
//   const [uploadForLead, setUploadForLead] = useState<string | null>(null);
//   const [replacingOldPath, setReplacingOldPath] = useState<string | null>(null);

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
//       .select("id, lead_id, email, finance_status, closed_at, resume_sale_value")
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
//       .select("lead_id, status, pdf_path")
//       .in("lead_id", leadIds);

//     if (progErr) {
//       console.error(progErr);
//       return;
//     }
//     const progMap = new Map(
//       (progress ?? []).map((p) => [p.lead_id, { status: p.status as ResumeStatus, pdf_path: p.pdf_path ?? null }])
//     );

//     // 5) join portfolio progress (from Technical Team) — read-only here
//     const { data: portfolioProg, error: portErr } = await supabase
//       .from("portfolio_progress")
//       .select("lead_id, status, assigned_email, assigned_name, link")
//       .in("lead_id", leadIds);
// console.log(portfolioProg, portErr);
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
//                 link: p.link ?? null, // ✅ keep link

//         },
//       ])
//     );

//     // 6) merge
//     setRows(
//       latest.map((r) => ({
//         ...r,
//         leads: leadMap.get(r.lead_id) || { name: "-", phone: "-" },
//         rp_status: progMap.get(r.lead_id)?.status ?? "not_started",
//         rp_pdf_path: progMap.get(r.lead_id)?.pdf_path ?? null,

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
//           {data.map((row) => (
//             <TableRow key={row.id}>
//               <TableCell>{row.lead_id}</TableCell>
//               <TableCell>{row.leads?.name || "-"}</TableCell>
//               <TableCell>{row.email}</TableCell>
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

//               {/* Resume PDF */}
//               <TableCell className="space-x-2 min-w-[220px]">
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

//               {/* NEW: Portfolio Status (from portfolio_progress) */}
//               {/* <TableCell>
//                 {PORTFOLIO_STATUS_LABEL[(row.pp_status ?? "not_started") as PortfolioStatus]}
//               </TableCell> */}
//               <TableCell>
//   {row.pp_status === "success" && row.pp_link ? (
//     <a
//       href={row.pp_link}
//       target="_blank"
//       rel="noreferrer"
//       className="text-blue-600 underline break-all"
//       title="Open portfolio link"
//     >
//       {row.pp_link}
//     </a>
//   ) : (
//     PORTFOLIO_STATUS_LABEL[(row.pp_status ?? "not_started") as PortfolioStatus]
//   )}
// </TableCell>


//               {/* NEW: Portfolio Assignee (from portfolio_progress) */}
//               <TableCell>
//                 {row.pp_assigned_name
//                   ? `${row.pp_assigned_name}${row.pp_assigned_email ? ` • ${row.pp_assigned_email}` : ""}`
//                   : row.pp_assigned_email || <span className="text-gray-400 text-sm">—</span>}
//               </TableCell>
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

  // joined
  leads?: { name: string; phone: string };

  // resume_progress
  rp_status?: ResumeStatus;
  rp_pdf_path?: string | null;
  assigned_to_email?: string | null; // <-- add this line
  assigned_to_name?: string | null; // <-- add this line
  // portfolio_progress (from technical team) — READ ONLY in this page
  pp_status?: PortfolioStatus | null;
  pp_assigned_email?: string | null;
  pp_assigned_name?: string | null;
  pp_link?: string | null; // link to portfolio, if available
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
  // NEW COLUMN (your request)
  "Assigned to",
  "Resume PDF",
  "Closed At",
  // NEW (reflect what Technical Team updated)
  "Portfolio Status",
  "Portfolio Assignee",
  
] as const;

/* =========================
   Component
   ========================= */

export default function ResumeTeamPage() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<SalesClosure[]>([]);
  const [uploadForLead, setUploadForLead] = useState<string | null>(null);
  const [replacingOldPath, setReplacingOldPath] = useState<string | null>(null);

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
      .select("id, lead_id, email, finance_status, closed_at, resume_sale_value")
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
      // .select("lead_id, status, pdf_path")
      .select("lead_id, status, pdf_path, assigned_to_email, assigned_to_name") // <-- add assigned_to_email and assigned_to_name

      .in("lead_id", leadIds);

    if (progErr) {
      console.error(progErr);
      return;
    }
    const progMap = new Map(
      // (progress ?? []).map((p) => [p.lead_id, { status: p.status as ResumeStatus, pdf_path: p.pdf_path ?? null }])

      (progress ?? []).map((p) => [
  p.lead_id,
  {
    status: p.status as ResumeStatus,
    pdf_path: p.pdf_path ?? null,
    assigned_to_email: p.assigned_to_email ?? null,
    assigned_to_name: p.assigned_to_name ?? null, // <-- store assigned_to_name
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
          link: p.link ?? null, // ✅ keep link
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
      id: u.user_id,            // text (unique)
      name: u.full_name,        // text
      email: u.user_email,      // text (nullable)
      role: u.roles,            // text
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
        assigned_to_name: progMap.get(r.lead_id)?.assigned_to_name ?? null, // <-- add this line
        // reflect technical team updates
        pp_status: portMap.get(r.lead_id)?.status ?? "not_started",
        pp_assigned_email: portMap.get(r.lead_id)?.assigned_email ?? null,
        pp_assigned_name: portMap.get(r.lead_id)?.assigned_name ?? null,
        pp_link: portMap.get(r.lead_id)?.link ?? null, // ✅ store link in row
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
     PDF store helpers
     ========================= */

  const ensurePdf = (file: File) => {
    if (file.type !== "application/pdf") throw new Error("Please select a PDF file.");
    if (file.size > 20 * 1024 * 1024) throw new Error("Max file size is 20MB.");
  };

  const makeObjectPath = (leadId: string, fileName: string) => {
    const cleanName = fileName.replace(/\s+/g, "_");
    return `${leadId}/${Date.now()}_${cleanName}`; // stored under bucket 'resumes'
  };

  const uploadPdf = async (leadId: string, file: File, oldPath?: string | null) => {
    ensurePdf(file);
    const path = makeObjectPath(leadId, file.name);

    // Storage upload (bucket must be named 'resumes' and exist)
    const { error: upErr } = await supabase.storage
      .from("resumes")
      .upload(path, file, { cacheControl: "3600", upsert: true, contentType: "application/pdf" });

    if (upErr) throw upErr;

    // Optionally remove old blob if replacing
    if (oldPath) {
      await supabase.storage.from("resumes").remove([oldPath]);
    }

    // Upsert progress row
    const { error: dbErr } = await supabase
      .from("resume_progress")
      .upsert(
        { lead_id: leadId, status: "completed", pdf_path: path, pdf_uploaded_at: new Date().toISOString() },
        { onConflict: "lead_id" } // requires unique or PK on lead_id
      );

    if (dbErr) throw dbErr;

    return path;
  };

  const updateStatus = async (leadId: string, status: ResumeStatus) => {
    const { error } = await supabase
      .from("resume_progress")
      .upsert({ lead_id: leadId, status }, { onConflict: "lead_id" });
    if (error) throw error;
  };

 const updateAssignedTo = async (
  leadId: string,
  email: string | null,
  name?: string | null
) => {
  // 1) does a row exist for this lead?
  const { data: existingRows, error: findErr } = await supabase
    .from("resume_progress")
    .select("id")
    .eq("lead_id", leadId);

  if (findErr) throw findErr;

  if (existingRows && existingRows.length > 0) {
    // 2) update
    const { error: updErr } = await supabase
      .from("resume_progress")
      .update({
        assigned_to_email: email,
        assigned_to_name: name ?? null,
      })
      .eq("lead_id", leadId);

    if (updErr) throw updErr;
  } else {
    // 3) insert (status has a DEFAULT, so we can omit it)
    const { error: insErr } = await supabase
      .from("resume_progress")
      .insert({
        lead_id: leadId,
        assigned_to_email: email,
        assigned_to_name: name ?? null,
      });

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
        // Reflect in UI immediately
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
    // reset so user can re-pick same file next time
    e.target.value = "";
    setUploadForLead(null);
    setReplacingOldPath(null);

    if (!file || !leadId) return;

    try {
      await uploadPdf(leadId, file, oldPath || undefined);
      // refresh table
      await fetchData();
      alert("PDF uploaded.");
    } catch (err: any) {
      alert(err.message || "Upload failed");
    }
  };

  const openPdf = async (path: string) => {
    try {
      const { data, error } = await supabase.storage.from("resumes").createSignedUrl(path, 60 * 60);
      if (error) throw error;
      if (data?.signedUrl) window.open(data.signedUrl, "_blank", "noopener,noreferrer");
    } catch (e: any) {
      alert(e.message || "Could not open PDF");
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
               {/* NEW: Assigned to (list of all Resume Heads/Associates) */}
              {/* Assigned to (persist to resume_progress) */}
<TableCell className="min-w-[260px]">
  <Select
    value={row.assigned_to_email ?? "__none__"}   // keep in sync after refresh
    onValueChange={async (value) => {
      try {
        const chosen = value === "__none__" ? null : value;
        const member = resumeTeamMembers.find((u) => u.email === chosen) || null;

        await updateAssignedTo(row.lead_id, chosen, member?.name ?? null);

        // optimistic UI update
        setRows((rs) =>
          rs.map((r) =>
            r.lead_id === row.lead_id
              ? {
                  ...r,
                  assigned_to_email: chosen,
                  assigned_to_name: member?.name ?? null,
                }
              : r
          )
        );
      } catch (e: any) {
        console.error("Assign failed:", e);
        alert(e.message || "Failed to assign");
      }
    }}
  disabled={user?.role == "Resume Associate"}>
    <SelectTrigger     className="!opacity-100 bg-muted/20 text-foreground">
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
            {(u.name )}
            — {u.role}
          </SelectItem>
        ))
      )}
    </SelectContent>
  </Select>
</TableCell>


              {/* Resume PDF */}
              <TableCell className="space-x-2 min-w-[220px] ">
                {row.rp_pdf_path ? (
                  <>
                    <Button variant="outline" size="sm" onClick={() => openPdf(row.rp_pdf_path!)}>
                      View PDF
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

              {/* Portfolio Assignee (from portfolio_progress) */}
              <TableCell>
                {row.pp_assigned_name
                  ? `${row.pp_assigned_name}${row.pp_assigned_email ? ` • ${row.pp_assigned_email}` : ""}`
                  : row.pp_assigned_email || <span className="text-gray-400 text-sm">—</span>}
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
      </DashboardLayout>
    </ProtectedRoute>
  );
}
