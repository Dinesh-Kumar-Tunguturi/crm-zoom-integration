// 'use client';
// import React, { useEffect, useState } from 'react';
// import { supabase } from '@/utils/supabase/client';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
// import { DateRange } from 'react-day-picker';
// // import { CalendarDateRangePicker } from '@/components/date-range-picker'; // ✅ You need to create this or use ShadCN template
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu";
// import { Label } from "@/components/ui/label";
// import { Input } from "@/components/ui/input";


// const samplePieData = [
//   { name: 'Usable Revenue', value: 4000 },
//   { name: 'Deferred Revenue', value: 1500 },
//   { name: 'Pending', value: 1000 },
// ];

// const COLORS = ['#0088FE', '#00C49F', '#FF8042'];

// export default function FullAnalysisPage() {
      
//     const [totalCollected, setTotalCollected] = useState<number | null>(null);
//     const [usableRevenue, setUsableRevenue] = useState<number | null>(null);
//     const [pendingRevenue, setPendingRevenue] = useState<number | null>(null);
//     const [pendingClientCount, setPendingClientCount] = useState<number | null>(null);
//     const [paidClientCount, setPaidClientCount] = useState<number | null>(null);
//     const [startDate, setStartDate] = useState<string>(() =>
//   new Date(new Date().setDate(1)).toISOString().split("T")[0]
// ); // default: 1st of month
// const [endDate, setEndDate] = useState<string>(() =>
//   new Date().toISOString().split("T")[0]
// );




//     const calculateUsableRevenueUntilToday = (startDate: Date, cycleDays: number, totalAmount: number): number => {
//   const now = new Date();
//   const start = new Date(startDate);
//   const end = new Date(start);
//   end.setDate(start.getDate() + cycleDays);

//   if (now < start) return 0; // Subscription hasn't started yet
//   if (start > end) return 0; // Invalid data

//   // Calculate number of usable days till today (or till subscription end)
//   const actualEnd = now < end ? now : end;

//   const daysPassed = Math.floor((actualEnd.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
//   const perDayRevenue = totalAmount / cycleDays;

//   return daysPassed > 0 ? parseFloat((perDayRevenue * daysPassed).toFixed(2)) : 0;
// };

//     const formatCurrency = (amount: number) => {
//     return new Intl.NumberFormat("en-US", {
//       style: "currency",
//       currency: "USD",
//       minimumFractionDigits: 0,
//       maximumFractionDigits: 0,
//     }).format(amount);
//   };


//      useEffect(() => {
//   const fetchTotalCollected = async () => {
//     const { data, error } = await supabase
//       .from('sales_closure')
//       .select('sale_value')
//       .gte('closed_at', `${startDate}T00:00:00Z`)
// .lte('closed_at', `${endDate}T23:59:59Z`);

//     if (error) {
//       console.error('Error fetching sale values:', error);
//       return;
//     }

//     const total = data?.reduce((acc, item) => acc + (item.sale_value || 0), 0);
//     setTotalCollected(total);
//   };

//   fetchTotalCollected();
// }, []);

//    useEffect(() => {
//   const fetchRevenueData = async () => {
//     const { data, error } = await supabase
//       .from('sales_closure')
//       .select('sale_value, closed_at, subscription_cycle')
//       .gte('closed_at', `${startDate}T00:00:00Z`)
// .lte('closed_at', `${endDate}T23:59:59Z`);

//     if (error) {
//       console.error('Error fetching sales:', error);
//       return;
//     }

//     const usable = data?.reduce((acc, item) => {
//       const cycle = parseInt(item.subscription_cycle);
//       const startDate = new Date(item.closed_at);
//       const amount = parseFloat(item.sale_value || 0);
//       return acc + calculateUsableRevenueUntilToday(startDate, cycle, amount);
//     }, 0);

//     setUsableRevenue(usable);
//   };

//   fetchRevenueData();
// }, []);

//     const deferredRevenue = (totalCollected ?? 0) - (usableRevenue ?? 0);

//     useEffect(() => {
//   const fetchPendingRevenue = async () => {
//     const { data, error } = await supabase
//       .from('sales_closure')
//       .select('lead_id, closed_at, onboarded_date, subscription_cycle, sale_value')
//       .gte('closed_at', `${startDate}T00:00:00Z`)
// .lte('closed_at', `${endDate}T23:59:59Z`);

//     if (error) {
//       console.error('Error fetching pending payments:', error);
//       return;
//     }

//     const latestMap = new Map();

//     // Step 1: Keep only latest onboarded record per lead_id
//     data?.forEach((record) => {
//       const onboardDate = record.onboarded_date ? new Date(record.onboarded_date) : new Date(record.closed_at);
//       if (!latestMap.has(record.lead_id)) {
//         latestMap.set(record.lead_id, { ...record, onboardDate });
//       } else {
//         const existing = latestMap.get(record.lead_id);
//         if (onboardDate > existing.onboardDate) {
//           latestMap.set(record.lead_id, { ...record, onboardDate });
//         }
//       }
//     });

//     // Step 2: For each latest record, calculate expiry and compare with today
//     const today = new Date();
//     let pendingSum = 0;
//     let pendingCount = 0;
//     let paidCount=0;

