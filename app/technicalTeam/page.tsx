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
//   portfolio_sale_value?: number | null;
//   github_sale_value?: number | null;
//   leads?: { name: string; phone: string };
// }

// // ✅ move columns outside the component (no hooks)
// // "Portfolio Sale","GitHub Sale",
// const PORTFOLIO_COLUMNS = ["Client ID", "Name", "Email", "Phone", "Status",  "Closed At"] as const;
// const GITHUB_COLUMNS    = ["Client ID", "Name", "Email", "Phone", "Status",  "Closed At"] as const;

// export default function TechnicalPage() {
//   const [loading, setLoading] = useState(true);
//   const [portfolioRows, setPortfolioRows] = useState<SalesClosure[]>([]);
//   const [githubRows, setGithubRows] = useState<SalesClosure[]>([]);
//   const { user, hasAccess } = useAuth();
//   const router = useRouter();

//   const fetchBoth = async () => {
//     if (!user) return;

//     let qPortfolio = supabase
//       .from("sales_closure")
//       .select("*")
//       .not("portfolio_sale_value", "is", null)
//       .neq("portfolio_sale_value", 0);

//     let qGithub = supabase
//       .from("sales_closure")
//       .select("*")
//       .not("github_sale_value", "is", null)
//       .neq("github_sale_value", 0);

//    // Associates see only their own assignments; Heads see all
// // if (user.role === "Technical Associate" ) {
// //   qPortfolio = qPortfolio.eq("associates_email", user.email);
// //   qGithub = qGithub.eq("associates_email", user.email);
// // }

//     const [{ data: pData, error: pErr }, { data: gData, error: gErr }] = await Promise.all([qPortfolio, qGithub]);
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

//     setPortfolioRows(pLatest.map((r) => ({ ...r, leads: leadMap.get(r.lead_id) || { name: "-", phone: "-" } })));
//     setGithubRows(gLatest.map((r) => ({ ...r, leads: leadMap.get(r.lead_id) || { name: "-", phone: "-" } })));
//   };

//   useEffect(() => {
//     if (user === null) return;
//     const allowed = ["Super Admin", "Technical Head", "Technical Associate"] as const;
//     if (!user || !allowed.includes(user.role as any)) {
//       router.push("/unauthorized");
//       return;
//     }
//     setLoading(false);
//   }, [user, router]);

// useEffect(() => {
//   if (!user) return;
//   const allowed = new Set(["Super Admin", "Technical Head", "Technical Associate"]);
//   if (allowed.has(user.role as any)) fetchBoth();
// }, [user]);


//   const renderTable = (rows: SalesClosure[], which: "portfolio" | "github") => {
//     const columns = which === "portfolio" ? PORTFOLIO_COLUMNS : GITHUB_COLUMNS;
//     return (
//       <div className="rounded-md border mt-4">
//         <Table>
//           <TableHeader>
//             <TableRow>
//               {columns.map((c) => (
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
               
//                 <TableCell>{sale.closed_at ? new Date(sale.closed_at).toLocaleDateString("en-GB") : "-"}</TableCell>
//               </TableRow>
//             ))}
//             {rows.length === 0 && (
//               <TableRow>
//                 <TableCell colSpan={columns.length} className="text-center text-sm text-muted-foreground py-10">
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
//     <ProtectedRoute allowedRoles={["Super Admin", "Technical Head", "Technical Associate"]}>
//       <DashboardLayout>
//         <div className="space-y-6">
//           <div className="flex items-center justify-between">
//             <h1 className="text-3xl font-bold text-gray-900">Technical Page</h1>
//           </div>

//           {loading ? (
//             <p className="p-6 text-gray-600">Loading...</p>
//           ) : (
//             <Tabs defaultValue="portfolio" className="w-full">
//               <TabsList className="grid grid-cols-2 w-full sm:w-auto">
//                 <TabsTrigger value="portfolio">Portfolios</TabsTrigger>
//                 <TabsTrigger value="github">GitHub</TabsTrigger>
//               </TabsList>

//               <TabsContent value="portfolio">{renderTable(portfolioRows, "portfolio")}</TabsContent>
//               <TabsContent value="github">{renderTable(githubRows, "github")}</TabsContent>
//             </Tabs>
//           )}
//         </div>
//       </DashboardLayout>
//     </ProtectedRoute>
//   );
// }




// // app/technicalTeam/page.tsx
// "use client";

// import { useEffect, useState } from "react";
// import { useRouter } from "next/navigation";
// import { supabase } from "@/utils/supabase/client";

// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
// import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
//   portfolio_sale_value?: number | null;
//   github_sale_value?: number | null;
//   leads?: { name: string; phone: string };

//   // joined from resume_progress:
//   rp_status?: ResumeStatus;
//   rp_pdf_path?: string | null;
// }

// // Columns now include Resume status & PDF
// const PORTFOLIO_COLUMNS = [
//   "Client ID",
//   "Name",
//   "Email",
//   "Phone",
//   "Status",
//   "Resume Status",
//   "Resume PDF",
//   "Closed At",
// ] as const;

// const GITHUB_COLUMNS = [
//   "Client ID",
//   "Name",
//   "Email",
//   "Phone",
//   "Status",
//   "Resume Status",
//   "Resume PDF",
//   "Closed At",
// ] as const;

// export default function TechnicalPage() {
//   const [loading, setLoading] = useState(true);
//   const [portfolioRows, setPortfolioRows] = useState<SalesClosure[]>([]);
//   const [githubRows, setGithubRows] = useState<SalesClosure[]>([]);
//   const { user } = useAuth();
//   const router = useRouter();

//   const fetchBoth = async () => {
//     if (!user) return;

//     // 1) pull portfolio/github closures
//     let qPortfolio = supabase
//       .from("sales_closure")
//       .select("*")
//       .not("portfolio_sale_value", "is", null)
//       .neq("portfolio_sale_value", 0);

//     let qGithub = supabase
//       .from("sales_closure")
//       .select("*")
//       .not("github_sale_value", "is", null)
//       .neq("github_sale_value", 0);

//     // If associates should only see their own leads, uncomment:
//     // if (user.role === "Technical Associate") {
//     //   qPortfolio = qPortfolio.eq("associates_email", user.email);
//     //   qGithub = qGithub.eq("associates_email", user.email);
//     // }

//     const [{ data: pData, error: pErr }, { data: gData, error: gErr }] = await Promise.all([qPortfolio, qGithub]);
//     if (pErr || gErr) {
//       console.error("Failed to fetch sales data:", pErr || gErr);
//       return;
//     }

//     // 2) latest record per lead
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

//     // 3) fetch lead basics
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

//     // 4) fetch resume progress for those leads
//     const { data: rp, error: rpErr } = await supabase
//       .from("resume_progress")
//       .select("lead_id, status, pdf_path")
//       .in("lead_id", allLeadIds);

//     if (rpErr) {
//       console.error("Failed to fetch resume progress:", rpErr);
//       return;
//     }
//     const progMap = new Map(rp?.map((x) => [x.lead_id, { status: x.status as ResumeStatus, pdf_path: x.pdf_path }]));

//     // 5) merge
//     setPortfolioRows(
//       pLatest.map((r) => ({
//         ...r,
//         leads: leadMap.get(r.lead_id) || { name: "-", phone: "-" },
//         rp_status: progMap.get(r.lead_id)?.status ?? "not_started",
//         rp_pdf_path: progMap.get(r.lead_id)?.pdf_path ?? null,
//       }))
//     );

//     setGithubRows(
//       gLatest.map((r) => ({
//         ...r,
//         leads: leadMap.get(r.lead_id) || { name: "-", phone: "-" },
//         rp_status: progMap.get(r.lead_id)?.status ?? "not_started",
//         rp_pdf_path: progMap.get(r.lead_id)?.pdf_path ?? null,
//       }))
//     );
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

//   // role gate
//   useEffect(() => {
//     if (user === null) return;
//     const allowed = ["Super Admin", "Technical Head", "Technical Associate"] as const;
//     if (!user || !allowed.includes(user.role as any)) {
//       router.push("/unauthorized");
//       return;
//     }
//     setLoading(false);
//   }, [user, router]);

//   useEffect(() => {
//     if (!user) return;
//     const allowed = new Set(["Super Admin", "Technical Head", "Technical Associate"]);
//     if (allowed.has(user.role as any)) fetchBoth();
//   }, [user]);

//   const renderTable = (rows: SalesClosure[], which: "portfolio" | "github") => {
//     const columns = which === "portfolio" ? PORTFOLIO_COLUMNS : GITHUB_COLUMNS;

//     return (
//       <div className="rounded-md border mt-4">
//         <Table>
//           <TableHeader>
//             <TableRow>
//               {columns.map((c) => (
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

//                 {/* joined resume status */}
//                 <TableCell>
//                   {sale.rp_status ? STATUS_LABEL[sale.rp_status] : "—"}
//                 </TableCell>

//                 {/* joined resume PDF */}
//                 <TableCell>
//                   {sale.rp_pdf_path ? (
//                     <Button variant="outline" size="sm" onClick={() => openPdf(sale.rp_pdf_path!)}>
//                       View PDF
//                     </Button>
//                   ) : (
//                     <span className="text-gray-400 text-sm">—</span>
//                   )}
//                 </TableCell>

