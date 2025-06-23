

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
// import { Eye, Search } from "lucide-react";
// import ProtectedRoute from "@/components/auth/ProtectedRoute";



// type SalesStage = "Prospect" | "DNP" | "Out of TG" | "Not Interested" | "Conversation Done" | "Sale Done";

// interface CallHistory {
//   date: string;
//   stage: SalesStage;
//   notes: string;
// }

// interface Lead {
//   id: string;
//   business_id: string;
//   client_name: string;
//   email: string;
//   phone: string;
//   assigned_to: string;
//   current_stage: SalesStage;
//   call_history: CallHistory[];
//   created_at: string;
// }

// interface SaleClosing {
//   sale_value: number;
//   subscription_cycle: 15 | 30;
//   payment_mode: "UPI" | "Card" | "Bank Transfer" | "Cash";
// }

// interface FollowUp {
//   follow_up_date: string;
//   notes: string;
// }

// const salesStages: SalesStage[] = [
//   "Prospect", "DNP", "Out of TG", "Not Interested", "Conversation Done", "Sale Done"
// ];

// const getStageColor = (stage: SalesStage) => {
//   switch (stage) {
//     case "Prospect": return "bg-blue-100 text-blue-800";
//     case "DNP": return "bg-yellow-100 text-yellow-800";
//     case "Out of TG":
//     case "Not Interested": return "bg-red-100 text-red-800";
//     case "Conversation Done": return "bg-purple-100 text-purple-800";
//     case "Sale Done": return "bg-green-100 text-green-800";
//     default: return "bg-gray-100 text-gray-800";
//   }
// };

// export default function SalesPage() {
//   const [leads, setLeads] = useState<Lead[]>([]);
//   const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
//   const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
//   const [followUpDialogOpen, setFollowUpDialogOpen] = useState(false);
//   const [saleClosingDialogOpen, setSaleClosingDialogOpen] = useState(false);
//   const [searchTerm, setSearchTerm] = useState("");
//   const [stageFilter, setStageFilter] = useState<string>("all");
//   const [followUpData, setFollowUpData] = useState<FollowUp>({ follow_up_date: "", notes: "" });
//   const [saleData, setSaleData] = useState<SaleClosing>({ sale_value: 0, subscription_cycle: 15, payment_mode: "UPI" });
//   const [followUpSubmitted, setFollowUpSubmitted] = useState(false); // Track if follow-up was submitted
//   const [followUpsDialogOpen, setFollowUpsDialogOpen] = useState(false);
//   const [followUpsData, setFollowUpsData] = useState<any[]>([]);
//   const [followUpsFilter, setFollowUpsFilter] = useState<"today" | "all">("today");



//   useEffect(() => { fetchLeads() }, []);

//   const fetchLeads = async () => {
//     const { data, error } = await supabase.from("leads")
//       .select("id, business_id, name, email, phone, assigned_to, current_stage, created_at")
//       .not("assigned_to", "is", null) 
//       .neq("assigned_to", "");

//     if (error) console.error("Error fetching leads:", error);
//     else {
//       const leadsData: Lead[] = data.map((lead: any) => ({
//         id: lead.id,
//         business_id: lead.business_id,
//         client_name: lead.name,
//         email: lead.email,
//         phone: lead.phone,
//         assigned_to: lead.assigned_to,
//         current_stage: lead.current_stage,
//         call_history: [],
//         created_at: lead.created_at,
//       }));
//       setLeads(leadsData);
//     }
//   };



//   const fetchFollowUps = async () => {
   
//     const { data: leadsData, error: leadsError } = await supabase
//       .from("leads")
//       .select("business_id, name, email, phone, assigned_to, current_stage")
//       .in("current_stage", ["DNP", "Conversation Done"]);

//     if (leadsError) {
//       console.error("❌ Error fetching leads:", leadsError);
//       return [];
//     }

//     const businessIds = leadsData.map((l) => l.business_id);

    
//     const { data: historyData, error: historyError } = await supabase
//       .from("call_history")
//       .select("lead_id, followup_date, notes")
//       .in("lead_id", businessIds);

