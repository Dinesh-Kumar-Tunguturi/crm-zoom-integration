
"use client"
import { useEffect, useRef, useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Upload, Search, UserPlus, Download } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import Papa from "papaparse"
// import { bulkAssignToSupabase} from '@/lib/supabaseService';
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { supabase } from '@/utils/supabase/client';


interface Lead {
  id: string
  business_id: string
  name: string
  phone: string
  email: string
  source: "Instagram" | "WhatsApp" | "Google Forms"
  city: string
  status: "New" | "Assigned"
  created_at: string
  assigned_to?: string
}




const salesTeamMembers = ["John Sales", "Sarah Wilson", "Mike Johnson", "Lisa Chen"]


export default function MarketingPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [sourceFilter, setSourceFilter] = useState<string>("all")
  const [selectedLeads, setSelectedLeads] = useState<string[]>([])
  const [bulkAssignDialogOpen, setBulkAssignDialogOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)


  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.phone.includes(searchTerm) ||
      lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.city.toLowerCase().includes(searchTerm.toLowerCase())


    const matchesStatus = statusFilter === "all" || lead.status === statusFilter
    const matchesSource = sourceFilter === "all" || lead.source === sourceFilter


    return matchesSearch && matchesStatus && matchesSource
  })


  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedLeads(filteredLeads.map((lead) => lead.id))
    } else {
      setSelectedLeads([])
    }
  }


  const handleSelectLead = (leadId: string, checked: boolean) => {
    if (checked) {
      setSelectedLeads((prev) => [...prev, leadId])
    } else {
      setSelectedLeads((prev) => prev.filter((id) => id !== leadId))
    }
  }

  //------------------------changed code or pasted code------------------
// const assignLeads = async (
//   selectedLeads: string[],
//   assignedTo: string,
//   allLeads: Lead[]
// ) => {
//   try {
//     const res = await fetch('/api/assign-leads', {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json'
//       },
//       body: JSON.stringify({ selectedLeads, assignedTo, allLeads })
//     });

//     const result = await res.json();
//     if (!res.ok) {
//       console.error('API error:', result.error);
//     } else {
//       console.log('Success:', result);
//     }
//   } catch (err) {
//     console.error('Unexpected error:', err);
//   }
// };

//------------until here i pasted---------------

const handleBulkAssign = async (assignedTo: string) => {
  try {
    // Use the secure API-based version
    const res = await fetch('/api/assign-leads', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        selectedLeads,
        assignedTo,
        allLeads: leads // allLeads is your `leads` state
      })
    });

    const result = await res.json();

    if (!res.ok) {
      console.error('Error assigning leads:', result.error);
      return;
    }

    // Reset selected state
    setSelectedLeads([]);
    setBulkAssignDialogOpen(false);

    // Re-fetch leads after update
    const { data, error } = await supabase.from('leads').select('*');
    if (error) throw error;

    setLeads(data ?? []);
  } catch (error) {
    console.error('Error bulk assigning leads:', error);
  }
};


  const handleIndividualAssign = (leadId: string, assignedTo: string) => {
  setLeads((prev) =>
    prev.map((lead) =>
      lead.id === leadId ? { ...lead, status: "Assigned" as const, assigned_to: assignedTo } : lead
    )
  );
};

  useEffect(() => {
  const fetchLeads = async () => {
    setLoading(true)
    const { data, error } = await supabase.from("leads").select("*")
    if (error) {
      console.error("Failed to fetch leads:", error)
      setError("Failed to fetch leads.")
    } else {
      setLeads(data as Lead[])
    }
    setLoading(false)
  }


  fetchLeads()
}, [])




  const getSourceBadgeColor = (source: string) => {
    switch (source) {
      case "Instagram":
        return "bg-pink-100 text-pink-800"
      case "Whatsapp":
        return "bg-green-100 text-green-800"
      case "Google Forms":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }


    const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
      const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  if (!file) return;
  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    complete: function (results) {
      const parsedData = results.data.map((row: any, index: number) => ({
        id: (row.ID || `L${index + 1}`) as string,
        business_id: row.BusinessID || '', // Add this line to include business_id
        name: row.Name || '',
        phone: row.Phone || '',
        email: row.Email || '',
        city: row.City || '',
        source: row.Source || 'Unknown',
        status: row.Status || 'New',
        created_at: new Date().toISOString(),
        assigned_to: '',
      }));
      setLeads(parsedData);
    },
  });
};




    const fileInputRef = useRef<HTMLInputElement>(null);


    const openFileDialog = () => {
      fileInputRef.current?.click();
    };


  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "New":
        return "bg-yellow-100 text-yellow-800"
      case "Assigned":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }


  return (
     <ProtectedRoute allowedRoles={["Marketing", "Super Admin"]}>
    <DashboardLayout>
      <div className="space-y-6">
       
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Marketing CRM</h1>
            <p className="text-gray-600 mt-2">Manage leads and marketing campaigns</p>
          </div>
          <div className="flex gap-3">
         
            <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Upload className="h-4 w-4" />
                  Upload CSV
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Import Leads</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <Button className="bg-blue-600 w-full" onClick={openFileDialog}>
                    Upload Excel / CSV File
                  </Button>
                  <input ref={fileInputRef} type="file" accept=".csv, .xlsx" className="hidden" onChange={handleFileUpload} aria-label="Upload Excel or CSV file" />
                  <Button className="bg-green-600 w-full" onClick={() => alert("Sync with Google Sheets feature coming soon!")}>
                    Sync with Google Sheets
                  </Button>
                </div>
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
              <CardTitle className="text-sm font-medium">New Leads</CardTitle>
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
              <div className="text-2xl font-bold">24%</div>
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
                  <SelectItem value="Instagram">Instagram</SelectItem>
                  <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                  <SelectItem value="Google Forms">Google Forms</SelectItem>
                </SelectContent>
              </Select>
            </div>


            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedLeads.length === filteredLeads.length && filteredLeads.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>City</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeads.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedLeads.includes(lead.id)}
                          onCheckedChange={(checked) => handleSelectLead(lead.id, checked as boolean)}
                        />
                      </TableCell>
                      {/* <TableCell className="font-medium">{lead.id}</TableCell> */}
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
                              {salesTeamMembers.map((member) => (
                                <SelectItem key={member} value={member}>
                                  {member}
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
                  onValueChange={(value) => {
                    handleBulkAssign(value)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose team member" />
                  </SelectTrigger>
                  <SelectContent>
                    {salesTeamMembers.map((member) => (
                      <SelectItem key={member} value={member}>
                        {member}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
    </ProtectedRoute>
  )
}
