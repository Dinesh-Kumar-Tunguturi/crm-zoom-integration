"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare, RefreshCw } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import Papa from "papaparse";
import { format } from "date-fns"; // Importing format function from date-fns
import { Edit } from "lucide-react";



import { useAuth } from "@/components/providers/auth-provider";
import { useRouter } from "next/navigation";

type FinanceStatus = "Paid" | "Unpaid" | "Paused" | "Closed" | "Got Placed";

interface SalesClosure {
  id: string;
  lead_id: string;
  email: string;
  sale_value: number;
  subscription_cycle: number;
  closed_at: string;
  onboarded_date?: string;
  finance_status: FinanceStatus;
  reason_for_close?: string;
  leads?: {
    name: string;
    phone: string;
  };
    oldest_closed_at?: string; // ✅ Add this

}
export default function FinanceAssociatesPage() {
  const [loading, setLoading] = useState(true);
  const [sales, setSales] = useState<SalesClosure[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<FinanceStatus | "All">("All");
  const [actionSelections, setActionSelections] = useState<Record<string, string>>({});
  const [followUpFilter, setFollowUpFilter] = useState<"All" | "Today">("Today");
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null);
  const [closingNote, setClosingNote] = useState("");
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvRowCount, setCsvRowCount] = useState<number>(0);
  const [parsedCSVData, setParsedCSVData] = useState<any[]>([]);
  const [showCSVDialog, setShowCSVDialog] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ saleId: string; newStatus: FinanceStatus | null } | null>(null);
  const [showReasonDialog, setShowReasonDialog] = useState(false);
  const [selectedReasonType, setSelectedReasonType] = useState<FinanceStatus | null>(null);
  const [reasonNote, setReasonNote] = useState("");

  
const [showOnboardDialog, setShowOnboardDialog] = useState(false);
// const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null);
const [selectedOnboardDate, setSelectedOnboardDate] = useState<Date | null>(null);
const [updatedSaleId, setUpdatedSaleId] = useState<string | null>(null); // Track updated sale ID


  const [showAssignDialog, setShowAssignDialog] = useState(false);
const [unassignedRecords, setUnassignedRecords] = useState<any[]>([]);
const [financeAssociates, setFinanceAssociates] = useState<any[]>([]);
const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

const [matchIndex, setMatchIndex] = useState(0);
const [matches, setMatches] = useState<Element[]>([]);


  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
const [paymentAmount, setPaymentAmount] = useState("");
const [onboardDate, setOnboardDate] = useState<Date | null>(null);
const [subscriptionMonths, setSubscriptionMonths] = useState("1");

const [showRemoveDialog, setShowRemoveDialog] = useState(false);
const [leadIdToRemove, setLeadIdToRemove] = useState<string | null>(null);


  const { user, hasAccess } = useAuth();
  const router = useRouter();

  
// const fetchSales = async () => {
//   if (!user) return;

//   // 1. Fetch TL's profile (name & email are already in `user`)
//   const { name, email } = user;

//   const { data: salesData, error: salesError } = await supabase
//     .from("sales_closure")
//     .select("*")
//     .eq("associates_tl_email", email)
//     .eq("associates_tl_name", name)
//     .not("onboarded_date", "is", null);

//   if (salesError) {
//     console.error("Failed to fetch sales data:", salesError);
//     return;
//   }

//   // 2. Get the latest record per lead_id
//   const latestSalesMap = new Map<string, SalesClosure>();
//   for (const record of salesData ?? []) {
//     const existing = latestSalesMap.get(record.lead_id);

//     const existingDate = existing?.onboarded_date || existing?.closed_at || "";
//     const currentDate = record?.onboarded_date || record?.closed_at || "";

//     if (!existing || new Date(currentDate) > new Date(existingDate)) {
//       latestSalesMap.set(record.lead_id, record);
//     }
//   }

//   const latestSales = Array.from(latestSalesMap.values());

//   // 3. Enrich with name & phone
//   const leadIds = latestSales.map((s) => s.lead_id);

//   const { data: leadsData, error: leadsError } = await supabase
//     .from("leads")
//     .select("business_id, name, phone")
//     .in("business_id", leadIds);

//   if (leadsError) {
//     console.error("Failed to fetch leads data:", leadsError);
//     return;
//   }

//   const leadMap = new Map(
//     leadsData?.map((l) => [l.business_id, { name: l.name, phone: l.phone }])
//   );

//   const enrichedSales = latestSales.map((sale) => ({
//     ...sale,
//     leads: leadMap.get(sale.lead_id) || { name: "-", phone: "-" },
//   }));

//   setSales(enrichedSales);
// };


