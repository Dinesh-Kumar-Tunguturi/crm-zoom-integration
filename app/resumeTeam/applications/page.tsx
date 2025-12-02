"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase/client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useAuth } from "@/components/providers/auth-provider";

/* =========================
   Types & Labels
   ========================= */

type FinanceStatus = "Paid" | "Unpaid" | "Paused" | "Closed" | "Got Placed";

type ResumeStatus =
  | "not_started"
  | "pending"
  | "waiting_client_approval"
  | "completed";

const STATUS_LABEL: Record<ResumeStatus, string> = {
  not_started: "Not started",
  pending: "Pending",
  waiting_client_approval: "Waiting for Client approval",
  completed: "Completed",
};

type PortfolioStatus =
  | "not_started"
  | "pending"
  | "waiting_client_approval"
  | "success";

type TeamMember = {
  id: string;
  name: string | null;
  email: string | null;
  role: string | null;
};

interface SalesClosure {
  id: string;
  lead_id: string;
  email: string;
  company_application_email: string | null;
  finance_status: FinanceStatus;
  closed_at: string | null;
  onboarded_date_raw: string | null;
  onboarded_date_label: string;
  application_sale_value: number | null;
  resume_sale_value: number | null;
  portfolio_sale_value: number | number | null;
  job_board_value: number | null;
  commitments?: string | null;
  badge_value?: number | null;
  data_sent_to_customer_dashboard?: string | null;

  // joined lead data
  leads?: { name: string; phone: string };

  // resume_progress (from view)
  rp_status: ResumeStatus;
  rp_pdf_path: string | null;
  assigned_to_email: string | null;
  assigned_to_name: string | null;

  // portfolio_progress
  pp_status: PortfolioStatus | null;
  pp_assigned_email: string | null;
  pp_assigned_name: string | null;
  pp_link: string | null;

  portfolio_paid: boolean;
}

/* =========================
   Small helpers
   ========================= */

const formatDateLabel = (d: string | null) =>
  d ? new Date(d).toLocaleDateString("en-GB") : "-";

const formatOnboardLabel = (d: string | null) =>
  d ? new Date(d).toLocaleDateString("en-GB") : "Not Started";

const csvFromArray = (arr?: string[] | null) =>
  arr && arr.length ? arr.join(", ") : "";

const csvToArray = (s: string) =>
  s.split(",").map((v) => v.trim()).filter(Boolean);

const BUCKET = "resumes";

const ensurePdf = (file: File) => {
  if (file.type !== "application/pdf")
    throw new Error("Please select a PDF file.");
  if (file.size > 20 * 1024 * 1024) throw new Error("Max file size is 20MB.");
};

/* =========================
   Main Page Component
   ========================= */

export default function ApplicationsPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<SalesClosure[]>([]);
  const [resumeTeamMembers, setResumeTeamMembers] = useState<TeamMember[]>([]);
  const [assigneeFilter, setAssigneeFilter] = useState<string>("__all__");

  // file upload
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [uploadForLead, setUploadForLead] = useState<string | null>(null);
  const [replacingOldPath, setReplacingOldPath] = useState<string | null>(null);

  // Requirements dialog
  const [reqDialogOpen, setReqDialogOpen] = useState(false);
  const [reqRow, setReqRow] = useState<SalesClosure | null>(null);

 const [showMyTasks, setShowMyTasks] = useState(false);

  // Pagination
const [page, setPage] = useState(1);
const [limit, setLimit] = useState(30);
const [totalRows, setTotalRows] = useState(0);