//                 <TableCell>{sale.closed_at ? new Date(sale.closed_at).toLocaleDateString("en-GB") : "-"}</TableCell>
//               </TableRow>
//             ))}
//             {rows.length === 0 && (
//               <TableRow>
//                 <TableCell colSpan={columns.length} className="text-center text-sm text-muted-foreground py-10">
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
//     <ProtectedRoute allowedRoles={["Super Admin", "Technical Head", "Technical Associate"]}>
//       <DashboardLayout>
//         <div className="space-y-6">
//           <div className="flex items-center justify-between">
//             <h1 className="text-3xl font-bold text-gray-900">Technical Page</h1>
//           </div>

//           {loading ? (
//             <p className="p-6 text-gray-600">Loading...</p>
//           ) : (
//             <Tabs defaultValue="portfolio" className="w-full">
//               <TabsList className="grid grid-cols-2 w-full sm:w-auto">
//                 <TabsTrigger value="portfolio">Portfolios</TabsTrigger>
//                 <TabsTrigger value="github">GitHub</TabsTrigger>
//               </TabsList>

//               <TabsContent value="portfolio">{renderTable(portfolioRows, "portfolio")}</TabsContent>
//               <TabsContent value="github">{renderTable(githubRows, "github")}</TabsContent>
//             </Tabs>
//           )}
//         </div>
//       </DashboardLayout>
//     </ProtectedRoute>
//   );
// }



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
//   portfolio_sale_value?: number | null;
//   github_sale_value?: number | null;
//   leads?: { name: string; phone: string };
//   // from resume_progress
//   rp_status?: ResumeStatus;
//   rp_pdf_path?: string | null;
// }

// const PORTFOLIO_COLUMNS = [
//   "Client ID",
//   "Name",
//   "Email",
//   "Phone",
//   "Status",
//   "Resume Status",
//   "Resume PDF",
//   "Closed At",
// ] as const;

// export default function TechnicalTeamPage() {
//   const [loading, setLoading] = useState(true);
//   const [portfolioRows, setPortfolioRows] = useState<SalesClosure[]>([]);
//   const { user } = useAuth();
//   const router = useRouter();

//   // ---------- Data fetch ----------
//   const fetchData = async () => {
//     if (!user) return;

//     // 1) get rows that actually involve technical work (portfolio/github)
//     let qPortfolio = supabase
//       .from("sales_closure")
//       .select("*")
//       .not("portfolio_sale_value", "is", null)
//       .neq("portfolio_sale_value", 0);

//     let qGithub = supabase
//       .from("sales_closure")
//       .select("*")
//       .not("github_sale_value", "is", null)
//       .neq("github_sale_value", 0);

//     // If you want to scope Associates to only their work, uncomment:
//     // if (user.role === "Technical Associate") {
//     //   qPortfolio = qPortfolio.eq("associates_email", user.email);
//     //   qGithub = qGithub.eq("associates_email", user.email);
//     // }

    

//     const [{ data: pData, error: pErr }, { data: gData, error: gErr }] = await Promise.all([qPortfolio, qGithub]);
//     if (pErr || gErr) {
//       console.error("Failed to fetch sales data:", pErr || gErr);
//       return;
//     }

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

//     const pLatest = latestByLead(pData || []);
//     const gLatest = latestByLead(gData || []);
//     const allLeadIds = Array.from(new Set([...pLatest, ...gLatest].map((r) => r.lead_id)));

//     // 2) fetch lead name/phone
//     const { data: leadsData, error: leadsErr } = await supabase
//       .from("leads")
//       .select("business_id, name, phone")
//       .in("business_id", allLeadIds);
//     if (leadsErr) {
//       console.error("Failed to fetch leads:", leadsErr);
//       return;
//     }
//     const leadMap = new Map(leadsData?.map((l) => [l.business_id, { name: l.name, phone: l.phone }]));

//     // 3) fetch resume progress for those leads
//     const { data: progress, error: progErr } = await supabase
//       .from("resume_progress")
//       .select("lead_id, status, pdf_path")
//       .in("lead_id", allLeadIds);
//     if (progErr) {
//       console.error("Failed to fetch resume_progress:", progErr);
//       return;
//     }
//     const progMap = new Map(progress?.map((p) => [p.lead_id, { status: p.status as ResumeStatus, pdf_path: p.pdf_path }]));

//     // 4) merge into portfolio side (we show only the portfolio tab here; copy/paste if you also want on GitHub tab)
//     const mergedPortfolio: SalesClosure[] = pLatest.map((r) => ({
//       ...r,
//       leads: leadMap.get(r.lead_id) || { name: "-", phone: "-" },
//       rp_status: progMap.get(r.lead_id)?.status ?? "not_started",
//       rp_pdf_path: progMap.get(r.lead_id)?.pdf_path ?? null,
//     }));

//     setPortfolioRows(mergedPortfolio);
//   };

//   // view signed url from Storage
//   const openSignedPdf = async (path: string) => {
//     try {
//       const { data, error } = await supabase.storage.from("resumes").createSignedUrl(path, 60 * 60); // 1h
//       if (error) throw error;
//       if (data?.signedUrl) window.open(data.signedUrl, "_blank");
//     } catch (e: any) {
//       alert(e.message || "Could not open PDF");
//     }
//   };

//   async function logResumeProgress() {
//   const leadId = "AWL-1379";

//   // fetch rows for that lead (latest first)
//   const { data, error } = await supabase
//     .from("resume_progress")
//     .select("id, lead_id, status, pdf_path, pdf_uploaded_at, updated_at, updated_by")
//     .eq("lead_id", leadId)
//     .order("updated_at", { ascending: false });

//   if (error) {
//     console.error("resume_progress query error:", error);
//     return;
//   }

//   console.log("resume_progress rows:", data);
// }

// // call it (e.g., inside useEffect or directly in a script)
// logResumeProgress();

// const downloadResume = async (path: string) => {
//   try {
//     const { data, error } = await supabase.storage
//       .from("resumes")
//       // If your SDK supports it, pass the download filename right here:
//       .createSignedUrl(path, 60 * 60, { download: `Resume-${path.split("/")[0]}.pdf` });

//     if (error) throw error;
//     if (data?.signedUrl) {
//       // navigating to the URL triggers the download
//       window.location.href = data.signedUrl;
//     }
//   } catch (e: any) {
//     alert(e.message || "Could not download PDF");
//   }
// };


//   useEffect(() => {
//     if (user === null) return;
//     const allowed = ["Super Admin", "Technical Head", "Technical Associate"] as const;
//     if (!user || !allowed.includes(user.role as any)) {
//       router.push("/unauthorized");
//       return;
//     }
//     setLoading(false);
//   }, [user, router]);

//   useEffect(() => {
//     if (user) fetchData();
//   }, [user]);

//   const renderTable = (rows: SalesClosure[]) => (
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
//           {rows.map((sale) => (
//             <TableRow key={sale.id}>
//               <TableCell>{sale.lead_id}</TableCell>
//               <TableCell>{sale.leads?.name || "-"}</TableCell>
//               <TableCell>{sale.email}</TableCell>
//               <TableCell>{sale.leads?.phone || "-"}</TableCell>
//               <TableCell>{sale.finance_status}</TableCell>

//               {/* Resume Status (read-only here; you can make it editable if you want) */}
//               <TableCell>{STATUS_LABEL[(sale.rp_status ?? "not_started") as ResumeStatus]}</TableCell>

//               {/* Resume PDF */}
//           <TableCell>
//   {sale.rp_pdf_path ? (
//     <Button
//       variant="outline"
//       size="sm"
//       onClick={() => downloadResume(sale.rp_pdf_path!)}
//     >
//       Download Resume
//     </Button>
//   ) : (
//     <span className="text-gray-400 text-sm">—</span>
//   )}
// </TableCell>

//               <TableCell>{sale.closed_at ? new Date(sale.closed_at).toLocaleDateString("en-GB") : "-"}</TableCell>
//             </TableRow>
//           ))}
//           {rows.length === 0 && (
//             <TableRow>
//               <TableCell colSpan={PORTFOLIO_COLUMNS.length} className="text-center text-sm text-muted-foreground py-10">
//                 No records found.
//               </TableCell>
//             </TableRow>
//           )}
//         </TableBody>
//       </Table>
//     </div>
//   );

//   return (
//     <ProtectedRoute allowedRoles={["Super Admin", "Technical Head", "Technical Associate"]}>
//       <DashboardLayout>
//         <div className="space-y-6">
//           <div className="flex items-center justify-between">
//             <h1 className="text-3xl font-bold text-gray-900">Technical Page</h1>
//           </div>

//           {loading ? (
//             <p className="p-6 text-gray-600">Loading...</p>
//           ) : (
//             <Tabs defaultValue="portfolio" className="w-full">
//               <TabsList className="grid grid-cols-2 w-full sm:w-auto">
//                 <TabsTrigger value="portfolio">Portfolios</TabsTrigger>
//                 <TabsTrigger value="github">GitHub</TabsTrigger>
//               </TabsList>

//               <TabsContent value="portfolio">{renderTable(portfolioRows)}</TabsContent>
//               {/* If you also need resume status mirrored under the GitHub tab, duplicate the same merge there. */}
//               <TabsContent value="github">
//                 <div className="p-6 text-sm text-gray-500">GitHub tab not wired to resumes yet.</div>
//               </TabsContent>
//             </Tabs>
//           )}
//         </div>
//       </DashboardLayout>
//     </ProtectedRoute>
//   );
// }



// "use client";

// import { useEffect, useState } from "react";
// import { useRouter } from "next/navigation";
// import { supabase } from "@/utils/supabase/client";

// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
// import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
//   portfolio_sale_value?: number | null;
//   github_sale_value?: number | null;
//   leads?: { name: string; phone: string };
//   // from resume_progress
//   rp_status?: ResumeStatus;
//   rp_pdf_path?: string | null;
// }

// const PORTFOLIO_COLUMNS = [
//   "Client ID",
//   "Name",
//   "Email",
//   "Phone",
//   "Status",
//   "Resume Status",
//   "Resume PDF",
//   "Closed At",
// ] as const;

// const GITHUB_COLUMNS = [
//   "Client ID",
//   "Name",
//   "Email",
//   "Phone",
//   "Status",
//   "Closed At",
// ] as const;

// export default function TechnicalTeamPage() {
//   const [loading, setLoading] = useState(true);
//   const [portfolioRows, setPortfolioRows] = useState<SalesClosure[]>([]);
//   const [githubRows, setGithubRows] = useState<SalesClosure[]>([]);
//   const { user } = useAuth();
//   const router = useRouter();

//   // ---------- Helpers ----------
//   const latestByLead = (rows: any[]) => {
//     const map = new Map<string, any>();
//     for (const r of rows ?? []) {
//       const ex = map.get(r.lead_id);
//       const ed = ex?.closed_at ?? "";
//       const cd = r?.closed_at ?? "";
//       if (!ex || new Date(cd) > new Date(ed)) map.set(r.lead_id, r);
//     }
//     return Array.from(map.values()).sort(
//       (a, b) => new Date(b.closed_at || "").getTime() - new Date(a.closed_at || "").getTime()
//     );
//   };

//   const toNiceMoney = (v?: number | null) =>
//     typeof v === "number" ? v.toLocaleString("en-IN", { maximumFractionDigits: 2 }) : "-";

//   // ---------- Data fetch ----------
//   const fetchData = async () => {
//     if (!user) return;

//     // Portfolio rows (not null and not 0)
//     let qPortfolio = supabase
//       .from("sales_closure")
//       .select("*")
//       .not("portfolio_sale_value", "is", null)
//       .neq("portfolio_sale_value", 0);

//     // GitHub rows (not null and not 0)
//     let qGithub = supabase
//       .from("sales_closure")
//       .select("*")
//       .not("github_sale_value", "is", null)
//       .neq("github_sale_value", 0);

//     // If you want to scope Associates to only their work, uncomment:
//     // if (user.role === "Technical Associate") {
//     //   qPortfolio = qPortfolio.eq("associates_email", user.email);
//     //   qGithub = qGithub.eq("associates_email", user.email);
//     // }

//     const [{ data: pData, error: pErr }, { data: gData, error: gErr }] = await Promise.all([qPortfolio, qGithub]);
//     if (pErr || gErr) {
//       console.error("Failed to fetch sales data:", pErr || gErr);
//       return;
//     }

//     const pLatest = latestByLead(pData || []);
//     const gLatest = latestByLead(gData || []);

//     const allLeadIds = Array.from(new Set([...pLatest, ...gLatest].map((r) => r.lead_id)));

//     // 2) fetch lead name/phone
//     const { data: leadsData, error: leadsErr } = await supabase
//       .from("leads")
//       .select("business_id, name, phone")
//       .in("business_id", allLeadIds);
//     if (leadsErr) {
//       console.error("Failed to fetch leads:", leadsErr);
//       return;
//     }
//     const leadMap = new Map(leadsData?.map((l) => [l.business_id, { name: l.name, phone: l.phone }]));

//     // 3) fetch resume progress for those leads (used only on portfolio tab)
//     const { data: progress, error: progErr } = await supabase
//       .from("resume_progress")
//       .select("lead_id, status, pdf_path")
//       .in("lead_id", allLeadIds);
//     if (progErr) {
//       console.error("Failed to fetch resume_progress:", progErr);
//       return;
//     }
//     const progMap = new Map(progress?.map((p) => [p.lead_id, { status: p.status as ResumeStatus, pdf_path: p.pdf_path }]));

//     // 4) merge into portfolio
//     const mergedPortfolio: SalesClosure[] = pLatest.map((r) => ({
//       ...r,
//       leads: leadMap.get(r.lead_id) || { name: "-", phone: "-" },
//       rp_status: progMap.get(r.lead_id)?.status ?? "not_started",
//       rp_pdf_path: progMap.get(r.lead_id)?.pdf_path ?? null,
//     }));

//     // 5) merge into GitHub (no resume fields shown here)
//     const mergedGithub: SalesClosure[] = gLatest.map((r) => ({
//       ...r,
//       leads: leadMap.get(r.lead_id) || { name: "-", phone: "-" },
//     }));

//     setPortfolioRows(mergedPortfolio);
//     setGithubRows(mergedGithub);
//   };

//   // ---- Direct download from Supabase (auto-saves to Downloads) ----
//   const downloadResume = async (path: string) => {
//   try {
//     const { data, error } = await supabase.storage
//       .from("resumes")
//       // If your SDK supports it, pass the download filename right here:
//       .createSignedUrl(path, 60 * 60, { download: `Resume-${path.split("/")[0]}.pdf` });

//     if (error) throw error;
//     if (data?.signedUrl) {
//       // navigating to the URL triggers the download
//       window.location.href = data.signedUrl;
//     }
//   } catch (e: any) {
//     alert(e.message || "Could not download PDF");
//   }
// };

//   useEffect(() => {
//     if (user === null) return;
//     const allowed = ["Super Admin", "Technical Head", "Technical Associate"] as const;
//     if (!user || !allowed.includes(user.role as any)) {
//       router.push("/unauthorized");
//       return;
//     }
//     setLoading(false);
//   }, [user, router]);

//   useEffect(() => {
//     if (user) fetchData();
//   }, [user]);

//   // ---------- Renderers ----------
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
//           {rows.map((sale) => (
//             <TableRow key={sale.id}>
//               <TableCell>{sale.lead_id}</TableCell>
//               <TableCell>{sale.leads?.name || "-"}</TableCell>
//               <TableCell>{sale.email}</TableCell>
//               <TableCell>{sale.leads?.phone || "-"}</TableCell>
//               <TableCell>{sale.finance_status}</TableCell>
//               <TableCell>{STATUS_LABEL[(sale.rp_status ?? "not_started") as ResumeStatus]}</TableCell>
//               <TableCell>
//                 {sale.rp_pdf_path ? (
//                   <Button variant="outline" size="sm" onClick={() => downloadResume(sale.rp_pdf_path!)}>
//                     Download Resume
//                   </Button>
//                 ) : (
//                   <span className="text-gray-400 text-sm">—</span>
//                 )}
//               </TableCell>
//               <TableCell>{sale.closed_at ? new Date(sale.closed_at).toLocaleDateString("en-GB") : "-"}</TableCell>
//             </TableRow>
//           ))}
//           {rows.length === 0 && (
//             <TableRow>
//               <TableCell colSpan={PORTFOLIO_COLUMNS.length} className="text-center text-sm text-muted-foreground py-10">
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
//           {rows.map((sale) => (
//             <TableRow key={sale.id}>
//               <TableCell>{sale.lead_id}</TableCell>
//               <TableCell>{sale.leads?.name || "-"}</TableCell>
//               <TableCell>{sale.email}</TableCell>
//               <TableCell>{sale.leads?.phone || "-"}</TableCell>
//               <TableCell>{sale.finance_status}</TableCell>
//               {/* <TableCell>{toNiceMoney(sale.github_sale_value)}</TableCell> */}
//               <TableCell>{sale.closed_at ? new Date(sale.closed_at).toLocaleDateString("en-GB") : "-"}</TableCell>
//             </TableRow>
//           ))}
//           {rows.length === 0 && (
//             <TableRow>
//               <TableCell colSpan={GITHUB_COLUMNS.length} className="text-center text-sm text-muted-foreground py-10">
//                 No GitHub sales found.
//               </TableCell>
//             </TableRow>
//           )}
//         </TableBody>
//       </Table>
//     </div>
//   );

//   return (
//     <ProtectedRoute allowedRoles={["Super Admin", "Technical Head", "Technical Associate"]}>
//       <DashboardLayout>
//         <div className="space-y-6">
//           <div className="flex items-center justify-between">
//             <h1 className="text-3xl font-bold text-gray-900">Technical Page</h1>
//           </div>

//           {loading ? (
//             <p className="p-6 text-gray-600">Loading...</p>
//           ) : (
//             <Tabs defaultValue="portfolio" className="w-full">
//               <TabsList className="grid grid-cols-2 w-full sm:w-auto">
//                 <TabsTrigger value="portfolio">Portfolios</TabsTrigger>
//                 <TabsTrigger value="github">GitHub</TabsTrigger>
//               </TabsList>

//               <TabsContent value="portfolio">{renderPortfolioTable(portfolioRows)}</TabsContent>

//               {/* NEW: GitHub tab wired to sales_closure.github_sale_value (not null, not 0) */}
//               <TabsContent value="github">{renderGithubTable(githubRows)}</TabsContent>
//             </Tabs>
//           )}
//         </div>
//       </DashboardLayout>
//     </ProtectedRoute>
//   );
// }


// "use client";

// import { useEffect, useState } from "react";
// import { useRouter } from "next/navigation";
// import { supabase } from "@/utils/supabase/client";

// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
// import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
// import { Button } from "@/components/ui/button";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { Input } from "@/components/ui/input";

// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
// // import { Input } from "@/components/ui/input";


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

