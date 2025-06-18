
// "use client"
// import { useEffect, useRef, useState } from "react"
// import { DashboardLayout } from "@/components/layout/dashboard-layout"
// import { Button } from "@/components/ui/button"
// import { Input } from "@/components/ui/input"
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
// import { Badge } from "@/components/ui/badge"
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
// import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
// import { Upload, Search, UserPlus, Download } from "lucide-react"
// import { Label } from "@/components/ui/label"
// import { Checkbox } from "@/components/ui/checkbox"
// import Papa from "papaparse"
// // import { bulkAssignToSupabase} from '@/lib/supabaseService';
// import ProtectedRoute from "@/components/auth/ProtectedRoute";
// import { supabase } from '@/utils/supabase/client';


// interface Lead {
//   id: string
//   business_id: string
//   name: string
//   phone: string
//   email: string
//   source: "Instagram" | "WhatsApp" | "Google Forms"
//   city: string
//   status: "New" | "Assigned"
//   created_at: string
//   assigned_to?: string
//   assigned_at?: string
// }




// // const salesTeamMembers = ["John Sales", "Sarah Wilson", "Mike Johnson", "Lisa Chen"]


// export default function MarketingPage() {
//   const [leads, setLeads] = useState<Lead[]>([])
//   const [searchTerm, setSearchTerm] = useState("")
//   const [statusFilter, setStatusFilter] = useState<string>("all")
//   const [sourceFilter, setSourceFilter] = useState<string>("all")
//   const [selectedLeads, setSelectedLeads] = useState<string[]>([])
//   const [bulkAssignDialogOpen, setBulkAssignDialogOpen] = useState(false)
//   const [salesTeamMembers, setSalesTeamMembers] = useState<{ id: string; email: string }[]>([]);
//   const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
//   const [assignedLeads, setAssignedLeads] = useState<Lead[]>([]);
//   const [selectedSalesMember, setSelectedSalesMember] = useState<string | null>(null);
//   const [uniqueSources, setUniqueSources] = useState<string[]>([]);




//   const [selectedFile, setSelectedFile] = useState<File | null>(null);
//   const [showConfirmDialog, setShowConfirmDialog] = useState(false);
//   const [uploadProgress, setUploadProgress] = useState(0);

//   const [loading, setLoading] = useState(true)
//   const [error, setError] = useState<string | null>(null)


//   const filteredLeads = leads.filter((lead) => {
//     const matchesSearch =
//       lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       lead.phone.includes(searchTerm) ||
//       lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       lead.city.toLowerCase().includes(searchTerm.toLowerCase())


//     const matchesStatus = statusFilter === "all" || lead.status === statusFilter
//     const matchesSource = sourceFilter === "all" || lead.source === sourceFilter


//     return matchesSearch && matchesStatus && matchesSource
//   })


//   const handleSelectAll = (checked: boolean) => {
//     if (checked) {
//       setSelectedLeads(filteredLeads.map((lead) => lead.id))
//     } else {
//       setSelectedLeads([])
//     }
//   }


//   const handleSelectLead = (leadId: string, checked: boolean) => {
//     if (checked) {
//       setSelectedLeads((prev) => [...prev, leadId])
//     } else {
//       setSelectedLeads((prev) => prev.filter((id) => id !== leadId))
//     }
//   }

// const handleBulkAssign = async (assignedTo: string) => {
//   try {
//     // Use the secure API-based version
//     const res = await fetch('/api/assign-leads', {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json'
//       },
//       body: JSON.stringify({
//         selectedLeads,
//         assignedTo,
//         assignedAt: new Date().toISOString(),
//         allLeads: leads // allLeads is your `leads` state
//       })
//     });

//     const result = await res.json();

//     if (!res.ok) {
//       console.error('Error assigning leads:', result.error);
//       return;
//     }

//     // Reset selected state
//     setSelectedLeads([]);
//     setBulkAssignDialogOpen(false);

//     // Re-fetch leads after update
//     const { data, error } = await supabase.from('leads').select('*');
//     if (error) throw error;

//     setLeads(data ?? []);
//   } catch (error) {
//     console.error('Error bulk assigning leads:', error);
//   }
// };

// // const formatDateTime = (dateString: string) => {
// //   const date = new Date(dateString);
// //   const pad = (n: number) => n.toString().padStart(2, '0');

// //   const day = pad(date.getDate());
// //   const month = pad(date.getMonth() + 1); // Months are zero-indexed
// //   const year = date.getFullYear();

// //   const hours = pad(date.getHours());
// //   const minutes = pad(date.getMinutes());
// //   const seconds = pad(date.getSeconds());

// //   return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
// // };

// const formatDateTime = (dateString: string) => {
//   const date = new Date(dateString);
//   const pad = (n: number) => n.toString().padStart(2, '0');

//   const day = pad(date.getDate());
//   const month = pad(date.getMonth() + 1);
//   const year = date.getFullYear();

//   let hours = date.getHours();
//   const minutes = pad(date.getMinutes());
//   const seconds = pad(date.getSeconds());

//   const ampm = hours >= 12 ? "PM" : "AM";
//   hours = hours % 12 || 12; // Convert 0 -> 12 for 12AM

//   return `${day}-${month}-${year} ${pad(hours)}:${minutes}:${seconds} ${ampm}`;
// };




