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

// Utility to safely format dates
const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return "N/A";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "N/A"; // Invalid date
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

  // Fetch clients from Supabase sales_closure table and update stages from call_history
  useEffect(() => {
    const fetchClients = async () => {
      // Fetch sales_closure data
      const { data: salesData, error: salesError } = await supabase
        .from("sales_closure")
        .select("*")
        .order("closed_at", { ascending: false });

      if (salesError) {
        console.error("Error fetching clients from sales_closure:", JSON.stringify(salesError, null, 2));
        return;
      }

      console.log("Sales closure data:", salesData); // Debug: Log the fetched data

      // Map sales_closure data to clients and fetch missing data from leads
      const mappedClients: Client[] = [];
      for (const sale of salesData || []) {
        let clientData: Partial<Client> = {
          id: sale.lead_id, // Use lead_id (which is leads.business_id)
          client_name: sale.name || sale.client_name || "Unnamed",
          email: sale.email || "unknown@example.com",
          phone: sale.phone || "N/A",
          assigned_to: sale.assigned_to || "Unassigned",
          created_at: sale.closed_at,
        };

        // Check if lead_id exists to fetch additional data from leads
        const leadId = sale.lead_id;
        if (leadId && (!sale.name || !sale.email || !sale.phone || !sale.assigned_to)) {
          const { data: leadData, error: leadError } = await supabase
            .from("leads")
            .select("id, business_id, name, email, phone, assigned_to")
            .eq("business_id", leadId); // Match with business_id, not id

          if (leadError) {
            console.error(`Error fetching lead data for lead_id ${leadId}:`, JSON.stringify(leadError, null, 2));
          } else if (leadData && leadData.length > 0) {
            const lead = leadData[0]; // Take the first lead if multiple are returned
            console.log(`Lead data for lead_id ${leadId}:`, lead);
            clientData = {
              ...clientData,
              client_name: sale.name || sale.client_name || lead.name || "Unnamed",
              email: sale.email || lead.email || "unknown@example.com",
              phone: sale.phone || lead.phone || "N/A",
              assigned_to: sale.assigned_to || lead.assigned_to || "Unassigned",
            };
          }
        }

        // Fetch the most recent call history entry for this sale
        const { data: callHistoryData, error: callHistoryError } = await supabase
          .from("call_history")
          .select("current_stage")
          .eq("lead_id", sale.lead_id) // Use lead_id (which is leads.business_id)
          .order("followup_date", { ascending: false })
          .limit(1);

        if (callHistoryError) {
          console.error(`Error fetching call history for sale ${sale.lead_id}:`, JSON.stringify(callHistoryError, null, 2));
        }

        console.log(`Call history for sale ${sale.lead_id}:`, callHistoryData); // Debug: Log call history

        // const recentStage = callHistoryData?.[0]?.current_stage as AccountStage || "DNP";
        const recentStage = callHistoryData?.[0]?.current_stage as AccountStage | undefined;

        mappedClients.push({
          ...clientData,
          id: sale.lead_id, // Ensure ID reflects the lead_id
          stage: recentStage,
          created_at: sale.closed_at,
          follow_ups: [],
          feedback: undefined,
        } as Client);
      }

      setClients(mappedClients);
    };

    fetchClients();
  }, []);

  // Fetch call history and client feedback when the History Dialog opens
  useEffect(() => {
    if (!historyDialogOpen || !selectedClient) {
      setCallHistory([]);
      setClientFeedback(null);
      return;
    }

    const fetchCallHistoryAndFeedback = async () => {
      // Fetch call history
      const { data: callHistoryData, error: callHistoryError } = await supabase
        .from("call_history")
        .select("current_stage, followup_date, notes")
        .eq("lead_id", selectedClient.id) // selectedClient.id is leads.business_id
        .order("followup_date", { ascending: false });

      if (callHistoryError) {
        console.error(`Error fetching call history for lead ${selectedClient.id}:`, JSON.stringify(callHistoryError, null, 2));
      } else {
        setCallHistory(callHistoryData || []);
      }

      // Fetch client feedback if stage is "Conversation Done"
      if (selectedClient.stage === "Conversation Done") {
        const { data: feedbackData, error: feedbackError } = await supabase
          .from("client_feedback")
          .select("*")
          .eq("lead_id", selectedClient.id) // selectedClient.id is leads.business_id
          .order("id", { ascending: false }) // Assuming id is auto-incrementing, get the latest
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


  // 🧠 Calculates whether the renewal is upcoming or overdue
  function getRenewWithinStatus(closedAt: string): string {
    const closedDate = new Date(closedAt);
    const today = new Date();

    const diffInTime = today.getTime() - closedDate.getTime();
    const diffInDays = Math.floor(diffInTime / (1000 * 60 * 60 * 24));

    const renewalWindow = 15;

    if (diffInDays < renewalWindow) {
      const remaining = renewalWindow - diffInDays;
      return `Within ${remaining} day${remaining === 1 ? "" : "s"}`;
    } else {
      const overdue = diffInDays - renewalWindow;
      return `Overdue by ${overdue} day${overdue === 1 ? "" : "s"}`;
    }
  }


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

    // ✅ SAFELY check if lead exists using selectedClient.id → leads.business_id
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

  return (
    <ProtectedRoute allowedRoles={["Account Management", "Super Admin"]}>

      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Account Management CRM</h1>
              <p className="text-gray-600 mt-2">Manage client relationships and feedback</p>
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
                {/* 🔍 Search Input */}
                <Input
                  placeholder="Search by email or name"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-md"
                />

                {/* 🔽 Follow-Up Dropdown */}
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

          {/* Client History Dialog */}
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

          {/* Feedback Dialog */}
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

          {/* Follow-Up Dialog for DNP and Call Again */}
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
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}