// // UI <-> DB status mapping for Portfolio column
// const PORTFOLIO_UI_TO_DB: Record<string, ResumeStatus> = {
//   Started: "not_started",
//   Pending: "pending",
//   "Waiting for Client approval": "waiting_client_approval",
//   Success: "completed",
// };

// const PORTFOLIO_DB_TO_UI: Record<ResumeStatus, string> = {
//   not_started: "Started",
//   pending: "Pending",
//   waiting_client_approval: "Waiting for Client approval",
//   completed: "Success",
// };

// interface SalesClosure {
//   id: string;
//   lead_id: string;
//   email: string;
//   finance_status: FinanceStatus;
//   closed_at: string | null;
//   portfolio_sale_value?: number | null;
//   github_sale_value?: number | null;
//   associates_email?: string | null;
//   associates_name?: string | null;
//   associates_tl_email?: string | null;
//   associates_tl_name?: string | null;

//   leads?: { name: string; phone: string };

//   // from resume_progress
//   rp_status?: ResumeStatus;
//   rp_pdf_path?: string | null;
//   rp_portfolio_link?: string | null; // <- new field we load
//   rp_portfolio_status?: ResumeStatus | null;
//   // rp_portfolio_link?: string | null;
// }

// interface TeamUser {
//   full_name: string;
//   user_email: string;
//   roles: "Technical Head" | "Technical Associate";
// }

// const PORTFOLIO_COLUMNS = [
//   "Client ID",
//   "Name",
//   "Email",
//   "Phone",
//   "Status",
//   "Resume Status",
//   "Resume PDF",
//   "Portfolio Status",     // NEW
//   "Assignee",             // NEW
//   "Closed At",
// ] as const;

// const GITHUB_COLUMNS = [
//   "Client ID",
//   "Name",
//   "Email",
//   "Phone",
//   "Status",
//   "GitHub Sale Value",
//   "Closed At",
// ] as const;

// export default function TechnicalTeamPage() {
//   const [loading, setLoading] = useState(true);
//   const [portfolioRows, setPortfolioRows] = useState<SalesClosure[]>([]);
//   const [githubRows, setGithubRows] = useState<SalesClosure[]>([]);
//   const [teamMembers, setTeamMembers] = useState<TeamUser[]>([]);
//   // temporary link drafts keyed by lead_id
//   const [linkDraft, setLinkDraft] = useState<Record<string, string>>({});

//   // Link dialog state
// const [linkDialogOpen, setLinkDialogOpen] = useState(false);
// // const [linkDraft, setLinkDraft] = useState("");        // the input value
// const [linkTargetLeadId, setLinkTargetLeadId] = useState<string | null>(null);
// const [linkTargetRowId, setLinkTargetRowId] = useState<string | null>(null);
// const [assigneeByRow, setAssigneeByRow] = useState<Record<string, string | undefined>>({});



//   const { user } = useAuth();
//   const router = useRouter();

//   const latestByLead = (rows: any[]) => {
//     const map = new Map<string, any>();
//     for (const r of rows ?? []) {
//       const ex = map.get(r.lead_id);
//       const ed = ex?.closed_at ?? "";
//       const cd = r?.closed_at ?? "";
//       if (!ex || new Date(cd) > new Date(ed)) map.set(r.lead_id, r);
//     }
//     return Array.from(map.values()).sort(
//       (a, b) => new Date(b.closed_at || "").getTime() - new Date(a.closed_at || "").getTime()
//     );
//   };

//   useEffect(() => {
//   setAssigneeByRow((prev) => {
//     const next = { ...prev };
//     for (const r of portfolioRows) {
//       const current = r.associates_email ?? r.associates_tl_email ?? undefined;
//       if (next[r.id] === undefined) next[r.id] = current;
//     }
//     return next;
//   });
// }, [portfolioRows, teamMembers]);


//  // map (no "Started")
// const PORTFOLIO_UI_TO_DB = {
//   Pending: "pending",
//   "Waiting for Client approval": "waiting_client_approval",
//   Success: "completed",
// } as const;
// type PortfolioUI = keyof typeof PORTFOLIO_UI_TO_DB;

// const PORTFOLIO_DB_TO_UI = (db?: ResumeStatus | null): PortfolioUI =>
//   db === "completed"
//     ? "Success"
//     : db === "waiting_client_approval"
//     ? "Waiting for Client approval"
//     : "Pending";



//   const toNiceMoney = (v?: number | null) =>
//     typeof v === "number" ? v.toLocaleString("en-IN", { maximumFractionDigits: 2 }) : "-";

//   // ---------- Data fetch ----------
//   const fetchData = async () => {
//     if (!user) return;

//     // Portfolio rows (not null and not 0)
//     let qPortfolio = supabase
//       .from("sales_closure")
//       .select("*")
//       .not("portfolio_sale_value", "is", null)
//       .neq("portfolio_sale_value", 0);

//     // GitHub rows (not null and not 0)
//     let qGithub = supabase
//       .from("sales_closure")
//       .select("*")
//       .not("github_sale_value", "is", null)
//       .neq("github_sale_value", 0);

//     // If you want to scope Associates to only their work, uncomment:
//     // if (user.role === "Technical Associate") {
//     //   qPortfolio = qPortfolio.eq("associates_email", user.email);
//     //   qGithub = qGithub.eq("associates_email", user.email);
//     // }

//     const [{ data: pData, error: pErr }, { data: gData, error: gErr }] = await Promise.all([qPortfolio, qGithub]);
//     if (pErr || gErr) {
//       console.error("Failed to fetch sales data:", pErr || gErr);
//       return;
//     }

//     const pLatest = latestByLead(pData || []);
//     const gLatest = latestByLead(gData || []);

//     const allLeadIds = Array.from(new Set([...pLatest, ...gLatest].map((r) => r.lead_id)));

//     // 2) leads
//     const { data: leadsData, error: leadsErr } = await supabase
//       .from("leads")
//       .select("business_id, name, phone")
//       .in("business_id", allLeadIds);
//     if (leadsErr) {
//       console.error("Failed to fetch leads:", leadsErr);
//       return;
//     }
//     const leadMap = new Map(leadsData?.map((l) => [l.business_id, { name: l.name, phone: l.phone }]));

//     // 3) resume_progress (status/pdf/link)
//    // fetchData(): resume_progress select
// const { data: progress } = await supabase
//   .from("resume_progress")
//   .select("lead_id, status, pdf_path, portfolio_status, portfolio_link")
//   .in("lead_id", allLeadIds);

// // build map
// const progMap = new Map(
//   progress?.map((p) => [
//     p.lead_id,
//     {
//       status: p.status as ResumeStatus,               // (resume status)
//       pdf_path: p.pdf_path,
//       portfolio_status: (p as any).portfolio_status as ResumeStatus | null,
//       portfolio_link: (p as any).portfolio_link ?? null,
//     },
//   ])
// );

// // merge into rows
// const mergedPortfolio: SalesClosure[] = pLatest.map((r) => ({
//   ...r,
//   leads: leadMap.get(r.lead_id) || { name: "-", phone: "-" },
//   rp_status: progMap.get(r.lead_id)?.status ?? "not_started",
//   rp_pdf_path: progMap.get(r.lead_id)?.pdf_path ?? null,
//   // NEW:
//   rp_portfolio_status: progMap.get(r.lead_id)?.portfolio_status ?? null,
//   rp_portfolio_link: progMap.get(r.lead_id)?.portfolio_link ?? null,
// }));


//   // team: Technical Head + Technical Associate
//   const fetchTeam = async () => {
//     const { data, error } = await supabase
//       .from("profiles")
//       .select("full_name, user_email, roles")
//       .in("roles", ["Technical Head", "Technical Associate"]);
//     if (error) {
//       console.error("Failed to fetch team users:", error);
//       return;
//     }
//     // Sort by role then name
//     const sorted = (data as TeamUser[]).sort((a, b) =>
//       a.roles === b.roles ? a.full_name.localeCompare(b.full_name) : a.roles.localeCompare(b.roles)
//     );
//     setTeamMembers(sorted);
//   };

//   // ---- Direct download from Supabase ----
//   const downloadResume = async (path: string) => {
//     try {
//       const fileName = `Resume-${path.split("/")[0]}-${path.split("/").pop() || "resume"}.pdf`;
//       const { data, error } = await supabase.storage.from("resumes").createSignedUrl(path, 60 * 60);
//       if (error) throw error;
//       if (!data?.signedUrl) throw new Error("No signed URL");

//       const res = await fetch(data.signedUrl);
//       const blob = await res.blob();

//       const url = window.URL.createObjectURL(blob);
//       const a = document.createElement("a");
//       a.href = url;
//       a.download = fileName;
//       document.body.appendChild(a);
//       a.click();
//       a.remove();
//       window.URL.revokeObjectURL(url);
//     } catch (e: any) {
//       alert(e.message || "Could not download PDF");
//     }
//   };

//   // change handler
// const handlePortfolioStatusChange = async (sale: SalesClosure, uiValue: PortfolioUI) => {
//   if (uiValue === "Success") {
//     setLinkTargetLeadId(sale.lead_id);
//     setLinkTargetRowId(sale.id);
//     setLinkDraft((d) => ({ ...d, [sale.lead_id]: sale.rp_portfolio_link ?? "" }));
//     setLinkDialogOpen(true);
//     return;
//   }
//   const dbStatus = PORTFOLIO_UI_TO_DB[uiValue];
//   const { error } = await supabase
//     .from("resume_progress")
//     .upsert(
//       { lead_id: sale.lead_id, portfolio_status: dbStatus, updated_by: user?.email ?? null },
//       { onConflict: "lead_id" }
//     );
//   if (error) return alert(error.message);
//   setPortfolioRows((prev) => prev.map((r) => r.id === sale.id ? { ...r, rp_portfolio_status: dbStatus } : r));
// };

