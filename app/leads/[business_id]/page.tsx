// //app/leads/[business_id]/page.tsx
// "use client";

// import { useEffect, useState } from "react";
// import { useParams } from "next/navigation";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Textarea } from "@/components/ui/textarea";
// import { Button } from "@/components/ui/button";
// import { supabase } from "@/utils/supabase/client";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { Loader2 } from "lucide-react";
// import { useAuth } from "@/components/providers/auth-provider";
// import ProtectedRoute from "@/components/auth/ProtectedRoute";
// import { DashboardLayout } from "@/components/layout/dashboard-layout";

// interface Lead {
//   id: string;
//   business_id: string;
//   name: string;
//   phone: string;
//   email: string;
//   city: string;
//   source: string;
//   status: string;
//   created_at: string;
//   assigned_to?: string;
//   paid_amount?: number;
// }

// interface ResumeProgress {
//   lead_id: string;
//   status: string;            // enum on DB, string in TS
//   pdf_path: string | null;
//   pdf_uploaded_at: string | null;
//   updated_at: string | null;
//   assigned_to_email: string | null;
//   assigned_to_name: string | null;
// }

// interface PortfolioProgress {
//   lead_id: string;
//   status: string;            // 'not_started' | 'pending' | ...
//   link: string | null;
//   assigned_email: string | null;
//   assigned_name: string | null;
//   updated_at: string | null;
// }

// // 🔁 1) ADD these types near your other interfaces
// interface ClientOnboardingDetails {
//   full_name: string;
//   personal_email: string;
//   callable_phone: string | null;
//   company_email: string | null;
//   job_role_preferences: string[] | null;
//   salary_range: string | null;
//   location_preferences: string[] | null;
//   work_auth_details: string | null;
//   resume_path: string | null;
//   cover_letter_path: string | null;
//   created_at: string | null;
//   lead_id: string | null;
// }

// export default function LeadProfilePage() {
//   const { business_id } = useParams();
//   const [lead, setLead] = useState<Lead | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [saleHistory, setSaleHistory] = useState<any[]>([]);
//   const [callHistory, setCallHistory] = useState<any[]>([]);
//   const [feedbackList, setFeedbackList] = useState<any[]>([]);
//     const [renewal, setRenewal] = useState<Lead | null>(null);
//     const [onboarding, setOnboarding] = useState<ClientOnboardingDetails | null>(null);


// const [resumeProg, setResumeProg] = useState<ResumeProgress | null>(null);
// const [portfolioProg, setPortfolioProg] = useState<PortfolioProgress | null>(null);

// const { user }= useAuth();


// const allowedRoles = [
//   "Marketing",
//   "Sales",
//   "Super Admin",
//   "Finance",
//   "Accounts",
//   "Resume Head",
//   "Technical Head",
//   "Sales Associate",
// ];


// useEffect(() => {
//   if (!business_id) return;

//   const fetchAll = async () => {
//     // Lead
//     const { data: leadRow, error: leadErr } = await supabase
//       .from("leads")
//       .select("*")
//       .eq("business_id", business_id)
//       .single();
//     if (leadErr) {
//       console.error("Error fetching lead:", leadErr.message);
//       setLead(null);
//     } else {
//       setLead(leadRow as Lead);
//     }

//     // Sales history (ascending by onboarded_date -> latest is last)
//     const { data: salesRows, error: salesErr } = await supabase
//       .from("sales_closure")
//       .select("*")
//       .eq("lead_id", business_id)
//       .order("onboarded_date", { ascending: true });
//     if (salesErr) console.error("Error fetching sales history:", salesErr.message);
//     setSaleHistory(salesRows ?? []);

//     // Call history
//     const { data: callRows, error: callErr } = await supabase
//       .from("call_history")
//       .select("*")
//       .eq("lead_id", business_id)
//       .order("followup_date", { ascending: false });
//     if (callErr) console.error("Error fetching call history:", callErr.message);
//     setCallHistory(callRows ?? []);

//     // Client feedback
//     const { data: fbRows, error: fbErr } = await supabase
//       .from("client_feedback")
//       .select("*")
//       .eq("lead_id", business_id)
//       .order("id", { ascending: false });
//     if (fbErr) console.error("Error fetching client feedback:", fbErr.message);
//     setFeedbackList(fbRows ?? []);

//     // Resume Progress (unique per lead, per your schema)
//     const { data: rpRow, error: rpErr } = await supabase
//       .from("resume_progress")
//       .select("lead_id,status,pdf_path,pdf_uploaded_at,updated_at,assigned_to_email,assigned_to_name")
//       .eq("lead_id", business_id)
//       .maybeSingle();
//     if (rpErr) console.error("Error fetching resume_progress:", rpErr.message);
//     setResumeProg(rpRow ?? null);

//     // Portfolio Progress (PK = lead_id)
//     const { data: ppRow, error: ppErr } = await supabase
//       .from("portfolio_progress")
//       .select("lead_id,status,link,assigned_email,assigned_name,updated_at")
//       .eq("lead_id", business_id)
//       .maybeSingle();
//     if (ppErr) console.error("Error fetching portfolio_progress:", ppErr.message);
//     setPortfolioProg(ppRow ?? null);

//     const { data: coRow, error: coErr } = await supabase
//   .from("client_onborading_details")
//   .select(`
//     full_name,
//     personal_email,
//     callable_phone,
//     company_email,
//     job_role_preferences,
//     salary_range,
//     location_preferences,
//     work_auth_details,
//     resume_path,
//     cover_letter_path,
//     created_at,
//     needs_sponsorship,
//     full_address,
//     linkedin_url,
//     date_of_birth,
//     lead_id
//   `)
//   .eq("lead_id", business_id as string)
//   .order("created_at", { ascending: false })
//   .limit(1)
//   .maybeSingle();

// if (coErr) {
//   console.error("Error fetching client_onborading_details:", coErr.message);
//   setOnboarding(null);
// } else {
//   setOnboarding(coRow as ClientOnboardingDetails);
// }

//     setLoading(false);
//   };

//   setLoading(true);
//   fetchAll();
// }, [business_id]);