// const handleIndividualAssign = async (leadId: string, assignedTo: string) => {
//   try {
//     const res = await fetch('/api/assign-leads', {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json'
//       },
//       body: JSON.stringify({
//         selectedLeads: [leadId], // single assignment
//         assignedAt: new Date().toISOString(),
//         assignedTo
//       })
//     });

//     if (!res.ok) throw new Error("Assignment failed");

//     // Optimistically update UI
//     setLeads((prev) =>
//       prev.map((lead) =>
//         lead.id === leadId ? { ...lead,
//           status: "Assigned" as const,
//           assigned_to: assignedTo,
//           assigned_at: new Date().toISOString(),
//          } : lead
//       )
//     );
//   } catch (error) {
//     console.error("Failed to assign lead:", error);
//   }
// };

//       const downloadCSV = (data: Lead[]) => {
//         const csvContent = [
//           ["Name", "Phone", "Email", "City", "Source", "Assigned To", "Created At", "Assigned At"],
//           ...data.map(lead => [
//             lead.name,
//             lead.phone,
//             lead.email,
//             lead.city,
//             lead.source,
//             lead.assigned_to || "",
//             new Date(lead.created_at).toLocaleDateString(), 
//             // lead.assigned_at ||"",
//             formatDateTime(lead.created_at),
//       lead.assigned_at ? formatDateTime(lead.assigned_at) : "",
//           ])
//         ]
//           .map(row => row.map(cell => `"${cell}"`).join(","))
//           .join("\n");

//         const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
//         const url = URL.createObjectURL(blob);

//         const link = document.createElement("a");
//         link.href = url;
//         link.setAttribute("download", "assigned_leads.csv");
//         document.body.appendChild(link);
//         link.click();
//         document.body.removeChild(link);
//       };


// useEffect(() => {
//   const fetchLeadsAndSales = async () => {
//     setLoading(true);

//     // Fetch leads
//     const { data: leadsData, error: leadsError } = await supabase.from("leads").select("*");
//         if (leadsError) {
//           console.error("Failed to fetch leads:", leadsError);
//           setError("Failed to fetch leads.");
//         } else {
//           setLeads(leadsData ?? []);

//           // Extract and set unique sources
//           const sources = [...new Set(leadsData.map((lead) => lead.source))];
//           setUniqueSources(sources);
//         }


//     // Fetch sales users
//     try {
//       const res = await fetch("/api/sales-users", { method: "GET" });

//       if (!res.ok) {
//         throw new Error(`API failed with status ${res.status}`);
//       }

//       const users = await res.json();

//       if (!Array.isArray(users)) {
//         throw new Error("Invalid response format from /api/sales-users");
//       }

//       setSalesTeamMembers(users); // [{ id, email }]
//     } catch (error) {
//       console.error("Error fetching sales users:", error);
//       setSalesTeamMembers([]); // fallback to empty
//     }

//     setLoading(false);
//   };

//   fetchLeadsAndSales();
// }, []);


//   const getSourceBadgeColor = (source: string) => {
//     switch (source) {
//       case "Instagram":
//         return "bg-pink-100 text-pink-800 rounded-md"
//       case "WhatsApp":
//         return "bg-green-100 text-green-800 rounded-md"
//       case "Google":
//         return "bg-gray-900 text-gray-100 rounded-md"
//       case "Facebook":
//         return "bg-blue-200 text-blue-900 rounded-md"
//       default:
//         return "bg-gray-100 text-gray-800 rounded-md"
//     }
//   }

  
//   const getStatusBadgeColor = (status: string) => {
//     switch (status) {
//       case "New":
//         return "bg-yellow-100 text-yellow-800"
//       case "Assigned":
//         return "bg-green-100 text-green-800"
//       default:
//         return "bg-gray-100 text-gray-800"
//     }
//   }


//     const [uploadDialogOpen, setUploadDialogOpen] = useState(false)

// const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
//   const file = event.target.files?.[0];
//   if (!file) return;
//   setSelectedFile(file);
//   setShowConfirmDialog(true);
//   setUploadProgress(0);

// };

// const [isUploading, setIsUploading] = useState(false);


// const handleConfirmUpload = () => {
//   if (!selectedFile) return;

//   setIsUploading(true);

//   Papa.parse(selectedFile, {
//     header: true,
//     skipEmptyLines: true,
//     complete: async function (results: Papa.ParseResult<any>) {
//       let progress = 0;
//       const updateProgress = setInterval(() => {
//         progress += 10;
//         setUploadProgress(Math.min(progress, 95));
//         if (progress >= 95) clearInterval(updateProgress);
//       }, 200);

//       const parsedData = results.data.map((row: any, index: number) => {
//         let formattedDate = "";
//         try {
//           const [day, month, yearAndTime] = row.Timestamp?.split("-") || [];
//           const [year, time] = yearAndTime?.split(" ") || [];
//           formattedDate = new Date(`${year}-${month}-${day}T${time || "00:00"}:00`).toISOString();
//         } catch (e) {
//           formattedDate = new Date().toISOString();
//         }

//         return {
//           name: row["Full name"] || "",
//           phone: row["Phone Number (Country Code)"] || "",
//           email: row["Email"] || "",
//           city: row["city"] || "",
//           source: row["source"] || "Unknown",
//           status: "New",
//           created_at: formattedDate,
//           assigned_to: "",
//         };
//       });