// // save link → mark completed + store link
// const handleSavePortfolioSuccess = async () => {
//   const link = linkTargetLeadId ? (linkDraft[linkTargetLeadId] ?? "").trim() : "";
//   if (!link || !linkTargetLeadId || !linkTargetRowId) return alert("Please paste a link.");

//   const { error } = await supabase
//     .from("resume_progress")
//     .upsert(
//       { lead_id: linkTargetLeadId, portfolio_status: "completed", portfolio_link: link, updated_by: user?.email ?? null },
//       { onConflict: "lead_id" }
//     );
//   if (error) return alert(error.message);

//   setPortfolioRows((prev) =>
//     prev.map((r) => r.id === linkTargetRowId ? { ...r, rp_portfolio_status: "completed", rp_portfolio_link: link } : r)
//   );
//   setLinkDialogOpen(false);
//   setLinkDraft({});
//   setLinkTargetLeadId(null);
//   setLinkTargetRowId(null);
// };


//   const handleSavePortfolioLink = async (sale: SalesClosure) => {
//     const link = linkDraft[sale.lead_id]?.trim();
//     if (!link) {
//       alert("Please paste a link first.");
//       return;
//     }
//     try {
//       const { error } = await supabase
//         .from("resume_progress")
//         .upsert(
//           {
//             lead_id: sale.lead_id,
//             status: sale.rp_status ?? "completed", // keep/set current
//             portfolio_link: link,
//             updated_by: user?.email ?? null,
//           },
//           { onConflict: "lead_id" }
//         );
//       if (error) throw error;

//       setPortfolioRows((prev) =>
//         prev.map((r) => (r.id === sale.id ? { ...r, rp_portfolio_link: link } : r))
//       );
//       setLinkDraft((d) => ({ ...d, [sale.lead_id]: "" }));
//     } catch (e: any) {
//       alert(e.message || "Failed to save link");
//     }
//   };

//   const handleAssign = async (sale: SalesClosure, memberEmail: string) => {
//   // optimistic selection
//   setAssigneeByRow((p) => ({ ...p, [sale.id]: memberEmail }));

//   const member = teamMembers.find((m) => m.user_email === memberEmail);
//   if (!member) return;

//   const updates: any = {};
//   if (member.roles === "Technical Head") {
//     updates.associates_tl_email = member.user_email;
//     updates.associates_tl_name  = member.full_name;
//   } else {
//     updates.associates_email = member.user_email;
//     updates.associates_name  = member.full_name;
//   }

//   const { error } = await supabase.from("sales_closure").update(updates).eq("id", sale.id);
//   if (error) {
//     alert(error.message || "Failed to assign member");
//     // revert UI
//     setAssigneeByRow((p) => ({ ...p, [sale.id]: sale.associates_email ?? sale.associates_tl_email ?? undefined }));
//     return;
//   }

//   setPortfolioRows((prev) =>
//     prev.map((r) =>
//       r.id === sale.id
//         ? {
//             ...r,
//             ...(member.roles === "Technical Head"
//               ? { associates_tl_email: member.user_email, associates_tl_name: member.full_name }
//               : { associates_email: member.user_email,    associates_name:    member.full_name }),
//           }
//         : r
//     )
//   );
// };


//   useEffect(() => {
//     if (user === null) return;
//     const allowed = ["Super Admin", "Technical Head", "Technical Associate"] as const;
//     if (!user || !allowed.includes(user.role as any)) {
//       router.push("/unauthorized");
//       return;
//     }
//     setLoading(false);
//   }, [user, router]);

//   useEffect(() => {
//     if (user) {
//       fetchData();
//       fetchTeam();
//     }
//   }, [user]);

//   // ---------- Renderers ----------
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
//           {rows.map((sale) => (
//             <TableRow key={sale.id}>
//               <TableCell>{sale.lead_id}</TableCell>
//               <TableCell>{sale.leads?.name || "-"}</TableCell>
//               <TableCell>{sale.email}</TableCell>
//               <TableCell>{sale.leads?.phone || "-"}</TableCell>
//               <TableCell>{sale.finance_status}</TableCell>
//               <TableCell>{STATUS_LABEL[(sale.rp_status ?? "not_started") as ResumeStatus]}</TableCell>
//               <TableCell>
//                 {sale.rp_pdf_path ? (
//                   <Button variant="outline" size="sm" onClick={() => downloadResume(sale.rp_pdf_path!)}>
//                     Download Resume
//                   </Button>
//                 ) : (
//                   <span className="text-gray-400 text-sm">—</span>
//                 )}
//               </TableCell>

//               {/* NEW: Portfolio Status (editable) */}
//    <TableCell className="space-y-2">
//   {sale.rp_portfolio_status === "completed" && sale.rp_portfolio_link ? (
//     <a href={sale.rp_portfolio_link} target="_blank" rel="noreferrer" className="text-blue-600 underline break-all">
//       {sale.rp_portfolio_link}
//     </a>
//   ) : (
//     <Select
//       onValueChange={(v) => handlePortfolioStatusChange(sale, v as PortfolioUI)}
//       value={PORTFOLIO_DB_TO_UI(sale.rp_portfolio_status)}
//     >
//       <SelectTrigger className="w-[220px]">
//         <SelectValue placeholder="Set status" />
//       </SelectTrigger>
//       <SelectContent>
//         <SelectItem value="Pending">Pending</SelectItem>
//         <SelectItem value="Waiting for Client approval">Waiting for Client approval</SelectItem>
//         <SelectItem value="Success">Success</SelectItem>
//       </SelectContent>
//     </Select>
//   )}
// </TableCell>



//               {/* NEW: Assignee (names of Heads + Associates; save email) */}
//               <TableCell>
//   {(() => {
//     const current = assigneeByRow[sale.id] ?? sale.associates_email ?? sale.associates_tl_email ?? "";
//     const inList = !!teamMembers.find((m) => m.user_email === current);

//     return (
//       <Select
//         value={current || undefined}
//         onValueChange={(email) => handleAssign(sale, email)}
//       >
//         <SelectTrigger className="w-[240px]">
//           <SelectValue placeholder="Assign to..." />
//         </SelectTrigger>
//         <SelectContent>
//           {/* fallback so Select can show current even if not in role filters */}
//           {!inList && current && (
//             <SelectItem value={current} className="hidden">
//               {sale.associates_name || sale.associates_tl_name || current}
//             </SelectItem>
//           )}

//           <div className="px-2 py-1 text-xs text-muted-foreground">Technical Heads</div>
//           {teamMembers
//             .filter((m) => m.roles === "Technical Head")
//             .map((m) => (
//               <SelectItem key={m.user_email} value={m.user_email}>
//                 {m.full_name} • Head
//               </SelectItem>
//             ))}

//           <div className="px-2 py-1 text-xs text-muted-foreground">Technical Associates</div>
//           {teamMembers
//             .filter((m) => m.roles === "Technical Associate")
//             .map((m) => (
//               <SelectItem key={m.user_email} value={m.user_email}>
//                 {m.full_name} • Associate
//               </SelectItem>
//             ))}
//         </SelectContent>
//       </Select>
//     );
//   })()}
// </TableCell>


//               <TableCell>{sale.closed_at ? new Date(sale.closed_at).toLocaleDateString("en-GB") : "-"}</TableCell>
//             </TableRow>
//           ))}
//           {rows.length === 0 && (
//             <TableRow>
//               <TableCell colSpan={PORTFOLIO_COLUMNS.length} className="text-center text-sm text-muted-foreground py-10">
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
//           {rows.map((sale) => (
//             <TableRow key={sale.id}>
//               <TableCell>{sale.lead_id}</TableCell>
//               <TableCell>{sale.leads?.name || "-"}</TableCell>
//               <TableCell>{sale.email}</TableCell>
//               <TableCell>{sale.leads?.phone || "-"}</TableCell>
//               <TableCell>{sale.finance_status}</TableCell>
//               <TableCell>{toNiceMoney(sale.github_sale_value)}</TableCell>
//               <TableCell>{sale.closed_at ? new Date(sale.closed_at).toLocaleDateString("en-GB") : "-"}</TableCell>
//             </TableRow>
//           ))}
//           {rows.length === 0 && (
//             <TableRow>
//               <TableCell colSpan={GITHUB_COLUMNS.length} className="text-center text-sm text-muted-foreground py-10">
//                 No GitHub sales found.
//               </TableCell>
//             </TableRow>
//           )}
//         </TableBody>
//       </Table>
//     </div>
//   );

//   return (
//     <ProtectedRoute allowedRoles={["Super Admin", "Technical Head", "Technical Associate"]}>
//       <DashboardLayout>
//         <div className="space-y-6">
//           <div className="flex items-center justify-between">
//             <h1 className="text-3xl font-bold text-gray-900">Technical Page</h1>
//           </div>

//           {loading ? (
//             <p className="p-6 text-gray-600">Loading...</p>
//           ) : (
//             <Tabs defaultValue="portfolio" className="w-full">
//               <TabsList className="grid grid-cols-2 w-full sm:w-auto">
//                 <TabsTrigger value="portfolio">Portfolios</TabsTrigger>
//                 <TabsTrigger value="github">GitHub</TabsTrigger>
//               </TabsList>