//   if (loading) {
//     return (
//       <div className="flex items-center justify-center h-screen">
//         <Loader2 className="animate-spin w-8 h-8 text-gray-600" />
//       </div>
//     );
//   }

//   if (!lead) {
//     return (
//       <div className="flex items-center justify-center h-screen text-gray-600">
//         No lead found with ID: {business_id}
//       </div>
//     );
//   }
// const money = (v: any) => {
//   const n = Number(v);
//   return Number.isFinite(n) && n > 0 ? `$${n.toLocaleString()}` : "—";
// };

// const fmt = (d?: string | null) =>
//   d ? new Date(d).toLocaleString() : "—";

// const listFmt = (arr?: string[] | null) => (arr && arr.length ? arr.join(", ") : "—");


// const downloadFromStorage = async (path: string, downloadName: string) => {
//   try {
//     const { data, error } = await supabase
//       .storage
//       .from("resumes")                 // <- bucket name
//       .createSignedUrl(path, 60 * 10); // 10 minutes

//     if (error || !data?.signedUrl) throw error || new Error("No signed URL");

//     const res = await fetch(data.signedUrl);
//     if (!res.ok) throw new Error(`Download failed (${res.status})`);

//     const blob = await res.blob();
//     const url = URL.createObjectURL(blob);
//     const a = document.createElement("a");
//     a.href = url;
//     a.download = downloadName;
//     document.body.appendChild(a);
//     a.click();
//     a.remove();
//     URL.revokeObjectURL(url);
//   } catch (e: any) {
//     console.error(e);
//     alert(e?.message || "Could not download file");
//   }
// };

// // 🆕 Convenience wrappers
// const downloadLatestResume = async () => {
//   if (!onboarding?.resume_path || !lead?.business_id) {
//     alert("No resume PDF found."); return;
//   }
//   await downloadFromStorage(onboarding.resume_path, `resume-${lead.business_id}-${lead.name}.pdf`);
// };
// const downloadLatestCover = async () => {
//   if (!onboarding?.cover_letter_path || !lead?.business_id) {
//     alert("No cover letter PDF found."); return;
//   }
//   await downloadFromStorage(onboarding.cover_letter_path, `cover-${lead.business_id}-${lead.name}.pdf`);
// };

// // Download resume PDF with fixed filename: "resume-<lead_id>.pdf"
// const downloadResume = async (leadId: string, path?: string | null) => {
//   try {
//     if (!path) {
//       alert("No resume PDF found."); return;
//     }
//     // Bucket name is assumed "resumes" — change if different
//     const { data, error } = await supabase
//       .storage.from("resumes")
//       .createSignedUrl(path, 60 * 10); // 10 minutes

//     if (error || !data?.signedUrl) throw error || new Error("No signed URL");

//     const res = await fetch(data.signedUrl);
//     if (!res.ok) throw new Error(`Download failed (${res.status})`);

//     const blob = await res.blob();
//     const url = URL.createObjectURL(blob);
//     const a = document.createElement("a");
//     a.href = url;
//     a.download = `resume-${leadId}.pdf`;
//     document.body.appendChild(a);
//     a.click();
//     a.remove();
//     URL.revokeObjectURL(url);
//   } catch (e: any) {
//     console.error(e);
//     alert(e?.message || "Could not download PDF");
//   }
// };
//     // console.log(user?.name, user?.role);



//   return (

//     //  <ProtectedRoute allowedRoles={["Sales","Sales Associate","Super Admin"]}>
//       <DashboardLayout>
//     <div className="min-h-screen h-screen w-full bg-gray-50">

// <div className="grid grid-cols-1 md:grid-cols-4 grid-rows-2 gap-3 h-full">
//   {/* 1️⃣ Lead Profile (Left, Top) */}
//   <Card className="h-full col-span-1 row-span-1 overflow-auto">
//     <CardHeader>
//       <CardTitle className="text-2xl font-bold">Lead Profile</CardTitle>
//     </CardHeader>
//     <CardContent className="space-y-4 text-sm text-gray-800">
//       <div><strong>Business ID:</strong> {lead.business_id}</div>
//       <div><strong>Name:</strong> {lead.name}</div>
//       <div><strong>Phone:</strong> {lead.phone}</div>
//       <div><strong>Email:</strong> {lead.email}</div>
//       <div><strong>City:</strong> {lead.city}</div>
//       <div><strong>Source:</strong> <Badge>{lead.source}</Badge></div>
//       <div><strong>Status:</strong> <Badge>{lead.status}</Badge></div>
//       <div><strong>Created At:</strong> {new Date(lead.created_at).toLocaleString()}</div>
//       <div><strong>Salesperson:</strong> {lead.assigned_to || "Not Assigned"}</div>
//     </CardContent>
//   </Card>

// {/* Addons and Requireemnts */}
  
// {/* Add-ons & Requirements */}

// {/* <div className="h-full col-span-3"> */}

// <Card className="h-full col-span-2 row-span-1 overflow-scroll">
//   <CardHeader>
//     <CardTitle className="text-2xl font-bold">Client onboarding details</CardTitle>
//   </CardHeader>
//   <CardContent>
//     {!onboarding ? (
//       <div className="text-gray-500 italic">No onboarding details submitted yet.</div>
//     ) : (
//       <div className="space-y-6">
//         {/* Top meta row */}
        
//         {/* Identity */}
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//           <div className="space-y-1.5">
//             <Label>Full Name</Label>
//             <Input value={onboarding.full_name ?? ""} readOnly />
//           </div>
          
//           <div className="space-y-1.5">
//             <Label>Company Email</Label>
//             <Input value={onboarding.company_email ?? ""} readOnly />
//           </div>
//           <div className="space-y-1.5">
//             <Label>Callable Phone</Label>
//             <Input value={onboarding.callable_phone ?? ""} readOnly />
//           </div>

         
//           <div className="space-y-1.5">
//             <Label>Last Submitted</Label>
//             <Input value={fmt(onboarding.created_at)} readOnly />
//           </div>

//         </div>

