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


'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent } from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';



export default function FullAnalysisPage() {
  const [startDate, setStartDate] = useState<string>(""); // empty on load
const [endDate, setEndDate] = useState<string>("");     // empty on load


  const [totalCollected, setTotalCollected] = useState<number | null>(null);
  const [usableRevenue, setUsableRevenue] = useState<number | null>(null);
  const [pendingRevenue, setPendingRevenue] = useState<number | null>(null);
  const [pendingClientCount, setPendingClientCount] = useState<number | null>(null);
  const [paidClientCount, setPaidClientCount] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);


  const calculateUsableRevenueUntilToday = (startDate: Date, cycleDays: number, totalAmount: number): number => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(start.getDate() + cycleDays);

    if (now < start) return 0;
    if (start > end) return 0;

    const actualEnd = now < end ? now : end;
    const daysPassed = Math.floor((actualEnd.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const perDayRevenue = totalAmount / cycleDays;

    return daysPassed > 0 ? parseFloat((perDayRevenue * daysPassed).toFixed(2)) : 0;
  };



  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  useEffect(() => setMounted(true), []);
    const fetchTotalCollected = async () => {
  let query = supabase.from("sales_closure").select("sale_value");

  if (startDate && endDate) {
    const startISO = new Date(startDate).toISOString();
    const endISO = new Date(endDate).toISOString();
    query = query.gte("closed_at", startISO).lte("closed_at", endISO);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching sale values:", error);
    return;
  }

  const total = data?.reduce((acc, item) => acc + (item.sale_value || 0), 0);
  setTotalCollected(total);
};

    const fetchRevenueData = async () => {
      let query=supabase
        .from('sales_closure')
        .select('sale_value, closed_at, subscription_cycle');

        if (startDate && endDate) {
    query = query
      .gte('closed_at', `${startDate}T00:00:00Z`)
      .lte('closed_at', `${endDate}T23:59:59Z`);
  }
    const { data, error } = await query;

      if (error) return console.error('Error fetching sales:', error);

      const usable = data?.reduce((acc, item) => {
        const cycle = parseInt(item.subscription_cycle);
        const startDate = new Date(item.closed_at);
        const amount = parseFloat(item.sale_value || 0);
        return acc + calculateUsableRevenueUntilToday(startDate, cycle, amount);
      }, 0);

      setUsableRevenue(usable);
    };
 

  const deferredRevenue = (totalCollected ?? 0) - (usableRevenue ?? 0);

  const fetchPendingRevenue = async () => {
      let query= supabase
        .from('sales_closure')
        .select('lead_id, closed_at, onboarded_date, subscription_cycle, sale_value');

        if (startDate && endDate) {
  query = query
    .gte('closed_at', `${startDate}T00:00:00Z`)
    .lte('closed_at', `${endDate}T23:59:59Z`);
}

  const { data, error } = await query;
      if (error) return console.error('Error fetching pending payments:', error);

      const latestMap = new Map();

      data?.forEach((record) => {
        const onboardDate = record.onboarded_date ? new Date(record.onboarded_date) : new Date(record.closed_at);
        if (!latestMap.has(record.lead_id)) {
          latestMap.set(record.lead_id, { ...record, onboardDate });
        } else {
          const existing = latestMap.get(record.lead_id);
          if (onboardDate > existing.onboardDate) {
            latestMap.set(record.lead_id, { ...record, onboardDate });
          }
        }
      });

      const today = new Date();
      let pendingSum = 0;
      let pendingCount = 0;
      let paidCount = 0;

      for (const record of latestMap.values()) {
        const onboardDate = record.onboarded_date ? new Date(record.onboarded_date) : new Date(record.closed_at);
        const cycleDays = parseInt(record.subscription_cycle);
        const endDate = new Date(onboardDate);
        endDate.setDate(endDate.getDate() + cycleDays);

        if (endDate < today) {
          pendingSum += parseFloat(record.sale_value || 0);
          pendingCount += 1;
        } else {
          paidCount += 1;
        }
      }

      setPendingRevenue(pendingSum);
      setPendingClientCount(pendingCount);
      setPaidClientCount(paidCount);
    };


  useEffect(() => {
    fetchTotalCollected();
    fetchRevenueData();
    fetchPendingRevenue();
    
  }, [startDate, endDate]);

  const COLORS = ['#0088FE', '#00C49F', '#FF8042'];

    const samplePieData = [
  { name: 'Usable Revenue', value: usableRevenue ?? 0 },
  { name: 'Deferred Revenue', value: deferredRevenue ?? 0 },
  { name: 'Pending', value: pendingRevenue ?? 0 },
];

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
              <Button
  variant="ghost"
  className="text-red-500 text-sm p-0"
  onClick={() => {
    setStartDate("");
    setEndDate("");
    fetchTotalCollected();  // 👈 Re-fetch full data
    fetchRevenueData();
    fetchPendingRevenue();
  }}
>
  ❌ Clear Filter
</Button>

            </DropdownMenuContent>
          </DropdownMenu>

          <Button onClick={() => window.close()}>Close Tab</Button>
        </div>
      </div>

      {/* Top 3 Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
        <Card className="h-[105px]">
          <CardHeader>
            <CardTitle className="font-semibold">Total Collected</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-semibold">{totalCollected!==null? `${formatCurrency(totalCollected ?? 0)}`:'Loading...'}</p>
          </CardContent>
        </Card>

        <Card className="h-[105px]">
          <CardHeader>
            <CardTitle>Usable Revenue</CardTitle>
          </CardHeader>
          <CardContent>
             <p className="font-semibold">{usableRevenue !== null ? `$${usableRevenue.toLocaleString()}` : 'Loading...'}</p>
          </CardContent>
        </Card>

        <Card className="h-[105px]">
          <CardHeader>
            <CardTitle>Deferred Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-semibold">{deferredRevenue!==0 ? `${formatCurrency(deferredRevenue) }`:'Loading...'}</p>
          </CardContent>
        </Card>

        <Card className="h-[105px]">
          <CardHeader>
            <CardTitle>Payments pending</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-semibold"> {pendingRevenue !== null ? `$${pendingRevenue.toLocaleString()}` : 'Loading...'}</p>
          </CardContent>
        </Card>
        <Card className="h-[105px]">
          <CardHeader>
            <CardTitle>Pending clients</CardTitle>
          </CardHeader>
          <CardContent>
            <p className=" font-semibold">{pendingClientCount !== null ? `${pendingClientCount} clients overdue` : 'Loading...'}</p>
          </CardContent>
        </Card>
        <Card className="h-[105px]">
          <CardHeader>
            <CardTitle>Clients paid</CardTitle>
          </CardHeader>
          <CardContent >
            <p className="font-semibold">{paidClientCount !== null ? `${paidClientCount} clients` : 'Loading...'}</p>
          </CardContent>
        </Card>
      </div>

      {/* Pie Chart + Line Graph Row */}
<div className="flex flex-col md:flex-row gap-3">
<Card className="w-[100px] md:w-[33%]">
          <CardHeader>
            <CardTitle>Revenue Split</CardTitle>
          </CardHeader>
<CardContent className="h-[300px]">
     {mounted && (
  <ResponsiveContainer width="100%" height="100%">
  <PieChart
    margin={{ top: 20, right: 60, left: 20, bottom: 20 }}
  >
    <Pie
      data={samplePieData}
      cx="40%"              // move pie to the left
      cy="50%"
      outerRadius={80}
      dataKey="value"
      label={({ percent }) =>
        `${(percent * 100).toFixed(0)}%`
      }
      labelLine={false}
    >
      {samplePieData.map((entry, index) => (
        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
      ))}
    </Pie>

    {/* ✅ Tooltip on hover */}
    <Tooltip
      formatter={(value, name) => [`$${value}`, name]}
    />

    {/* ✅ Vertical Legend on right */}
    <Legend
      layout="vertical"
      verticalAlign="middle"
      align="right"
    />
  </PieChart>
</ResponsiveContainer>
 )}

          </CardContent>
        </Card>

<Card className="w-[75px] md:w-[28%]">
          <CardHeader>
            <CardTitle>Source of Revenue </CardTitle>
          </CardHeader>
          <CardContent className="h-[200px] flex items-center justify-center text-muted-foreground">
            {/* You can insert a LineChart here later */}
            <p>[ Line Graph Placeholder ]</p>
          </CardContent>
        </Card>

<Card className="w-[125px] md:w-[41.25%]">
          <CardHeader>
            <CardTitle>Salaries and Expenses</CardTitle>
          </CardHeader>
          <CardContent className="h-[200px] flex items-center justify-center text-muted-foreground">
            {/* You can insert a LineChart here later */}
            <p>[ Line Graph Placeholder ]</p>
          </CardContent>
        </Card>
      </div>

      {/* Tables for Salary + Client Lifecycle + Expenses */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card>
          <CardHeader>
            <CardTitle>Salary Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Coming soon...</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Client Lifecycle</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Coming soon...</p>
          </CardContent>
        </Card>
      

      <Card className='h-[300px]'>
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