//     if (historyError) {
//       console.error("❌ Error fetching call history:", historyError);
//       return [];
//     }


//     const merged = leadsData.map((lead) => {
//       const matchingHistory = historyData.find(h => h.lead_id === lead.business_id);
//       return {
//         ...lead,
//         followup_date: matchingHistory?.followup_date ?? "N/A",
//         notes: matchingHistory?.notes ?? "N/A"
//       };
//     });

//     return merged;
//   };


//   const filteredLeads = leads.filter((lead) => {
//     const matchesSearch = lead.client_name.toLowerCase().includes(searchTerm.toLowerCase())
//       || lead.email.toLowerCase().includes(searchTerm.toLowerCase())
//       || lead.phone.includes(searchTerm);
//     const matchesStage = stageFilter === "all" || lead.current_stage === stageFilter;
//     return matchesSearch && matchesStage;
//   });

//   const handleStageUpdate = async (leadId: string, newStage: SalesStage) => {
//     const lead = leads.find((l) => l.id === leadId);
//     if (!lead) return;

//     const updatedLead = { ...lead, current_stage: newStage };

//     const { error } = await supabase.from("leads").update({ current_stage: newStage }).eq("id", leadId);
//     if (error) {
//       console.error("Error updating stage:", error);
//       return;
//     }

//     if (newStage !== "DNP" && newStage !== "Conversation Done") {
//       const { error: insertError } = await supabase.from("call_history").insert([{
//         lead_id: lead.business_id,
//         email: lead.email,
//         phone: lead.phone,
//         assigned_to: lead.assigned_to,
//         current_stage: newStage,
//         followup_date: new Date().toISOString().split("T")[0],
//         notes: `Stage changed to ${newStage}`
//       }]);

//       if (insertError) console.error("Error inserting call history:", insertError);
//     }

//     setLeads((prev) => prev.map((l) => (l.id === leadId ? updatedLead : l)));
//     setSelectedLead(updatedLead);
//     setFollowUpSubmitted(false); // Reset follow-up submission status

//     if (newStage === "DNP" || newStage === "Conversation Done") {
//       setFollowUpDialogOpen(true);
//     } else if (newStage === "Sale Done") {
//       setSaleClosingDialogOpen(true);
//     }
//   };

//   const handleFollowUpSubmit = async () => {
//     if (!selectedLead) return;

//     const { error } = await supabase.from("call_history").insert([{
//       lead_id: selectedLead.business_id,
//       email: selectedLead.email,
//       phone: selectedLead.phone,
//       assigned_to: selectedLead.assigned_to,
//       current_stage: selectedLead.current_stage,
//       followup_date: followUpData.follow_up_date,
//       notes: followUpData.notes // Notes from textarea for both DNP and Conversation Done
//     }]);

//     if (error) {
//       console.error("Error inserting follow-up:", error);
//       alert(`Failed to save follow-up: ${error.message}`);
//     } else {
//       console.log("Follow-up saved successfully");
//       setFollowUpSubmitted(true); // Mark follow-up as submitted
//       setFollowUpDialogOpen(false);
//       setFollowUpData({ follow_up_date: "", notes: "" });
//     }
//   };

//   // Handle dialog close without saving
//   const handleFollowUpDialogClose = async (open: boolean) => {
//     if (!open && !followUpSubmitted && selectedLead) {
//       // If dialog is closed without saving, insert a default call_history entry
//       const { error } = await supabase.from("call_history").insert([{
//         lead_id: selectedLead.business_id,
//         email: selectedLead.email,
//         phone: selectedLead.phone,
//         assigned_to: selectedLead.assigned_to,
//         current_stage: selectedLead.current_stage,
//         followup_date: new Date().toISOString().split("T")[0],
//         notes: `Stage changed to ${selectedLead.current_stage} (no follow-up scheduled)`
//       }]);

//       if (error) console.error("Error inserting default call history on dialog close:", error);
//     }
//     setFollowUpDialogOpen(open);
//   };