//     for (const record of latestMap.values()) {
//       const onboardDate = record.onboarded_date ? new Date(record.onboarded_date) : new Date(record.closed_at);
//       const cycleDays = parseInt(record.subscription_cycle);
//       const endDate = new Date(onboardDate);
//       endDate.setDate(endDate.getDate() + cycleDays);

//       if (endDate < today) {
//         pendingSum += parseFloat(record.sale_value || 0);
//         pendingCount += 1; // Increment client count

//       }
//       else{
//         paidCount += 1; // Increment paid client count
//       }
//     }

//     setPendingRevenue(pendingSum);
//     setPendingClientCount(pendingCount); // 👈 NEW
//     setPaidClientCount(paidCount); // 👈 NEW

//   };

//   fetchPendingRevenue();
// }, []);

//   return (
// <div className="w-full min-h-screen px-8 py-6 space-y-6 bg-white">
//       <div className="flex items-center justify-between">
//        <h1 className="text-2xl font-bold">Complete Revenue Analysis</h1>
//        {/* <Button onClick={() => window.close()}>Close Tab</Button> */}

//        <div className="flex flex-col sm:flex-row gap-2 items-center">
//   <DropdownMenu>
//     <DropdownMenuTrigger asChild>
//       <Button variant="outline" className="min-w-[200px]">
//         {startDate && endDate
//           ? `📅 ${startDate} → ${endDate}`
//           : "📅 Date Range"}
//       </Button>
//     </DropdownMenuTrigger>

//     <DropdownMenuContent className="p-4 space-y-4 w-[250px] sm:w-[300px]">
//       <div className="space-y-2">
//         <Label className="text-sm text-gray-600">Start Date</Label>
//         <Input
//           type="date"
//           value={startDate}
//           onChange={(e) => setStartDate(e.target.value)}
//         />
//       </div>
//       <div className="space-y-2">
//         <Label className="text-sm text-gray-600">End Date</Label>
//         <Input
//           type="date"
//           value={endDate}
//           onChange={(e) => setEndDate(e.target.value)}
//         />
//       </div>
    //   <Button
    //   variant="ghost"
    //   className="text-red-500 text-sm p-0"
    //   onClick={() => {
    //     setStartDate("");
    //     setEndDate("");
    //     // setCurrentPage(1);
    //   }}
    // >
    //   ❌ Clear Filter
    // </Button>
//     </DropdownMenuContent>
    
//   </DropdownMenu>

//   <Button onClick={() => window.close()}>Close Tab</Button>
// </div>

//       </div>







// //app/finance/full-analysis/page.tsx
// 'use client';

// import React, { useEffect, useState } from 'react';
// import { supabase } from '@/utils/supabase/client';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
// import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent } from '@/components/ui/dropdown-menu';
// import { Label } from '@/components/ui/label';
// import { Input } from '@/components/ui/input';



// export default function FullAnalysisPage() {
//   const [startDate, setStartDate] = useState<string>(""); // empty on load
// const [endDate, setEndDate] = useState<string>("");     // empty on load


//   const [totalCollected, setTotalCollected] = useState<number | null>(null);
//   const [usableRevenue, setUsableRevenue] = useState<number | null>(null);
//   const [pendingRevenue, setPendingRevenue] = useState<number | null>(null);
//   const [pendingClientCount, setPendingClientCount] = useState<number | null>(null);
//   const [paidClientCount, setPaidClientCount] = useState<number | null>(null);
//   const [mounted, setMounted] = useState(false);


//   const calculateUsableRevenueUntilToday = (startDate: Date, cycleDays: number, totalAmount: number): number => {
//     const now = new Date();
//     const start = new Date(startDate);
//     const end = new Date(start);
//     end.setDate(start.getDate() + cycleDays);

//     if (now < start) return 0;
//     if (start > end) return 0;

//     const actualEnd = now < end ? now : end;
//     const daysPassed = Math.floor((actualEnd.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
//     const perDayRevenue = totalAmount / cycleDays;

//     return daysPassed > 0 ? parseFloat((perDayRevenue * daysPassed).toFixed(2)) : 0;
//   };



//   const formatCurrency = (amount: number) => {
//     return new Intl.NumberFormat('en-US', {
//       style: 'currency',
//       currency: 'USD',
//       minimumFractionDigits: 0,
//       maximumFractionDigits: 0,
//     }).format(amount);
//   };

//   useEffect(() => setMounted(true), []);
//     const fetchTotalCollected = async () => {
//   let query = supabase.from("sales_closure").select("sale_value");

//   if (startDate && endDate) {
//     const startISO = new Date(startDate).toISOString();
//     const endISO = new Date(endDate).toISOString();
//     query = query.gte("closed_at", startISO).lte("closed_at", endISO);
//   }

//   const { data, error } = await query;

//   if (error) {
//     console.error("Error fetching sale values:", error);
//     return;
//   }

//   const total = data?.reduce((acc, item) => acc + (item.sale_value || 0), 0);
//   setTotalCollected(total);
// };

//     const fetchRevenueData = async () => {
//       let query=supabase
//         .from('sales_closure')
//         .select('sale_value, closed_at, subscription_cycle');