//               <TabsContent value="portfolio">{renderPortfolioTable(portfolioRows)}</TabsContent>
//               <TabsContent value="github">{renderGithubTable(githubRows)}</TabsContent>
//             </Tabs>
//           )}
//         </div>

//         <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
//   <DialogContent>
//     <DialogHeader>
//       <DialogTitle>Mark as Success</DialogTitle>
//     </DialogHeader>

//     <div className="space-y-2">
//       <label className="text-sm text-muted-foreground">Success link</label>
//       <Input
//         placeholder="https://…"
//         value={linkTargetLeadId ? linkDraft[linkTargetLeadId] ?? "" : ""}
//         onChange={(e) =>
//           setLinkDraft((prev) => ({
//             ...prev,
//             ...(linkTargetLeadId ? { [linkTargetLeadId]: e.target.value } : {}),
//           }))
//         }
//       />
//       <p className="text-xs text-muted-foreground">
//         Paste the final portfolio link. After saving, the status cell will show this link.
//       </p>
//     </div>

//     <DialogFooter className="mt-4">
//       <Button variant="outline" onClick={() => setLinkDialogOpen(false)}>
//         Cancel
//       </Button>
//       <Button onClick={handleSavePortfolioSuccess}>
//         Save
//       </Button>
//     </DialogFooter>
//   </DialogContent>
// </Dialog>

//       </DashboardLayout>
//     </ProtectedRoute>
//   );
// }



// "use client";

// import { useEffect, useState } from "react";
// import { useRouter } from "next/navigation";
// import { supabase } from "@/utils/supabase/client";

// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
// import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
// import { Button } from "@/components/ui/button";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { Input } from "@/components/ui/input";
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

// import ProtectedRoute from "@/components/auth/ProtectedRoute";
// import { DashboardLayout } from "@/components/layout/dashboard-layout";
// import { useAuth } from "@/components/providers/auth-provider";

// // ---------- Types ----------
// type FinanceStatus = "Paid" | "Unpaid" | "Paused" | "Closed" | "Got Placed";
// type ResumeStatus = "not_started" | "pending" | "waiting_client_approval" | "completed";

// const STATUS_LABEL: Record<ResumeStatus, string> = {
//   not_started: "Not started",
//   pending: "Pending",
//   waiting_client_approval: "Waiting for Client approval",
//   completed: "Completed",
// };

// // Portfolio UI <-> DB mapping (no "Started")
// const PORTFOLIO_UI_TO_DB = {
//   Pending: "pending",
//   "Waiting for Client approval": "waiting_client_approval",
//   Success: "completed",
// } as const;
// type PortfolioUI = keyof typeof PORTFOLIO_UI_TO_DB;

// const portfolioDbToUi = (db?: ResumeStatus | null): PortfolioUI =>
//   db === "completed"
//     ? "Success"
//     : db === "waiting_client_approval"
//     ? "Waiting for Client approval"
//     : "Pending"; // default for null/undefined/not_started/pending

// interface SalesClosure {
//   id: string;
//   lead_id: string;
//   email: string;
//   finance_status: FinanceStatus;
//   closed_at: string | null;
//   portfolio_sale_value?: number | null;
//   github_sale_value?: number | null;

//   associates_email?: string | null;
//   associates_name?: string | null;
//   associates_tl_email?: string | null;
//   associates_tl_name?: string | null;

//   leads?: { name: string; phone: string };

//   // from resume_progress
//   rp_status?: ResumeStatus;                 // existing "Resume Status" (read-only)
//   rp_pdf_path?: string | null;
//   rp_portfolio_status?: ResumeStatus | null;
//   rp_portfolio_link?: string | null;
// }

// interface TeamUser {
//   full_name: string;
//   user_email: string;
//   roles: "Technical Head" | "Technical Associate";
// }

// const PORTFOLIO_COLUMNS = [
//   "Client ID",
//   "Name",
//   "Email",
//   "Phone",
//   "Status",
//   "Resume Status",
//   "Resume PDF",
//   "Portfolio Status",
//   "Assignee",
//   "Closed At",
// ] as const;

// const GITHUB_COLUMNS = [
//   "Client ID",
//   "Name",
//   "Email",
//   "Phone",
//   "Status",
//   "GitHub Sale Value",
//   "Closed At",
// ] as const;

// // ---------- Component ----------
// export default function TechnicalTeamPage() {
//   const [loading, setLoading] = useState(true);
//   const [portfolioRows, setPortfolioRows] = useState<SalesClosure[]>([]);
//   const [githubRows, setGithubRows] = useState<SalesClosure[]>([]);
//   const [teamMembers, setTeamMembers] = useState<TeamUser[]>([]);

//   // per-lead link drafts (for success dialog)
//   const [linkDraft, setLinkDraft] = useState<Record<string, string>>({});
//   const [linkDialogOpen, setLinkDialogOpen] = useState(false);
//   const [linkTargetLeadId, setLinkTargetLeadId] = useState<string | null>(null);
//   const [linkTargetRowId, setLinkTargetRowId] = useState<string | null>(null);

//   // controlled Assignee value per row
//   const [assigneeByRow, setAssigneeByRow] = useState<Record<string, string | undefined>>({});

//   const { user } = useAuth();
//   const router = useRouter();

//   // ---------- Helpers ----------
//   const latestByLead = (rows: any[]) => {
//     const map = new Map<string, any>();
//     for (const r of rows ?? []) {
//       const ex = map.get(r.lead_id);
//       const ed = ex?.closed_at ?? "";
//       const cd = r?.closed_at ?? "";
//       if (!ex || new Date(cd) > new Date(ed)) map.set(r.lead_id, r);
//     }
//     return Array.from(map.values()).sort(
//       (a, b) => new Date(b.closed_at || "").getTime() - new Date(a.closed_at || "").getTime()
//     );
//   };

//   const toNiceMoney = (v?: number | null) =>
//     typeof v === "number" ? v.toLocaleString("en-IN", { maximumFractionDigits: 2 }) : "-";

//   // ---------- Data fetch ----------
//   const fetchData = async () => {
//     if (!user) return;

//     // portfolio rows
//     let qPortfolio = supabase
//       .from("sales_closure")
//       .select("*")
//       .not("portfolio_sale_value", "is", null)
//       .neq("portfolio_sale_value", 0);

//     // github rows
//     let qGithub = supabase
//       .from("sales_closure")
//       .select("*")
//       .not("github_sale_value", "is", null)
//       .neq("github_sale_value", 0);

//     // if (user.role === "Technical Associate") { ... }

//     const [{ data: pData, error: pErr }, { data: gData, error: gErr }] = await Promise.all([qPortfolio, qGithub]);
//     if (pErr || gErr) {
//       console.error("Failed to fetch sales data:", pErr || gErr);
//       return;
//     }

//     const pLatest = latestByLead(pData || []);
//     const gLatest = latestByLead(gData || []);
//     const allLeadIds = Array.from(new Set([...pLatest, ...gLatest].map((r) => r.lead_id)));

//     // leads
//     const { data: leadsData, error: leadsErr } = await supabase
//       .from("leads")
//       .select("business_id, name, phone")
//       .in("business_id", allLeadIds);
//     if (leadsErr) {
//       console.error("Failed to fetch leads:", leadsErr);
//       return;
//     }
//     const leadMap = new Map(leadsData?.map((l) => [l.business_id, { name: l.name, phone: l.phone }]));

//     // resume_progress (resume status + portfolio status/link)
//     const { data: progress, error: progErr } = await supabase
//       .from("resume_progress")
//       .select("lead_id, status, pdf_path, portfolio_status, portfolio_link")
//       .in("lead_id", allLeadIds);
//     if (progErr) {
//       console.error("Failed to fetch resume_progress:", progErr);
//       return;
//     }
//     const progMap = new Map(
//       progress?.map((p) => [
//         p.lead_id,
//         {
//           status: p.status as ResumeStatus,
//           pdf_path: p.pdf_path,
//           portfolio_status: (p as any).portfolio_status as ResumeStatus | null,
//           portfolio_link: (p as any).portfolio_link ?? null,
//         },
//       ])
//     );

//     // merge
//     const mergedPortfolio: SalesClosure[] = pLatest.map((r) => ({
//       ...r,
//       leads: leadMap.get(r.lead_id) || { name: "-", phone: "-" },
//       rp_status: progMap.get(r.lead_id)?.status ?? "not_started",
//       rp_pdf_path: progMap.get(r.lead_id)?.pdf_path ?? null,
//       rp_portfolio_status: progMap.get(r.lead_id)?.portfolio_status ?? null,
//       rp_portfolio_link: progMap.get(r.lead_id)?.portfolio_link ?? null,
//     }));

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
//       a.roles === b.roles ? a.full_name.localeCompare(b.full_name) : a.roles.localeCompare(b.roles)
//     );
//     setTeamMembers(sorted);
//   };

//   // ---------- Actions ----------
//   // Direct download from Supabase → auto-saves to Downloads
//   const downloadResume = async (path: string) => {
//     try {
//       const fileName = `Resume-${path.split("/")[0]}-${path.split("/").pop() || "resume"}.pdf`;
//       const { data, error } = await supabase.storage.from("resumes").createSignedUrl(path, 60 * 60);
//       if (error) throw error;
//       if (!data?.signedUrl) throw new Error("No signed URL");

//       const res = await fetch(data.signedUrl);
//       const blob = await res.blob();
//       const url = window.URL.createObjectURL(blob);

