
"use client";
import Link from "next/link";

import { useEffect, useState } from "react";
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useAuth } from "@/components/providers/auth-provider";

/* =========================
   Types & Constants
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
  waiting_client_approval: "Waiting for client approval",
  completed: "Completed",
};

/** NEW: Portfolio status is now separate in portfolio_progress */
type PortfolioStatus =
  | "not_started"
  | "pending"
  | "waiting_client_approval"
  | "success";

const PORTFOLIO_STATUS_LABEL: Record<PortfolioStatus, string> = {
  not_started: "Not started",
  pending: "Pending",
  waiting_client_approval: "Waiting for Client approval",
  success: "Success",
};

const PORTFOLIO_STATUS_OPTIONS: PortfolioStatus[] = [
  "not_started",
  "pending",
  "waiting_client_approval",
  "success",
];

interface SalesClosure {
  id: string;
  lead_id: string; // text in DB
  email: string;
  finance_status: FinanceStatus;
  closed_at: string | null;
  portfolio_sale_value?: number | null;
  github_sale_value?: number | null;

  // legacy fields on sales_closure (we are NOT using these for portfolio assignee anymore)
  associates_email?: string | null;
  associates_name?: string | null;
  associates_tl_email?: string | null;
  associates_tl_name?: string | null;

  // joined
  leads?: { name: string; phone: string };

  // resume_progress (read-only for resume build)
  rp_status?: ResumeStatus;
  rp_pdf_path?: string | null;

  // portfolio_progress (authoritative for portfolio)
  pp_status?: PortfolioStatus | null;
  pp_link?: string | null;
  pp_assigned_email?: string | null;
  pp_assigned_name?: string | null;
}

interface TeamUser {
  full_name: string;
  user_email: string;
  roles: "Technical Head" | "Technical Associate";
}

const PORTFOLIO_COLUMNS = [
  "S.No",
  "Client ID",
  "Name",
  "Email",
  "Phone",
  "Status",
  "Resume Status",
  "Resume PDF",
  "Portfolio Status",
  "Portfolio Link",
  "Assignee",
  "Closed At",
] as const;

const GITHUB_COLUMNS = [
    "S.No",
  "Client ID",
  "Name",
  "Email",
  "Phone",
  "Status",
  "GitHub Sale Value",
  "Closed At",
] as const;

/* =========================
   Component
   ========================= */