//         if (startDate && endDate) {
//     query = query
//       .gte('closed_at', `${startDate}T00:00:00Z`)
//       .lte('closed_at', `${endDate}T23:59:59Z`);
//   }
//     const { data, error } = await query;

//       if (error) return console.error('Error fetching sales:', error);

//       const usable = data?.reduce((acc, item) => {
//         const cycle = parseInt(item.subscription_cycle);
//         const startDate = new Date(item.closed_at);
//         const amount = parseFloat(item.sale_value || 0);
//         return acc + calculateUsableRevenueUntilToday(startDate, cycle, amount);
//       }, 0);

//       setUsableRevenue(usable);
//     };
 

//   const deferredRevenue = (totalCollected ?? 0) - (usableRevenue ?? 0);

//   const fetchPendingRevenue = async () => {
//       let query= supabase
//         .from('sales_closure')
//         .select('lead_id, closed_at, onboarded_date, subscription_cycle, sale_value');

//         if (startDate && endDate) {
//   query = query
//     .gte('closed_at', `${startDate}T00:00:00Z`)
//     .lte('closed_at', `${endDate}T23:59:59Z`);
// }

//   const { data, error } = await query;
//       if (error) return console.error('Error fetching pending payments:', error);

//       const latestMap = new Map();

//       data?.forEach((record) => {
//         const onboardDate = record.onboarded_date ? new Date(record.onboarded_date) : new Date(record.closed_at);
//         if (!latestMap.has(record.lead_id)) {
//           latestMap.set(record.lead_id, { ...record, onboardDate });
//         } else {
//           const existing = latestMap.get(record.lead_id);
//           if (onboardDate > existing.onboardDate) {
//             latestMap.set(record.lead_id, { ...record, onboardDate });
//           }
//         }
//       });

//       const today = new Date();
//       let pendingSum = 0;
//       let pendingCount = 0;
//       let paidCount = 0;

//       for (const record of latestMap.values()) {
//         const onboardDate = record.onboarded_date ? new Date(record.onboarded_date) : new Date(record.closed_at);
//         const cycleDays = parseInt(record.subscription_cycle);
//         const endDate = new Date(onboardDate);
//         endDate.setDate(endDate.getDate() + cycleDays);

//         if (endDate < today) {
//           pendingSum += parseFloat(record.sale_value || 0);
//           pendingCount += 1;
//         } else {
//           paidCount += 1;
//         }
//       }

//       setPendingRevenue(pendingSum);
//       setPendingClientCount(pendingCount);
//       setPaidClientCount(paidCount);
//     };


//   useEffect(() => {
//     fetchTotalCollected();
//     fetchRevenueData();
//     fetchPendingRevenue();
    
//   }, [startDate, endDate]);

//   const COLORS = ['#0088FE', '#00C49F', '#FF8042'];

//     const samplePieData = [
//   { name: 'Usable Revenue', value: usableRevenue ?? 0 },
//   { name: 'Deferred Revenue', value: deferredRevenue ?? 0 },
//   { name: 'Pending', value: pendingRevenue ?? 0 },
// ];

//   return (
//     <div className="w-full min-h-screen px-8 py-6 space-y-6 bg-white">
//       <div className="flex flex-col sm:flex-row justify-between gap-2">
//         <h1 className="text-2xl font-bold">Complete Revenue Analysis</h1>

//         <div className="flex flex-col sm:flex-row gap-2 items-center">
//           <DropdownMenu>
//             <DropdownMenuTrigger asChild>
//               <Button variant="outline" className="min-w-[200px]">
//                 {startDate && endDate ? `📅 ${startDate} → ${endDate}` : '📅 Date Range'}
//               </Button>
//             </DropdownMenuTrigger>
//             <DropdownMenuContent className="p-4 space-y-4 w-[250px] sm:w-[300px]">
//               <div className="space-y-2">
//                 <Label className="text-sm text-gray-600">Start Date</Label>
//                 <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
//               </div>
//               <div className="space-y-2">
//                 <Label className="text-sm text-gray-600">End Date</Label>
//                 <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
//               </div>
//               <Button
//   variant="ghost"
//   className="text-red-500 text-sm p-0"
//   onClick={() => {
//     setStartDate("");
//     setEndDate("");
//     fetchTotalCollected();  // 👈 Re-fetch full data
//     fetchRevenueData();
//     fetchPendingRevenue();
//   }}
// >
//   ❌ Clear Filter
// </Button>

//             </DropdownMenuContent>
//           </DropdownMenu>

//           <Button onClick={() => window.close()}>Close Tab</Button>
//         </div>
//       </div>

//       {/* Top 3 Cards */}
//       <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
//         <Card className="h-[105px]">
//           <CardHeader>
//             <CardTitle className="font-semibold">Total Collected</CardTitle>
//           </CardHeader>
//           <CardContent>
//             <p className="font-semibold">{totalCollected!==null? `${formatCurrency(totalCollected ?? 0)}`:'Loading...'}</p>
//           </CardContent>
//         </Card>

//         <Card className="h-[105px]">
//           <CardHeader>
//             <CardTitle>Usable Revenue</CardTitle>
//           </CardHeader>
//           <CardContent>
//              <p className="font-semibold">{usableRevenue !== null ? `$${usableRevenue.toLocaleString()}` : 'Loading...'}</p>
//           </CardContent>
//         </Card>

