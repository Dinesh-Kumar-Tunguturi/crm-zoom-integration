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

type FinanceStatus = "Paid" | "Unpaid" | "Paused";

interface SalesClosure {
  id: string;
  lead_id: string;
  sale_value: number;
  subscription_cycle: number;
  payment_mode: string;
  closed_at: string;
  email: string;
  finance_status: FinanceStatus;
}

export default function FinancePage() {
  const [sales, setSales] = useState<SalesClosure[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchSalesData();
  }, []);

  async function fetchSalesData() {
    const { data, error } = await supabase
      .from("sales_closure")
      .select("*")
      .order("closed_at", { ascending: false });

    if (error) {
      console.error("Error fetching sales data:", error);
    } else {
      setSales(data as SalesClosure[]);
    }
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

  const filteredSales = sales.filter(sale =>
    sale.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sale.lead_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalRevenue = sales.reduce((sum, sale) => sum + sale.sale_value, 0);
  const paidRevenue = sales.filter(s => s.finance_status === "Paid").reduce((sum, s) => sum + s.sale_value, 0);
  const unpaidRevenue = sales.filter(s => s.finance_status === "Unpaid").reduce((sum, s) => sum + s.sale_value, 0);
  const pausedRevenue = sales.filter(s => s.finance_status === "Paused").reduce((sum, s) => sum + s.sale_value, 0);

  const paidCount = sales.filter(s => s.finance_status === "Paid").length;
  const unpaidCount = sales.filter(s => s.finance_status === "Unpaid").length;
  const pausedCount = sales.filter(s => s.finance_status === "Paused").length;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
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

  return (
    <ProtectedRoute allowedRoles={["Finance", "Super Admin"]}>
          <DashboardLayout>
      <div className="space-y-6">
        {/* 📌 New Header Section */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Finance CRM</h1>
            <p className="text-gray-600 mt-2">Track revenue and manage payments</p>
          </div>
        </div>

        {/* 📊 Revenue Summary Panel */}
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

        {/* 🔍 Search and Table */}
        <Input
          placeholder="Search by email or lead_id"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />

        <div className="rounded-md border mt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSales.map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell className="font-medium">{sale.lead_id}</TableCell>
                  <TableCell>{sale.email}</TableCell>
                  <TableCell>Finance Team A</TableCell>
                  <TableCell>
                    <Badge className={getStageColor(sale.finance_status)}>
                      {sale.finance_status}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(sale.closed_at).toLocaleDateString("en-GB")}</TableCell>
                  <TableCell>
                    <Select
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
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </DashboardLayout>
    </ProtectedRoute>

  );
}