const fetchSales = async () => {
  if (!user) return;

  let salesQuery = supabase
    .from("sales_closure")
    .select("*")
    .not("onboarded_date", "is", null);

  // Only apply TL filters if not Super Admin
  if (user.role !== "Super Admin" && user.role !== "Finance") {
    const { name, email } = user;
    salesQuery = salesQuery
      .eq("associates_tl_email", email)
      .eq("associates_tl_name", name);
  }

  const { data: salesData, error: salesError } = await salesQuery;

  if (salesError) {
    console.error("Failed to fetch sales data:", salesError);
    return;
  }

  // 2. Get the latest record per lead_id
  const latestSalesMap = new Map<string, SalesClosure>();
  for (const record of salesData ?? []) {
    const existing = latestSalesMap.get(record.lead_id);

    const existingDate = existing?.onboarded_date || existing?.closed_at || "";
    const currentDate = record?.onboarded_date || record?.closed_at || "";

    if (!existing || new Date(currentDate) > new Date(existingDate)) {
      latestSalesMap.set(record.lead_id, record);
    }
  }

  const latestSales = Array.from(latestSalesMap.values());

  // 🧠 Step: Build a map of oldest closed_at per lead_id
const oldestDatesMap = new Map<string, string>();
for (const record of salesData ?? []) {
  const prev = oldestDatesMap.get(record.lead_id);
  if (!prev || new Date(record.closed_at) < new Date(prev)) {
    oldestDatesMap.set(record.lead_id, record.closed_at);
  }
}


  // 3. Enrich with name & phone
  const leadIds = latestSales.map((s) => s.lead_id);

  const { data: leadsData, error: leadsError } = await supabase
    .from("leads")
    .select("business_id, name, phone")
    .in("business_id", leadIds);

  if (leadsError) {
    console.error("Failed to fetch leads data:", leadsError);
    return;
  }

  const leadMap = new Map(
    leadsData?.map((l) => [l.business_id, { name: l.name, phone: l.phone }])
  );

  // const enrichedSales = latestSales.map((sale) => ({
  //   ...sale,
  //   leads: leadMap.get(sale.lead_id) || { name: "-", phone: "-" },
  // }));

  const enrichedSales = latestSales.map((sale) => ({
  ...sale,
  leads: leadMap.get(sale.lead_id) || { name: "-", phone: "-" },
  oldest_closed_at: oldestDatesMap.get(sale.lead_id) || sale.closed_at,
}));


  setSales(enrichedSales);
};

// const fetchUnassignedSales = async () => {
//   const { data, error } = await supabase
//     .from("sales_closure")
//     .select("id, lead_id, email, lead_name, closed_at, onboarded_date, sale_value, associates_tl_email, associates_tl_name")
//     .or("associates_tl_email.is.null,associates_tl_email.eq.,associates_tl_name.is.null,associates_tl_name.eq.") // NULL or empty
//     .order("closed_at", { ascending: false });

//   if (error) {
//     console.error("Error fetching unassigned sales:", error);
//     return;
//   }

//   // Keep one record per lead_id (latest)
//   const uniqueMap = new Map<string, any>();
//   for (const record of data ?? []) {
//     if (!uniqueMap.has(record.lead_id)) uniqueMap.set(record.lead_id, record);
//   }

//   setUnassignedRecords(Array.from(uniqueMap.values()));
// };


const fetchUnassignedSales = async () => {
  const { data, error } = await supabase
    .from("sales_closure")
    .select("id, lead_id, email, lead_name, company_application_email, closed_at, onboarded_date, associates_tl_email, associates_tl_name")
    .or("associates_tl_email.is.null,associates_tl_email.eq.,associates_tl_name.is.null,associates_tl_name.eq.") // null or empty
    .order("closed_at", { ascending: false }); // 🟢 oldest first

    console.log(data);

  if (error) {
    console.error("Error fetching unassigned sales:", error);
    return;
  }

  // ✅ Keep the *oldest* record per lead_id
  const oldestMap = new Map<string, any>();
  for (const record of data ?? []) {
    if (!oldestMap.has(record.lead_id)) oldestMap.set(record.lead_id, record);
  }

  setUnassignedRecords(Array.from(oldestMap.values()));
};


const fetchFinanceAssociates = async () => {
  const { data, error } = await supabase
    .from("profiles")
    .select("full_name, user_email")
    .eq("roles", "Finance Associate");

  if (error) {
    console.error("Error fetching finance associates:", error);
    return;
  }

  setFinanceAssociates(data ?? []);
};