//         <Card className="h-[105px]">
//           <CardHeader>
//             <CardTitle>Deferred Revenue</CardTitle>
//           </CardHeader>
//           <CardContent>
//             <p className="font-semibold">{deferredRevenue!==0 ? `${formatCurrency(deferredRevenue) }`:'Loading...'}</p>
//           </CardContent>
//         </Card>

//         <Card className="h-[105px]">
//           <CardHeader>
//             <CardTitle>Payments pending</CardTitle>
//           </CardHeader>
//           <CardContent>
//             <p className="font-semibold"> {pendingRevenue !== null ? `$${pendingRevenue.toLocaleString()}` : 'Loading...'}</p>
//           </CardContent>
//         </Card>
//         <Card className="h-[105px]">
//           <CardHeader>
//             <CardTitle>Pending clients</CardTitle>
//           </CardHeader>
//           <CardContent>
//             <p className=" font-semibold">{pendingClientCount !== null ? `${pendingClientCount} clients overdue` : 'Loading...'}</p>
//           </CardContent>
//         </Card>
//         <Card className="h-[105px]">
//           <CardHeader>
//             <CardTitle>Clients paid</CardTitle>
//           </CardHeader>
//           <CardContent >
//             <p className="font-semibold">{paidClientCount !== null ? `${paidClientCount} clients` : 'Loading...'}</p>
//           </CardContent>
//         </Card>
//       </div>

//       {/* Pie Chart + Line Graph Row */}
// <div className="flex flex-col md:flex-row gap-3">
// <Card className="w-[100px] md:w-[33%]">
//           <CardHeader>
//             <CardTitle>Revenue Split</CardTitle>
//           </CardHeader>
// <CardContent className="h-[300px]">
//      {mounted && (
//   <ResponsiveContainer width="100%" height="100%">
//   <PieChart
//     margin={{ top: 20, right: 60, left: 20, bottom: 20 }}
//   >
//     <Pie
//       data={samplePieData}
//       cx="40%"              // move pie to the left
//       cy="50%"
//       outerRadius={80}
//       dataKey="value"
//       label={({ percent }) =>
//         `${(percent * 100).toFixed(0)}%`
//       }
//       labelLine={false}
//     >
//       {samplePieData.map((entry, index) => (
//         <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
//       ))}
//     </Pie>

//     {/* ✅ Tooltip on hover */}
//     <Tooltip
//       formatter={(value, name) => [`$${value}`, name]}
//     />

//     {/* ✅ Vertical Legend on right */}
//     <Legend
//       layout="vertical"
//       verticalAlign="middle"
//       align="right"
//     />
//   </PieChart>
// </ResponsiveContainer>
//  )}

//           </CardContent>
//         </Card>

// <Card className="w-[75px] md:w-[28%]">
//           <CardHeader>
//             <CardTitle>Source of Revenue </CardTitle>
//           </CardHeader>
//           <CardContent className="h-[200px] flex items-center justify-center text-muted-foreground">
//             {/* You can insert a LineChart here later */}
//             <p>[ Line Graph Placeholder ]</p>
//           </CardContent>
//         </Card>

// <Card className="w-[125px] md:w-[41.25%]">
//           <CardHeader>
//             <CardTitle>Salaries and Expenses</CardTitle>
//           </CardHeader>
//           <CardContent className="h-[200px] flex items-center justify-center text-muted-foreground">
//             {/* You can insert a LineChart here later */}
//             <p>[ Line Graph Placeholder ]</p>
//           </CardContent>
//         </Card>
//       </div>

//       {/* Tables for Salary + Client Lifecycle + Expenses */}
//       <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
//         <Card>
//           <CardHeader>
//             <CardTitle>Salary Summary</CardTitle>
//           </CardHeader>
//           <CardContent>
//             <p className="text-sm text-muted-foreground">Coming soon...</p>
//           </CardContent>
//         </Card>

//         <Card>
//           <CardHeader>
//             <CardTitle>Client Lifecycle</CardTitle>
//           </CardHeader>
//           <CardContent>
//             <p className="text-sm text-muted-foreground">Coming soon...</p>
//           </CardContent>
//         </Card>
      