// Search
const [searchText, setSearchText] = useState("");
const [searchQuery, setSearchQuery] = useState(""); // actual query on Enter

  /* =========================
     Role gate + initial load
     ========================= */

  useEffect(() => {
    if (user === null) return;
    const allowed = ["Super Admin", "Resume Head", "Resume Associate"] as const;
    if (!user || !allowed.includes(user.role as any)) {
      router.push("/unauthorized");
      return;
    }
   Promise.all([fetchTeamMembers(), fetchData(1, limit)]).finally(() =>
  setLoading(false)
);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  /* =========================
     Fetch helpers
     ========================= */

  const fetchTeamMembers = async () => {
    let members: TeamMember[] = [];

    try {
      const { data, error } = await supabase
        .from("users")
        .select("id,name,email,role")
        .in("role", ["Resume Head", "Resume Associate"]);

      if (!error && data) members = data as TeamMember[];
    } catch {
      // ignore
    }

    if (!members.length) {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("user_id,full_name,user_email,roles")
          .in("roles", ["Resume Head", "Resume Associate"]);

        if (!error && data) {
          members = (data as any[]).map((d) => ({
            id: d.user_id,
            name: d.full_name ?? null,
            email: d.user_email ?? null,
            role: d.roles ?? null,
          }));
        }
      } catch {
        // ignore
      }
    }

    setResumeTeamMembers(members);
  };

const fetchData = async (newPage = page, newLimit = limit, activeSearch = searchQuery, overrideShowMyTasks?: boolean) => {
  try {
    setLoading(true);

    const from = (newPage - 1) * newLimit;
    const to = from + newLimit - 1;

    let query = supabase
      .from("full_client_status_view_app_exists")
      .select("*", { count: "exact" });

    // 🔍 Apply server-side search
    if (activeSearch.trim() !== "") {
      query = query.or(
        `lead_id.ilike.%${activeSearch}%,lead_name.ilike.%${activeSearch}%,email.ilike.%${activeSearch}%,company_application_email.ilike.%${activeSearch}%`
      );
    }

 const myTasks = overrideShowMyTasks ?? showMyTasks;

if (myTasks && user?.email) {
  query = query.eq("resume_assigned_email", user.email);
}


    query = query
      .order("closed_at", { ascending: false })
      .range(from, to);

    const { data, error, count } = await query;

    if (error) throw error;

    setTotalRows(count ?? 0);

    const formatted: SalesClosure[] = (data as any[]).map((r) => {
      const onboardRaw = r.onboarded_date ?? null;
      const portfolioPaid =
        r.portfolio_sale_value && Number(r.portfolio_sale_value) > 0;

      return {
        id: String(r.sale_id),
        lead_id: r.lead_id,
        email: r.email,
        company_application_email: r.company_application_email ?? null,
        finance_status: r.finance_status ?? "Unpaid",
        closed_at: r.closed_at ?? null,
        onboarded_date_raw: onboardRaw,
        onboarded_date_label: formatOnboardLabel(onboardRaw),
        application_sale_value: r.application_sale_value ?? null,
        resume_sale_value: r.resume_sale_value ?? null,
        portfolio_sale_value: r.portfolio_sale_value ?? null,
        job_board_value: r.job_board_value ?? null,
        commitments: r.commitments ?? null,
        data_sent_to_customer_dashboard: r.data_sent_to_customer_dashboard ?? null,
        leads: {
          name: r.lead_name ?? "-",
          phone: r.phone_number ?? "-",
        },
        rp_status: r.resume_status ?? "not_started",
        rp_pdf_path: r.resume_pdf ?? null,
        assigned_to_email: r.resume_assigned_email ?? null,
        assigned_to_name: r.resume_assigned_name ?? null,
        pp_status: r.portfolio_status ?? null,
        pp_assigned_email: r.portfolio_assigned_email ?? null,
        pp_assigned_name: r.portfolio_assigned_name ?? null,
        pp_link: r.portfolio_link ?? null,
        portfolio_paid: portfolioPaid,
      };
    });

    setRows(formatted);
  } catch (e) {
    console.error(e);
    setRows([]);
  } finally {
    setLoading(false);
  }
};



  /* =========================
     Resume status & assignee
     ========================= */

  const updateStatus = async (leadId: string, status: ResumeStatus) => {
    const { error } = await supabase
      .from("resume_progress")
      .upsert({ lead_id: leadId, status }, { onConflict: "lead_id" });
    if (error) throw error;
  };

  const updateAssignedTo = async (
    leadId: string,
    email: string | null,
    name?: string | null,
  ) => {
    const { data: existingRows, error: findErr } = await supabase
      .from("resume_progress")
      .select("id")
      .eq("lead_id", leadId);

    if (findErr) throw findErr;

    if (existingRows && existingRows.length > 0) {
      const { error: updErr } = await supabase
        .from("resume_progress")
        .update({ assigned_to_email: email, assigned_to_name: name ?? null })
        .eq("lead_id", leadId);
      if (updErr) throw updErr;
    } else {
      const { error: insErr } = await supabase
        .from("resume_progress")
        .insert({
          lead_id: leadId,
          assigned_to_email: email,
          assigned_to_name: name ?? null,
        });
      if (insErr) throw insErr;
    }
  };

  const onChangeStatus = async (row: SalesClosure, newStatus: ResumeStatus) => {
    try {
      await updateStatus(row.lead_id, newStatus);

      if (newStatus === "completed" && !row.rp_pdf_path) {
        setUploadForLead(row.lead_id);
        setReplacingOldPath(null);
        fileRef.current?.click();
      } else {
        setRows((rs) =>
          rs.map((r) =>
            r.lead_id === row.lead_id ? { ...r, rp_status: newStatus } : r,
          ),
        );
      }
    } catch (e: any) {
      alert(e.message || "Failed to update status");
    }
  };

  /* =========================
     Resume upload & download
     ========================= */

  const uploadOrReplaceResume = async (
    leadId: string,
    file: File,
    previousPath?: string | null,
  ) => {
    ensurePdf(file);

    // find existing path from DB
    const pathRes = await supabase
      .from("resume_progress")
      .select("pdf_path")
      .eq("lead_id", leadId)
      .maybeSingle();

    const existingPath = pathRes.data?.pdf_path as string | undefined;

    // delete old path (S3 or Supabase storage)
    if (existingPath) {
      if (existingPath.startsWith("CRM")) {
        const del = await fetch("/api/resumes/delete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: existingPath }),
        });
        if (!del.ok) {
          const errData = await del.json().catch(() => ({}));
          throw new Error(
            errData?.error ||
              `Failed to delete previous CRM resume: ${del.status}`,
          );
        }
      } else {
        const del = await supabase.storage.from(BUCKET).remove([existingPath]);
        if (del.error) console.warn("STORAGE REMOVE WARNING:", del.error);
      }
    }

    // upload via API → S3
    const formData = new FormData();
    formData.append("file", file);
    formData.append("lead_id", leadId);

    const res = await fetch("/api/resumes/upload", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    if (!res.ok) {
      console.error("Upload failed:", data);
      throw new Error(data.error || "Upload failed");
    }

    // update resume_progress with new path
    const db = await supabase
      .from("resume_progress")
      .upsert(
        {
          lead_id: leadId,
          status: "completed",
          pdf_path: data.key,
          pdf_uploaded_at: new Date().toISOString(),
        },
        { onConflict: "lead_id" },
      );
    if (db.error) {
      console.error("DB UPSERT ERROR resume_progress:", db.error);
      throw new Error(db.error.message || "DB upsert failed");
    }

    return { key: data.key, publicUrl: data.publicUrl };
  };

  const downloadResume = async (path: string) => {
    try {
      if (path.startsWith("CRM")) {
        const base = "https://applywizz-prod.s3.us-east-2.amazonaws.com";
        const fileUrl = `${base}/${path}`;
       window.open(`${fileUrl}`, "_blank");
      } else {
        const segments = (path || "").split("/");
        const fileName = segments[segments.length - 1] || "resume.pdf";
        const { data, error } = await supabase.storage
          .from(BUCKET)
          .createSignedUrl(path, 60 * 60);
        if (error) throw error;
        if (!data?.signedUrl) throw new Error("No signed URL");
        const res = await fetch(data.signedUrl);
        if (!res.ok) throw new Error("Download failed");
        const blob = await res.blob();
        const objectUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = objectUrl;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(objectUrl);
      }
    } catch (e: any) {
      alert(e?.message || "Could not download PDF");
    }
  };

  const onFilePicked = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    const leadId = uploadForLead;
    const oldPath = replacingOldPath;

    e.target.value = "";
    setUploadForLead(null);
    setReplacingOldPath(null);

    if (!file || !leadId) return;

    try {
      await uploadOrReplaceResume(leadId, file, oldPath || undefined);
    //   await fetchData();
      alert("PDF uploaded.");
    } catch (err: any) {
      alert(err.message || "Upload failed");
    //   await fetchData();
    }
  };

