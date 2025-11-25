// app/sales/followups/page.tsx
// "use client";

// import { useEffect, useState } from "react";
// import { supabase } from "@/utils/supabase/client";
// import { DashboardLayout } from "@/components/layout/dashboard-layout";

// import {
//   Table, TableBody, TableCell, TableHead, TableHeader, TableRow
// } from "@/components/ui/table";

// import {
//   Select, SelectTrigger, SelectValue, SelectItem, SelectContent
// } from "@/components/ui/select";

// import { Badge } from "@/components/ui/badge";
// import { Button } from "@/components/ui/button";

// // Types
// type SalesStage =
//   | "Prospect"
//   | "DNP"
//   | "Out of TG"
//   | "Not Interested"
//   | "Conversation Done"
//   | "sale done"
//   | "Target";

// interface Profile {
//   full_name: string;
//   roles: string;
// }

// export default function FollowUpsComponent() {
//   const [followUpsData, setFollowUpsData] = useState<any[]>([]);
//   const [followUpsFilter, setFollowUpsFilter] = useState<"today" | "all">("today");

//   const [userProfile, setUserProfile] = useState<Profile | null>(null);

//   // Helpers
//   const todayLocalYMD = () => new Date().toISOString().slice(0, 10);

//   const salesStages: SalesStage[] = [
//     "Prospect",
//     "DNP",
//     "Out of TG",
//     "Not Interested",
//     "Conversation Done",
//     "sale done",
//     "Target",
//   ];

//   const getStageColor = (stage: SalesStage) => {
//     switch (stage) {
//       case "Prospect": return "bg-blue-100 text-blue-800";
//       case "DNP": return "bg-yellow-100 text-yellow-800";
//       case "Out of TG":
//       case "Not Interested": return "bg-red-100 text-red-800";
//       case "Conversation Done": return "bg-purple-100 text-purple-800";
//       case "sale done": return "bg-green-100 text-green-800";
//       case "Target": return "bg-orange-100 text-orange-800";
//       default: return "bg-gray-100 text-gray-800";
//     }
//   };

//   // ----------------------------------------
//   // 🚀 FETCH USER PROFILE
//   // ----------------------------------------
//   const fetchUserProfile = async () => {
//     const { data: { user }, error } = await supabase.auth.getUser();
//     if (error || !user) return;

//     const { data, error: profileError } = await supabase
//       .from("profiles")
//       .select("full_name, roles")
//       .eq("auth_id", user.id)
//       .single();

//     if (!profileError) {
//       setUserProfile(data);
//     }
//   };

//   // ----------------------------------------
//   // 🚀 fetchFollowUps() EXACT AS YOU WROTE
//   // ----------------------------------------
//   const fetchFollowUps = async () => {
//     if (!userProfile) return [];

//     let leadsQuery = supabase
//       .from("leads")
//       .select("id, business_id, name, email, phone, assigned_to, current_stage")
//       .in("current_stage", ["DNP", "Conversation Done", "Target"]);

//     if (userProfile.roles === "Sales Associate") {
//       leadsQuery = leadsQuery.eq("assigned_to", userProfile.full_name);
//     }

//     const { data: leadsData, error: leadsError } = await leadsQuery;
//     if (leadsError) return [];

//     const businessIds = leadsData.map((l) => l.business_id);

//     const { data: historyData, error: historyError } = await supabase
//       .from("call_history")
//       .select("id, lead_id, followup_date, notes")
//       .in("lead_id", businessIds)
//       .order("followup_date", { ascending: false });

//     if (historyError) return [];

//     const mostRecentMap = new Map<
//       string,
//       { followup_date: string; notes: string }
//     >();

//     for (const entry of historyData) {
//       if (!mostRecentMap.has(entry.lead_id)) {
//         mostRecentMap.set(entry.lead_id, {
//           followup_date: entry.followup_date ?? "N/A",
//           notes: entry.notes ?? "N/A",
//         });
//       }
//     }

//     return leadsData.map((lead) => ({
//       ...lead,
//       followup_date: mostRecentMap.get(lead.business_id)?.followup_date ?? "N/A",
//       notes: mostRecentMap.get(lead.business_id)?.notes ?? "N/A",
//     }));
//   };