//   const handleSaleClosureSubmit = async () => {
//     if (!selectedLead) return;

//     const { error } = await supabase.from("sales_closure").insert([{
//       lead_id: selectedLead.business_id,
//       sale_value: saleData.sale_value,
//       subscription_cycle: saleData.subscription_cycle,
//       payment_mode: saleData.payment_mode,
//       email: selectedLead.email,
//     }]);

//     if (error) {
//       console.error("Error inserting sale closure:", error);
//       alert(`Failed to save sale closure: ${error.message}`);
//     } else {
//       console.log("Sale closure saved successfully");
//       setSaleClosingDialogOpen(false);
//     }
//   };


//   const totalLeadsCount = leads.length;
//   const prospectCount = leads.filter(l => l.current_stage === "Prospect").length;
//   const dnpAndConvoCount = leads.filter(l =>
//     l.current_stage === "DNP" || l.current_stage === "Conversation Done"
//   ).length;
//   const saleDoneCount = leads.filter(l => l.current_stage === "Sale Done").length;
//   const othersCount = leads.filter(l =>
//     !["Prospect", "DNP", "Conversation Done", "Sale Done"].includes(l.current_stage)
//   ).length;



//   const fetchCallHistory = async (leadId: string) => {
//     const lead = leads.find((l) => l.id === leadId);
//     if (!lead) return [];

//     const { data, error } = await supabase
//       .from("call_history")
//       .select("current_stage, followup_date, notes")
//       .eq("lead_id", lead.business_id)
//       .order("followup_date", { ascending: false });

//     if (error) {
//       console.error("Error fetching call history:", error);
//       return [];
//     }

//     const callHistoryData: CallHistory[] = data.map((record: any) => ({
//       date: record.followup_date,
//       stage: record.current_stage,
//       notes: record.notes
//     }));
//     return callHistoryData;
//   };

//   return (
//     <ProtectedRoute allowedRoles={["Sales", "Super Admin"]}>

//       <DashboardLayout>
//         <div className="space-y-6">
//           <div className="flex justify-between items-center">
//             <h1 className="text-3xl font-bold">Sales CRM</h1>

//             <Button onClick={async () => {
//               const followUps = await fetchFollowUps();
//               setFollowUpsData(followUps);
//               setFollowUpsDialogOpen(true);
//             }}>
//               Follow Ups
//             </Button>




//           </div>

//           <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">


//             <Dialog open={followUpsDialogOpen} onOpenChange={setFollowUpsDialogOpen}>
//               <DialogContent className="max-w-7xl">
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

//                 <div className="overflow-x-auto">
//                   <Table>
//                     <TableHeader>
//                       <TableRow>
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
//                     {followUpsData.filter((item) => {
//                       if (followUpsFilter === "all") return true;
//                       if (!item.followup_date) return false;
//                       const today = new Date().toISOString().split("T")[0];
//                       return item.followup_date === today;
//                     }).length === 0 ? (
//                       <TableRow>
//                         <TableCell colSpan={8} className="text-center text-muted-foreground py-6">
//                           {followUpsFilter === "all"
//                             ? "No follow-up data available."
//                             : "There are no follow ups today."}
//                         </TableCell>
//                       </TableRow>
//                     ) : (
//                       followUpsData
//                         .filter((item) => {
//                           if (followUpsFilter === "all") return true;
//                           if (!item.followup_date) return false;
//                           const today = new Date().toISOString().split("T")[0];
//                           return item.followup_date === today;
//                         })
//                         .map((item, idx) => (
//                           <TableRow key={idx}>
//                             <TableCell>{item.business_id}</TableCell>
//                             <TableCell>{item.name}</TableCell>
//                             <TableCell>{item.email}</TableCell>
//                             <TableCell>{item.phone}</TableCell>
//                             <TableCell>{item.assigned_to}</TableCell>
//                             <TableCell>
//                               <Badge className={getStageColor(item.current_stage)}>{item.current_stage}</Badge>
//                             </TableCell>
//                             <TableCell>{item.followup_date}</TableCell>
//                             <TableCell>{item.notes}</TableCell>
//                           </TableRow>
//                         ))
//                     )}
//                   </TableBody>

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
//                 <div className="text-2xl font-bold">{dnpAndConvoCount}</div>
//               </CardContent>
//             </Card>