//       const { error } = await supabase.from("leads").insert(parsedData);

//       if (error) {
//         console.error("Insert Error:", error.message || error);
//       } else {
//         const { data: updatedLeads, error: fetchError } = await supabase.from("leads").select("*");
//         if (!fetchError) {
//           setLeads(updatedLeads || []);
//         }
//       }

//       setUploadProgress(100);
//       setTimeout(() => {
//         setSelectedFile(null);
//         setShowConfirmDialog(false);
//         setUploadProgress(0);
//         setIsUploading(false);
//         setUploadDialogOpen(false);
//       }, 1000);
//     }
//   });
// };

//     const fileInputRef = useRef<HTMLInputElement>(null);


//     const openFileDialog = () => {
//       fileInputRef.current?.click();
//     };




//   return (
//      <ProtectedRoute allowedRoles={["Marketing", "Super Admin"]}>
//     <DashboardLayout>
//       <div className="space-y-6">
       
//         <div className="flex justify-between items-center">
//           <div>
//             <h1 className="text-3xl font-bold text-gray-900">Marketing CRM</h1>
//             <p className="text-gray-600 mt-2">Manage leads and marketing campaigns</p>
//           </div>
//           <div className="flex gap-3">
//             <Button variant="outline" onClick={() => {
//               const filtered = leads.filter(lead => lead.status === "Assigned");
//               setAssignedLeads(filtered);
//               setHistoryDialogOpen(true);
//             }}>
//               📜 History
//             </Button>
//             <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
//             <DialogContent className="max-w-7xl">
//               <DialogHeader>
//                 <DialogTitle>Assigned Leads History</DialogTitle>
//                 <DialogDescription>View all leads that are currently assigned.</DialogDescription>
//               </DialogHeader>

//               {/* Table to display assigned leads */}
//               {assignedLeads && assignedLeads.length > 0 ? (
//       <>
//               <div className="overflow-auto max-h-[400px] border rounded-lg">
//                 <Table>
//                   <TableHeader>
//                     <TableRow>
//                       <TableHead>Name</TableHead>
//                       <TableHead>Phone</TableHead>
//                       <TableHead>Email</TableHead>
//                       <TableHead>City</TableHead>
//                       <TableHead>Source</TableHead>
//                       <TableHead>Assigned To</TableHead>
//                       <TableHead>Step in At</TableHead>
//                       <TableHead>Assigned At</TableHead>
//                     </TableRow>
//                   </TableHeader>
//                   <TableBody>
//                     {assignedLeads.map((lead) => (
//                       <TableRow key={lead.id}>
//                         <TableCell>{lead.name}</TableCell>
//                         <TableCell>{lead.phone}</TableCell>
//                         <TableCell>{lead.email}</TableCell>
//                         <TableCell>{lead.city}</TableCell>
//                         <TableCell className="text-right">{lead.source}</TableCell>
//                         <TableCell>{lead.assigned_to}</TableCell>
//                         <TableCell>{new Date(lead.created_at).toLocaleDateString()}</TableCell>
//                         {/*<TableCell>{lead.assigned_at ? new Date(lead.assigned_at).toLocaleDateString() : ""}</TableCell> */}
//                         <TableCell>{lead.assigned_at ? formatDateTime(lead.assigned_at) : ""}</TableCell>
//                       </TableRow>
//                     ))}
//                   </TableBody>
//                 </Table>
//               </div >

//               <div className="flex justify-end mt-4">
                
//                 <Button onClick={() => downloadCSV(assignedLeads)}>
//                  <Download className="h-4 w-4 mr-2" /> Download CSV
//                 </Button>
//               </div>
//           </>):(<div className="py-8 text-center text-gray-500">
//         <p>There are no assigned leads yet.</p>
//       </div>)}
//             </DialogContent>
//           </Dialog>


//             <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
//   <DialogTrigger asChild>
//     <Button className="gap-2">
//       <Upload className="h-4 w-4" />
//       Upload CSV
//     </Button>
//   </DialogTrigger>

//   <DialogContent className="max-w-md">
//     <DialogHeader>
//       <DialogTitle>Upload Files</DialogTitle>
//       <p className="text-sm text-muted-foreground">Upload your user-downloadable files.</p>
//     </DialogHeader>

//     {/* File Drop Area */}
//     <div className="border border-dashed border-gray-300 p-6 rounded-lg text-center space-y-2">
//       <div className="text-gray-500">Drop your files here or browse</div>
//       <Button variant="outline" onClick={openFileDialog}><Upload className="h-4 w-4" /> Browse from your device</Button>
//       <p className="text-xs text-gray-400">Max file size up to 400 MB</p>
//       <input
//         ref={fileInputRef}
//         type="file"
//         accept=".csv,.xlsx"
//         className="hidden"
//         onChange={handleFileUpload}  
//       />
//     </div>

//     {/* File Preview Section */}
//     {selectedFile && showConfirmDialog && (
//   <div className="mt-4 space-y-2">
//     <div className="flex items-center justify-between bg-gray-100 p-3 rounded-md">
//       <span>{selectedFile.name} - {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB</span>
//       <Button variant="ghost" size="icon" onClick={() => setSelectedFile(null)}>🗑️</Button>
//     </div>