//       const a = document.createElement("a");
//       a.href = url;
//       a.download = fileName;
//       document.body.appendChild(a);
//       a.click();
//       a.remove();
//       window.URL.revokeObjectURL(url);
//     } catch (e: any) {
//       alert(e.message || "Could not download PDF");
//     }
//   };

//   const handlePortfolioStatusChange = async (sale: SalesClosure, uiValue: PortfolioUI) => {
//     if (uiValue === "Success") {
//       setLinkTargetLeadId(sale.lead_id);
//       setLinkTargetRowId(sale.id);
//       setLinkDraft((d) => ({ ...d, [sale.lead_id]: sale.rp_portfolio_link ?? "" }));
//       setLinkDialogOpen(true);
//       return;
//     }

//     const dbStatus = PORTFOLIO_UI_TO_DB[uiValue];
//     const { error } = await supabase
//       .from("resume_progress")
//       .upsert(
//         { lead_id: sale.lead_id, portfolio_status: dbStatus, updated_by: user?.email ?? null },
//         { onConflict: "lead_id" }
//       );
//     if (error) return alert(error.message);

//     setPortfolioRows((prev) =>
//       prev.map((r) => (r.id === sale.id ? { ...r, rp_portfolio_status: dbStatus } : r))
//     );
//   };

//   // const handleSavePortfolioSuccess = async () => {
//   //   const link = linkTargetLeadId ? (linkDraft[linkTargetLeadId] ?? "").trim() : "";
//   //   if (!link || !linkTargetLeadId || !linkTargetRowId) return alert("Please paste a link.");

//   //   const { error } = await supabase
//   //     .from("resume_progress")
//   //     .upsert(
//   //       {
//   //         lead_id: linkTargetLeadId,
//   //         portfolio_status: "completed",
//   //         portfolio_link: link,
//   //         updated_by: user?.email ?? null,
//   //       },
//   //       { onConflict: "lead_id" }
//   //     );
//   //   if (error) return alert(error.message);

//   //   setPortfolioRows((prev) =>
//   //     prev.map((r) =>
//   //       r.id === linkTargetRowId ? { ...r, rp_portfolio_status: "completed", rp_portfolio_link: link } : r
//   //     )
//   //   );
//   //   setLinkDialogOpen(false);
//   //   setLinkDraft({});
//   //   setLinkTargetLeadId(null);
//   //   setLinkTargetRowId(null);
//   // };

//   const handleSavePortfolioSuccess = async () => {
//   const link = linkTargetLeadId ? (linkDraft[linkTargetLeadId] ?? "").trim() : "";
//   try {
//     if (!/^https?:\/\//i.test(link)) throw new Error("Enter a valid http(s) URL.");
//     if (!linkTargetLeadId || !linkTargetRowId) throw new Error("Missing target lead/row.");

//     const { error } = await supabase
//       .from("resume_progress")
//       .upsert(
//         {
//           lead_id: linkTargetLeadId,
//           portfolio_status: "completed",
//           portfolio_link: link,
//           // If updated_by is UUID in DB, store the user ID, not email:
//           // updated_by: user?.id ?? null,
//           updated_by: user?.email ?? null,
//         },
//         { onConflict: "lead_id" }
//       );
//     if (error) throw error;

//     setPortfolioRows(prev =>
//       prev.map(r => r.id === linkTargetRowId
//         ? { ...r, rp_portfolio_status: "completed", rp_portfolio_link: link }
//         : r
//       )
//     );
//     setLinkDialogOpen(false);
//     setLinkDraft({});
//     setLinkTargetLeadId(null);
//     setLinkTargetRowId(null);
//   } catch (e: any) {
//     alert(e.message ?? "Failed to save link");
//   }
// };

//   // const handleAssign = async (sale: SalesClosure, memberEmail: string) => {
//   //   // optimistic selection
//   //   setAssigneeByRow((p) => ({ ...p, [sale.id]: memberEmail }));

//   //   const member = teamMembers.find((m) => m.user_email === memberEmail);
//   //   if (!member) return;

//   //   const updates: any = {};
//   //   if (member.roles === "Technical Head") {
//   //     updates.associates_tl_email = member.user_email;
//   //     updates.associates_tl_name = member.full_name;
//   //   } else {
//   //     updates.associates_email = member.user_email;
//   //     updates.associates_name = member.full_name;
//   //   }

//   //   const { error } = await supabase.from("sales_closure").update(updates).eq("id", sale.id);
//   //   if (error) {
//   //     alert(error.message || "Failed to assign member");
//   //     // revert UI
//   //     setAssigneeByRow((p) => ({
//   //       ...p,
//   //       [sale.id]: sale.associates_email ?? sale.associates_tl_email ?? undefined,
//   //     }));
//   //     return;
//   //   }

//   //   // keep row in sync
//   //   setPortfolioRows((prev) =>
//   //     prev.map((r) =>
//   //       r.id === sale.id
//   //         ? {
//   //             ...r,
//   //             ...(member.roles === "Technical Head"
//   //               ? { associates_tl_email: member.user_email, associates_tl_name: member.full_name }
//   //               : { associates_email: member.user_email, associates_name: member.full_name }),
//   //           }
//   //         : r
//   //     )
//   //   );
//   // };

// const handleAssign = async (sale: SalesClosure, memberEmail: string) => {
//   setAssigneeByRow(p => ({ ...p, [sale.id]: memberEmail }));

//   const member = teamMembers.find(m => m.user_email === memberEmail);
//   if (!member) return;

//   const updates =
//     member.roles === "Technical Head"
//       ? { associates_tl_email: member.user_email, associates_tl_name: member.full_name }
//       : { associates_email: member.user_email, associates_name: member.full_name };

//   const { error } = await supabase
//     .from("sales_closure")
//     .update(updates)
//     .eq("id", sale.id);

//   if (error) {
//     console.error("Assign failed:", { saleId: sale.id, updates, error });
//     alert(error.message || "Failed to assign member");
//     setAssigneeByRow(p => ({ ...p, [sale.id]: sale.associates_email ?? sale.associates_tl_email ?? undefined }));
//     return;
//   }

//   setPortfolioRows(prev =>
//     prev.map(r => r.id === sale.id
//       ? { ...r, ...(member.roles === "Technical Head"
//             ? { associates_tl_email: member.user_email, associates_tl_name: member.full_name }
//             : { associates_email: member.user_email, associates_name: member.full_name }) }
//       : r
//     )
//   );
// };

//   // ---------- Effects ----------
//   useEffect(() => {
//     if (user === null) return;
//     const allowed = ["Super Admin", "Technical Head", "Technical Associate"] as const;
//     if (!user || !allowed.includes(user.role as any)) {
//       router.push("/unauthorized");
//       return;
//     }
//     setLoading(false);
//   }, [user, router]);

//   useEffect(() => {
//     if (user) {
//       fetchData();
//       fetchTeam();
//     }
//   }, [user]);

//   // Seed/stick assignee select values
//   useEffect(() => {
//     setAssigneeByRow((prev) => {
//       const next = { ...prev };
//       for (const r of portfolioRows) {
//         const current = r.associates_email ?? r.associates_tl_email ?? undefined;
//         if (next[r.id] === undefined) next[r.id] = current;
//       }
//       return next;
//     });
//   }, [portfolioRows, teamMembers]);

//   // ---------- Renderers ----------
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
//           {rows.map((sale) => (
//             <TableRow key={sale.id}>
//               <TableCell>{sale.lead_id}</TableCell>
//               <TableCell>{sale.leads?.name || "-"}</TableCell>
//               <TableCell>{sale.email}</TableCell>
//               <TableCell>{sale.leads?.phone || "-"}</TableCell>
//               <TableCell>{sale.finance_status}</TableCell>

//               {/* Resume Status (read-only) */}
//               <TableCell>{STATUS_LABEL[(sale.rp_status ?? "not_started") as ResumeStatus]}</TableCell>

//               {/* Resume PDF */}
//               <TableCell>
//                 {sale.rp_pdf_path ? (
//                   <Button variant="outline" size="sm" onClick={() => downloadResume(sale.rp_pdf_path!)}>
//                     Download Resume
//                   </Button>
//                 ) : (
//                   <span className="text-gray-400 text-sm">—</span>
//                 )}
//               </TableCell>

//               {/* Portfolio Status */}
//               <TableCell className="space-y-2">
//                 {sale.rp_portfolio_status === "completed" && sale.rp_portfolio_link ? (
//                   <a
//                     href={sale.rp_portfolio_link}
//                     target="_blank"
//                     rel="noreferrer"
//                     className="text-blue-600 underline break-all"
//                     title="Open portfolio link"
//                   >
//                     {sale.rp_portfolio_link}
//                   </a>
//                 ) : (
//                   <Select
//                     onValueChange={(v) => handlePortfolioStatusChange(sale, v as PortfolioUI)}
//                     value={portfolioDbToUi(sale.rp_portfolio_status)}
//                   >
//                     <SelectTrigger className="w-[220px]">
//                       <SelectValue placeholder="Set status" />
//                     </SelectTrigger>
//                     <SelectContent>
//                       <SelectItem value="Pending">Pending</SelectItem>
//                       <SelectItem value="Waiting for Client approval">Waiting for Client approval</SelectItem>
//                       <SelectItem value="Success">Success</SelectItem>
//                     </SelectContent>
//                   </Select>
//                 )}
//               </TableCell>

