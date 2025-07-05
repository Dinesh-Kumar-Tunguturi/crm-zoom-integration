
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
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, PlusCircle } from "lucide-react";

import { Upload, Search, UserPlus, Download, List } from "lucide-react";
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
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [assignSuccessMessage, setAssignSuccessMessage] = useState("");
  const [leadTab, setLeadTab] = useState<"New" | "Assigned">("New");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [allLeadsStats, setAllLeadsStats] = useState({ total: 0, assigned: 0, new: 0 });
  const [showReassignDialog, setShowReassignDialog] = useState(false);
  const [pendingAssignee, setPendingAssignee] = useState<string | null>(null);

  const [startDate, setStartDate] = useState<string>("");
const [endDate, setEndDate] = useState<string>("");

  const [googleSheets, setGoogleSheets] = useState<{ id: number, name: string, url: string }[]>([]);
  const [showSheetsDialog, setShowSheetsDialog] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [googleSheetDialogOpen, setGoogleSheetDialogOpen] = useState(false);
  const [newSheetName, setNewSheetName] = useState("");
  const [newSheetUrl, setNewSheetUrl] = useState("");
  const [resultDialogOpen, setResultDialogOpen] = useState(false);
  const [resultMessage, setResultMessage] = useState({
    title: '',
    description: '',
    isError: false
  });

  // Add this effect to auto-close the dialog
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resultDialogOpen) {
      timer = setTimeout(() => {
        setResultDialogOpen(false);
      }, 2500); // 2.5 seconds
    }
    return () => clearTimeout(timer);
  }, [resultDialogOpen]);

  useEffect(() => {
    fetchGoogleSheets();
    // ... your other useEffect code
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (copySuccess) {
      timer = setTimeout(() => {
        setCopySuccess(false);
      }, 3000); // 3 seconds
    }
    return () => clearTimeout(timer);
  }, [copySuccess]);

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

      setAssignSuccessMessage(`Assigned ${selectedLeads.length} lead(s) to ${assignedTo}.`);
      setSuccessDialogOpen(true); //  Open dialog
      setTimeout(() => setSuccessDialogOpen(false), 3000);

      setSelectedLeads([]);
      setBulkAssignDialogOpen(false);

      const { data, error } = await supabase.from("leads").select("*");
      if (error) throw error;
      setLeads(data ?? []);
      fetchLeadCounts();

    } catch (error) {
      console.error("Bulk assign error:", error);
    } finally {
      setLoading(false);
    }
  };


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
      fetchLeadCounts();

    } catch (error) {
      console.error("Individual assign error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeadCounts = async () => {
    try {
      const { data: totalLeads, error: totalErr } = await supabase
        .from("leads")
        .select("id, status");
      if (totalErr) throw totalErr;

      const total = totalLeads.length;
      const assigned = totalLeads.filter((l) => l.status === "Assigned").length;
      const newLeads = totalLeads.filter((l) => l.status === "New").length;

      setAllLeadsStats({ total, assigned, new: newLeads });
    } catch (err) {
      console.error("Failed to fetch lead counts:", err);
    }
  };

  useEffect(() => {
    fetchLeadCounts();
  }, []);


  const fetchLeadsAndSales = async (
    page = 1,
    tab = leadTab,
    search = searchTerm,
    status = statusFilter,
    source = sourceFilter
  ) => {
    setLoading(true);
    try {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
        .from("leads")
        .select("*", { count: "exact" })
        .range(from, to)
        .order("created_at", { ascending: false });

//         if (startDate && endDate) {
//   query = query.gte("created_at", `${startDate}T00:00:00`).lte("created_at", `${endDate}T23:59:59`);
// }
if (startDate && endDate) {
  query = query
    .gte("created_at", `${startDate}T00:00:00+05:30`)
    .lte("created_at", `${endDate}T23:59:59+05:30`);
}


      if (tab) query = query.eq("status", tab);
      if (search) {
        query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%,city.ilike.%${search}%`);
      }
      if (source !== "all") query = query.eq("source", source);
      if (status !== "all") query = query.eq("status", status);

      const { data: leadsData, error, count } = await query;
      // leadsData?.sort((a, b) => {
      //   const numA = parseInt(a.business_id.replace("AWL-", ""), 10);
      //   const numB = parseInt(b.business_id.replace("AWL-", ""), 10);
      //   return numA - numB;
      // });

      // setLeads(leadsData ?? []);

      if (error) throw error;

      setLeads(leadsData ?? []);
      setTotalPages(Math.ceil((count || 0) / pageSize));
      setUniqueSources([...new Set((leadsData ?? []).map((l) => l.source))]);

      // Fetch Sales Team
      const res = await fetch("/api/sales-users", { method: "GET" });
      if (!res.ok) throw new Error(`Sales API failed: ${await res.text()}`);
      const users = await res.json();
      setSalesTeamMembers(users);
    } catch (err) {
      console.error("Error fetching leads:", err);
    } finally {
      setLoading(false);
    }
  };

  // useEffect(() => {
  //   fetchLeadsAndSales(currentPage, leadTab, searchTerm, statusFilter, sourceFilter);
  // }, [currentPage, leadTab, pageSize, searchTerm, statusFilter, sourceFilter]);

  useEffect(() => {
  fetchLeadsAndSales(currentPage, leadTab, searchTerm, statusFilter, sourceFilter);
}, [currentPage, leadTab, pageSize, searchTerm, statusFilter, sourceFilter, startDate, endDate]);



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

        setTimeout(async () => {
          setUploadProgress(100);
          setSelectedFile(null);
          setShowConfirmDialog(false);
          setUploadDialogOpen(false);
          setUploadProgress(0);
          setIsUploading(false);
          setLoading(false);

          await fetchLeadCounts();

          // Fetch only 15 new leads after upload
          await fetchLeadsAndSales(1, "New", "", "all", "all");
          setCurrentPage(1); // Reset pagination

        }, 1000);
        fetchLeadCounts();
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

  const handleAddNewSheet = async () => {
    try {
      setLoading(true);

      if (!newSheetUrl.match(/https:\/\/docs\.google\.com\/spreadsheets\/.+/)) {
        throw new Error('Must be a valid Google Sheets URL (https://docs.google.com/spreadsheets/...)');
      }

      const { data, error } = await supabase
        .from('google_sheets_config')
        .insert([{
          name: newSheetName.trim(),
          url: newSheetUrl.trim()
        }])
        .select()
        .single(); // Ensures we get a single record

      if (error) {
        console.error('Supabase insert error:', error);
        throw new Error(error.message || 'Failed to save sheet configuration');
      }

      // Show success (will auto-close in 3s via useEffect)
      setResultMessage({
        title: 'Success ✅',
        description: `"${newSheetName}" added successfully!`,
        isError: false
      });
      setResultDialogOpen(true);

      setGoogleSheetDialogOpen(false);
      setNewSheetName('');
      setNewSheetUrl('');
      fetch('/api/fetch-google-sheet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.CRON_SECRET || "local_dev_secret"}`
        },
      }).catch(console.error); // Silently handle fetch errors

    } catch (error) {
      // Show error (will auto-close in 3s via useEffect)
      setResultMessage({
        title: 'Error ❌',
        description: error instanceof Error ?
          error.message.replace('Invalid Google Sheets URL - ', '') :
          'Operation failed',
        isError: true
      });
      setResultDialogOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const fetchGoogleSheets = async () => {
    try {
      const { data, error } = await supabase
        .from('google_sheets_config')
        .select('id, name, url')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGoogleSheets(data || []);
    } catch (err) {
      console.error('Error fetching Google Sheets:', err);
    }
  };


  return (
    <>
      {loading && <FullScreenLoader />}
      <ProtectedRoute allowedRoles={["Marketing", "Super Admin"]}>
        {/* <div className="w-full overflow-x-hidden"> */}
        <div className="w-full px-4 md:px-6 lg:px-8 overflow-x-hidden">

          <DashboardLayout>
            {/* <div className="space-y-6"> */}
            <main className="container mx-auto px-4 sm:px-6 lg:px-8 space-y-6">


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

                    {historyDialogOpen && (

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
                          </>) : (<div className="py-8 text-center text-gray-500">
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

                    {/* <DialogContent className="max-w-md"> */}
                    <DialogContent className="w-[95%] sm:max-w-md">

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
                            <Button variant="ghost" size="icon" onClick={() => { setSelectedFile(null); setRowCount(null); }}>🗑️</Button>
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

                  {/* <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        className="cursor-pointer"
                        onClick={() => {

                          setGoogleSheetDialogOpen(true);
                        }}
                      >
                        <PlusCircle className="mr-2 h-4 w-4" />
                        <span>Add new Google Sheet to autofetch</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu> */}

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        className="cursor-pointer"
                        onClick={() => setGoogleSheetDialogOpen(true)}
                      >
                        <PlusCircle className="mr-2 h-4 w-4" />
                        <span>Add new Google Sheet</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="cursor-pointer"
                        onClick={() => {
                          fetchGoogleSheets();
                          setShowSheetsDialog(true);
                        }}
                      >
                        <List className="mr-2 h-4 w-4" />
                        <span>View all Google Sheets</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <Dialog open={successDialogOpen} onOpenChange={setSuccessDialogOpen}>
                    {/* <DialogContent className="max-w-md"> */}
                    <DialogContent className="w-[95%] sm:max-w-md">

                      <DialogHeader>
                        <DialogTitle>Assignment Success</DialogTitle>
                      </DialogHeader>

                      <div>
                        <DialogDescription>{assignSuccessMessage}</DialogDescription>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Dialog open={googleSheetDialogOpen} onOpenChange={setGoogleSheetDialogOpen}>
                    {/* <DialogContent className="max-w-md"> */}
                    <DialogContent className="w-[95%] sm:max-w-md">

                      <DialogHeader>
                        <DialogTitle>Add New Google Sheet</DialogTitle>
                        <DialogDescription>
                          Connect a new Google Sheet to automatically import leads
                        </DialogDescription>
                      </DialogHeader>

                      <div className="space-y-4">
                        <div>
                          <Label>Sheet Name</Label>
                          <Input
                            placeholder="e.g., Nikhil_reel_3_leads"
                            value={newSheetName}
                            onChange={(e) => setNewSheetName(e.target.value)}
                          />
                        </div>

                        <div>
                          <Label>Google Sheet URL</Label>
                          <Input
                            placeholder="https://docs.google.com/spreadsheets/d/..."
                            value={newSheetUrl}
                            onChange={(e) => setNewSheetUrl(e.target.value)}
                          />
                        </div>

                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            onClick={() => {
                              setGoogleSheetDialogOpen(false);
                              setNewSheetName('');
                              setNewSheetUrl('');
                            }}
                            disabled={loading}
                          >
                            Cancel
                          </Button>

                          <Button
                            onClick={handleAddNewSheet}
                            disabled={!newSheetName || !newSheetUrl || loading}
                          >
                            {loading ? (
                              <span className="flex items-center gap-2">
                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                </svg>
                                Adding...
                              </span>
                            ) : (
                              "Add Sheet"
                            )}
                          </Button>
                        </div>

                      </div>
                    </DialogContent>
                  </Dialog>

                  <Dialog open={showSheetsDialog} onOpenChange={setShowSheetsDialog}>
                    <DialogContent className="max-w-2xl" onInteractOutside={(e) => e.preventDefault()}>
                      <DialogHeader>
                        <DialogTitle>Google Sheets Configuration</DialogTitle>
                        <DialogDescription>
                          All connected Google Sheets for lead imports
                        </DialogDescription>
                      </DialogHeader>

                      {copySuccess && (
                        <div className="p-3 mb-4 bg-green-100 text-green-800 rounded-md text-center">
                          URL copied to clipboard!
                        </div>
                      )}

                      <div className="max-h-[500px] overflow-y-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[100px]">ID</TableHead>
                              <TableHead>Sheet Name</TableHead>
                              <TableHead>URL</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {googleSheets.map((sheet) => (
                              <TableRow key={sheet.id}>
                                <TableCell className="font-medium">{sheet.id}</TableCell>
                                <TableCell>{sheet.name}</TableCell>
                                <TableCell>
                                  <a
                                    href={sheet.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline"
                                  >
                                    {sheet.url.length > 40
                                      ? `${sheet.url.substring(0, 40)}...`
                                      : sheet.url}
                                  </a>
                                </TableCell>
                                <TableCell className="text-right">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      navigator.clipboard.writeText(sheet.url);
                                      setCopySuccess(true);
                                    }}
                                  >
                                    Copy URL
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                            {googleSheets.length === 0 && (
                              <TableRow>
                                <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                                  No Google Sheets configured yet
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>

                      <DialogFooter>
                        <Button onClick={() => {
                          setShowSheetsDialog(false);
                          setCopySuccess(false);
                        }}>
                          Close
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  <Dialog open={resultDialogOpen} onOpenChange={setResultDialogOpen}>
                    <DialogContent className="max-w-sm">
                      <DialogHeader>
                        <DialogTitle className={resultMessage.isError ? "text-red-600" : "text-green-600"}>
                          {resultMessage.title}
                        </DialogTitle>
                      </DialogHeader>
                      <div className="py-2">
                        <p>{resultMessage.description}</p>
                      </div>
                      {/* Progress bar for visual countdown */}
                      <div className="h-1 w-full bg-gray-200">
                        <div
                          className={`h-full ${resultMessage.isError ? 'bg-red-500' : 'bg-green-500'} animate-[shrink_3s_linear_forwards]`}
                        />
                      </div>
                    </DialogContent>
                  </Dialog>

                </div>
              </div>


              {/* <div className="grid grid-cols-1 md:grid-cols-4 gap-4"> */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Overall Stats (All Leads)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-gray-600">
                      Total Leads: <span className="font-bold">{allLeadsStats.total}</span><br />
                      New Leads: <span className="font-bold">{allLeadsStats.new}</span><br />
                      Assigned Leads: <span className="font-bold">{allLeadsStats.assigned}</span><br />
                      Conversion Rate: <span className="font-bold">
                        {allLeadsStats.total === 0 ? "0.0" : ((allLeadsStats.assigned / allLeadsStats.total) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </CardContent>
                </Card>
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
                    <CardTitle className="text-sm font-medium">Not Assigned (New Leads)</CardTitle>
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


              </div>

              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Leads Management</CardTitle>
                      {/* <CardDescription>View and manage all marketing leads</CardDescription> */}
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

                  {/* <div className="flex flex-col sm:flex-row gap-4 mb-6"> */}

                  {/* <div  className="w-full sm:w-auto">

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
                  </div> */}

                  <div className="flex flex-wrap gap-4 mb-6 items-start">
                    <div className="flex-1 min-w-[250px] relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <Input
                        placeholder="Search by name, phone, email, or city..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 w-full"
                      />
                    </div>

                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="min-w-[150px] w-full sm:w-auto">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="New">New</SelectItem>
                        <SelectItem value="Assigned">Assigned</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={sourceFilter} onValueChange={setSourceFilter}>
                      <SelectTrigger className="min-w-[150px] w-full sm:w-auto">
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

                    <div className="flex flex-col sm:flex-row gap-2">

    <DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="outline" className="min-w-[200px]">
      {startDate && endDate
        ? `📅 ${startDate} → ${endDate}`
        : "📅 Date Range"}
    </Button>
  </DropdownMenuTrigger>

  <DropdownMenuContent className="p-4 space-y-4 w-[250px] sm:w-[300px]">
    <div className="space-y-2">
      <Label className="text-sm text-gray-600">Start Date</Label>
      <Input
        type="date"
        value={startDate}
        onChange={(e) => {
          setStartDate(e.target.value);
          setCurrentPage(1);
        }}
      />
    </div>

    <div className="space-y-2">
      <Label className="text-sm text-gray-600">End Date</Label>
      <Input
        type="date"
        value={endDate}
        onChange={(e) => {
          setEndDate(e.target.value);
          setCurrentPage(1);
        }}
      />
    </div>

    <Button
      variant="ghost"
      className="text-red-500 text-sm p-0"
      onClick={() => {
        setStartDate("");
        setEndDate("");
        setCurrentPage(1);
      }}
    >
      ❌ Clear Filter
    </Button>
  </DropdownMenuContent>
</DropdownMenu>

</div>


                  </div>


                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={leadTab === "New" ? "default" : "outline"}
                      onClick={() => {
                        setLeadTab("New");
                        setCurrentPage(1);
                      }}
                    >
                      New Leads
                    </Button>
                    <Button
                      variant={leadTab === "Assigned" ? "default" : "outline"}
                      onClick={() => {
                        setLeadTab("Assigned");
                        setCurrentPage(1);
                      }}
                    >
                      Assigned Leads
                    </Button>

                    <div className="w-full sm:w-auto flex justify-end">
                      <Select onValueChange={(value) => setPageSize(Number(value))}>
                        <SelectTrigger className="w-[150px]">
                          <SelectValue placeholder={`${pageSize} per page`} />
                        </SelectTrigger>
                        <SelectContent>
                          {[15, 25, 50, 100].map((num) => (
                            <SelectItem key={num} value={num.toString()}>
                              {num} per page
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>


                  </div>
                  {/* <div className="rounded-md border max-h-[600px] overflow-y-auto">

                    <Table className="table-fixed w-full break-words text-center"> */}

                  <div className="w-full overflow-x-auto">

                    <Table className="min-w-[1000px] w-full break-words text-center">

                      <TableHeader >
                        <TableRow className="center">
                          <TableHead className="sticky top-0 bg-white z-10 w-12 text-center">
                            <Checkbox
                              checked={selectedLeads.length === filteredLeads.length && filteredLeads.length > 0}
                              onCheckedChange={handleSelectAll}
                            />
                          </TableHead>

                          <TableHead className="sticky top-0 bg-white z-10 w-16 max-w-[70px] whitespace-normal">s.no</TableHead>

                          <TableHead className="sticky top-0 bg-white z-10 text-center">ID</TableHead>
                          <TableHead className="sticky top-0 bg-white z-10 text-center">Name</TableHead>
                          <TableHead className="sticky top-0 bg-white z-10 text-center">Phone</TableHead>
                          <TableHead className="sticky top-0 bg-white z-10 text-center">Email</TableHead>
                          <TableHead className="sticky top-0 bg-white z-10 text-center">City</TableHead>
                          <TableHead className="sticky top-0 bg-white z-10 text-center">Source</TableHead>
                          <TableHead className="sticky top-0 bg-white z-10 text-center">Status</TableHead>
                          <TableHead className="sticky top-0 bg-white z-10 text-center">Created At</TableHead>
                          <TableHead className="sticky top-0 bg-white z-10 text-center">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredLeads.map((lead, index) => (
                          // <TableRow key={lead.id}>
                          <TableRow
                            key={lead.id}
                            className="hover:bg-gray-100" >


                            <TableCell>
                              <Checkbox
                                checked={selectedLeads.includes(lead.id)}
                                onCheckedChange={(checked) => handleSelectLead(lead.id, checked as boolean)}
                                disabled={lead.status === "Assigned"}
                              />
                            </TableCell>
                            <TableCell className="font-medium">{(currentPage - 1) * pageSize + index + 1}</TableCell>
                            <TableCell className="font-medium">{lead.business_id}</TableCell>

                            <TableCell
                              className="font-medium max-w-[150px] break-words whitespace-normal cursor-pointer text-blue-600 hover:underline"
                              onClick={() => window.open(`/leads/${lead.business_id}`, "_blank")}
                            >
                              {lead.name}
                            </TableCell>
                            {/* <TableCell className="font-medium max-w-[150px] break-words whitespace-normal">{lead.name}</TableCell> */}
                            <TableCell className="max-w-[100px] break-words whitespace-normal">{lead.phone}</TableCell>
                            <TableCell className="max-w-[120px] break-words whitespace-normal">{lead.email}</TableCell>
                            <TableCell className="max-w-[100px] break-words whitespace-normal">{lead.city}</TableCell>
                            <TableCell className="max-w-[70px] break-words whitespace-normal">
                              <Badge className={getSourceBadgeColor(lead.source)}>{lead.source}</Badge>
                            </TableCell>
                            <TableCell className="max-w-[80px] break-words whitespace-normal">
                              <Badge className={getStatusBadgeColor(lead.status)}>{lead.status}</Badge>
                            </TableCell>
                            <TableCell className="max-w-[100px] break-words whitespace-normal">{new Date(lead.created_at).toLocaleString('en-IN', {
                              timeZone: 'Asia/Kolkata',
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: true
                            })
                            }</TableCell>
                            <TableCell className="max-w-[100px] break-words whitespace-normal">
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
                    {/* // ✅ STEP 4: Add Pagination UI after your Table */}
                    <div className="flex justify-between items-center mt-4">
                      <Button
                        variant="outline"
                        onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                      >
                        ⬅ Previous
                      </Button>
                      <span className="text-gray-600">
                        Page {currentPage} of {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                      >
                        Next ➡
                      </Button>
                    </div>

                  </div>
                </CardContent>
              </Card>


              <Dialog open={bulkAssignDialogOpen} onOpenChange={setBulkAssignDialogOpen}>
                {/* <DialogContent> */}
                {/* <DialogContent className="max-w-md"> */}
                <DialogContent className="w-[95%] sm:max-w-md">


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
              {/* </div> */}
            </main>
          </DashboardLayout>
        </div>
      </ProtectedRoute>
    </>
  );
}
