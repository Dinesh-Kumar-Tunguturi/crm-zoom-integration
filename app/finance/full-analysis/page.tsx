// app/finance/full-analysis/page.tsx
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent } from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

type SaleRow = {
  id?: string;
  lead_id: string | null;
  sale_value: number | string | null;
  closed_at: string;                 
  onboarded_date: string | null;     
  subscription_cycle: number | string | null; 

  application_sale_value: number | string | null;
  resume_sale_value: number | string | null;
  linkedin_sale_value: number | string | null;
  portfolio_sale_value: number | string | null;
  github_sale_value: number | string | null;
  courses_sale_value: number | string | null;
  badge_value: number | string | null;
  custom_sale_value: number | string | null;
  custom_label: string | null;
  email?: string;
};

type SourceKey =
  | 'application'
  | 'resume'
  | 'linkedin'
  | 'portfolio'
  | 'github'
  | 'courses'
  | 'badge'
  | 'custom';

const SOURCE_FIELDS: Record<SourceKey, { column: keyof SaleRow; label: string }> = {
  application: { column: 'application_sale_value', label: 'applications' },
  resume:      { column: 'resume_sale_value',       label: 'resume' },
  linkedin:    { column: 'linkedin_sale_value',     label: 'linked in' },
  portfolio:   { column: 'portfolio_sale_value',    label: 'portfolio' },
  github:      { column: 'github_sale_value',       label: 'github' },
  courses:     { column: 'courses_sale_value',      label: 'courses' },
  badge:       { column: 'badge_value',             label: 'badge' },
  custom:      { column: 'custom_sale_value',       label: 'custom' },
};

export default function FullAnalysisPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [startDate, setStartDate] = useState<string>(''); 
  const [endDate, setEndDate] = useState<string>('');     

  const [totalCollected, setTotalCollected] = useState<number | null>(null);
  const [usableRevenue, setUsableRevenue] = useState<number | null>(null);
  const [pendingRevenue, setPendingRevenue] = useState<number | null>(null);
  const [pendingClientCount, setPendingClientCount] = useState<number | null>(null);
  const [paidClientCount, setPaidClientCount] = useState<number | null>(null);

  const [sourceTotals, setSourceTotals] = useState<Record<SourceKey, number>>({
    application: 0, resume: 0, linkedin: 0, portfolio: 0,
    github: 0, courses: 0, badge: 0, custom: 0,
  });
  const [sourceAverages, setSourceAverages] = useState<Record<SourceKey, number>>({
    application: 0, resume: 0, linkedin: 0, portfolio: 0,
    github: 0, courses: 0, badge: 0, custom: 0,
  });
  const [customDisplayLabel, setCustomDisplayLabel] = useState<string>('custom');

  const [sourceNewCounts, setSourceNewCounts] = useState<Record<SourceKey, number>>({
    application: 0, resume: 0, linkedin: 0, portfolio: 0,
    github: 0, courses: 0, badge: 0, custom: 0,
  });
  const [sourceRenewalCounts, setSourceRenewalCounts] = useState<Record<SourceKey, number>>({
    application: 0, resume: 0, linkedin: 0, portfolio: 0,
    github: 0, courses: 0, badge: 0, custom: 0,
  });

  useEffect(() => setMounted(true), []);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);

  const safeNumber = (v: unknown, fallback = 0): number => {
    const n = typeof v === 'string' ? Number(v) : typeof v === 'number' ? v : NaN;
    return Number.isFinite(n) ? n : fallback;
  };

  const safeCycleDays = (v: unknown, fallback = 30): number => {
    const n = safeNumber(v, NaN);
    const d = Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
    return d <= 0 ? fallback : d;
  };

  const localRangeToUTC = (start?: string, end?: string) => {
    if (!start || !end) return { startUTC: undefined, endUTC: undefined };
    const s = new Date(`${start}T00:00:00`);
    const e = new Date(`${end}T23:59:59.999`);
    return { startUTC: s.toISOString(), endUTC: e.toISOString() };
  };

  const getLeadKey = (r: SaleRow) => {
    const id = r.lead_id ? String(r.lead_id).trim() : '';
    const fallbackEmail = r.email ? String(r.email).trim() : '';
    if (id.length > 0) return id;
    if (fallbackEmail.length > 0) return `email:${fallbackEmail}`;
    return null;
  };

