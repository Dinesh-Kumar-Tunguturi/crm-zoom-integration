//app/finance/page.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from '@/utils/supabase/client';
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, DollarSign, TrendingUp, TrendingDown, Pause } from "lucide-react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner"; // or wherever your toast system comes from
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { MoreVertical, } from "lucide-react"; // or use any icon you like


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

type FinanceStatus = "Paid" | "Unpaid" | "Paused" | "Closed" | "Got Placed"; // 🆕 added "Got Placed"


interface SalesClosure {
  id: string;
  lead_id: string;
  sale_value: number;
  subscription_cycle: number;
  payment_mode: string;
  closed_at: string;
  email: string;
  finance_status: FinanceStatus;
  onboarded_date?: string;
  reason_for_close?: string;
  leads?: { name: string, phone: string };
  oldest_sale_done_at?: string; // 🆕
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

type SalesClosureData = {
  lead_id: string;
  email: string;
  lead_name: string,
  payment_mode: string;
  subscription_cycle: number;
  sale_value: number;
  closed_at: string;
  finance_status: string;
  next_payment_due: string;
  resume_service?: number;
  linkedin_service?: number;
  github_service?: number;
  portfolio_service?: number;
  created_at?: string;
};




export default function FinancePage() {
  const [sales, setSales] = useState<SalesClosure[]>([]);
  const [allSales, setAllSales] = useState<SalesClosure[]>([]); // 🆕 every row – drives totals & charts
  const [actionSelections, setActionSelections] = useState<Record<string, string>>({});
  const [onboardDate, setOnboardDate] = useState<Date | null>(null);
  const [subscriptionMonths, setSubscriptionMonths] = useState("");  // "1" | "2" | "3" | "0.5"
  const [activeTabView, setActiveTabView] = useState<"main" | "notOnboarded">("main");
  const [notOnboardedClients, setNotOnboardedClients] = useState<any[]>([]);
  const [loadingNotOnboarded, setLoadingNotOnboarded] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [sortField, setSortField] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");


  const [searchTerm, setSearchTerm] = useState("");
  const [followUpFilter, setFollowUpFilter] = useState<"All dates" | "Today">("Today");
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [closingNote, setClosingNote] = useState("");
  const [subscriptionMultiplier, setSubscriptionMultiplier] = useState(1);
  const [subscriptionSource, setSubscriptionSource] = useState(""); // For Referral/NEW

  const [showReasonDialog, setShowReasonDialog] = useState(false);
  // const [selectedFinanceStatus, setSelectedFinanceStatus] = useState<FinanceStatus | null>(null);
  const [reasonText, setReasonText] = useState("");



  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null);
  const [selectedFinanceStatus, setSelectedFinanceStatus] = useState<FinanceStatus | null>(null);
  const [statusFilter, setStatusFilter] = useState<FinanceStatus | "All">("All");
  const [showRevenueDialog, setShowRevenueDialog] = useState(false);
  const [activeTab, setActiveTab] = useState<"table" | "chart">("table");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showOnboardDialog, setShowOnboardDialog] = useState(false);
  const [tableYearFilter, setTableYearFilter] = useState<number | "all">("all");
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  // const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");

  const [paymentDate, setPaymentDate] = useState(new Date());

  const [salesData, setSalesData] = useState<SalesClosureData[]>([]);


  const [companyApplicationEmail, setCompanyApplicationEmail] = useState('');

  const [onboardingDate, setOnboardingDate] = useState<Date | null>(null);
  const [autoTotal, setAutoTotal] = useState(0);
  const [referrerId, setReferrerId] = useState('');
  const [referrerName, setReferrerName] = useState('');
  const [coursesValue, setCoursesValue] = useState('');
  const [noOfJobApps, setNoOfJobApps] = useState('');
  const [badgeValue, setBadgeValue] = useState('');
  const [customLabel, setCustomLabel] = useState('');
  const [customValue, setCustomValue] = useState('');
  const [commitments, setCommitments] = useState('');
  const [closerName, setCloserName] = useState('');




  const monthlyRevenues: { month: string; amount: number }[] = [];

  const [monthlyBreakdown, setMonthlyBreakdown] = useState<
    { month: string; inMonthRevenue: number; proratedRevenue: number }[]
  >([]);

  useEffect(() => {
    fetchSalesData();
  }, []);


  useEffect(() => {
    if (allSales.length > 0) {
      const breakdown = generateMonthlyRevenue(allSales, selectedYear);
      setMonthlyBreakdown(breakdown);
    }
  }, [allSales, selectedYear]);

  useEffect(() => {
    if (activeTabView === "notOnboarded") {
      fetchNotOnboardedClients();
    }
  }, [activeTabView]);

  const fetchNotOnboardedClients = async () => {
    setLoadingNotOnboarded(true);
    const { data, error } = await supabase
      .from("sales_closure")
      .select(`id, lead_id, lead_name, email, sale_value, subscription_cycle,  closed_at`)
      .is("onboarded_date", null);

    if (error) {
      console.error("Error fetching not onboarded clients:", error);
    } else {
      setNotOnboardedClients(data || []);
    }

    setLoadingNotOnboarded(false);
  };





  async function fetchSalesData() {
    const { data: rows, error } = await supabase
      .from("sales_closure")
      .select("*")
      .order("closed_at", { ascending: false });

    if (error) {
      console.error("Error fetching sales data:", error);
      return;
    }

    setAllSales(rows);
    const onboardedRows = rows.filter((r) => r.onboarded_date);

    const latestMap = new Map<string, SalesClosure>();
    for (const rec of onboardedRows) {
      const existing = latestMap.get(rec.lead_id);
      if (!existing || new Date(rec.closed_at) > new Date(existing.closed_at)) {
        latestMap.set(rec.lead_id, rec);
      }
    }

    const latestRows = Array.from(latestMap.values()).sort(
      (a, b) =>
        new Date(b.onboarded_date ?? "").getTime() -
        new Date(a.onboarded_date ?? "").getTime()
    );

    // Step 1: Build oldest sale_done map
    const oldestSaleDateMap = new Map<string, string>();

    for (const record of rows) {
      const existing = oldestSaleDateMap.get(record.lead_id);
      const currentClosedAt = new Date(record.closed_at);
      if (!existing || currentClosedAt < new Date(existing)) {
        oldestSaleDateMap.set(record.lead_id, record.closed_at);
      }
    }


    const leadIds = latestRows.map((r) => r.lead_id);

    // 🆕 Fetch both name and phone from leads
    const { data: leads, error: leadsErr } = await supabase
      .from("leads")
      .select("business_id, name, phone") // 👈 add phone here
      .in("business_id", leadIds);

    if (leadsErr) {
      console.error("Error fetching leads:", leadsErr);
      return;
    }

    const { data: fallback, error: fbErr } = await supabase
      .from("sales_closure")
      .select("lead_id, lead_name");

    if (fbErr) {
      console.error("Error fetching fallback names:", fbErr);
      return;
    }

    const leadNameMap = new Map(leads.map((l) => [l.business_id, l.name]));
    const leadPhoneMap = new Map(leads.map((l) => [l.business_id, l.phone])); // 🆕 map phone
    const fallbackNameMap = new Map(
      fallback.map((f) => [f.lead_id, f.lead_name])
    );


    const tableReady = latestRows.map((r) => ({
      ...r,
      leads: {
        name: leadNameMap.get(r.lead_id) || fallbackNameMap.get(r.lead_id) || "-",
        phone: leadPhoneMap.get(r.lead_id) || "-",
      },
      oldest_sale_done_at: oldestSaleDateMap.get(r.lead_id) || r.closed_at, // fallback to current
    }));


    setSales(tableReady);
  }




  // 🧾 Client Fields
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientId, setClientId] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [startDate, setStartDate] = useState("");
  const [city, setCity] = useState("");


  // 💳 Subscription Fields
  const [paymentMode, setPaymentMode] = useState("");
  const [subscriptionCycle, setSubscriptionCycle] = useState("30");
  const [subscriptionSaleValue, setSubscriptionSaleValue] = useState("");


  const [totalSale, setTotalSale] = useState(0);
  const [dueDate, setDueDate] = useState("");

  // 🧩 Optional Add-ons
  const [resumeValue, setResumeValue] = useState("");
  const [portfolioValue, setPortfolioValue] = useState("");
  const [linkedinValue, setLinkedinValue] = useState("");
  const [githubValue, setGithubValue] = useState("");



  function calculateDueDate(start: string, durationInDays: number): string {
    if (!start) return "";
    const date = new Date(start);
    date.setDate(date.getDate() + durationInDays);
    return date.toISOString().split("T")[0]; // yyyy-mm-dd
  }

  // const dueDate = calculateDueDate(startDate, Number(subscriptionCycle));
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


  useEffect(() => {
  const validSubscriptionSaleValue = parseFloat(subscriptionSaleValue || "0");
  const validResumeValue = parseFloat(resumeValue || "0");
  const validPortfolioValue = parseFloat(portfolioValue || "0");
  const validLinkedinValue = parseFloat(linkedinValue || "0");
  const validGithubValue = parseFloat(githubValue || "0");

  const total = validSubscriptionSaleValue + validResumeValue + validPortfolioValue + validLinkedinValue + validGithubValue;
  setTotalSale(total); // Update total correctly
}, [
  subscriptionSaleValue,
  resumeValue,
  portfolioValue,
  linkedinValue,
  githubValue
]);



  useEffect(() => {
    if (!startDate || !subscriptionCycle) {
      setDueDate("");
      return;
    }

    const start = new Date(startDate);
    const nextDue = new Date(start);
    nextDue.setDate(start.getDate() + parseInt(subscriptionCycle));

    setDueDate(nextDue.toLocaleDateString("en-GB")); // or "en-US" as needed
  }, [startDate, subscriptionCycle]);


  const filteredSales = sales.filter((sale) => {
    const matchesSearch =
      sale.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.lead_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (sale.leads?.name ?? "").toLowerCase().includes(searchTerm.toLowerCase()) || // ✅ search by name
      (sale.leads?.phone ?? "").toLowerCase().includes(searchTerm.toLowerCase());  // ✅ search by phone

    const matchesStatus = statusFilter === "All" || sale.finance_status === statusFilter;

    if (followUpFilter === "Today") {
      // due = onboarded_date + subscription_cycle
      if (!sale.onboarded_date || !sale.subscription_cycle) return false;
      const start = new Date(sale.onboarded_date);
      const due = new Date(start);
      due.setHours(0, 0, 0, 0);
      due.setDate(due.getDate() + sale.subscription_cycle);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // show “due today” and “overdue”
      return (due.getTime() <= today.getTime()) && matchesSearch && matchesStatus;
    }

    return matchesSearch && matchesStatus;
  });

  function handleSort(field: string) {
    if (sortField === field) {
      // Toggle sort direction
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder("asc"); // default order
    }
  }

  const sortedSales = [...filteredSales].sort((a, b) => {
    if (!sortField) return 0;

    if (sortField === "lead_id") {
      const aNum = parseInt(a.lead_id.split("-")[1]);
      const bNum = parseInt(b.lead_id.split("-")[1]);
      return sortOrder === "asc" ? aNum - bNum : bNum - aNum;
    }

    if (sortField === "leads") {
      const nameA = a.leads?.name?.toLowerCase() ?? "";
      const nameB = b.leads?.name?.toLowerCase() ?? "";
      return sortOrder === "asc"
        ? nameA.localeCompare(nameB)
        : nameB.localeCompare(nameA);
    }

    if (sortField === "name") {
      const nameA = (a.leads?.name ?? "").toLowerCase();
      const nameB = (b.leads?.name ?? "").toLowerCase();
      return sortOrder === "asc" ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
    }

    if (sortField === "sale_value") {
      return sortOrder === "asc"
        ? a.sale_value - b.sale_value
        : b.sale_value - a.sale_value;
    }

    if (sortField === "closed_at") {
      const dateA = new Date(a.closed_at).getTime();
      const dateB = new Date(b.closed_at).getTime();
      return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
    }

    if (sortField === "onboarded_date") {
      const dateA = new Date(a.onboarded_date ?? "").getTime();
      const dateB = new Date(b.onboarded_date ?? "").getTime();
      return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
    }

    if (sortField === "next_renewal_date") {
      const dateA = new Date(calculateNextRenewal(a.onboarded_date, a.subscription_cycle)).getTime();
      const dateB = new Date(calculateNextRenewal(b.onboarded_date, b.subscription_cycle)).getTime();
      return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
    }

    return 0;
  });



  function getRenewWithinBadge(createdAt: string, subscriptionCycle: number): React.ReactNode {
    if (!createdAt || !subscriptionCycle) return null;

    const startDate = new Date(createdAt);
    const today = new Date();

    // Normalize time to 00:00:00 to compare only dates
    startDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    const diffInDays = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffInDays < subscriptionCycle) {
      const daysLeft = subscriptionCycle - diffInDays;
      return (
        <Badge className="bg-green-100 text-green-800">
          Within {daysLeft} day{daysLeft === 1 ? "" : "s"}
        </Badge>
      );
    } else if (diffInDays === subscriptionCycle) {
      return (
        <Badge className="bg-yellow-100 text-gray-800">
          Today last date
        </Badge>
      );
    } else {
      const overdue = diffInDays - subscriptionCycle;
      return (
        <Badge className="bg-red-100 text-red-800">
          Overdue by {overdue} day{overdue === 1 ? "" : "s"}
        </Badge>
      );
    }
  }

  const nextRenewalDate =
    onboardingDate !== null
      ? new Date(onboardingDate)
      : null;
  if (nextRenewalDate !== null) {
    nextRenewalDate.setDate(nextRenewalDate.getDate() + parseInt(subscriptionCycle, 10));
  }


  const totalRevenue = allSales.reduce((sum, s) => sum + s.sale_value, 0);

  const paidRevenue = allSales.filter(s => s.finance_status === "Paid")
    .reduce((sum, s) => sum + s.sale_value, 0);
  const unpaidRevenue = allSales.filter(s => s.finance_status === "Unpaid")
    .reduce((sum, s) => sum + s.sale_value, 0);
  const pausedRevenue = allSales.filter(s => s.finance_status === "Paused")
    .reduce((sum, s) => sum + s.sale_value, 0);

  const paidCount = allSales.filter(s => s.finance_status === "Paid").length;
  const unpaidCount = allSales.filter(s => s.finance_status === "Unpaid").length;
  const pausedCount = allSales.filter(s => s.finance_status === "Paused").length;
  const gotPlacedCount = allSales.filter(s => s.finance_status === "Got Placed").length;

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
      case "Got Placed":
        return "bg-blue-100 text-blue-800";
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

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "monthly_revenue_breakdown.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  async function handleOnboardClientSubmit() {
    try {
      const confirmed = window.confirm("Are you sure you want to Onboard this client?");
      if (!confirmed) return;

      // 1. Generate new lead_id like AWL-1, AWL-2, ...
      const { data: existingLeads, error: leadsCountError } = await supabase
        .from("leads")
        .select("business_id");

      if (leadsCountError) throw leadsCountError;

      const { data: idResult, error: idError } = await supabase.rpc('generate_custom_lead_id');

      if (idError || !idResult) {
        console.error("❌ Failed to generate lead ID:", idError);
        return toast.error("Could not generate Lead ID. Try again.");
      }

      const newLeadId = idResult; // Will be something like "AWL-187"


      // 2. Parse sale values (treat empty as 0)
      const baseValue = parseInt(subscriptionSaleValue || "0");
      const resume = parseInt(resumeValue || "0");
      const linkedin = parseInt(linkedinValue || "0");
      const github = parseInt(githubValue || "0");
      const portfolio = parseInt(portfolioValue || "0");

      // 3. Calculate total value
      const totalSaleValue = baseValue + resume + linkedin + github + portfolio;

      // 4. Compute next payment due date
      const start = new Date(startDate);
      const nextDueDate = new Date(start);
      const durationInDays = parseInt(subscriptionCycle || "0");
      nextDueDate.setDate(start.getDate() + durationInDays);

      const now = new Date().toISOString();

      // 5. Insert into leads table
      const { error: leadsInsertError } = await supabase.from("leads").insert({
        business_id: newLeadId,
        name: clientName,
        email: clientEmail,
        phone: contactNumber,
        city: city,
        created_at: now,
        // source:"Onboarded Client",
        source: subscriptionSource || "Onboarded Client",
        status: "Assigned",
      });

      if (leadsInsertError) throw leadsInsertError;

      // 6. Insert into sales_closure table
      const { error: salesInsertError } = await supabase.from("sales_closure").insert({
        lead_id: newLeadId,
        email: clientEmail,
        lead_name: clientName,
        payment_mode: paymentMode,
        subscription_cycle: durationInDays,
        sale_value: totalSale,
        closed_at: startDate,
        finance_status: "Paid",
        resume_sale_value: resume,
        linkedin_sale_value: linkedin,
        github_sale_value: github,
        portfolio_sale_value: portfolio,
        // next_payment_due: nextDueDate.toISOString(),
      });

      if (salesInsertError) throw salesInsertError;

      // 7. Append new data to table
      const newEntry = {
        lead_id: newLeadId,
        email: clientEmail,
        lead_name: clientName,
        sale_value: totalSaleValue,
        subscription_cycle: durationInDays,
        payment_mode: paymentMode,
        closed_at: startDate,
        finance_status: "Paid",
        resume_sale_value: resume,
        linkedin_sale_value: linkedin,
        github_sale_value: github,
        portfolio_sale_value: portfolio,
        next_payment_due: nextDueDate.toISOString(),
      };

      setSalesData((prev) => [...prev, newEntry]);

      // 8. Reset fields
      setClientName("");
      setClientEmail("");
      setContactNumber("");
      setCity("");
      setStartDate("");
      setSubscriptionCycle("");
      setSubscriptionSaleValue("");
      setPaymentMode("");
      setResumeValue("");
      setPortfolioValue("");
      setLinkedinValue("");
      setGithubValue("");

      // 9. Close dialog
      setShowOnboardDialog(false);

      // 10. Success alert
      setTimeout(() => {
        alert("✅ Client onboarded successfully!");
      }, 100);
    } catch (err: any) {
      console.error("❌ Error onboarding client:", err?.message || err);
      alert(`Failed to onboard client: ${err?.message || "Unknown error"}`);
    }
  }

  async function handlePaymentClose() {

    // Ensure paymentAmount has a valid value
    const validPaymentAmount = parseFloat(paymentAmount || "0");
    if (isNaN(validPaymentAmount)) {
      alert("Please provide a valid payment amount.");
      return;
    }

    // Calculate Total Amount
    const totalAmount = (
      validPaymentAmount +
      parseFloat(resumeValue || "0") +
      parseFloat(portfolioValue || "0") +
      parseFloat(linkedinValue || "0") +
      parseFloat(githubValue || "0") +
      parseFloat(coursesValue || "0") +
      parseFloat(customValue || "0") +
      parseFloat(badgeValue || "0")
    ).toFixed(2);

    // Calculate Next Renewal Date

    const nextRenewalDate =
      onboardingDate !== null
        ? new Date(onboardingDate)
        : null;
    if (nextRenewalDate !== null) {
      nextRenewalDate.setDate(nextRenewalDate.getDate() + parseInt(subscriptionCycle, 10));
    }

    // console.log("Selected Sale ID: ", selectedSaleId);
    // console.log("Client Name: ", clientName);
    // console.log("Client Email: ", clientEmail);
    // console.log("application value Amount: ", subscriptionSaleValue);
    // console.log("application value Amount: ", adjustedTotalAmount);

    // adjustedTotalAmount
    // console.log("Total Amount with addons: ", subscription_puls_addons);

    // Validate required fields
    if (!clientId) {
      alert("Sale ID is missing.");
      return;
    }
    if (!onboardingDate) {
      alert("Please fill onboardingDate field.");
      return;
    }
    if (!subscriptionCycle) {
      alert("Please fill subscriptionCycle field.");
      return;
    }
    if (!clientName) {
      alert("Please fill clientName field.");
      return;
    }
    if (!clientEmail) {
      alert("Please fill clientEmail field.");
      return;
    }


   const validSubscriptionSaleValue = parseFloat(subscriptionSaleValue || "0");
const validResumeValue = parseFloat(resumeValue || "0");
const validPortfolioValue = parseFloat(portfolioValue || "0");
const validLinkedinValue = parseFloat(linkedinValue || "0");
const validGithubValue = parseFloat(githubValue || "0");

const total = validSubscriptionSaleValue + validResumeValue + validPortfolioValue + validLinkedinValue + validGithubValue;
setTotalSale(total);  // Update total correctly



    // Insert a new record into the sales_closure table
    const { data, error } = await supabase.from("sales_closure").insert({
      lead_id: clientId,  // Use the lead_id associated with the sale
      email: clientEmail,
      lead_name: clientName,
      sale_value: parseFloat(subscription_puls_addons.toString()),  // Store totalAmount in sale_value
      subscription_cycle: parseInt(subscriptionCycle),
      closed_at: onboardingDate.toISOString(),
      finance_status: "Paid",  // Set status as Paid
      company_application_email: companyApplicationEmail,
      // contact_number: contactNumber,
      payment_mode: paymentMode,
      application_sale_value: parseFloat(adjustedTotalAmount.toString()),  // Store paymentAmount in application_sale_value
      no_of_job_applications: parseInt(noOfJobApps || "0"),
      onboarded_date: onboardingDate.toISOString(),
      resume_sale_value: parseFloat(resumeValue || "0"),
      linkedin_sale_value: parseFloat(linkedinValue || "0"),
      github_sale_value: parseFloat(githubValue || "0"),
      portfolio_sale_value: parseFloat(portfolioValue || "0"),
      courses_sale_value: parseFloat(coursesValue || "0"),
      badge_value: parseFloat(badgeValue || "0"),
      custom_label: customLabel,
      custom_sale_value: parseFloat(customValue || "0"),
      commitments: commitments,
      account_assigned_name: closerName,
      // next_renewal_date: nextRenewalDate.toISOString(),  // Store next renewal date
    });

    // Check if there was an error
    if (error) {
      console.error("Error inserting payment record:", error);
      alert("Failed to record payment.");
    } else {
      alert("Payment recorded successfully!");
      setShowPaymentDialog(false);
      setPaymentAmount("");
      setOnboardingDate(null);
      setSubscriptionCycle("");
    }
  }

  async function insertZeroSaleRow(sale: SalesClosure, status: FinanceStatus) {
    await supabase.from("sales_closure").insert({
      ...sale,
      id: undefined,
      sale_value: 0,
      finance_status: status,
      closed_at: new Date().toISOString(),
    });

    alert(`Status marked as ${status} with 0 sale value.`);
  }

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
      setFeedbackMsg({ type: "error", text: "❌ Failed to onboard client. Try again." });
    } else {
      setFeedbackMsg({ type: "success", text: "✅ Client onboarded successfully." });
      setNotOnboardedClients((prev) => prev.filter((c) => c.id !== clientId));
      await fetchSalesData();
    }

    // Clear message after 3 seconds
    setTimeout(() => setFeedbackMsg(null), 2000);


  };


  async function handleDownloadFullSalesCSV() {
    try {
      // 1. Fetch all sales_closure records
      const { data: salesData, error: salesError } = await supabase
        .from("sales_closure")
        .select("*");

      if (salesError) throw salesError;
      if (!salesData || salesData.length === 0) {
        alert("No sales data found.");
        return;
      }

      // 2. Get unique lead_ids to fetch from leads
      const leadIds = [...new Set(salesData.map((s) => s.lead_id))];

      // 3. Fetch leads: phone, source, created_at, assigned_to
      const { data: leadsData, error: leadsError } = await supabase
        .from("leads")
        .select("business_id, phone, source, created_at, assigned_to")
        .in("business_id", leadIds);

      if (leadsError) throw leadsError;

      // 4. Build a map for fast lookup
      const leadsMap = new Map(
        leadsData.map((lead) => [lead.business_id, lead])
      );

      // 5. Enrich sales data with lead fields
      const enrichedRows = salesData.map((row) => {
        const lead = leadsMap.get(row.lead_id);
        return {
          ...row,
          phone: lead?.phone || "",
          source: lead?.source || "",
          lead_created_at: lead?.created_at || "",
          assigned_to: lead?.assigned_to || "",
        };
      });

      // 6. Format for CSV
      const headers = Object.keys(enrichedRows[0]);
      const rows = enrichedRows.map((row) =>
        headers
          .map((header) => {
            const val = row[header];
            return typeof val === "string"
              ? `"${val.replace(/"/g, '""')}"`
              : `"${val ?? ""}"`;
          })
          .join(",")
      );

      const csvContent = [headers.join(","), ...rows].join("\n");

      // 7. Trigger download

      const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
      // const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `sales_closure_full_export_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      console.error("❌ Error exporting CSV:", err?.message || err);
      alert("Failed to download CSV. Try again.");
    }
  }

  const handlePaymentDialogOpen = async (selectedLeadId: string) => {
    const { data, error } = await supabase
      .from("sales_closure")
      .select("*")
      .eq("lead_id", selectedLeadId)
      .order("closed_at", { ascending: false })
      .limit(1);

    if (error) {
      console.error("Error fetching sale record:", error);
      return;
    }

    if (data && data.length > 0) {
      const saleRecord = data[0];
      setClientId(saleRecord.lead_id);
      setClientName(saleRecord.lead_name || "");
      setClientEmail(saleRecord.email || "");
      setCompanyApplicationEmail(saleRecord.company_application_email || "");
      setContactNumber(saleRecord.contact_number || "");
      setCity(saleRecord.city || "");
      setOnboardingDate(new Date(saleRecord.closed_at));
      setPaymentMode(saleRecord.payment_mode || "");
      setSubscriptionCycle(saleRecord.subscription_cycle.toString());
      setSubscriptionSaleValue(saleRecord.application_sale_value.toString());
      setAutoTotal(saleRecord.sale_value);  // Calculate auto total if required
      setSubscriptionSource(saleRecord.source || "");
      setReferrerId(saleRecord.referrer_id || "");
      setReferrerName(saleRecord.referrer_name || "");
      setResumeValue(saleRecord.resume_sale_value || "");
      setPortfolioValue(saleRecord.portfolio_sale_value || "");
      setLinkedinValue(saleRecord.linkedin_sale_value || "");
      setGithubValue(saleRecord.github_sale_value || "");
      setCoursesValue(saleRecord.courses_sale_value || "");
      setNoOfJobApps(saleRecord.no_of_job_applications || "");
      setBadgeValue(saleRecord.badge_value || "");
      setCustomLabel(saleRecord.custom_label || "");
      setCustomValue(saleRecord.custom_sale_value || "");
      setCommitments(saleRecord.commitments || "");
      setCloserName(saleRecord.account_assigned_name || "");
      setShowPaymentDialog(true);
    }
  };



  function calculateNextRenewal(onboarded: string | undefined, cycle: number): string {
    if (!onboarded || !cycle) return "-";

    const start = new Date(onboarded);
    start.setDate(start.getDate() + cycle);

    return start.toLocaleDateString("en-GB"); // Format: dd/mm/yyyy
  }
  const totalAmount = (
    parseFloat(subscriptionSaleValue)

  );

  // Adjust the total based on the subscription cycle
  let adjustedTotalAmount = 0;
  switch (subscriptionCycle) {
    case "15": // 15 Days
      adjustedTotalAmount = totalAmount * 0.5; // 15 days = half of the subscription sale value
      break;
    case "30": // 1 Month
      adjustedTotalAmount = totalAmount; // 1 month = full value
      break;
    case "60": // 2 Months
      adjustedTotalAmount = totalAmount * 2; // 2 months = double the subscription sale value
      break;
    case "90": // 3 Months
      adjustedTotalAmount = totalAmount * 3; // 3 months = triple the subscription sale value
      break;
    default:
      adjustedTotalAmount = totalAmount;
      break;
  }

  const validResumeValue = parseFloat(resumeValue || "0");
