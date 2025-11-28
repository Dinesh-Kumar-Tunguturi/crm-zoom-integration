//app/finance/UnpaidApplications/page.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { MessageSquare } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import DateRangeFilter from "../../DateRangeFilter/page";

type FinanceStatus = "Paid" | "Unpaid" | "Paused" | "Closed" | "Got Placed";

interface SalesClosure {
  id: string;
  lead_id: string;
  lead_name: string;
  email: string;
  sale_value: number;
  subscription_cycle: number;
  payment_mode: string;
  closed_at: string;
  finance_status: FinanceStatus;
  reason_for_close?: string;
  application_sale_value: number;
  associates_tl_name?: string;
  leads?: { name: string; phone: string };
}

interface DateRange {
  from: string;
  to: string;
}

export default function UnpaidApplicationsDialog() {
  const [unpaidApplications, setUnpaidApplications] = useState<SalesClosure[]>([]);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number | "all">(30);
  const [dateRange, setDateRange] = useState<{ from: string; to: string }>({ from: "", to: "" });
  const [filteredData, setFilteredData] = useState<SalesClosure[]>([]);

  // Fetch unpaid applications (one row per lead_id)
  // useEffect(() => {
  //   async function fetchUnpaid() {
  //     try {
  //   const { data, error } = await supabase
  // .from("sales_closure")
  // .select("*")
  // .or("application_sale_value.is.null,application_sale_value.lt.1")
  // .order("closed_at", { ascending: false });




  //       if (error) throw error;

  //       // Deduplicate by lead_id: keep only the latest closed_at per lead
  //       const map = new Map<string, SalesClosure>();
  //       data?.forEach((row) => {
  //         const existing = map.get(row.lead_id);
  //         if (!existing || new Date(row.closed_at) > new Date(existing.closed_at)) {
  //           map.set(row.lead_id, row);
  //         }
  //       });

  //       const uniqueData = Array.from(map.values());
  //       setUnpaidApplications(uniqueData);
  //       setFilteredData(uniqueData);
  //     } catch (err) {
  //       console.error("Error fetching unpaid applications:", err);
  //       setUnpaidApplications([]);
  //       setFilteredData([]);
  //     }
  //   }

  //   fetchUnpaid();
  // }, []);

useEffect(() => {
  async function fetchUnpaid() {
    try {
      // 1️⃣ Fetch unpaid applications
      const { data: salesData, error: salesError } = await supabase
        .from("sales_closure")
        .select("*")
        .or("application_sale_value.is.null,application_sale_value.lt.1")
        .order("closed_at", { ascending: false });

      if (salesError) throw salesError;
      if (!salesData) throw new Error("No sales data found");

      // 2️⃣ Deduplicate by lead_id (keep latest closed_at)
      const map = new Map<string, SalesClosure>();
      salesData.forEach((row) => {
        const existing = map.get(row.lead_id);
        if (!existing || new Date(row.closed_at) > new Date(existing.closed_at)) {
          map.set(row.lead_id, row);
        }
      });
      const uniqueData = Array.from(map.values());

      // 3️⃣ Fetch leads info for all lead_ids
      const leadIds = uniqueData.map((row) => row.lead_id);
      const { data: leadsData, error: leadsError } = await supabase
        .from("leads")
        .select("business_id, name, phone")
        .in("business_id", leadIds);

      if (leadsError) {
        console.error("Error fetching leads:", leadsError);
      } else {
        // 4️⃣ Map business_id → { name, phone }
        const leadsMap = new Map(
          leadsData.map((l) => [l.business_id, { name: l.name, phone: l.phone }])
        );

        // 5️⃣ Assign leads info to each sales record
        uniqueData.forEach((row) => {
          const leadInfo = leadsMap.get(row.lead_id);
          row.leads = {
            name: leadInfo?.name || "-",    // fallback if name missing
            phone: leadInfo?.phone || "-",  // fallback if phone missing
          };
        });
      }

      // 6️⃣ Update state
      setUnpaidApplications(uniqueData);
      setFilteredData(uniqueData);
    } catch (err) {
      console.error("Error fetching unpaid applications:", err);
      setUnpaidApplications([]);
      setFilteredData([]);
    }
  }

  fetchUnpaid();
}, []);

// Whenever search or dateRange changes, filter the unpaidApplications
useEffect(() => {
  let data = unpaidApplications;

  // Apply search
  if (search) {
    const term = search.toLowerCase();
    data = data.filter(
      (d) =>
        d.lead_id.toLowerCase().includes(term) ||
        d.lead_name?.toLowerCase().includes(term) ||
        d.email.toLowerCase().includes(term) ||
        d.leads?.name?.toLowerCase().includes(term) ||
        d.leads?.phone?.toLowerCase().includes(term)
    );
  }

  // Apply date range
  if (dateRange.from && dateRange.to) {
    const fromTime = new Date(dateRange.from).getTime();
    const toTime = new Date(dateRange.to).getTime();
    data = data.filter((d) => {
      const closedTime = new Date(d.closed_at).getTime();
      return closedTime >= fromTime && closedTime <= toTime;
    });
  }

  setFilteredData(data);
  setCurrentPage(1); // reset to first page
}, [search, dateRange, unpaidApplications]);

  const fetchUnpaidApplications = async (search = "", dateRange?: { from: string; to: string }) => {
  try {
    let query = supabase
      .from("sales_closure")
      .select("*")
      .or("application_sale_value.is.null,application_sale_value.lt.1")
      .order("closed_at", { ascending: false });

    // Apply search filter dynamically
    if (search) {
      query = query.ilike("lead_id", `%${search}%`)
      .or(`lead_id.ilike.%${search}%,email.ilike.%${search}%,lead_name.ilike.%${search}%`);

      // e.g. query .or(`lead_id.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,lead_name.ilike.%${searchTerm}%`);
    }

    // Apply date range filter
    if (dateRange?.from && dateRange?.to) {
      query = query.gte("closed_at", dateRange.from).lte("closed_at", dateRange.to);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Deduplicate by lead_id to keep latest closed_at per lead
    const map = new Map<string, typeof data[0]>();
    data?.forEach((row) => {
      const existing = map.get(row.lead_id);
      if (!existing || new Date(row.closed_at) > new Date(existing.closed_at)) {
        map.set(row.lead_id, row);
      }
    });

    return Array.from(map.values());
  } catch (err) {
    console.error("Error fetching unpaid applications:", err);
    return [];
  }
};

  // Sorting
  const sortedData = [...filteredData].sort((a, b) => {
  if (!sortField) return 0;

  const aVal = a[sortField as keyof typeof a] ?? "";
  const bVal = b[sortField as keyof typeof b] ?? "";

  if (typeof aVal === "string" || typeof aVal === "number") {
    const aStr = String(aVal);
    const bStr = String(bVal);
    return sortOrder === "asc" ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
  }

  // If the value is an object (like leads), optionally sort by a subfield, e.g., name
  if (typeof aVal === "object" && aVal !== null && "name" in aVal) {
    const aStr = String((aVal as { name: string }).name);
    const bStr =
      typeof bVal === "object" && bVal !== null && "name" in bVal
        ? String((bVal as { name: string }).name)
        : "";
    return sortOrder === "asc" ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
  }

  return 0;
});


  // Pagination
  const paginatedData = sortedData.slice(
    (currentPage - 1) * (pageSize === "all" ? sortedData.length : pageSize),
    pageSize === "all" ? sortedData.length : currentPage * (pageSize as number)
  );

  const totalPages = pageSize === "all" ? 1 : Math.ceil(sortedData.length / (pageSize as number));

  // Date range filter
  const handleApplyDateFilter = () => {
    if (!dateRange.from || !dateRange.to) return;

    const fromTime = new Date(dateRange.from).getTime();
    const toTime = new Date(dateRange.to).getTime();

    const filtered = unpaidApplications.filter((sale) => {
      const saleTime = new Date(sale.closed_at).getTime();
      return saleTime >= fromTime && saleTime <= toTime;
    });

    setFilteredData(filtered);
    setCurrentPage(1);
  };

  const handleClearDateFilter = () => {
    setFilteredData(unpaidApplications);
    setDateRange({ from: "", to: "" });
    setCurrentPage(1);
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(amount);

  const getStageColor = (stage: string) => {
    switch (stage) {
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

  return (
    <DashboardLayout>
    
     <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Unpaid Applications</h1>
</div>
        <div className="flex justify-between py-2 items-center gap-2">
          <Input
  placeholder="Search by name, email, phone, lead ID..."
  value={searchInput}
  onChange={(e) => setSearchInput(e.target.value)}
  onKeyDown={(e) => {
    if (e.key === "Enter") {
      setSearch(searchInput); // triggers filtering
    }
  }}
  className="max-w-md"
/>
            <span className="text-gray-600 font-medium">
      Total: {filteredData.length} unpaid
    </span>

          <div className="flex items-center gap-2">
          <DateRangeFilter
  onApply={(range) => setDateRange(range)}
/>


            <Select value={String(pageSize)} onValueChange={(v) => setPageSize(v === "all" ? "all" : Number(v))}>
              <SelectTrigger className="w-[110px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[30, 50, 100, 200, 1000].map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size} per page
                  </SelectItem>
                ))}
                <SelectItem value="all">All</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>S.No</TableHead>
              <TableHead onClick={() => { setSortField("lead_id"); setSortOrder(sortOrder === "asc" ? "desc" : "asc"); }} className="cursor-pointer">
                Client ID
              </TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Application value</TableHead>
              <TableHead>Sale Value</TableHead>
              <TableHead>Subscription</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead>Closed At</TableHead>
              <TableHead>Actions</TableHead>
              <TableHead>Reason</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center py-6 text-gray-400">
                  🎉 No unpaid applications found
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((sale, i) => (
                <TableRow key={sale.id}>
                  <TableCell>{i + 1}</TableCell>
                  <TableCell>{sale.lead_id}</TableCell>
                  <TableCell className="text-blue-600 cursor-pointer hover:underline" onClick={() => window.open(`/leads/${sale.lead_id}`, "_blank")}>
                    {sale.leads?.name || sale.lead_name || "-"}
                  </TableCell>
                  <TableCell>{sale.email}</TableCell>
                  <TableCell>{sale.leads?.phone ?? "-"}</TableCell>
                  <TableCell>{formatCurrency(sale.application_sale_value)}</TableCell>
                  <TableCell>{formatCurrency(sale.sale_value)}</TableCell>
                  <TableCell>{sale.subscription_cycle} days</TableCell>
                  <TableCell>
                    <Badge className={getStageColor(sale.finance_status)}>{sale.finance_status}</Badge>
                  </TableCell>
                  <TableCell>{new Date(sale.closed_at).toLocaleDateString("en-GB")}</TableCell>
                  <TableCell>
                    <Select
                      onValueChange={(value) => {
                        const status = value as FinanceStatus;
                        if (status === "Paid") window.open(`/finance/renewal/${sale.lead_id}`, "_blank");
                        else console.log("Update status to:", status);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Paid">Paid</SelectItem>
                        <SelectItem value="Unpaid">Unpaid</SelectItem>
                        <SelectItem value="Paused">Paused</SelectItem>
                        <SelectItem value="Closed">Closed</SelectItem>
                        <SelectItem value="Got Placed">Got Placed</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    {sale.reason_for_close ? (
                      <Popover>
                        <PopoverTrigger>
                          <MessageSquare className="w-5 h-5 cursor-pointer text-gray-500" />
                        </PopoverTrigger>
                        <PopoverContent className="text-sm">{sale.reason_for_close}</PopoverContent>
                      </Popover>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination Controls */}
        <div className="flex justify-between items-center py-2">
          <Button
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
          >
            Prev
          </Button>
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <Button
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      </div>

    </DashboardLayout>
  );
}