//   // ----------------------------------------
//   // 🚀 Stage Update
//   // ----------------------------------------
//   const handleStageUpdate = async (id: string, newStage: SalesStage) => {
//     try {
//       const { error } = await supabase
//         .from("leads")
//         .update({ current_stage: newStage })
//         .eq("id", id);

//       if (!error) {
//         const data = await fetchFollowUps();
//         setFollowUpsData(data);
//       }
//     } catch (_) {}
//   };

//   // ----------------------------------------
//   // INITIAL LOAD
//   // ----------------------------------------
//   useEffect(() => {
//     fetchUserProfile();
//   }, []);

//   useEffect(() => {
//     if (userProfile) {
//       fetchFollowUps().then(setFollowUpsData);
//     }
//   }, [userProfile]);

//   // ----------------------------------------
//   // FILTERED VIEW
//   // ----------------------------------------
//   const rows = followUpsData.filter((item) => {
//     if (followUpsFilter === "all") return true;
//     return item.followup_date === todayLocalYMD();
//   });

//   return (
//         <DashboardLayout>
//     <div className="p-6 space-y-6">

//       <h1 className="text-2xl font-bold">Follow Ups – DNP / Conversation Done</h1>

//       <div className="flex justify-end">
//         <Select
//           value={followUpsFilter}
//           onValueChange={(v: any) => setFollowUpsFilter(v)}
//         >
//           <SelectTrigger className="w-40">
//             <SelectValue placeholder="Filter by Date" />
//           </SelectTrigger>
//           <SelectContent>
//             <SelectItem value="today">Today</SelectItem>
//             <SelectItem value="all">All Dates</SelectItem>
//           </SelectContent>
//         </Select>
//       </div>

//       <div className="rounded-md border max-h-[75vh] overflow-auto">
//         <Table>
//           <TableHeader>
//             <TableRow>
//               <TableHead>S.No</TableHead>
//               <TableHead>Business ID</TableHead>
//               <TableHead>Name</TableHead>
//               <TableHead>Email</TableHead>
//               <TableHead>Phone</TableHead>
//               <TableHead>Assigned To</TableHead>
//               <TableHead>Stage</TableHead>
//               <TableHead>Follow-Up Date</TableHead>
//               <TableHead>Notes</TableHead>
//             </TableRow>
//           </TableHeader>

//           <TableBody>
//             {rows.length === 0 ? (
//               <TableRow>
//                 <TableCell colSpan={9} className="text-center py-6 text-gray-500">
//                   {followUpsFilter === "all"
//                     ? "No follow-up data available."
//                     : "There are no follow ups today."}
//                 </TableCell>
//               </TableRow>
//             ) : (
//               rows.map((item, index) => (
//                 <TableRow key={index}>
//                   <TableCell>{index + 1}</TableCell>
//                   <TableCell>{item.business_id}</TableCell>

//                   <TableCell
//                     className="text-blue-600 underline cursor-pointer"
//                     onClick={() =>
//                       window.open(`/leads/${item.business_id}`, "_blank")
//                     }
//                   >
//                     {item.name}
//                   </TableCell>

//                   <TableCell>{item.email}</TableCell>
//                   <TableCell>{item.phone}</TableCell>
//                   <TableCell>{item.assigned_to}</TableCell>

//                   <TableCell>
//                     <Select
//                       value={item.current_stage}
//                       onValueChange={(stage: any) =>
//                         handleStageUpdate(item.id, stage)
//                       }
//                     >
//                       <SelectTrigger className="w-40">
//                         <SelectValue />
//                       </SelectTrigger>
//                       <SelectContent>
//                         {salesStages.map((stage) => (
//                           <SelectItem key={stage} value={stage}>
//                             <Badge className={getStageColor(stage)}>
//                               {stage}
//                             </Badge>
//                           </SelectItem>
//                         ))}
//                       </SelectContent>
//                     </Select>
//                   </TableCell>