//             <Card>
//               <CardHeader className="pb-2">
//                 <CardTitle className="text-sm font-medium">Sales Done</CardTitle>
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
//           </div>


//           <Card>
//             <CardHeader><CardTitle>Sales Pipeline</CardTitle></CardHeader>
//             <CardContent>
//               <div className="rounded-md border">
//                 <Table>
//                   <TableHeader>
//                     <TableRow>
//                       <TableHead>Business ID</TableHead>
//                       <TableHead>Client Name</TableHead>
//                       <TableHead>Email</TableHead>
//                       <TableHead>Phone</TableHead>
//                       <TableHead>Assigned To</TableHead>
//                       <TableHead>Stage</TableHead>
//                       <TableHead>Actions</TableHead>
//                     </TableRow>
//                   </TableHeader>
//                   <TableBody>
//                     {filteredLeads.map((lead) => (
//                       <TableRow key={lead.id}>
//                         <TableCell>{lead.business_id}</TableCell>
//                         <TableCell>{lead.client_name}</TableCell>
//                         <TableCell>{lead.email}</TableCell>
//                         <TableCell>{lead.phone}</TableCell>
//                         <TableCell>{lead.assigned_to}</TableCell>
//                         <TableCell>
//                           <Select value={lead.current_stage} onValueChange={(value: SalesStage) => handleStageUpdate(lead.id, value)}
//                           >
//                             {/* <SelectTrigger className="w-40"><SelectValue /></SelectTrigger> */}
//                             <SelectTrigger
//                               className={`w-40 ${lead.current_stage === "Sale Done"
//                                 ? "pointer-events-none opacity-100 text-black bg-gray-100 border border-gray-300 cursor-not-allowed"
//                                 : ""
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
//                         </TableCell>
//                         <TableCell>
//                           <Button size="sm" variant="outline" onClick={async () => {
//                             const callHistory = await fetchCallHistory(lead.id);
//                             setSelectedLead({ ...lead, call_history: callHistory });
//                             setHistoryDialogOpen(true);
//                           }}>
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
//           <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
//             <DialogContent className="max-w-2xl">
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
//                       {selectedLead.call_history.map((call, index) => (
//                         <div key={index} className="p-3 bg-gray-50 rounded-lg">
//                           <div className="flex justify-between items-center mb-1">
//                             <Badge className={getStageColor(call.stage)}>{call.stage}</Badge>
//                             <span className="text-xs text-gray-500">{call.date}</span>
//                           </div>
//                           <p className="text-sm text-gray-600">{call.notes}</p>
//                         </div>
//                       ))}
//                     </div>
//                   </div>
//                 </div>
//               )}
//             </DialogContent>
//           </Dialog>

//           {/* Follow-Up Dialog */}
//           <Dialog open={followUpDialogOpen} onOpenChange={handleFollowUpDialogClose}>
//             <DialogContent>
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

//           {/* Sale Closing Dialog */}
//           <Dialog open={saleClosingDialogOpen} onOpenChange={setSaleClosingDialogOpen}>
//             <DialogContent>
//               <DialogHeader><DialogTitle>Close Sale</DialogTitle></DialogHeader>
//               <div className="space-y-4">
//                 <div><Label>Sale Value</Label>
//                   <Input type="number" value={saleData.sale_value}
//                     onChange={(e) => setSaleData(prev => ({ ...prev, sale_value: Number(e.target.value) }))} />
//                 </div>