const assignAssociate = async (leadId: string, fullName: string, email: string) => {
  const { error } = await supabase
    .from("sales_closure")
    .update({
      associates_tl_name: fullName,
      associates_tl_email: email,
    })
    .eq("lead_id", leadId);

  if (error) {
    console.error("Error assigning associate:", error);
    alert("❌ Failed to assign associate.");
    return;
  }

  alert(`✅ Assigned ${fullName} to lead ${leadId}`);
  fetchUnassignedSales(); // refresh
};


  useEffect(() => {
    if (user === null) return;
    setLoading(false);
    if (!hasAccess("finance-associates")) {
      router.push("/unauthorized");
    }
  }, [user]);

  useEffect(() => {
  // Clear previous highlights
  const prev = document.querySelectorAll(".highlight-search");
  prev.forEach((el) => {
    el.classList.remove("highlight-search");
    // Remove custom background style if applied
    (el as HTMLElement).style.backgroundColor = "";
  });

  if (!searchTerm.trim()) {
    setMatches([]);
    setMatchIndex(0);
    return;
  }

  const term = searchTerm.toLowerCase();
  const body = document.body;
  const walker = document.createTreeWalker(body, NodeFilter.SHOW_TEXT);

  const found: Element[] = [];

  while (walker.nextNode()) {
    const node = walker.currentNode as Text;
    const parent = node.parentElement;
    if (!parent) continue;

    const text = node.textContent?.toLowerCase() || "";
    if (text.includes(term)) {
      found.push(parent);
      parent.classList.add("highlight-search");
      (parent as HTMLElement).style.backgroundColor = "yellow";
    }
  }

  setMatches(found);
  setMatchIndex(0);

  // Scroll to the first result if found
  if (found.length > 0) {
    found[0].scrollIntoView({ behavior: "smooth", block: "center" });
  }
}, [searchTerm]);


  useEffect(() => {
    if (user && hasAccess("finance-associates")) {
      fetchSales();
    }
  }, [user]);

  // ✅ After all hooks declared, do the early return
  if (loading) return <p className="p-6 text-gray-600">Loading...</p>;

  // ⬇️ Continue with the rest of your logic and JSX...





  const getStageColor = (status: FinanceStatus) => {
    switch (status) {
      case "Paid":
        return "bg-green-100 text-green-800";
      case "Unpaid":
        return "bg-red-100 text-red-800";
      case "Paused":
        return "bg-yellow-100 text-yellow-800";
      case "Got Placed":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const updateFinanceStatus = async (saleId: string, newStatus: FinanceStatus) => {
  const { error } = await supabase
    .from("sales_closure")
    .update({ finance_status: newStatus })
    .eq("id", saleId);

  if (error) {
    console.error("Error updating status:", error);
  } else {
    setSales((prev) =>
      prev.map((s) => (s.id === saleId ? { ...s, finance_status: newStatus } : s))
    );
  }
};


 const getRenewWithinBadge = (createdAt: string, subscriptionCycle: number): React.ReactNode => {
  if (!createdAt || !subscriptionCycle) return null;

  const startDate = new Date(createdAt);
  const today = new Date();

  // Strip time from both dates for clean date comparison
  startDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  const diffInDays = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

  if (diffInDays < subscriptionCycle) {
    const daysLeft = subscriptionCycle - diffInDays;
    return (
      <Badge className="bg-green-100 text-green-800">
        Within {daysLeft} day{daysLeft !== 1 ? "s" : ""}
      </Badge>
    );
  } else if (diffInDays === subscriptionCycle) {
    return <Badge className="bg-yellow-100 text-gray-800">Today last date</Badge>;
  } else {
    const overdue = diffInDays - subscriptionCycle;
    return (
      <Badge className="bg-red-100 text-red-800">
        Overdue by {overdue} day{overdue !== 1 ? "s" : ""}
      </Badge>
    );
  }
};
const removeAssociateFromLead = async (leadId: string) => {
  const { error } = await supabase
    .from("sales_closure")
    .update({
      associates_tl_email: null,
      associates_tl_name: null,
    })
    .eq("lead_id", leadId);

  if (error) {
    console.error("❌ Error removing associate:", error);
    alert("Failed to remove associate TL.");
    return false;
  }

  return true; // ✅ success indicator
};


const filteredSales = sales
  .filter((sale) => {
    const matchesSearch =
      sale.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.lead_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.leads?.phone?.toLowerCase().includes(searchTerm.toLowerCase());


    const matchesStatus =
      statusFilter === "All" || sale.finance_status === statusFilter;

    const onboardedDate = sale.onboarded_date ? new Date(sale.onboarded_date) : null;
    const today = new Date();
    const subscriptionCycle = sale.subscription_cycle || 0; // Default to 0 if not set
    const diffInDays = onboardedDate
      ? Math.floor((today.getTime() - onboardedDate.getTime()) / (1000 * 60 * 60 * 24))
      : null;

    const matchesFollowUp =
      followUpFilter === "All" || (diffInDays !== null && diffInDays >= subscriptionCycle);

    return matchesSearch && matchesStatus && matchesFollowUp;
  })
  .sort((a, b) => {
    const dateA = new Date(a.onboarded_date || a.closed_at || "");
    const dateB = new Date(b.onboarded_date || b.closed_at || "");
    return  dateB.getTime()-dateA.getTime(); // 🟢 descending
  });

  const handleCSVUpload = (file: File) => {
  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    complete: async function (results) {
      const rows = results.data as {
        lead_id: string;
        associates_email: string;
        associates_name: string;
        associates_tl_email: string;
        associates_tl_name: string;
      }[];

      for (const row of rows) {
        const { error } = await supabase
          .from("sales_closure")
          .update({
            associates_email: row.associates_email?.trim(),
            associates_name: row.associates_name?.trim(),
            associates_tl_email: row.associates_tl_email?.trim(),
            associates_tl_name: row.associates_tl_name?.trim(),
          })
          .eq("lead_id", row.lead_id?.trim());

        if (error) {
          console.error(`Failed to update lead_id: ${row.lead_id}`, error);
        }
      }

      alert("✅ CSV processed and updates sent to Supabase.");
      fetchSales(); // Refresh table
    },
    error: function (err) {
      console.error("Error parsing CSV:", err);
      alert("❌ Failed to parse CSV file.");
    },
  });
};

const handleRefresh = async () => {
  setLoading(true);

  try {
    // 🧠 Re-fetch all core data for this page
    await fetchSales();
    await fetchUnassignedSales();
    await fetchFinanceAssociates();
  } catch (err) {
    console.error("Error refreshing data:", err);
  } finally {
    setLoading(false);
  }
};


const handleParseCSV = (file: File) => {
  setCsvFile(file);

  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    complete: function (results) {
      const rows = results.data as {
        lead_id: string;
        associates_email: string;
        associates_name: string;
        associates_tl_email: string;
        associates_tl_name: string;
      }[];

      setParsedCSVData(rows);
      setCsvRowCount(rows.length);
    },
    error: function (err) {
      console.error("Error parsing CSV:", err);
      alert("❌ Failed to parse CSV file.");
    },
  });
};