//       <Card className='h-[300px]'>
//         <CardHeader>
//           <CardTitle>Expense Categories</CardTitle>
//         </CardHeader>
//         <CardContent>
//           <p className="text-sm text-muted-foreground">Coming soon...</p>
//         </CardContent>
//       </Card>
//       </div>
//     </div>
//   );
// }





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
  closed_at: string;                 // ISO
  onboarded_date: string | null;     // ISO/Date
  subscription_cycle: number | string | null; // days

  // revenue-source columns
  application_sale_value: number | string | null;
  resume_sale_value: number | string | null;
  linkedin_sale_value: number | string | null;
  portfolio_sale_value: number | string | null;
  github_sale_value: number | string | null;
  courses_sale_value: number | string | null;
  badge_value: number | string | null;
  custom_sale_value: number | string | null;
  custom_label: string | null;
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

  // ----- UI state -----
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // date pickers hold local dates like "2025-10-01"
  const [startDate, setStartDate] = useState<string>(''); 
  const [endDate, setEndDate] = useState<string>('');     

  // ----- KPIs -----
  const [totalCollected, setTotalCollected] = useState<number | null>(null);
  const [usableRevenue, setUsableRevenue] = useState<number | null>(null);
  const [pendingRevenue, setPendingRevenue] = useState<number | null>(null);
  const [pendingClientCount, setPendingClientCount] = useState<number | null>(null);
  const [paidClientCount, setPaidClientCount] = useState<number | null>(null);

  // ----- Source-of-revenue totals & averages -----
  const [sourceTotals, setSourceTotals] = useState<Record<SourceKey, number>>({
    application: 0, resume: 0, linkedin: 0, portfolio: 0,
    github: 0, courses: 0, badge: 0, custom: 0,
  });
  const [sourceAverages, setSourceAverages] = useState<Record<SourceKey, number>>({
    application: 0, resume: 0, linkedin: 0, portfolio: 0,
    github: 0, courses: 0, badge: 0, custom: 0,
  });
  const [customDisplayLabel, setCustomDisplayLabel] = useState<string>('custom');

  // counts for new / renewal per source (lead-based counts)
const [sourceNewCounts, setSourceNewCounts] = useState<Record<SourceKey, number>>({
  application: 0, resume: 0, linkedin: 0, portfolio: 0,
  github: 0, courses: 0, badge: 0, custom: 0,
});
const [sourceRenewalCounts, setSourceRenewalCounts] = useState<Record<SourceKey, number>>({
  application: 0, resume: 0, linkedin: 0, portfolio: 0,
  github: 0, courses: 0, badge: 0, custom: 0,
});

  useEffect(() => setMounted(true), []);

  // ---------- helpers ----------
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

  // Convert local date range to UTC ISO boundaries
  const localRangeToUTC = (start?: string, end?: string) => {
    if (!start || !end) return { startUTC: undefined, endUTC: undefined };
    const s = new Date(`${start}T00:00:00`);
    const e = new Date(`${end}T23:59:59.999`);
    return { startUTC: s.toISOString(), endUTC: e.toISOString() };
  };

  // Inclusive-of-start-day accrual, clamped to [0, cycleDays]
  const calculateUsableRevenueUntilToday = (
    start: Date,
    cycleDays: number,
    totalAmount: number
  ): number => {
    const now = new Date();
    const end = new Date(start);
    end.setDate(end.getDate() + cycleDays);

    if (now < start) return 0;

    const actualEnd = now < end ? now : end;
    const ms = actualEnd.getTime() - start.getTime();
    const daysPassed = Math.min(
      cycleDays,
      Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)) + 1)
    );

    const perDay = totalAmount / cycleDays;
    const usable = perDay * daysPassed;
    return Number.isFinite(usable) ? Number(usable.toFixed(2)) : 0;
  };

  // helper to create a stable lead key (avoid grouping null/empty together)
