//app/account-management/page.tsx
"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { supabase } from '@/utils/supabase/client';
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Eye, MessageSquare, Star, Calendar } from "lucide-react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Papa from "papaparse";
import { useContext } from "react";
import { LoadingContext } from "@/components/providers/LoadingContext";
import FullScreenLoader from "@/components/ui/FullScreenLoader";

type AccountStage = "DNP" | "Call Again" | "Conversation Done";

interface FollowUp {
  date: string;
  notes: string;
}

interface Feedback {
  isHappy: boolean;
  rating: number;
  notes: string;
  willRenew: boolean;
  date: string;
}

interface Client {
  id: string;
  client_name: string;
  email: string;
  phone?: string;
  assigned_to: string;
  stage: AccountStage;
  created_at: string;
  follow_ups?: FollowUp[];
  feedback?: Feedback;
}

const accountStages: AccountStage[] = ["DNP", "Call Again", "Conversation Done"];

const getStageColor = (stage: AccountStage) => {
  switch (stage) {
    case "DNP":
      return "bg-yellow-100 text-yellow-800";
    case "Call Again":
      return "bg-blue-100 text-blue-800";
    case "Conversation Done":
      return "bg-green-100 text-green-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return "N/A";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "N/A";
    return date.toLocaleDateString();
  } catch (error) {
    console.error("Error parsing date:", dateString, error);
    return "N/A";
  }
};

function renderStars(rating: number) {
  return (
    <span className="flex">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
        />
      ))}
    </span>
  );
}