const handleCSVSubmit = async () => {
  for (const row of parsedCSVData) {
    const { error } = await supabase
      .from("sales_closure")
      .update({
        associates_email: row.associates_email?.trim(),
        associates_name: row.associates_name?.trim(),
        associates_tl_email: row.associates_tl_email?.trim(),
        associates_tl_name: row.associates_tl_name?.trim(),
      })
      .eq("lead_id", row.lead_id?.trim());

    if (error) {
      console.error(`❌ Failed to update lead_id: ${row.lead_id}`, error);
    }
  }

  alert("✅ Data updated successfully.");
  fetchSales(); // Refresh UI
  setParsedCSVData([]);
  setCsvRowCount(0);
};


const handleOnboardClient = async (clientId: string) => {
  const confirmed = window.confirm("Are you sure you want to onboard this client?");
  if (!confirmed) return;

  const today = new Date().toISOString();

  const { error } = await supabase
    .from("sales_closure")
    .update({ onboarded_date: today })
    .eq("id", clientId);

  if (error) {
    console.error("Failed to onboard client:", error);
    alert("❌ Failed to onboard client. Try again.");
  } else {
    alert("✅ Client onboarded successfully.");
    // Refresh data or re-fetch the sales data
  }
};

// To open the dialog when the edit button is clicked
const openOnboardDialog = (saleId: string, currentOnboardDate: string | null) => {
  setSelectedSaleId(saleId);
  setSelectedOnboardDate(currentOnboardDate ? new Date(currentOnboardDate) : null);
  setShowOnboardDialog(true);
};

const handleUpdateOnboardDate = async () => {
  if (!selectedOnboardDate || !selectedSaleId) return;

  const { error } = await supabase
    .from("sales_closure")
    .update({ onboarded_date: selectedOnboardDate.toISOString() })
    .eq("id", selectedSaleId);

  if (error) {
    console.error("Error updating onboard date:", error);
    alert("❌ Failed to update onboard date.");
  } else {
    alert("✅ Onboard date updated successfully.");
    
    // Update the sales state to reflect the change
    setSales((prevSales) =>
      prevSales.map((sale) =>
        sale.id === selectedSaleId
          ? { ...sale, onboarded_date: selectedOnboardDate.toISOString() }
          : sale
      )
    );
    
        setUpdatedSaleId(selectedSaleId);

    // Close the dialog and reset selected date
    setShowOnboardDialog(false);
    setSelectedSaleId(null);
    setSelectedOnboardDate(null);
  }
};

  return (
    <ProtectedRoute allowedRoles={["Finance Associate", "Super Admin"]}>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Finance Associates Page</h1>
            <Button className=" bg-orange-500 text-gray-100 hover:bg-orange-600" onClick={() => {
  setShowAssignDialog(true);
  fetchUnassignedSales();
  fetchFinanceAssociates();
}}>
  Assign Associates
</Button>

          </div>

         <div className="flex items-center justify-between mt-4">
<div className="flex gap-2 items-center">
  <Input
    placeholder="Search by email or lead_id"
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
    className="max-w-lg"
  />
  <Button
    size="sm"
    disabled={matches.length === 0}
    onClick={() => {
      if (matches.length === 0) return;
      const next = (matchIndex + 1) % matches.length;
      setMatchIndex(next);
      matches[next].scrollIntoView({ behavior: "smooth", block: "center" });
    }}
  >
    Next Match ({matches.length})
  </Button>
    {/* 🔁 Refresh button */}
  <Button
  variant="outline"
  onClick={handleRefresh}
  disabled={loading}
  className="flex items-center gap-2 text-gray-700 border border-gray-300 hover:bg-gray-100"
>
  {loading ? (
    <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
  ) : (
    <RefreshCw className="h-4 w-4 text-blue-700" />
  )}
  <span className="text-blue-700 font-medium">
    {loading ? "Refreshing..." : "Refresh"}
  </span>
</Button>


  </div>

            <div className="flex space-x-4 justify-end">
            <Select value={followUpFilter} onValueChange={(value) => setFollowUpFilter(value as "Today" | "All")}>
  <SelectTrigger className="w-40">
    <SelectValue placeholder="Follow Up" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="All">All</SelectItem>
    <SelectItem value="Today">Today</SelectItem>
  </SelectContent>
</Select>

            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as FinanceStatus | "All")}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All</SelectItem>
                <SelectItem value="Paid">Paid</SelectItem>
                <SelectItem value="Unpaid">Unpaid</SelectItem>
                <SelectItem value="Paused">Paused</SelectItem>
                <SelectItem value="Closed">Closed</SelectItem>
                <SelectItem value="Got Placed">Got Placed</SelectItem>

              </SelectContent>
            </Select>
            <Button onClick={() => setShowCSVDialog(true)}>Upload CSV</Button>
          </div>
          

<Dialog open={showCSVDialog} onOpenChange={setShowCSVDialog}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Upload CSV File</DialogTitle>
    </DialogHeader>

    <input
      type="file"
      accept=".csv"
      onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) handleParseCSV(file);
      }}
    />

    {csvRowCount > 0 && (
      <p className="text-sm mt-2">✅ {csvRowCount} rows found in the file.</p>
    )}

    <div className="flex justify-end gap-3 mt-4">
      <Button variant="outline" onClick={() => setShowCSVDialog(false)}>Cancel</Button>
      <Button
        onClick={async () => {
          await handleCSVSubmit(); // ⬅ actual upload
          setShowCSVDialog(false);
        }}
        disabled={parsedCSVData.length === 0}
      >
        Submit
      </Button>
    </div>
  </DialogContent>