//         {/* Preferences */}
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//           <div className="space-y-1.5">
//             <Label>Job Role Preferences</Label>
//             <Textarea value={listFmt(onboarding.job_role_preferences)} rows={3} readOnly />
//           </div>
//           <div className="space-y-1.5">
//             <Label>Location Preferences</Label>
//             <Textarea value={listFmt(onboarding.location_preferences)} rows={3} readOnly />
//           </div>
//         </div>

//         {/* Misc */}
//         <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
//           <div className="space-y-1.5">
//             <Label>Salary Range</Label>
//             <Input value={onboarding.salary_range ?? ""} readOnly />
//           </div>
//           <div className="space-y-1.5">
//             <Label>Work Auth Details</Label>
//             <Input value={onboarding.work_auth_details ?? ""} readOnly />
//           </div>
//            <div className="flex flex-wrap items-center pt-7">
//           <Button
//             type="button"
//             onClick={downloadLatestResume}
//             disabled={!onboarding.resume_path}
//             className="min-w-[160px] bg-blue-500"
//           >
//             Download Resume
//           </Button>
//           </div>
//           <div className="flex flex-wrap items-center pt-7">
//           <Button
//             type="button"
//             // variant="secondary"
//             onClick={downloadLatestCover}
//             disabled={!onboarding.cover_letter_path}
//             className="min-w-[160px] bg-green-500"
//           >
//             Download Cover Ltr
//           </Button>
//         </div>
//         </div>

//         {/* Files */}
       
//       </div>
//     )}
//   </CardContent>
// </Card>


// <Card className="h-full col-span-1 row-span-1 overflow-auto">
//   <CardHeader>
//     <CardTitle className="text-2xl font-bold">Add-ons & Requirements</CardTitle>
//   </CardHeader>
//   <CardContent className="space-y-3 text-sm">
//     {saleHistory.length === 0 ? (
//       <div className="text-gray-500 italic">No add-ons or commitments recorded yet.</div>
//     ) : (() => {
//         // Use the latest sale (your saleHistory is ASC by onboarded_date)
//         const latest = saleHistory[saleHistory.length - 1];

//         return (
          
//           <div className="space-y-3">
//             <div className="grid grid-cols-2 gap-2">
//               <div className="flex items-center justify-between border rounded-md px-3 py-2">
//                 <span className="font-medium">Resume</span>
//                 {/* <span className="text-gray-700">{money(latest?.resume_sale_value)}</span> */}
//                 {allowedRoles.includes(user?.role || "") ? (
//   <span className="text-gray-700">{money(latest?.resume_sale_value)}</span>
// ) : (
//   <Badge className="bg-green-100 text-green-700 border-green-200">Paid</Badge>
// )}

//               </div>
//               <div className="flex items-center justify-between border rounded-md px-3 py-2">
//                 <span className="font-medium">LinkedIn</span>
//                 {/* <span className="text-gray-700">{money(latest?.linkedin_sale_value)}</span> */}
//                 {allowedRoles.includes(user?.role || "") ? (
//   <span className="text-gray-700">{money(latest?.linkedin_sale_value)}</span>
// ) : (
//   <Badge className="bg-green-100 text-green-700 border-green-200">Paid</Badge>
// )}

//               </div>
//               <div className="flex items-center justify-between border rounded-md px-3 py-2">
//                 <span className="font-medium">Portfolio</span>
//                 {/* <span className="text-gray-700">{money(latest?.portfolio_sale_value)}</span> */}
//                   {allowedRoles.includes(user?.role || "") ? (
//   <span className="text-gray-700">{money(latest?.portfolio_sale_value)}</span>
// ) : (
//   <Badge className="bg-green-100 text-green-700 border-green-200">Paid</Badge>
// )}
//               </div>
//               <div className="flex items-center justify-between border rounded-md px-3 py-2">
//                 <span className="font-medium">GitHub</span>
//                 {/* <span className="text-gray-700">{money(latest?.github_sale_value)}</span> */}
//                  {allowedRoles.includes(user?.role || "") ? (
//   <span className="text-gray-700">{money(latest?.github_sale_value)}</span>
// ) : (
//   <Badge className="bg-green-100 text-green-700 border-green-200">Paid</Badge>
// )}
//               </div>
//                <div className="flex items-center justify-between border rounded-md px-3 py-2">
//                 <span className="font-medium">Courses</span>
//                 {/* <span className="text-gray-700">{money(latest?.courses_sale_value)}</span> */}
//                 {allowedRoles.includes(user?.role || "") ? (
//   <span className="text-gray-700">{money(latest?.courses_sale_value)}</span>
// ) : (
//   <Badge className="bg-green-100 text-green-700 border-green-200">Paid</Badge>
// )}
//               </div>
             
//               <div className="flex items-center justify-between border rounded-md px-3 py-2">
//                 {/* <span className="font-medium">Custom Label</span> */}
//                 <span className="text-gray-700">{latest?.custom_label || "Custom add on sales"}</span>
//                  {/* <span className="text-gray-700">{money(latest?.custom_sale_value)}</span> */}

//                   {allowedRoles.includes(user?.role || "") ? (
//   <span className="text-gray-700">{money(latest?.custom_sale_value)}</span>
// ) : (
//   <Badge className="bg-green-100 text-green-700 border-green-200">Paid</Badge>
// )}
//               </div>
//               {/* <div className="flex items-center justify-between border rounded-md px-3 py-2">
//                 <span className="font-medium">Custom Value</span>
//                 <span className="text-gray-700">{money(latest?.custom_sale_value)}</span>
//               </div> */}
              
//             </div>

//             <div className="border rounded-md p-3">
//               <div className="font-medium mb-1">Commitments</div>
//               <div className="text-gray-700 whitespace-pre-wrap">
//                 {latest?.commitments?.trim() ? latest.commitments : "—"}
//               </div>
//             </div>

//             <div className="text-xs text-gray-500">
//               Showing latest sale/renewal add-ons.
//             </div>
//           </div>
//         );
//     })()}

//       {/* Work Artifacts */}
//     <div className="space-y-2">
//       <div className="font-semibold">Work Artifacts</div>

