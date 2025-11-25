"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase/client";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import * as XLSX from "xlsx";
import dayjs from "dayjs";

// --------------------------------------------
// TYPES
// --------------------------------------------
type PRPaidFlag = "Paid" | "Not paid";

interface PRRow {
  lead_id: string;
  name: string;
  email: string;
  closed_at: string | null;

  resumePaid: PRPaidFlag;
  resumeStatus: string | null;
  resumePdf: string | null;

  portfolioPaid: PRPaidFlag;
  portfolioStatus: string | null;
  portfolioLink: string | null;

  githubPaid: PRPaidFlag;
}

interface Profile {
  full_name: string;
  roles: string;
}

// --------------------------------------------
// COMPONENT
// --------------------------------------------
export default function SalesAddonsInfo() {
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [prLoading, setPrLoading] = useState(false);
  const [prRows, setPrRows] = useState<PRRow[]>([]);

  // Search
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");



const [sortColumn, setSortColumn] = useState<string>("closed_at");
const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");


  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(30);

  // --------------------------------------------
  // FETCH USER PROFILE
  // --------------------------------------------
  useEffect(() => {
    const loadUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, roles")
        .eq("auth_id", user.id)
        .single();

      setUserProfile(profile || null);

      if (profile) fetchPRData(profile);
    };

    loadUser();
  }, []);

  // --------------------------------------------
  // FETCH PR DATA
  // --------------------------------------------
  const fetchPRData = async (profile: Profile) => {
    try {
      setPrLoading(true);

      let leadsQ = supabase
        .from("leads")
        .select("business_id, name, email, assigned_to")
        .eq("current_stage", "sale done");

      if (profile.roles === "Sales Associate") {
        leadsQ = leadsQ.eq("assigned_to", profile.full_name);
      }

      const { data: leadRows } = await leadsQ;
      const ids = (leadRows || []).map((l) => l.business_id);

      if (ids.length === 0) {
        setPrRows([]);
        return;
      }

      const leadMeta = new Map(
        (leadRows || []).map((l) => [
          l.business_id,
          { name: l.name, email: l.email },
        ])
      );

      const { data: scRows } = await supabase
        .from("sales_closure")
        .select("lead_id, closed_at, resume_sale_value, portfolio_sale_value, github_sale_value")
        .in("lead_id", ids)
        .order("closed_at", { ascending: true });

      const oldest = new Map();
      for (const r of scRows || []) {
        if (!oldest.has(r.lead_id)) {
          oldest.set(r.lead_id, {
            closed_at: r.closed_at ? dayjs(r.closed_at).format("YYYY-MM-DD") : null,
            resume_sale_value: r.resume_sale_value,
            portfolio_sale_value: r.portfolio_sale_value,
            github_sale_value: r.github_sale_value,
          });
        }
      }

      const { data: rp } = await supabase
        .from("resume_progress")
        .select("lead_id, status, pdf_path")
        .in("lead_id", ids);

      const rpMap = new Map();
      (rp || []).forEach((r) =>
        rpMap.set(r.lead_id, { status: r.status, pdf_path: r.pdf_path })
      );

      const { data: pp } = await supabase
        .from("portfolio_progress")
        .select("lead_id, status, link")
        .in("lead_id", ids);

      const ppMap = new Map();
      (pp || []).forEach((p) =>
        ppMap.set(p.lead_id, { status: p.status, link: p.link })
      );

      const paidFlag = (v: any): PRPaidFlag =>
        v !== null && Number(v) !== 0 ? "Paid" : "Not paid";

      const rows: PRRow[] = ids.map((id) => {
        const m = leadMeta.get(id) || { name: "-", email: "-" };
        const o = oldest.get(id) || {};
        const r = rpMap.get(id);
        const p = ppMap.get(id);

        return {
          lead_id: id,
          name: m.name,
          email: m.email,
          closed_at: o.closed_at || null,

          resumePaid: paidFlag(o.resume_sale_value),
          resumeStatus: r?.status || null,
          resumePdf: r?.pdf_path || null,

          portfolioPaid: paidFlag(o.portfolio_sale_value),
          portfolioStatus: p?.status || null,
          portfolioLink: p?.link || null,

          githubPaid: paidFlag(o.github_sale_value),
        };
      });

      setPrRows(rows);
    } catch (e) {
      console.error("PR fetch failed:", e);
    } finally {
      setPrLoading(false);
    }
  };

  const handleSort = (column: string) => {
  if (sortColumn === column) {
    // Toggle direction
    setSortDirection(sortDirection === "asc" ? "desc" : "asc");
  } else {
    setSortColumn(column);
    setSortDirection("asc");
  }
};