export default function AccountManagementPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const { loading, setLoading } = useContext(LoadingContext);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [followUpDialogOpen, setFollowUpDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [followUpFilter, setFollowUpFilter] = useState<"All dates" | "Today">("All dates");
  const [feedbackForm, setFeedbackForm] = useState<Feedback>({
    isHappy: false,
    rating: 5,
    notes: "",
    willRenew: false,
    date: new Date().toISOString().split("T")[0],
  });
  const [followUpForm, setFollowUpForm] = useState<FollowUp>({
    date: "",
    notes: "",
  });
  const [pendingStage, setPendingStage] = useState<AccountStage | null>(null);
  const [callHistory, setCallHistory] = useState<any[]>([]); // Store call history data
  const [clientFeedback, setClientFeedback] = useState<Feedback | null>(null); // Store client feedback data
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<any[]>([]);

  useEffect(() => {
    const fetchClients = async () => {
      setLoading(true);
      try {

        const { data: rawSalesData, error: salesError } = await supabase
          .from("sales_closure")
          .select("lead_id, email, onboarded_date")
          .not("onboarded_date", "is", null)
          .order("onboarded_date", { ascending: false });

        if (salesError || !rawSalesData) {
          console.error("❌ sales_closure fetch failed", salesError);
          return;
        }

        const salesDataMap = new Map<string, { lead_id: string; email: string; onboarded_date: string }>();

        for (const row of rawSalesData) {
          if (!salesDataMap.has(row.lead_id)) {
            salesDataMap.set(row.lead_id, row);
          }
        }

        const salesData = Array.from(salesDataMap.values());
        const leadIds = salesData.map((s) => s.lead_id);
        const { data: leadsData, error: leadsError } = await supabase
          .from("leads")
          .select("business_id, name, phone, assigned_to, email")
          .in("business_id", leadIds);

        if (leadsError || !leadsData) {
          console.error("❌ leads fetch failed", leadsError);
          return;
        }

        const leadsMap = Object.fromEntries(leadsData.map((l) => [l.business_id, l]));
        const { data: callRaw, error: callError } = await supabase
          .from("call_history")
          .select("lead_id, current_stage, followup_date")
          .order("followup_date", { ascending: false });

        if (callError) {
          console.error("❌ call_history fetch failed", callError);
        }

        const latestCallMap: Record<string, any> = {};
        for (const call of callRaw || []) {
          if (!latestCallMap[call.lead_id]) {
            latestCallMap[call.lead_id] = call;
          }
        }

        const mergedClients: Client[] = salesData.map((sale) => {
          const lead = leadsMap[sale.lead_id] || {};
          const call = latestCallMap[sale.lead_id];

          return {
            id: sale.lead_id,
            client_name: lead.name || "Unnamed",
            email: sale.email || lead.email || "unknown@example.com",
            phone: lead.phone || "N/A",
            assigned_to: lead.assigned_to || "Unassigned",
            created_at: sale.onboarded_date,
            stage: (call?.current_stage as AccountStage) || "DNP",
            follow_ups: [],
            feedback: undefined,
          };
        });

        setClients(mergedClients);
      } catch (err) {
        console.error("❌ Unexpected error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, []);

  useEffect(() => {
    if (!historyDialogOpen || !selectedClient) {
      setCallHistory([]);
      setClientFeedback(null);
      return;
    }


    const fetchCallHistoryAndFeedback = async () => {
      const { data: callHistoryData, error: callHistoryError } = await supabase
        .from("call_history")
        .select("current_stage, followup_date, notes")
        .eq("lead_id", selectedClient.id)
        .order("followup_date", { ascending: false });

      if (callHistoryError) {
        console.error(`Error fetching call history for lead ${selectedClient.id}:`, JSON.stringify(callHistoryError, null, 2));
      } else {
        setCallHistory(callHistoryData || []);
      }

      if (selectedClient.stage === "Conversation Done") {
        const { data: feedbackData, error: feedbackError } = await supabase
          .from("client_feedback")
          .select("*")
          .eq("lead_id", selectedClient.id)
          .order("id", { ascending: false })
          .limit(1);

        if (feedbackError) {
          console.error(`Error fetching client feedback for lead ${selectedClient.id}:`, JSON.stringify(feedbackError, null, 2));
        } else if (feedbackData?.[0]) {
          setClientFeedback({
            isHappy: feedbackData[0].client_emotion === "happy",
            rating: parseInt(feedbackData[0].rating),
            notes: feedbackData[0].notes,
            willRenew: feedbackData[0].renew_status === "yes",
            date: new Date().toISOString().split("T")[0], // Use current date as fallback
          });
        }
      }
    };

    fetchCallHistoryAndFeedback();
  }, [historyDialogOpen, selectedClient]);

  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.client_name.toLowerCase().includes(searchTerm.toLowerCase());

    if (followUpFilter === "Today") {
      const createdAt = new Date(client.created_at);
      const now = new Date();
      const diffInDays = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
      return diffInDays >= 15 && matchesSearch;
    }

    return matchesSearch;
  });


  // function getRenewWithinStatus(closedAt: string): string {
  //   const closedDate = new Date(closedAt);
  //   const today = new Date();

  //   const diffInTime = today.getTime() - closedDate.getTime();
  //   const diffInDays = Math.floor(diffInTime / (1000 * 60 * 60 * 24));

  //   const renewalWindow = 15;

  //   if (diffInDays < renewalWindow) {
  //     const remaining = renewalWindow - diffInDays;
  //     return `Within ${remaining} day${remaining === 1 ? "" : "s"}`;
  //   } else {
  //     const overdue = diffInDays - renewalWindow;
  //     return `Overdue by ${overdue} day${overdue === 1 ? "" : "s"}`;
  //   }
  // }


  const getRenewWithinBadge = (createdAt: string): React.ReactNode => {
    if (!createdAt) return "-";

    const closedDate = new Date(createdAt);
    const today = new Date();
    const diffInDays = Math.floor(
      (today.getTime() - closedDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffInDays < 15) {
      const daysLeft = 15 - diffInDays;
      return (
        <Badge className="bg-green-100 text-green-800">
          Within {daysLeft} day{daysLeft === 1 ? "" : "s"}
        </Badge>
      );
    }
    else if (diffInDays == 15) {

      return (
        <Badge className="bg-yellow-100 text-gray-800">
          Today lastdate
        </Badge>
      );
    }
    else {
      const overdueDays = diffInDays - 15;
      return (
        <Badge className="bg-red-100 text-red-800">
          Overdue by {overdueDays} day{overdueDays === 1 ? "" : "s"}
        </Badge>
      );
    }
  };

  const handleStageUpdate = (clientId: string, newStage: AccountStage) => {
    setClients((prev) => prev.map((client) => (client.id === clientId ? { ...client, stage: newStage } : client)));

    const updatedClient = clients.find((c) => c.id === clientId);
    if (!updatedClient) return;

    const clientWithUpdatedStage = { ...updatedClient, stage: newStage };
    setSelectedClient(clientWithUpdatedStage);

    if (newStage === "Conversation Done") {
      setFeedbackForm({
        isHappy: false,
        rating: 5,
        notes: "",
        willRenew: false,
        date: new Date().toISOString().split("T")[0],
      });
      setFeedbackDialogOpen(true);
    } else if (newStage === "DNP" || newStage === "Call Again") {
      setPendingStage(newStage);
      setFollowUpForm({
        date: new Date().toISOString().split("T")[0],
        notes: "",
      });
      setFollowUpDialogOpen(true);
    }
  };

  const handleFeedbackSubmit = async () => {
    if (!selectedClient) {
      console.error("No client selected");
      alert("No client selected. Please try again.");
      return;
    }

    if (!feedbackForm.rating || feedbackForm.rating < 1 || feedbackForm.rating > 5) {
      alert("Please select a valid rating between 1 and 5.");
      return;
    }

    if (!feedbackForm.notes || feedbackForm.notes.trim() === "") {
      alert("Please provide feedback notes.");
      return;
    }

    if (typeof feedbackForm.willRenew !== "boolean") {
      alert("Please select if the client will renew.");
      return;
    }

    const emailToUse =
      !selectedClient.email || selectedClient.email === "N/A" || selectedClient.email.trim() === ""
        ? "unknown@example.com"
        : selectedClient.email;

    const { data: leadCheck, error: leadCheckError } = await supabase
      .from("leads")
      .select("business_id")
      .eq("business_id", selectedClient.id)
      .limit(1);

    if (leadCheckError || !leadCheck || leadCheck.length === 0) {
      console.error("Lead not found with business_id:", selectedClient.id);
      alert("Lead does not exist. Please create the lead first.");
      return;
    }

    const feedbackData = {
      lead_id: selectedClient.id, // 💥 Using business_id directly
      client_emotion: feedbackForm.isHappy ? "happy" : "unhappy",
      rating: feedbackForm.rating.toString(),
      notes: feedbackForm.notes.trim(),
      renew_status: feedbackForm.willRenew ? "yes" : "no",
      email: emailToUse,
    };

    const { data, error } = await supabase
      .from("client_feedback")
      .insert([feedbackData])
      .select();

    if (error) {
      console.error("Error saving feedback:", JSON.stringify(error, null, 2));
      alert(`Failed to save feedback: ${error.message}`);
      return;
    }

    setClients((prev) =>
      prev.map((client) =>
        client.id === selectedClient.id ? { ...client, feedback: feedbackForm } : client
      )
    );

    setFeedbackDialogOpen(false);
    setFeedbackForm({
      isHappy: false,
      rating: 5,
      notes: "",
      willRenew: false,
      date: new Date().toISOString().split("T")[0],
    });

    console.log("✅ Feedback saved successfully for lead:", selectedClient.id);
  };


  const handleFollowUpSave = async () => {
    if (!selectedClient || !pendingStage) {
      console.error("No client or stage selected");
      alert("No client or stage selected. Please try again.");
      return;
    }

    if (!followUpForm.date || !followUpForm.notes.trim()) {
      alert("Please provide a follow-up date and notes.");
      return;
    }

    const emailToUse = !selectedClient.email || selectedClient.email === "N/A" || selectedClient.email.trim() === ""
      ? "unknown@example.com"
      : selectedClient.email;

    const phoneToUse = !selectedClient.phone || selectedClient.phone === "N/A" || selectedClient.phone.trim() === ""
      ? null
      : selectedClient.phone;

    const followUpData = {
      lead_id: selectedClient.id, // Use business_id as lead_id in call_history
      current_stage: pendingStage,
      followup_date: followUpForm.date,
      notes: followUpForm.notes.trim(),
      assigned_to: selectedClient.assigned_to || "Unassigned",
      email: emailToUse,
      phone: phoneToUse,
    };

    const { data, error } = await supabase.from("call_history").insert([followUpData]);

    if (error) {
      console.error("Error saving follow-up:", error);
      alert("Failed to save follow-up. Please try again.");
    } else {
      setClients((prev) =>
        prev.map((client) =>
          client.id === selectedClient.id
            ? {
              ...client,
              stage: pendingStage,
              follow_ups: [
                ...(client.follow_ups || []),
                { date: followUpForm.date, notes: followUpForm.notes },
              ],
            }
            : client
        )
      );
      setFollowUpDialogOpen(false);
      setFollowUpForm({ date: "", notes: "" });
      setPendingStage(null);
    }
  };



  const handleCSVUpload = (file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: function (results) {
        const requiredFields = ['Name', 'Rate', 'Payment Frequency', 'Onboarded date','Phone number','email'];
        const fields: string[] = Array.isArray(results.meta.fields) ? results.meta.fields as string[] : [];
        const missingFields = requiredFields.filter(field => !fields.includes(field));

        if (missingFields.length > 0) {
          alert(`Missing required columns: ${missingFields.join(', ')}`);
          return;
        }

        setCsvData(results.data);
      },
      error: function (error) {
        console.error("CSV parsing error:", error);
        alert("Failed to parse CSV.");
      },
    });
  };


  // const handleCSVSubmit = async () => {
  //   if (csvData.length === 0) {
  //     alert("No CSV data to submit");
  //     return;
  //   }
  //   const uniqueNames = [...new Set(csvData.map((row) => row.Name?.trim()).filter(Boolean))];
  //   const { data: leads, error: leadsError } = await supabase
  //     .from("leads")
  //     .select("name, business_id, email")
  //     .in("name", uniqueNames);

  //   if (leadsError) {
  //     console.error("Error fetching leads:", leadsError);
  //     alert("Failed to fetch lead data from database.");
  //     return;
  //   }

  //   const nameToLeadDetailsMap: Record<string, { lead_id: string; email: string }> = {};
  //   leads.forEach((lead) => {
  //     if (lead.name && lead.business_id && lead.email) {
  //       nameToLeadDetailsMap[lead.name.trim()] = {
  //         lead_id: lead.business_id,
  //         email: lead.email,
  //       };
  //     }
  //   });

  //   const formattedRows = csvData
  //     .map((row) => {
  //       const trimmedName = row.Name?.trim();
  //       const leadDetails = nameToLeadDetailsMap[trimmedName];

  //       if (!leadDetails) {
  //         console.warn(`❌ No lead info found for Name: ${trimmedName}`);
  //         return null;
  //       }
  //       const closedAt = row.closed_at;

  //       return {
  //         lead_id: leadDetails.lead_id,
  //         sale_value: Number(row.sale_value),
  //         subscription_cycle: Number(row.subscription_cycle),
  //         payment_mode: "UPI",
  //         closed_at: closedAt,
  //         email: leadDetails.email,
  //         finance_status: row.finance_status || "Paid",
  //         onboarded_date: closedAt, // Assuming onboarded_date is same as closed_at
  //       };
  //     })
  //     .filter(Boolean);

  //   if (formattedRows.length === 0) {
  //     alert("No valid rows to insert (possibly due to unmatched names).");
  //     return;
  //   }

  //   try {
  //     const { error } = await supabase
  //       .from("sales_closure")
  //       .insert(formattedRows);

  //     if (error) {
  //       console.error("Upload failed:", error);
  //       alert(`Upload failed: ${error.message}`);
  //       return;
  //     }

  //     alert(`🎉 Successfully uploaded ${formattedRows.length} records.`);
  //     setUploadDialogOpen(false);
  //     setCsvData([]);
  //     setCsvFile(null);
  //   } catch (err) {
  //     console.error("Unexpected error:", err);
  //     alert("An unexpected error occurred during upload");
  //   }
  // };


// const handleCSVSubmit = async () => {
//   if (csvData.length === 0) {
//     alert("No CSV data to submit");
//     return;
//   }

//   try {
//     // Step 1: Fetch existing AWL IDs
//     const { data: existingLeads, error: leadsError } = await supabase
//       .from("leads")
//       .select("business_id");

//     if (leadsError) throw leadsError;

//     const existingIds = (existingLeads || [])
//       .map((l) => l.business_id)
//       .filter(Boolean)
//       .map((id) => parseInt(id?.replace("AWL-", ""), 10))
//       .filter((n) => !isNaN(n));

//     let awlCounter = existingIds.length > 0 ? Math.max(...existingIds) + 1 : 1;

//     // Step 2: Prepare batch inserts
//     const leadsToInsert = [];
//     const salesToInsert = [];

//     for (const row of csvData) {
//       const name = row["Name"]?.trim();
//       const phone = row["Phone number"]?.trim() || null;
//       const email = row["email"]?.trim();
//       const sale_value = parseFloat(row["Rate"]);
//       const subscription_cycle = parseInt(row["Payment Frequency"], 10);
//       const date = new Date(row["Onboarded date"]);

//       const business_id = `AWL-${awlCounter++}`;

//       leadsToInsert.push({
//         name,
//         email,
//         phone,
//         created_at: date.toISOString(),
//         city: "Unknown",
//         source: "Directly dumped",
//         status: "Assigned",
//         business_id,
//         current_stage: "sale done",
//       });

//       salesToInsert.push({
//         lead_id: business_id,
//         lead_name: name,
//         email,
//         sale_value,
//         subscription_cycle,
//         payment_mode: "UPI",
//         finance_status: "Paid",
//         closed_at: date.toISOString(),
//         onboarded_date: date.toISOString().split("T")[0],
//       });
//     }

//     // Step 3: Insert to Supabase
//     const { error: leadInsertError } = await supabase.from("leads").insert(leadsToInsert);
//     if (leadInsertError) throw leadInsertError;

//     const { error: saleInsertError } = await supabase.from("sales_closure").insert(salesToInsert);
//     if (saleInsertError) throw saleInsertError;

//     alert(`🎉 Inserted ${leadsToInsert.length} records successfully`);
//     setUploadDialogOpen(false);
//     setCsvData([]);
//     setCsvFile(null);
//   } catch (err) {
//     console.error("❌ Upload failed:", err);
//     const errorMsg = err instanceof Error ? err.message : String(err);
//     alert(`Upload failed: ${errorMsg}`);
//   }
// };


const handleCSVSubmit = async () => {
  if (csvData.length === 0) {
    alert("No CSV data to submit");
    return;
  }

  try {
    const salesToInsert = [];

    for (const row of csvData) {
      const lead_id = row["lead_id"]?.trim();
      const name = row["Name"]?.trim();
      const email = row["email"]?.trim();
      // const phone = row["Phone number"]?.trim() || null;
      const sale_value = parseFloat(row["Rate"]);
      const subscription_cycle = parseInt(row["Payment Frequency"], 10);
      const date = new Date(row["Onboarded date"]);

      if (!lead_id || !name || !email || !sale_value || !subscription_cycle || isNaN(date.getTime())) {
        console.warn("❌ Skipping invalid row:", row);
        continue;
      }

      salesToInsert.push({
        lead_id,
        lead_name: name,
        email,
        // phone,
        sale_value,
        subscription_cycle,
        payment_mode: "UPI",
        finance_status: "Paid",
        closed_at: date.toISOString(),
        onboarded_date: date.toISOString().split("T")[0],
      });
    }

    if (salesToInsert.length === 0) {
      alert("No valid rows to upload.");
      return;
    }

    const { error } = await supabase.from("sales_closure").insert(salesToInsert);

    if (error) throw error;

    alert(`🎉 Successfully inserted ${salesToInsert.length} renewal records into sales_closure`);
    setUploadDialogOpen(false);
    setCsvData([]);
    setCsvFile(null);
  } catch (err) {
    console.error("❌ Upload failed:", err);
    const errorMsg = err instanceof Error ? err.message : String(err);
    alert(`Upload failed: ${errorMsg}`);
  }
};

  return (
    <>
      {loading && <FullScreenLoader />}
      <ProtectedRoute allowedRoles={["Account Management", "Super Admin"]}>

        <DashboardLayout>
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Account Management CRM</h1>
                <p className="text-gray-600 mt-2">Manage client relationships and feedback</p>
              </div>
              <div className="flex justify-end mb-4">
                <Button onClick={() => setUploadDialogOpen(true)}>Upload Sale Done CSV</Button>
              </div>
            </div>


            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{clients.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Happy Clients</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{clients.filter((c) => c.feedback?.isHappy).length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Renewal Intent</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{clients.filter((c) => c.feedback?.willRenew).length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Avg Rating</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {clients.filter((c) => c.feedback).length > 0
                      ? (
                        clients.filter((c) => c.feedback).reduce((sum, c) => sum + (c.feedback?.rating || 0), 0) /
                        clients.filter((c) => c.feedback).length
                      ).toFixed(1)
                      : "N/A"}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Account Management Dashboard</CardTitle>
                <CardDescription>Manage client accounts and track feedback</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mt-4">
                  <Input
                    placeholder="Search by email or name"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-md"
                  />

                  <Select value={followUpFilter} onValueChange={(value) => setFollowUpFilter(value as "All dates" | "Today")}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Follow Up" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All dates">All dates</SelectItem>
                      <SelectItem value="Today">Today</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="rounded-md border mt-6">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>S.No</TableHead>
                        <TableHead>Client Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Assigned To</TableHead>
                        <TableHead>Stage</TableHead>
                        <TableHead>Closed At</TableHead>
                        <TableHead>Deadline</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredClients.map((client, idx) => (
                        <TableRow key={client.id}>
                          <TableCell>{idx + 1}</TableCell>
                          <TableCell className="font-medium">{client.client_name}</TableCell>
                          <TableCell>{client.email}</TableCell>
                          <TableCell>{client.phone || "-"}</TableCell>
                          <TableCell>{client.assigned_to}</TableCell>
                          <TableCell>
                            <Select
                              value={accountStages.includes(client.stage) ? client.stage : undefined}
                              onValueChange={(value: AccountStage) => handleStageUpdate(client.id, value)}
                            >
                              <SelectTrigger className="w-40">
                                <SelectValue placeholder="Select Stage" />
                              </SelectTrigger>
                              <SelectContent>
                                {accountStages.map((stage) => (
                                  <SelectItem key={stage} value={stage}>
                                    <Badge className={getStageColor(stage)}>{stage}</Badge>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>{formatDate(client.created_at)}</TableCell>
                          <TableCell>{getRenewWithinBadge(client.created_at)}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedClient(client);
                                  setHistoryDialogOpen(true);
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedClient(client);
                                  if (client.feedback) {
                                    setFeedbackForm(client.feedback);
                                  }
                                  setFeedbackDialogOpen(true);
                                }}
                              >
                                <MessageSquare className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{selectedClient?.client_name} - Full History</DialogTitle>
                  <DialogDescription>Complete follow-up history and client interactions</DialogDescription>
                </DialogHeader>

                {selectedClient && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Email</Label>
                        <p className="text-sm text-gray-600">{selectedClient.email}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Assigned To</Label>
                        <p className="text-sm text-gray-600">{selectedClient.assigned_to}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Current Stage</Label>
                        <Badge className={getStageColor(selectedClient.stage)}>{selectedClient.stage}</Badge>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Closed</Label>
                        <p className="text-sm text-gray-600">{formatDate(selectedClient.created_at)}</p>
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium mb-3 block">Follow-up History</Label>
                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {callHistory.length > 0 ? (
                          callHistory.map((entry, index) => (
                            <div key={index} className="p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center gap-2 mb-2">
                                <Calendar className="h-4 w-4 text-gray-500" />
                                <span className="text-sm font-medium">{entry.followup_date}</span>
                              </div>
                              <div className="mb-2">
                                <span className="text-sm font-medium">Stage: </span>
                                <Badge className={getStageColor(entry.current_stage)}>{entry.current_stage}</Badge>
                              </div>
                              <p className="text-sm text-gray-600">{entry.notes}</p>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-gray-600">No follow-up history available.</p>
                        )}
                      </div>
                    </div>

                    {selectedClient.stage === "Conversation Done" && clientFeedback && (
                      <div>
                        <Label className="text-sm font-medium mb-3 block">Latest Feedback</Label>
                        <div className="p-3 bg-blue-50 rounded-lg space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">Rating:</span>
                              <div className="flex">{renderStars(clientFeedback.rating)}</div>
                            </div>
                            <Badge variant={clientFeedback.isHappy ? "default" : "secondary"}>
                              {clientFeedback.isHappy ? "Happy" : "Needs Attention"}
                            </Badge>
                          </div>
                          <div>
                            <span className="text-sm font-medium">Will Renew: </span>
                            <span
                              className={`text-sm ${clientFeedback.willRenew ? "text-green-600" : "text-red-600"}`}
                            >
                              {clientFeedback.willRenew ? "Yes" : "No"}
                            </span>
                          </div>
                          <div>
                            <span className="text-sm font-medium">Notes: </span>
                            <p className="text-sm text-gray-600 mt-1">{clientFeedback.notes}</p>
                          </div>
                          <div className="text-xs text-gray-500">Feedback Date: {clientFeedback.date}</div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </DialogContent>
            </Dialog>

            <Dialog open={feedbackDialogOpen} onOpenChange={setFeedbackDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Client Feedback</DialogTitle>
                  <DialogDescription>Collect feedback from {selectedClient?.client_name}</DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Is Client Happy?</Label>
                    <Select
                      value={feedbackForm.isHappy ? "happy" : "unhappy"}
                      onValueChange={(value) => setFeedbackForm((prev) => ({ ...prev, isHappy: value === "happy" }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="happy">Happy</SelectItem>
                        <SelectItem value="unhappy">Unhappy</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-sm font-medium mb-2 block">Rating (1-5)</Label>
                    <Select
                      value={feedbackForm.rating.toString()}
                      onValueChange={(value) => setFeedbackForm((prev) => ({ ...prev, rating: Number(value) }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <SelectItem key={rating} value={rating.toString()}>
                            <div className="flex items-center gap-2">
                              <span>{rating}</span>
                              <div className="flex">{renderStars(rating)}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Notes</Label>
                    <Textarea
                      placeholder="Enter detailed feedback..."
                      value={feedbackForm.notes}
                      onChange={(e) => setFeedbackForm((prev) => ({ ...prev, notes: e.target.value }))}
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-medium mb-2 block">Will Client Renew?</Label>
                    <Select
                      value={feedbackForm.willRenew ? "yes" : "no"}
                      onValueChange={(value) => setFeedbackForm((prev) => ({ ...prev, willRenew: value === "yes" }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setFeedbackDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleFeedbackSubmit}>Save Feedback</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={followUpDialogOpen} onOpenChange={setFollowUpDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Schedule Follow-up</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label className="block mb-1">Follow-up Date</Label>
                    <Input
                      type="date"
                      value={followUpForm.date}
                      onChange={e => setFollowUpForm(f => ({ ...f, date: e.target.value }))}
                      placeholder="dd-mm-yyyy"
                      className="w-full"
                    />
                  </div>
                  <div>
                    <Label className="block mb-1">Notes</Label>
                    <Textarea
                      placeholder="Add notes..."
                      value={followUpForm.notes}
                      onChange={e => setFollowUpForm(f => ({ ...f, notes: e.target.value }))}
                      className="w-full"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setFollowUpDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleFollowUpSave}>
                    Save Follow-up
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Upload Sale Done CSV</DialogTitle>
                  <DialogDescription>
                    Upload your sales CSV. We'll parse and show the number of entries.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <Input
                    type="file"
                    accept=".csv"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setCsvFile(file);
                        handleCSVUpload(file);
                      }
                    }}
                  />
                  <p className="text-sm text-gray-600">
                    {csvData.length > 0
                      ? `✅ Detected ${csvData.length} records in file.`
                      : "No file parsed yet."}
                  </p>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCSVSubmit} disabled={csvData.length === 0}>
                    Submit to Supabase
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

          </div>
        </DashboardLayout>
      </ProtectedRoute>
    </>
  );
}