//       {/* Resume PDF */}
//       <div className="flex items-center justify-between border rounded-md px-3 py-2">
//         <div className="flex items-center gap-2">
//           <span>Resume PDF</span>
//           <Badge variant="outline">{resumeProg?.status ?? "Not started"}</Badge>
//         </div>
//         <div className="flex items-center gap-3">
//           <span className="text-xs text-gray-500">Updated: {fmt(resumeProg?.updated_at)}</span>
//           {resumeProg?.pdf_path ? (
//             <button
//               className="underline text-blue-600"
//               onClick={() => downloadResume(String(business_id), resumeProg.pdf_path!)}
//             >
//               Download
//             </button>
//           ) : (
//             <span className="text-gray-400">—</span>
//           )}
//         </div>
//       </div>

//       {/* Portfolio Link */}
//       <div className="flex items-center justify-between border rounded-md px-3 py-2">
//         <div className="flex items-center gap-2">
//           <span>Portfolio</span>
//           <Badge variant="outline">{portfolioProg?.status ?? "Not started"}</Badge>
//         </div>
//         <div className="flex items-center gap-3">
//           <span className="text-xs text-gray-500">Updated: {fmt(portfolioProg?.updated_at)}</span>
//           {portfolioProg?.link ? (
//             <a
//               href={portfolioProg.link}
//               target="_blank"
//               rel="noreferrer"
//               className="underline text-blue-600"
//             >
//               Open
//             </a>
//           ) : (
//             <span className="text-gray-400">—</span>
//           )}
//         </div>
//       </div>

//       {/* Assignees (optional display) */}
//       <div className="text-xs text-gray-500">
//         {resumeProg?.assigned_to_name && (
//           <div>Resume Owner: {resumeProg.assigned_to_name} ({resumeProg.assigned_to_email || "—"})</div>
//         )}
//         {portfolioProg?.assigned_name && (
//           <div>Portfolio Owner: {portfolioProg.assigned_name} ({portfolioProg.assigned_email || "—"})</div>
//         )}
//       </div>
//     </div>



//   </CardContent>
// </Card>

// {/* </div> */}

//   {/*  Client Feedback (Left, Bottom) */}
//   <Card className="h-full col-span-1 row-span-1">
//   <CardHeader>
//     <CardTitle className="text-2xl font-bold">Client Feedback</CardTitle>
//   </CardHeader>
//   <CardContent>
//     {feedbackList.length === 0 ? (
//       <div className="text-gray-500 italic">No feedback from this client yet.</div>
//     ) : (
//       <div className="overflow-x-auto">
//         <table className="min-w-full text-sm border border-gray-300">
//           <thead>
//             <tr className="bg-blue-100 text-left">
//               <th className="p-2 border">Email</th>
//               <th className="p-2 border">Emotion</th>
//               <th className="p-2 border">Rating</th>
//               <th className="p-2 border">Renew?</th>
//               <th className="p-2 border">Notes</th>
//             </tr>
//           </thead>
//           <tbody>
//             {feedbackList.map((fb, index) => (
//               <tr key={index} className="border-t hover:bg-gray-50">
//                 <td className="p-2 border">{fb.email || "-"}</td>
//                 <td className="p-2 border capitalize">{fb.client_emotion || "-"}</td>
//                 <td className="p-2 border">{fb.rating || "-"}</td>
//                 <td className="p-2 border capitalize">{fb.renew_status || "-"}</td>
//                 <td className="p-2 border">{fb.notes || "-"}</td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>
//     )}
//   </CardContent>
// </Card>



//   {/*  Call History (Right, Top) */}
//   <Card className="h-full col-span-1 row-span-1">
//   <CardHeader>
//     <CardTitle className="text-2xl font-bold">Call History, {user?.name}</CardTitle>
//   </CardHeader>
//   <CardContent>
//     {callHistory.length === 0 ? (
//       <div className="text-gray-500 italic">No call records for this client.</div>
//     ) : (
//       <div className="overflow-x-auto">
//         <table className="min-w-full text-sm border border-gray-300">
//           <thead>
//             <tr className="bg-green-100 text-left">
//               <th className="p-2 border">Follow-up Date</th>
//               <th className="p-2 border">Stage</th>
//               <th className="p-2 border">Notes</th>
//               <th className="p-2 border">Assigned To</th>
//               <th className="p-2 border">Phone</th>
//               <th className="p-2 border">Email</th>
//             </tr>
//           </thead>
//           <tbody>
//             {callHistory.map((call, index) => (
//               <tr key={index} className="border-t hover:bg-gray-50">
//                 <td className="p-2 border">
//                   {call.followup_date
//                     ? new Date(call.followup_date).toLocaleDateString()
//                     : "-"}
//                 </td>
//                 <td className="p-2 border">{call.current_stage || "-"}</td>
//                 <td className="p-2 border">{call.notes || "-"}</td>
//                 <td className="p-2 border">{call.assigned_to || "-"}</td>
//                 <td className="p-2 border">{call.phone || "-"}</td>
//                 <td className="p-2 border">{call.email || "-"}</td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>
//     )}
//   </CardContent>
// </Card>




//   {/*  Sale Done History (Right, Bottom) */}
//   <Card className="h-full col-span-2 row-span-1">
//   <CardHeader>
//     <CardTitle className="text-2xl font-bold">Sale Done History</CardTitle>
//   </CardHeader>
//   <CardContent>
//     {saleHistory.length === 0 ? (
//       <div className="text-gray-500 italic">No sales done for this client.</div>
//     ) : (
//       <div className="overflow-x-auto">
//         <table className="min-w-full text-sm border border-gray-300">
//           <thead>
//             <tr className="bg-yellow-100 text-left">
//               <th className="p-2 border">Name</th>
//               <th className="p-2 border">Sale Value</th>
//               <th className="p-2 border">Payment mode</th>
//               <th className="p-2 border">Subscription Cycle</th>
//               <th className="p-2 border">Assigned To</th>
//               <th className="p-2 border">Stage</th>
//               <th className="p-2 border">Sale Done At</th>
//               <th className="p-2 border">Onboarded At (dd/mm/yy)</th>
//               <th className="p-2 border">Next Renewal date (dd/mm/yy)</th>
//             </tr>
//           </thead>
//           {/* <tbody>
//             {saleHistory.map((sale, index) => (
//               <tr key={index} className="border-t hover:bg-gray-50">
//                 <td className="p-2 border">{sale.lead_name || "-"}</td>
//                 <td className="p-2 border">${sale.sale_value}</td>
//                 <td className="p-2 border">{sale.payment_mode}</td>
//                 <td className="p-2 border">{sale.subscription_cycle} days</td>
//                 <td className="p-2 border">{sale.assigned_to || "Not Assigned"}</td>
//                 <td className="p-2 border">{sale.finance_status}</td>
//                 <td className="p-2 border">{sale.closed_at ? new Date(sale.closed_at).toLocaleString() : "-"}</td>
//                 <td className="p-2 border">{sale.onboarded_date ? new Date(sale.onboarded_date).toLocaleDateString() : "-"}</td>
              