//                   <TableCell>{item.followup_date}</TableCell>
//                   <TableCell className="max-w-xs break-words">
//                     {item.notes}
//                   </TableCell>
//                 </TableRow>
//               ))
//             )}
//           </TableBody>
//         </Table>
//       </div>
//     </div>
//         </DashboardLayout>

//   );
// }








"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase/client";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { DashboardLayout } from "@/components/layout/dashboard-layout";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Search } from "lucide-react";
import dayjs from "dayjs";

type SalesStage = "Prospect" | "DNP" | "Out of TG" | "Not Interested" | "Conversation Done" | "sale done" | "Target";


interface Profile {
  full_name: string;
  roles: string;
}

interface FollowUpRow {
  id: string;
  business_id: string;
  name: string;
  email: string;
  phone: string;
  assigned_to: string;
  current_stage: SalesStage;
  followup_date: string; // YYYY-MM-DD or "N/A"
  notes: string;
}

type FollowUpsFilterType = "today" | "all";

type SortColumn = "business_id" | "name" | "email" | "followup_date";
type SortDirection = "asc" | "desc";

const salesStages: SalesStage[] = [
  "Prospect",
  "DNP",
  "Out of TG",
  "Not Interested",
  "Conversation Done",
  "Target",
  "sale done",
];

