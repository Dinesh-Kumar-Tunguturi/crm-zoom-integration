"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import Papa from "papaparse";


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

  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
const [paymentAmount, setPaymentAmount] = useState("");
const [onboardDate, setOnboardDate] = useState<Date | null>(null);
const [subscriptionMonths, setSubscriptionMonths] = useState("1");

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

  const enrichedSales = latestSales.map((sale) => ({
    ...sale,
    leads: leadMap.get(sale.lead_id) || { name: "-", phone: "-" },
  }));

  setSales(enrichedSales);
};


  useEffect(() => {
    if (user === null) return;
    setLoading(false);
    if (!hasAccess("finance-associates")) {
      router.push("/unauthorized");
    }
  }, [user]);

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


  const getRenewWithinBadge = (date: string): React.ReactNode => {
    const closedDate = new Date(date);
    const today = new Date();
    const diffInDays = Math.floor((today.getTime() - closedDate.getTime()) / (1000 * 60 * 60 * 24));
    const renewalWindow = 25;

    if (diffInDays < renewalWindow) {
      const daysLeft = renewalWindow - diffInDays;
      return (
        <Badge className="bg-green-100 text-green-800">
          Within {daysLeft} day{daysLeft !== 1 ? "s" : ""}
        </Badge>
      );
    } else if (diffInDays === renewalWindow) {
      return <Badge className="bg-yellow-100 text-gray-800">Today last date</Badge>;
    } else {
      const overdue = diffInDays - renewalWindow;
      return (
        <Badge className="bg-red-100 text-red-800">
          Overdue by {overdue} day{overdue !== 1 ? "s" : ""}
        </Badge>
      );
    }
  };

const filteredSales = sales
  .filter((sale) => {
    const matchesSearch =
      sale.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.lead_id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "All" || sale.finance_status === statusFilter;

    const onboardedDate = sale.onboarded_date ? new Date(sale.onboarded_date) : null;
    const today = new Date();
    const diffInDays = onboardedDate
      ? Math.floor((today.getTime() - onboardedDate.getTime()) / (1000 * 60 * 60 * 24))
      : null;

    const matchesFollowUp =
      followUpFilter === "All" || (diffInDays !== null && diffInDays >= 25);

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

  return (
    <ProtectedRoute allowedRoles={["Finance Associate", "Super Admin"]}>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Finance Associates Page</h1>
          </div>

          <div className="flex items-center justify-between mt-4">
            <Input
              placeholder="Search by email or lead_id"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
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
                  <TableHead>Onboarded Date</TableHead>
                  <TableHead>Deadline</TableHead>
                  <TableHead>Actions</TableHead>

                  <TableHead>Reason</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSales.map((sale, idx) => (
                  <TableRow key={sale.id}>
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell>{sale.lead_id}</TableCell>
                    <TableCell>{sale.leads?.name || "-"}</TableCell>
                    <TableCell>{sale.email}</TableCell>
                    <TableCell>{sale.leads?.phone || "-"}</TableCell>
                    {/* <TableCell>${sale.sale_value}</TableCell> */}
                    <TableCell>{sale.subscription_cycle} days</TableCell>
                    <TableCell>
                      <Badge className={getStageColor(sale.finance_status)}>{sale.finance_status}</Badge>
                    </TableCell>
                    <TableCell>{new Date(sale.closed_at).toLocaleDateString("en-GB")}</TableCell>
                    <TableCell>{sale.onboarded_date ? new Date(sale.onboarded_date).toLocaleDateString("en-GB") : "-"}</TableCell>
                    <TableCell>{getRenewWithinBadge(sale.onboarded_date || "")}</TableCell>
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


<Dialog open={showReasonDialog} onOpenChange={setShowReasonDialog}>
  <DialogContent className="sm:max-w-md">
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
  </DialogContent>
</Dialog>



        </div>
  

      </DashboardLayout>
    </ProtectedRoute>
  );
}