//               {/* Assignee */}
//               <TableCell>
//                 {(() => {
//                   const current = assigneeByRow[sale.id] ?? sale.associates_email ?? sale.associates_tl_email ?? "";
//                   const inList = !!teamMembers.find((m) => m.user_email === current);

//                   return (
//                     <Select value={current || undefined} onValueChange={(email) => handleAssign(sale, email)}>
//                       <SelectTrigger className="w-[240px]">
//                         <SelectValue placeholder="Assign to..." />
//                       </SelectTrigger>
//                       <SelectContent>
//                         {/* fallback so Select can show current even if not in the filtered list */}
//                         {!inList && current && (
//                           <SelectItem value={current} className="hidden">
//                             {sale.associates_name || sale.associates_tl_name || current}
//                           </SelectItem>
//                         )}

//                         <div className="px-2 py-1 text-xs text-muted-foreground">Technical Heads</div>
//                         {teamMembers
//                           .filter((m) => m.roles === "Technical Head")
//                           .map((m) => (
//                             <SelectItem key={m.user_email} value={m.user_email}>
//                               {m.full_name} • Head
//                             </SelectItem>
//                           ))}

//                         <div className="px-2 py-1 text-xs text-muted-foreground">Technical Associates</div>
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

//               <TableCell>{sale.closed_at ? new Date(sale.closed_at).toLocaleDateString("en-GB") : "-"}</TableCell>
//             </TableRow>
//           ))}
//           {rows.length === 0 && (
//             <TableRow>
//               <TableCell colSpan={PORTFOLIO_COLUMNS.length} className="text-center text-sm text-muted-foreground py-10">
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
//           {rows.map((sale) => (
//             <TableRow key={sale.id}>
//               <TableCell>{sale.lead_id}</TableCell>
//               <TableCell>{sale.leads?.name || "-"}</TableCell>
//               <TableCell>{sale.email}</TableCell>
//               <TableCell>{sale.leads?.phone || "-"}</TableCell>
//               <TableCell>{sale.finance_status}</TableCell>
//               <TableCell>{toNiceMoney(sale.github_sale_value)}</TableCell>
//               <TableCell>{sale.closed_at ? new Date(sale.closed_at).toLocaleDateString("en-GB") : "-"}</TableCell>
//             </TableRow>
//           ))}
//           {rows.length === 0 && (
//             <TableRow>
//               <TableCell colSpan={GITHUB_COLUMNS.length} className="text-center text-sm text-muted-foreground py-10">
//                 No GitHub sales found.
//               </TableCell>
//             </TableRow>
//           )}
//         </TableBody>
//       </Table>
//     </div>
//   );

//   return (
//     <ProtectedRoute allowedRoles={["Super Admin", "Technical Head", "Technical Associate"]}>
//       <DashboardLayout>
//         <div className="space-y-6">
//           <div className="flex items-center justify-between">
//             <h1 className="text-3xl font-bold text-gray-900">Technical Page</h1>
//           </div>

//           {loading ? (
//             <p className="p-6 text-gray-600">Loading...</p>
//           ) : (
//             <Tabs defaultValue="portfolio" className="w-full">
//               <TabsList className="grid grid-cols-2 w-full sm:w-auto">
//                 <TabsTrigger value="portfolio">Portfolios</TabsTrigger>
//                 <TabsTrigger value="github">GitHub</TabsTrigger>
//               </TabsList>

//               <TabsContent value="portfolio">{renderPortfolioTable(portfolioRows)}</TabsContent>
//               <TabsContent value="github">{renderGithubTable(githubRows)}</TabsContent>
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
//               <label className="text-sm text-muted-foreground">Success link</label>
//               <Input
//                 placeholder="https://…"
//                 value={linkTargetLeadId ? linkDraft[linkTargetLeadId] ?? "" : ""}
//                 onChange={(e) =>
//                   setLinkDraft((prev) => ({
//                     ...prev,
//                     ...(linkTargetLeadId ? { [linkTargetLeadId]: e.target.value } : {}),
//                   }))
//                 }
//               />
//               <p className="text-xs text-muted-foreground">
//                 Paste the final portfolio link. After saving, the status cell will show this link.
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
//       </DashboardLayout>
//     </ProtectedRoute>
//   );
// }



"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase/client";

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
} from "@/components/ui/dialog";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useAuth } from "@/components/providers/auth-provider";

/* =========================
   Types & Constants
   ========================= */

type FinanceStatus = "Paid" | "Unpaid" | "Paused" | "Closed" | "Got Placed";

type ResumeStatus =
  | "not_started"
  | "pending"
  | "waiting_client_approval"
  | "completed";

const STATUS_LABEL: Record<ResumeStatus, string> = {
  not_started: "Not started",
  pending: "Pending",
  waiting_client_approval: "Waiting for Client approval",
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
  "Client ID",
  "Name",
  "Email",
  "Phone",
  "Status",
  "Resume Status",
  "Resume PDF",
  "Portfolio Status",
  "Assignee",
  "Closed At",
] as const;

const GITHUB_COLUMNS = [
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

  // Controlled Assignee value per portfolio row (keyed by sales_closure.id)
  const [assigneeByRow, setAssigneeByRow] = useState<
    Record<string, string | undefined>
  >({});

  const { user } = useAuth();
  const router = useRouter();

  /* =========================
     Helpers
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
  };

  const toNiceMoney = (v?: number | null) =>
    typeof v === "number"
      ? v.toLocaleString("en-IN", { maximumFractionDigits: 2 })
      : "-";

  /* =========================
     Data Fetch
     ========================= */

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
      const fileName = `Resume-${path.split("/")[0]}-${
        path.split("/").pop() || "resume"
      }.pdf`;
      const { data, error } = await supabase.storage
        .from("resumes")
        .createSignedUrl(path, 60 * 60);
      if (error) throw error;
      if (!data?.signedUrl) throw new Error("No signed URL");

      const res = await fetch(data.signedUrl);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e: any) {
      alert(e.message || "Could not download PDF");
    }
  };

  // Update portfolio status (non-success) OR open dialog for success
  const handlePortfolioStatusChange = async (
    sale: SalesClosure,
    next: PortfolioStatus
  ) => {
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
        {
          lead_id: sale.lead_id,
          status: next,
          updated_by: user?.email ?? null,
        },
        { onConflict: "lead_id" }
      );
    if (error) return alert(error.message);

    setPortfolioRows((prev) =>
      prev.map((r) =>
        r.id === sale.id ? { ...r, pp_status: next, pp_link: null } : r
      )
    );
  };

  // Save success link
  const handleSavePortfolioSuccess = async () => {
    const link = linkTargetLeadId
      ? (linkDraft[linkTargetLeadId] ?? "").trim()
      : "";
    if (!link || !linkTargetLeadId || !linkTargetRowId)
      return alert("Please paste a link.");
    if (!/^https?:\/\//i.test(link))
      return alert("Enter a valid http(s) URL.");

    const { error } = await supabase
      .from("portfolio_progress")
      .upsert(
        {
          lead_id: linkTargetLeadId,
          status: "success",
          link,
          updated_by: user?.email ?? null, // if you switch to UUID, write user?.id here and change DB type
        },
        { onConflict: "lead_id" }
      );
    if (error) return alert(error.message);

    setPortfolioRows((prev) =>
      prev.map((r) =>
        r.id === linkTargetRowId
          ? { ...r, pp_status: "success", pp_link: link }
          : r
      )
    );
    setLinkDialogOpen(false);
    setLinkDraft({});
    setLinkTargetLeadId(null);
    setLinkTargetRowId(null);
  };

  // Assign portfolio owner (stored in portfolio_progress)
  const handleAssignPortfolio = async (
    sale: SalesClosure,
    memberEmail: string
  ) => {
    // optimistic UI
    setAssigneeByRow((p) => ({ ...p, [sale.id]: memberEmail }));

    const member = teamMembers.find((m) => m.user_email === memberEmail);
    if (!member) return;

    const { error } = await supabase
      .from("portfolio_progress")
      .upsert(
        {
          lead_id: sale.lead_id,
          assigned_email: member.user_email,
          assigned_name: member.full_name,
          updated_by: user?.email ?? null,
        },
        { onConflict: "lead_id" }
      );

    if (error) {
      alert(error.message || "Failed to assign portfolio owner");
      setAssigneeByRow((p) => ({
        ...p,
        [sale.id]: sale.pp_assigned_email ?? undefined,
      }));
      return;
    }

    setPortfolioRows((prev) =>
      prev.map((r) =>
        r.id === sale.id
          ? {
              ...r,
              pp_assigned_email: member.user_email,
              pp_assigned_name: member.full_name,
            }
          : r
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
          {rows.map((sale) => (
            <TableRow key={sale.id}>
              <TableCell>{sale.lead_id}</TableCell>
              <TableCell>{sale.leads?.name || "-"}</TableCell>
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

              {/* Assignee (stored in portfolio_progress) */}
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
                    >
                      <SelectTrigger className="w-[240px]">
                        <SelectValue placeholder="Assign to..." />
                      </SelectTrigger>
                      <SelectContent>
                        {/* fallback so Select can show current even if not in the list */}
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
          {rows.map((sale) => (
            <TableRow key={sale.id}>
              <TableCell>{sale.lead_id}</TableCell>
              <TableCell>{sale.leads?.name || "-"}</TableCell>
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
                value={linkTargetLeadId ? linkDraft[linkTargetLeadId] ?? "" : ""}
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
      </DashboardLayout>
    </ProtectedRoute>
  );
}