const extractNumber = (leadId: string) => {
  const num = leadId.replace(/[^0-9]/g, "");
  return Number(num);
};

const filteredSortedRows = prRows
  .filter((r) => {
    if (!searchTerm.trim()) return true;
    const t = searchTerm.toLowerCase();
    return (
      r.lead_id.toLowerCase().includes(t) ||
      r.name.toLowerCase().includes(t) ||
      r.email.toLowerCase().includes(t)
    );
  })
  .sort((a, b) => {
    const paidWeight = (value: PRPaidFlag) => (value === "Paid" ? 1 : 0);

    // -------------------------------------------
    // 1️⃣ MULTI-SORT FOR RESUME SALE
    // -------------------------------------------
    if (sortColumn === "resumePaid") {
      const primary =
        sortDirection === "asc"
          ? paidWeight(a.resumePaid) - paidWeight(b.resumePaid)
          : paidWeight(b.resumePaid) - paidWeight(a.resumePaid);

      if (primary !== 0) return primary;

      // Tie-break → closed_at DESC
      const aT = a.closed_at ? new Date(a.closed_at).getTime() : 0;
      const bT = b.closed_at ? new Date(b.closed_at).getTime() : 0;
      return bT - aT;
    }

    // -------------------------------------------
    // 2️⃣ MULTI-SORT FOR PORTFOLIO SALE
    // -------------------------------------------
    if (sortColumn === "portfolioPaid") {
      const primary =
        sortDirection === "asc"
          ? paidWeight(a.portfolioPaid) - paidWeight(b.portfolioPaid)
          : paidWeight(b.portfolioPaid) - paidWeight(a.portfolioPaid);

      if (primary !== 0) return primary;

      // Tie-break → closed_at DESC
      const aT = a.closed_at ? new Date(a.closed_at).getTime() : 0;
      const bT = b.closed_at ? new Date(b.closed_at).getTime() : 0;
      return bT - aT;
    }

    // -------------------------------------------
    // 3️⃣ MULTI-SORT FOR GITHUB SALE
    // -------------------------------------------
    if (sortColumn === "githubPaid") {
      const primary =
        sortDirection === "asc"
          ? paidWeight(a.githubPaid) - paidWeight(b.githubPaid)
          : paidWeight(b.githubPaid) - paidWeight(a.githubPaid);

      if (primary !== 0) return primary;

      // Tie-break → closed_at DESC
      const aT = a.closed_at ? new Date(a.closed_at).getTime() : 0;
      const bT = b.closed_at ? new Date(b.closed_at).getTime() : 0;
      return bT - aT;
    }

    // -------------------------------------------
    // SPECIAL SORT → LEAD ID with AWL-xxx numeric sorting
    // -------------------------------------------
    if (sortColumn === "lead_id") {
      const aNum = extractNumber(a.lead_id);
      const bNum = extractNumber(b.lead_id);
      return sortDirection === "asc" ? aNum - bNum : bNum - aNum;
    }

    // -------------------------------------------
    // DATE SORT
    // -------------------------------------------
    if (sortColumn === "closed_at") {
      const aT = a.closed_at ? new Date(a.closed_at).getTime() : 0;
      const bT = b.closed_at ? new Date(b.closed_at).getTime() : 0;
      return sortDirection === "asc" ? aT - bT : bT - aT;
    }

    // -------------------------------------------
    // STRING / NORMAL SORT
    // -------------------------------------------
    const aVal = a[sortColumn as keyof PRRow];
    const bVal = b[sortColumn as keyof PRRow];

    if (typeof aVal === "string" && typeof bVal === "string") {
      return sortDirection === "asc"
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    }

    if (typeof aVal === "number" && typeof bVal === "number") {
      return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
    }

    return 0;
  });


  const SortArrows = ({ column }: { column: string }) => (
  <span className="ml-1 cursor-pointer select-none">
    {sortColumn === column ? (
      sortDirection === "asc" ? "↑" : "↓"
    ) : (
      "↑↓"
    )}
  </span>
);


  const BUCKET= "resumes"

  // --------------------------------------------
  // SEARCH + SORT + PAGINATION
  // --------------------------------------------
  // const filteredSortedRows = prRows
  //   .filter((r) => {
  //     if (!searchTerm.trim()) return true;
  //     const t = searchTerm.toLowerCase();
  //     return (
  //       r.lead_id.toLowerCase().includes(t) ||
  //       r.name.toLowerCase().includes(t) ||
  //       r.email.toLowerCase().includes(t)
  //     );
  //   })
  //   .sort((a, b) => {
  //     const aT = a.closed_at ? new Date(a.closed_at).getTime() : 0;
  //     const bT = b.closed_at ? new Date(b.closed_at).getTime() : 0;
  //     return bT - aT; // DESC
  //   });

  const totalRecords = filteredSortedRows.length;
  const totalPages =
    pageSize >= totalRecords ? 1 : Math.ceil(totalRecords / pageSize);

  const start = (page - 1) * pageSize;
  const pagedRows =
    pageSize >= totalRecords
      ? filteredSortedRows
      : filteredSortedRows.slice(start, start + pageSize);

  // --------------------------------------------
  // EXPORT EXCEL
  // --------------------------------------------
  const exportExcel = () => {
    const rows = filteredSortedRows.map((r, i) => ({
      "S.No": i + 1,
      "Lead ID": r.lead_id,
      Name: r.name,
      Email: r.email,
      "Closed At": r.closed_at || "",
      "Resume Paid": r.resumePaid,
      "Resume Status": r.resumeStatus || "",
      "Resume File": r.resumePdf || "",
      "Portfolio Paid": r.portfolioPaid,
      "Portfolio Status": r.portfolioStatus || "",
      "Portfolio Link": r.portfolioLink || "",
      "GitHub Paid": r.githubPaid,
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "PR_Data");
    XLSX.writeFile(wb, "Portfolio_Resumes.xlsx");
  };

 const downloadResume = async (path: string, displayName?: string) => {
  try {
    console.log("Opening resume:", path);

    let url = "";

    if (path.startsWith("CRM")) {
      const base = "https://applywizz-prod.s3.us-east-2.amazonaws.com";
      url = `${base}/${path}`;
    } else {
      const { data, error } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(path, 60 * 60); // 1 hour
      if (error) throw error;
      url = data.signedUrl!;
    }

    // Create an invisible link with a friendly name
    const a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    a.download = displayName || path.split("/").pop() || "resume.pdf"; // friendly name
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

  } catch (e: any) {
    alert(e?.message || "Could not open PDF");
  }
};



 const PaidBadge = ({ paid }: { paid: PRPaidFlag }) => (
  <Badge className={`${paid === "Paid" ? "bg-green-100 text-green-700" : "bg-red-300 text-black"} text-[9px]`}>
    {paid}
  </Badge>
);


 const StatusBadge = ({ text }: { text: string | null }) =>
  text ? (
    <Badge variant="outline" className="text-[10px]">
      {text}
    </Badge>
  ) : (
    <span>—</span>
  );


  return (
    <DashboardLayout>
      <div className="space-y-6">

        <h1 className="text-2xl font-bold">Portfolio / Resume Add-ons</h1>

        {/* Search + Export + Page Size */}
        <div className="flex flex-col md:flex-row gap-2 md:items-center md:justify-between">
          <div className="flex gap-2 flex-1">
            <Input
              className="w-full h-7 md:w-80 text-[10px]"
              placeholder="Search Lead ID / Name / Email..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            <Button
              disabled={!searchInput.trim()}
              onClick={() => {
                setSearchTerm(searchInput.trim());
                setPage(1);
              }}
              className="max-w-16 h-7"
            >
              Search
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setSearchInput("");
                setSearchTerm("");
                setPage(1);
              }}
              className="bg-red-50 hover:bg-red-200 max-w-16 h-7"
            >
              Clear
            </Button>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={exportExcel} className=" max-w-24 h-7  bg-gray-900 text-gray-50">
             <p className="text-[12px]"> Export Excel</p>
            </Button>

            <Select
              value={String(pageSize)}
              onValueChange={(v) => {
                if (v === "all") {
                  setPageSize(totalRecords);
                } else {
                  setPageSize(Number(v));
                }
                setPage(1);
              }}
            >
              <SelectTrigger className="w-40 h-7">
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
        <div className="rounded-md border  overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="max-w-10 overflow-hidden text-[12px]">S.No</TableHead>
                {/* <TableHead className="max-w-10 overflow-hidden text-[12px]">Lead ID</TableHead> */}
                <TableHead
  className="cursor-pointer text-[12px]"
  onClick={() => handleSort("lead_id")}
>
  Lead ID <SortArrows column="lead_id" />
</TableHead>

                {/* <TableHead className="max-w-10 overflow-hidden text-[12px]">Name</TableHead> */}
                <TableHead
  className="cursor-pointer text-[12px]"
  onClick={() => handleSort("name")}
>
  Name <SortArrows column="name" />
</TableHead>

                {/* <TableHead className="max-w-10 overflow-hidden text-[12px]">Email</TableHead> */}
                <TableHead
  className="cursor-pointer text-[12px]"
  onClick={() => handleSort("email")}
>
  Email <SortArrows column="email" />
</TableHead>

                {/* <TableHead className="max-w-10 overflow-hidden text-[12px]">Closed At</TableHead> */}
                <TableHead
  className="cursor-pointer text-[12px]"
  onClick={() => handleSort("closed_at")}
>
  Closed At <SortArrows column="closed_at" />
</TableHead>


                {/* <TableHead className="max-w-10 text-center text-[12px]">Resume Sale</TableHead> */}
                <TableHead
  className="cursor-pointer text-[12px] text-center"
  onClick={() => handleSort("resumePaid")}
>
  Resume Sale <SortArrows column="resumePaid" />
</TableHead>

                <TableHead className="max-w-10 text-center text-[12px]">Resume Status</TableHead>
                <TableHead className="max-w-8 text-center text-[12px]">Resume File</TableHead>

                {/* <TableHead className="max-w-8 text-center text-[12px]">Portfolio Sale</TableHead> */}
                <TableHead
  className="cursor-pointer text-[12px] text-center"
  onClick={() => handleSort("portfolioPaid")}
>
  Portfolio Sale <SortArrows column="portfolioPaid" />
</TableHead>

                <TableHead className="max-w-8 text-center text-[12px]">Portfolio Status</TableHead>
                <TableHead className="text-center text-[12px]">Portfolio Link</TableHead>

                {/* <TableHead className="max-w-10 text-center text-[12px]">GitHub Sale</TableHead> */}
                <TableHead
  className="cursor-pointer text-[12px] text-center"
  onClick={() => handleSort("githubPaid")}
>
  GitHub Sale <SortArrows column="githubPaid" />
</TableHead>

              </TableRow>
            </TableHeader>

            <TableBody>
              {prLoading ? (
                <TableRow>
                  <TableCell colSpan={12} className="text-center py-8">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : pagedRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={12} className="text-center py-8">
                    No records found.
                  </TableCell>
                </TableRow>
              ) : (
                pagedRows.map((r, i) => (
                  <TableRow key={r.lead_id}>
                    <TableCell className="max-w-14 overflow-hidden text-xs">{start + i + 1}</TableCell>
                    <TableCell className="text-xs">{r.lead_id}</TableCell>

                     <TableCell
                      className="font-medium max-w-32 cursor-pointer text-blue-600 hover:underline"
                      onClick={() => window.open(`/leads/${r.lead_id}`, "_blank")}
                      >
                      {r.name}
                      </TableCell>

                    {/* <TableCell className="max-w-32 overflow-hidden text-xs">{r.name}</TableCell> */}
                    <TableCell className="max-w-40 overflow-hidden text-xs">{r.email}</TableCell>
                    <TableCell className="max-w-40 overflow-hidden text-xs">{r.closed_at || "—"}</TableCell>

                    <TableCell className="max-w-20 overflow-hidden text-xs text-center">
                      <PaidBadge paid={r.resumePaid} />
                    </TableCell>

                    <TableCell className="max-w-28 overflow-hidden text-xs text-center">
                      <StatusBadge text={r.resumeStatus} />
                    </TableCell>

                    <TableCell className="max-w-28 overflow-hidden text-center">
                      {r.resumePdf ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadResume(r.resumePdf!)}
                          className="w-16 h-6"
                        >
                         <p className="text-[10px]">Download</p> 
                        </Button>
                      ) : (
                        "—"
                      )}
                    </TableCell>

                    <TableCell className="max-w-20 overflow-hidden text-xs text-center">
                      <PaidBadge paid={r.portfolioPaid} />
                    </TableCell>

                    <TableCell className="max-w-24 overflow-hidden text-xs text-center">
                      <StatusBadge text={r.portfolioStatus} />
                    </TableCell>

                    <TableCell className="max-w-20 overflow-hidden text-xs text-center">
                      {r.portfolioLink ? (
                        <a
                          href={r.portfolioLink}
                          target="_blank"
                          className="text-blue-600 underline"
                        >
                          Open
                        </a>
                      ) : (
                        "—"
                      )}
                    </TableCell>

                    <TableCell className="max-w-20 overflow-hidden text-xs text-center">
                      <PaidBadge paid={r.githubPaid} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        

        {/* Pagination footer */}
        {!prLoading && totalRecords > 0 && (
          <div className="flex items-center justify-between pt-3">
            <div className="text-sm text-gray-600">
              Page {page} of {totalPages} • Total {totalRecords} records
            </div>

            <div className="flex gap-2">
              <Button variant="outline" disabled={page === 1} onClick={() => setPage(page - 1)}>
                Previous
              </Button>

              <Button
                variant="outline"
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