// // ------------------ 🔥 MAIN FETCH + DEFERRED/USABLE REVENUE LOGIC ------------------
// const fetchAll = async () => {
//   (fetchAll as any).currentRequestId = ((fetchAll as any).currentRequestId || 0) + 1;
//   const reqId = (fetchAll as any).currentRequestId;
//   setIsLoading(true);

//   try {
//     const projection = `
//       id, lead_id, sale_value, closed_at, onboarded_date, subscription_cycle,
//       application_sale_value, resume_sale_value, linkedin_sale_value, portfolio_sale_value,
//       github_sale_value, courses_sale_value, badge_value, custom_sale_value, custom_label, email
//     `;

//     const hasDateRange = !!(startDate && endDate);
//     let rowsInRange: SaleRow[] = [];
//     let allRows: SaleRow[] = [];
//     let rangeStartUTC: string | undefined;
//     let rangeEndUTC: string | undefined;

//     if (hasDateRange) {
//       const { startUTC, endUTC } = localRangeToUTC(startDate, endDate);
//       rangeStartUTC = startUTC;
//       rangeEndUTC = endUTC;
//       const [allRes, rangeRes] = await Promise.all([
//         supabase.from('sales_closure').select(projection).order('closed_at', { ascending: true }),
//         supabase.from('sales_closure')
//           .select(projection)
//           .gte('closed_at', startUTC!)
//           .lte('closed_at', endUTC!)
//           .order('closed_at', { ascending: true }),
//       ]);
//       if (reqId !== (fetchAll as any).currentRequestId) return;
//       if (allRes.error) throw allRes.error;
//       if (rangeRes.error) throw rangeRes.error;
//       allRows = allRes.data ?? [];
//       rowsInRange = rangeRes.data ?? [];
//     } else {
//       const { data, error } = await supabase
//         .from('sales_closure')
//         .select(projection)
//         .order('closed_at', { ascending: true });
//       if (reqId !== (fetchAll as any).currentRequestId) return;
//       if (error) throw error;
//       allRows = data ?? [];
//       rowsInRange = data ?? [];
//     }

//     // Track occurrences of each lead_id in all sales
//     const leadCountMap: Record<string, number> = {};
//     rowsInRange.forEach((r) => {
//       const leadId = r.lead_id;
//       if (leadId) {
//         leadCountMap[leadId] = (leadCountMap[leadId] || 0) + 1;
//       }
//     });

//     // Calculate new and renewal counts
//     const newLeadCount = Object.values(leadCountMap).filter((count) => count === 1).length;  // Leads that appear once
//     const renewalLeadCount = Object.values(leadCountMap).filter((count) => count > 1).length;  // Leads that appear more than once

//     // Set new and renewal counts for each source
//     setSourceNewCounts({
//       application: newLeadCount,
//       resume: newLeadCount,
//       linkedin: newLeadCount,
//       portfolio: newLeadCount,
//       github: newLeadCount,
//       courses: newLeadCount,
//       badge: newLeadCount,
//       custom: newLeadCount,
//     });
//     setSourceRenewalCounts({
//       application: renewalLeadCount,
//       resume: renewalLeadCount,
//       linkedin: renewalLeadCount,
//       portfolio: renewalLeadCount,
//       github: renewalLeadCount,
//       courses: renewalLeadCount,
//       badge: renewalLeadCount,
//       custom: renewalLeadCount,
//     });
//       // ✅ total collected
// const totalCollectedNum = rowsInRange.reduce((a, r) => a + safeNumber(r.sale_value, 0), 0);
//     const totalRevenue = totalCollectedNum;
//       // ✅ new deferred + usable logic
//       const now = new Date();
//       let usableTotal = 0;
//       let deferredTotal = 0;

//       rowsInRange.forEach((r) => {
//         const saleValue = safeNumber(r.sale_value, 0);
//         if (!saleValue) return;
//         const subCycle = safeCycleDays(r.subscription_cycle, 30);
//         const closed = new Date(r.closed_at);
//         const startDay = closed.getDate();
//         const daysInMonth = new Date(closed.getFullYear(), closed.getMonth() + 1, 0).getDate();

//         const daysUsed = daysInMonth - startDay + 1;
//         const daysDeferred = subCycle - daysUsed;

//         const usable = (saleValue / subCycle) * daysUsed;
//         const deferred = (saleValue / subCycle) * daysDeferred;

//         usableTotal += usable;
//         deferredTotal += deferred;
//       });