const validPortfolioValue = parseFloat(portfolioValue || "0");
const validLinkedinValue = parseFloat(linkedinValue || "0");
const validGithubValue = parseFloat(githubValue || "0");
const validCoursesValue = parseFloat(coursesValue || "0");
const validCustomValue = parseFloat(customValue || "0");
const validBadgeValue = parseFloat(badgeValue || "0");

// Now you can safely add them together
const subscription_puls_addons = adjustedTotalAmount + validResumeValue +
  validPortfolioValue + validLinkedinValue + validGithubValue +
  validCoursesValue + validCustomValue + validBadgeValue;

console.log("subscription_puls_addons", typeof subscription_puls_addons, subscription_puls_addons);
console.log("adjustedTotalAmount", typeof adjustedTotalAmount, adjustedTotalAmount);
console.log("resumeValue", typeof resumeValue, resumeValue);
console.log("portfolioValue", typeof portfolioValue, portfolioValue);
console.log("linkedinValue", typeof linkedinValue, linkedinValue);
console.log("githubValue", typeof githubValue, githubValue);
console.log("coursesValue", typeof coursesValue, coursesValue);
console.log("customValue", typeof customValue, customValue);
console.log("badgeValue", typeof badgeValue, badgeValue);

// Format the result with two decimal places
const formattedTotalAmount = subscription_puls_addons.toFixed(2);


  // Now use formattedTotalAmount in your input field

  const calculateAutoTotal = (cycle: string, saleValue: string) => {
    const value = parseFloat(saleValue || "0");

    switch (cycle) {
      case "15":
        return (value * 0.5).toFixed(2); // 15 Days
      case "30":
        return value.toFixed(2); // 1 Month
      case "60":
        return (value * 2).toFixed(2); // 2 Months
      case "90":
        return (value * 3).toFixed(2); // 3 Months
      default:
        return "0.00";
    }
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
            {/* <Button onClick={() => setShowRevenueDialog(true)}>Revenue</Button> */}
            <div className="flex gap-2">

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex gap-1">
                    Revenue <MoreVertical size={16} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setShowRevenueDialog(true)}>
                    Quick Revenue Analysis
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => window.open("/finance/full-analysis", "_blank")}>
                    Complete Revenue Analysis
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDownloadFullSalesCSV}>
                    Download Revenue Information
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
                <p className="text-xs text-muted-foreground">{paidCount} transactions</p>
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

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Got Placed</CardTitle>
                <User className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl text-blue-600 font-bold">{gotPlacedCount} Clients placed</div>
                {/* <p className="text-xs text-muted-foreground">{sales.length} total clients</p> */}
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
                  <SelectItem value="Got Placed">Got Placed</SelectItem>
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

              {activeTabView === "notOnboarded" ? (
                <Button
                  className="bg-gray-700 hover:bg-gray-600 text-white"
                  onClick={() => setActiveTabView("main")}
                >
                  ← Back to All Clients
                </Button>
              ) : (
                <Button
                  className="bg-orange-500 hover:bg-orange-400 text-white"
                  onClick={() => setActiveTabView("notOnboarded")}
                >
                  Not Onboarded Clients
                </Button>
              )}

            </div>
          </div>

          {activeTabView === "notOnboarded" ? (
            // 🔁 NEW TAB: Not Onboarded Clients Table
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
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingNotOnboarded ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : notOnboardedClients.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                        All clients are onboarded 🎉
                      </TableCell>
                    </TableRow>
                  ) : (
                    notOnboardedClients.map((client, index) => (
                      <TableRow key={client.id}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{client.lead_id}</TableCell>
                        <TableCell>{client.lead_name || "-"}</TableCell>
                        <TableCell>{client.email || "-"}</TableCell>
                        <TableCell>${client.sale_value}</TableCell>
                        <TableCell>{client.subscription_cycle} days</TableCell>
                        <TableCell>Finance Team A</TableCell>
                        <TableCell>Not Onboarded</TableCell>
                        <TableCell>{new Date(client.closed_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            className="bg-green-600 text-white"
                            onClick={() =>

                              handleOnboardClient(client.id)}
                          >
                            Onboard
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              {feedbackMsg && (
                <div
                  className={`p-3 rounded-md text-white mb-4 ${feedbackMsg.type === "success" ? "bg-green-600" : "bg-red-600"
                    }`}
                >
                  {feedbackMsg.text}
                </div>
              )}
            </div>
          ) : (
            // 🔁 EXISTING MAIN TABLE STAYS HERE



            <div className="rounded-md border mt-4">
              {/* <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>S.No</TableHead>
                    <TableHead className="cursor-pointer  items-center gap-1" onClick={() => handleSort("lead_id")}>
                      <div className="flex flex-center gap-1">
                        ClientID

                        <span
                          className={`text-xs leading-none ${sortField === "lead_id" && sortOrder === "desc" ? "text-blue-600" : "text-gray-400"}`}
                        >▲</span>
                        <span
                          className={`text-xs leading-none ${sortField === "lead_id" && sortOrder === "asc" ? "text-blue-600" : "text-gray-400"}`}
                        >▼</span>
                      </div>
                    </TableHead>

                    <TableHead className="cursor-pointer  items-center gap-1" onClick={() => handleSort("name")}>
                      <div className="flex flex-center gap-1">
                        Name

                        <span
                          className={`text-xs leading-none ${sortField === "name" && sortOrder === "desc" ? "text-blue-600" : "text-gray-400"}`}
                        >▲</span>
                        <span
                          className={`text-xs leading-none ${sortField === "name" && sortOrder === "asc" ? "text-blue-600" : "text-gray-400"}`}
                        >▼</span>
                      </div>
                    </TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead className="cursor-pointer  items-center gap-1" onClick={() => handleSort("sale_value")}>
                      <div className="flex flex-center gap-1">
                        Sale value

                        <span
                          className={`text-xs leading-none ${sortField === "sale_value" && sortOrder === "desc" ? "text-blue-600" : "text-gray-400"}`}
                        >▲</span>
                        <span
                          className={`text-xs leading-none ${sortField === "sale_value" && sortOrder === "asc" ? "text-blue-600" : "text-gray-400"}`}
                        >▼</span>
                      </div>
                    </TableHead>
                    <TableHead>Subscription Cycle</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Stage</TableHead>
                    <TableHead className="cursor-pointer  items-center gap-1" onClick={() => handleSort("oldest_sale_done_at")}>
                      <div className="flex flex-center gap-1">
                        SaledoneAt

                        <span
                          className={`text-xs leading-none ${sortField === "oldest_sale_done_at" && sortOrder === "desc" ? "text-blue-600" : "text-gray-400"}`}
                        >▲</span>
                        <span
                          className={`text-xs leading-none ${sortField === "oldest_sale_done_at" && sortOrder === "asc" ? "text-blue-600" : "text-gray-400"}`}
                        >▼</span>
                      </div>
                    </TableHead>

                    <TableHead className="cursor-pointer  items-center gap-1" onClick={() => handleSort("onboarded_date")}>
                      <div className="flex flex-center gap-1">
                        Onboarded/lastPaymentAt

                        <span
                          className={`text-xs leading-none ${sortField === "onboarded_date" && sortOrder === "desc" ? "text-blue-600" : "text-gray-400"}`}
                        >▲</span>
                        <span
                          className={`text-xs leading-none ${sortField === "onboarded_date" && sortOrder === "asc" ? "text-blue-600" : "text-gray-400"}`}
                        >▼</span>
                      </div>
                    </TableHead>

                    <TableHead>Next Renewal Date</TableHead>

                    <TableHead>Deadline</TableHead>
                    <TableHead>Actions</TableHead>
                    <TableHead>Reason</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {sortedSales.length > 0 ? (
                    sortedSales.map((sale, idx) => (
                      <TableRow key={sale.id}>
                        <TableCell>{idx + 1}</TableCell>
                        <TableCell className="font-medium">{sale.lead_id}</TableCell>

                        <TableCell
                          className="font-medium max-w-[150px] break-words whitespace-normal cursor-pointer text-blue-600 hover:underline"
                          onClick={() => window.open(`/leads/${sale.lead_id}`, "_blank")}
                        >{sale.leads?.name ?? "-"}</TableCell>
                        <TableCell className="max-w-[160px] break-words whitespace-normal">{sale.email}</TableCell>
                        <TableCell className="max-w-[160px] break-words whitespace-normal">
                          {sale.leads?.phone ?? "-"}
                        </TableCell>
                        <TableCell>{formatCurrency(sale.sale_value)}</TableCell>
                        <TableCell>{sale.subscription_cycle} days</TableCell>
                        <TableCell>Finance Team A</TableCell>
                        <TableCell>


                          <Badge className={getStageColor(sale.finance_status)}>
                            {sale.finance_status}
                          </Badge>


                        </TableCell>

                        <TableCell>
                          {sale.oldest_sale_done_at
                            ? new Date(sale.oldest_sale_done_at).toLocaleDateString("en-GB")
                            : "-"}
                        </TableCell>


                        <TableCell>{sale.onboarded_date ? new Date(sale.onboarded_date).toLocaleDateString("en-GB") : "-"}</TableCell>

                        <TableCell>
                          {calculateNextRenewal(sale.onboarded_date, sale.subscription_cycle)}
                        </TableCell>


                        <TableCell>
                          {getRenewWithinBadge(sale.onboarded_date || "", sale.subscription_cycle)}
                        </TableCell>

                        
                        <TableCell>
  {(() => {
    const toLocalDate = (s?: string | null) => {
      if (!s) return null;
      if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
        const [y, m, d] = s.split("-").map(Number);
        return new Date(y, m - 1, d);
      }
      const d = new Date(s);
      return isNaN(d.getTime()) ? null : d;
    };
    const atMidnight = (d: Date) => {
      const x = new Date(d);
      x.setHours(0, 0, 0, 0);
      return x;
    };

    const cycle = Number(sale.subscription_cycle) || 30;
    const onboard = toLocalDate(sale.onboarded_date);
    const today = atMidnight(new Date());

    let status: "upcoming" | "due_today" | "overdue" | "unknown" = "unknown";
    let label = "—";
    let due: Date | null = null;

    if (onboard) {
      due = atMidnight(new Date(onboard));
      due.setDate(due.getDate() + cycle);

      const msPerDay = 24 * 60 * 60 * 1000;
      const daysLeft = Math.round((due.getTime() - today.getTime()) / msPerDay);

      if (daysLeft === 0) {
        status = "due_today";
        label = "today last date";
      } else if (daysLeft < 0) {
        status = "overdue";
        label = `overdue by ${Math.abs(daysLeft)} day${Math.abs(daysLeft) === 1 ? "" : "s"}`;
      } else {
        status = "upcoming";
        label = `${daysLeft} day${daysLeft === 1 ? "" : "s"} left`;
      }
    }

    const badgeClass =
      status === "overdue"
        ? "bg-red-100 text-red-700"
        : status === "due_today"
        ? "bg-amber-100 text-amber-700"
        : status === "upcoming"
        ? "bg-emerald-100 text-emerald-700"
        : "text-gray-400";

     const isActionAllowed =
      followUpFilter === "All dates" ? status !== "upcoming" : true;

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
      <>
      

        <Select
          value={actionSelections[sale.id] || ""}
          onValueChange={(value) => {
            setActionSelections((prev) => ({ ...prev, [sale.id]: value }));
            if (value === "Paid") {
              if (!window.confirm("Are you sure you want to update status as PAID ?")) return;
              setSelectedSaleId(sale.id);
              setShowPaymentDialog(true);
            } else if (["Closed", "Paused", "Unpaid", "Got Placed"].includes(value)) {
              if (!window.confirm(`Are you sure you want to update status as ${value} ?`)) return;
              setSelectedSaleId(sale.id);
              setSelectedFinanceStatus(value as FinanceStatus);
              setShowReasonDialog(true);
            } else {
              handleFinanceStatusUpdate(sale.id, value as FinanceStatus);
            }
          }}
          disabled={!isActionAllowed || !!actionSelections[sale.id]}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Select Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Paid">Paid</SelectItem>
            <SelectItem value="Unpaid">Unpaid</SelectItem>
            <SelectItem value="Paused">Paused</SelectItem>
            <SelectItem value="Closed">Closed</SelectItem>
            <SelectItem value="Got Placed">Got Placed</SelectItem>
          </SelectContent>
        </Select>
      </>
    );
  })()}
</TableCell>

                        <TableCell className="text-center">

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
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        {followUpFilter === "Today" ? "No follow ups today" : "No information here"}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table> */}


              {/* Assumes you already have:
    - sortedSales, sortField, sortOrder, handleSort
    - formatCurrency, getStageColor, calculateNextRenewal, getRenewWithinBadge
    - followUpFilter, actionSelections, setActionSelections
    - setSelectedSaleId, setShowPaymentDialog, setShowReasonDialog, setShowCloseDialog
    - handleFinanceStatusUpdate
    - FinanceStatus type
    - MessageSquare icon and Popover components imported
*/}

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>S.No</TableHead>

                    <TableHead
                      className="cursor-pointer items-center gap-1"
                      onClick={() => handleSort("lead_id")}
                    >
                      <div className="flex flex-center gap-1">
                        ClientID
                        <span
                          className={`text-xs leading-none ${sortField === "lead_id" && sortOrder === "desc"
                            ? "text-blue-600"
                            : "text-gray-400"
                            }`}
                        >
                          ▲
                        </span>
                        <span
                          className={`text-xs leading-none ${sortField === "lead_id" && sortOrder === "asc"
                            ? "text-blue-600"
                            : "text-gray-400"
                            }`}
                        >
                          ▼
                        </span>
                      </div>
                    </TableHead>

                    <TableHead
                      className="cursor-pointer items-center gap-1"
                      onClick={() => handleSort("name")}
                    >
                      <div className="flex flex-center gap-1">
                        Name
                        <span
                          className={`text-xs leading-none ${sortField === "name" && sortOrder === "desc"
                            ? "text-blue-600"
                            : "text-gray-400"
                            }`}
                        >
                          ▲
                        </span>
                        <span
                          className={`text-xs leading-none ${sortField === "name" && sortOrder === "asc"
                            ? "text-blue-600"
                            : "text-gray-400"
                            }`}
                        >
                          ▼
                        </span>
                      </div>
                    </TableHead>

                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>

                    <TableHead
                      className="cursor-pointer items-center gap-1"
                      onClick={() => handleSort("sale_value")}
                    >
                      <div className="flex flex-center gap-1">
                        Sale value
                        <span
                          className={`text-xs leading-none ${sortField === "sale_value" && sortOrder === "desc"
                            ? "text-blue-600"
                            : "text-gray-400"
                            }`}
                        >
                          ▲
                        </span>
                        <span
                          className={`text-xs leading-none ${sortField === "sale_value" && sortOrder === "asc"
                            ? "text-blue-600"
                            : "text-gray-400"
                            }`}
                        >
                          ▼
                        </span>
                      </div>
                    </TableHead>

                    <TableHead>Subscription Cycle</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Stage</TableHead>

                    <TableHead
                      className="cursor-pointer items-center gap-1"
                      onClick={() => handleSort("oldest_sale_done_at")}
                    >
                      <div className="flex flex-center gap-1">
                        SaledoneAt
                        <span
                          className={`text-xs leading-none ${sortField === "oldest_sale_done_at" && sortOrder === "desc"
                            ? "text-blue-600"
                            : "text-gray-400"
                            }`}
                        >
                          ▲
                        </span>
                        <span
                          className={`text-xs leading-none ${sortField === "oldest_sale_done_at" && sortOrder === "asc"
                            ? "text-blue-600"
                            : "text-gray-400"
                            }`}
                        >
                          ▼
                        </span>
                      </div>
                    </TableHead>

                    <TableHead
                      className="cursor-pointer items-center gap-1"
                      onClick={() => handleSort("onboarded_date")}
                    >
                      <div className="flex flex-center gap-1">
                        Onboarded/lastPaymentAt
                        <span
                          className={`text-xs leading-none ${sortField === "onboarded_date" && sortOrder === "desc"
                            ? "text-blue-600"
                            : "text-gray-400"
                            }`}
                        >
                          ▲
                        </span>
                        <span
                          className={`text-xs leading-none ${sortField === "onboarded_date" && sortOrder === "asc"
                            ? "text-blue-600"
                            : "text-gray-400"
                            }`}
                        >
                          ▼
                        </span>
                      </div>
                    </TableHead>

                    <TableHead>Next Renewal Date</TableHead>
                    <TableHead>Deadline</TableHead>
                    <TableHead>Actions</TableHead>
                    <TableHead>Reason</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {sortedSales.length > 0 ? (
                    sortedSales.map((sale, idx) => {
                      // Treat these statuses as "finalized"
                      const stage = String(sale.finance_status || "").trim().toLowerCase();
                      const isFinalized = ["closed", "unpaid", "got placed"].includes(stage);

                      return (
                        <TableRow key={sale.id}>
                          <TableCell>{idx + 1}</TableCell>

                          <TableCell className="font-medium">{sale.lead_id}</TableCell>

                          <TableCell
                            className="font-medium max-w-[150px] break-words whitespace-normal cursor-pointer text-blue-600 hover:underline"
                            onClick={() => window.open(`/leads/${sale.lead_id}`, "_blank")}
                          >
                            {sale.leads?.name ?? "-"}
                          </TableCell>

                          <TableCell className="max-w-[160px] break-words whitespace-normal">
                            {sale.email}
                          </TableCell>

                          <TableCell className="max-w-[160px] break-words whitespace-normal">
                            {sale.leads?.phone ?? "-"}
                          </TableCell>

                          <TableCell>{formatCurrency(sale.sale_value)}</TableCell>
                          <TableCell>{sale.subscription_cycle} days</TableCell>

                          <TableCell>Finance Team A</TableCell>

                          <TableCell>
                            <Badge className={getStageColor(sale.finance_status)}>
                              {sale.finance_status}
                            </Badge>
                          </TableCell>

                          <TableCell>
                            {sale.oldest_sale_done_at
                              ? new Date(sale.oldest_sale_done_at).toLocaleDateString("en-GB")
                              : "-"}
                          </TableCell>

                          <TableCell>
                            {sale.onboarded_date
                              ? new Date(sale.onboarded_date).toLocaleDateString("en-GB")
                              : "-"}
                          </TableCell>

                          {/* Next Renewal Date — render nothing if Closed */}
                          <TableCell>
                            {isFinalized
                              ? null
                              : calculateNextRenewal(sale.onboarded_date, sale.subscription_cycle)}
                          </TableCell>

                          {/* Deadline — hide if finalized */}
                          <TableCell>
                            {isFinalized
                              ? null
                              : getRenewWithinBadge(sale.onboarded_date || "", sale.subscription_cycle)}
                          </TableCell>

                          {/* Actions — disable if finalized */}
                          <TableCell>
                            {/* <Select
            value={actionSelections[sale.id] || ""}
            onValueChange={(value) => {
              setActionSelections((prev) => ({ ...prev, [sale.id]: value }));
              if (value === "Paid") {
                if (!window.confirm("Are you sure you want to update status as PAID ?")) return;
                setSelectedSaleId(sale.id);
                setShowPaymentDialog(true);
              } else if (["Closed", "Paused", "Unpaid", "Got Placed"].includes(value)) {
                if (!window.confirm(`Are you sure you want to update status as ${value} ?`)) return;
                setSelectedSaleId(sale.id);
                setSelectedFinanceStatus(value as FinanceStatus);
                setShowReasonDialog(true);
              } else {
                handleFinanceStatusUpdate(sale.id, value as FinanceStatus);
              }
            }}
            disabled={isFinalized || !!actionSelections[sale.id]}
          >
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Select Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Paid">Paid</SelectItem>
              <SelectItem value="Unpaid">Unpaid</SelectItem>
              <SelectItem value="Paused">Paused</SelectItem>
              <SelectItem value="Closed">Closed</SelectItem>
              <SelectItem value="Got Placed">Got Placed</SelectItem>
            </SelectContent>
          </Select> */}


                            <Select
                              value={actionSelections[sale.id] || ""}
                              onValueChange={(value) => {
                                setActionSelections((prev) => ({ ...prev, [sale.id]: value }));
                                if (value === "Paid") {
                                  handlePaymentDialogOpen(sale.lead_id);  // Pass the selected sale's lead_id
                                } else if (["Closed", "Paused", "Unpaid", "Got Placed"].includes(value)) {
                                  if (!window.confirm(`Are you sure you want to update status as ${value} ?`)) return;
                                  setSelectedSaleId(sale.id);
                                  setSelectedFinanceStatus(value as FinanceStatus);
                                  setShowReasonDialog(true);
                                } else {
                                  handleFinanceStatusUpdate(sale.id, value as FinanceStatus);
                                }
                              }}
                              disabled={!!actionSelections[sale.id]}
                            >
                              <SelectTrigger className="w-36">
                                <SelectValue placeholder="Select Status" />
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


                          {/* Reason */}
                          <TableCell className="text-center">
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
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="text-center py-8 text-muted-foreground"
                      >
                        {followUpFilter === "Today"
                          ? "No follow ups today"
                          : "No information here"}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

            </div>

          )}


          <Dialog
            open={showReasonDialog}
            onOpenChange={(open) => {
              // Prevent closing by outside click or ESC
              if (!open) return;
            }}
          >
            <DialogContent
              hideCloseIcon
              aria-describedby="reason-details-dialog-box"
              className="sm:max-w-md"
              onInteractOutside={(e) => e.preventDefault()} // Disable outside click to close
            >
              <DialogHeader>
                <DialogTitle>Reason for {selectedFinanceStatus}</DialogTitle>
              </DialogHeader>

              <Textarea
                placeholder={`Enter reason for ${selectedFinanceStatus}`}
                value={reasonText}
                onChange={(e) => setReasonText(e.target.value)}
                className="min-h-[100px]"
              />

              <div className="flex justify-between gap-3 mt-4">
                {/* ❌ Cancel Button */}
                <Button
                  variant="ghost"
                  className="w-full bg-black text-white hover:bg-gray-800"
                  onClick={() => {
                    // 🔁 Reset dropdown to "Select Status"
                    if (selectedSaleId) {
                      setActionSelections((prev) => ({
                        ...prev,
                        [selectedSaleId]: "", // reset to "Select Status"
                      }));
                    }

                    // Reset dialog states
                    setShowReasonDialog(false);
                    setSelectedSaleId(null);
                    setSelectedFinanceStatus(null);
                    setReasonText("");
                  }}
                >
                  Cancel
                </Button>

                {/* ✅ Submit Button */}
                <Button
                  className="w-full bg-green-600 text-white hover:bg-green-700"
                  onClick={async () => {
                    if (!selectedSaleId || !selectedFinanceStatus || !reasonText.trim()) {
                      alert("Please provide a reason.");
                      return;
                    }

                    const { error } = await supabase
                      .from("sales_closure")
                      .update({
                        finance_status: selectedFinanceStatus,
                        reason_for_close: reasonText.trim(),
                      })
                      .eq("id", selectedSaleId);

                    if (error) {
                      console.error("Failed to update:", error);
                      alert("❌ Failed to save status.");
                      return;
                    }

                    // Update local UI state
                    setSales((prev) =>
                      prev.map((s) =>
                        s.id === selectedSaleId
                          ? {
                            ...s,
                            finance_status: selectedFinanceStatus,
                            reason_for_close: reasonText.trim(),
                          }
                          : s
                      )
                    );

                    // ✅ Update dropdown after successful submit
                    setActionSelections((prev) => ({
                      ...prev,
                      [selectedSaleId]: selectedFinanceStatus,
                    }));

                    // Reset
                    setShowReasonDialog(false);
                    setSelectedSaleId(null);
                    setSelectedFinanceStatus(null);
                    setReasonText("");
                  }}
                >
                  Submit
                </Button>
              </div>
            </DialogContent>
          </Dialog>




          <Dialog open={showCloseDialog} onOpenChange={(open) => {
            if (!open) return;
          }}>

            <DialogContent
              hideCloseIcon
              aria-describedby="ReasonForClose"
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

              <div className="flex justify-between gap-3 mt-4">
                <Button
                  variant="ghost"
                  className="w-full bg-black text-white hover:bg-gray-800"
                  onClick={() => {
                    setShowCloseDialog(false);
                    if (selectedSaleId) {
                      setActionSelections((prev) => ({
                        ...prev,
                        [selectedSaleId]: "",
                      }));
                    }
                    setSelectedSaleId(null);
                    setClosingNote("");
                  }}
                >
                  Cancel
                </Button>

                <Button
                  className="w-full bg-green-600 text-white hover:bg-green-700"
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
                    setActionSelections((prev) => ({
                      ...prev,
                      [selectedSaleId]: "",
                    }));
                    setClosingNote("");
                    setSelectedSaleId(null);
                  }}
                >
                  Submit
                </Button>
              </div>
            </DialogContent>
          </Dialog>




          <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
            <DialogContent aria-describedby="payment-details-description" className="max-w-5xl max-h-[80vh] overflow-y-auto" onInteractOutside={(e) => e.preventDefault()}>
              <DialogHeader>
                <DialogTitle>Renewal Form</DialogTitle>
              </DialogHeader>

              <p id="payment-details-description" className="text-sm text-muted-foreground mb-2">
                Client Id : {clientId}
              </p>

              <div className="space-y-4">
                {/* Client Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="grid grid-cols-1 md:grid-cols-1 border p-4 rounded-lg">
                    <div className="col-span-1"><Label className="font-semibold">Client Details</Label></div>

                    <div className="grid grid-cols-4 p-4 gap-4">

                      <div className="col-span-1">
                        <Label className="text-muted-foreground">Client Email</Label>
                      </div>
                      <div className="col-span-3">
                        <Input placeholder="Client Full Name" value={clientName} onChange={(e) => setClientName(e.target.value)} />
                      </div>

                      <div className="col-span-1">
                        <Label className="text-muted-foreground">Client Email</Label>
                      </div>
                      <div className="col-span-3">
                        <Input placeholder="Client Email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} />
                      </div>

                      <div className="col-span-1">
                        <Label className="text-muted-foreground">Application Email</Label>
                      </div>
                      <div className="col-span-3">
                        <Input placeholder="Company Application Email" value={companyApplicationEmail} onChange={(e) => setCompanyApplicationEmail(e.target.value)} />
                      </div>

                      <div className="col-span-1">
                        <Label className="text-muted-foreground">Phone number</Label>
                      </div>
                      <div className="col-span-3">
                        <Input placeholder="Contact Number" value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} />
                      </div>

                      <div className="col-span-1">
                        <Label className="text-muted-foreground">City</Label>
                      </div>
                      <div className="col-span-3">
                        <Input placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} />
                      </div>
                    </div>

                  </div>
                  {/* Subscription & Payment Info */}
                  <div className="grid grid-cols-2 gap-4 border p-4 rounded-lg">
                    {/* Subscription & Payment Info Label */}
                    <div className="col-span-2">
                      <Label className="font-semibold">Subscription & Payment Info</Label>
                    </div>

                    {/* Payment Mode */}
                    <div className="col-span-1">
                      <Label className="text-muted-foreground">Payment Mode</Label>
                    </div>
                    <div className="col-span-1">
                      <Select value={paymentMode} onValueChange={setPaymentMode}>
                        <SelectTrigger><SelectValue placeholder="Select Payment Mode" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="UPI">UPI</SelectItem>
                          <SelectItem value="PayPal">PayPal</SelectItem>
                          <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                          <SelectItem value="Credit/Debit Card">Credit/Debit Card</SelectItem>
                          <SelectItem value="Stripe">Stripe</SelectItem>
                          <SelectItem value="Razorpay">Razorpay</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Subscription Duration */}
                    <div className="col-span-1">
                      <Label className="text-muted-foreground">Subscription Duration</Label>
                    </div>
                    <div className="col-span-1">
                      <Select value={subscriptionCycle} onValueChange={setSubscriptionCycle}>
                        <SelectTrigger><SelectValue placeholder="Select Subscription Duration" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="15">15 Days</SelectItem>
                          <SelectItem value="30">1 Month</SelectItem>
                          <SelectItem value="60">2 Months</SelectItem>
                          <SelectItem value="90">3 Months</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Subscription Sale Value */}
                    <div className="col-span-1">
                      <Label className="text-muted-foreground">Subscription Sale Value ($)</Label>
                    </div>
                    <div className="col-span-1">
                      <Input
                        type="number"
                        placeholder="Subscription Sale Value ($)"
                        value={subscriptionSaleValue}
                        onChange={(e) => setSubscriptionSaleValue(e.target.value)}
                      />
                    </div>

                    {/* Auto Total (Subscription Only) */}
                    <div className="col-span-1">
                      <Label className="text-muted-foreground">Auto Total (Subscription Only)</Label>
                    </div>
                    <div className="col-span-1">
                      <Input
                        placeholder="Auto Total (Subscription Only)"
                        value={calculateAutoTotal(subscriptionCycle, subscriptionSaleValue)}
                        disabled
                      />
                    </div>

                    {/* Onboarding Date */}
                    <div className="col-span-1">
                      <Label className="text-muted-foreground">Onboarding Date</Label>
                    </div>
                    <div className="col-span-1">
                      <Input
                        type="date"
                        value={onboardingDate ? onboardingDate.toISOString().slice(0, 10) : ""}
                        onChange={(e) => setOnboardingDate(new Date(e.target.value))}
                      />
                    </div>
                  </div>


                </div>



                {/* Add-on Services */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border p-4 rounded-lg">
                  <Label className="col-span-2 text-sm font-semibold">Addon payments Info</Label>  {/* This will span across the full row */}
                  <div className="grid grid-cols-2 gap-2 items-center">
                    <Label className="text-muted-foreground col-span-1">Resume Sale Value ($)</Label>
                    <Input type="number" placeholder="Resume Sale Value ($)" value={resumeValue} onChange={(e) => setResumeValue(e.target.value)} className="col-span-1" />
                  </div>

                  <div className="grid grid-cols-2 gap-2 items-center">
                    <Label className="text-muted-foreground col-span-1">Portfolio Sale Value ($)</Label>
                    <Input type="number" placeholder="Portfolio Sale Value ($)" value={portfolioValue} onChange={(e) => setPortfolioValue(e.target.value)} className="col-span-1" />
                  </div>

                  <div className="grid grid-cols-2 gap-2 items-center">
                    <Label className="text-muted-foreground col-span-1">LinkedIn Sale Value ($)</Label>
                    <Input type="number" placeholder="LinkedIn Sale Value ($)" value={linkedinValue} onChange={(e) => setLinkedinValue(e.target.value)} className="col-span-1" />
                  </div>

                  <div className="grid grid-cols-2 gap-2 items-center">
                    <Label className="text-muted-foreground col-span-1">GitHub Sale Value ($)</Label>
                    <Input type="number" placeholder="GitHub Sale Value ($)" value={githubValue} onChange={(e) => setGithubValue(e.target.value)} className="col-span-1" />
                  </div>

                  <div className="grid grid-cols-2 gap-2 items-center">
                    <Label className="text-muted-foreground col-span-1">Courses Sale Value ($)</Label>
                    <Input type="number" placeholder="Courses Sale Value ($)" value={coursesValue} onChange={(e) => setCoursesValue(e.target.value)} className="col-span-1" />
                  </div>

                  <div className="grid grid-cols-2 gap-2 items-center">
                    <Label className="text-muted-foreground col-span-1">Badge Value ($)</Label>
                    <Input type="number" placeholder="Badge Value ($)" value={badgeValue} onChange={(e) => setBadgeValue(e.target.value)} className="col-span-1" />
                  </div>

                  <div className="grid grid-cols-2 gap-2 items-center">
                    <Label className="text-muted-foreground col-span-1">Custom Add-on Label</Label>
                    <Input placeholder="Custom Add-on Label" value={customLabel} onChange={(e) => setCustomLabel(e.target.value)} className="col-span-1" />
                  </div>

                  <div className="grid grid-cols-2 gap-2 items-center">
                    <Label className="text-muted-foreground col-span-1">Custom Add-on Value ($)</Label>
                    <Input type="number" placeholder="Custom Add-on Value ($)" value={customValue} onChange={(e) => setCustomValue(e.target.value)} className="col-span-1" />
                  </div>

                  <div className="grid grid-cols-2 gap-2 items-center">
                    <Label className="text-muted-foreground col-span-1">No. of applications</Label>
                    <Input type="number" placeholder="No. of Job Applications per Month" value={noOfJobApps} onChange={(e) => setNoOfJobApps(e.target.value)} className="col-span-1" />
                  </div>

                  <div className="py-1">
                    <Label className="font-semibold">Total Amount : {Number(formattedTotalAmount).toFixed(2)} </Label>
                  </div>
                </div>

                {/* Commitments */}
                <div>
                  <Label className="font-semibold">Commitments</Label>
                  <Textarea placeholder="Enter commitments" value={commitments} onChange={(e) => setCommitments(e.target.value)} />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button variant="ghost" className="w-1/2 bg-black text-white hover:bg-orange-400" onClick={() => setShowPaymentDialog(false)}>
                    Cancel Payment ❌
                  </Button>
                  <Button onClick={handlePaymentClose} className="w-1/2 bg-blue-600 text-white hover:bg-blue-700">
                    Payment Done ✅
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>




          <Dialog open={showRevenueDialog} onOpenChange={setShowRevenueDialog}>
            <DialogContent aria-describedby="Monthly-revenue-breakdown" className="max-w-2xl sm:max-w-5xl">
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




          <Dialog open={showOnboardDialog} onOpenChange={setShowOnboardDialog}>
            <DialogContent aria-describedby="OnboardNewClientBox" className="max-w-5xl h-[90vh] overflow-hidden">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold text-gray-900">
                  🧾 Onboard New Client
                </DialogTitle>
              </DialogHeader>

              <div className="overflow-auto h-[75vh] px-1">
                {/* GRID STRUCTURE */}
                <div className="grid grid-cols-2 gap-4 ">

                  {/* 🔹 Client Details - LEFT BLOCK */}
                  <div className="border rounded p-4 space-y-3 ">
                    <div className="text-lg font-semibold mb-2"> Client Details <span className="text-red-600">*</span></div>
                    <Input placeholder="Client Full Name" className="placeholder:text-gray-900" value={clientName} onChange={(e) => setClientName(e.target.value)} required />
                    <Input placeholder="Client Email" className="placeholder:text-gray-900" type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} required />
                    <Input placeholder="Contact Number with country code (Eg: +1 1234567890)" className="placeholder:text-gray-900" value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} required />
                    <Input placeholder="City" className="placeholder:text-gray-900" value={city} onChange={(e) => setCity(e.target.value)} required />
                    <Input placeholder="Start Date" className="placeholder:text-gray-900" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
                  </div>

                  {/* 💳 Subscription & Payment Info - RIGHT BLOCK */}
                  <div className="border rounded p-4 space-y-3 ">
                    <div className="text-lg font-semibold mb-2"> Subscription & Payment Info <span className="text-red-600">*</span></div>

                    <Select value={paymentMode} onValueChange={setPaymentMode} required>
                      <SelectTrigger className="w-full"><SelectValue placeholder="Select Payment Mode" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UPI">UPI</SelectItem>
                        <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                        <SelectItem value="PayPal">PayPal</SelectItem>
                        <SelectItem value="Stripe">Stripe</SelectItem>
                        <SelectItem value="Credit/Debit Card">Credit/Debit Card</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>



                    {/* Subscription Duration Dropdown */}
                    <Select
                      value={subscriptionCycle}
                      onValueChange={(val) => {
                        setSubscriptionCycle(val);
                        const multiplier = subscriptionCycle === "60" ? 2 : subscriptionCycle === "90" ? 3 : 1;
                        setSubscriptionMultiplier(multiplier);


                      }}
                    >
                      <SelectTrigger className="w-full"><SelectValue placeholder="Subscription Duration" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">1 Month</SelectItem>
                        <SelectItem value="60">2 Months</SelectItem>
                        <SelectItem value="90">3 Months</SelectItem>
                      </SelectContent>
                    </Select>

                    {/* Subscription Sale Value Input */}
                    <Input
                      placeholder="Subscription Sale Value ($)"
                      className="placeholder:text-gray-900"
                      type="number"
                      value={subscriptionSaleValue}
                      onChange={(e) => setSubscriptionSaleValue(e.target.value)}
                      required
                    />

                    {/* 🔄 Auto-Calculated Subscription Total */}
                    <Input
                      readOnly
                      value={
                        subscriptionSaleValue
                          ? `$${Number(subscriptionSaleValue) * subscriptionMultiplier}`
                          : ""
                      }
                      placeholder="Auto Total (Subscription Only)"
                      className="bg-gray-50 border font-semibold text-gray-700"
                      title="This is calculated as per-month price × months"
                    />

                    <Select value={subscriptionSource} onValueChange={setSubscriptionSource}>
                      <SelectTrigger className="w-full"><SelectValue placeholder="Select Client Source" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Referral">Referral</SelectItem>
                        <SelectItem value="NEW">NEW</SelectItem>
                      </SelectContent>
                    </Select>


                    {/* <Input placeholder="Subscription Sale Value ($)" className="placeholder:text-gray-900" type="number" value={subscriptionSaleValue} onChange={(e) => setSubscriptionSaleValue(e.target.value)} required /> */}
                  </div>

                  {/* 🧩 Optional Add-On Services - FULL WIDTH */}
                  <div className="col-span-2 border rounded p-4 space-y-3">
                    <div className="text-lg font-semibold mb-2"> Optional Add-On Services</div>
                    <div className="grid grid-cols-2 gap-4">
                      <Input placeholder="Resume Sale Value ($)" className="placeholder:text-gray-900" type="number" value={resumeValue} onChange={(e) => setResumeValue(e.target.value)} />
                      <Input placeholder="Portfolio Creation Value ($)" className="placeholder:text-gray-900" type="number" value={portfolioValue} onChange={(e) => setPortfolioValue(e.target.value)} />
                      <Input placeholder="LinkedIn Optimization Value ($)" className="placeholder:text-gray-900" type="number" value={linkedinValue} onChange={(e) => setLinkedinValue(e.target.value)} />
                      <Input placeholder="GitHub Optimization Value ($)" className="placeholder:text-gray-900" type="number" value={githubValue} onChange={(e) => setGithubValue(e.target.value)} />
                    </div>
                  </div>

                  {/* 🧮 Auto Calculated - FULL WIDTH */}
                  <div className="col-span-2 border rounded p-4 ">
                    <div className="text-lg font-semibold mb-2"> Auto Calculated</div>
                    <div className="grid grid-cols-3 gap-4">
                      {/* <div className="font-medium text-gray-700">Total Sale Value: <span className="font-bold text-black">${totalSale}</span></div> */}
                      <div className="font-medium text-gray-700">
                        Total Sale Value: <span className="font-bold text-black">${totalSale}</span>
                      </div>
                      <div className="font-medium text-gray-700">
                        Next Payment Due Date: <span className="font-bold text-black">{dueDate || "-"}</span>
                      </div>

                      {/* <div className="font-medium text-gray-700">Next Payment Due Date: <span className="font-bold text-black">{dueDate || "-"}</span></div> */}
                      <div className="flex justify-end">
                        <Button onClick={handleOnboardClientSubmit}>Submit</Button>
                      </div>
                    </div>

                  </div>
                </div>


              </div>
            </DialogContent>
          </Dialog>


        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}