//               </tr>
//             ))}
//           </tbody> */}

//           <tbody>
//   {saleHistory.map((sale, index) => {
//     const onboardedDate = sale.onboarded_date ? new Date(sale.onboarded_date) : null;
//     const subscriptionDays = parseInt(sale.subscription_cycle) || 0;

//     // Compute next renewal date
//     let nextRenewalDate = "-";
//     if (onboardedDate && !isNaN(subscriptionDays)) {
//       const renewalDate = new Date(onboardedDate);
//       renewalDate.setDate(renewalDate.getDate() + subscriptionDays);
//       nextRenewalDate = renewalDate.toLocaleDateString();
//     }

//     return (
//       <tr key={index} className="border-t hover:bg-gray-50">
//         <td className="p-2 border">{sale.lead_name || "-"}</td>
//         <td className="p-2 border">${sale.sale_value}</td>
//         <td className="p-2 border">{sale.payment_mode}</td>
//         <td className="p-2 border">{sale.subscription_cycle} days</td>
//         <td className="p-2 border">{sale.assigned_to || "Not Assigned"}</td>
//         <td className="p-2 border">{sale.finance_status}</td>
//         <td className="p-2 border">{sale.closed_at ? new Date(sale.closed_at).toLocaleString() : "-"}</td>
//         <td className="p-2 border">{onboardedDate ? onboardedDate.toLocaleDateString() : "-"}</td>
//         <td className="p-2 border">{nextRenewalDate}</td>
//       </tr>
//     );
//   })}
// </tbody>


//         </table>
//       </div>
//     )}
//   </CardContent>
// </Card>

// </div>

//     </div>
//     </DashboardLayout>
//     //  </ProtectedRoute>



//   );
// }




// app/leads/[business_id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { supabase } from "@/utils/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { DashboardLayout } from "@/components/layout/dashboard-layout";

interface Lead {
  id: string;
  business_id: string;
  name: string;
  phone: string;
  email: string;
  city: string;
  source: string;
  status: string;
  created_at: string;
  assigned_to?: string;
  paid_amount?: number;
}

interface ResumeProgress {
  lead_id: string;
  status: string; // enum on DB, string in TS
  pdf_path: string | null;
  pdf_uploaded_at: string | null;
  updated_at: string | null;
  assigned_to_email: string | null;
  assigned_to_name: string | null;
}

interface PortfolioProgress {
  lead_id: string;
  status: string; // 'not_started' | 'pending' | ...
  link: string | null;
  assigned_email: string | null;
  assigned_name: string | null;
  updated_at: string | null;
}

// 🔁 1) ADD these types near your other interfaces
interface ClientOnboardingDetails {
  full_name: string;
  personal_email: string;
  callable_phone: string | null;
  company_email: string | null;
  job_role_preferences: string[] | null;
  salary_range: string | null;
  location_preferences: string[] | null;
  work_auth_details: string | null;
  resume_path: string | null;
  cover_letter_path: string | null;
  created_at: string | null;
  lead_id: string | null;

  // NEW FIELDS
  needs_sponsorship: boolean | null;
  full_address: string | null;
  linkedin_url: string | null;
  date_of_birth: string | null; // date as ISO string
}