//                 <div><Label>Subscription Cycle</Label>
//                   <Select value={saleData.subscription_cycle.toString()}
//                     onValueChange={(value) => setSaleData(prev => ({ ...prev, subscription_cycle: Number(value) as 15 | 30 }))}>
//                     <SelectTrigger><SelectValue /></SelectTrigger>
//                     <SelectContent>
//                       <SelectItem value="15">15 Days</SelectItem>
//                       <SelectItem value="30">30 Days</SelectItem>
//                     </SelectContent>
//                   </Select>
//                 </div>

//                 <div><Label>Payment Mode</Label>
//                   <Select value={saleData.payment_mode}
//                     onValueChange={(value) => setSaleData(prev => ({ ...prev, payment_mode: value as SaleClosing["payment_mode"] }))}>
//                     <SelectTrigger><SelectValue /></SelectTrigger>
//                     <SelectContent>
//                       <SelectItem value="UPI">UPI</SelectItem>
//                       <SelectItem value="Card">Card</SelectItem>
//                       <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
//                       <SelectItem value="Cash">Cash</SelectItem>
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
import { Eye, Search } from "lucide-react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";



type SalesStage = "Prospect" | "DNP" | "Out of TG" | "Not Interested" | "Conversation Done" | "Sale Done";

interface CallHistory {
  date: string;
  stage: SalesStage;
  notes: string;
}

interface Lead {
  id: string;
  business_id: string;
  client_name: string;
  email: string;
  phone: string;
  assigned_to: string;
  current_stage: SalesStage;
  call_history: CallHistory[];
  created_at: string;
}

interface SaleClosing {
  sale_value: number;
  subscription_cycle: 15 | 30 | 60 | 90; // Subscription cycle in days
  payment_mode: "UPI" | "Card" | "Bank Transfer" | "Cash";
}

interface FollowUp {
  follow_up_date: string;
  notes: string;
}

const salesStages: SalesStage[] = [
  "Prospect", "DNP", "Out of TG", "Not Interested", "Conversation Done", "Sale Done"
];

const getStageColor = (stage: SalesStage) => {
  switch (stage) {
    case "Prospect": return "bg-blue-100 text-blue-800";
    case "DNP": return "bg-yellow-100 text-yellow-800";
    case "Out of TG":
    case "Not Interested": return "bg-red-100 text-red-800";
    case "Conversation Done": return "bg-purple-100 text-purple-800";
    case "Sale Done": return "bg-green-100 text-green-800";
    default: return "bg-gray-100 text-gray-800";
  }
};