const getStageColor = (stage: SalesStage) => {
  switch (stage) {
    case "Prospect":
      return "bg-blue-100 text-blue-800";
    case "DNP":
      return "bg-yellow-100 text-yellow-800";
    case "Out of TG":
    case "Not Interested":
      return "bg-red-100 text-red-800";
    case "Conversation Done":
      return "bg-purple-100 text-purple-800";
    case "sale done":
      return "bg-green-100 text-green-800";
    case "Target":
      return "bg-orange-100 text-orange-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const todayLocalYMD = () => dayjs().format("YYYY-MM-DD");

// 👉 Extract numeric part for AWL- sorting
const extractNumber = (id: string) => {
  const numStr = id.replace(/[^0-9]/g, "");
  const num = Number(numStr);
  return Number.isNaN(num) ? 0 : num;
};

// Sort arrows (↑ / ↓ / ↑↓)
const SortArrows = ({
  column,
  activeColumn,
  direction,
}: {
  column: SortColumn;
  activeColumn: SortColumn;
  direction: SortDirection;
}) => {
  if (activeColumn !== column) return <span className="ml-1 text-xs text-gray-400">↑↓</span>;
  return (
    <span className="ml-1 text-xs">
      {direction === "asc" ? <span className="font-bold text-blue-600">↑</span> : <span className="font-bold text-blue-600">↓</span>}
    </span>
  );
};

export default function FollowUpsPage() {
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [followUpsData, setFollowUpsData] = useState<FollowUpRow[]>([]);
  const [followUpsFilter, setFollowUpsFilter] = useState<FollowUpsFilterType>("today");

  // Search
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isHoveringClear, setIsHoveringClear] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(30);

  // Sorting
  const [sortColumn, setSortColumn] = useState<SortColumn>("followup_date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc"); // default: latest first

  const [dateFilter, setDateFilter] = useState<"today" | "all">("today");
const [stageFilter, setStageFilter] = useState<string>("all");

  // ──────────────────────────────────────────
  // Fetch user profile first
  // ──────────────────────────────────────────
  useEffect(() => {
    const fetchProfile = async () => {
      const { data: authRes } = await supabase.auth.getUser();
      const authUser = authRes?.user;
      if (!authUser) return;

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("full_name, roles")
        .eq("auth_id", authUser.id)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
        return;
      }

      setUserProfile(profile);
    };

    fetchProfile();
  }, []);

  // ──────────────────────────────────────────
  // Fetch Follow Ups (same style as your code)
  // ──────────────────────────────────────────
  const fetchFollowUps = async (profile: Profile | null) => {
    if (!profile) return;

    try {
      setLoading(true);

      // 1) Fetch leads with DNP, Conversation Done, Target
      let leadsQuery = supabase
        .from("leads")
        .select("id, business_id, name, email, phone, assigned_to, current_stage")
        .in("current_stage", ["DNP", "Conversation Done", "Target"]);

      if (profile.roles === "Sales Associate") {
        leadsQuery = leadsQuery.eq("assigned_to", profile.full_name);
      }

      const { data: leadsData, error: leadsError } = await leadsQuery;
      if (leadsError) {
        console.error("❌ Error fetching leads:", leadsError);
        return;
      }

      if (!leadsData || leadsData.length === 0) {
        setFollowUpsData([]);
        return;
      }

      const businessIds = leadsData.map((l) => l.business_id);

      // 2) Fetch call_history for those leads
      const { data: historyData, error: historyError } = await supabase
        .from("call_history")
        .select("id, lead_id, followup_date, notes")
        .in("lead_id", businessIds)
        .order("followup_date", { ascending: false });

      if (historyError) {
        console.error("❌ Error fetching call history:", historyError);
        return;
      }

      // 3) Build most recent follow up per lead
      const mostRecentMap = new Map<
        string,
        { followup_date: string; notes: string }
      >();

      for (const entry of historyData || []) {
        if (!mostRecentMap.has(entry.lead_id)) {
          mostRecentMap.set(entry.lead_id, {
            followup_date: entry.followup_date ?? "N/A",
            notes: entry.notes ?? "N/A",
          });
        }
      }

      // 4) Merge into final rows
      const merged: FollowUpRow[] = (leadsData || []).map((lead: any) => {
        const latest = mostRecentMap.get(lead.business_id);
        return {
          id: lead.id,
          business_id: lead.business_id,
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
          assigned_to: lead.assigned_to,
          current_stage: lead.current_stage,
          followup_date: latest?.followup_date ?? "N/A",
          notes: latest?.notes ?? "N/A",
        };
      });

      setFollowUpsData(merged);
    } catch (err) {
      console.error("Error in fetchFollowUps:", err);
    } finally {
      setLoading(false);
    }
  };

  // Run once profile is available
  useEffect(() => {
    if (userProfile) {
      fetchFollowUps(userProfile);
    }
  }, [userProfile]);

  // ──────────────────────────────────────────
  // Filtering + Searching + Sorting + Pagination
  // ──────────────────────────────────────────

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

//   const filteredSortedRows = followUpsData
//     .filter((item) => {
//       // Filter by Today / All
//       if (followUpsFilter === "all") return true;
//       if (!item.followup_date || item.followup_date === "N/A") return false;
//       const today = todayLocalYMD();
//       return item.followup_date === today;
//     })
//     .filter((item) => {
//       // Search filter
//       const t = searchTerm.trim().toLowerCase();
//       if (!t) return true;
//       return (
//         (item.business_id || "").toLowerCase().includes(t) ||
//         (item.name || "").toLowerCase().includes(t) ||
//         (item.email || "").toLowerCase().includes(t) ||
//         (item.phone || "").toLowerCase().includes(t) ||
//         (item.notes || "").toLowerCase().includes(t)
//       );
//     })
//     .sort((a, b) => {
//       if (sortColumn === "business_id") {
//         const aNum = extractNumber(a.business_id);
//         const bNum = extractNumber(b.business_id);
//         return sortDirection === "asc" ? aNum - bNum : bNum - aNum;
//       }

//       if (sortColumn === "followup_date") {
//         const aVal =
//           a.followup_date && a.followup_date !== "N/A"
//             ? new Date(a.followup_date).getTime()
//             : 0;
//         const bVal =
//           b.followup_date && b.followup_date !== "N/A"
//             ? new Date(b.followup_date).getTime()
//             : 0;
//         return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
//       }

//       const aField = a[sortColumn] || "";
//       const bField = b[sortColumn] || "";
//       return sortDirection === "asc"
//         ? String(aField).localeCompare(String(bField))
//         : String(bField).localeCompare(String(aField));
//     });

const filteredSortedRows = followUpsData
  .filter((item) => {
    // Filter by Today / All
    if (followUpsFilter === "all") return true;
    if (!item.followup_date || item.followup_date === "N/A") return false;
    const today = todayLocalYMD();
    return item.followup_date === today;
  })
  .filter((item) => {
    // Search filter
    const t = searchTerm.trim().toLowerCase();
    if (!t) return true;
    return (
      (item.business_id || "").toLowerCase().includes(t) ||
      (item.name || "").toLowerCase().includes(t) ||
      (item.email || "").toLowerCase().includes(t) ||
      (item.phone || "").toLowerCase().includes(t) ||
      (item.notes || "").toLowerCase().includes(t)
    );
  })
  .filter((item) => {
    // ⭐ NEW: Stage Filter
    if (stageFilter === "all") return true;
    return item.current_stage === stageFilter;
  })
  .sort((a, b) => {
    if (sortColumn === "business_id") {
      const aNum = extractNumber(a.business_id);
      const bNum = extractNumber(b.business_id);
      return sortDirection === "asc" ? aNum - bNum : bNum - aNum;
    }

    if (sortColumn === "followup_date") {
      const aVal =
        a.followup_date && a.followup_date !== "N/A"
          ? new Date(a.followup_date).getTime()
          : 0;
      const bVal =
        b.followup_date && b.followup_date !== "N/A"
          ? new Date(b.followup_date).getTime()
          : 0;
      return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
    }

    const aField = a[sortColumn] || "";
    const bField = b[sortColumn] || "";
    return sortDirection === "asc"
      ? String(aField).localeCompare(String(bField))
      : String(bField).localeCompare(String(aField));
  });

  const totalRecords = filteredSortedRows.length;
  const totalPages =
    pageSize >= totalRecords || pageSize === 0
      ? 1
      : Math.ceil(totalRecords / pageSize);

  const startIndex = (page - 1) * pageSize;
  const pagedRows =
    pageSize >= totalRecords || pageSize === 0
      ? filteredSortedRows
      : filteredSortedRows.slice(startIndex, startIndex + pageSize);

  return (
    // <ProtectedRoute allowedRoles={["Sales", "Sales Associate", "Super Admin"]}>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Follow Ups – DNP / Conversation Done / Target</h1>

            <Select
              value={followUpsFilter}
              onValueChange={(v) => {
                setFollowUpsFilter(v as FollowUpsFilterType);
                setDateFilter(v as "today" | "all");
                setPage(1);
              }}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by Date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="all">All Dates</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Stats Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
           {dateFilter === "all" && (
  <Card>
    <CardHeader className="pb-2">
      <CardTitle className="text-sm font-medium">Total Follow Ups</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{filteredSortedRows.length}</div>
    </CardContent>
  </Card>
)}

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Today</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {
                    followUpsData.filter((item) => {
                      const today = todayLocalYMD();
                      return item.followup_date === today;
                    }).length
                  }
                </div>
              </CardContent>
            </Card>

            {/* <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Unique Clients</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {new Set(filteredSortedRows.map((f) => f.business_id)).size}
                </div>
              </CardContent>
            </Card> */}
          </div>

          {/* Search + Page size controls */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search box */}
            <div className="flex gap-3 flex-1">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search by Business ID, Name, Email, Phone, Notes..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Button
                disabled={isSearching || !searchInput.trim()}
                onClick={() => {
                  setIsSearching(true);
                  setSearchTerm(searchInput.trim().toLowerCase());
                  setPage(1);
                  setTimeout(() => setIsSearching(false), 200); // just UI feel
                }}
                className="w-28"
              >
                {isSearching ? "Searching..." : "Search"}
              </Button>

              <Button
                variant="outline"
                disabled={isSearching}
                onMouseEnter={() => setIsHoveringClear(true)}
                onMouseLeave={() => setIsHoveringClear(false)}
                onClick={() => {
                  setSearchInput("");
                  setSearchTerm("");
                  setPage(1);
                }}
                className="px-4 bg-red-50 text-gray-900 hover:bg-red-300 focus:ring-red-500 transition-all duration-200"
              >
                {isHoveringClear ? "Clear Search" : "❌"}
              </Button>
            </div>
<Select value={stageFilter} onValueChange={setStageFilter}>
  <SelectTrigger className="w-40 h-7">
    <SelectValue placeholder="Filter by Stage" />
  </SelectTrigger>

  <SelectContent>
    <SelectItem value="all">All Stages</SelectItem>
    <SelectItem value="Target">Target</SelectItem>
    <SelectItem value="DNP">DNP</SelectItem>
    <SelectItem value="Conversation Done">Conversation Done</SelectItem>
  </SelectContent>
</Select>

            {/* Page size select */}
            <Select
              value={String(pageSize === 0 ? "all" : pageSize)}
              onValueChange={(v) => {
                if (v === "all") {
                  setPageSize(0); // treat 0 as ALL
                } else {
                  setPageSize(Number(v));
                }
                setPage(1);
              }}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Rows per page" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30 per page</SelectItem>
                <SelectItem value="50">50 per page</SelectItem>
                <SelectItem value="100">100 per page</SelectItem>
                <SelectItem value="200">200 per page</SelectItem>
                <SelectItem value="500">500 per page</SelectItem>
                <SelectItem value="1000">1000 per page</SelectItem>
                <SelectItem value="2000">2000 per page</SelectItem>
                <SelectItem value="all">All</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="rounded-md border overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>S.No</TableHead>

                  {/* Business ID with AWL- numeric sort */}
                  <TableHead
                    className="cursor-pointer select-none"
                    onClick={() => handleSort("business_id")}
                  >
                    <span className="flex items-center">
                      Business ID
                      <SortArrows
                        column="business_id"
                        activeColumn={sortColumn}
                        direction={sortDirection}
                      />
                    </span>
                  </TableHead>

                  {/* Name */}
                  <TableHead
                    className="cursor-pointer select-none"
                    onClick={() => handleSort("name")}
                  >
                    <span className="flex items-center">
                      Name
                      <SortArrows
                        column="name"
                        activeColumn={sortColumn}
                        direction={sortDirection}
                      />
                    </span>
                  </TableHead>

                  {/* Email */}
                  <TableHead
                    className="cursor-pointer select-none"
                    onClick={() => handleSort("email")}
                  >
                    <span className="flex items-center">
                      Email
                      <SortArrows
                        column="email"
                        activeColumn={sortColumn}
                        direction={sortDirection}
                      />
                    </span>
                  </TableHead>

                  <TableHead>Phone</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Stage</TableHead>

                  {/* Follow-up Date */}
                  <TableHead
                    className="cursor-pointer select-none"
                    onClick={() => handleSort("followup_date")}
                  >
                    <span className="flex items-center">
                      Follow-up Date
                      <SortArrows
                        column="followup_date"
                        activeColumn={sortColumn}
                        direction={sortDirection}
                      />
                    </span>
                  </TableHead>

                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : pagedRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      {followUpsFilter === "all"
                        ? "No follow-up data available."
                        : "There are no follow ups today."}
                    </TableCell>
                  </TableRow>
                ) : (
                  pagedRows.map((item, idx) => (
                    <TableRow key={item.id}>
                      <TableCell>{startIndex + idx + 1}</TableCell>
                      <TableCell>{item.business_id}</TableCell>

                      <TableCell
                        className="font-medium max-w-[180px] break-words whitespace-normal cursor-pointer text-blue-600 hover:underline"
                        onClick={() =>
                          window.open(`/leads/${item.business_id}`, "_blank")
                        }
                      >
                        {item.name}
                      </TableCell>

                      <TableCell className="max-w-[220px] truncate">
                        {item.email}
                      </TableCell>

                      <TableCell>{item.phone}</TableCell>
                      <TableCell>{item.assigned_to}</TableCell>
                      <TableCell>
                        <Badge className={getStageColor(item.current_stage)}>
                          {item.current_stage}
                        </Badge>
                      </TableCell>
                      <TableCell>{item.followup_date}</TableCell>
                      <TableCell className="max-w-[260px] break-words whitespace-normal">
                        {item.notes}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination footer */}
          {!loading && totalRecords > 0 && (
            <div className="flex items-center justify-between pt-3">
              <div className="text-sm text-gray-600">
                Page {page} of {totalPages} • Total {totalRecords} records
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    // </ProtectedRoute>
  );
}
