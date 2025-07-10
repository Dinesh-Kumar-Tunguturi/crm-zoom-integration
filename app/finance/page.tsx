
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

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

import { MessageSquare } from "lucide-react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";

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

function generateMonthlyRevenue(sales: SalesClosure[], year: number) {
  const monthlyMap = new Map<
    string,
    {
      month: string;
      inMonthRevenue: number;
      proratedRevenue: number;
    }
  >();

  sales.forEach((sale) => {
    const closedAt = new Date(sale.closed_at);
    const saleMonthKey = closedAt.toLocaleString("default", {
      month: "long",
      year: "numeric",
    });

    const perDayRate = sale.sale_value / sale.subscription_cycle;
    const endDate = new Date(closedAt);
    endDate.setDate(endDate.getDate() + sale.subscription_cycle);

    const temp = new Date(closedAt);
    while (temp < endDate) {
      const tempYear = temp.getFullYear();
      const tempMonth = temp.getMonth(); 
      if (tempYear === year) {
        const tempKey =
          temp.toLocaleString("default", { month: "long" }) + " " + year;

        if (!monthlyMap.has(tempKey)) {
          monthlyMap.set(tempKey, {
            month: tempKey,
            inMonthRevenue: 0,
            proratedRevenue: 0,
          });
        }

        monthlyMap.get(tempKey)!.proratedRevenue += perDayRate;
      }

      temp.setDate(temp.getDate() + 1);
    }

    const closedAtYear = closedAt.getFullYear();
    const closedAtMonth = closedAt.getMonth();
    if (closedAtYear === year) {
      const monthKey =
        closedAt.toLocaleString("default", { month: "long" }) + " " + year;

      if (!monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, {
          month: monthKey,
          inMonthRevenue: 0,
          proratedRevenue: 0,
        });
      }

      monthlyMap.get(monthKey)!.inMonthRevenue += sale.sale_value;
    }
  });

  const result: {
    month: string;
    inMonthRevenue: number;
    proratedRevenue: number;
  }[] = [];

  for (let m = 0; m < 12; m++) {
    const monthName = new Date(year, m).toLocaleString("default", {
      month: "long",
    });
    const key = `${monthName} ${year}`;
    const entry = monthlyMap.get(key) ?? {
      month: key,
      inMonthRevenue: 0,
      proratedRevenue: 0,
    };

    result.push({
      month: key,
      inMonthRevenue: Math.round(entry.inMonthRevenue),
      proratedRevenue: Math.round(entry.proratedRevenue),
    });
  }

  return result;
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
  const [activeTab, setActiveTab] = useState<"table" | "chart">("table");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [tableYearFilter, setTableYearFilter] = useState<number | "all">("all");

  const monthlyRevenues: { month: string; amount: number }[] = [];

  const [monthlyBreakdown, setMonthlyBreakdown] = useState<
    { month: string; inMonthRevenue: number; proratedRevenue: number }[]
  >([]);

  useEffect(() => {
    fetchSalesData();
  }, []);

  useEffect(() => {
    if (sales.length > 0) {
      const breakdown = generateMonthlyRevenue(sales, selectedYear);
      setMonthlyBreakdown(breakdown);
    }
  }, [sales, selectedYear]);

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

  const handleDownloadCSV = () => {
    const filteredData = monthlyBreakdown.filter((m) => m.proratedRevenue > 0);

    const headers = ["Month", "In-Month Revenue", "Subscription Revenue"];

    const rows = filteredData.map((m) => [
      m.month,
      `$${m.inMonthRevenue}`,
      `$${m.proratedRevenue}`,
    ]);

    const totalInMonth = filteredData.reduce((sum, m) => sum + m.inMonthRevenue, 0);
    const totalProrated = filteredData.reduce((sum, m) => sum + m.proratedRevenue, 0);

    rows.push([
      "Total",
      `$${totalInMonth}`,
      `$${totalProrated}`,
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((col) => `"${col}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "monthly_revenue_breakdown.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <ProtectedRoute allowedRoles={["Finance", "Super Admin"]}>
      <DashboardLayout>
        <div className="space-y-6">
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
                              setSelectedFinanceStatus(null);
                            } else {
                              handleFinanceStatusUpdate(sale.id, value);
                            }
                          };

                          return (
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
              onInteractOutside={(e) => e.preventDefault()}
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
                        finance_status: "Closed",
                        reason_for_close: closingNote.trim(),
                      })
                      .eq("id", selectedSaleId);

                    if (error) {
                      console.error("Error saving close reason:", error);
                      return;
                    }
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
            <DialogContent className="max-w-2xl sm:max-w-5xl">
              <DialogHeader>
                <DialogTitle>Monthly Revenue Breakdown</DialogTitle>
              </DialogHeader>

              <div className="flex space-x-4 mb-4">
                <Button
                  variant={activeTab === "table" ? "default" : "outline"}
                  onClick={() => setActiveTab("table")}
                >
                  Table View
                </Button>
                <Button
                  variant={activeTab === "chart" ? "default" : "outline"}
                  onClick={() => setActiveTab("chart")}
                >
                  Visual (Chart) View
                </Button>
              </div>

              {activeTab === "table" ? (
                <div>
                  <div className="mb-4 flex items-center gap-2">
                    <label className="text-sm font-medium">Select Year:</label>
                    <select
                      className="border rounded px-2 py-1 text-sm"
                      value={tableYearFilter}
                      onChange={(e) => {
                        const value = e.target.value;
                        setTableYearFilter(value === "all" ? "all" : parseInt(value));
                      }}
                    >
                      <option value="all">All</option>
                      <option value={2024}>2024</option>
                      <option value={2025}>2025</option>
                      <option value={2026}>2026</option>
                    </select>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm text-left border">
                      <thead className="bg-gray-100 text-gray-700">
                        <tr>
                          <th className="px-4 py-2 border">Month</th>
                          <th className="px-4 py-2 border">In-Month Revenue</th>
                          <th className="px-4 py-2 border">Subscription Revenue</th>
                        </tr>
                      </thead>
                      <tbody>
                        {monthlyBreakdown
                          .filter((monthRow) =>
                            tableYearFilter === "all"
                              ? true
                              : monthRow.month.includes(tableYearFilter.toString())
                          )
                          .filter((monthRow) => monthRow.proratedRevenue > 0)
                          .map((monthRow) => (
                            <tr key={monthRow.month}>
                              <td className="px-4 py-2 border">{monthRow.month}</td>
                              <td className="px-4 py-2 border">${monthRow.proratedRevenue.toLocaleString("en-US")}</td>
                              <td className="px-4 py-2 border">${monthRow.inMonthRevenue.toLocaleString("en-US")}</td>
                            </tr>
                          ))}

                        <tr className="font-semibold bg-gray-50">
                          <td className="px-4 py-2 border">Total</td>
                          <td className="px-4 py-2 border">
                            ${monthlyBreakdown.reduce((sum, m) => sum + m.proratedRevenue, 0).toLocaleString("en-US")}
                          </td>
                          <td className="px-4 py-2 border">
                            ${monthlyBreakdown.reduce((sum, m) => sum + m.inMonthRevenue, 0).toLocaleString("en-US")}
                          </td>
                        </tr>
                      </tbody>
                    </table>

                    <div className="flex justify-end mt-4">
                      <Button onClick={handleDownloadCSV} variant="outline" className="bg-blue-600 hover:bg-blue-500 text-white text-sm">
                        Download CSV
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="mb-4">
                    <label className="text-sm font-medium mr-2">Select Year:</label>
                    <select
                      className="border rounded px-2 py-1 text-sm"
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    >
                      <option value={2024}>2024</option>
                      <option value={2025}>2025</option>
                      <option value={2026}>2026</option>
                    </select>
                  </div>

                  <div className="w-full h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlyBreakdown}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" height={70} />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="proratedRevenue" fill="#FB1616" name="In-Month Revenue" />
                        <Bar dataKey="inMonthRevenue" fill="#3b82f6" name="Subscription Revenue" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}