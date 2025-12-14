//app/sales/_components/SalesClosureDialog.tsx
"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { supabase } from "@/utils/supabase/client";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import * as XLSX from "xlsx";
import { Search, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

dayjs.extend(isBetween);

interface SalesClosureDialogProps {
    isOpen: boolean;
    onClose: () => void;
    currentUser: any;
    defaultMode?: "all" | "first"; // Prop to set initial mode
}

type SaleClosureRow = {
    id: string; // sales_closure id
    lead_id: string; // maps to leads.business_id
    lead_name: string | null;
    sale_value: number;
    closed_at: string | null;
    email: string;
    // Merged from leads
    assigned_to: string | null;
    assigned_at: string | null;
    phone: string | null;
    source: string | null;
};

export default function SalesClosureDialog({ isOpen, onClose, currentUser, defaultMode = "first" }: SalesClosureDialogProps) {
    const [data, setData] = useState<SaleClosureRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [totalRecords, setTotalRecords] = useState(0);

    // Report Mode
    const [reportMode, setReportMode] = useState<"all" | "first" | "renewal">("all");

    // Sync default mode on open
    useEffect(() => {
        if (isOpen && defaultMode) {
            setReportMode(defaultMode);
        }
    }, [isOpen, defaultMode]);

    // Role-based restriction
    useEffect(() => {
        if (currentUser?.roles === "Sales Associate") {
            setAssignedToFilter(currentUser.full_name);
            setPageSize(999999); // Default to 'All' for Sales Associates
        }
    }, [currentUser, isOpen]);

    // Filters
    const [searchTerm, setSearchTerm] = useState("");
    const [startDate, setStartDate] = useState<string>("");
    const [endDate, setEndDate] = useState<string>("");
    const [sourceFilter, setSourceFilter] = useState<string>("all");
    const [sources, setSources] = useState<string[]>([]);
    const [assignedToFilter, setAssignedToFilter] = useState<string>("all");
    const [assignedToOptions, setAssignedToOptions] = useState<string[]>([]);

    // Sorting
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" }>({
        key: "closed_at",
        direction: "asc", // Default: Oldest First
    });

    // Pagination
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(30);

    // Fetch sources on mount or open
    useEffect(() => {
        if (isOpen) {
            fetchSources();
        }
    }, [isOpen]);

    const fetchSources = async () => {
        const { data, error } = await supabase
            .from("leads")
            .select("source")
            .not("source", "is", null);

        if (!error && data) {
            // Unique sources
            const unique = Array.from(new Set(data.map((item: any) => item.source))).filter(Boolean);
            setSources(unique.sort());
        }

        // Fetch assigned_to
        const { data: assignedData, error: assignedErr } = await supabase
            .from("leads")
            .select("assigned_to")
            .not("assigned_to", "is", null);

        if (!assignedErr && assignedData) {
            const uniqueAssigned = Array.from(new Set(assignedData.map((item: any) => item.assigned_to))).filter(Boolean);
            setAssignedToOptions(uniqueAssigned.sort());
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchData();
        }
    }, [isOpen, page, pageSize, startDate, endDate, searchTerm, sourceFilter, assignedToFilter, sortConfig, reportMode]);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (isOpen) fetchData();
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const fetchData = async () => {
        try {
            setLoading(true);

            // --- STRATEGY SWITCH BASED ON REPORT MODE ---

            // MODE A: "FIRST SALES" (Existing Logic - Query Leads, get oldest sale)
            if (reportMode === "first") {
                // --- PHASE 1: Date Range Filter (First Sale Only) ---
                let dateFilteredIds: string[] | null = null;
                if (startDate && endDate) {
                    // A. Find leads with ANY sale in range
                    const { data: salesInDate, error: dateErr } = await supabase
                        .from("sales_closure")
                        .select("lead_id")
                        .gte("closed_at", dayjs(startDate).startOf("day").toISOString())
                        .lte("closed_at", dayjs(endDate).endOf("day").toISOString());

                    if (dateErr) throw dateErr;
                    const inRangeIds = new Set(salesInDate?.map((s) => s.lead_id) || []);

                    if (inRangeIds.size === 0) {
                        setData([]); setTotalRecords(0); setLoading(false); return;
                    }

                    // B. Find leads with sales BEFORE start date
                    const { data: salesBefore, error: beforeErr } = await supabase
                        .from("sales_closure")
                        .select("lead_id")
                        .lt("closed_at", dayjs(startDate).startOf("day").toISOString())
                        .in("lead_id", Array.from(inRangeIds));

                    if (beforeErr) throw beforeErr;
                    const priorIds = new Set(salesBefore?.map(s => s.lead_id));
                    dateFilteredIds = Array.from(inRangeIds).filter(id => !priorIds.has(id));

                    if (dateFilteredIds.length === 0) {
                        setData([]); setTotalRecords(0); setLoading(false); return;
                    }
                }

                // --- PHASE 2: Main Query on Leads ---
                let query = supabase
                    .from("leads")
                    .select("business_id, name, email, phone, source, assigned_to, assigned_at, current_stage", { count: "exact" })
                    .eq("current_stage", "sale done");

                if (dateFilteredIds !== null) query = query.in("business_id", dateFilteredIds);
                if (searchTerm) query = query.or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,business_id.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`);
                if (sourceFilter && sourceFilter !== "all") query = query.eq("source", sourceFilter);
                if (assignedToFilter && assignedToFilter !== "all") {
                    query = query.eq("assigned_to", assignedToFilter);
                }

                // Sorting (Server-side for Lead fields)
                if (["lead_id", "lead_name"].includes(sortConfig.key)) {
                    const col = sortConfig.key === "lead_id" ? "business_id" : "name";
                    query = query.order(col, { ascending: sortConfig.direction === "asc" });
                } else {
                    query = query.order("business_id", { ascending: true });
                }

                // Pagination
                const from = (page - 1) * pageSize;
                const to = from + pageSize - 1;
                const { data: leadsData, count, error: leadsError } = await query.range(from, to);
                if (leadsError) throw leadsError;

                setTotalRecords(count || 0);

                if (!leadsData || leadsData.length === 0) {
                    setData([]); setLoading(false); return;
                }

                // --- PHASE 3: Fetch Oldest Sales Record ---
                const businessIds = leadsData.map(l => l.business_id);
                const { data: salesData, error: salesErr } = await supabase
                    .from("sales_closure")
                    .select("*")
                    .in("lead_id", businessIds);
                if (salesErr) throw salesErr;

                const salesMap = new Map<string, any>();
                salesData?.forEach(sale => {
                    const existing = salesMap.get(sale.lead_id);
                    if (!existing || dayjs(sale.closed_at).isBefore(dayjs(existing.closed_at))) {
                        salesMap.set(sale.lead_id, sale);
                    }
                });

                // Merge
                const merged: SaleClosureRow[] = leadsData.map(lead => {
                    const sale = salesMap.get(lead.business_id);
                    return {
                        id: sale?.id || "N/A",
                        lead_id: lead.business_id,
                        lead_name: lead.name,
                        email: lead.email,
                        phone: lead.phone || "-",
                        source: lead.source || "-",
                        assigned_to: lead.assigned_to || "-",
                        assigned_at: lead.assigned_at,
                        sale_value: sale ? sale.sale_value : 0,
                        closed_at: sale ? sale.closed_at : null,
                    };
                });

                // Client-side sort for sales fields
                if (["sale_value", "closed_at"].includes(sortConfig.key)) {
                    merged.sort((a, b) => {
                        let valA = a[sortConfig.key as keyof SaleClosureRow];
                        let valB = b[sortConfig.key as keyof SaleClosureRow];
                        if (valA === valB) return 0;
                        if (valA === null) return 1; if (valB === null) return -1;
                        return sortConfig.direction === "asc" ? (valA < valB ? -1 : 1) : (valA > valB ? -1 : 1);
                    });
                }
                setData(merged);
            }
            // MODE B: "ALL SALES" or "RENEWAL" (Sales-First Query)
            else if (reportMode === "renewal") {
                const { data: allSales, error: allErr } = await supabase
                    .from("sales_closure")
                    .select("id, lead_id, closed_at");

                if (allErr) throw allErr;

                const groups = new Map<string, any[]>();
                allSales?.forEach(s => {
                    if (!groups.has(s.lead_id)) groups.set(s.lead_id, []);
                    groups.get(s.lead_id)?.push(s);
                });

                let renewalSaleIds: string[] = [];
                for (const [lid, sales] of groups.entries()) {
                    if (sales.length > 1) {
                        sales.sort((a, b) => dayjs(a.closed_at).valueOf() - dayjs(b.closed_at).valueOf());
                        const renewals = sales.slice(1);
                        renewals.forEach((r: any) => {
                            if (startDate && endDate) {
                                const d = dayjs(r.closed_at);
                                if (d.isBefore(startDate) || d.isAfter(endDate)) return;
                            }
                            renewalSaleIds.push(r.id);
                        });
                    }
                }

                if (renewalSaleIds.length === 0) {
                    setData([]); setTotalRecords(0); setLoading(false); return;
                }

                setTotalRecords(renewalSaleIds.length);
                const from = (page - 1) * pageSize;
                const to = from + pageSize;
                const pagedIds = renewalSaleIds.slice(from, to);
                if (pagedIds.length === 0) { setData([]); setLoading(false); return; }

                const { data: salesDetails, error: salesErr } = await supabase.from("sales_closure").select("*").in("id", pagedIds);
                if (salesErr) throw salesErr;

                const distinctLeadIds = Array.from(new Set(salesDetails?.map(s => s.lead_id)));
                const { data: leadsInfo, error: leadsErr } = await supabase
                    .from("leads")
                    .select("business_id, name, email, phone, source, assigned_to, assigned_at")
                    .in("business_id", distinctLeadIds);
                if (leadsErr) throw leadsErr;

                const leadMap = new Map(leadsInfo?.map(l => [l.business_id, l]));
                let merged = salesDetails?.map(sale => {
                    const l = leadMap.get(sale.lead_id);
                    return {
                        id: sale.id, lead_id: sale.lead_id,
                        lead_name: l?.name || "-", email: l?.email || "-", phone: l?.phone || "-", source: l?.source || "-",
                        assigned_to: l?.assigned_to || "-", assigned_at: l?.assigned_at || null,
                        sale_value: sale.sale_value, closed_at: sale.closed_at,
                    };
                }) || [];

                if (sourceFilter && sourceFilter !== "all") {
                    merged = merged.filter(x => x.source === sourceFilter);
                }
                if (assignedToFilter && assignedToFilter !== "all") {
                    merged = merged.filter(x => x.assigned_to === assignedToFilter);
                }

                if (["sale_value", "closed_at"].includes(sortConfig.key)) {
                    merged.sort((a, b: any) => {
                        let valA = a[sortConfig.key as keyof SaleClosureRow]; let valB = b[sortConfig.key as keyof SaleClosureRow];
                        if (valA === valB) return 0; if (valA === null) return 1; if (valB === null) return -1;
                        return sortConfig.direction === "asc" ? (valA < valB ? -1 : 1) : (valA > valB ? -1 : 1);
                    });
                }
                setData(merged);
            }
            else {
                let query = supabase.from("sales_closure").select("*", { count: "exact" });

                if (startDate && endDate) {
                    query = query.gte("closed_at", dayjs(startDate).startOf("day").toISOString())
                        .lte("closed_at", dayjs(endDate).endOf("day").toISOString());
                }

                if (searchTerm && reportMode === "all") {
                    query = query.ilike('lead_id', `%${searchTerm}%`);
                }

                if (["sale_value", "closed_at"].includes(sortConfig.key)) {
                    query = query.order(sortConfig.key, { ascending: sortConfig.direction === "asc" });
                } else {
                    query = query.order("closed_at", { ascending: false });
                }

                const from = (page - 1) * pageSize;
                const to = from + pageSize - 1;
                const { data: salesData, count, error } = await query.range(from, to);
                if (error) throw error;

                setTotalRecords(count || 0);

                if (!salesData || salesData.length === 0) {
                    setData([]); setLoading(false); return;
                }

                const leadIds = Array.from(new Set(salesData.map(s => s.lead_id)));
                const { data: leadsInfo, error: leadsErr } = await supabase
                    .from("leads")
                    .select("business_id, name, email, phone, source, assigned_to, assigned_at")
                    .in("business_id", leadIds);

                if (leadsErr) throw leadsErr;
                const leadMap = new Map(leadsInfo?.map(l => [l.business_id, l]));

                let merged = salesData.map(sale => {
                    const l = leadMap.get(sale.lead_id);
                    return {
                        id: sale.id, lead_id: sale.lead_id,
                        lead_name: l?.name || "-", email: l?.email || "-", phone: l?.phone || "-", source: l?.source || "-",
                        assigned_to: l?.assigned_to || "-", assigned_at: l?.assigned_at || null,
                        sale_value: sale.sale_value, closed_at: sale.closed_at,
                    };
                });

                if (sourceFilter && sourceFilter !== "all") {
                    merged = merged.filter(x => x.source === sourceFilter);
                }
                if (assignedToFilter && assignedToFilter !== "all") {
                    merged = merged.filter(x => x.assigned_to === assignedToFilter);
                }

                setData(merged);
            }

        } catch (err: any) {
            console.error("Error fetching leads/sales data:", err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSort = (key: string) => {
        setSortConfig((prev) => ({
            key,
            direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
        }));
    };

    const handleExport = async () => {
        try {
            // MODE A: "FIRST SALES"
            if (reportMode === "first") {
                let dateFilteredIds: string[] | null = null;
                if (startDate && endDate) {
                    const { data: salesInDate, error: dateErr } = await supabase
                        .from("sales_closure")
                        .select("lead_id")
                        .gte("closed_at", dayjs(startDate).startOf("day").toISOString())
                        .lte("closed_at", dayjs(endDate).endOf("day").toISOString());

                    if (dateErr) throw dateErr;
                    const inRangeIds = new Set(salesInDate?.map((s) => s.lead_id) || []);

                    if (inRangeIds.size === 0) { alert("No data to export"); return; }

                    const { data: salesBefore, error: beforeErr } = await supabase
                        .from("sales_closure")
                        .select("lead_id")
                        .lt("closed_at", dayjs(startDate).startOf("day").toISOString())
                        .in("lead_id", Array.from(inRangeIds));

                    if (beforeErr) throw beforeErr;
                    const priorIds = new Set(salesBefore?.map(s => s.lead_id));
                    dateFilteredIds = Array.from(inRangeIds).filter(id => !priorIds.has(id));

                    if (dateFilteredIds.length === 0) { alert("No data to export"); return; }
                }

                let query = supabase
                    .from("leads")
                    .select("business_id, name, email, phone, source, assigned_to, assigned_at, current_stage")
                    .eq("current_stage", "sale done");

                if (dateFilteredIds !== null) query = query.in("business_id", dateFilteredIds);
                if (searchTerm) query = query.or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,business_id.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`);
                if (sourceFilter && sourceFilter !== "all") query = query.eq("source", sourceFilter);
                if (assignedToFilter && assignedToFilter !== "all") query = query.eq("assigned_to", assignedToFilter);

                if (["lead_id", "lead_name"].includes(sortConfig.key)) {
                    const col = sortConfig.key === "lead_id" ? "business_id" : "name";
                    query = query.order(col, { ascending: sortConfig.direction === "asc" });
                }

                const { data: allLeads, error } = await query;
                if (error) throw error;
                if (!allLeads || allLeads.length === 0) { alert("No data to export"); return; }

                const businessIds = allLeads.map(l => l.business_id);
                const { data: salesData, error: salesErr } = await supabase
                    .from("sales_closure")
                    .select("*")
                    .in("lead_id", businessIds);
                if (salesErr) throw salesErr;

                const salesMap = new Map<string, any>();
                salesData?.forEach(sale => {
                    const existing = salesMap.get(sale.lead_id);
                    if (!existing || dayjs(sale.closed_at).isBefore(dayjs(existing.closed_at))) {
                        salesMap.set(sale.lead_id, sale);
                    }
                });

                let exportDataRaw = allLeads.map(lead => {
                    const sale = salesMap.get(lead.business_id);
                    return {
                        "Lead ID": lead.business_id,
                        "Client Name": lead.name,
                        "Email": lead.email,
                        "Phone": lead.phone || "-",
                        "Source": lead.source || "-",
                        "Sale Value": sale ? sale.sale_value : 0,
                        "Closed At": sale?.closed_at ? dayjs(sale.closed_at).format("YYYY-MM-DD") : "-",
                        "Assigned To": lead.assigned_to || "-",
                        "Assigned At": lead.assigned_at ? dayjs(lead.assigned_at).format("YYYY-MM-DD") : "-",
                        "Payment Mode": sale?.payment_mode || "-",
                    };
                });

                if (["sale_value", "closed_at"].includes(sortConfig.key)) {
                    exportDataRaw.sort((a, b) => {
                        let valA: any = sortConfig.key === "sale_value" ? a["Sale Value"] : a["Closed At"];
                        let valB: any = sortConfig.key === "sale_value" ? b["Sale Value"] : b["Closed At"];
                        if (valA === valB) return 0; if (valA === "-" || valA === 0) return 1;
                        return sortConfig.direction === "asc" ? (valA < valB ? -1 : 1) : (valA > valB ? -1 : 1);
                    });
                }

                const ws = XLSX.utils.json_to_sheet(exportDataRaw);
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, "Sales Closure (First)");
                XLSX.writeFile(wb, `Sales_Desc_First_${dayjs().format("YYYY-MM-DD")}.xlsx`);
            }
            // MODE B: "ONLY RENEWALS"
            else if (reportMode === "renewal") {
                const { data: allSales, error: allErr } = await supabase.from("sales_closure").select("id, lead_id, closed_at");
                if (allErr) throw allErr;

                const groups = new Map<string, any[]>();
                allSales?.forEach(s => {
                    if (!groups.has(s.lead_id)) groups.set(s.lead_id, []);
                    groups.get(s.lead_id)?.push(s);
                });

                let renewalSaleIds: string[] = [];
                for (const [lid, sales] of groups.entries()) {
                    if (sales.length > 1) {
                        sales.sort((a, b) => dayjs(a.closed_at).valueOf() - dayjs(b.closed_at).valueOf());
                        const renewals = sales.slice(1);
                        renewals.forEach((r: any) => {
                            if (startDate && endDate) {
                                const d = dayjs(r.closed_at);
                                if (d.isBefore(startDate) || d.isAfter(endDate)) return;
                            }
                            renewalSaleIds.push(r.id);
                        });
                    }
                }

                if (renewalSaleIds.length === 0) { alert("No renewal data found"); return; }

                const { data: salesDetails, error: salesErr } = await supabase.from("sales_closure").select("*").in("id", renewalSaleIds);
                if (salesErr) throw salesErr;

                const distinctLeadIds = Array.from(new Set(salesDetails?.map(s => s.lead_id)));
                const { data: leadsInfo, error: leadsErr } = await supabase
                    .from("leads")
                    .select("business_id, name, email, phone, source, assigned_to, assigned_at")
                    .in("business_id", distinctLeadIds);
                if (leadsErr) throw leadsErr;

                const leadMap = new Map(leadsInfo?.map(l => [l.business_id, l]));

                let exportDataRaw = salesDetails?.map(sale => {
                    const l = leadMap.get(sale.lead_id);
                    return {
                        "Lead ID": sale.lead_id,
                        "Client Name": l?.name || "-",
                        "Email": l?.email || "-",
                        "Phone": l?.phone || "-",
                        "Source": l?.source || "-",
                        "Sale Value": sale.sale_value,
                        "Closed At": sale.closed_at ? dayjs(sale.closed_at).format("YYYY-MM-DD") : "-",
                        "Assigned To": l?.assigned_to || "-",
                        "Assigned At": l?.assigned_at ? dayjs(l?.assigned_at).format("YYYY-MM-DD") : "-",
                        "Payment Mode": sale.payment_mode || "-",
                    };
                }) || [];

                if (["sale_value", "closed_at"].includes(sortConfig.key)) {
                    exportDataRaw.sort((a, b: any) => {
                        let valA = sortConfig.key === "sale_value" ? a["Sale Value"] : a["Closed At"];
                        let valB = sortConfig.key === "sale_value" ? b["Sale Value"] : b["Closed At"];
                        if (valA === valB) return 0; if (valA === "-" || valA === 0) return 1;
                        return sortConfig.direction === "asc" ? (valA < valB ? -1 : 1) : (valA > valB ? -1 : 1);
                    });
                }

                const ws = XLSX.utils.json_to_sheet(exportDataRaw);
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, "Renewals");
                XLSX.writeFile(wb, `Sales_Renewals_${dayjs().format("YYYY-MM-DD")}.xlsx`);
            }
            // MODE C: "ALL SALES"
            else {
                let query = supabase.from("sales_closure").select("*");

                if (startDate && endDate) {
                    query = query.gte("closed_at", dayjs(startDate).startOf("day").toISOString())
                        .lte("closed_at", dayjs(endDate).endOf("day").toISOString());
                }

                if (searchTerm && reportMode === "all") {
                    query = query.ilike('lead_id', `%${searchTerm}%`);
                }

                if (["sale_value", "closed_at"].includes(sortConfig.key)) {
                    query = query.order(sortConfig.key, { ascending: sortConfig.direction === "asc" });
                } else {
                    query = query.order("closed_at", { ascending: false });
                }

                const { data: salesData, error } = await query;
                if (error) throw error;
                if (!salesData || salesData.length === 0) { alert("No data to export"); return; }

                const leadIds = Array.from(new Set(salesData.map(s => s.lead_id)));
                const { data: leadsInfo, error: leadsErr } = await supabase
                    .from("leads")
                    .select("business_id, name, email, phone, source, assigned_to, assigned_at")
                    .in("business_id", leadIds);

                if (leadsErr) throw leadsErr;
                const leadMap = new Map(leadsInfo?.map(l => [l.business_id, l]));

                let exportDataRaw = salesData.map(sale => {
                    const l = leadMap.get(sale.lead_id);
                    return {
                        "Lead ID": sale.lead_id,
                        "Client Name": l?.name || "-",
                        "Email": l?.email || "-",
                        "Phone": l?.phone || "-",
                        "Source": l?.source || "-",
                        "Sale Value": sale.sale_value,
                        "Closed At": sale.closed_at ? dayjs(sale.closed_at).format("YYYY-MM-DD") : "-",
                        "Assigned To": l?.assigned_to || "-",
                        "Assigned At": l?.assigned_at ? dayjs(l?.assigned_at).format("YYYY-MM-DD") : "-",
                        "Payment Mode": sale.payment_mode || "-",
                    };
                });

                if (sourceFilter && sourceFilter !== "all") {
                    exportDataRaw = exportDataRaw.filter(x => x["Source"] === sourceFilter);
                }
                if (assignedToFilter && assignedToFilter !== "all") {
                    exportDataRaw = exportDataRaw.filter(x => x["Assigned To"] === assignedToFilter);
                }

                const ws = XLSX.utils.json_to_sheet(exportDataRaw);
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, "All Sales");
                XLSX.writeFile(wb, `Sales_All_${dayjs().format("YYYY-MM-DD")}.xlsx`);
            }

        } catch (e: any) {
            console.error("Export failed:", e);
            alert("Export failed: " + (e?.message || "Unknown error"));
        }
    };

    const renderSortIcon = (key: string) => {
        if (sortConfig.key !== key) return <ArrowUpDown className="h-4 w-4 ml-1 text-gray-400" />;
        return sortConfig.direction === "asc" ? <ArrowUp className="h-4 w-4 ml-1 text-blue-600" /> : <ArrowDown className="h-4 w-4 ml-1 text-blue-600" />;
    };

    return (
        <Dialog open={isOpen} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="w-[95vw] max-w-[95vw] h-[95vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Sales Closure Records</DialogTitle>
                    {/* Report Mode Selection */}
                    <div className="flex gap-4 pt-2 pb-2">
                        <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                                type="radio"
                                name="rmode"
                                className="accent-blue-600"
                                checked={reportMode === "all"}
                                onChange={() => setReportMode("all")}
                            />
                            <span className="text-sm font-medium">All Sales</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                                type="radio"
                                name="rmode"
                                className="accent-blue-600"
                                checked={reportMode === "first"}
                                onChange={() => setReportMode("first")}
                            />
                            <span className="text-sm font-medium">Only First Sales</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                                type="radio"
                                name="rmode"
                                className="accent-blue-600"
                                checked={reportMode === "renewal"}
                                onChange={() => setReportMode("renewal")}
                            />
                            <span className="text-sm font-medium">Only Renewals</span>
                        </label>
                    </div>
                </DialogHeader>

                {/* Filters */}
                <div className="flex flex-wrap items-end gap-4 py-2">
                    {/* Search */}
                    <div className="grid w-full max-w-sm items-center gap-1.5">
                        <Label htmlFor="search">Search</Label>
                        <div className="relative">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="search"
                                placeholder="Name, Email, ID..."
                                className="pl-8"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Source Filter */}
                    <div className="grid w-full max-w-[200px] items-center gap-1.5">
                        <Label>Source</Label>
                        <Select value={sourceFilter} onValueChange={setSourceFilter}>
                            <SelectTrigger>
                                <SelectValue placeholder="All Sources" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Sources</SelectItem>
                                {sources.map(src => <SelectItem key={src} value={src}>{src}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Assigned To Filter - Hide for Sales Associate */}
                    {currentUser?.roles !== "Sales Associate" && (
                        <div className="grid w-full max-w-[200px] items-center gap-1.5">
                            <Label>Assigned To</Label>
                            <Select value={assignedToFilter} onValueChange={setAssignedToFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All Users" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Users</SelectItem>
                                    {assignedToOptions.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {/* Date Range */}
                    <div className="grid w-full max-w-sm items-center gap-1.5">
                        <Label>Date Range (Closed At)</Label>
                        <div className="flex gap-2 items-center">
                            <Input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                            <Input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                            {/* Clear Button */}
                            {(startDate || endDate) && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => { setStartDate(""); setEndDate(""); }}
                                    className="h-9 px-2 text-gray-50 hover:text-destructive bg-gray-900"
                                    title="Clear Dates"
                                >
                                    Clear Date filter
                                </Button>
                            )}
                        </div>
                    </div>



                    <Button onClick={handleExport} variant="outline" className="ml-auto">
                        Export to Excel
                    </Button>
                    <div>
                        <Label>Rows per page</Label>
                        <Select
                            value={pageSize === 999999 ? "all" : String(pageSize)}
                            onValueChange={(v) => {
                                if (v === "all") {
                                    setPageSize(999999);
                                } else {
                                    setPageSize(Number(v));
                                }
                                setPage(1);
                            }}
                        >
                            <SelectTrigger className="w-[120px]">
                                <SelectValue placeholder="Rows per page" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="30">30 per page</SelectItem>
                                <SelectItem value="50">50 per page</SelectItem>
                                <SelectItem value="100">100 per page</SelectItem>
                                <SelectItem value="200">200 per page</SelectItem>
                                <SelectItem value="500">500 per page</SelectItem>
                                <SelectItem value="1000">1000 per page</SelectItem>
                                <SelectItem value="all">All</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                </div>

                {/* Table */}
                <div className="flex-1 overflow-auto border rounded-md">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>S.no</TableHead>
                                <TableHead className="cursor-pointer select-none" onClick={() => handleSort("lead_id")}>
                                    <div className="flex items-center">Lead ID {renderSortIcon("lead_id")}</div>
                                </TableHead>
                                <TableHead className="cursor-pointer select-none" onClick={() => handleSort("lead_name")}>
                                    <div className="flex items-center">Client Name {renderSortIcon("lead_name")}</div>
                                </TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Phone</TableHead>
                                <TableHead>Source</TableHead>
                                <TableHead className="cursor-pointer select-none" onClick={() => handleSort("sale_value")}>
                                    <div className="flex items-center">Sale Value {renderSortIcon("sale_value")}</div>
                                </TableHead>
                                <TableHead className="cursor-pointer select-none" onClick={() => handleSort("closed_at")}>
                                    <div className="flex items-center">Closed At {renderSortIcon("closed_at")}</div>
                                </TableHead>
                                <TableHead>Assigned To</TableHead>
                                <TableHead>Assigned At</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={9} className="text-center h-24">Loading...</TableCell>
                                </TableRow>
                            ) : data.length > 0 ? (
                                data.map((row, idx) => (
                                    <TableRow key={row.id}>
                                        <TableCell>{idx + 1}</TableCell>
                                        <TableCell>{row.lead_id}</TableCell>
                                        {/* <TableCell className="font-medium">{row.lead_name}</TableCell> */}
                                         <TableCell
                                            className="font-medium max-w-[150px] break-words whitespace-normal cursor-pointer text-blue-600 hover:underline"
                                            onClick={() => window.open(`/leads/${row.lead_id}`, "_blank")}
                                        >
                                            {row.lead_name}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">{row.email}</TableCell>
                                        <TableCell>{row.phone}</TableCell>
                                        <TableCell>{row.source}</TableCell>
                                        <TableCell>${row.sale_value}</TableCell>
                                        <TableCell>
                                            {row.closed_at ? dayjs(row.closed_at).format("DD MMM YYYY") : "-"}
                                        </TableCell>
                                        <TableCell>{row.assigned_to}</TableCell>
                                        <TableCell>
                                            {row.assigned_at ? dayjs(row.assigned_at).format("DD MMM YYYY") : "-"}
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={9} className="text-center h-24">No records found.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* PaginationFooter */}
                <div className="flex items-center justify-between py-2 border-t mt-auto px-2">
                    <div className="text-sm text-muted-foreground">
                        Total: {totalRecords} records
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                        >
                            Previous
                        </Button>
                        <span className="text-sm">Page {page}</span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(p => p + 1)}
                            disabled={page * pageSize >= totalRecords}
                        >
                            Next
                        </Button>


                    </div>
                </div>

            </DialogContent>
        </Dialog>
    );
}




// //app/sales/_components/SalesClosureDialog.tsx
// "use client";

// import { useState, useEffect } from "react";
// import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
// import { Input } from "@/components/ui/input";
// import { Button } from "@/components/ui/button";
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { Label } from "@/components/ui/label";
// import { supabase } from "@/utils/supabase/client";
// import dayjs from "dayjs";
// import isBetween from "dayjs/plugin/isBetween";
// import * as XLSX from "xlsx";
// import { Search, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

// dayjs.extend(isBetween);

// interface SalesClosureDialogProps {
//     isOpen: boolean;
//     onClose: () => void;
//     currentUser: any;
//     defaultMode?: "all" | "first"; // Prop to set initial mode
// }

// type SaleClosureRow = {
//     id: string; // sales_closure id
//     lead_id: string; // maps to leads.business_id
//     lead_name: string | null;
//     sale_value: number;
//     closed_at: string | null;
//     email: string;
//     // Merged from leads
//     assigned_to: string | null;
//     assigned_at: string | null;
//     phone: string | null;
//     source: string | null;
// };

// export default function SalesClosureDialog({ isOpen, onClose, currentUser, defaultMode = "first" }: SalesClosureDialogProps) {
//     const [data, setData] = useState<SaleClosureRow[]>([]);
//     const [loading, setLoading] = useState(false);
//     const [totalRecords, setTotalRecords] = useState(0);

//     // Report Mode
//     const [reportMode, setReportMode] = useState<"all" | "first" | "renewal">("all");

//     // Sync default mode on open
//     useEffect(() => {
//         if (isOpen && defaultMode) {
//             setReportMode(defaultMode);
//         }
//     }, [isOpen, defaultMode]);

//     // Role-based restriction
//     useEffect(() => {
//         if (currentUser?.roles === "Sales Associate") {
//             setAssignedToFilter(currentUser.full_name);
//             setPageSize(999999); // Default to 'All' for Sales Associates
//         }
//     }, [currentUser, isOpen]);

//     // Filters
//     const [searchTerm, setSearchTerm] = useState("");
//     const [startDate, setStartDate] = useState<string>("");
//     const [endDate, setEndDate] = useState<string>("");
//     const [sourceFilter, setSourceFilter] = useState<string>("all");
//     const [sources, setSources] = useState<string[]>([]);
//     const [assignedToFilter, setAssignedToFilter] = useState<string>("all");
//     const [assignedToOptions, setAssignedToOptions] = useState<string[]>([]);

//     // Sorting
//     const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" }>({
//         key: "closed_at",
//         direction: "asc", // Default: Oldest First
//     });

//     // Pagination
//     const [page, setPage] = useState(1);
//     const [pageSize, setPageSize] = useState(30);

//     // Fetch sources on mount or open
//     useEffect(() => {
//         if (isOpen) {
//             fetchSources();
//         }
//     }, [isOpen]);

//     const fetchSources = async () => {
//         const { data, error } = await supabase
//             .from("leads")
//             .select("source")
//             .not("source", "is", null);

//         if (!error && data) {
//             // Unique sources
//             const unique = Array.from(new Set(data.map((item: any) => item.source))).filter(Boolean);
//             setSources(unique.sort());
//         }

//         // Fetch assigned_to
//         const { data: assignedData, error: assignedErr } = await supabase
//             .from("leads")
//             .select("assigned_to")
//             .not("assigned_to", "is", null);

//         if (!assignedErr && assignedData) {
//             const uniqueAssigned = Array.from(new Set(assignedData.map((item: any) => item.assigned_to))).filter(Boolean);
//             setAssignedToOptions(uniqueAssigned.sort());
//         }
//     };

//     useEffect(() => {
//         if (isOpen) {
//             fetchData();
//         }
//     }, [isOpen, page, pageSize, startDate, endDate, searchTerm, sourceFilter, assignedToFilter, sortConfig, reportMode]);

//     // Debounce search
//     useEffect(() => {
//         const timer = setTimeout(() => {
//             if (isOpen) fetchData();
//         }, 500);
//         return () => clearTimeout(timer);
//     }, [searchTerm]);

//     const fetchData = async () => {
//         try {
//             setLoading(true);

//             // --- COMMON STEP 1: FILTER LEADS FIRST ---
//             // We need to know which Lead IDs match the metadata filters (Search, Source, Assigned To).
//             // This is crucial for accurate 'Total Records' count.

//             let leadsQuery = supabase
//                 .from("leads")
//                 .select("business_id, name, email, phone, source, assigned_to, assigned_at, current_stage");

//             // 1. Apply Metadata Filters to Leads
//             if (searchTerm) {
//                 leadsQuery = leadsQuery.or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,business_id.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`);
//             }
//             if (sourceFilter && sourceFilter !== "all") {
//                 leadsQuery = leadsQuery.eq("source", sourceFilter);
//             }
//             if (assignedToFilter && assignedToFilter !== "all") {
//                 leadsQuery = leadsQuery.eq("assigned_to", assignedToFilter);
//             }

//             const { data: matchedLeads, error: leadsErr } = await leadsQuery;
//             if (leadsErr) throw leadsErr;

//             if (!matchedLeads || matchedLeads.length === 0) {
//                 setData([]); setTotalRecords(0); setLoading(false); return;
//             }

//             const validLeadIds = new Set(matchedLeads.map(l => l.business_id));
//             const leadMap = new Map(matchedLeads.map(l => [l.business_id, l]));

//             // --- STRATEGY SWITCH BASED ON REPORT MODE ---

//             // MODE A: "FIRST SALES" (Oldest sale for each matching lead)
//             if (reportMode === "first") {
//                 let targetLeadIds = Array.from(validLeadIds);

//                 // 2. Apply Date Range Filter (To the sales data)
//                 // Logic: We only want leads where the *first* sale is in the range.
//                 if (startDate && endDate) {
//                     // Get all sales for these leads
//                     const { data: allSales, error: salesErr } = await supabase
//                         .from("sales_closure")
//                         .select("lead_id, closed_at")
//                         .in("lead_id", targetLeadIds);

//                     if (salesErr) throw salesErr;

//                     const firstSaleDateMap = new Map<string, string>(); // lead_id -> closed_at
//                     allSales?.forEach(s => {
//                         const existing = firstSaleDateMap.get(s.lead_id);
//                         if (!existing || dayjs(s.closed_at).isBefore(dayjs(existing))) {
//                             firstSaleDateMap.set(s.lead_id, s.closed_at);
//                         }
//                     });

//                     // Filter leads where first sale is in range
//                     targetLeadIds = targetLeadIds.filter(id => {
//                         const firstDate = firstSaleDateMap.get(id);
//                         return firstDate && dayjs(firstDate).isBetween(dayjs(startDate).startOf("day"), dayjs(endDate).endOf("day"), null, "[]");
//                     });
//                 } else {
//                     // If no date range, we still need to ensure they HAVE a sale.
//                     const { data: salesCheck, error: checkErr } = await supabase
//                         .from("sales_closure")
//                         .select("lead_id")
//                         .in("lead_id", targetLeadIds);
//                     if (checkErr) throw checkErr;
//                     const hasSaleIds = new Set(salesCheck?.map(s => s.lead_id));
//                     targetLeadIds = targetLeadIds.filter(id => hasSaleIds.has(id));
//                 }

//                 setTotalRecords(targetLeadIds.length);

//                 // 3. Paginate Lead IDs
//                 const from = (page - 1) * pageSize;
//                 const to = from + pageSize;
//                 const pagedIds = targetLeadIds.slice(from, to);

//                 if (pagedIds.length === 0) {
//                     setData([]); setLoading(false); return;
//                 }

//                 // 4. Fetch Sales Details for Paged Leads
//                 const { data: pagedSales, error: pSalesErr } = await supabase
//                     .from("sales_closure")
//                     .select("*")
//                     .in("lead_id", pagedIds);
//                 if (pSalesErr) throw pSalesErr;

//                 // Find first sale again for the rows
//                 const salesRowMap = new Map<string, any>();
//                 pagedSales?.forEach(sale => {
//                     const existing = salesRowMap.get(sale.lead_id);
//                     if (!existing || dayjs(sale.closed_at).isBefore(dayjs(existing.closed_at))) {
//                         salesRowMap.set(sale.lead_id, sale);
//                     }
//                 });

//                 const merged: SaleClosureRow[] = pagedIds.map(leadId => {
//                     const l = leadMap.get(leadId);
//                     const s = salesRowMap.get(leadId);
//                     return {
//                         id: s?.id || "N/A",
//                         lead_id: leadId,
//                         lead_name: l?.name || "-", email: l?.email || "-", phone: l?.phone || "-", source: l?.source || "-",
//                         assigned_to: l?.assigned_to || "-", assigned_at: l?.assigned_at || null,
//                         sale_value: s?.sale_value || 0, closed_at: s?.closed_at || null,
//                     };
//                 });

//                 // Sort
//                 if (["sale_value", "closed_at"].includes(sortConfig.key)) {
//                     merged.sort((a, b: any) => {
//                         let valA = a[sortConfig.key as keyof SaleClosureRow]; let valB = b[sortConfig.key as keyof SaleClosureRow];
//                         if (valA === valB) return 0; if (valA === null) return 1; if (valB === null) return -1;
//                         return sortConfig.direction === "asc" ? (valA < valB ? -1 : 1) : (valA > valB ? -1 : 1);
//                     });
//                 }
//                 setData(merged);
//             }

//             // MODE B: "RENEWALS" (2nd+ sale)
//             else if (reportMode === "renewal") {
//                 const targetLeadIds = Array.from(validLeadIds);

//                 // Get ALL sales for these matching leads to determine renewals
//                 const { data: allSales, error: allErr } = await supabase
//                     .from("sales_closure")
//                     .select("id, lead_id, closed_at, sale_value, payment_mode")
//                     .in("lead_id", targetLeadIds);

//                 if (allErr) throw allErr;

//                 // Group and find renewals
//                 const groups = new Map<string, any[]>();
//                 allSales?.forEach(s => {
//                     if (!groups.has(s.lead_id)) groups.set(s.lead_id, []);
//                     groups.get(s.lead_id)?.push(s);
//                 });

//                 let renewalSales: any[] = [];
//                 groups.forEach((sales) => {
//                     if (sales.length > 1) {
//                         sales.sort((a, b) => dayjs(a.closed_at).valueOf() - dayjs(b.closed_at).valueOf());
//                         // Skip first, define rest as renewals
//                         const renewals = sales.slice(1);
//                         renewals.forEach(r => {
//                             if (startDate && endDate) {
//                                 const d = dayjs(r.closed_at);
//                                 if (d.isBefore(startDate) || d.isAfter(endDate)) return;
//                             }
//                             renewalSales.push(r);
//                         });
//                     }
//                 });

//                 setTotalRecords(renewalSales.length);

//                 // Paginate the SALES list
//                 if (["sale_value", "closed_at"].includes(sortConfig.key)) {
//                     renewalSales.sort((a, b: any) => {
//                         let valA = a[sortConfig.key]; let valB = b[sortConfig.key];
//                         if (valA === valB) return 0; if (valA === null) return 1; if (valB === null) return -1;
//                         return sortConfig.direction === "asc" ? (valA < valB ? -1 : 1) : (valA > valB ? -1 : 1);
//                     });
//                 } else {
//                     // Default sort by date
//                     renewalSales.sort((a, b) => dayjs(a.closed_at).valueOf() - dayjs(b.closed_at).valueOf());
//                 }

//                 const from = (page - 1) * pageSize;
//                 const to = from + pageSize;
//                 const pagedSales = renewalSales.slice(from, to);

//                 const merged = pagedSales.map(s => {
//                     const l = leadMap.get(s.lead_id);
//                     return {
//                         id: s.id, lead_id: s.lead_id,
//                         lead_name: l?.name || "-", email: l?.email || "-", phone: l?.phone || "-", source: l?.source || "-",
//                         assigned_to: l?.assigned_to || "-", assigned_at: l?.assigned_at || null,
//                         sale_value: s.sale_value, closed_at: s.closed_at
//                     };
//                 });
//                 setData(merged);
//             }

//             // MODE C: "ALL SALES"
//             else {
//                 // We have validLeadIds. Now query sales constrained by these IDs.
//                 // This ensures "Total Records" only counts sales belonging to the filtered leads.

//                 let salesQuery = supabase
//                     .from("sales_closure")
//                     .select("*", { count: "exact" })
//                     .in("lead_id", Array.from(validLeadIds));

//                 if (startDate && endDate) {
//                     salesQuery = salesQuery
//                         .gte("closed_at", dayjs(startDate).startOf("day").toISOString())
//                         .lte("closed_at", dayjs(endDate).endOf("day").toISOString());
//                 }

//                 if (sortConfig.key === "sale_value" || sortConfig.key === "closed_at") {
//                     salesQuery = salesQuery.order(sortConfig.key, { ascending: sortConfig.direction === "asc" });
//                 } else {
//                     salesQuery = salesQuery.order("closed_at", { ascending: false });
//                 }

//                 const from = (page - 1) * pageSize;
//                 const to = from + pageSize - 1;

//                 const { data: salesData, count, error: salesErr } = await salesQuery.range(from, to);
//                 if (salesErr) throw salesErr;

//                 setTotalRecords(count || 0);

//                 const merged = (salesData || []).map(s => {
//                     const l = leadMap.get(s.lead_id);
//                     return {
//                         id: s.id, lead_id: s.lead_id,
//                         lead_name: l?.name || "-", email: l?.email || "-", phone: l?.phone || "-", source: l?.source || "-",
//                         assigned_to: l?.assigned_to || "-", assigned_at: l?.assigned_at || null,
//                         sale_value: s.sale_value, closed_at: s.closed_at
//                     };
//                 });
//                 setData(merged);
//             }

//         } catch (err: any) {
//             console.error("Error fetching data:", err.message);
//         } finally {
//             setLoading(false);
//         }
//     };

//     const handleSort = (key: string) => {
//         setSortConfig((prev) => ({
//             key,
//             direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
//         }));
//     };

//     const handleExport = async () => {
//         try {
//             // MODE A: "FIRST SALES"
//             if (reportMode === "first") {
//                 let dateFilteredIds: string[] | null = null;
//                 if (startDate && endDate) {
//                     const { data: salesInDate, error: dateErr } = await supabase
//                         .from("sales_closure")
//                         .select("lead_id")
//                         .gte("closed_at", dayjs(startDate).startOf("day").toISOString())
//                         .lte("closed_at", dayjs(endDate).endOf("day").toISOString());

//                     if (dateErr) throw dateErr;
//                     const inRangeIds = new Set(salesInDate?.map((s) => s.lead_id) || []);

//                     if (inRangeIds.size === 0) { alert("No data to export"); return; }

//                     const { data: salesBefore, error: beforeErr } = await supabase
//                         .from("sales_closure")
//                         .select("lead_id")
//                         .lt("closed_at", dayjs(startDate).startOf("day").toISOString())
//                         .in("lead_id", Array.from(inRangeIds));

//                     if (beforeErr) throw beforeErr;
//                     const priorIds = new Set(salesBefore?.map(s => s.lead_id));
//                     dateFilteredIds = Array.from(inRangeIds).filter(id => !priorIds.has(id));

//                     if (dateFilteredIds.length === 0) { alert("No data to export"); return; }
//                 }

//                 let query = supabase
//                     .from("leads")
//                     .select("business_id, name, email, phone, source, assigned_to, assigned_at, current_stage")
//                     .eq("current_stage", "sale done");

//                 if (dateFilteredIds !== null) query = query.in("business_id", dateFilteredIds);
//                 if (searchTerm) query = query.or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,business_id.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`);
//                 if (sourceFilter && sourceFilter !== "all") query = query.eq("source", sourceFilter);
//                 if (assignedToFilter && assignedToFilter !== "all") query = query.eq("assigned_to", assignedToFilter);

//                 if (["lead_id", "lead_name"].includes(sortConfig.key)) {
//                     const col = sortConfig.key === "lead_id" ? "business_id" : "name";
//                     query = query.order(col, { ascending: sortConfig.direction === "asc" });
//                 }

//                 const { data: allLeads, error } = await query;
//                 if (error) throw error;
//                 if (!allLeads || allLeads.length === 0) { alert("No data to export"); return; }

//                 const businessIds = allLeads.map(l => l.business_id);
//                 const { data: salesData, error: salesErr } = await supabase
//                     .from("sales_closure")
//                     .select("*")
//                     .in("lead_id", businessIds);
//                 if (salesErr) throw salesErr;

//                 const salesMap = new Map<string, any>();
//                 salesData?.forEach(sale => {
//                     const existing = salesMap.get(sale.lead_id);
//                     if (!existing || dayjs(sale.closed_at).isBefore(dayjs(existing.closed_at))) {
//                         salesMap.set(sale.lead_id, sale);
//                     }
//                 });

//                 let exportDataRaw = allLeads.map(lead => {
//                     const sale = salesMap.get(lead.business_id);
//                     return {
//                         "Lead ID": lead.business_id,
//                         "Client Name": lead.name,
//                         "Email": lead.email,
//                         "Phone": lead.phone || "-",
//                         "Source": lead.source || "-",
//                         "Sale Value": sale ? sale.sale_value : 0,
//                         "Closed At": sale?.closed_at ? dayjs(sale.closed_at).format("YYYY-MM-DD") : "-",
//                         "Assigned To": lead.assigned_to || "-",
//                         "Assigned At": lead.assigned_at ? dayjs(lead.assigned_at).format("YYYY-MM-DD") : "-",
//                         "Payment Mode": sale?.payment_mode || "-",
//                     };
//                 });

//                 if (["sale_value", "closed_at"].includes(sortConfig.key)) {
//                     exportDataRaw.sort((a, b) => {
//                         let valA: any = sortConfig.key === "sale_value" ? a["Sale Value"] : a["Closed At"];
//                         let valB: any = sortConfig.key === "sale_value" ? b["Sale Value"] : b["Closed At"];
//                         if (valA === valB) return 0; if (valA === "-" || valA === 0) return 1;
//                         return sortConfig.direction === "asc" ? (valA < valB ? -1 : 1) : (valA > valB ? -1 : 1);
//                     });
//                 }

//                 const ws = XLSX.utils.json_to_sheet(exportDataRaw);
//                 const wb = XLSX.utils.book_new();
//                 XLSX.utils.book_append_sheet(wb, ws, "Sales Closure (First)");
//                 XLSX.writeFile(wb, `Sales_Desc_First_${dayjs().format("YYYY-MM-DD")}.xlsx`);
//             }
//             // MODE B: "ONLY RENEWALS"
//             else if (reportMode === "renewal") {
//                 const { data: allSales, error: allErr } = await supabase.from("sales_closure").select("id, lead_id, closed_at");
//                 if (allErr) throw allErr;

//                 const groups = new Map<string, any[]>();
//                 allSales?.forEach(s => {
//                     if (!groups.has(s.lead_id)) groups.set(s.lead_id, []);
//                     groups.get(s.lead_id)?.push(s);
//                 });

//                 let renewalSaleIds: string[] = [];
//                 for (const [lid, sales] of groups.entries()) {
//                     if (sales.length > 1) {
//                         sales.sort((a, b) => dayjs(a.closed_at).valueOf() - dayjs(b.closed_at).valueOf());
//                         const renewals = sales.slice(1);
//                         renewals.forEach((r: any) => {
//                             if (startDate && endDate) {
//                                 const d = dayjs(r.closed_at);
//                                 if (d.isBefore(startDate) || d.isAfter(endDate)) return;
//                             }
//                             renewalSaleIds.push(r.id);
//                         });
//                     }
//                 }

//                 if (renewalSaleIds.length === 0) { alert("No renewal data found"); return; }

//                 const { data: salesDetails, error: salesErr } = await supabase.from("sales_closure").select("*").in("id", renewalSaleIds);
//                 if (salesErr) throw salesErr;

//                 const distinctLeadIds = Array.from(new Set(salesDetails?.map(s => s.lead_id)));
//                 const { data: leadsInfo, error: leadsErr } = await supabase
//                     .from("leads")
//                     .select("business_id, name, email, phone, source, assigned_to, assigned_at")
//                     .in("business_id", distinctLeadIds);
//                 if (leadsErr) throw leadsErr;

//                 const leadMap = new Map(leadsInfo?.map(l => [l.business_id, l]));

//                 let exportDataRaw = salesDetails?.map(sale => {
//                     const l = leadMap.get(sale.lead_id);
//                     return {
//                         "Lead ID": sale.lead_id,
//                         "Client Name": l?.name || "-",
//                         "Email": l?.email || "-",
//                         "Phone": l?.phone || "-",
//                         "Source": l?.source || "-",
//                         "Sale Value": sale.sale_value,
//                         "Closed At": sale.closed_at ? dayjs(sale.closed_at).format("YYYY-MM-DD") : "-",
//                         "Assigned To": l?.assigned_to || "-",
//                         "Assigned At": l?.assigned_at ? dayjs(l?.assigned_at).format("YYYY-MM-DD") : "-",
//                         "Payment Mode": sale.payment_mode || "-",
//                     };
//                 }) || [];

//                 if (["sale_value", "closed_at"].includes(sortConfig.key)) {
//                     exportDataRaw.sort((a, b: any) => {
//                         let valA = sortConfig.key === "sale_value" ? a["Sale Value"] : a["Closed At"];
//                         let valB = sortConfig.key === "sale_value" ? b["Sale Value"] : b["Closed At"];
//                         if (valA === valB) return 0; if (valA === "-" || valA === 0) return 1;
//                         return sortConfig.direction === "asc" ? (valA < valB ? -1 : 1) : (valA > valB ? -1 : 1);
//                     });
//                 }

//                 const ws = XLSX.utils.json_to_sheet(exportDataRaw);
//                 const wb = XLSX.utils.book_new();
//                 XLSX.utils.book_append_sheet(wb, ws, "Renewals");
//                 XLSX.writeFile(wb, `Sales_Renewals_${dayjs().format("YYYY-MM-DD")}.xlsx`);
//             }
//             // MODE C: "ALL SALES"
//             else {
//                 let query = supabase.from("sales_closure").select("*");

//                 if (startDate && endDate) {
//                     query = query.gte("closed_at", dayjs(startDate).startOf("day").toISOString())
//                         .lte("closed_at", dayjs(endDate).endOf("day").toISOString());
//                 }

//                 if (searchTerm && reportMode === "all") {
//                     query = query.ilike('lead_id', `%${searchTerm}%`);
//                 }

//                 if (["sale_value", "closed_at"].includes(sortConfig.key)) {
//                     query = query.order(sortConfig.key, { ascending: sortConfig.direction === "asc" });
//                 } else {
//                     query = query.order("closed_at", { ascending: false });
//                 }

//                 const { data: salesData, error } = await query;
//                 if (error) throw error;
//                 if (!salesData || salesData.length === 0) { alert("No data to export"); return; }

//                 const leadIds = Array.from(new Set(salesData.map(s => s.lead_id)));
//                 const { data: leadsInfo, error: leadsErr } = await supabase
//                     .from("leads")
//                     .select("business_id, name, email, phone, source, assigned_to, assigned_at")
//                     .in("business_id", leadIds);

//                 if (leadsErr) throw leadsErr;
//                 const leadMap = new Map(leadsInfo?.map(l => [l.business_id, l]));

//                 let exportDataRaw = salesData.map(sale => {
//                     const l = leadMap.get(sale.lead_id);
//                     return {
//                         "Lead ID": sale.lead_id,
//                         "Client Name": l?.name || "-",
//                         "Email": l?.email || "-",
//                         "Phone": l?.phone || "-",
//                         "Source": l?.source || "-",
//                         "Sale Value": sale.sale_value,
//                         "Closed At": sale.closed_at ? dayjs(sale.closed_at).format("YYYY-MM-DD") : "-",
//                         "Assigned To": l?.assigned_to || "-",
//                         "Assigned At": l?.assigned_at ? dayjs(l?.assigned_at).format("YYYY-MM-DD") : "-",
//                         "Payment Mode": sale.payment_mode || "-",
//                     };
//                 });

//                 if (sourceFilter && sourceFilter !== "all") {
//                     exportDataRaw = exportDataRaw.filter(x => x["Source"] === sourceFilter);
//                 }
//                 if (assignedToFilter && assignedToFilter !== "all") {
//                     exportDataRaw = exportDataRaw.filter(x => x["Assigned To"] === assignedToFilter);
//                 }

//                 const ws = XLSX.utils.json_to_sheet(exportDataRaw);
//                 const wb = XLSX.utils.book_new();
//                 XLSX.utils.book_append_sheet(wb, ws, "All Sales");
//                 XLSX.writeFile(wb, `Sales_All_${dayjs().format("YYYY-MM-DD")}.xlsx`);
//             }

//         } catch (e: any) {
//             console.error("Export failed:", e);
//             alert("Export failed: " + (e?.message || "Unknown error"));
//         }
//     };

//     const renderSortIcon = (key: string) => {
//         if (sortConfig.key !== key) return <ArrowUpDown className="h-4 w-4 ml-1 text-gray-400" />;
//         return sortConfig.direction === "asc" ? <ArrowUp className="h-4 w-4 ml-1 text-blue-600" /> : <ArrowDown className="h-4 w-4 ml-1 text-blue-600" />;
//     };

//     return (
//         <Dialog open={isOpen} onOpenChange={(v) => !v && onClose()}>
//             <DialogContent className="w-[95vw] max-w-[95vw] h-[95vh] flex flex-col">
//                 <DialogHeader>
//                     <DialogTitle>Sales Closure Records</DialogTitle>
//                     {/* Report Mode Selection */}
//                     <div className="flex gap-4 pt-2 pb-2">
//                         <label className="flex items-center space-x-2 cursor-pointer">
//                             <input
//                                 type="radio"
//                                 name="rmode"
//                                 className="accent-blue-600"
//                                 checked={reportMode === "all"}
//                                 onChange={() => setReportMode("all")}
//                             />
//                             <span className="text-sm font-medium">All Sales</span>
//                         </label>
//                         <label className="flex items-center space-x-2 cursor-pointer">
//                             <input
//                                 type="radio"
//                                 name="rmode"
//                                 className="accent-blue-600"
//                                 checked={reportMode === "first"}
//                                 onChange={() => setReportMode("first")}
//                             />
//                             <span className="text-sm font-medium">Only First Sales</span>
//                         </label>
//                         <label className="flex items-center space-x-2 cursor-pointer">
//                             <input
//                                 type="radio"
//                                 name="rmode"
//                                 className="accent-blue-600"
//                                 checked={reportMode === "renewal"}
//                                 onChange={() => setReportMode("renewal")}
//                             />
//                             <span className="text-sm font-medium">Only Renewals</span>
//                         </label>
//                     </div>
//                 </DialogHeader>

//                 {/* Filters */}
//                 <div className="flex flex-wrap items-end gap-4 py-2">
//                     {/* Search */}
//                     <div className="grid w-full max-w-sm items-center gap-1.5">
//                         <Label htmlFor="search">Search</Label>
//                         <div className="relative">
//                             <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
//                             <Input
//                                 id="search"
//                                 placeholder="Name, Email, ID..."
//                                 className="pl-8"
//                                 value={searchTerm}
//                                 onChange={(e) => setSearchTerm(e.target.value)}
//                             />
//                         </div>
//                     </div>

//                     {/* Source Filter */}
//                     <div className="grid w-full max-w-[200px] items-center gap-1.5">
//                         <Label>Source</Label>
//                         <Select value={sourceFilter} onValueChange={setSourceFilter}>
//                             <SelectTrigger>
//                                 <SelectValue placeholder="All Sources" />
//                             </SelectTrigger>
//                             <SelectContent>
//                                 <SelectItem value="all">All Sources</SelectItem>
//                                 {sources.map(src => <SelectItem key={src} value={src}>{src}</SelectItem>)}
//                             </SelectContent>
//                         </Select>
//                     </div>

//                     {/* Assigned To Filter - Hide for Sales Associate */}
//                     {currentUser?.roles !== "Sales Associate" && (
//                         <div className="grid w-full max-w-[200px] items-center gap-1.5">
//                             <Label>Assigned To</Label>
//                             <Select value={assignedToFilter} onValueChange={setAssignedToFilter}>
//                                 <SelectTrigger>
//                                     <SelectValue placeholder="All Users" />
//                                 </SelectTrigger>
//                                 <SelectContent>
//                                     <SelectItem value="all">All Users</SelectItem>
//                                     {assignedToOptions.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
//                                 </SelectContent>
//                             </Select>
//                         </div>
//                     )}

//                     {/* Date Range */}
//                     <div className="grid w-full max-w-sm items-center gap-1.5">
//                         <Label>Date Range (Closed At)</Label>
//                         <div className="flex gap-2 items-center">
//                             <Input
//                                 type="date"
//                                 value={startDate}
//                                 onChange={(e) => setStartDate(e.target.value)}
//                             />
//                             <Input
//                                 type="date"
//                                 value={endDate}
//                                 onChange={(e) => setEndDate(e.target.value)}
//                             />
//                             {/* Clear Button */}
//                             {(startDate || endDate) && (
//                                 <Button
//                                     variant="ghost"
//                                     size="sm"
//                                     onClick={() => { setStartDate(""); setEndDate(""); }}
//                                     className="h-9 px-2 text-gray-50 hover:text-destructive bg-gray-900"
//                                     title="Clear Dates"
//                                 >
//                                     Clear Date filter
//                                 </Button>
//                             )}
//                         </div>
//                     </div>



//                     <Button onClick={handleExport} variant="outline" className="ml-auto">
//                         Export to Excel
//                     </Button>
//                     <div>
//                         <Label>Rows per page</Label>
//                         <Select
//                             value={pageSize === 999999 ? "all" : String(pageSize)}
//                             onValueChange={(v) => {
//                                 if (v === "all") {
//                                     setPageSize(999999);
//                                 } else {
//                                     setPageSize(Number(v));
//                                 }
//                                 setPage(1);
//                             }}
//                         >
//                             <SelectTrigger className="w-[120px]">
//                                 <SelectValue placeholder="Rows per page" />
//                             </SelectTrigger>
//                             <SelectContent>
//                                 <SelectItem value="30">30 per page</SelectItem>
//                                 <SelectItem value="50">50 per page</SelectItem>
//                                 <SelectItem value="100">100 per page</SelectItem>
//                                 <SelectItem value="200">200 per page</SelectItem>
//                                 <SelectItem value="500">500 per page</SelectItem>
//                                 <SelectItem value="1000">1000 per page</SelectItem>
//                                 <SelectItem value="all">All</SelectItem>
//                             </SelectContent>
//                         </Select>
//                     </div>

//                 </div>

//                 {/* Table */}
//                 <div className="flex-1 overflow-auto border rounded-md">
//                     <Table>
//                         <TableHeader>
//                             <TableRow>
//                                 <TableHead>S.no</TableHead>
//                                 <TableHead className="cursor-pointer select-none" onClick={() => handleSort("lead_id")}>
//                                     <div className="flex items-center">Lead ID {renderSortIcon("lead_id")}</div>
//                                 </TableHead>
//                                 <TableHead className="cursor-pointer select-none" onClick={() => handleSort("lead_name")}>
//                                     <div className="flex items-center">Client Name {renderSortIcon("lead_name")}</div>
//                                 </TableHead>
//                                 <TableHead>Email</TableHead>
//                                 <TableHead>Phone</TableHead>
//                                 <TableHead>Source</TableHead>
//                                 <TableHead className="cursor-pointer select-none" onClick={() => handleSort("sale_value")}>
//                                     <div className="flex items-center">Sale Value {renderSortIcon("sale_value")}</div>
//                                 </TableHead>
//                                 <TableHead className="cursor-pointer select-none" onClick={() => handleSort("closed_at")}>
//                                     <div className="flex items-center">Closed At {renderSortIcon("closed_at")}</div>
//                                 </TableHead>
//                                 <TableHead>Assigned To</TableHead>
//                                 <TableHead>Assigned At</TableHead>
//                             </TableRow>
//                         </TableHeader>
//                         <TableBody>
//                             {loading ? (
//                                 <TableRow>
//                                     <TableCell colSpan={9} className="text-center h-24">Loading...</TableCell>
//                                 </TableRow>
//                             ) : data.length > 0 ? (
//                                 data.map((row, idx) => (
//                                     <TableRow key={row.id}>
//                                         <TableCell>{idx + 1}</TableCell>
//                                         <TableCell>{row.lead_id}</TableCell>
//                                         <TableCell className="font-medium">{row.lead_name}</TableCell>
//                                         <TableCell className="text-muted-foreground">{row.email}</TableCell>
//                                         <TableCell>{row.phone}</TableCell>
//                                         <TableCell>{row.source}</TableCell>
//                                         <TableCell>${row.sale_value}</TableCell>
//                                         <TableCell>
//                                             {row.closed_at ? dayjs(row.closed_at).format("DD MMM YYYY") : "-"}
//                                         </TableCell>
//                                         <TableCell>{row.assigned_to}</TableCell>
//                                         <TableCell>
//                                             {row.assigned_at ? dayjs(row.assigned_at).format("DD MMM YYYY") : "-"}
//                                         </TableCell>
//                                     </TableRow>
//                                 ))
//                             ) : (
//                                 <TableRow>
//                                     <TableCell colSpan={9} className="text-center h-24">No records found.</TableCell>
//                                 </TableRow>
//                             )}
//                         </TableBody>
//                     </Table>
//                 </div>

//                 {/* PaginationFooter */}
//                 <div className="flex items-center justify-between py-2 border-t mt-auto px-2">
//                     <div className="text-sm text-muted-foreground">
//                         Total: {totalRecords} records
//                     </div>
//                     <div className="flex items-center gap-2">
//                         <Button
//                             variant="outline"
//                             size="sm"
//                             onClick={() => setPage(p => Math.max(1, p - 1))}
//                             disabled={page === 1}
//                         >
//                             Previous
//                         </Button>
//                         <span className="text-sm">Page {page}</span>
//                         <Button
//                             variant="outline"
//                             size="sm"
//                             onClick={() => setPage(p => p + 1)}
//                             disabled={page * pageSize >= totalRecords}
//                         >
//                             Next
//                         </Button>


//                     </div>
//                 </div>

//             </DialogContent>
//         </Dialog>
//     );
// }