//     {/* ✅ Show progress only after confirm is clicked */}
//     {isUploading && (
//       <div className="relative w-full bg-gray-200 rounded h-2">
// <div className="bg-green-600 h-2 rounded absolute left-0" style={{ width: `${uploadProgress}%` }}></div>
//       </div>
//     )}
//   </div>
// )}


//     {/* Confirm/Cancel Buttons */}
//     {selectedFile && showConfirmDialog && (
//       <div className="flex justify-between mt-6">
//         <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>Cancel</Button>
//         <Button className="bg-green-600 text-white" onClick={handleConfirmUpload}>Confirm</Button>
//       </div>
//     )}
//   </DialogContent>
// </Dialog>

            
//           </div>
//         </div>


//         <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
//           <Card>
//             <CardHeader className="pb-2">
//               <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
//             </CardHeader>
//             <CardContent>
//               <div className="text-2xl font-bold">{leads.length}</div>
//             </CardContent>
//           </Card>
//           <Card>
//             <CardHeader className="pb-2">
//               <CardTitle className="text-sm font-medium">New Leads</CardTitle>
//             </CardHeader>
//             <CardContent>
//               <div className="text-2xl font-bold">{leads.filter((l) => l.status === "New").length}</div>
//             </CardContent>
//           </Card>
//           <Card>
//             <CardHeader className="pb-2">
//               <CardTitle className="text-sm font-medium">Assigned Leads</CardTitle>
//             </CardHeader>
//             <CardContent>
//               <div className="text-2xl font-bold">{leads.filter((l) => l.status === "Assigned").length}</div>
//             </CardContent>
//           </Card>
//           <Card>
//             <CardHeader className="pb-2">
//               <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
//             </CardHeader>
//             <CardContent>
//               <div className="text-2xl font-bold">{((leads.filter((l) => l.status === "Assigned").length*100)/leads.filter((l) => l.status === "New").length).toFixed(1)}%</div>
//             </CardContent>
//           </Card>
//         </div>


//         <Card>
//           <CardHeader>
//             <div className="flex justify-between items-center">
//               <div>
//                 <CardTitle>Leads Management</CardTitle>
//                 <CardDescription>View and manage all marketing leads</CardDescription>
//               </div>
//               {selectedLeads.length > 0 && (
//                 <Button onClick={() => setBulkAssignDialogOpen(true)} className="gap-2">
//                   <UserPlus className="h-4 w-4" />
//                   Bulk Assign ({selectedLeads.length})
//                 </Button>
//               )}
//             </div>
//           </CardHeader>
//           <CardContent>
//             <div className="flex flex-col sm:flex-row gap-4 mb-6">
//               <div className="relative flex-1">
//                 <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
//                 <Input
//                   placeholder="Search by name, phone, email, or city..."
//                   value={searchTerm}
//                   onChange={(e) => setSearchTerm(e.target.value)}
//                   className="pl-10"
//                 />
//               </div>
//               <Select value={statusFilter} onValueChange={setStatusFilter}>
//                 <SelectTrigger className="w-full sm:w-40">
//                   <SelectValue placeholder="Status" />
//                 </SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value="all">All Status</SelectItem>
//                   <SelectItem value="New">New</SelectItem>
//                   <SelectItem value="Assigned">Assigned</SelectItem>
//                 </SelectContent>
//               </Select>
//               <Select value={sourceFilter} onValueChange={setSourceFilter}>
//                 <SelectTrigger className="w-full sm:w-40">
//                   <SelectValue placeholder="Source" />
//                 </SelectTrigger>
//                 <SelectContent>
//                     <SelectItem value="all">All Sources</SelectItem>
//                     {uniqueSources.map((source) => (
//                       <SelectItem key={source} value={source}>
//                         {source}
//                       </SelectItem>
//                     ))}
//                   </SelectContent>

//               </Select>
//             </div>


//             <div className="rounded-md border">
//               <Table>
//                 <TableHeader>
//                   <TableRow>
//                     <TableHead className="w-12">
//                       <Checkbox
//                         checked={selectedLeads.length === filteredLeads.length && filteredLeads.length > 0}
//                         onCheckedChange={handleSelectAll}
//                       />
//                     </TableHead>
//                     <TableHead>ID</TableHead>
//                     <TableHead>Name</TableHead>
//                     <TableHead>Phone</TableHead>
//                     <TableHead>Email</TableHead>
//                     <TableHead>City</TableHead>
//                     <TableHead>Source</TableHead>
//                     <TableHead>Status</TableHead>
//                     <TableHead>Created At</TableHead>
//                     <TableHead>Actions</TableHead>
//                   </TableRow>
//                 </TableHeader>
//                 <TableBody>
//                   {filteredLeads.map((lead) => (
//                     <TableRow key={lead.id}>
//                       <TableCell>
//                         <Checkbox
//                           checked={selectedLeads.includes(lead.id)}
//                           onCheckedChange={(checked) => handleSelectLead(lead.id, checked as boolean)}
//                         />
//                       </TableCell>
//                       {/* <TableCell className="font-medium">{lead.id}</TableCell> */}
//                       <TableCell className="font-medium">{lead.business_id}</TableCell>