export default function SalesPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [followUpDialogOpen, setFollowUpDialogOpen] = useState(false);
  const [saleClosingDialogOpen, setSaleClosingDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [followUpData, setFollowUpData] = useState<FollowUp>({ follow_up_date: "", notes: "" });
  const [followUpSubmitted, setFollowUpSubmitted] = useState(false); // Track if follow-up was submitted
  const [followUpsDialogOpen, setFollowUpsDialogOpen] = useState(false);
  const [followUpsData, setFollowUpsData] = useState<any[]>([]);
  const [followUpsFilter, setFollowUpsFilter] = useState<"today" | "all">("today");
  const [pendingStageUpdate, setPendingStageUpdate] = useState<{ leadId: string, stage: SalesStage } | null>(null);
  const [previousStage, setPreviousStage] = useState<SalesStage | null>(null);
  const [saleData, setSaleData] = useState<SaleClosing>({
    sale_value: 0,
    subscription_cycle: "" as unknown as 15 | 30 | 60 | 90,  // ← trick to allow placeholder
    payment_mode: "" as unknown as SaleClosing["payment_mode"]
  });





  useEffect(() => { fetchLeads() }, []);

  const fetchLeads = async () => {
    const { data, error } = await supabase.from("leads")
      .select("id, business_id, name, email, phone, assigned_to, current_stage, created_at")
      .not("assigned_to", "is", null)
      .neq("assigned_to", "");

    if (error) console.error("Error fetching leads:", error);
    else {
      const leadsData: Lead[] = data.map((lead: any) => ({
        id: lead.id,
        business_id: lead.business_id,
        client_name: lead.name,
        email: lead.email,
        phone: lead.phone,
        assigned_to: lead.assigned_to,
        current_stage: lead.current_stage,
        call_history: [],
        created_at: lead.created_at,
      }));
      setLeads(leadsData);
    }
  };



  const fetchFollowUps = async () => {

    const { data: leadsData, error: leadsError } = await supabase
      .from("leads")
      .select("id, business_id, name, email, phone, assigned_to, current_stage")
      .in("current_stage", ["DNP", "Conversation Done"]);

    if (leadsError) {
      console.error("❌ Error fetching leads:", leadsError);
      return [];
    }

    const businessIds = leadsData.map((l) => l.business_id);


    const { data: historyData, error: historyError } = await supabase
      .from("call_history")
      .select("lead_id, followup_date, notes")
      .in("lead_id", businessIds)
      .order("followup_date", { ascending: false }); // 👈 sorted by latest first

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


  const filteredLeads = leads.filter((lead) => {
    const matchesSearch = lead.client_name.toLowerCase().includes(searchTerm.toLowerCase())
      || lead.email.toLowerCase().includes(searchTerm.toLowerCase())
      || lead.phone.includes(searchTerm);
    const matchesStage = stageFilter === "all" || lead.current_stage === stageFilter;
    return matchesSearch && matchesStage;
  });


  //   const handleSaleClosingDialogClose = (open: boolean) => {
  //   if (!open && pendingStageUpdate && previousStage) {
  //     setLeads((prev) =>
  //       prev.map((l) =>
  //         l.id === pendingStageUpdate.leadId ? { ...l, current_stage: previousStage } : l
  //       )
  //     );
  //   }

  //   setSaleClosingDialogOpen(open);
  //   setPendingStageUpdate(null);
  //   setPreviousStage(null);
  // };


  const handleStageUpdate = async (leadId: string, newStage: SalesStage) => {
    const lead = leads.find((l) => l.id === leadId);
    if (!lead) return;

    setSelectedLead(lead);
    setPreviousStage(lead.current_stage); // Save current stage for revert

    if (newStage === "DNP" || newStage === "Conversation Done") {
      setLeads((prev) =>
        prev.map((l) => (l.id === leadId ? { ...l, current_stage: newStage } : l))
      );
      setPendingStageUpdate({ leadId, stage: newStage });
      setFollowUpDialogOpen(true);
      return;
    }

    if (newStage === "Sale Done") {
      setPreviousStage(lead.current_stage); // Save current
      setPendingStageUpdate({ leadId, stage: newStage });
      // Save lead to act on after Save
      setLeads((prev) =>
        prev.map((l) =>
          l.id === leadId ? { ...l, current_stage: "Sale Done" } : l
        )
      );
      setSaleClosingDialogOpen(true);
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
      followup_date: new Date().toISOString().split("T")[0],
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


    setFollowUpDialogOpen(false);
    setFollowUpData({ follow_up_date: "", notes: "" });
    setPendingStageUpdate(null);
    setPreviousStage(null);

    // 👇 After updating stage and call_history
    const updatedFollowUps = await fetchFollowUps();
    setFollowUpsData(updatedFollowUps);

  };

  const handleFollowUpDialogClose = (open: boolean) => {
    if (!open && !followUpSubmitted && pendingStageUpdate && previousStage) {
      setLeads((prev) =>
        prev.map((l) =>
          l.id === pendingStageUpdate.leadId ? { ...l, current_stage: previousStage } : l
        )
      );
    }

    setFollowUpDialogOpen(open);
    setPendingStageUpdate(null);
    setPreviousStage(null);
  };



  const handleSaleClosureSubmit = async () => {
    if (!selectedLead || !pendingStageUpdate) return;

    if (!saleData.payment_mode || !saleData.subscription_cycle) {
      alert("Please select payment mode and cycle");
      return;
    }
    setFollowUpsData((prev) =>
      prev.map((l) =>
        l.id === pendingStageUpdate.leadId ? { ...l, current_stage: pendingStageUpdate.stage } : l
      )
    );


    const { error: saleError } = await supabase.from("sales_closure").insert([{
      lead_id: selectedLead.business_id,
      sale_value: saleData.sale_value,
      subscription_cycle: saleData.subscription_cycle,
      payment_mode: saleData.payment_mode,
      email: selectedLead.email,
    }]);

    if (saleError) {
      console.error("Error inserting sale closure:", saleError);
      alert(`Failed to save sale closure: ${saleError.message}`);
      return;
    }

    const { error: stageError } = await supabase
      .from("leads")
      .update({ current_stage: "Sale Done" })
      .eq("id", pendingStageUpdate.leadId);

    if (stageError) {
      console.error("Error updating stage:", stageError);
      return;
    }

    setSaleClosingDialogOpen(false);
    setPendingStageUpdate(null);
    setPreviousStage(null);


    setSaleData({
      sale_value: 0,
      subscription_cycle: "" as unknown as 15 | 30 | 60 | 90, // Reset to placeholder
      payment_mode: "" as unknown as SaleClosing["payment_mode"],
    });
    // 👇 After updating stage and call_history
    const updatedFollowUps = await fetchFollowUps();
    setFollowUpsData(updatedFollowUps);


  };



  const totalLeadsCount = leads.length;
  const prospectCount = leads.filter(l => l.current_stage === "Prospect").length;
  const dnpAndConvoCount = leads.filter(l =>
    l.current_stage === "DNP" || l.current_stage === "Conversation Done"
  ).length;
  const saleDoneCount = leads.filter(l => l.current_stage === "Sale Done").length;
  const othersCount = leads.filter(l =>
    !["Prospect", "DNP", "Conversation Done", "Sale Done"].includes(l.current_stage)
  ).length;



  const fetchCallHistory = async (leadId: string) => {
    const lead = leads.find((l) => l.id === leadId);
    if (!lead) return [];

    const { data, error } = await supabase
      .from("call_history")
      .select("current_stage, followup_date, notes")
      .eq("lead_id", lead.business_id)
      .order("followup_date", { ascending: false });

    if (error) {
      console.error("Error fetching call history:", error);
      return [];
    }

    const callHistoryData: CallHistory[] = data.map((record: any) => ({
      date: record.followup_date,
      stage: record.current_stage,
      notes: record.notes
    }));
    return callHistoryData;
  };

  return (
    <ProtectedRoute allowedRoles={["Sales", "Super Admin"]}>

      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">Sales CRM</h1>

            <Button onClick={async () => {
              const followUps = await fetchFollowUps();
              setFollowUpsData(followUps);
              setFollowUpsDialogOpen(true);
            }}>
              Follow Ups
            </Button>




          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">


            <Dialog open={followUpsDialogOpen} onOpenChange={setFollowUpsDialogOpen}>
              {/* <DialogContent className="max-w-7xl"> */}
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
                        const today = new Date().toISOString().split("T")[0];
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
                            const today = new Date().toISOString().split("T")[0];
                            return item.followup_date === today;
                          })
                          .map((item, idx) => (
                            <TableRow key={idx}>
                              <TableCell>{idx + 1}</TableCell>
                              <TableCell>{item.business_id}</TableCell>
                              <TableCell>{item.name}</TableCell>
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
                                    className={`w-40 ${item.current_stage === "Sale Done"
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
                <div className="text-2xl font-bold">{dnpAndConvoCount}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Sales Done</CardTitle>
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
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
            </div>

            <Select value={stageFilter} onValueChange={setStageFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by stage" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stages</SelectItem>
                {salesStages.map(stage => (<SelectItem key={stage} value={stage}>{stage}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>


          <Card>
            <CardHeader><CardTitle>Sales Pipeline</CardTitle></CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>S.No</TableHead>
                      <TableHead>Business ID</TableHead>
                      <TableHead>Client Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Assigned To</TableHead>
                      <TableHead>Stage</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLeads.map((lead, idx) => (
                      <TableRow key={lead.id}>
                        <TableCell>{idx + 1}</TableCell>
                        <TableCell>{lead.business_id}</TableCell>
                        <TableCell>{lead.client_name}</TableCell>
                        <TableCell>{lead.email}</TableCell>
                        <TableCell>{lead.phone}</TableCell>
                        <TableCell>{lead.assigned_to}</TableCell>
                        <TableCell>
                          <Select value={lead.current_stage} onValueChange={(value: SalesStage) => handleStageUpdate(lead.id, value)}
                          >
                            {/* <SelectTrigger className="w-40"><SelectValue /></SelectTrigger> */}
                            <SelectTrigger
                              className={`w-40 ${lead.current_stage === "Sale Done"
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
                        </TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline" onClick={async () => {
                            const callHistory = await fetchCallHistory(lead.id);
                            setSelectedLead({ ...lead, call_history: callHistory });
                            setHistoryDialogOpen(true);
                          }}>
                            <Eye className="h-3 w-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* History Dialog */}
          <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
            {/* <DialogContent className="max-w-2xl"> */}
            <DialogContent onPointerDownOutside={(e) => e.preventDefault()}>

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
                      {selectedLead.call_history.map((call, index) => (
                        <div key={index} className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex justify-between items-center mb-1">
                            <Badge className={getStageColor(call.stage)}>{call.stage}</Badge>
                            <span className="text-xs text-gray-500">{call.date}</span>
                          </div>
                          <p className="text-sm text-gray-600">{call.notes}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Follow-Up Dialog */}
          {/* <Dialog open={followUpDialogOpen} onOpenChange={handleFollowUpDialogClose}> */}
          {/* <DialogContent> */}
          <Dialog open={followUpDialogOpen} onOpenChange={handleFollowUpDialogClose}>
            <DialogContent onPointerDownOutside={(e) => e.preventDefault()}>

              {/* <DialogContent onPointerDownOutside={(e) => e.preventDefault()}> */}

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

          <Dialog open={saleClosingDialogOpen} onOpenChange={(open) => {
            if (!open && pendingStageUpdate && previousStage) {


              setLeads(prev =>
                prev.map(l =>
                  l.id === pendingStageUpdate.leadId
                    ? { ...l, current_stage: previousStage }
                    : l
                )
              );
              setFollowUpsData(prev =>
                prev.map(l =>
                  l.id === pendingStageUpdate.leadId
                    ? { ...l, current_stage: previousStage }
                    : l
                )
              );

              setPendingStageUpdate(null);
              setPreviousStage(null);
            }
            setSaleClosingDialogOpen(open);
          }}>


            <DialogContent onPointerDownOutside={(e) => e.preventDefault()}>

              <DialogHeader><DialogTitle>Close Sale</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div><Label>Sale Value</Label>
                  <Input type="number" value={saleData.sale_value}
                    onChange={(e) => setSaleData(prev => ({ ...prev, sale_value: Number(e.target.value) }))} />
                </div>

                <div><Label>Subscription Cycle</Label>
                  <Select value={saleData.subscription_cycle.toString()}
                    onValueChange={(value) => setSaleData(prev => ({ ...prev, subscription_cycle: Number(value) as 15 | 30 | 60 | 90 }))}>
                    <SelectTrigger><SelectValue placeholder="Select cycle" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 Days</SelectItem>
                      <SelectItem value="30">1 month</SelectItem>
                      <SelectItem value="60">2 month</SelectItem>
                      <SelectItem value="90">3 month</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div><Label>Payment Mode</Label>
                  <Select value={saleData.payment_mode}
                    onValueChange={(value) => setSaleData(prev => ({ ...prev, payment_mode: value as SaleClosing["payment_mode"] }))}>
                    <SelectTrigger><SelectValue placeholder="Select payment mode" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UPI">UPI</SelectItem>
                      <SelectItem value="Card">Card</SelectItem>
                      <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                      <SelectItem value="Cash">Cash</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter><Button onClick={handleSaleClosureSubmit}>Save</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </DashboardLayout>


    </ProtectedRoute>
  );
}