//       const usableRounded = Number(usableTotal.toFixed(2));
//       const deferredRounded = Number(deferredTotal.toFixed(2));

//       // ✅ pending and paid logic same as before
//       const today = new Date();
//       const latestByLead = new Map<string, { onboardDate: Date; row: SaleRow }>();
//       for (const r of rowsInRange) {
//         const key = getLeadKey(r);
//         if (!key) continue;
//         const onboardDate = new Date(r.onboarded_date ?? r.closed_at);
//         const existing = latestByLead.get(key);
//         if (!existing || onboardDate > existing.onboardDate) {
//           latestByLead.set(key, { onboardDate, row: r });
//         }
//       }

//       let pendingSum = 0;
//       let pendingCount = 0;
//       let paidCount = 0;
//       for (const { row, onboardDate } of latestByLead.values()) {
//         const cycle = safeCycleDays(row.subscription_cycle, 30);
//         const end = new Date(onboardDate);
//         end.setDate(end.getDate() + cycle);
//         if (end < today) {
//           pendingSum += safeNumber(row.sale_value, 0);
//           pendingCount++;
//         } else paidCount++;
//       }

//       // ✅ source totals
//       const totals: Record<SourceKey, number> = {
//       application: 0, resume: 0, linkedin: 0, portfolio: 0,
//       github: 0, courses: 0, badge: 0, custom: 0,
//     };

//     const counts: Record<SourceKey, number> = {
//       application: 0, resume: 0, linkedin: 0, portfolio: 0,
//       github: 0, courses: 0, badge: 0, custom: 0,
//     };

//     // Calculate total and count for each source
//     rowsInRange.forEach((r) => {
//       (Object.keys(SOURCE_FIELDS) as SourceKey[]).forEach((k) => {
//         const col = SOURCE_FIELDS[k].column;
//         const value = safeNumber((r as any)[col], 0);
//         if (value > 0) {
//           totals[k] += value;
//           counts[k] += 1;
//         }
//       });
//     });

//     // Calculate averages for each source
//     const avgs: Record<SourceKey, number> = { ...totals };
//     (Object.keys(SOURCE_FIELDS) as SourceKey[]).forEach((k) => {
//       avgs[k] = counts[k] ? Number((totals[k] / counts[k]).toFixed(2)) : 0;
//       totals[k] = Number(totals[k].toFixed(2)); // Keep totals fixed to 2 decimal places
//     });

//       const customLabel =
//         [...allRows]
//           .sort((a, b) => new Date(b.closed_at).getTime() - new Date(a.closed_at).getTime())
//           .find((r) => (r.custom_label ?? '').trim().length > 0)?.custom_label || 'custom';

//       // ✅ set states
//       if (reqId !== (fetchAll as any).currentRequestId) return;
      
//     setTotalCollected(Number(totalCollectedNum.toFixed(2)));
//     setUsableRevenue(usableRounded);
//     setPendingRevenue(Number(pendingSum.toFixed(2)));
//     setPendingClientCount(pendingCount);
//     setPaidClientCount(paidCount);
//     setSourceTotals(totals);
//     setSourceAverages(avgs);
//     setCustomDisplayLabel(customLabel);

//   } catch (err) {
//     console.error('fetchAll failed:', err);
//     setTotalCollected(0);
//     setUsableRevenue(0);
//     setPendingRevenue(0);
//     setPendingClientCount(0);
//     setPaidClientCount(0);
//   } finally {
//     setIsLoading(false);
//   }
// };