const getLeadKey = (r: SaleRow) => {
  const id = r.lead_id ? String(r.lead_id).trim() : '';
  // if you have email or other fallback you can use it here:
  const fallbackEmail = (r as any).email ? String((r as any).email).trim() : '';
  if (id.length > 0) return id;
  if (fallbackEmail.length > 0) return `email:${fallbackEmail}`;
  return null; // orphan row; won't be counted towards lead-based counts
};

 const fetchAll = async () => {
  // request id to avoid race/stale updates
  (fetchAll as any).currentRequestId = ((fetchAll as any).currentRequestId || 0) + 1;
  const reqId = (fetchAll as any).currentRequestId;

  setIsLoading(true);

  try {
    // Helper parsers
    const parseLocalDate = (s?: string | null) => {
      if (!s) return undefined;
      return s.includes('T') ? new Date(s) : new Date(`${s}T00:00:00`);
    };

    const getLeadKey = (r: SaleRow) => {
      const id = r.lead_id ? String(r.lead_id).trim() : '';
      const fallbackEmail = (r as any).email ? String((r as any).email).trim() : '';
      if (id.length > 0) return id;
      if (fallbackEmail.length > 0) return `email:${fallbackEmail}`;
      return null;
    };

    // Which mode: date-range selected or not?
    const hasDateRange = !!(startDate && endDate);
    let rowsInRange: SaleRow[] = [];
    let allRows: SaleRow[] = [];

    // Build base projection for both queries
    const projection = `
      id,
      lead_id,
      sale_value,
      closed_at,
      onboarded_date,
      subscription_cycle,
      application_sale_value,
      resume_sale_value,
      linkedin_sale_value,
      portfolio_sale_value,
      github_sale_value,
      courses_sale_value,
      badge_value,
      custom_sale_value,
      custom_label,
      email
    `;

    if (hasDateRange) {
      // Convert to UTC ISO boundaries for queries
      const { startUTC, endUTC } = localRangeToUTC(startDate, endDate);

      // Fetch ALL rows (to compute overall lead counts for New/Renewal)
      const allQ = supabase.from('sales_closure').select(projection).order('closed_at', { ascending: true });

      // Fetch only rows within selected range (to decide which leads count for the selected window)
      let rangeQ = supabase.from('sales_closure').select(projection).order('closed_at', { ascending: true });
      if (startUTC && endUTC) rangeQ = rangeQ.gte('closed_at', startUTC).lte('closed_at', endUTC);

      const [allRes, rangeRes] = await Promise.all([allQ, rangeQ]);

      // stale guard
      if (reqId !== (fetchAll as any).currentRequestId) return;

      if (allRes.error) throw allRes.error;
      if (rangeRes.error) throw rangeRes.error;

      allRows = (allRes.data as SaleRow[]) ?? [];
      rowsInRange = (rangeRes.data as SaleRow[]) ?? [];
    } else {
      // No date range: just fetch all rows (previous behavior)
      const q = supabase.from('sales_closure').select(projection).order('closed_at', { ascending: true });
      const { data, error } = await q;

      if (reqId !== (fetchAll as any).currentRequestId) return;
      if (error) throw error;

      allRows = (data as SaleRow[]) ?? [];
      rowsInRange = allRows; // treat entire table as the "range"
    }

    // ---------- Basic aggregates: totalCollected, usableRevenue ----------
    const totalCollectedNum = allRows.reduce((acc, r) => acc + safeNumber(r.sale_value, 0), 0);

    const usableNum = allRows.reduce((acc, r) => {
      const cycle = safeCycleDays(r.subscription_cycle, 30);
      const start = parseLocalDate(r.onboarded_date ?? r.closed_at) ?? parseLocalDate(r.closed_at)!;
      const amount = safeNumber(r.sale_value, 0);
      return acc + calculateUsableRevenueUntilToday(start, cycle, amount);
    }, 0);

    // ---------- latest record by lead (for pending vs paid counts) ----------
    const latestByLead = new Map<string, (SaleRow & { onboardDate: Date })>();
    allRows.forEach((r) => {
      const key = getLeadKey(r);
      if (!key) return;
      const onboardDate = parseLocalDate(r.onboarded_date) ?? parseLocalDate(r.closed_at)!;
      const existing = latestByLead.get(key);
      if (!existing || onboardDate > existing.onboardDate) {
        latestByLead.set(key, { ...r, onboardDate });
      }
    });

    let pendingSum = 0;
    let pendingCount = 0;
    let paidCount = 0;
    const today = new Date();

    for (const r of latestByLead.values()) {
      const start = parseLocalDate(r.onboarded_date) ?? parseLocalDate(r.closed_at)!;
      const cycle = safeCycleDays(r.subscription_cycle, 30);
      const end = new Date(start);
      end.setDate(end.getDate() + cycle);

      if (end < today) {
        pendingSum += safeNumber(r.sale_value, 0);
        pendingCount += 1;
      } else {
        paidCount += 1;
      }
    }

    // ---------- source totals & averages (based on rowsInRange or allRows? keep totals on rowsInRange to reflect selected range) ----------
    // You may want totals/averages to reflect the selected range. Current implementation uses rowsInRange.
    const totals: Record<SourceKey, number> = {
      application: 0, resume: 0, linkedin: 0, portfolio: 0,
      github: 0, courses: 0, badge: 0, custom: 0,
    };
    const counts: Record<SourceKey, number> = {
      application: 0, resume: 0, linkedin: 0, portfolio: 0,
      github: 0, courses: 0, badge: 0, custom: 0,
    };

    rowsInRange.forEach((r) => {
      (Object.keys(SOURCE_FIELDS) as SourceKey[]).forEach((key) => {
        const col = SOURCE_FIELDS[key].column;
        const val = safeNumber((r as any)[col], 0);
        if (val !== 0) {
          totals[key] += val;
          counts[key] += 1;
        }
      });
    });

    const avgs: Record<SourceKey, number> = {
      application: 0, resume: 0, linkedin: 0, portfolio: 0,
      github: 0, courses: 0, badge: 0, custom: 0,
    };
    (Object.keys(SOURCE_FIELDS) as SourceKey[]).forEach((k) => {
      avgs[k] = counts[k] > 0 ? Number((totals[k] / counts[k]).toFixed(2)) : 0;
      totals[k] = Number(totals[k].toFixed(2));
    });

    // ---------- custom label -->
    const lastCustom = [...allRows]
      .sort((a, b) => new Date(String(b.closed_at)).getTime() - new Date(String(a.closed_at)).getTime())
      .find((r) => (r.custom_label ?? '').toString().trim().length > 0);
    const customLabel = lastCustom?.custom_label?.toString().trim() || 'custom';

    // ---------- NEW logic: compute overall per-lead source counts from whole table (allRows) ----------
    const overallLeadSourceCounts = new Map<string, Record<SourceKey, number>>();
    allRows.forEach((r) => {
      const leadKey = getLeadKey(r);
      if (!leadKey) return;
      if (!overallLeadSourceCounts.has(leadKey)) {
        overallLeadSourceCounts.set(leadKey, {
          application: 0, resume: 0, linkedin: 0, portfolio: 0,
          github: 0, courses: 0, badge: 0, custom: 0,
        });
      }
      const counter = overallLeadSourceCounts.get(leadKey)!;
      (Object.keys(SOURCE_FIELDS) as SourceKey[]).forEach((key) => {
        const col = SOURCE_FIELDS[key].column;
        const val = safeNumber((r as any)[col], 0);
        if (val > 0) {
          counter[key] = (counter[key] || 0) + 1;
        }
      });
    });

    // ---------- Now compute New / Renewal counts based on the selected range:
    // We need to count unique leads that have at least one row in the selected range (rowsInRange)
    // AND whose overallLeadSourceCounts per source is 1 (New) or >1 (Renewal).
    const newCounts: Record<SourceKey, number> = {
      application: 0, resume: 0, linkedin: 0, portfolio: 0,
      github: 0, courses: 0, badge: 0, custom: 0,
    };
    const renewalCounts: Record<SourceKey, number> = {
      application: 0, resume: 0, linkedin: 0, portfolio: 0,
      github: 0, courses: 0, badge: 0, custom: 0,
    };

    // We'll keep sets so that each lead is counted only once per source
    const countedNewPerSource: Record<SourceKey, Set<string>> = {
      application: new Set(), resume: new Set(), linkedin: new Set(), portfolio: new Set(),
      github: new Set(), courses: new Set(), badge: new Set(), custom: new Set(),
    };
    const countedRenewalPerSource: Record<SourceKey, Set<string>> = {
      application: new Set(), resume: new Set(), linkedin: new Set(), portfolio: new Set(),
      github: new Set(), courses: new Set(), badge: new Set(), custom: new Set(),
    };

    // For each row in the selected window, see if that lead qualifies for new or renewal for each source.
    // If no date range selected, rowsInRange === allRows, so this still works.
    rowsInRange.forEach((r) => {
      const leadKey = getLeadKey(r);
      if (!leadKey) return;

      const overall = overallLeadSourceCounts.get(leadKey) ?? {
        application: 0, resume: 0, linkedin: 0, portfolio: 0,
        github: 0, courses: 0, badge: 0, custom: 0,
      };

      (Object.keys(SOURCE_FIELDS) as SourceKey[]).forEach((key) => {
        const col = SOURCE_FIELDS[key].column;
        const val = safeNumber((r as any)[col], 0);

        if (val <= 0) return; // this row doesn't contribute for that source

        // If overall count is exactly 1, this lead is "new" for that source (but count only once)
        if (overall[key] === 1) {
          if (!countedNewPerSource[key].has(leadKey)) {
            countedNewPerSource[key].add(leadKey);
            newCounts[key] += 1;
          }
        } else if (overall[key] > 1) {
          // overall occurrences > 1 => renewal candidate; count unique lead once
          if (!countedRenewalPerSource[key].has(leadKey)) {
            countedRenewalPerSource[key].add(leadKey);
            renewalCounts[key] += 1;
          }
        }
      });
    });

    // ---------- finally set state (guard stale) ----------
    if (reqId !== (fetchAll as any).currentRequestId) return;

    setTotalCollected(Number(totalCollectedNum.toFixed(2)));
    setUsableRevenue(Number(usableNum.toFixed(2)));
    setPendingRevenue(Number(pendingSum.toFixed(2)));
    setPendingClientCount(pendingCount);
    setPaidClientCount(paidCount);
    setSourceTotals(totals);
    setSourceAverages(avgs);
    setCustomDisplayLabel(customLabel);
    setSourceNewCounts(newCounts);
    setSourceRenewalCounts(renewalCounts);
  } catch (err) {
    console.error('fetchAll failed:', err);

    // deterministic reset on error
    setTotalCollected(0);
    setUsableRevenue(0);
    setPendingRevenue(0);
    setPendingClientCount(0);
    setPaidClientCount(0);
    setSourceTotals({
      application: 0, resume: 0, linkedin: 0, portfolio: 0,
      github: 0, courses: 0, badge: 0, custom: 0,
    });
    setSourceAverages({
      application: 0, resume: 0, linkedin: 0, portfolio: 0,
      github: 0, courses: 0, badge: 0, custom: 0,
    });
    setSourceNewCounts({
      application: 0, resume: 0, linkedin: 0, portfolio: 0,
      github: 0, courses: 0, badge: 0, custom: 0,
    });
    setSourceRenewalCounts({
      application: 0, resume: 0, linkedin: 0, portfolio: 0,
      github: 0, courses: 0, badge: 0, custom: 0,
    });
    setCustomDisplayLabel('custom');
  } finally {
    if (reqId === (fetchAll as any).currentRequestId) {
      setIsLoading(false);
    }
  }
};


  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate]);

  // derived
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


  
// Custom legend that shows color, label, and percentage
// Custom legend that shows color, label, and percentage (two decimals)
const CustomLegend = ({
  payload,
  total,
}: {
  payload?: Array<any>;
  total: number;
}) => {
  return (
    <ul className="space-y-2">
      {payload?.map((entry) => {
        const value = Number(entry?.payload?.value) || 0;
        const pctNum = total > 0 ? (value / total) * 100 : 0;
        const pct = pctNum.toFixed(2); // <-- two decimals
        return (
          <li key={entry.value} className="flex items-center gap-2 text-sm">
            <span
              className="inline-block w-3 h-3 rounded-sm"
              style={{ backgroundColor: entry.color }}
            />
            <span className="capitalize">{entry.value}</span>
            <span className="ml-auto font-medium">{pct}%</span>
          </li>
        );
      })}
    </ul>
  );
};



  // Pie for source totals
  const pieDataSources = useMemo(() => {
    const items = (Object.keys(SOURCE_FIELDS) as SourceKey[]).map((k) => {
      const baseLabel = SOURCE_FIELDS[k].label;
      const label = k === 'custom' ? (customDisplayLabel || 'custom') : baseLabel;
      return { name: label, value: sourceTotals[k] };
    });
    // keep only positive slices
    return items.filter((i) => i.value > 0);
  }, [sourceTotals, customDisplayLabel]);

  const showLoadingKPI =
    isLoading ||
    totalCollected === null ||
    usableRevenue === null ||
    deferredRevenue === null ||
    pendingRevenue === null ||
    pendingClientCount === null ||
    paidClientCount === null;

    const totalSources = useMemo(
  () => pieDataSources.reduce((acc, d) => acc + (Number(d.value) || 0), 0),
  [pieDataSources]
);


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
            <DropdownMenuContent className="p-4 space-y-4 w-[250px] sm:w-[300px]">
              <div className="space-y-2">
                <Label className="text-sm text-gray-600">Start Date</Label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-gray-600">End Date</Label>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>

              <div className="flex items-center justify-between">
                <Button
                  variant="secondary"
                  onClick={() => {
                    if (!startDate || !endDate) return;
                    fetchAll();
                  }}
                >
                  Apply
                </Button>

                <Button
                  variant="ghost"
                  className="text-red-500"
                  onClick={() => {
                    setStartDate('');
                    setEndDate('');
                    fetchAll();
                  }}
                >
                  ❌ Clear Filter
                </Button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button onClick={() => router.back()}>Close</Button>
        </div>
      </div>

      {/* Top 6 Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
        <Card className="h-[105px]">
          <CardHeader>
            <CardTitle className="font-semibold">Total Collected</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-semibold">
              {showLoadingKPI ? 'Loading…' : formatCurrency(totalCollected!)}
            </p>
          </CardContent>
        </Card>

        <Card className="h-[105px]">
          <CardHeader>
            <CardTitle>Usable Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-semibold">
              {showLoadingKPI ? 'Loading…' : formatCurrency(usableRevenue!)}
            </p>
          </CardContent>
        </Card>

        <Card className="h-[105px]">
          <CardHeader>
            <CardTitle>Deferred Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-semibold">
              {showLoadingKPI ? 'Loading…' : formatCurrency(deferredRevenue!)}
            </p>
          </CardContent>
        </Card>

        <Card className="h-[105px]">
          <CardHeader>
            <CardTitle>Payments Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-semibold">
              {showLoadingKPI ? 'Loading…' : formatCurrency(pendingRevenue!)}
            </p>
          </CardContent>
        </Card>

        <Card className="h-[105px]">
          <CardHeader>
            <CardTitle>Pending Clients</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-semibold">
              {showLoadingKPI ? 'Loading…' : `${pendingClientCount} clients overdue`}
            </p>
          </CardContent>
        </Card>

        <Card className="h-[105px]">
          <CardHeader>
            <CardTitle>Clients Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-semibold">
              {showLoadingKPI ? 'Loading…' : `${paidClientCount} clients`}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue split pie (existing) + Source of revenue (new) + Expenses placeholder
      <div className="flex flex-col md:flex-row gap-3">
        <Card className="md:basis-1/3">
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

        <Card className="md:basis-1/3">
          <CardHeader>
            <CardTitle>Source of Revenue</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-4">
            <div className="flex-1 rounded-xl border p-3">
              <p className="text-sm font-semibold mb-2">Total</p>
              <ul className="space-y-1 text-sm">
                {(Object.keys(SOURCE_FIELDS) as SourceKey[]).map((k) => {
                  const base = SOURCE_FIELDS[k].label;
                  const label = k === 'custom' ? (customDisplayLabel || 'custom') : base;
                  return (
                    <li key={k} className="flex justify-between">
                      <span className="capitalize">{label}</span>
                      <span className="font-medium">{formatCurrency(sourceTotals[k] || 0)}</span>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="flex-1 rounded-xl border p-3">
              <p className="text-sm font-semibold mb-2">Average</p>
              <ul className="space-y-1 text-sm">
                {(Object.keys(SOURCE_FIELDS) as SourceKey[]).map((k) => {
                  const base = SOURCE_FIELDS[k].label;
                  const label = k === 'custom' ? (customDisplayLabel || 'custom') : base;
                  return (
                    <li key={k} className="flex justify-between">
                      <span className="capitalize">{label}</span>
                      <span className="font-medium">{formatCurrency(sourceAverages[k] || 0)}</span>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="flex-1 h-[220px]">
              {mounted && (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieDataSources}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {pieDataSources.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any, name: string) => [formatCurrency(Number(value)), name]} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="md:basis-1/3">
          <CardHeader>
            <CardTitle>Salaries and Expenses</CardTitle>
          </CardHeader>
          <CardContent className="h-[200px] flex items-center justify-center text-muted-foreground">
            <p>[ Line Graph Placeholder ]</p>
          </CardContent>
        </Card>
      </div> */}

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
<div className="flex-shrink-0 w-full md:w-[420px] h-[260px] px-10">
  {mounted && (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart margin={{ top: 20, right: 160, left: 90, bottom: 20 }}>
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