export default function TechnicalTeamPage() {
  const [loading, setLoading] = useState(true);

  const [portfolioRows, setPortfolioRows] = useState<SalesClosure[]>([]);
  const [githubRows, setGithubRows] = useState<SalesClosure[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamUser[]>([]);

  // Success dialog state (for entering portfolio link)
  const [linkDraft, setLinkDraft] = useState<Record<string, string>>({});
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkTargetLeadId, setLinkTargetLeadId] = useState<string | null>(null);
  const [linkTargetRowId, setLinkTargetRowId] = useState<string | null>(null);

  // Controlled Assignee value per portfolio row (keyed by sales_closure.id)
  const [assigneeByRow, setAssigneeByRow] = useState<
    Record<string, string | undefined>
  >({});

  const { user } = useAuth();
  const router = useRouter();

  /* =========================
     Helpers
     ========================= */

  const latestByLead = (rows: any[]) => {
    const map = new Map<string, any>();
    for (const r of rows ?? []) {
      const ex = map.get(r.lead_id);
      const ed = ex?.closed_at ?? "";
      const cd = r?.closed_at ?? "";
      if (!ex || new Date(cd) > new Date(ed)) map.set(r.lead_id, r);
    }
    return Array.from(map.values()).sort(
      (a, b) =>
        new Date(b.closed_at || "").getTime() -
        new Date(a.closed_at || "").getTime()
    );
  };

  const toNiceMoney = (v?: number | null) =>
    typeof v === "number"
      ? v.toLocaleString("en-IN", { maximumFractionDigits: 2 })
      : "-";

  /* =========================
     Data Fetch
     ========================= */

  const fetchData = async () => {
    if (!user) return;

    // portfolio rows from sales_closure (non-null and non-zero)
    const qPortfolio = supabase
      .from("sales_closure")
      .select(
        "id, lead_id, email, finance_status, closed_at, portfolio_sale_value, github_sale_value, associates_email, associates_name, associates_tl_email, associates_tl_name"
      )
      .not("portfolio_sale_value", "is", null)
      .neq("portfolio_sale_value", 0);

    // github rows
    const qGithub = supabase
      .from("sales_closure")
      .select(
        "id, lead_id, email, finance_status, closed_at, portfolio_sale_value, github_sale_value"
      )
      .not("github_sale_value", "is", null)
      .neq("github_sale_value", 0);

    const [{ data: pData, error: pErr }, { data: gData, error: gErr }] =
      await Promise.all([qPortfolio, qGithub]);
    if (pErr || gErr) {
      console.error("Failed to fetch sales data:", pErr || gErr);
      return;
    }

    const pLatest = latestByLead(pData || []);
    const gLatest = latestByLead(gData || []);
    const allLeadIds = Array.from(
      new Set([...pLatest, ...gLatest].map((r) => r.lead_id))
    );

    // leads basics
    const { data: leadsData, error: leadsErr } = await supabase
      .from("leads")
      .select("business_id, name, phone")
      .in("business_id", allLeadIds);
    if (leadsErr) {
      console.error("Failed to fetch leads:", leadsErr);
      return;
    }
    const leadMap = new Map(
      (leadsData ?? []).map((l) => [
        l.business_id,
        { name: l.name, phone: l.phone },
      ])
    );

    // resume_progress (resume build only)
    const { data: resumeProg, error: resumeErr } = await supabase
      .from("resume_progress")
      .select("lead_id, status, pdf_path")
      .in("lead_id", allLeadIds);
    if (resumeErr) {
      console.error("Failed to fetch resume_progress:", resumeErr);
      return;
    }
    const resumeMap = new Map(
      (resumeProg ?? []).map((p) => [
        p.lead_id,
        { status: p.status as ResumeStatus, pdf_path: p.pdf_path ?? null },
      ])
    );

    // NEW: portfolio_progress (authoritative portfolio data)
    const { data: portfolioProg, error: portErr } = await supabase
      .from("portfolio_progress")
      .select("lead_id, status, link, assigned_email, assigned_name")
      .in("lead_id", allLeadIds);
    if (portErr) {
      console.error("Failed to fetch portfolio_progress:", portErr);
      return;
    }
    const portfolioMap = new Map(
      (portfolioProg ?? []).map((p) => [
        p.lead_id,
        {
          status: (p.status ?? "not_started") as PortfolioStatus,
          link: p.link ?? null,
          assigned_email: p.assigned_email ?? null,
          assigned_name: p.assigned_name ?? null,
        },
      ])
    );

    // Merge for portfolio tab
    const mergedPortfolio: SalesClosure[] = pLatest.map((r) => ({
      ...r,
      leads: leadMap.get(r.lead_id) || { name: "-", phone: "-" },

      // resume (read-only)
      rp_status: resumeMap.get(r.lead_id)?.status ?? "not_started",
      rp_pdf_path: resumeMap.get(r.lead_id)?.pdf_path ?? null,

      // portfolio (from portfolio_progress)
      pp_status: portfolioMap.get(r.lead_id)?.status ?? "not_started",
      pp_link: portfolioMap.get(r.lead_id)?.link ?? null,
      pp_assigned_email: portfolioMap.get(r.lead_id)?.assigned_email ?? null,
      pp_assigned_name: portfolioMap.get(r.lead_id)?.assigned_name ?? null,
    }));

    // Merge for github tab (no portfolio/resume extras)
    const mergedGithub: SalesClosure[] = gLatest.map((r) => ({
      ...r,
      leads: leadMap.get(r.lead_id) || { name: "-", phone: "-" },
    }));

    setPortfolioRows(mergedPortfolio);
    setGithubRows(mergedGithub);
  };

  const fetchTeam = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("full_name, user_email, roles")
      .in("roles", ["Technical Head", "Technical Associate"]);
    if (error) {
      console.error("Failed to fetch team users:", error);
      return;
    }
    const sorted = (data as TeamUser[]).sort((a, b) =>
      a.roles === b.roles
        ? a.full_name.localeCompare(b.full_name)
        : a.roles.localeCompare(b.roles)
    );
    setTeamMembers(sorted);
  };

  /* =========================
     Actions
     ========================= */

  // Direct download from Supabase → auto-saves to Downloads
  const downloadResume = async (path: string) => {
  try {
    // lead_id is the first segment of the storage path: "<lead_id>/<timestamp>_file.pdf"
    const segments = (path || "").split("/");
    const leadId = segments[0] || "unknown";
    const fileName = `Resume-${leadId}.pdf`;

    // Get a signed URL (works for public or RLS-protected buckets)
    const { data, error } = await supabase.storage
      .from("resumes")
      .createSignedUrl(path, 60 * 60); // 1 hour

    if (error) throw error;
    if (!data?.signedUrl) throw new Error("No signed URL");

    // Fetch the file and trigger a client-side download with our custom filename
    const res = await fetch(data.signedUrl);
    if (!res.ok) throw new Error(`Download failed (${res.status})`);
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = fileName; // 👈 force name = resume-<lead_id>.pdf
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(objectUrl);
  } catch (e: any) {
    alert(e?.message || "Could not download PDF");
  }
};


  // Update portfolio status (non-success) OR open dialog for success
  const handlePortfolioStatusChange = async (
    sale: SalesClosure,
    next: PortfolioStatus
  ) => {
    if (next === "success") {
      setLinkTargetLeadId(sale.lead_id);
      setLinkTargetRowId(sale.id);
      setLinkDraft((d) => ({ ...d, [sale.lead_id]: sale.pp_link ?? "" }));
      setLinkDialogOpen(true);
      return;
    }

    const { error } = await supabase
      .from("portfolio_progress")
      .upsert(
        {
          lead_id: sale.lead_id,
          status: next,
          updated_by: user?.email ?? null,
        },
        { onConflict: "lead_id" }
      );
    if (error) return alert(error.message);

    setPortfolioRows((prev) =>
      prev.map((r) =>
        r.id === sale.id ? { ...r, pp_status: next, pp_link: null } : r
      )
    );
  };

  // Save success link
  const handleSavePortfolioSuccess = async () => {
    const link = linkTargetLeadId
      ? (linkDraft[linkTargetLeadId] ?? "").trim()
      : "";
    if (!link || !linkTargetLeadId || !linkTargetRowId)
      return alert("Please paste a link.");
    if (!/^https?:\/\//i.test(link))
      return alert("Enter a valid http(s) URL.");

    const { error } = await supabase
      .from("portfolio_progress")
      .upsert(
        {
          lead_id: linkTargetLeadId,
          status: "success",
          link,
          updated_by: user?.email ?? null, // if you switch to UUID, write user?.id here and change DB type
        },
        { onConflict: "lead_id" }
      );
    if (error) return alert(error.message);

    setPortfolioRows((prev) =>
      prev.map((r) =>
        r.id === linkTargetRowId
          ? { ...r, pp_status: "success", pp_link: link }
          : r
      )
    );
    setLinkDialogOpen(false);
    setLinkDraft({});
    setLinkTargetLeadId(null);
    setLinkTargetRowId(null);
  };

  // Assign portfolio owner (stored in portfolio_progress)
  const handleAssignPortfolio = async (
    sale: SalesClosure,
    memberEmail: string
  ) => {
    // optimistic UI
    setAssigneeByRow((p) => ({ ...p, [sale.id]: memberEmail }));

    const member = teamMembers.find((m) => m.user_email === memberEmail);
    if (!member) return;

    const { error } = await supabase
      .from("portfolio_progress")
      .upsert(
        {
          lead_id: sale.lead_id,
          assigned_email: member.user_email,
          assigned_name: member.full_name,
          updated_by: user?.email ?? null,
        },
        { onConflict: "lead_id" }
      );

    if (error) {
      alert(error.message || "Failed to assign portfolio owner");
      setAssigneeByRow((p) => ({
        ...p,
        [sale.id]: sale.pp_assigned_email ?? undefined,
      }));
      return;
    }

    setPortfolioRows((prev) =>
      prev.map((r) =>
        r.id === sale.id
          ? {
              ...r,
              pp_assigned_email: member.user_email,
              pp_assigned_name: member.full_name,
            }
          : r
      )
    );
  };

  /* =========================
     Effects
     ========================= */

  // Role gate
  useEffect(() => {
    if (user === null) return;
    // console.log(user.name, user.role);
    const allowed = [
      "Super Admin",
      "Technical Head",
      "Technical Associate",
    ] as const;
    if (!user || !allowed.includes(user.role as any)) {
      router.push("/unauthorized");
      return;
    }
    setLoading(false);
  }, [user, router]);

  // Initial data load
  useEffect(() => {
    if (user) {
      fetchData();
      fetchTeam();
    }
  }, [user]);

  // Seed/stick controlled Assignee values from portfolio_progress
  useEffect(() => {
    setAssigneeByRow((prev) => {
      const next = { ...prev };
      for (const r of portfolioRows) {
        const current = r.pp_assigned_email ?? undefined;
        if (next[r.id] === undefined) next[r.id] = current;
      }
      return next;
    });
  }, [portfolioRows, teamMembers]);

  /* =========================
     Renderers
     ========================= */

  const renderPortfolioTable = (rows: SalesClosure[]) => (
    <div className="rounded-md border mt-4">
      <Table>
        <TableHeader>
          <TableRow>
            {PORTFOLIO_COLUMNS.map((c) => (
              <TableHead key={c}>{c}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((sale, index) => (
            <TableRow key={sale.id}>
              <TableCell>{index+1}</TableCell>
              <TableCell>{sale.lead_id}</TableCell>

              <TableCell
                                className="font-medium max-w-[150px] break-words whitespace-normal cursor-pointer text-blue-600 hover:underline"
                                onClick={() => window.open(`/leads/${sale.lead_id}`, "_blank")}
                              >
                                {sale.leads?.name || "-"}
                              </TableCell>

              {/* <TableCell>{sale.leads?.name || "-"}</TableCell> */}
              <TableCell>{sale.email}</TableCell>
              <TableCell>{sale.leads?.phone || "-"}</TableCell>
              <TableCell>{sale.finance_status}</TableCell>

              {/* Resume Status (read-only) */}
              <TableCell>
                {STATUS_LABEL[(sale.rp_status ?? "not_started") as ResumeStatus]}
              </TableCell>

              {/* Resume PDF */}
              <TableCell>
                {sale.rp_pdf_path ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadResume(sale.rp_pdf_path!)}
                  >
                    Download Resume
                  </Button>
                ) : (
                  <span className="text-gray-400 text-sm">—</span>
                )}
              </TableCell>

              {/* Portfolio Status (from portfolio_progress) */}
              <TableCell className="space-y-2">
                {sale.pp_status === "success" && sale.pp_link ? (
                  <a
                    href={sale.pp_link}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 underline break-all"
                    title="Open portfolio link"
                  >
                    {sale.pp_link}
                  </a>
                ) : (
                  <Select
                    onValueChange={(v) =>
                      handlePortfolioStatusChange(sale, v as PortfolioStatus)
                    }
                    value={(sale.pp_status ?? "not_started") as PortfolioStatus}
                  >
                    <SelectTrigger className="w-[260px]">
                      <SelectValue placeholder="Set portfolio status" />
                    </SelectTrigger>
                    <SelectContent>
                      {PORTFOLIO_STATUS_OPTIONS.map((s) => (
                        <SelectItem key={s} value={s}>
                          {PORTFOLIO_STATUS_LABEL[s]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </TableCell>
             <TableCell className="max-w-[220px] truncate">
  {sale.leads?.name && (
    <a
      href={`https://${sale.leads?.name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "")}-applywizz.vercel.app/`}
      target="_blank"
      rel="noreferrer"
      className="text-blue-600 underline block truncate"
      title={`https://${sale.leads?.name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "")}-applywizz.vercel.app/`} // tooltip shows full URL
    >
      https://{sale.leads?.name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "")}-applywizz.vercel.app/
    </a>
  )}
</TableCell>



              {/* Assignee (stored in portfolio_progress) */}
              <TableCell>
                {(() => {
                  const current =
                    assigneeByRow[sale.id] ?? sale.pp_assigned_email ?? "";
                  const inList = !!teamMembers.find(
                    (m) => m.user_email === current
                  );

                  return (
                    <Select
                      value={current || undefined}
                      onValueChange={(email) =>
                        handleAssignPortfolio(sale, email)
                      }
                   disabled={user?.role =="Technical Associate"} >
                      <SelectTrigger className="w-[240px] !opacity-100 bg-muted/20 text-foreground">
                        <SelectValue placeholder="Assign to..." />
                      </SelectTrigger>
                      <SelectContent>
                        {/* fallback so Select can show current even if not in the list */}
                        {!inList && current && (
                          <SelectItem value={current} className="hidden">
                            {sale.pp_assigned_name || current}
                          </SelectItem>
                        )}

                        <div className="px-2 py-1 text-xs text-muted-foreground">
                          Technical Heads
                        </div>
                        {teamMembers
                          .filter((m) => m.roles === "Technical Head")
                          .map((m) => (
                            <SelectItem key={m.user_email} value={m.user_email}>
                              {m.full_name} • Head
                            </SelectItem>
                          ))}

                        <div className="px-2 py-1 text-xs text-muted-foreground">
                          Technical Associates
                        </div>
                        {teamMembers
                          .filter((m) => m.roles === "Technical Associate")
                          .map((m) => (
                            <SelectItem key={m.user_email} value={m.user_email}>
                              {m.full_name} • Associate
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  );
                })()}
              </TableCell>

              <TableCell>
                {sale.closed_at
                  ? new Date(sale.closed_at).toLocaleDateString("en-GB")
                  : "-"}
              </TableCell>
            </TableRow>
          ))}
          {rows.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={PORTFOLIO_COLUMNS.length}
                className="text-center text-sm text-muted-foreground py-10"
              >
                No records found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );

  const renderGithubTable = (rows: SalesClosure[]) => (
    <div className="rounded-md border mt-4">
      <Table>
        <TableHeader>
          <TableRow>
            {GITHUB_COLUMNS.map((c) => (
              <TableHead key={c}>{c}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((sale, index) => (
            <TableRow key={sale.id}>
              <TableCell>{index+1}</TableCell>
              <TableCell>{sale.lead_id}</TableCell>
              {/* <TableCell>{sale.leads?.name || "-"}</TableCell> */}

              <TableCell
                                className="font-medium max-w-[150px] break-words whitespace-normal cursor-pointer text-blue-600 hover:underline"
                                onClick={() => window.open(`/leads/${sale.lead_id}`, "_blank")}
                              >
                                {sale.leads?.name || "-"}
                              </TableCell>

              <TableCell>{sale.email}</TableCell>
              <TableCell>{sale.leads?.phone || "-"}</TableCell>
              <TableCell>{sale.finance_status}</TableCell>
              <TableCell>{toNiceMoney(sale.github_sale_value)}</TableCell>
              <TableCell>
                {sale.closed_at
                  ? new Date(sale.closed_at).toLocaleDateString("en-GB")
                  : "-"}
              </TableCell>
            </TableRow>
          ))}
          {rows.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={GITHUB_COLUMNS.length}
                className="text-center text-sm text-muted-foreground py-10"
              >
                No GitHub sales found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );

  /* =========================
     Render
     ========================= */

  return (
    <ProtectedRoute
      allowedRoles={["Super Admin", "Technical Head", "Technical Associate"]}
    >
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">Technical Page</h1>
          </div>

          {loading ? (
            <p className="p-6 text-gray-600">Loading...</p>
          ) : (
            <Tabs defaultValue="portfolio" className="w-full">
              <TabsList className="grid grid-cols-2 w-full sm:w-auto">
                <TabsTrigger value="portfolio">Portfolios</TabsTrigger>
                <TabsTrigger value="github">GitHub</TabsTrigger>
              </TabsList>

              <TabsContent value="portfolio">
                {renderPortfolioTable(portfolioRows)}
              </TabsContent>
              <TabsContent value="github">
                {renderGithubTable(githubRows)}
              </TabsContent>
            </Tabs>
          )}
        </div>

        {/* Success dialog */}
        <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Mark as Success</DialogTitle>
            </DialogHeader>

            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">
                Success link
              </label>
              <Input
                placeholder="https://…"
                value={linkTargetLeadId ? linkDraft[linkTargetLeadId] ?? "" : ""}
                onChange={(e) =>
                  setLinkDraft((prev) => ({
                    ...prev,
                    ...(linkTargetLeadId
                      ? { [linkTargetLeadId]: e.target.value }
                      : {}),
                  }))
                }
              />
              <p className="text-xs text-muted-foreground">
                Paste the final portfolio link. It will be saved in{" "}
                <code>portfolio_progress</code>.
              </p>
            </div>

            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => setLinkDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSavePortfolioSuccess}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