//                       <TableCell className="font-medium">{lead.name}</TableCell>
//                       <TableCell>{lead.phone}</TableCell>
//                       <TableCell>{lead.email}</TableCell>
//                       <TableCell>{lead.city}</TableCell>
//                       <TableCell>
//                         <Badge className={getSourceBadgeColor(lead.source)}>{lead.source}</Badge>
//                       </TableCell>
//                       <TableCell>
//                         <Badge className={getStatusBadgeColor(lead.status)}>{lead.status}</Badge>
//                       </TableCell>
//                       <TableCell>{new Date(lead.created_at).toLocaleDateString()}</TableCell>
//                       <TableCell>
//                         {lead.status === "New" ? (
//                           <Select onValueChange={(value) => handleIndividualAssign(lead.id, value)}>
//                             <SelectTrigger className="w-32">
//                               <SelectValue placeholder="Assign" />
//                             </SelectTrigger>
//                           <SelectContent>
//                             {salesTeamMembers.length === 0 ? (
//                               <SelectItem disabled value="none">No Sales Members</SelectItem>
//                             ) : (
//                               salesTeamMembers.map((member) => (
//                                 <SelectItem key={member.id} value={member.email}>
//                                   {member.email}
//                                 </SelectItem>
//                               ))
//                             )}
//                           </SelectContent>
//                           </Select>
//                         ) : (
//                           <span className="text-sm text-gray-500">{lead.assigned_to}</span>
//                         )}
//                       </TableCell>
//                     </TableRow>
//                   ))}
//                 </TableBody>
//               </Table>
//             </div>
//           </CardContent>
//         </Card>


//         <Dialog open={bulkAssignDialogOpen} onOpenChange={setBulkAssignDialogOpen}>
//           <DialogContent>
//             <DialogHeader>
//               <DialogTitle>Bulk Assign Leads</DialogTitle>
//               <DialogDescription>Assign {selectedLeads.length} selected leads to a sales team member</DialogDescription>
//             </DialogHeader>
//             {/* <div className="space-y-4">
//               <div>
//                 <Label>Select Sales Team Member</Label>
//                 <Select
//                   onValueChange={(value) => {
//                     handleBulkAssign(value)
//                   }}
//                 >
//                   <SelectTrigger>
//                     <SelectValue placeholder="Choose team member" />
//                   </SelectTrigger>
//                  <SelectContent>
//                       {salesTeamMembers.length === 0 ? (
//                         <SelectItem disabled value="none">No Sales Members</SelectItem>
//                       ) : (
//                         salesTeamMembers.map((member) => (
//                           <SelectItem key={member.id} value={member.email}>
//                             {member.email}
//                           </SelectItem>
//                         ))
//                       )}
//                     </SelectContent>

//                 </Select>
//               </div>
//             </div> */}
//             <div className="space-y-4">
//   <div>
//     <Label>Select Sales Team Member</Label>
//     <Select
//       onValueChange={(value) => setSelectedSalesMember(value)}
//     >
//       <SelectTrigger>
//         <SelectValue placeholder="Choose team member" />
//       </SelectTrigger>
//       <SelectContent>
//         {salesTeamMembers.length === 0 ? (
//           <SelectItem disabled value="none">No Sales Members</SelectItem>
//         ) : (
//           salesTeamMembers.map((member) => (
//             <SelectItem key={member.id} value={member.email}>
//               {member.email}
//             </SelectItem>
//           ))
//         )}
//       </SelectContent>
//     </Select>
//   </div>

//   <div className="flex justify-end">
//     <Button
//       className="mt-4 bg-green-600 text-white"
//       disabled={!selectedSalesMember || selectedLeads.length === 0}
//       onClick={() => {
//         if (selectedSalesMember) {
//           handleBulkAssign(selectedSalesMember);
//         }
//       }}
//     >
//       Assign Leads
//     </Button>
//   </div>
// </div>

//           </DialogContent>
//         </Dialog>
//       </div>
//     </DashboardLayout>
//     </ProtectedRoute>
//   )
// }
// // i didn't get what you are saying, so i above gave my entire code, so suggest me where should change to get my required output















"use client";
import { useEffect, useRef, useState, useContext } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Upload, Search, UserPlus, Download } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import Papa from "papaparse";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { supabase } from "@/utils/supabase/client";
import { LoadingContext } from "@/components/providers/LoadingContext";
import FullScreenLoader from "@/components/ui/FullScreenLoader";

interface Lead {
  id: string;
  business_id: string;
  name: string;
  phone: string;
  email: string;
  source: "Instagram" | "WhatsApp" | "Google Forms";
  city: string;
  status: "New" | "Assigned";
  created_at: string;
  assigned_to?: string;
  assigned_at?: string;
}