export default function LeadProfilePage() {
  const { business_id } = useParams();
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [saleHistory, setSaleHistory] = useState<any[]>([]);
  const [callHistory, setCallHistory] = useState<any[]>([]);
  const [feedbackList, setFeedbackList] = useState<any[]>([]);
  const [renewal, setRenewal] = useState<Lead | null>(null);
  const [onboarding, setOnboarding] = useState<ClientOnboardingDetails | null>(null);

  const [resumeProg, setResumeProg] = useState<ResumeProgress | null>(null);
  const [portfolioProg, setPortfolioProg] = useState<PortfolioProgress | null>(null);

  const { user } = useAuth();

  const allowedRoles = [
    "Marketing",
    "Sales",
    "Super Admin",
    "Finance",
    "Accounts",
    "Resume Head",
    "Technical Head",
    "Sales Associate",
  ];

  useEffect(() => {
    if (!business_id) return;

    const fetchAll = async () => {
      // Lead
      const { data: leadRow, error: leadErr } = await supabase
        .from("leads")
        .select("*")
        .eq("business_id", business_id)
        .single();
      if (leadErr) {
        console.error("Error fetching lead:", leadErr.message);
        setLead(null);
      } else {
        setLead(leadRow as Lead);
      }

      // Sales history (ascending by onboarded_date -> latest is last)
      const { data: salesRows, error: salesErr } = await supabase
        .from("sales_closure")
        .select("*")
        .eq("lead_id", business_id)
        .order("onboarded_date", { ascending: true });
      if (salesErr) console.error("Error fetching sales history:", salesErr.message);
      setSaleHistory(salesRows ?? []);

      // Call history
      const { data: callRows, error: callErr } = await supabase
        .from("call_history")
        .select("*")
        .eq("lead_id", business_id)
        .order("followup_date", { ascending: false });
      if (callErr) console.error("Error fetching call history:", callErr.message);
      setCallHistory(callRows ?? []);

      // Client feedback
      const { data: fbRows, error: fbErr } = await supabase
        .from("client_feedback")
        .select("*")
        .eq("lead_id", business_id)
        .order("id", { ascending: false });
      if (fbErr) console.error("Error fetching client feedback:", fbErr.message);
      setFeedbackList(fbRows ?? []);

      // Resume Progress (unique per lead, per your schema)
      const { data: rpRow, error: rpErr } = await supabase
        .from("resume_progress")
        .select("lead_id,status,pdf_path,pdf_uploaded_at,updated_at,assigned_to_email,assigned_to_name")
        .eq("lead_id", business_id)
        .maybeSingle();
      if (rpErr) console.error("Error fetching resume_progress:", rpErr.message);
      setResumeProg(rpRow ?? null);

      // Portfolio Progress (PK = lead_id)
      const { data: ppRow, error: ppErr } = await supabase
        .from("portfolio_progress")
        .select("lead_id,status,link,assigned_email,assigned_name,updated_at")
        .eq("lead_id", business_id)
        .maybeSingle();
      if (ppErr) console.error("Error fetching portfolio_progress:", ppErr.message);
      setPortfolioProg(ppRow ?? null);

      // 🔁 Fetch the latest onboarding row (include new columns)
      const { data: coRow, error: coErr } = await supabase
        .from("client_onborading_details")
        .select(`
          full_name,
          personal_email,
          callable_phone,
          company_email,
          job_role_preferences,
          salary_range,
          location_preferences,
          work_auth_details,
          resume_path,
          cover_letter_path,
          created_at,
          needs_sponsorship,
          full_address,
          linkedin_url,
          date_of_birth,
          lead_id
        `)
        .eq("lead_id", business_id as string)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (coErr) {
        console.error("Error fetching client_onborading_details:", coErr.message);
        setOnboarding(null);
      } else {
        setOnboarding(coRow as ClientOnboardingDetails);
      }

      setLoading(false);
    };

    setLoading(true);
    fetchAll();
  }, [business_id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="animate-spin w-8 h-8 text-gray-600" />
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-600">
        No lead found with ID: {business_id}
      </div>
    );
  }

  const money = (v: any) => {
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? `$${n.toLocaleString()}` : "—";
  };

  const fmt = (d?: string | null) => (d ? new Date(d).toLocaleString() : "—");
  const listFmt = (arr?: string[] | null) => (arr && arr.length ? arr.join(", ") : "—");

  // NEW helpers for the new fields
  const yn = (b?: boolean | null) => (b === true ? "Yes" : b === false ? "No" : "—");
  const fmtDateOnly = (d?: string | null) => (d ? new Date(d).toLocaleDateString() : "—");

  const downloadFromStorage = async (path: string, downloadName: string) => {
    try {
      const { data, error } = await supabase.storage.from("resumes").createSignedUrl(path, 60 * 10); // 10 minutes
      if (error || !data?.signedUrl) throw error || new Error("No signed URL");

      const res = await fetch(data.signedUrl);
      if (!res.ok) throw new Error(`Download failed (${res.status})`);

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = downloadName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      console.error(e);
      alert(e?.message || "Could not download file");
    }
  };

  // 🆕 Convenience wrappers
  const downloadLatestResume = async () => {
    if (!onboarding?.resume_path || !lead?.business_id) {
      alert("No resume PDF found.");
      return;
    }
    await downloadFromStorage(onboarding.resume_path, `resume-${lead.business_id}-${lead.name}.pdf`);
  };
  const downloadLatestCover = async () => {
    if (!onboarding?.cover_letter_path || !lead?.business_id) {
      alert("No cover letter PDF found.");
      return;
    }
    await downloadFromStorage(onboarding.cover_letter_path, `cover-${lead.business_id}-${lead.name}.pdf`);
  };

  // Download resume PDF with fixed filename: "resume-<lead_id>.pdf"
  const downloadResume = async (leadId: string, path?: string | null) => {
    try {
      if (!path) {
        alert("No resume PDF found.");
        return;
      }
      const { data, error } = await supabase.storage.from("resumes").createSignedUrl(path, 60 * 10);
      if (error || !data?.signedUrl) throw error || new Error("No signed URL");

      const res = await fetch(data.signedUrl);
      if (!res.ok) throw new Error(`Download failed (${res.status})`);

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `resume-${leadId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      console.error(e);
      alert(e?.message || "Could not download PDF");
    }
  };

  return (
    // <ProtectedRoute allowedRoles={["Sales","Sales Associate","Super Admin"]}>
    <DashboardLayout>
      <div className="min-h-screen h-screen w-full bg-gray-50">
        <div className="grid grid-cols-1 md:grid-cols-4 grid-rows-2 gap-3 h-full">
          {/* 1️⃣ Lead Profile (Left, Top) */}
          <Card className="h-full col-span-1 row-span-1 overflow-auto">
            <CardHeader>
              <CardTitle className="text-2xl font-bold">Lead Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-gray-800">
              <div>
                <strong>Business ID:</strong> {lead.business_id}
              </div>
              <div>
                <strong>Name:</strong> {lead.name}
              </div>
              <div>
                <strong>Phone:</strong> {lead.phone}
              </div>
              <div>
                <strong>Email:</strong> {lead.email}
              </div>
              <div>
                <strong>City:</strong> {lead.city}
              </div>
              <div>
                <strong>Source:</strong> <Badge>{lead.source}</Badge>
              </div>
              <div>
                <strong>Status:</strong> <Badge>{lead.status}</Badge>
              </div>
              <div>
                <strong>Created At:</strong> {new Date(lead.created_at).toLocaleString()}
              </div>
              <div>
                <strong>Salesperson:</strong> {lead.assigned_to || "Not Assigned"}
              </div>
            </CardContent>
          </Card>

          {/* Client onboarding details */}
          <Card className="h-full col-span-2 row-span-1 overflow-scroll">
            <CardHeader>
              <CardTitle className="text-2xl font-bold">Client onboarding details</CardTitle>
            </CardHeader>
            <CardContent>
              {!onboarding ? (
                <div className="text-gray-500 italic">No onboarding details submitted yet.</div>
              ) : (
                <div className="space-y-6">
                  {/* Identity */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Full Name</Label>
                      <Input value={onboarding.full_name ?? ""} readOnly />
                    </div>

                    <div className="space-y-1.5">
                      <Label>Company Email</Label>
                      <Input value={onboarding.company_email ?? ""} readOnly />
                    </div>

                    <div className="space-y-1.5">
                      <Label>Callable Phone</Label>
                      <Input value={onboarding.callable_phone ?? ""} readOnly />
                    </div>

                    <div className="space-y-1.5">
                      <Label>Last Submitted</Label>
                      <Input value={fmt(onboarding.created_at)} readOnly />
                    </div>
                  </div>

                  {/* NEW: Sponsorship & DOB */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Sponsorship?</Label>
                      <Input value={yn(onboarding.needs_sponsorship)} readOnly />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Date of Birth</Label>
                      <Input value={fmtDateOnly(onboarding.date_of_birth)} readOnly />
                    </div>
                  </div>

                  {/* NEW: Address & LinkedIn */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Full Address with Zip Code</Label>
                      <Textarea value={onboarding.full_address ?? ""} rows={3} readOnly />
                    </div>
                    <div className="space-y-1.5">
                      <Label>LinkedIn URL</Label>
                      <div className="flex items-center gap-2">
                        <Input value={onboarding.linkedin_url ?? ""} readOnly />
                        <a
                          href={onboarding.linkedin_url ?? "#"}
                          target="_blank"
                          rel="noreferrer"
                          className={`text-blue-600 underline text-sm ${
                            !onboarding.linkedin_url ? "pointer-events-none opacity-50" : ""
                          }`}
                        >
                          Open
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Preferences */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Job Role Preferences</Label>
                      <Textarea value={listFmt(onboarding.job_role_preferences)} rows={3} readOnly />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Location Preferences</Label>
                      <Textarea value={listFmt(onboarding.location_preferences)} rows={3} readOnly />
                    </div>
                  </div>

                  {/* Misc + Files */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-1.5">
                      <Label>Salary Range</Label>
                      <Input value={onboarding.salary_range ?? ""} readOnly />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Work Auth Details</Label>
                      <Input value={onboarding.work_auth_details ?? ""} readOnly />
                    </div>

                    <div className="flex flex-wrap items-center pt-7">
                      <Button
                        type="button"
                        onClick={downloadLatestResume}
                        disabled={!onboarding.resume_path}
                        className="min-w-[160px] bg-blue-500"
                      >
                        Download Resume
                      </Button>
                    </div>
                    <div className="flex flex-wrap items-center pt-7">
                      <Button
                        type="button"
                        onClick={downloadLatestCover}
                        disabled={!onboarding.cover_letter_path}
                        className="min-w-[160px] bg-green-500"
                      >
                        Download Cover Ltr
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Add-ons & Requirements */}
          <Card className="h-full col-span-1 row-span-1 overflow-auto">
            <CardHeader>
              <CardTitle className="text-2xl font-bold">Add-ons & Requirements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {saleHistory.length === 0 ? (
                <div className="text-gray-500 italic">No add-ons or commitments recorded yet.</div>
              ) : (
                (() => {
                  // Use the latest sale (your saleHistory is ASC by onboarded_date)
                  const latest = saleHistory[saleHistory.length - 1];

                  return (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center justify-between border rounded-md px-3 py-2">
                          <span className="font-medium">Resume</span>
                          {allowedRoles.includes(user?.role || "") ? (
                            <span className="text-gray-700">{money(latest?.resume_sale_value)}</span>
                          ) : (
                            <Badge className="bg-green-100 text-green-700 border-green-200">Paid</Badge>
                          )}
                        </div>
                        <div className="flex items-center justify-between border rounded-md px-3 py-2">
                          <span className="font-medium">LinkedIn</span>
                          {allowedRoles.includes(user?.role || "") ? (
                            <span className="text-gray-700">{money(latest?.linkedin_sale_value)}</span>
                          ) : (
                            <Badge className="bg-green-100 text-green-700 border-green-200">Paid</Badge>
                          )}
                        </div>
                        <div className="flex items-center justify-between border rounded-md px-3 py-2">
                          <span className="font-medium">Portfolio</span>
                          {allowedRoles.includes(user?.role || "") ? (
                            <span className="text-gray-700">{money(latest?.portfolio_sale_value)}</span>
                          ) : (
                            <Badge className="bg-green-100 text-green-700 border-green-200">Paid</Badge>
                          )}
                        </div>
                        <div className="flex items-center justify-between border rounded-md px-3 py-2">
                          <span className="font-medium">GitHub</span>
                          {allowedRoles.includes(user?.role || "") ? (
                            <span className="text-gray-700">{money(latest?.github_sale_value)}</span>
                          ) : (
                            <Badge className="bg-green-100 text-green-700 border-green-200">Paid</Badge>
                          )}
                        </div>
                        <div className="flex items-center justify-between border rounded-md px-3 py-2">
                          <span className="text-gray-700">{latest?.custom_label || "Custom add on sales"}</span>
                          {allowedRoles.includes(user?.role || "") ? (
                            <span className="text-gray-700">{money(latest?.custom_sale_value)}</span>
                          ) : (
                            <Badge className="bg-green-100 text-green-700 border-green-200">Paid</Badge>
                          )}
                        </div>
                      </div>

                      <div className="border rounded-md p-3">
                        <div className="font-medium mb-1">Commitments</div>
                        <div className="text-gray-700 whitespace-pre-wrap">
                          {latest?.commitments?.trim() ? latest.commitments : "—"}
                        </div>
                      </div>

                      <div className="text-xs text-gray-500">Showing latest sale/renewal add-ons.</div>
                    </div>
                  );
                })()
              )}

              {/* Work Artifacts */}
              <div className="space-y-2">
                <div className="font-semibold">Work Artifacts</div>

                {/* Resume PDF */}
                <div className="flex items-center justify-between border rounded-md px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span>Resume PDF</span>
                    <Badge variant="outline">{resumeProg?.status ?? "Not started"}</Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500">Updated: {fmt(resumeProg?.updated_at)}</span>
                    {resumeProg?.pdf_path ? (
                      <button
                        className="underline text-blue-600"
                        onClick={() => downloadResume(String(business_id), resumeProg.pdf_path!)}
                      >
                        Download
                      </button>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </div>
                </div>

                {/* Portfolio Link */}
                <div className="flex items-center justify-between border rounded-md px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span>Portfolio</span>
                    <Badge variant="outline">{portfolioProg?.status ?? "Not started"}</Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500">Updated: {fmt(portfolioProg?.updated_at)}</span>
                    {portfolioProg?.link ? (
                      <a href={portfolioProg.link} target="_blank" rel="noreferrer" className="underline text-blue-600">
                        Open
                      </a>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </div>
                </div>

                {/* Assignees (optional display) */}
                <div className="text-xs text-gray-500">
                  {resumeProg?.assigned_to_name && (
                    <div>
                      Resume Owner: {resumeProg.assigned_to_name} ({resumeProg.assigned_to_email || "—"})
                    </div>
                  )}
                  {portfolioProg?.assigned_name && (
                    <div>
                      Portfolio Owner: {portfolioProg.assigned_name} ({portfolioProg.assigned_email || "—"})
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/*  Client Feedback (Left, Bottom) */}
          <Card className="h-full col-span-1 row-span-1">
            <CardHeader>
              <CardTitle className="text-2xl font-bold">Client Feedback</CardTitle>
            </CardHeader>
            <CardContent>
              {feedbackList.length === 0 ? (
                <div className="text-gray-500 italic">No feedback from this client yet.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm border border-gray-300">
                    <thead>
                      <tr className="bg-blue-100 text-left">
                        <th className="p-2 border">Email</th>
                        <th className="p-2 border">Emotion</th>
                        <th className="p-2 border">Rating</th>
                        <th className="p-2 border">Renew?</th>
                        <th className="p-2 border">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {feedbackList.map((fb, index) => (
                        <tr key={index} className="border-t hover:bg-gray-50">
                          <td className="p-2 border">{fb.email || "-"}</td>
                          <td className="p-2 border capitalize">{fb.client_emotion || "-"}</td>
                          <td className="p-2 border">{fb.rating || "-"}</td>
                          <td className="p-2 border capitalize">{fb.renew_status || "-"}</td>
                          <td className="p-2 border">{fb.notes || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/*  Call History (Right, Top) */}
          <Card className="h-full col-span-1 row-span-1">
            <CardHeader>
              <CardTitle className="text-2xl font-bold">Call History, {user?.name}</CardTitle>
            </CardHeader>
            <CardContent>
              {callHistory.length === 0 ? (
                <div className="text-gray-500 italic">No call records for this client.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm border border-gray-300">
                    <thead>
                      <tr className="bg-green-100 text-left">
                        <th className="p-2 border">Follow-up Date</th>
                        <th className="p-2 border">Stage</th>
                        <th className="p-2 border">Notes</th>
                        <th className="p-2 border">Assigned To</th>
                        <th className="p-2 border">Phone</th>
                        <th className="p-2 border">Email</th>
                      </tr>
                    </thead>
                    <tbody>
                      {callHistory.map((call, index) => (
                        <tr key={index} className="border-t hover:bg-gray-50">
                          <td className="p-2 border">
                            {call.followup_date ? new Date(call.followup_date).toLocaleDateString() : "-"}
                          </td>
                          <td className="p-2 border">{call.current_stage || "-"}</td>
                          <td className="p-2 border">{call.notes || "-"}</td>
                          <td className="p-2 border">{call.assigned_to || "-"}</td>
                          <td className="p-2 border">{call.phone || "-"}</td>
                          <td className="p-2 border">{call.email || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/*  Sale Done History (Right, Bottom) */}
          <Card className="h-full col-span-2 row-span-1">
            <CardHeader>
              <CardTitle className="text-2xl font-bold">Sale Done History</CardTitle>
            </CardHeader>
            <CardContent>
              {saleHistory.length === 0 ? (
                <div className="text-gray-500 italic">No sales done for this client.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm border border-gray-300">
                    <thead>
                      <tr className="bg-yellow-100 text-left">
                        <th className="p-2 border">Name</th>
                        <th className="p-2 border">Sale Value</th>
                        <th className="p-2 border">Payment mode</th>
                        <th className="p-2 border">Subscription Cycle</th>
                        <th className="p-2 border">Assigned To</th>
                        <th className="p-2 border">Stage</th>
                        <th className="p-2 border">Sale Done At</th>
                        <th className="p-2 border">Onboarded At (dd/mm/yy)</th>
                        <th className="p-2 border">Next Renewal date (dd/mm/yy)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {saleHistory.map((sale, index) => {
                        const onboardedDate = sale.onboarded_date ? new Date(sale.onboarded_date) : null;
                        const subscriptionDays = Number(sale.subscription_cycle) || 0;

                        // Compute next renewal date
                        let nextRenewalDate = "-";
                        if (onboardedDate && !isNaN(subscriptionDays)) {
                          const renewalDate = new Date(onboardedDate);
                          renewalDate.setDate(renewalDate.getDate() + subscriptionDays);
                          nextRenewalDate = renewalDate.toLocaleDateString();
                        }

                        return (
                          <tr key={index} className="border-t hover:bg-gray-50">
                            <td className="p-2 border">{sale.lead_name || "-"}</td>
                            <td className="p-2 border">${sale.sale_value}</td>
                            <td className="p-2 border">{sale.payment_mode}</td>
                            <td className="p-2 border">{sale.subscription_cycle} days</td>
                            <td className="p-2 border">{sale.assigned_to || "Not Assigned"}</td>
                            <td className="p-2 border">{sale.finance_status}</td>
                            <td className="p-2 border">
                              {sale.closed_at ? new Date(sale.closed_at).toLocaleString() : "-"}
                            </td>
                            <td className="p-2 border">
                              {onboardedDate ? onboardedDate.toLocaleDateString() : "-"}
                            </td>
                            <td className="p-2 border">{nextRenewalDate}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
    // </ProtectedRoute>
  );
}