// ------------------ 🔥 MAIN FETCH + DEFERRED/USABLE REVENUE LOGIC ------------------
const fetchAll = async () => {
  (fetchAll as any).currentRequestId = ((fetchAll as any).currentRequestId || 0) + 1;
  const reqId = (fetchAll as any).currentRequestId;
  setIsLoading(true);

  try {
    const projection = `
      id, lead_id, sale_value, closed_at, onboarded_date, subscription_cycle,
      application_sale_value, resume_sale_value, linkedin_sale_value, portfolio_sale_value,
      github_sale_value, courses_sale_value, badge_value, custom_sale_value, custom_label, email
    `;

    const hasDateRange = !!(startDate && endDate);
    let rowsInRange: SaleRow[] = [];
    let allRows: SaleRow[] = [];
    let rangeStartUTC: string | undefined;
    let rangeEndUTC: string | undefined;

    if (hasDateRange) {
      const { startUTC, endUTC } = localRangeToUTC(startDate, endDate);
      rangeStartUTC = startUTC;
      rangeEndUTC = endUTC;
      const [allRes, rangeRes] = await Promise.all([
        supabase.from('sales_closure').select(projection).order('closed_at', { ascending: true }),
        supabase.from('sales_closure')
          .select(projection)
          .gte('closed_at', startUTC!)
          .lte('closed_at', endUTC!)
          .order('closed_at', { ascending: true }),
      ]);
      if (reqId !== (fetchAll as any).currentRequestId) return;
      if (allRes.error) throw allRes.error;
      if (rangeRes.error) throw rangeRes.error;
      allRows = allRes.data ?? [];
      rowsInRange = rangeRes.data ?? [];
    } else {
      const { data, error } = await supabase
        .from('sales_closure')
        .select(projection)
        .order('closed_at', { ascending: true });
      if (reqId !== (fetchAll as any).currentRequestId) return;
      if (error) throw error;
      allRows = data ?? [];
      rowsInRange = data ?? [];
    }

    // Initialize maps to track new and renewal counts for each source
    const sourceNewCounts: Record<SourceKey, number> = {
      application: 0, resume: 0, linkedin: 0, portfolio: 0,
      github: 0, courses: 0, badge: 0, custom: 0,
    };
    const sourceRenewalCounts: Record<SourceKey, number> = {
      application: 0, resume: 0, linkedin: 0, portfolio: 0,
      github: 0, courses: 0, badge: 0, custom: 0,
    };

    // Track lead_id occurrences in the whole sales_closure table
    const leadCountMapAll: Record<string, number> = {};
    allRows.forEach((r) => {
      const leadId = r.lead_id;
      if (leadId) {
        leadCountMapAll[leadId] = (leadCountMapAll[leadId] || 0) + 1;
      }
    });

    // Track lead_id occurrences for each source in the date range
    (Object.keys(SOURCE_FIELDS) as SourceKey[]).forEach((source) => {
      const leadCountMapRange: Record<string, number> = {}; // Track occurrences of each lead_id for this source in the date range

      rowsInRange.forEach((r) => {
        const value = safeNumber(r[SOURCE_FIELDS[source].column], 0);
        if (value > 0) {
          const leadId = r.lead_id;
          if (leadId) {
            leadCountMapRange[leadId] = (leadCountMapRange[leadId] || 0) + 1;
          }
        }
      });

      // Calculate new and renewal counts for the current source
      let newCount = 0;
      let renewalCount = 0;

      Object.keys(leadCountMapRange).forEach((leadId) => {
        const occurrenceInAll = leadCountMapAll[leadId] || 0;
        const occurrenceInRange = leadCountMapRange[leadId];

        // Determine if it should be a new or renewal based on the full table and date range occurrences
        if (occurrenceInAll === 1) {
          // If it appears once in the full table but once in the date range, it's new
          if (occurrenceInRange === 1) {
            newCount++;
          } else if (occurrenceInRange > 1) {
            renewalCount++;
          }
        } else if (occurrenceInAll > 1) {
          // If it appears more than once in the full table, it's a renewal
          renewalCount++;
        }
      });

      sourceNewCounts[source] = newCount;
      sourceRenewalCounts[source] = renewalCount;
    });

    // Set source-wise new and renewal counts in the state
    setSourceNewCounts(sourceNewCounts);
    setSourceRenewalCounts(sourceRenewalCounts);

    // ✅ total collected revenue
    const totalCollectedNum = rowsInRange.reduce((a, r) => a + safeNumber(r.sale_value, 0), 0);

    // ✅ new deferred + usable revenue logic
    const now = new Date();
    let usableTotal = 0;
    let deferredTotal = 0;

    rowsInRange.forEach((r) => {
      const saleValue = safeNumber(r.sale_value, 0);
      if (!saleValue) return;
      const subCycle = safeCycleDays(r.subscription_cycle, 30);
      const closed = new Date(r.closed_at);
      const startDay = closed.getDate();
      const daysInMonth = new Date(closed.getFullYear(), closed.getMonth() + 1, 0).getDate();

      const daysUsed = daysInMonth - startDay + 1;
      const daysDeferred = subCycle - daysUsed;

      const usable = (saleValue / subCycle) * daysUsed;
      const deferred = (saleValue / subCycle) * daysDeferred;

      usableTotal += usable;
      deferredTotal += deferred;
    });

    const usableRounded = Number(usableTotal.toFixed(2));
    const deferredRounded = Number(deferredTotal.toFixed(2));

    // ✅ pending and paid logic same as before
    const today = new Date();
    const latestByLead = new Map<string, { onboardDate: Date; row: SaleRow }>();
    for (const r of rowsInRange) {
      const key = getLeadKey(r);
      if (!key) continue;
      const onboardDate = new Date(r.onboarded_date ?? r.closed_at);
      const existing = latestByLead.get(key);
      if (!existing || onboardDate > existing.onboardDate) {
        latestByLead.set(key, { onboardDate, row: r });
      }
    }

    let pendingSum = 0;
    let pendingCount = 0;
    let paidCount = 0;
    for (const { row, onboardDate } of latestByLead.values()) {
      const cycle = safeCycleDays(row.subscription_cycle, 30);
      const end = new Date(onboardDate);
      end.setDate(end.getDate() + cycle);
      if (end < today) {
        pendingSum += safeNumber(row.sale_value, 0);
        pendingCount++;
      } else paidCount++;
    }

    // ✅ source totals for each source type
    const totals: Record<SourceKey, number> = {
      application: 0, resume: 0, linkedin: 0, portfolio: 0,
      github: 0, courses: 0, badge: 0, custom: 0,
    };

    const counts: Record<SourceKey, number> = {
      application: 0, resume: 0, linkedin: 0, portfolio: 0,
      github: 0, courses: 0, badge: 0, custom: 0,
    };

    rowsInRange.forEach((r) => {
      (Object.keys(SOURCE_FIELDS) as SourceKey[]).forEach((k) => {
        const col = SOURCE_FIELDS[k].column;
        const value = safeNumber((r as any)[col], 0);
        if (value > 0) {
          totals[k] += value;
          counts[k] += 1;
        }
      });
    });

    // Calculate averages for each source
    const avgs: Record<SourceKey, number> = { ...totals };
    (Object.keys(SOURCE_FIELDS) as SourceKey[]).forEach((k) => {
      avgs[k] = counts[k] ? Number((totals[k] / counts[k]).toFixed(2)) : 0;
      totals[k] = Number(totals[k].toFixed(2)); // Keep totals fixed to 2 decimal places
    });

    const customLabel =
      [...allRows]
        .sort((a, b) => new Date(b.closed_at).getTime() - new Date(a.closed_at).getTime())
        .find((r) => (r.custom_label ?? '').trim().length > 0)?.custom_label || 'custom';

    // ✅ set final states
    if (reqId !== (fetchAll as any).currentRequestId) return;
    
    setTotalCollected(Number(totalCollectedNum.toFixed(2)));
    setUsableRevenue(usableRounded);
    setPendingRevenue(Number(pendingSum.toFixed(2)));
    setPendingClientCount(pendingCount);
    setPaidClientCount(paidCount);
    setSourceTotals(totals);
    setSourceAverages(avgs);
    setCustomDisplayLabel(customLabel);

  } catch (err) {
    console.error('fetchAll failed:', err);
    setTotalCollected(0);
    setUsableRevenue(0);
    setPendingRevenue(0);
    setPendingClientCount(0);
    setPaidClientCount(0);
  } finally {
    setIsLoading(false);
  }
};

  useEffect(() => {
    fetchAll();
  }, [startDate, endDate]);

  const deferredRevenue = useMemo(() => {
    if (totalCollected == null || usableRevenue == null) return null;
    const d = Math.max(0, totalCollected - usableRevenue);
    return Number(d.toFixed(2));
  }, [totalCollected, usableRevenue]);

  const COLORS = ['#0088FE', '#00C49F', '#FF8042', '#FFBB28', '#845EC2', '#2C73D2', '#008E9B', '#C34A36'];

  const pieDataRevenueSplit = useMemo(
    () => [
      { name: 'Usable Revenue', value: usableRevenue ?? 0 },
      { name: 'Deferred Revenue', value: deferredRevenue ?? 0 },
      { name: 'Pending', value: pendingRevenue ?? 0 },
    ],
    [usableRevenue, deferredRevenue, pendingRevenue]
  );

  const CustomLegend = ({ payload, total }: { payload?: Array<any>; total: number }) => (
    <ul className="space-y-2">
      {payload?.map((entry) => {
        const value = Number(entry?.payload?.value) || 0;
        const pct = total > 0 ? ((value / total) * 100).toFixed(2) : '0.00';
        return (
          <li key={entry.value} className="flex items-center gap-2 text-sm">
            <span className="inline-block w-3 h-3 rounded-sm" style={{ backgroundColor: entry.color }} />
            <span className="capitalize">{entry.value}</span>
            <span className="ml-auto font-medium">{pct}%</span>
          </li>
        );
      })}
    </ul>
  );

  const pieDataSources = useMemo(() => {
    const items = (Object.keys(SOURCE_FIELDS) as SourceKey[]).map((k) => {
      const baseLabel = SOURCE_FIELDS[k].label;
      const label = k === 'custom' ? customDisplayLabel : baseLabel;
      return { name: label, value: sourceTotals[k] };
    });
    return items.filter((i) => i.value > 0);
  }, [sourceTotals, customDisplayLabel]);

  const totalSources = useMemo(
    () => pieDataSources.reduce((a, d) => a + (Number(d.value) || 0), 0),
    [pieDataSources]
  );

  const showLoadingKPI =
    isLoading ||
    totalCollected === null ||
    usableRevenue === null ||
    deferredRevenue === null ||
    pendingRevenue === null;

  return (
    <div className="w-full min-h-screen px-8 py-6 space-y-6 bg-white">
      <div className="flex flex-col sm:flex-row justify-between gap-2">
        <h1 className="text-2xl font-bold">Complete Revenue Analysis</h1>
        <div className="flex flex-col sm:flex-row gap-2 items-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="min-w-[200px]">
                {startDate && endDate ? `📅 ${startDate} → ${endDate}` : '📅 Date Range'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="p-4 space-y-4 w-[300px]">
              <div>
                <Label>Start Date</Label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div>
                <Label>End Date</Label>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
              <div className="flex justify-between mt-2">
                <Button onClick={fetchAll}>Apply</Button>
                <Button
                  variant="ghost"
                  className="text-red-500"
                  onClick={() => {
                    setStartDate('');
                    setEndDate('');
                    fetchAll();
                  }}
                >
                  ❌ Clear
                </Button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={() => router.back()}>Close</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
        <Card><CardHeader><CardTitle>Total Collected</CardTitle></CardHeader><CardContent>
          <p className="font-semibold">{showLoadingKPI ? 'Loading…' : formatCurrency(totalCollected!)}</p></CardContent></Card>
        <Card><CardHeader><CardTitle>Usable Revenue</CardTitle></CardHeader><CardContent>
          <p className="font-semibold">{showLoadingKPI ? 'Loading…' : formatCurrency(usableRevenue!)}</p></CardContent></Card>
        <Card><CardHeader><CardTitle>Deferred Revenue</CardTitle></CardHeader><CardContent>
          <p className="font-semibold">{showLoadingKPI ? 'Loading…' : formatCurrency(deferredRevenue!)}</p></CardContent></Card>
        <Card><CardHeader><CardTitle>Payments Pending</CardTitle></CardHeader><CardContent>
          <p className="font-semibold">{showLoadingKPI ? 'Loading…' : formatCurrency(pendingRevenue!)}</p></CardContent></Card>
        <Card><CardHeader><CardTitle>Pending Clients</CardTitle></CardHeader><CardContent>
          <p className="font-semibold">{showLoadingKPI ? 'Loading…' : `${pendingClientCount}`}</p></CardContent></Card>
        <Card><CardHeader><CardTitle>Clients Paid</CardTitle></CardHeader><CardContent>
          <p className="font-semibold">{showLoadingKPI ? 'Loading…' : `${paidClientCount}`}</p></CardContent></Card>
      </div>



      {/* Revenue split pie (existing) + Source of revenue (new) + Expenses placeholder */}
<div className="grid grid-cols-1 md:grid-cols-4 gap-3">
  {/* col-span 1 */}
  <Card className="md:col-span-1">
    <CardHeader>
      <CardTitle>Revenue Split</CardTitle>
    </CardHeader>
    <CardContent className="h-[300px]">
      {mounted && (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart margin={{ top: 20, right: 60, left: 20, bottom: 20 }}>
            <Pie
              data={pieDataRevenueSplit}
              cx="40%"
              cy="50%"
              outerRadius={80}
              dataKey="value"
              label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
              labelLine={false}
            >
              {pieDataRevenueSplit.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value: any, name: string) => [formatCurrency(Number(value)), name]} />
            <Legend layout="vertical" verticalAlign="middle" align="right" />
          </PieChart>
        </ResponsiveContainer>
      )}
    </CardContent>
  </Card>

  {/* col-span 3 */}
<Card className="md:col-span-3">
  <CardHeader>
    <CardTitle>Source of Revenue</CardTitle>
  </CardHeader>

  <CardContent className="flex flex-col md:flex-row  gap-4">
    {/* Combined table: Totals | Average | New | Renewal */}
    <div className="flex-none rounded-xl border p-3 overflow-auto">
      <p className="text-sm font-semibold mb-2">Source Breakdown</p>

      {/* header row */}
      <div className="hidden md:grid grid-cols-5 gap-2 text-xs text-muted-foreground mb-2 font-semibold">
        <div>Source</div>
        <div className="text-right">Total</div>
        <div className="text-right">Average</div>
        <div className="text-right">New (count)</div>
        <div className="text-right">Renewal (count)</div>
      </div>

      {/* mobile-friendly label header */}
      <div className="md:hidden grid grid-cols-2 gap-2 text-xs text-muted-foreground mb-2 font-semibold">
        <div>Source</div>
        <div className="text-right">Totals / Avg / New / Renewal</div>
      </div>

      <ul className="space-y-2">
        {(Object.keys(SOURCE_FIELDS) as SourceKey[]).map((k) => {
          const base = SOURCE_FIELDS[k].label;
          const label = k === 'custom' ? (customDisplayLabel || 'custom') : base;
          return (
            <li key={k} className="grid grid-cols-2 md:grid-cols-5 gap-2 items-center text-sm">
              {/* Source name */}
              <div className="capitalize">{label}</div>

              {/* On small screens show compact stack */}
              <div className="md:hidden text-right">
                <div className="text-xs">{formatCurrency(sourceTotals[k] || 0)}</div>
                <div className="text-xs">{formatCurrency(sourceAverages[k] || 0)}</div>
                <div className="text-xs">{sourceNewCounts[k] ?? 0} / {sourceRenewalCounts[k] ?? 0}</div>
              </div>

              {/* Desktop columns */}
              <div className="hidden md:block text-right font-medium">
                {formatCurrency(sourceTotals[k] || 0)}
              </div>
              <div className="hidden md:block text-right font-medium">
                {formatCurrency(sourceAverages[k] || 0)}
              </div>
              <div className="hidden md:block text-right">
                {sourceNewCounts[k] ?? 0}
              </div>
              <div className="hidden md:block text-right">
                {sourceRenewalCounts[k] ?? 0}
              </div>
            </li>
          );
        })}
      </ul>
    </div>

{/* Pie with side legend */}
<div className="flex-shrink-0 w-full md:w-[420px] h-[260px] px-6">
  {mounted && (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart margin={{ top: 20, right: 160, left: 92, bottom: 20 }}>
        <Pie
          data={pieDataSources}
          dataKey="value"
          nameKey="name"
          cx="50%"  // Center the pie chart horizontally
          cy="50%"  // Center the pie chart vertically
          outerRadius={90}  // Larger outer radius to fill the space
          labelLine={false}
        >
          {pieDataSources.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>

        <Tooltip formatter={(value: any, name: string) => [formatCurrency(Number(value)), name]} />

        <Legend
          layout="vertical"
          verticalAlign="middle"
          align="right"
          wrapperStyle={{ top: 0, right: 0 }}  // Keep legend positioned on the right side
          content={(props) => <CustomLegend total={totalSources} {...props} />}
        />
      </PieChart>
    </ResponsiveContainer>
  )}
</div>

</CardContent>
</Card>


  {/* col-span 1 */}
  
</div>


      {/* Tables */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card>
          <CardHeader>
            <CardTitle>Salary Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Coming soon...</p>
          </CardContent>
        </Card>

      <Card className="md:col-span-1">
    <CardHeader>
      <CardTitle>Salaries and Expenses</CardTitle>
    </CardHeader>
    <CardContent className="h-[200px] flex items-center justify-center text-muted-foreground">
      <p>[ Line Graph Placeholder ]</p>
    </CardContent>
  </Card>

        <Card className="h-[300px]">
          <CardHeader>
            <CardTitle>Expense Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Coming soon...</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
