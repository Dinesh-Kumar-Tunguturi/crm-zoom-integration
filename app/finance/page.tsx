
"use client";

import { useEffect, useState } from "react";
import { supabase } from '@/utils/supabase/client';
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { DollarSign, TrendingUp, TrendingDown, Pause } from "lucide-react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { startOfMonth, endOfMonth, isBefore, isAfter, parseISO } from "date-fns";
import { MessageSquare } from "lucide-react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";



// type FinanceStatus = "Paid" | "Unpaid" | "Paused";
type FinanceStatus = "Paid" | "Unpaid" | "Paused" | "Closed";

interface SalesClosure {
  id: string;
  lead_id: string;
  sale_value: number;
  subscription_cycle: number;
  payment_mode: string;
  closed_at: string;
  email: string;
  finance_status: FinanceStatus;
  leads?: { name: string };
  reason_for_close?: string;
}

export default function FinancePage() {
  const [sales, setSales] = useState<SalesClosure[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [followUpFilter, setFollowUpFilter] = useState<"All dates" | "Today">("All dates");
  const [showCloseDialog, setShowCloseDialog] = useState(false);
const [closingNote, setClosingNote] = useState("");
const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null);
const [selectedFinanceStatus, setSelectedFinanceStatus] = useState<FinanceStatus | null>(null);
const [statusFilter, setStatusFilter] = useState<FinanceStatus | "All">("All");
const [showRevenueDialog, setShowRevenueDialog] = useState(false);
const monthlyRevenues: { month: string; amount: number }[] = [];





  useEffect(() => {
    fetchSalesData();
  }, []);

  async function fetchSalesData() {
    const { data: salesData, error: salesError } = await supabase
      .from("sales_closure")
      .select("*")
      .order("closed_at", { ascending: false });

    if (salesError) {
      console.error("Error fetching sales data:", salesError);
      return;
    }

    const leadIds = [...new Set(salesData.map((s) => s.lead_id))];

    const { data: leadsData, error: leadsError } = await supabase
      .from("leads")
      .select("business_id, name")
      .in("business_id", leadIds);

    if (leadsError) {
      console.error("Error fetching leads:", leadsError);
      return;
    }

    const leadMap = new Map(leadsData.map((l) => [l.business_id, l.name]));

    const salesWithName = salesData.map((s) => ({
      ...s,
      leads: { name: leadMap.get(s.lead_id) ?? "-" },
    }));

    setSales(salesWithName as SalesClosure[]);
  }

  const handleFinanceStatusUpdate = async (saleId: string, newStatus: FinanceStatus) => {
    const { error } = await supabase
      .from("sales_closure")
      .update({ finance_status: newStatus })
      .eq("id", saleId);

    if (error) {
      console.error("Error updating finance status:", error);
    } else {
      setSales(prev =>
        prev.map(sale => (sale.id === saleId ? { ...sale, finance_status: newStatus } : sale))
      );
    }
  };

  // const filteredSales = sales.filter((sale) => {
  //   const matchesSearch =
  //     sale.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
  //     sale.lead_id.toLowerCase().includes(searchTerm.toLowerCase());

  //   if (followUpFilter === "Today") {
  //     const createdAt = new Date(sale.closed_at);
  //     const now = new Date();
  //     const diffInDays = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
  //     return diffInDays >= 5 && matchesSearch;
  //   }

  //   return matchesSearch;
  // });

//   const filteredSales = sales.filter((sale) => {
//   const matchesSearch =
//     sale.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
//     sale.lead_id.toLowerCase().includes(searchTerm.toLowerCase());

//   if (followUpFilter === "Today") {
//     const closedDate = new Date(sale.closed_at);
//     closedDate.setHours(0, 0, 0, 0);

//     const today = new Date();
//     today.setHours(0, 0, 0, 0);

//     const targetDate = new Date(today);
//     targetDate.setDate(today.getDate() - 25); // 25 days ago

//     return closedDate <= targetDate && matchesSearch;
//   }

//   return matchesSearch;
// });


const filteredSales = sales.filter((sale) => {
  const matchesSearch =
    sale.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sale.lead_id.toLowerCase().includes(searchTerm.toLowerCase());

  const matchesStatus = statusFilter === "All" || sale.finance_status === statusFilter;

  if (followUpFilter === "Today") {
    const closedDate = new Date(sale.closed_at);
    closedDate.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() - 25); // 25 days ago

    return closedDate <= targetDate && matchesSearch && matchesStatus;
  }

  return matchesSearch && matchesStatus;
});


  function getRenewWithinBadge(createdAt: string): React.ReactNode {
    const closedDate = new Date(createdAt);
    const today = new Date();
    const diffInDays = Math.floor((today.getTime() - closedDate.getTime()) / (1000 * 60 * 60 * 24));
    const renewalWindow = 25;

    if (diffInDays < renewalWindow) {
      const daysLeft = renewalWindow - diffInDays;
      return (
        <Badge className="bg-green-100 text-green-800">
          Within {daysLeft} day{daysLeft === 1 ? "" : "s"}
        </Badge>
      );
    } else if (diffInDays === renewalWindow) {
      return (
        <Badge className="bg-yellow-100 text-gray-800">Today lastdate</Badge>
      );
    } else {
      const overdue = diffInDays - renewalWindow;
      return (
        <Badge className="bg-red-100 text-red-800">
          Overdue by {overdue} day{overdue === 1 ? "" : "s"}
        </Badge>
      );
    }
  }


  const totalRevenue = sales.reduce((sum, sale) => sum + sale.sale_value, 0);
  const paidRevenue = sales.filter(s => s.finance_status === "Paid").reduce((sum, s) => sum + s.sale_value, 0);
  const unpaidRevenue = sales.filter(s => s.finance_status === "Unpaid").reduce((sum, s) => sum + s.sale_value, 0);
  const pausedRevenue = sales.filter(s => s.finance_status === "Paused").reduce((sum, s) => sum + s.sale_value, 0);

  const paidCount = sales.filter(s => s.finance_status === "Paid").length;
  const unpaidCount = sales.filter(s => s.finance_status === "Unpaid").length;
  const pausedCount = sales.filter(s => s.finance_status === "Paused").length;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStageColor = (stage: FinanceStatus) => {
    switch (stage) {
      case "Paid":
        return "bg-green-100 text-green-800";
      case "Unpaid":
        return "bg-red-100 text-red-800";
      case "Paused":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

//   const revenueMap = new Map<string, number>();

// sales.forEach((sale) => {
//   const closedAt = parseISO(sale.closed_at);
//   const dailyRate = sale.sale_value / sale.subscription_cycle;

//   for (let i = 0; i < sale.subscription_cycle; i++) {
//     const day = new Date(closedAt);
//     day.setDate(closedAt.getDate() + i);
//     const key = day.toLocaleString("default", { month: "long", year: "numeric" });

//     revenueMap.set(key, (revenueMap.get(key) || 0) + dailyRate);
//   }
// });

// for (const [month, amount] of revenueMap.entries()) {
//   monthlyRevenues.push({ month, amount });
// }

// // Optional: Sort by month descending
// monthlyRevenues.sort((a, b) => new Date(b.month).getTime() - new Date(a.month).getTime());

// const totalMonthlyRevenue = monthlyRevenues.reduce((sum, r) => sum + r.amount, 0);


const getMonthlyRevenueStats = () => {
  const monthlyStatsMap = new Map<string, {
    month: string;
    revenue: number;
    closedAtRevenue: number;
    subscriptions: number;
  }>();

  sales.forEach((sale) => {
    const closedAt = new Date(sale.closed_at);
    const monthKey = closedAt.toLocaleString("default", { month: "long", year: "numeric" });

    // ---- 1. Revenue based on overlap ----
    const perDayRate = sale.sale_value / sale.subscription_cycle;
    const endDate = new Date(closedAt);
    endDate.setDate(endDate.getDate() + sale.subscription_cycle);

    const temp = new Date(closedAt);
    while (temp < endDate) {
      const tempMonthKey = temp.toLocaleString("default", { month: "long", year: "numeric" });

      if (!monthlyStatsMap.has(tempMonthKey)) {
        monthlyStatsMap.set(tempMonthKey, {
          month: tempMonthKey,
          revenue: 0,
          closedAtRevenue: 0,
          subscriptions: 0,
        });
      }

      const entry = monthlyStatsMap.get(tempMonthKey)!;
      entry.revenue += perDayRate;

      // Next day
      temp.setDate(temp.getDate() + 1);
    }

    // ---- 2. ClosedAt full sale_value ----
    if (!monthlyStatsMap.has(monthKey)) {
      monthlyStatsMap.set(monthKey, {
        month: monthKey,
        revenue: 0,
        closedAtRevenue: 0,
        subscriptions: 0,
      });
    }

    const entry = monthlyStatsMap.get(monthKey)!;
    entry.closedAtRevenue += sale.sale_value;
    entry.subscriptions += 1;
  });

  return Array.from(monthlyStatsMap.values()).sort((a, b) =>
    new Date(b.month).getTime() - new Date(a.month).getTime()
  );
};




  return (
    <ProtectedRoute allowedRoles={["Finance", "Super Admin"]}>
      <DashboardLayout>
        <div className="space-y-6">
          {/* <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Finance CRM</h1>
              <p className="text-gray-600 mt-2">Track revenue and manage payments</p>
            </div>
          </div> */}

          <div className="flex justify-between items-center">
  <div>
    <h1 className="text-3xl font-bold text-gray-900">Finance CRM</h1>
    <p className="text-gray-600 mt-2">Track revenue and manage payments</p>
  </div>
  <Button onClick={() => setShowRevenueDialog(true)}>Revenue</Button>
</div>


          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
                <p className="text-xs text-muted-foreground">{sales.length} total clients</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Paid</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{formatCurrency(paidRevenue)}</div>
                <p className="text-xs text-muted-foreground">{paidCount} clients</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Unpaid</CardTitle>
                <TrendingDown className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{formatCurrency(unpaidRevenue)}</div>
                <p className="text-xs text-muted-foreground">{unpaidCount} clients</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Paused</CardTitle>
                <Pause className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{formatCurrency(pausedRevenue)}</div>
                <p className="text-xs text-muted-foreground">{pausedCount} clients</p>
              </CardContent>
            </Card>
          </div>



          <div className="flex items-center justify-between mt-4">
            <Input
              placeholder="Search by email or lead_id"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
  <div className="flex space-x-4 justify-end">
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
    </SelectContent>
  </Select>
            <Select value={followUpFilter} onValueChange={(value) => setFollowUpFilter(value as "All dates" | "Today")}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Follow Up" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All dates">All dates</SelectItem>
                <SelectItem value="Today">Today</SelectItem>
              </SelectContent>
            </Select>
            </div>
          </div>

          <div className="rounded-md border mt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>S.No</TableHead>
                  <TableHead>Client Id</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Sale Value</TableHead>
                  <TableHead>Subscription Cycle</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead>Deadline</TableHead>
                  <TableHead>Actions</TableHead>
                  <TableHead>Reason for closed</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredSales.length > 0 ? (
                  filteredSales.map((sale, idx) => (
                    <TableRow key={sale.id}>
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell className="font-medium">{sale.lead_id}</TableCell>
                      <TableCell className="max-w-[150px] break-words whitespace-normal">{sale.leads?.name ?? "-"}</TableCell>
                      <TableCell className="max-w-[160px] break-words whitespace-normal">{sale.email}</TableCell>
                      <TableCell>{formatCurrency(sale.sale_value)}</TableCell>
                      <TableCell>{sale.subscription_cycle} days</TableCell>
                      <TableCell>Finance Team A</TableCell>
                      <TableCell>
                        <Badge className={getStageColor(sale.finance_status)}>
                          {sale.finance_status}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(sale.closed_at).toLocaleDateString("en-GB")}</TableCell>
                      <TableCell>{getRenewWithinBadge(sale.closed_at)}</TableCell>
                      <TableCell>
                        {/* <Select
                          value={sale.finance_status}
                          onValueChange={(value: FinanceStatus) =>
                            handleFinanceStatusUpdate(sale.id, value)
                          }
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue placeholder="Select Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Paid">Paid</SelectItem>
                            <SelectItem value="Unpaid">Unpaid</SelectItem>
                            <SelectItem value="Paused">Paused</SelectItem>
                          </SelectContent>
                        </Select> */}

                        {(() => {
  const closedDate = new Date(sale.closed_at);
  const today = new Date();
  closedDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  const diffInDays = Math.floor((today.getTime() - closedDate.getTime()) / (1000 * 60 * 60 * 24));
  const isOlderThan25Days = diffInDays >= 25;

  const handleStatusChange = (value: FinanceStatus | "Closed") => {
    if (value === "Closed") {
      setSelectedSaleId(sale.id);
      setShowCloseDialog(true);
      setSelectedFinanceStatus(null); // Don't update dropdown yet
    } else {
      handleFinanceStatusUpdate(sale.id, value);
    }
  };

  return (
    // <Select
    //   value={sale.finance_status}
    //   onValueChange={(value: FinanceStatus) =>
    //     handleFinanceStatusUpdate(sale.id, value)
    //   }
    //   disabled={followUpFilter === "All dates" && !isOlderThan25Days}
    // >

    <Select
  value={sale.finance_status}
  onValueChange={handleStatusChange}
  disabled={followUpFilter === "All dates" && !isOlderThan25Days}
>
      <SelectTrigger className="w-32">
        <SelectValue placeholder="Select Status" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="Paid">Paid</SelectItem>
        <SelectItem value="Unpaid">Unpaid</SelectItem>
        <SelectItem value="Paused">Paused</SelectItem>
        <SelectItem value="Closed">Closed</SelectItem>

      </SelectContent>
    </Select>
  );
})()}


                      </TableCell>
                      <TableCell className="text-center">
  {sale.finance_status === "Closed" && sale.reason_for_close ? (
    <Popover>
      <PopoverTrigger asChild>
        <button className="hover:text-blue-600">
          <MessageSquare className="w-5 h-5" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] bg-white shadow-lg border p-4 text-sm text-gray-700">Reason: '
         {sale.reason_for_close}'
      </PopoverContent>
    </Popover>
  ) : (
    <span className="text-gray-400 text-xs italic">—</span>
  )}
</TableCell>

                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      {followUpFilter === "Today" ? "No follow ups today" : "No information here"}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>

            </Table>
          </div>

          <Dialog open={showCloseDialog} onOpenChange={(val) => setShowCloseDialog(val)}>
  <DialogContent
    className="sm:max-w-md"
    onInteractOutside={(e) => e.preventDefault()} // Prevent closing by clicking outside
  >
    <DialogHeader>
      <DialogTitle>Reason for Closing</DialogTitle>
    </DialogHeader>
    <Textarea
      placeholder="Enter reason for closing this ticket..."
      value={closingNote}
      onChange={(e) => setClosingNote(e.target.value)}
      className="min-h-[100px]"
    />
    <div className="flex justify-end mt-4">
      <Button
  onClick={async () => {
    if (!selectedSaleId) return;

    const { error } = await supabase
      .from("sales_closure")
      .update({
        finance_status: "Closed", // or "Closed" if you add that to the enum/check
        reason_for_close: closingNote.trim(),
      })
      .eq("id", selectedSaleId);

    if (error) {
      console.error("Error saving close reason:", error);
      return;
    }

    // update local state too
    setSales((prev) =>
      prev.map((sale) =>
        sale.id === selectedSaleId
          ? { ...sale, finance_status: "Closed", reason_for_close: closingNote.trim() }
          : sale
      )
    );

    setShowCloseDialog(false);
    setClosingNote("");
    setSelectedSaleId(null);
  }}
>
  Submit
</Button>

    </div>
  </DialogContent>
</Dialog>
<Dialog open={showRevenueDialog} onOpenChange={setShowRevenueDialog}>
  <DialogContent className="max-w-2xl">
    <DialogHeader>
      <DialogTitle>📊 Monthly Revenue Breakdown</DialogTitle>
    </DialogHeader>

    <div className="flex justify-between font-semibold border-b pb-2">
      <span className="w-1/3">Month</span>
      <span className="w-1/3 text-center">In-month revenue</span>
      <span className="w-1/3 text-center">Subscription Revenue</span>
    </div>

    {getMonthlyRevenueStats().map(({ month, revenue, closedAtRevenue }) => (
      <div key={month} className="flex justify-between border-b py-1 text-sm">
        <span className="w-1/3">{month}</span>
        <span className="w-1/3 text-center">{formatCurrency(revenue)}</span>
        <span className="w-1/3 text-center">{formatCurrency(closedAtRevenue)}</span>
      </div>
    ))}

    <div className="flex justify-between font-bold border-t pt-2 mt-2">
      <span className="w-1/3">Total</span>
      <span className="w-1/3 text-center">
        {formatCurrency(
          getMonthlyRevenueStats().reduce((sum, m) => sum + m.revenue, 0)
        )}
      </span>
      <span className="w-1/3 text-center">
        {formatCurrency(
          getMonthlyRevenueStats().reduce((sum, m) => sum + m.closedAtRevenue, 0)
        )}
      </span>
    </div>
  </DialogContent>
</Dialog>


        </div>
      </DashboardLayout>
    </ProtectedRoute>

  );
}