</Dialog>

</div>
          <div className="rounded-md border mt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>S.No</TableHead>
                  <TableHead>Client ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  {/* <TableHead>Sale Value</TableHead> */}
                  <TableHead>Subscription</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sale Date</TableHead>
                  <TableHead>Onboarded / last payment at</TableHead>
                  <TableHead>Deadline</TableHead>
                  <TableHead>Renewal date</TableHead>
                  <TableHead>Actions</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Remove</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSales.map((sale, idx) => (
<TableRow
  key={sale.id}
  className={sale.id === updatedSaleId ? "bg-green-100" : ""} // Apply green background to the updated row
>
                     <TableCell>{idx + 1}</TableCell>
                    <TableCell>{sale.lead_id}</TableCell>
                    <TableCell  className="font-medium  break-words whitespace-normal cursor-pointer text-blue-600 hover:underline"
                            onClick={() => window.open(`/leads/${sale.lead_id}`, "_blank")}
                    >{sale.leads?.name || "-"}</TableCell>
                    <TableCell>{sale.email}</TableCell>
                    <TableCell>{sale.leads?.phone || "-"}</TableCell>
                    {/* <TableCell>${sale.sale_value}</TableCell> */}
                    <TableCell>{sale.subscription_cycle} days</TableCell>
                    <TableCell>
                      <Badge className={getStageColor(sale.finance_status)}>{sale.finance_status}</Badge>
                    </TableCell>
                    {/* <TableCell>{new Date(sale.closed_at).toLocaleDateString("en-GB")}</TableCell> */}
                    <TableCell>
  {sale.oldest_closed_at
    ? new Date(sale.oldest_closed_at).toLocaleDateString("en-GB")
    : "-"}
</TableCell>

                    {/* <TableCell>{sale.onboarded_date ? new Date(sale.onboarded_date).toLocaleDateString("en-GB") : "-"}</TableCell> */}
                   
            <TableCell>
  {sale.onboarded_date ? new Date(sale.onboarded_date).toLocaleDateString("en-GB") : "-"}
  <Button
    onClick={() => openOnboardDialog(sale.id, sale.onboarded_date || null)}
    className="ml-2 text-gray-500 bg-inherit hover:text-blue-600 hover:bg-inherit"
        title="Edit onboarded date"  >
           <Edit className="w-4 h-4" />
   
  </Button>
</TableCell>


                    <TableCell>
  {getRenewWithinBadge(sale.onboarded_date || "", sale.subscription_cycle)}
</TableCell>
<TableCell>
  {(() => {
    const onboarded = sale.onboarded_date ? new Date(sale.onboarded_date) : null;
    const cycle = sale.subscription_cycle || 0;

    if (!onboarded || isNaN(cycle)) return "-";

    const renewalDate = new Date(onboarded);
    renewalDate.setDate(renewalDate.getDate() + cycle);
    return renewalDate.toLocaleDateString("en-GB");
  })()}
</TableCell>


                    <TableCell>
  {(() => {
    const onboarded = sale.onboarded_date ? new Date(sale.onboarded_date) : null;
    const today = new Date();
    let isOlderThan25 = false;

    if (onboarded) {
      const diffDays = Math.floor((today.getTime() - onboarded.getTime()) / (1000 * 60 * 60 * 24));
      isOlderThan25 = diffDays < 25;
    }

    const disableDropdown = isOlderThan25;


    return (
<Select
  value={actionSelections[sale.id] || ""}
//   onValueChange={(value) => {
//   setActionSelections((prev) => ({
//     ...prev,
//     [sale.id]: value,
//   }));

//   if (value === "Closed") {
//     setSelectedSaleId(sale.id);
//     setShowCloseDialog(true);
//   } else if (value === "Paused") {
//     setPendingAction({ saleId: sale.id, newStatus: value as FinanceStatus });
//     setShowConfirmDialog(true);
//   } else {
//     updateFinanceStatus(sale.id, value as FinanceStatus);
//   }
// }}

onValueChange={(value) => {
  setActionSelections((prev) => ({
    ...prev,
    [sale.id]: value,
  }));

  if (value === "Paid") {
    const confirmed = window.confirm("Are you sure you want to update status as PAID ?");
if (!confirmed) return;

  setSelectedSaleId(sale.id);
  setShowPaymentDialog(true);
  return;
}
  else if (value === "Closed") {
    const confirmed = window.confirm("Are you sure you want to update status as CLOSED ?");
if (!confirmed) return;

    setSelectedSaleId(sale.id);
    setSelectedReasonType("Closed");
    setShowReasonDialog(true);
  } else if (value === "Paused") {
    const confirmed = window.confirm("Are you sure you want to update status as PAUSED ?");
if (!confirmed) return;

    
    setSelectedSaleId(sale.id);
    setSelectedReasonType("Paused");
    setShowReasonDialog(true);
    
  } else if (value === "Unpaid") {
    const confirmed = window.confirm("Are you sure you want to update status as UNPAID ?");
if (!confirmed) return;

    setSelectedSaleId(sale.id);
    setSelectedReasonType("Unpaid");
    setShowReasonDialog(true);
  } else if (value === "Got Placed") {
    const confirmed = window.confirm("Are you sure you want to update status as GOT PLACED ?");
if (!confirmed) return;

    setSelectedSaleId(sale.id);
    setSelectedReasonType("Got Placed");
    setShowReasonDialog(true);
  } else {
    updateFinanceStatus(sale.id, value as FinanceStatus);
  }
}}


  disabled={disableDropdown}
>
  <SelectTrigger className="w-36">
    <SelectValue placeholder={disableDropdown ? "Not allowed" : "Select Status"} />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="Paid">Paid</SelectItem>
    <SelectItem value="Unpaid">Unpaid</SelectItem>
    <SelectItem value="Paused">Paused</SelectItem>
    <SelectItem value="Closed">Closed</SelectItem>
    <SelectItem value="Got Placed">Got Placed</SelectItem>

  </SelectContent>
</Select>

    );
  })()}
</TableCell>


                    {/* <TableCell>
                      {sale.finance_status === "Closed" && sale.reason_for_close ? (
                        <Popover>
                          <PopoverTrigger asChild>
                            <button className="hover:text-blue-600">
                              <MessageSquare className="w-5 h-5" />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[300px] bg-white shadow-lg border p-4 text-sm text-gray-700">
                            Reason: '{sale.reason_for_close}'
                          </PopoverContent>
                        </Popover>
                      ) : (
                        <span className="text-gray-400 text-xs italic">—</span>
                      )}
                    </TableCell> */}


<TableCell>
  {sale.reason_for_close ? (
    <Popover>
      <PopoverTrigger asChild>
        <button className="hover:text-blue-600">
          <MessageSquare className="w-5 h-5" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] bg-white shadow-lg border p-4 text-sm text-gray-700">
        Reason: '{sale.reason_for_close}'
      </PopoverContent>
    </Popover>
  ) : (
    <span className="text-gray-400 text-xs italic">—</span>
  )}
</TableCell>
<TableCell className="p-2 text-center">
  <Button
    size="sm"
    onClick={() => {
      setLeadIdToRemove(sale.lead_id);
      setShowRemoveDialog(true);
    }}
    className={`${
      leadIdToRemove === sale.lead_id
        ? "bg-green-600 hover:bg-green-700 text-white"
        : "bg-blue-600 hover:bg-red-500 text-white"
    }`}
  >
    {leadIdToRemove === sale.lead_id ? "Removing..." : "!"}
  </Button>
</TableCell>



                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
                {/* <Dialog open={showCloseDialog} onOpenChange={setShowCloseDialog}>
  <DialogContent className="sm:max-w-md">
    <DialogHeader>
      <DialogTitle>Reason for Closing</DialogTitle>
    </DialogHeader>

    <Textarea
      placeholder="Enter reason for closing this record..."
      value={closingNote}
      onChange={(e) => setClosingNote(e.target.value)}
      className="min-h-[100px]"
    />

    <div className="flex justify-end mt-4">
      <Button
        onClick={async () => {
          if (!selectedSaleId || closingNote.trim() === "") {
            alert("Please enter a reason.");
            return;
          }

          const { error } = await supabase
            .from("sales_closure")
            .update({
              finance_status: "Closed",
              reason_for_close: closingNote.trim(),
            })
            .eq("id", selectedSaleId);

          if (error) {
            console.error("Error saving close reason:", error);
            alert("❌ Failed to close record.");
            return;
          }

          setSales((prev) =>
            prev.map((sale) =>
              sale.id === selectedSaleId
                ? {
                    ...sale,
                    finance_status: "Closed",
                    reason_for_close: closingNote.trim(),
                  }
                : sale
            )
          );

          setShowCloseDialog(false);
          setSelectedSaleId(null);
          setClosingNote("");
        }}
      >
        Submit
      </Button>
    </div>
  </DialogContent>
</Dialog> */}

{/* 
<Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
  <DialogContent className="max-w-3xl">
    <DialogHeader>
      <DialogTitle>Assign Finance Associates</DialogTitle>
    </DialogHeader>

    {unassignedRecords.length === 0 ? (
      <p className="text-sm text-gray-600">✅ All leads are already assigned.</p>
    ) : (
      <div className="space-y-4 max-h-[60vh] overflow-y-auto">
        {unassignedRecords.map((rec, idx) => (
          <div key={rec.id} className="flex items-center justify-between border-b pb-2">
            <div>
              <p className="font-semibold text-gray-800">{rec.lead_id}</p>
              <p className="text-sm text-gray-500">{rec.email}</p>
              <p className="text-sm text-gray-500">{rec.lead_name}</p>
            </div>

            <Button
              size="sm"
              onClick={() => setSelectedLeadId(rec.lead_id)}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              Assign
            </Button>
          </div>
        ))}
      </div>
    )}

    {selectedLeadId && (
      <div className="mt-6 border-t pt-4">
        <h3 className="font-semibold text-gray-800 mb-2">Select Finance Associate</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {financeAssociates.map((a) => (
            <Button
              key={a.user_email}
              variant="outline"
              className="justify-start text-left"
              onClick={() => assignAssociate(selectedLeadId, a.full_name, a.user_email)}
            >
              <div>
                <p className="font-medium">{a.full_name}</p>
                <p className="text-xs text-gray-500">{a.user_email}</p>
              </div>
            </Button>
          ))}
        </div>
      </div>
    )}
  </DialogContent>
</Dialog> */}
<Dialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
  <DialogContent className="sm:max-w-md">
    <DialogHeader>
      <DialogTitle>Confirmation</DialogTitle>
    </DialogHeader>

    <p className="text-gray-700 mt-2 text-sm">
      Really this client is not yours?
    </p>

    <div className="flex justify-end gap-3 mt-6">
      <Button
        variant="outline"
        onClick={() => {
          setShowRemoveDialog(false);
          setLeadIdToRemove(null);
        }}
      >
        No
      </Button>

      <Button
        className="bg-red-600 text-white hover:bg-red-700"
        onClick={async () => {
          if (!leadIdToRemove) return;

          const success = await removeAssociateFromLead(leadIdToRemove);
          if (success) {
            // ✅ Refresh the entire table after successful removal
            await fetchSales();
          }

          // Close dialog & reset states
          setShowRemoveDialog(false);
          setLeadIdToRemove(null);
        }}
      >
        Yes
      </Button>
    </div>
  </DialogContent>
</Dialog>


{/*  Dialog for selecting a new onboard date */}
<Dialog open={showOnboardDialog} onOpenChange={setShowOnboardDialog}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Update Onboarded Date</DialogTitle>
    </DialogHeader>

    <Input
      type="date"
      value={selectedOnboardDate ? format(selectedOnboardDate, "yyyy-MM-dd") : ""}
      onChange={(e) => setSelectedOnboardDate(new Date(e.target.value))}
      required
    />

    <div className="flex justify-end mt-4">
      <Button
        variant="outline"
        onClick={() => setShowOnboardDialog(false)}
      >
        Cancel
      </Button>
      <Button
        onClick={handleUpdateOnboardDate}
        disabled={!selectedOnboardDate}
      >
        Update
      </Button>
    </div>
  </DialogContent>
</Dialog>

<Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
  <DialogContent className="max-w-7xl">
    <DialogHeader>
      <DialogTitle>Assign Finance Associates</DialogTitle>
    </DialogHeader>

    {unassignedRecords.length === 0 ? (
      <p className="text-sm text-gray-600">✅ All leads are already assigned.</p>
    ) : (
      <div className="space-y-4 max-h-[70vh] overflow-y-auto">
        <table className="w-full text-sm border">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 text-left">S.No</th>
              <th className="p-2 text-left">Lead ID</th>
              <th className="p-2 text-left">Lead Name</th>
              <th className="p-2 text-left">Email</th>
              <th className="p-2 text-left">Company Email</th>
              <th className="p-2 text-left">Closed At</th>
              <th className="p-2 text-left">Onboarded Date</th>
              <th className="p-2 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {unassignedRecords.map((rec, idx) => (
              <tr key={rec.id} className="border-t hover:bg-gray-50">
                <td className="p-2">{idx + 1}</td>
                <td className="p-2 font-medium">{rec.lead_id}</td>
                <td className="p-2 font-medium  break-words whitespace-normal cursor-pointer text-blue-600 hover:underline"
                            onClick={() => window.open(`/leads/${rec.lead_id}`, "_blank")}>{rec.lead_name || "-"}</td>
                <td className="p-2 text-gray-600">{rec.email}</td>
                <td className="p-2 text-gray-600">{rec.company_application_email}</td>
                <td className="p-2">{rec.closed_at ? new Date(rec.closed_at).toLocaleDateString("en-GB") : "-"}</td>
                <td className="p-2">{rec.onboarded_date ? new Date(rec.onboarded_date).toLocaleDateString("en-GB") : "-"}</td>
                <td className="p-2 text-center">
                <Button
  size="sm"
  onClick={() => setSelectedLeadId(rec.lead_id)}
  className={`${
    selectedLeadId === rec.lead_id
      ? "bg-green-600 hover:bg-green-700"
      : "bg-blue-600 hover:bg-blue-700"
  } text-white`}
>
  {selectedLeadId === rec.lead_id ? "Choose TL" : "Assign"}
</Button>

                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}

    {selectedLeadId && (
      <div className="mt-6 border-t pt-4">
        <h3 className="font-semibold text-gray-800 mb-2">Select Finance Associate</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {financeAssociates.map((a) => (
            <Button
              key={a.user_email}
              variant="outline"
              className="justify-start text-left"
              onClick={() => assignAssociate(selectedLeadId, a.full_name, a.user_email)}
            >
              <div>
                <p className="font-medium">{a.full_name}</p>
                <p className="text-xs text-gray-500">{a.user_email}</p>
              </div>
            </Button>
          ))}
        </div>
      </div>
    )}
  </DialogContent>
</Dialog>


<Dialog open={showReasonDialog} onOpenChange={setShowReasonDialog}>
  <DialogContent hideCloseIcon className="sm:max-w-md">
    <DialogHeader>
      <DialogTitle>Reason for {selectedReasonType}</DialogTitle>
    </DialogHeader>

    <Textarea
      placeholder={`Enter reason for marking as ${selectedReasonType}...`}
      value={reasonNote}
      onChange={(e) => setReasonNote(e.target.value)}
      className="min-h-[100px]"
    />

    <div className="flex justify-end mt-4">
      <Button
        variant="outline"
        onClick={() => {
          setShowReasonDialog(false);
          setSelectedSaleId(null);
          setSelectedReasonType(null);
          setReasonNote("");
        }}
      >
        Cancel  
      </Button>
      <Button
        onClick={async () => {
          if (!selectedSaleId || reasonNote.trim() === "" || !selectedReasonType) {
            alert("Please enter a reason.");
            return;
          }

          const { error } = await supabase
            .from("sales_closure")
            .update({
              finance_status: selectedReasonType,
              reason_for_close: `${selectedReasonType}: ${reasonNote.trim()}`, // ✅ use only this column
            })
            .eq("id", selectedSaleId);

          if (error) {
            console.error("Error saving reason:", error);
            alert("❌ Failed to update record.");
            return;
          }

          setSales((prev) =>
            prev.map((sale) =>
              sale.id === selectedSaleId
                ? {
                    ...sale,
                    finance_status: selectedReasonType,
                    reason_for_close: `${selectedReasonType}: ${reasonNote.trim()}`,
                  }
                : sale
            )
          );

          setShowReasonDialog(false);
          setSelectedSaleId(null);
          setSelectedReasonType(null);
          setReasonNote("");
        }}
      >
        Submit
      </Button>
    </div>
  </DialogContent>
</Dialog>


<Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
  <DialogContent className="sm:max-w-md">
    <DialogHeader>
      <DialogTitle>Confirm Status Change</DialogTitle>
    </DialogHeader>

    <p className="text-sm text-gray-700 mt-2">
      Are you sure you want to mark this record as{" "}
      <strong>{pendingAction?.newStatus}</strong>?
    </p>

    <div className="flex justify-end gap-2 mt-6">
      <Button
        variant="outline"
        onClick={() => {
          setShowConfirmDialog(false);
          setPendingAction(null);
        }}
      >
        Cancel
      </Button>
      <Button
        onClick={async () => {
          if (!pendingAction) return;

          await updateFinanceStatus(pendingAction.saleId, pendingAction.newStatus as FinanceStatus);

          setShowConfirmDialog(false);
          setPendingAction(null);
        }}
      >
        Yes, Proceed
      </Button>
    </div>
  </DialogContent>
</Dialog>

<Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
  <DialogContent className="w-[420px]">
    <DialogHeader>
      <DialogTitle>💰 Payment Details</DialogTitle>
    </DialogHeader>

    <p className="text-sm text-muted-foreground mb-2">
      Fill the payment info, onboard date, and subscription details to record this payment.
    </p>

    <div className="space-y-4">
      {/* Payment Amount */}
      <Input
        type="number"
        placeholder="Payment amount ($)"
        value={paymentAmount}
        onChange={(e) => setPaymentAmount(e.target.value)}
        required
      />

      {/* Onboarded Date */}
      <Input
        type="date"
        placeholder="Onboarded date"
        value={onboardDate ? onboardDate.toISOString().slice(0, 10) : ""}
        onChange={(e) => setOnboardDate(new Date(e.target.value))}
        required
      />

      {/* Subscription Duration */}
      <Select value={subscriptionMonths} onValueChange={setSubscriptionMonths}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Subscription duration" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="1">1 month</SelectItem>
          <SelectItem value="2">2 months</SelectItem>
          <SelectItem value="3">3 months</SelectItem>
        </SelectContent>
      </Select>

<div className="flex justify-between gap-3 pt-4">
  <Button
    variant="outline"
    className="w-full bg-black text-white hover:bg-gray-800"
    onClick={() => {
      setShowPaymentDialog(false);
      setPaymentAmount("");
      setOnboardDate(null);
      setSubscriptionMonths("1");

      // 🧠 Revert dropdown to default
      if (selectedSaleId) {
        setActionSelections((prev) => ({
          ...prev,
          [selectedSaleId]: "",
        }));
      }

      setSelectedSaleId(null);
    }}
  >
    Cancel
  </Button>

      <Button
        className="w-full"
        onClick={async () => {
          if (!selectedSaleId || !paymentAmount || !onboardDate || !subscriptionMonths) {
            alert("Please fill all fields");
            return;
          }

          const { error } = await supabase
            .from("sales_closure")
            .update({
              finance_status: "Paid",
              sale_value: parseFloat(paymentAmount),
              onboarded_date: onboardDate.toISOString(),
              subscription_cycle: Number(subscriptionMonths) * 30,
            })
            .eq("id", selectedSaleId);

          if (error) {
            console.error("Error updating payment:", error);
            alert("❌ Failed to record payment");
            return;
          }

          // Refresh state
          setSales((prev) =>
            prev.map((s) =>
              s.id === selectedSaleId
                ? {
                    ...s,
                    finance_status: "Paid",
                    sale_value: parseFloat(paymentAmount),
                    onboarded_date: onboardDate.toISOString(),
                    subscription_cycle: Number(subscriptionMonths) * 30,
                  }
                : s
            )
          );

          // Reset dialog
          setShowPaymentDialog(false);
          setPaymentAmount("");
          setOnboardDate(null);
          setSubscriptionMonths("1");
          setSelectedSaleId(null);
        }}
      >
        Payment Close
      </Button>
      </div>
    </div>
  </DialogContent>
</Dialog>



        </div>
  

      </DashboardLayout>
    </ProtectedRoute>
  );
}
function toast(arg0: { title: string; description: string; }) {
  throw new Error("Function not implemented.");
}