const handleOnboardClick = (leadId: string) => {
  router.push(`/resumeTeam/onboarding/${leadId}`);
}; 
  /* =========================
     Sorting (optional)
     ========================= */

  type SortKey = "clientId" | "name" | "email" | "closedAt" | "onboarded";
  type SortDir = "asc" | "desc";

  const [sort, setSort] = useState<{ key: SortKey | null; dir: SortDir }>({
    key: "closedAt",
    dir: "desc",
  });

  const toggleSort = (key: SortKey) => {
    setSort((s) =>
      s.key === key
        ? { key, dir: s.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "asc" },
    );
  };

  const parseClientIdNum = (id?: string | null) => {
    if (!id) return -Infinity;
    const m = id.match(/(\d+)$/);
    return m ? Number(m[1]) : -Infinity;
  };

  const dateToMs = (d?: string | null) =>
    d ? new Date(d).getTime() : -Infinity;

  const safeStr = (s?: string | null) => (s ?? "").toLowerCase();

  const cmp = (a: number | string, b: number | string) =>
    a < b ? -1 : a > b ? 1 : 0;

  const sortRowsBy = (arr: SalesClosure[]) => {
    if (!sort.key) return arr;
    const copy = [...arr];
    copy.sort((A, B) => {
      let vA: number | string;
      let vB: number | string;

      switch (sort.key) {
        case "clientId":
          vA = parseClientIdNum(A.lead_id);
          vB = parseClientIdNum(B.lead_id);
          break;
        case "name":
          vA = safeStr(A.leads?.name);
          vB = safeStr(B.leads?.name);
          break;
        case "email":
          vA = safeStr(A.email);
          vB = safeStr(B.email);
          break;
        case "closedAt":
          vA = dateToMs(A.closed_at);
          vB = dateToMs(B.closed_at);
          break;
        case "onboarded":
          vA = dateToMs(A.onboarded_date_raw);
          vB = dateToMs(B.onboarded_date_raw);
          break;
        default:
          vA = 0;
          vB = 0;
      }
      const base = cmp(vA, vB);
      return sort.dir === "asc" ? base : -base;
    });
    return copy;
  };

  const sortedRows = sortRowsBy(rows);

  const SortIcon = ({ active, dir }: { active: boolean; dir: SortDir }) =>
    active ? (
      dir === "asc" ? (
        <ArrowUp className="ml-1 h-4 w-4" />
      ) : (
        <ArrowDown className="ml-1 h-4 w-4" />
      )
    ) : (
      <ArrowUpDown className="ml-1 h-4 w-4 opacity-60" />
    );

  /* =========================
     Render table (EXACT UI)
     ========================= */

  const renderTable = (data: SalesClosure[]) => (
    <div className="rounded-md border mt-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>S.No</TableHead>

            <TableHead>
              <button
                type="button"
                onClick={() => toggleSort("clientId")}
                className="inline-flex items-center"
              >
                Client ID
                <SortIcon
                  active={sort.key === "clientId"}
                  dir={sort.dir}
                />
              </button>
            </TableHead>

            <TableHead>
              <button
                type="button"
                onClick={() => toggleSort("name")}
                className="inline-flex items-center"
              >
                Name
                <SortIcon active={sort.key === "name"} dir={sort.dir} />
              </button>
            </TableHead>

            <TableHead>
              <button
                type="button"
                onClick={() => toggleSort("email")}
                className="inline-flex items-center"
              >
                Email
                <SortIcon active={sort.key === "email"} dir={sort.dir} />
              </button>
            </TableHead>

            <TableHead>Application email</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Resume Status</TableHead>
            <TableHead>Assigned to</TableHead>
            <TableHead>Resume PDF</TableHead>

            <TableHead>
              <button
                type="button"
                onClick={() => toggleSort("closedAt")}
                className="inline-flex items-center"
              >
                Closed At
                <SortIcon
                  active={sort.key === "closedAt"}
                  dir={sort.dir}
                />
              </button>
            </TableHead>

            <TableHead>
              <button
                type="button"
                onClick={() => toggleSort("onboarded")}
                className="inline-flex items-center"
              >
                Onboarded Date
                <SortIcon
                  active={sort.key === "onboarded"}
                  dir={sort.dir}
                />
              </button>
            </TableHead>

            <TableHead>Portfolio Status</TableHead>
            <TableHead>Portfolio Link</TableHead>
            <TableHead>Portfolio Assignee</TableHead>
            <TableHead>Client Requirements</TableHead>
            <TableHead>Application Status</TableHead>
            <TableHead>Onboard</TableHead>
            {/* <TableHead>Forward to TT</TableHead> */}
          </TableRow>
        </TableHeader>

        <TableBody>
          {data.map((row, index) => (
            <TableRow key={row.id}>
              <TableCell className="text-center">{index + 1}</TableCell>
              <TableCell>{row.lead_id}</TableCell>

              <TableCell
                className="font-medium max-w-[150px] break-words whitespace-normal cursor-pointer text-blue-600 hover:underline"
                onClick={() =>
                  window.open(`/leads/${row.lead_id}`, "_blank")
                }
              >
                {row.leads?.name || "-"}
              </TableCell>

              <TableCell>{row.email}</TableCell>
              <TableCell>
                {row.company_application_email || "not given"}
              </TableCell>
              <TableCell>{row.leads?.phone || "-"}</TableCell>
              <TableCell>{row.finance_status}</TableCell>

              {/* Resume Status */}
              <TableCell className="min-w-[220px]">
                <Select
                  value={row.rp_status || "not_started"}
                  onValueChange={(v) =>
                    onChangeStatus(row, v as ResumeStatus)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {(
                      [
                        "not_started",
                        "pending",
                        "waiting_client_approval",
                        "completed",
                      ] as ResumeStatus[]
                    ).map((s) => (
                      <SelectItem key={s} value={s}>
                        {STATUS_LABEL[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableCell>

              {/* Assigned to */}
              <TableCell className="min-w-[260px]">
                <Select
                  value={row.assigned_to_email ?? "__none__"}
                  onValueChange={async (value) => {
                    try {
                      const chosen =
                        value === "__none__" ? null : value;
                      const member =
                        resumeTeamMembers.find(
                          (u) => u.email === chosen,
                        ) || null;

                      await updateAssignedTo(
                        row.lead_id,
                        chosen,
                        member?.name ?? null,
                      );

                      setRows((rs) =>
                        rs.map((r) =>
                          r.lead_id === row.lead_id
                            ? {
                                ...r,
                                assigned_to_email: chosen,
                                assigned_to_name:
                                  member?.name ?? null,
                              }
                            : r,
                        ),
                      );
                    //   await fetchData();
                    } catch (e: any) {
                      console.error("Assign failed:", e);
                      alert(e.message || "Failed to assign");
                    }
                  }}
                  disabled={user?.role === "Resume Associate"}
                >
                  <SelectTrigger className="!opacity-100 bg-muted/20 text-foreground">
                    <SelectValue placeholder="Assign to…" />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    <SelectItem value="__none__">Unassigned</SelectItem>
                    {resumeTeamMembers.length === 0 ? (
                      <SelectItem value="__disabled__" disabled>
                        No team members found
                      </SelectItem>
                    ) : (
                      resumeTeamMembers.map((u) => (
                        <SelectItem
                          key={u.id}
                          value={u.email ?? ""}
                          disabled={!u.email}
                        >
                          {u.name} — {u.role}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </TableCell>

              {/* Resume PDF */}
              <TableCell className="space-x-2 min-w-[220px]">
                {row.rp_pdf_path ? (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        downloadResume(row.rp_pdf_path!)
                      }
                    >
                      Download
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setUploadForLead(row.lead_id);
                        setReplacingOldPath(
                          row.rp_pdf_path ?? null,
                        );
                        fileRef.current?.click();
                      }}
                    >
                      Replace
                    </Button>
                  </>
                ) : row.rp_status === "completed" ? (
                  <Button
                    size="sm"
                    onClick={() => {
                      setUploadForLead(row.lead_id);
                      setReplacingOldPath(null);
                      fileRef.current?.click();
                    }}
                  >
                    Upload PDF
                  </Button>
                ) : (
                  <span className="text-gray-400 text-sm">—</span>
                )}
              </TableCell>

              {/* Closed At */}
              <TableCell>{formatDateLabel(row.closed_at)}</TableCell>

              {/* Onboarded Date */}
              <TableCell className="min-w-[160px]">
                {row.onboarded_date_raw ? (
                  <span className="bg-green-500 text-white text-sm py-1 px-3 rounded-full">
                    {row.onboarded_date_label}
                  </span>
                ) : (
                  <span className="bg-red-500 text-white text-sm py-1 px-3 rounded-full">
                    not onboarded
                  </span>
                )}
              </TableCell>

              {/* Portfolio Status */}
              <TableCell className="min-w-[140px]">
                {row.portfolio_paid ? (
                  <span className="bg-green-500 text-white text-sm py-1 px-3 rounded-full">
                    Paid
                  </span>
                ) : (
                  <span className="bg-red-500 text-white text-sm py-1 px-3 rounded-full">
                    Not Paid
                  </span>
                )}
              </TableCell>

              {/* Portfolio Link */}
              <TableCell className="max-w-[220px] truncate">
                {row.portfolio_paid ? (
                  row.pp_link ? (
                    <a
                      href={row.pp_link}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 underline block truncate"
                      title={row.pp_link}
                    >
                      {row.pp_link}
                    </a>
                  ) : row.leads?.name ? (
                    <a
                      href={`https://applywizz-${(row.leads?.name ||
                        "")
                        .toLowerCase()
                        .replace(/[^a-z0-9]/g, "")}.vercel.app/`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 underline block truncate"
                      title={`https://applywizz-${(row.leads?.name ||
                        "")
                        .toLowerCase()
                        .replace(/[^a-z0-9]/g, "")}.vercel.app/`}
                    >
                      {`https://applywizz-${(row.leads?.name || "")
                        .toLowerCase()
                        .replace(/[^a-z0-9]/g, "")}.vercel.app/`}
                    </a>
                  ) : (
                    <span className="text-gray-400 text-sm">—</span>
                  )
                ) : (
                  <span className="text-gray-400 text-sm">—</span>
                )}
              </TableCell>

              {/* Portfolio Assignee */}
              <TableCell>
                {row.pp_assigned_name
                  ? `${row.pp_assigned_name}${
                      row.pp_assigned_email
                        ? ` • ${row.pp_assigned_email}`
                        : ""
                    }`
                  : row.pp_assigned_email || (
                      <span className="text-gray-400 text-sm">
                        —
                      </span>
                    )}
              </TableCell>

              {/* Commitments */}
              <TableCell className="min-w-[140px] text-center">
                {row.commitments?.trim() ? (
                  <Button
                    className="bg-gray-900 hover:bg-gray-400 text-white"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setReqRow(row);
                      setReqDialogOpen(true);
                    }}
                  >
                    Requirements
                  </Button>
                ) : (
                  <span className="text-gray-400 text-sm">—</span>
                )}
              </TableCell>

              {/* Application Status */}
              <TableCell className="min-w-[140px] text-center">
                {Number(row.application_sale_value) > 0 ? (
                  <span className="bg-green-500 text-white text-sm py-1 px-3 rounded-full">
                    Paid
                  </span>
                ) : (
                  <span className="bg-red-500 text-white text-sm py-1 px-3 rounded-full">
                    Not Paid
                  </span>
                )}
              </TableCell>

              {/* Onboard button */}
              <TableCell>
                {row.onboarded_date_raw ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-green-600 text-white hover:bg-green-600 hover:text-white cursor-not-allowed"
                  >
                    Onboarded
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleOnboardClick(row.lead_id)}
                    variant="outline"
                    size="sm"
                    className="bg-blue-400 text-white hover:bg-blue-600 hover:text-white"
                  >
                    Onboard Client
                  </Button>
                )}
              </TableCell>

             
            </TableRow>
          ))}

          {data.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={18}
                className="text-center text-sm text-muted-foreground py-10"
              >
                No records found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      
      <div className="flex items-center justify-center px-4 py-2 border-t bg-gray-50">
  <div className="flex items-center gap-2">
    <span className="text-sm">Page:</span>
    <Select
      value={String(page)}
      onValueChange={async (val) => {
        const newPage = Number(val);
        setPage(newPage);
        await fetchData(newPage, limit);
      }}
    >
      <SelectTrigger className="w-[100px]">
        <SelectValue />
      </SelectTrigger>

      <SelectContent>
        {Array.from(
          { length: Math.ceil(totalRows / limit) },
          (_, i) => i + 1
        ).map((p) => (
          <SelectItem key={p} value={String(p)}>
            {p}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
  &nbsp;&nbsp;

  <span className="text-sm text-gray-600">
    Showing {(page - 1) * limit + 1}–
    {Math.min(page * limit, totalRows)} of {totalRows}
  </span>
    </div>
    </div>
  );

  /* =========================
     JSX
     ========================= */

  return (
    // <ProtectedRoute
    //   allowedRoles={["Super Admin", "Resume Head", "Resume Associate"]}
    // >
      <DashboardLayout>
        <input
          ref={fileRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={onFilePicked}
        />

        <div className="space-y-6">
          <div className="flex items-center justify-start gap-4">
            <h1 className="text-3xl font-bold text-gray-900">
             Applications clients — Resume Team
            </h1>

            {/* Assignee filter (simple version) */}
            <div className="flex items-center gap-3">
              <div className="text-sm font-medium">Assigned To:</div>
              <Select
                value={assigneeFilter}
                onValueChange={async (val) => {
                  setAssigneeFilter(val);
                  // simple behaviour: for now just refetch all
                //   await fetchData();
                }}
              >
                <SelectTrigger className="w-[260px]">
                  <SelectValue placeholder="All team members" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All</SelectItem>
                  {resumeTeamMembers.length === 0 ? (
                    <SelectItem value="__none__" disabled>
                      No team members found
                    </SelectItem>
                  ) : (
                    resumeTeamMembers.map((u) => (
                      <SelectItem
                        key={u.id}
                        value={(u.email ?? "").trim() || "__none__"}
                        disabled={!u.email}
                      >
                        {u.name} — {u.role}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            {/* Pagination Controls */}
<div className="flex items-center gap-4">
  
  <div className="flex items-center gap-2">
     <span className="text-sm">Rows per page:</span>
     <Select
       value={String(limit)}
       onValueChange={async (val) => {
         const newLimit = Number(val);
         setLimit(newLimit);
         setPage(1); // reset page
         await fetchData(1, newLimit);
       }}
     >
       <SelectTrigger className="w-[80px]">
         <SelectValue />
       </SelectTrigger>
       <SelectContent>
         <SelectItem value="30">30 per page</SelectItem>
         <SelectItem value="50">50 per page</SelectItem>
         <SelectItem value="100">100 per page</SelectItem>
         <SelectItem value="200">200 per page</SelectItem>
         <SelectItem value="500">500 per page</SelectItem>
         <SelectItem value="1000">1000 per page</SelectItem>
         <SelectItem value="2000">2000 per page</SelectItem>
 
 
 
 
       </SelectContent>
     </Select>
   </div>

</div>

          </div>
           <div className="flex flex-auto">
           <div className="flex items-center gap-3 w-full max-w-lg">
   <Input
     placeholder="Search by Lead ID, Name or Email"
     value={searchText}
     onChange={(e) => setSearchText(e.target.value)}
     onKeyDown={async (e) => {
       if (e.key === "Enter") {
         setSearchQuery(searchText);
         setPage(1);
         await fetchData(1, limit, searchText, showMyTasks);
       }
     }}
   />
   <Button
     onClick={async () => {
       setSearchQuery(searchText);
       setPage(1);
       await fetchData(1, limit, searchText, showMyTasks);
     }}
   >
     Search
   </Button>

  <Button
  variant={showMyTasks ? "default" : "outline"}
  className={showMyTasks ? "bg-blue-600 text-white" : "bg-green-500 text-white"}
  onClick={async () => {
    const newValue = !showMyTasks;
    setShowMyTasks(newValue);
    setPage(1);

    // 🚀 Pass newValue directly (the key fix)
    await fetchData(1, limit, searchQuery, newValue);
  }}
>
  {showMyTasks ? "Show All" : "My Tasks"}
</Button>


 
 </div>
     <span className="text-red-500 gap-3 mt-2 ml-4 font-semibold">Total Rows : {totalRows}</span>
 
 </div>

          {loading ? (
            <p className="p-6 text-gray-600">Loading...</p>
          ) : (
            renderTable(sortedRows)
          )}
        </div>

        {/* Requirements Dialog */}
        <Dialog open={reqDialogOpen} onOpenChange={setReqDialogOpen}>
          <DialogContent
            className="max-w-3xl"
            onPointerDownOutside={(e) => e.preventDefault()}
          >
            <DialogHeader>
              <DialogTitle>
                Requirements — {reqRow?.lead_id ?? ""}
              </DialogTitle>
              <DialogDescription>
                Commitment details captured at sale closure.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <div className="text-xs text-muted-foreground">
                    Lead ID
                  </div>
                  <div className="font-medium">
                    {reqRow?.lead_id ?? "—"}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">
                    Name
                  </div>
                  <div className="font-medium">
                    {reqRow?.leads?.name ?? "—"}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">
                    Email
                  </div>
                  <div className="font-medium break-all">
                    {reqRow?.email ?? "—"}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">
                    Closed At
                  </div>
                  <div className="font-medium">
                    {reqRow?.closed_at
                      ? new Date(
                          reqRow.closed_at,
                        ).toLocaleDateString("en-GB")
                      : "—"}
                  </div>
                </div>
              </div>

              <div>
                <div className="text-xs text-muted-foreground mb-1">
                  Commitments
                </div>
                <div className="rounded-md border bg-muted/30 p-3 max-h-[50vh] overflow-y-auto whitespace-pre-wrap">
                  {reqRow?.commitments?.trim()
                    ? reqRow.commitments
                    : "—"}
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(
                      reqRow?.commitments ?? "",
                    );
                  } catch {
                    // ignore
                  }
                }}
              >
                Copy Text
              </Button>
              <Button onClick={() => setReqDialogOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </DashboardLayout>
  );
}







// /* =========================
//    SendButton (Forward to TT)
//    ========================= */

// const SendButton = ({
//   row,
//   handleSendToPendingClients,
// }: {
//   row: SalesClosure;
//   handleSendToPendingClients: (leadId: string) => Promise<void>;
// }) => {
//   const [isSending, setIsSending] = useState(false);
//   const [isSent, setIsSent] = useState(false);

//   useEffect(() => {
//     if (row.data_sent_to_customer_dashboard === "Sent") {
//       setIsSent(true);
//       setIsSending(false);
//     }
//   }, [row.data_sent_to_customer_dashboard]);

//   const onClick = async () => {
//     setIsSending(true);
//     try {
//       await handleSendToPendingClients(row.lead_id);
//       setIsSent(true);
//     } catch (e) {
//       console.error(e);
//       setIsSending(false);
//       alert("Failed to send to TT");
//     }
//   };

//   if (isSent || row.data_sent_to_customer_dashboard === "Sent") {
//     return (
//       <Button
//         variant="outline"
//         size="sm"
//         className="bg-orange-600 text-white hover:bg-orange-400 hover:text-white cursor-not-allowed"
//       >
//         Sent
//       </Button>
//     );
//   }

//   return (
//     <Button
//       variant="outline"
//       size="sm"
//       disabled={isSending}
//       onClick={onClick}
//       className={`text-white ${
//         isSending
//           ? "bg-orange-500 hover:bg-orange-500 cursor-not-allowed"
//           : "bg-purple-600 hover:bg-purple-700"
//       }`}
//     >
//       {isSending ? "Sending..." : "TT"}
//     </Button>
//   );
// };



// /* =========================
//    SendButton (Forward to TT)
//    ========================= */

// const SendButton = ({
//   row,
//   handleSendToPendingClients,
// }: {
//   row: SalesClosure;
//   handleSendToPendingClients: (leadId: string) => Promise<void>;
// }) => {
//   const [isSending, setIsSending] = useState(false);
//   const [isSent, setIsSent] = useState(false);

//   useEffect(() => {
//     if (row.data_sent_to_customer_dashboard === "Sent") {
//       setIsSent(true);
//       setIsSending(false);
//     }
//   }, [row.data_sent_to_customer_dashboard]);

//   const onClick = async () => {
//     setIsSending(true);
//     try {
//       await handleSendToPendingClients(row.lead_id);
//       setIsSent(true);
//     } catch (e) {
//       console.error(e);
//       setIsSending(false);
//       alert("Failed to send to TT");
//     }
//   };

//   if (isSent || row.data_sent_to_customer_dashboard === "Sent") {
//     return (
//       <Button
//         variant="outline"
//         size="sm"
//         className="bg-orange-600 text-white hover:bg-orange-400 hover:text-white cursor-not-allowed"
//       >
//         Sent
//       </Button>
//     );
//   }

//   return (
//     <Button
//       variant="outline"
//       size="sm"
//       disabled={isSending}
//       onClick={onClick}
//       className={`text-white ${
//         isSending
//           ? "bg-orange-500 hover:bg-orange-500 cursor-not-allowed"
//           : "bg-purple-600 hover:bg-purple-700"
//       }`}
//     >
//       {isSending ? "Sending..." : "TT"}
//     </Button>
//   );
// };

  
//   /* =========================
//      Onboard helpers
//      ========================= */

//   const loadLatestOnboardingForLead = async (
//     leadId: string,
//     fallbackEmail?: string,
//   ) => {
//     setDialogLoading(true);
//     setLatestOnboardRowId(null);

//     const { data: row, error } = await supabase
//       .from("client_onborading_details")
//       .select(
//         `
//       id,
//       full_name,
//       personal_email,
//       company_email,
//       callable_phone,
//       job_role_preferences,
//       location_preferences,
//       salary_range,
//       work_auth_details,
//       needs_sponsorship,
//       full_address,
//       linkedin_url,
//       date_of_birth,
//       created_at
//     `,
//       )
//       .eq("lead_id", leadId)
//       .order("created_at", { ascending: false })
//       .limit(1)
//       .maybeSingle();

//     if (!error && row) {
//       setLatestOnboardRowId(row.id);
//       setObFullName(row.full_name ?? "");
//       setObPersonalEmail(row.personal_email ?? fallbackEmail ?? "");
//       setObCompanyEmail((row.company_email ?? "").trim());
//       setObCallablePhone(row.callable_phone ?? "");
//       setObJobRolesText(csvFromArray(row.job_role_preferences));
//       setObLocationsText(csvFromArray(row.location_preferences));
//       setObSalaryRange(row.salary_range ?? "");
//       setObWorkAuth(row.work_auth_details ?? "");
//       setObNeedsSponsorship(
//         typeof row.needs_sponsorship === "boolean"
//           ? row.needs_sponsorship
//           : null,
//       );
//       setObFullAddress(row.full_address ?? "");
//       setObLinkedInUrl(row.linkedin_url ?? "");
//       setObDob(row.date_of_birth ?? "");
//     } else {
//       setLatestOnboardRowId(null);
//       setObFullName("");
//       setObPersonalEmail(fallbackEmail ?? "");
//       setObCompanyEmail("");
//       setObCallablePhone("");
//       setObJobRolesText("");
//       setObLocationsText("");
//       setObSalaryRange("");
//       setObWorkAuth("");
//       setObNeedsSponsorship(null);
//       setObFullAddress("");
//       setObLinkedInUrl("");
//       setObDob("");
//     }

//     setObDate("");
//     setDialogLoading(false);
//   };

//   const handleOnboardClick = async (row: SalesClosure) => {
//     setCurrentLeadId(row.lead_id);
//     setCurrentSaleId(row.id);
//     setShowOnboardDialog(true);
//     // await loadLatestOnboardingForLead(row.lead_id, row.email);
//   };

//   const writePendingClientFromLead = async (leadId: string) => {
//     // latest onboarding
//     const { data: ob, error: obErr } = await supabase
//       .from("client_onborading_details")
//       .select(
//         `
//       full_name,
//       whatsapp_number,
//       personal_email,
//       callable_phone,
//       company_email,
//       job_role_preferences,
//       salary_range,
//       github_url,
//       linkedin_url,
//       location_preferences,
//       work_auth_details,
//       created_at,
//       lead_id,
//       needs_sponsorship,
//       visatypes
//     `,
//       )
//       .eq("lead_id", leadId)
//       .order("created_at", { ascending: false })
//       .limit(1)
//       .maybeSingle();

//     if (obErr) throw obErr;
//     if (!ob) throw new Error("No onboarding details found.");

//     // latest sales
//     const { data: scRow, error: scErr } = await supabase
//       .from("sales_closure")
//       .select(
//         `
//       badge_value,
//       closed_at,
//       email,
//       no_of_job_applications,
//       application_sale_value,
//       resume_sale_value,
//       portfolio_sale_value,
//       linkedin_sale_value,
//       github_sale_value,
//       courses_sale_value,
//       custom_sale_value,
//       job_board_value
//     `,
//       )
//       .eq("lead_id", leadId)
//       .order("closed_at", { ascending: false })
//       .limit(1)
//       .maybeSingle();

//     if (scErr) throw scErr;

//     const addOnsInfo = [
//       { type: "application_sale_value", value: scRow?.application_sale_value },
//       { type: "resume_sale_value", value: scRow?.resume_sale_value },
//       { type: "portfolio_sale_value", value: scRow?.portfolio_sale_value },
//       { type: "linkedin_sale_value", value: scRow?.linkedin_sale_value },
//       { type: "github_sale_value", value: scRow?.github_sale_value },
//       { type: "courses_sale_value", value: scRow?.courses_sale_value },
//       { type: "custom_sale_value", value: scRow?.custom_sale_value },
//       { type: "job_board_value", value: scRow?.job_board_value },
//     ]
//       .filter((i) => i.value !== null && i.value !== undefined)
//       .map((i) => JSON.stringify(i));

//     const payload = {
//       full_name: ob.full_name,
//       personal_email: ob.personal_email,
//       whatsapp_number: ob.whatsapp_number ?? null,
//       callable_phone: ob.callable_phone ?? null,
//       company_email: ob.company_email?.trim() || null,
//       job_role_preferences: ob.job_role_preferences ?? null,
//       salary_range: ob.salary_range ?? null,
//       location_preferences: ob.location_preferences ?? null,
//       work_auth_details: ob.work_auth_details ?? null,
//       visa_type: ob.visatypes ?? null,
//       sponsorship:
//         typeof ob.needs_sponsorship === "boolean"
//           ? ob.needs_sponsorship
//           : null,
//       applywizz_id: ob.lead_id ?? leadId,
//       github_url: ob.github_url ?? null,
//       linkedin_url: ob.linkedin_url ?? null,
//       badge_value: scRow?.badge_value ?? null,
//       no_of_applications: scRow?.no_of_job_applications ?? null,
//       add_ons_info: addOnsInfo,
//       created_at: ob.created_at ?? new Date().toISOString(),
//     };

//     const res = await fetch("/api/pending-clients/upsert", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify(payload),
//     });

//     if (!res.ok) {
//       const j = await res.json().catch(() => ({}));
//       throw new Error(j.error || "Failed to upsert pending_client");
//     }
//   };

//   const saveOnboardAndDetails = async () => {
//     if (!currentLeadId || !currentSaleId) {
//       alert("Missing context.");
//       return;
//     }
//     if (!obDate) {
//       alert("Please choose an Onboarded Date.");
//       return;
//     }

//     setDialogLoading(true);
//     try {
//       const payload = {
//         full_name: obFullName || null,
//         company_email: obCompanyEmail?.trim() || null,
//         personal_email: obPersonalEmail || null,
//         callable_phone: obCallablePhone || null,
//         job_role_preferences: csvToArray(obJobRolesText),
//         location_preferences: csvToArray(obLocationsText),
//         salary_range: obSalaryRange || null,
//         work_auth_details: obWorkAuth || null,
//         needs_sponsorship: obNeedsSponsorship,
//         full_address: obFullAddress || null,
//         linkedin_url: obLinkedInUrl || null,
//         date_of_birth: obDob || null,
//         lead_id: currentLeadId,
//       };

//       if (latestOnboardRowId) {
//         const { error } = await supabase
//           .from("client_onborading_details")
//           .update(payload)
//           .eq("id", latestOnboardRowId);
//         if (error) throw error;
//       } else {
//         const { error } = await supabase
//           .from("client_onborading_details")
//           .insert(payload);
//         if (error) throw error;
//       }

//       const { error: saleErr } = await supabase
//         .from("sales_closure")
//         .update({
//           onboarded_date: obDate,
//           company_application_email: obCompanyEmail || null,
//         })
//         .eq("id", currentSaleId);
//       if (saleErr) throw saleErr;

//       await writePendingClientFromLead(currentLeadId);

//       await fetchData();

//       setShowOnboardDialog(false);
//       setCurrentLeadId(null);
//       setCurrentSaleId(null);
//       setLatestOnboardRowId(null);
//       setObDate("");
//     } catch (e: any) {
//       console.error(e);
//       alert(e?.message || "Failed to save onboarding details");
//     } finally {
//       setDialogLoading(false);
//     }
//   };

//   /* =========================
//      Forward to TT (pending_clients)
//      ========================= */

//   const sendToPendingClients = async (leadId: string) => {
//     console.log("sendToPendingClients →", leadId);

//     const { data: sc, error: scErr } = await supabase
//       .from("sales_closure")
//       .select(
//         `
//       onboarded_date,
//       subscription_cycle,
//       no_of_job_applications,
//       badge_value,
//       id,
//       application_sale_value,
//       resume_sale_value,
//       portfolio_sale_value,
//       linkedin_sale_value,
//       github_sale_value,
//       courses_sale_value,
//       custom_sale_value,
//       job_board_value
//     `,
//       )
//       .eq("lead_id", leadId)
//       .order("onboarded_date", { ascending: false })
//       .limit(1)
//       .single();

//     if (scErr || !sc) throw new Error("No sales_closure record found.");

    // const startDate = sc.onboarded_date;
    // const endDate = startDate
    //   ? new Date(
    //       new Date(startDate).getTime() +
    //         sc.subscription_cycle * 24 * 60 * 60 * 1000,
    //     )
    //       .toISOString()
    //       .split("T")[0]
    //   : null;

    // const { data: rp, error: rpErr } = await supabase
    //   .from("resume_progress")
    //   .select("pdf_path")
    //   .eq("lead_id", leadId)
    //   .maybeSingle();
    // if (rpErr) throw rpErr;
    // const resumePath = rp?.pdf_path || null;

    // const { data: ob, error: obErr } = await supabase
    //   .from("client_onborading_details")
    //   .select("*")
    //   .eq("lead_id", leadId)
    //   .order("created_at", { ascending: true })
    //   .limit(1)
    //   .maybeSingle();
    // if (obErr || !ob) throw new Error("No onboarding details found.");

    // const allowedServices = [
    //   { field: "application_sale_value", label: "applications" },
    //   { field: "resume_sale_value", label: "resume" },
    //   { field: "portfolio_sale_value", label: "portfolio" },
    //   { field: "linkedin_sale_value", label: "linkedin" },
    //   { field: "github_sale_value", label: "github" },
    //   { field: "courses_sale_value", label: "courses" },
    //   { field: "experience", label: "experience" },
    //   { field: "badge_value", label: "badge" },
    //   { field: "job_board_value", label: "job-links" },
    // ];

    // const scAny: any = sc;
    // const addOnsInfo = allowedServices
    //   .filter((item) => {
    //     const val = scAny?.[item.field];
    //     return val !== null && val !== undefined && Number(val) > 0;
    //   })
    //   .map((item) => item.label);

//     const payload = {
//       full_name: ob.full_name,
//       personal_email: ob.personal_email,
//       whatsapp_number: ob.whatsapp_number ?? null,
//       callable_phone: ob.callable_phone ?? null,
//       company_email: ob.company_email?.trim() || null,
//       job_role_preferences: ob.job_role_preferences ?? null,
//       salary_range: ob.salary_range ?? null,
//       location_preferences: ob.location_preferences ?? null,
//       work_auth_details: ob.work_auth_details ?? null,
//       applywizz_id: leadId,
//       created_at: new Date().toISOString(),
//       visa_type: ob.visatypes ?? null,
//       sponsorship: ob.needs_sponsorship ?? null,
//       resume_url: resumePath,
//       resume_path: resumePath,
//       start_date: startDate,
//       end_date: endDate,
//       no_of_applications: sc.no_of_job_applications ?? null,
//       badge_value: sc.badge_value ?? null,
//       add_ons_info: addOnsInfo,
//       github_url: ob.github_url ?? null,
//       linked_in_url: ob.linkedin_url ?? null,
//     };

//     const res = await fetch("/api/pending-clients/upsert", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify(payload),
//     });

//     const result = await res.json();
//     if (!res.ok) throw new Error(result?.error || "Upsert failed.");

//     const { error: updateErr } = await supabase
//       .from("sales_closure")
//       .update({ data_sent_to_customer_dashboard: "Sent" })
//       .eq("lead_id", leadId);
//     if (updateErr) throw updateErr;

//     await fetchData();
//   };

//   const handleSendToPendingClients = async (leadId: string) => {
//     try {
//       await sendToPendingClients(leadId);
//       alert("Data sent to TT (pending_clients).");
//     } catch (e: any) {
//       console.error(e);
//       alert(e?.message || "Failed to send data.");
//     }
//   };



//         //  Onboard Dialog
//         <Dialog open={showOnboardDialog} onOpenChange={setShowOnboardDialog}>
//           <DialogContent className="max-w-3xl">
//             <DialogHeader>
//               <DialogTitle>
//                 Onboard & Edit — {currentLeadId ?? ""}
//               </DialogTitle>
//               <DialogDescription>
//                 Update the latest onboarding details and set the Onboarded
//                 Date.
//               </DialogDescription>
//             </DialogHeader>

//             {dialogLoading ? (
//               <div className="p-8 text-sm text-muted-foreground">
//                 Loading…
//               </div>
//             ) : (
//               <div className="space-y-4">
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                   <div className="space-y-1.5">
//                     <Label>Full Name</Label>
//                     <Input
//                       value={obFullName}
//                       onChange={(e) => setObFullName(e.target.value)}
//                     />
//                   </div>
//                   <div className="space-y-1.5">
//                     <Label>Company Email</Label>
//                     <Input
//                       value={obCompanyEmail}
//                       onChange={(e) =>
//                         setObCompanyEmail(e.target.value)
//                       }
//                     />
//                   </div>
//                 </div>

//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                   <div className="space-y-1.5">
//                     <Label>Callable Phone</Label>
//                     <Input
//                       value={obCallablePhone}
//                       onChange={(e) =>
//                         setObCallablePhone(e.target.value)
//                       }
//                     />
//                   </div>
//                   <div className="space-y-1.5">
//                     <Label>Onboarded Date</Label>
//                     <Input
//                       type="date"
//                       value={obDate}
//                       onChange={(e) => setObDate(e.target.value)}
//                     />
//                   </div>
//                 </div>

//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                   <div className="space-y-1.5">
//                     <Label>Job Role Preferences (comma separated)</Label>
//                     <Textarea
//                       rows={3}
//                       value={obJobRolesText}
//                       onChange={(e) =>
//                         setObJobRolesText(e.target.value)
//                       }
//                     />
//                   </div>
//                   <div className="space-y-1.5">
//                     <Label>Location Preferences (comma separated)</Label>
//                     <Textarea
//                       rows={3}
//                       value={obLocationsText}
//                       onChange={(e) =>
//                         setObLocationsText(e.target.value)
//                       }
//                     />
//                   </div>
//                 </div>

//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                   <div className="space-y-1.5">
//                     <Label>Salary Range</Label>
//                     <Input
//                       value={obSalaryRange}
//                       onChange={(e) =>
//                         setObSalaryRange(e.target.value)
//                       }
//                     />
//                   </div>
//                   <div className="space-y-1.5">
//                     <Label>Work Auth Details</Label>
//                     <Input
//                       value={obWorkAuth}
//                       onChange={(e) => setObWorkAuth(e.target.value)}
//                     />
//                   </div>
//                 </div>

//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                   <div className="space-y-1.5">
//                     <Label>Needs Sponsorship</Label>
//                     <Select
//                       value={
//                         obNeedsSponsorship === null
//                           ? "__unset__"
//                           : obNeedsSponsorship
//                           ? "yes"
//                           : "no"
//                       }
//                       onValueChange={(v) => {
//                         if (v === "__unset__") setObNeedsSponsorship(null);
//                         else setObNeedsSponsorship(v === "yes");
//                       }}
//                     >
//                       <SelectTrigger>
//                         <SelectValue placeholder="Select…" />
//                       </SelectTrigger>
//                       <SelectContent>
//                         <SelectItem value="__unset__">—</SelectItem>
//                         <SelectItem value="yes">Yes</SelectItem>
//                         <SelectItem value="no">No</SelectItem>
//                       </SelectContent>
//                     </Select>
//                   </div>
//                   <div className="space-y-1.5">
//                     <Label>Date of Birth</Label>
//                     <Input
//                       type="date"
//                       value={obDob}
//                       onChange={(e) => setObDob(e.target.value)}
//                     />
//                   </div>
//                 </div>

//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                   <div className="space-y-1.5">
//                     <Label>Full Address</Label>
//                     <Textarea
//                       rows={3}
//                       value={obFullAddress}
//                       onChange={(e) =>
//                         setObFullAddress(e.target.value)
//                       }
//                     />
//                   </div>
//                   <div className="space-y-1.5">
//                     <Label>LinkedIn URL</Label>
//                     <Input
//                       type="url"
//                       value={obLinkedInUrl}
//                       onChange={(e) =>
//                         setObLinkedInUrl(e.target.value)
//                       }
//                     />
//                   </div>
//                 </div>
//               </div>
//             )}

//             <DialogFooter>
//               <Button
//                 variant="outline"
//                 onClick={() => setShowOnboardDialog(false)}
//                 disabled={dialogLoading}
//               >
//                 Cancel
//               </Button>
//               <Button onClick={saveOnboardAndDetails} disabled={dialogLoading}>
//                 {dialogLoading ? "Saving…" : "Save & Onboard"}
//               </Button>
//             </DialogFooter>
//           </DialogContent>
//         </Dialog> 