export default function MarketingPage() {
  const { loading, setLoading } = useContext(LoadingContext);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [bulkAssignDialogOpen, setBulkAssignDialogOpen] = useState(false);
  const [salesTeamMembers, setSalesTeamMembers] = useState<
    { id: string; full_name: string }[]
  >([]);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [assignedLeads, setAssignedLeads] = useState<Lead[]>([]);
  const [selectedSalesMember, setSelectedSalesMember] = useState<string | null>(null);
  const [uniqueSources, setUniqueSources] = useState<string[]>([]);
  const [rowCount, setRowCount] = useState<number | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.phone.includes(searchTerm) ||
      lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.city.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
    const matchesSource = sourceFilter === "all" || lead.source === sourceFilter;
    return matchesSearch && matchesStatus && matchesSource;
  });

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const selectableLeadIds = filteredLeads
        .filter((lead) => lead.status !== "Assigned")
        .map((lead) => lead.id);
      setSelectedLeads(selectableLeadIds);
    } else {
      setSelectedLeads([]);
    }
  };

  const handleSelectLead = (leadId: string, checked: boolean) => {
    if (checked) {
      setSelectedLeads((prev) => [...prev, leadId]);
    } else {
      setSelectedLeads((prev) => prev.filter((id) => id !== leadId));
    }
  };

  const handleBulkAssign = async (assignedTo: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/assign-leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selectedLeads,
          assignedTo,
          assignedAt: new Date().toISOString(),
          allLeads: leads,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Assignment failed");

      setSelectedLeads([]);
      setBulkAssignDialogOpen(false);

      const { data, error } = await supabase.from("leads").select("*");
      if (error) throw error;
      setLeads(data ?? []);
    } catch (error) {
      console.error("Bulk assign error:", error);
    } finally {
      setLoading(false);
    }
  };

  // const handleIndividualAssign = async (leadId: string, assignedTo: string) => {
  //   setLoading(true);
  //   try {
  //     const res = await fetch("/api/assign-leads", {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({
  //         selectedLeads: [leadId],
  //         assignedAt: new Date().toISOString(),
  //         assignedTo,
  //       }),
  //     });
  //     if (!res.ok) throw new Error("Assignment failed");

  //     setLeads((prev) =>
  //       prev.map((lead) =>
  //         lead.id === leadId
  //           ? {
  //               ...lead,
  //               status: "Assigned",
  //               assigned_to: assignedTo,
  //               assigned_at: new Date().toISOString(),
  //             }
  //           : lead
  //       )
  //     );
  //   } catch (error) {
  //     console.error("Individual assign error:", error);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const handleIndividualAssign = async (leadId: string, assignedTo: string) => {
  setLoading(true, "Assigning... please wait");
  try {
    const res = await fetch("/api/assign-leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        selectedLeads: [leadId],
        assignedAt: new Date().toISOString(),
        assignedTo,
      }),
    });

    if (!res.ok) throw new Error("Assignment failed");

    setLeads((prev) =>
      prev.map((lead) =>
        lead.id === leadId
          ? {
              ...lead,
              status: "Assigned",
              assigned_to: assignedTo,
              assigned_at: new Date().toISOString(),
            }
          : lead
      )
    );
  } catch (error) {
    console.error("Individual assign error:", error);
  } finally {
    setLoading(false);
  }
};


  const fetchLeadsAndSales = async () => {
    setLoading(true);
    try {
      const { data: leadsData, error: leadsError } = await supabase
        .from("leads")
        .select("*");
      if (leadsError) throw leadsError;
      setLeads(leadsData ?? []);
      const sources = [...new Set(leadsData.map((lead) => lead.source))];
      setUniqueSources(sources);

      const res = await fetch("/api/sales-users", { method: "GET" });
      if (!res.ok) throw new Error(`Sales API failed: ${await res.text()}`);
      const users = await res.json();
      if (!Array.isArray(users)) throw new Error("Invalid sales data");
      setSalesTeamMembers(users);
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeadsAndSales();
  }, []);

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const pad = (n: number) => n.toString().padStart(2, "0");
    const day = pad(date.getDate());
    const month = pad(date.getMonth() + 1);
    const year = date.getFullYear();
    let hours = date.getHours();
    const minutes = pad(date.getMinutes());
    const seconds = pad(date.getSeconds());
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    return `${day}-${month}-${year} ${pad(hours)}:${minutes}:${seconds} ${ampm}`;
  };

  const downloadCSV = (data: Lead[]) => {
    const csvContent = [
      [
        "Name",
        "Phone",
        "Email",
        "City",
        "Source",
        "Assigned To",
        "Created At",
        "Assigned At",
      ],
      ...data.map((lead) => [
        lead.name,
        lead.phone,
        lead.email,
        lead.city,
        lead.source,
        lead.assigned_to || "",
        formatDateTime(lead.created_at),
        lead.assigned_at ? formatDateTime(lead.assigned_at) : "",
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "assigned_leads.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const openFileDialog = () => fileInputRef.current?.click();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setShowConfirmDialog(true);
    setUploadProgress(0);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setRowCount(results.data.length);
      },
    });
  };

  const formatFileSize = (size: number) =>
    size >= 1024 * 1024
      ? `${(size / (1024 * 1024)).toFixed(1)} MB`
      : `${(size / 1024).toFixed(1)} KB`;

  const handleConfirmUpload = () => {
    if (!selectedFile) return;
    setIsUploading(true);
    setLoading(true);

    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        setRowCount(results.data.length);
        const parsedData = results.data.map((row: any) => {
          let formattedDate = "";
          try {
            const [day, month, yearAndTime] = row.Timestamp?.split("-") || [];
            const [year, time] = yearAndTime?.split(" ") || [];
            formattedDate = new Date(
              `${year}-${month}-${day}T${time || "00:00"}:00`
            ).toISOString();
          } catch {
            formattedDate = new Date().toISOString();
          }

          return {
            name: row["Full name"] || "",
            phone: row["Phone Number (Country Code)"] || "",
            email: row["Email"] || "",
            city: row["city"] || "",
            source: row["source"] || "Unknown",
            status: "New",
            created_at: formattedDate,
            assigned_to: "",
          };
        });

        const { error } = await supabase.from("leads").insert(parsedData);
        if (!error) {
          const { data: updated, error: fetchError } = await supabase
            .from("leads")
            .select("*");
          if (!fetchError) setLeads(updated || []);
        }

        setTimeout(() => {
          setUploadProgress(100);
          setSelectedFile(null);
          setShowConfirmDialog(false);
          setUploadDialogOpen(false);
          setUploadProgress(0);
          setIsUploading(false);
          setLoading(false);
        }, 1000);
      },
    });
  };

  const getSourceBadgeColor = (source: string) => {
    switch (source) {
      case "Instagram":
        return "bg-pink-100 text-pink-800 rounded-md";
      case "WhatsApp":
        return "bg-green-100 text-green-800 rounded-md";
      case "Google":
        return "bg-gray-900 text-gray-100 rounded-md";
      case "Facebook":
        return "bg-blue-200 text-blue-900 rounded-md";
      default:
        return "bg-gray-100 text-gray-800 rounded-md";
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "New":
        return "bg-red-100 text-red-800";
      case "Assigned":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <>
      {loading && <FullScreenLoader />}
      <ProtectedRoute allowedRoles={["Marketing", "Super Admin"]}>
        <DashboardLayout>
          <div className="space-y-6">
       
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Marketing CRM</h1>
            <p className="text-gray-600 mt-2">Manage leads and marketing campaigns</p>
          </div>
          <div className="flex gap-3">
          
          <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>

            <DialogTrigger asChild>
            <Button variant="outline" onClick={() => {
              const filtered = leads.filter(lead => lead.status === "Assigned");
              setAssignedLeads(filtered);
              setHistoryDialogOpen(true);
            }}>
              📜 History
            </Button>
            </DialogTrigger>

            { historyDialogOpen && (

            <DialogContent className="max-w-7xl">
              <DialogHeader>
                <DialogTitle>Assigned Leads History</DialogTitle>
                <DialogDescription>View all leads that are currently assigned.</DialogDescription>
              </DialogHeader>

              {/* Table to display assigned leads */}
              {assignedLeads && assignedLeads.length > 0 ? (
      <>
              <div className="overflow-auto max-h-[400px] border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>City</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Assigned To</TableHead>
                      <TableHead>Created At</TableHead>
                      <TableHead>Assigned At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assignedLeads.map((lead) => (
                      <TableRow key={lead.id}>
                        <TableCell>{lead.name}</TableCell>
                        <TableCell>{lead.phone}</TableCell>
                        <TableCell>{lead.email}</TableCell>
                        <TableCell>{lead.city}</TableCell>
                        <TableCell className="text-right">{lead.source}</TableCell>
                        <TableCell>{lead.assigned_to}</TableCell>
                        <TableCell>{new Date(lead.created_at).toLocaleDateString()}</TableCell>
                        {/*<TableCell>{lead.assigned_at ? new Date(lead.assigned_at).toLocaleDateString() : ""}</TableCell> */}
                        <TableCell>{lead.assigned_at ? formatDateTime(lead.assigned_at) : ""}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div >

              <div className="flex justify-end mt-4">
                
                <Button onClick={() => downloadCSV(assignedLeads)}>
                 <Download className="h-4 w-4 mr-2" /> Download CSV
                </Button>
              </div>
          </>):(<div className="py-8 text-center text-gray-500">
        <p>There are no assigned leads yet.</p>
      </div>)}
            </DialogContent>
            )}
          </Dialog>


            <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
  <DialogTrigger asChild>
    <Button className="gap-2">
      <Upload className="h-4 w-4" />
      Upload CSV
    </Button>
  </DialogTrigger>

  <DialogContent className="max-w-md">
    <DialogHeader>
      <DialogTitle>Upload Files</DialogTitle>
      <p className="text-sm text-muted-foreground">Upload your user-downloadable files.</p>
    </DialogHeader>

    {/* File Drop Area */}
    <div className="border border-dashed border-gray-300 p-6 rounded-lg text-center space-y-2">
      <div className="text-gray-500">Drop your files here or browse</div>
      <Button variant="outline" onClick={openFileDialog}><Upload className="h-4 w-4" /> Browse from your device</Button>
      <p className="text-xs text-gray-400">Max file size up to 400 MB</p>
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.xlsx"
        className="hidden"
        onChange={handleFileUpload}  
      />
    </div>

    {/* File Preview Section */}
    {selectedFile && showConfirmDialog && (
  <div className="mt-4 space-y-2">
    <div className="flex items-center justify-between bg-gray-100 p-3 rounded-md">
      <span>
         {selectedFile.name} – {formatFileSize(selectedFile.size)}
        {rowCount !== null && ` - ${rowCount} rows`}
      </span>
      <Button variant="ghost" size="icon" onClick={() => {setSelectedFile(null); setRowCount(null);}}>🗑️</Button>
    </div>

    {/* ✅ Show progress only after confirm is clicked */}
    {isUploading && (
      <div className="relative w-full bg-gray-200 rounded h-2">
<div className="bg-green-600 h-2 rounded absolute left-0" style={{ width: `${uploadProgress}%` }}></div>
      </div>
    )}
  </div>
)}


    {/* Confirm/Cancel Buttons */}
    {selectedFile && showConfirmDialog && (
      <div className="flex justify-between mt-6">
        <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>Cancel</Button>
        <Button className="bg-green-600 text-white" onClick={handleConfirmUpload}>Confirm</Button>
      </div>
    )}
  </DialogContent>
</Dialog>

            
          </div>
        </div>


        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{leads.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Not Assigned</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{leads.filter((l) => l.status === "New").length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Assigned Leads</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{leads.filter((l) => l.status === "Assigned").length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{((leads.filter((l) => l.status === "Assigned").length*100)/leads.filter((l) => l.status === "New").length).toFixed(1)}%</div>
            </CardContent>
          </Card>
        </div>


        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Leads Management</CardTitle>
                <CardDescription>View and manage all marketing leads</CardDescription>
              </div>
              {selectedLeads.length > 0 && (
                <Button onClick={() => setBulkAssignDialogOpen(true)} className="gap-2">
                  <UserPlus className="h-4 w-4" />
                  Bulk Assign ({selectedLeads.length})
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search by name, phone, email, or city..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="New">New</SelectItem>
                  <SelectItem value="Assigned">Assigned</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Source" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Sources</SelectItem>
                    {uniqueSources.map((source) => (
                      <SelectItem key={source} value={source}>
                        {source}
                      </SelectItem>
                    ))}
                  </SelectContent>

              </Select>
            </div>


            <div className="rounded-md border max-h-[600px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky top-0 bg-white z-10 w-12">
                      <Checkbox
                        checked={selectedLeads.length === filteredLeads.length && filteredLeads.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead className="sticky top-0 bg-white z-10">ID</TableHead>
                    <TableHead className="sticky top-0 bg-white z-10">Name</TableHead>
                    <TableHead className="sticky top-0 bg-white z-10">Phone</TableHead>
                    <TableHead className="sticky top-0 bg-white z-10">Email</TableHead>
                    <TableHead className="sticky top-0 bg-white z-10">City</TableHead>
                    <TableHead className="sticky top-0 bg-white z-10">Source</TableHead>
                    <TableHead className="sticky top-0 bg-white z-10">Status</TableHead>
                    <TableHead className="sticky top-0 bg-white z-10">Created At</TableHead>
                    <TableHead className="sticky top-0 bg-white z-10">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeads.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedLeads.includes(lead.id)}
                          onCheckedChange={(checked) => handleSelectLead(lead.id, checked as boolean)}
                          disabled={lead.status === "Assigned"}
                        />
                      </TableCell>
                      
                      <TableCell className="font-medium">{lead.business_id}</TableCell>

                      <TableCell className="font-medium">{lead.name}</TableCell>
                      <TableCell>{lead.phone}</TableCell>
                      <TableCell>{lead.email}</TableCell>
                      <TableCell>{lead.city}</TableCell>
                      <TableCell>
                        <Badge className={getSourceBadgeColor(lead.source)}>{lead.source}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusBadgeColor(lead.status)}>{lead.status}</Badge>
                      </TableCell>
                      <TableCell>{new Date(lead.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {lead.status === "New" ? (
                          <Select onValueChange={(value) => handleIndividualAssign(lead.id, value)}>
                            <SelectTrigger className="w-32">
                              <SelectValue placeholder="Assign" />
                            </SelectTrigger>
                          <SelectContent>
                              {salesTeamMembers
                                .filter((member) => member.full_name && member.full_name.trim() !== "")
                                .map((member) => (
                                  <SelectItem key={member.id} value={member.full_name}>
                                    {member.full_name}
                                  </SelectItem>
                              ))}  
                          </SelectContent>
                          </Select>
                        ) : (
                          <span className="text-sm text-gray-500">{lead.assigned_to}</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>


        <Dialog open={bulkAssignDialogOpen} onOpenChange={setBulkAssignDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Bulk Assign Leads</DialogTitle>
              <DialogDescription>Assign {selectedLeads.length} selected leads to a sales team member</DialogDescription>
            </DialogHeader>
           
            <div className="space-y-4">
  <div>
    <Label>Select Sales Team Member</Label>
    <Select
      onValueChange={(value) => setSelectedSalesMember(value)}
    >
      <SelectTrigger>
        <SelectValue placeholder="Choose team member" />
      </SelectTrigger>
      <SelectContent>
       

              {salesTeamMembers
  .filter((member) => member.full_name && member.full_name.trim() !== "")
  .map((member) => (
    <SelectItem key={member.id} value={member.full_name}>
      {member.full_name}
    </SelectItem>
))}


          
      </SelectContent>
    </Select>
  </div>

  <div className="flex justify-end">
    <Button
      className="mt-4 bg-green-600 text-white"
      disabled={!selectedSalesMember || selectedLeads.length === 0}
      onClick={() => {
        if (selectedSalesMember) {
          handleBulkAssign(selectedSalesMember);
        }
      }}
    >
      Assign Leads
    </Button>
  </div>
</div>

          </DialogContent>
        </Dialog>
      </div>
        </DashboardLayout>
      </ProtectedRoute>
    </>
  );
}
