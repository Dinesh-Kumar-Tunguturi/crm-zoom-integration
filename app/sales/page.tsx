//app/sales/page.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from '@/utils/supabase/client';
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Eye, Search } from "lucide-react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { createAndUploadInvoice } from '@/lib/createInvoice';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);
import isBetween from "dayjs/plugin/isBetween";

dayjs.extend(isBetween);


type SalesStage = "Prospect" | "DNP" | "Out of TG" | "Not Interested" | "Conversation Done" | "Sale Done"  | "Target";

interface CallHistory {
  date: string;
  stage: SalesStage;
  notes: string;
}

interface Lead {
  id: string;
  business_id: string;
  client_name: string;
  email: string;
  phone: string;
  assigned_to: string;
  current_stage: SalesStage;
  call_history: CallHistory[];
  created_at: string | null;
  assigned_at: string | null;  
}

interface Profile {
  full_name: string;
  roles: string;
}
// interface SaleClosing {
//   sale_value: number;
//   subscription_cycle: 15 | 30 | 60 | 90; // Subscription cycle in days
//   payment_mode: "UPI" | "PayPal" | "Bank Transfer" | "Stripe" | "Credit/Debit Card" | "Other";
// }

interface SaleClosing {
  base_value: number;                 // price for 1-month
  subscription_cycle: 15 | 30 | 60 | 90;
  payment_mode: "UPI" | "PayPal" | "Bank Transfer" | "Stripe" | "Credit/Debit Card" | "Other";
  closed_at: string;                  // YYYY-MM-DD picked from calendar
  resume_value: number;
  portfolio_value: number;
  linkedin_value: number;
  github_value: number;
}


interface FollowUp {
  follow_up_date: string;
  notes: string;
}

const salesStages: SalesStage[] = [
  "Prospect", "DNP", "Out of TG", "Not Interested", "Conversation Done", "Target", "Sale Done"
];

const getStageColor = (stage: SalesStage) => {
  switch (stage) {
    case "Prospect": return "bg-blue-100 text-blue-800";
    case "DNP": return "bg-yellow-100 text-yellow-800";
    case "Out of TG":
    case "Not Interested": return "bg-red-100 text-red-800";
    case "Conversation Done": return "bg-purple-100 text-purple-800";
    case "Sale Done": return "bg-green-100 text-green-800";
    case "Target": return "bg-orange-100 text-orange-800";
    default: return "bg-gray-100 text-gray-800";
  }
};

export default function SalesPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
    const [userProfile, setUserProfile] = useState<Profile | null>(null);

  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [followUpDialogOpen, setFollowUpDialogOpen] = useState(false);
  const [saleClosingDialogOpen, setSaleClosingDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [followUpData, setFollowUpData] = useState<FollowUp>({ follow_up_date: "", notes: "" });
  const [followUpSubmitted, setFollowUpSubmitted] = useState(false); // Track if follow-up was submitted
  const [followUpsDialogOpen, setFollowUpsDialogOpen] = useState(false);
  const [followUpsData, setFollowUpsData] = useState<any[]>([]);
  const [followUpsFilter, setFollowUpsFilter] = useState<"today" | "all">("today");
  const [pendingStageUpdate, setPendingStageUpdate] = useState<{ leadId: string, stage: SalesStage } | null>(null);
  const [previousStage, setPreviousStage] = useState<SalesStage | null>(null);
  const [totalAmount, setTotalAmount] = useState(0);
const [subscriptionEndsOn, setSubscriptionEndsOn] = useState<string>("");
const [startDate, setStartDate] = useState<string | null>(null);
const [editingNote, setEditingNote] = useState(false);
const [editedNote, setEditedNote] = useState("");


const [endDate, setEndDate] = useState<string | null>(null);
const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);
const [onboardDialogOpen, setOnboardDialogOpen] = useState(false);

// Client Info
const [clientName, setClientName] = useState("");
const [clientEmail, setClientEmail] = useState("");
const [contactNumber, setContactNumber] = useState("");
const [city, setCity] = useState("");
const [onboardingDate, setOnboardingDate] = useState("");

// Subscription
const [paymentMode, setPaymentMode] = useState("");
const [subscriptionCycle, setSubscriptionCycle] = useState(""); // Values: "15", "30", "60", "90"
const [subscriptionSaleValue, setSubscriptionSaleValue] = useState("");
const [subscriptionSource, setSubscriptionSource] = useState("");

// Add-ons
const [resumeValue, setResumeValue] = useState("");
const [portfolioValue, setPortfolioValue] = useState("");
const [linkedinValue, setLinkedinValue] = useState("");
const [githubValue, setGithubValue] = useState("");

// Calculated Fields
const [autoTotal, setAutoTotal] = useState(0);
const [totalSale, setTotalSale] = useState(0);
const [nextDueDate, setNextDueDate] = useState("-");

// Auto calculate subscription total
useEffect(() => {
  const base = parseFloat(subscriptionSaleValue || "0");
  const cycle = parseInt(subscriptionCycle || "0");

  const multiplier =
    cycle === 15 ? 0.5 :
    cycle === 30 ? 1 :
    cycle === 60 ? 2 :
    cycle === 90 ? 3 : 0;

  setAutoTotal(base * multiplier);
}, [subscriptionSaleValue, subscriptionCycle]);

// Auto calculate total sale
useEffect(() => {
  const resume = parseFloat(resumeValue || "0");
  const linkedin = parseFloat(linkedinValue || "0");
  const github = parseFloat(githubValue || "0");
  const portfolio = parseFloat(portfolioValue || "0");

  setTotalSale(autoTotal + resume + linkedin + github + portfolio);
}, [autoTotal, resumeValue, linkedinValue, githubValue, portfolioValue]);

// Calculate next payment due date
useEffect(() => {
  const days = parseInt(subscriptionCycle || "0");
  if (days) {
    const today = new Date();
    today.setDate(today.getDate() + days);
    const formatted = today.toISOString().split("T")[0];
    setNextDueDate(formatted);
  } else {
    setNextDueDate("-");
  }
}, [subscriptionCycle]);





  // const [saleData, setSaleData] = useState<SaleClosing>({
  //   sale_value: 0,
  //   subscription_cycle: "" as unknown as 15 | 30 | 60 | 90,  // ← trick to allow placeholder
  //   payment_mode: "" as unknown as SaleClosing["payment_mode"]
  // });

  const [saleData, setSaleData] = useState<SaleClosing>({
  base_value: 0,
  subscription_cycle: "" as unknown as 15 | 30 | 60 | 90,
  payment_mode: "" as unknown as SaleClosing["payment_mode"],
  closed_at: "",
  resume_value: 0,
  portfolio_value: 0,
  linkedin_value: 0,
  github_value: 0,
});



useEffect(() => {
    fetchUserProfile();
    
  }, []);

  const fetchUserProfile = async () => {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error("Error fetching auth user:", authError);
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("full_name, roles")
      .eq("auth_id", user.id)
      .single();

    if (profileError) {
      console.error("Error fetching profile:", profileError);
      return;
    }

      console.log("Fetched profile:", profile);

    setUserProfile(profile);
    fetchLeads(profile);   // pass profile here
  };

  const fetchLeads = async (profile: Profile) => {
    let query = supabase.from("leads").select(
      // "id, business_id, name, email, phone, assigned_to, current_stage, created_at"

        "id, business_id, name, email, phone, assigned_to, current_stage, created_at, assigned_at"

    );

    if (profile.roles === "Sales Associate") {
      query = query.eq("assigned_to", profile.full_name);
    } else {
      query = query.not("assigned_to", "is", null).neq("assigned_to", "");
    }

    const { data, error } = await query;
    if (error) {
      console.error("Error fetching leads:", error);
      return;
    }

    const leadsData: Lead[] = data.map((lead: any) => ({
      id: lead.id,
      business_id: lead.business_id,
      client_name: lead.name,
      email: lead.email,
      phone: lead.phone,
      assigned_to: lead.assigned_to,
      current_stage: lead.current_stage,
      call_history: [],
      created_at: lead.created_at,
        assigned_at: lead.assigned_at,      // ⬅️ add this

    }));

    setLeads(leadsData);
  };

  /* 🔄 Re-compute total every time a relevant field changes */
useEffect(() => {
  const multiplier =
    saleData.subscription_cycle === 15 ? 0.5 :
    saleData.subscription_cycle === 30 ? 1   :
    saleData.subscription_cycle === 60 ? 2   : 3;          // 90 days

  const addOns =
    saleData.resume_value +
    saleData.portfolio_value +
    saleData.linkedin_value +
    saleData.github_value;

  setTotalAmount(saleData.base_value * multiplier + addOns);
}, [
  saleData.base_value,
  saleData.subscription_cycle,
  saleData.resume_value,
  saleData.portfolio_value,
  saleData.linkedin_value,
  saleData.github_value,
]);

/* 📅  Compute subscription-end date preview */
useEffect(() => {
  if (!saleData.closed_at || !saleData.subscription_cycle) {
    setSubscriptionEndsOn(""); return;
  }
  const start = new Date(saleData.closed_at);
  start.setDate(start.getDate() + saleData.subscription_cycle);
  setSubscriptionEndsOn(start.toISOString().slice(0, 10));
}, [saleData.closed_at, saleData.subscription_cycle]);


  // const fetchFollowUps = async () => {

  //   const { data: leadsData, error: leadsError } = await supabase
  //     .from("leads")
  //     .select("id, business_id, name, email, phone, assigned_to, current_stage")
  //     .in("current_stage", ["DNP", "Conversation Done"]);

  //   if (leadsError) {
  //     console.error("❌ Error fetching leads:", leadsError);
  //     return [];
  //   }

  //   const businessIds = leadsData.map((l) => l.business_id);

  //   const { data: historyData, error: historyError } = await supabase
  //     .from("call_history")
  //     .select("lead_id, followup_date, notes")
  //     .in("lead_id", businessIds)
  //     .order("followup_date", { ascending: false }); // 👈 sorted by latest first

  //   if (historyError) {
  //     console.error("❌ Error fetching call history:", historyError);
  //     return [];
  //   }

  //   const mostRecentMap = new Map<string, { followup_date: string; notes: string }>();
  //   for (const entry of historyData) {
  //     if (!mostRecentMap.has(entry.lead_id)) {
  //       mostRecentMap.set(entry.lead_id, {
  //         followup_date: entry.followup_date ?? "N/A",
  //         notes: entry.notes ?? "N/A",
  //       });
  //     }
  //   }

  //   return leadsData.map((lead) => ({
  //     ...lead,
  //     followup_date: mostRecentMap.get(lead.business_id)?.followup_date ?? "N/A",
  //     notes: mostRecentMap.get(lead.business_id)?.notes ?? "N/A",
  //   }));
  // };

  const fetchFollowUps = async () => {
  if (!userProfile) return [];

  let leadsQuery = supabase
    .from("leads")
    .select("id, business_id, name, email, phone, assigned_to, current_stage")
    .in("current_stage", ["DNP", "Conversation Done", "Target"]);

  // 🔒 Filter by name if not Admin
  if (userProfile.roles === "Sales Associate") {
    leadsQuery = leadsQuery.eq("assigned_to", userProfile.full_name);
  }

  const { data: leadsData, error: leadsError } = await leadsQuery;
  if (leadsError) {
    console.error("❌ Error fetching leads:", leadsError);
    return [];
  }

  const businessIds = leadsData.map((l) => l.business_id);

  const { data: historyData, error: historyError } = await supabase
    .from("call_history")
    .select("id, lead_id, followup_date, notes")
    .in("lead_id", businessIds)
    .order("followup_date", { ascending: false });

  if (historyError) {
    console.error("❌ Error fetching call history:", historyError);
    return [];
  }

  const mostRecentMap = new Map<string, { followup_date: string; notes: string }>();
  for (const entry of historyData) {
    if (!mostRecentMap.has(entry.lead_id)) {
      mostRecentMap.set(entry.lead_id, {
        followup_date: entry.followup_date ?? "N/A",
        notes: entry.notes ?? "N/A",
      });
    }
  }

  return leadsData.map((lead) => ({
    ...lead,
    followup_date: mostRecentMap.get(lead.business_id)?.followup_date ?? "N/A",
    notes: mostRecentMap.get(lead.business_id)?.notes ?? "N/A",
  }));
};


  // const filteredLeads = leads.filter((lead) => {
  //   const matchesSearch = lead.client_name.toLowerCase().includes(searchTerm.toLowerCase())
  //     || lead.email.toLowerCase().includes(searchTerm.toLowerCase())
  //     || lead.phone.includes(searchTerm);
  //   const matchesStage = stageFilter === "all" || lead.current_stage === stageFilter;
  //   return matchesSearch && matchesStage;
  // });

  

  const filteredLeads = leads.filter((lead) => {
  const matchesSearch =
    lead.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.phone.includes(searchTerm);

  const matchesStage = stageFilter === "all" || lead.current_stage === stageFilter;

  // const matchesDate =
  //   !startDate || !endDate ||
  //   (lead.assigned_at &&
  //     dayjs(lead.assigned_at).isAfter(dayjs(startDate).subtract(1, 'day')) &&
  //     dayjs(lead.assigned_at).isBefore(dayjs(endDate).add(1, 'day')));

  const matchesDate =
  !startDate || !endDate ||
  (lead.assigned_at &&
    dayjs(lead.assigned_at).isBetween(
      dayjs(startDate).startOf("day"),
      dayjs(endDate).endOf("day"),
      null,
      "[]"
    ));


  return matchesSearch && matchesStage && matchesDate;
});




  const handleStageUpdate = async (leadId: string, newStage: SalesStage) => {
    const lead = leads.find((l) => l.id === leadId);
    if (!lead) return;

    setSelectedLead(lead);
    setPreviousStage(lead.current_stage); // Save current stage for revert

    if (newStage === "DNP" || newStage === "Conversation Done" || newStage === "Target") {
      setLeads((prev) =>
        prev.map((l) => (l.id === leadId ? { ...l, current_stage: newStage } : l))
      );
      setPendingStageUpdate({ leadId, stage: newStage });
      setFollowUpDialogOpen(true);
      return;
    }

    if (newStage === "Sale Done") {
      setPreviousStage(lead.current_stage); // Save current
      setPendingStageUpdate({ leadId, stage: newStage });
      // Save lead to act on after Save
      setLeads((prev) =>
        prev.map((l) =>
          l.id === leadId ? { ...l, current_stage: "Sale Done" } : l
        )
      );
      setSaleClosingDialogOpen(true);
      return;
    }

    // Immediate update for other stages
    const updatedLead = { ...lead, current_stage: newStage };
    const { error } = await supabase.from("leads").update({ current_stage: newStage }).eq("id", leadId);
    if (error) {
      console.error("Error updating stage:", error);
      return;
    }

    await supabase.from("call_history").insert([{
      lead_id: lead.business_id,
      email: lead.email,
      phone: lead.phone,
      assigned_to: lead.assigned_to,
      current_stage: newStage,
      followup_date: new Date().toISOString().split("T")[0],
      notes: `Stage changed to ${newStage}`
    }]);

    setLeads((prev) => prev.map((l) => (l.id === leadId ? updatedLead : l)));
  };

  const handleFollowUpSubmit = async () => {
    if (!selectedLead || !pendingStageUpdate) return;

    const { error: historyError } = await supabase.from("call_history").insert([{
      lead_id: selectedLead.business_id,
      email: selectedLead.email,
      phone: selectedLead.phone,
      assigned_to: selectedLead.assigned_to,
      current_stage: pendingStageUpdate.stage,
      followup_date: followUpData.follow_up_date,
      notes: followUpData.notes
    }]);

    if (historyError) {
      console.error("Error inserting follow-up:", historyError);
      return;
    }

    const { error: stageError } = await supabase
      .from("leads")
      .update({ current_stage: pendingStageUpdate.stage })
      .eq("id", pendingStageUpdate.leadId);

    if (stageError) {
      console.error("Error updating stage:", stageError);
      return;
    }

    setLeads((prev) =>
      prev.map((l) =>
        l.id === pendingStageUpdate.leadId ? { ...l, current_stage: pendingStageUpdate.stage } : l
      )
    );
    setFollowUpsData((prev) =>
      prev.map((l) =>
        l.id === pendingStageUpdate.leadId ? { ...l, current_stage: pendingStageUpdate.stage } : l
      )
    );

    setFollowUpDialogOpen(false);
    setFollowUpData({ follow_up_date: "", notes: "" });
    setPendingStageUpdate(null);
    setPreviousStage(null);

    // 👇 After updating stage and call_history
    const updatedFollowUps = await fetchFollowUps();
    setFollowUpsData(updatedFollowUps);
  };

  const handleFollowUpDialogClose = (open: boolean) => {
    if (!open && !followUpSubmitted && pendingStageUpdate && previousStage) {
      setLeads((prev) =>
        prev.map((l) =>
          l.id === pendingStageUpdate.leadId ? { ...l, current_stage: previousStage } : l
        )
      );
    }
    setFollowUpDialogOpen(open);
    setPendingStageUpdate(null);
    setPreviousStage(null);
  };

  // const handleSaleClosureSubmit = async () => {
  //   if (!selectedLead || !pendingStageUpdate) return;

  //   if (!saleData.payment_mode || !saleData.subscription_cycle) {
  //     alert("Please select payment mode and cycle");
  //     return;
  //   }
  //   setFollowUpsData((prev) =>
  //     prev.map((l) =>
  //       l.id === pendingStageUpdate.leadId ? { ...l, current_stage: pendingStageUpdate.stage } : l
  //     )
  //   );

  //   const { error: saleError } = await supabase.from("sales_closure").insert([{
  //     lead_id: selectedLead.business_id,
  //     sale_value: saleData.sale_value,
  //     lead_name: selectedLead.client_name,
  //     subscription_cycle: saleData.subscription_cycle,
  //     payment_mode: saleData.payment_mode,
  //     email: selectedLead.email,
  //   }]);

  //   if (saleError) {
  //     console.error("Error inserting sale closure:", saleError);
  //     alert(`Failed to save sale closure: ${saleError.message}`);
  //     return;
  //   }

  //   const { error: stageError } = await supabase
  //     .from("leads")
  //     .update({ current_stage: "Sale Done" })
  //     .eq("id", pendingStageUpdate.leadId);

  //   if (stageError) {
  //     console.error("Error updating stage:", stageError);
  //     return;
  //   }

  //   setSaleClosingDialogOpen(false);
  //   setPendingStageUpdate(null);
  //   setPreviousStage(null);

  //   setSaleData({
  //     sale_value: 0,
  //     subscription_cycle: "" as unknown as 15 | 30 | 60 | 90, // Reset to placeholder
  //     payment_mode: "" as unknown as SaleClosing["payment_mode"],
  //   });
  //   // After updating stage and call_history
  //   const updatedFollowUps = await fetchFollowUps();
  //   setFollowUpsData(updatedFollowUps);

  // };

  const handleSaleClosureSubmit = async () => {
  if (!selectedLead || !pendingStageUpdate) return;

setFollowUpsData(prev =>
   prev.map(f =>
     f.id === pendingStageUpdate.leadId ? { ...f, current_stage: "Sale Done" } : f
   )
 );

  const {
    base_value, subscription_cycle, payment_mode, closed_at,
    resume_value, portfolio_value, linkedin_value, github_value,
  } = saleData;

  if (!payment_mode || !subscription_cycle || !closed_at) {
    alert("Please fill all required fields."); return;
  }

  /* 💰 Final total already computed */
  const saleTotal = totalAmount;

  try {
    const { error: insertErr } = await supabase.from("sales_closure").insert({
      lead_id: selectedLead.business_id,
      lead_name: selectedLead.client_name,
      email: selectedLead.email,
      payment_mode,
      subscription_cycle,
      sale_value: saleTotal,
         closed_at: new Date(closed_at).toISOString(),
      resume_sale_value: resume_value || null,
      portfolio_sale_value: portfolio_value || null,
      linkedin_sale_value: linkedin_value || null,
      github_sale_value: github_value || null,
    });
    if (insertErr) throw insertErr;

    

    await supabase.from("leads")
      .update({ current_stage: "Sale Done" })
      .eq("id", pendingStageUpdate.leadId);

    // ✅ UI clean-up
    setSaleClosingDialogOpen(false);
    // setSaleData(prev => ({ ...prev, base_value: 0 }));
      setSaleData({
  base_value: 0,
     subscription_cycle: "" as unknown as 15|30|60|90,
     payment_mode: "" as unknown as SaleClosing["payment_mode"],
     closed_at: "",
     resume_value: 0,
     portfolio_value: 0,
     linkedin_value: 0,
     github_value: 0,
   });
    setPendingStageUpdate(null); setPreviousStage(null);
    const upd = await fetchFollowUps(); setFollowUpsData(upd);

  } catch (err: any) {
    console.error("Sale insert failed:", err.message); alert("Failed to save sale.");
  }
};


  const totalLeadsCount = leads.length;
  const prospectCount = leads.filter(l => l.current_stage === "Prospect").length;
  const dnpAndConvoCount = leads.filter(l =>
    l.current_stage === "DNP" || l.current_stage === "Conversation Done"
  ).length;
  const saleDoneCount = leads.filter(l => l.current_stage === "Sale Done").length;
  const othersCount = leads.filter(l =>
    !["Prospect", "DNP", "Conversation Done", "Sale Done"].includes(l.current_stage)
  ).length;

  const fetchCallHistory = async (leadId: string) => {
    const lead = leads.find((l) => l.id === leadId);
    if (!lead) return [];

    const { data, error } = await supabase
      .from("call_history")
      .select("current_stage, followup_date, notes")
      .eq("lead_id", lead.business_id)
      .order("followup_date", { ascending: false });

    if (error) {
      console.error("Error fetching call history:", error);
      return [];
    }

    const callHistoryData: CallHistory[] = data.map((record: any) => ({
      date: record.followup_date,
      stage: record.current_stage,
      notes: record.notes
    }));
    return callHistoryData;
  };


  // This function will go in your SalesPage component
// Add it after defining useState for all input fields used in the dialog
async function handleOnboardClientSubmit() {
  try {
    const confirmed = window.confirm("Are you sure you want to onboard this client?");
    if (!confirmed) return;

    // 1. Generate Lead ID
    const { data: idResult, error: idError } = await supabase.rpc('generate_custom_lead_id');
    if (idError || !idResult) {
      console.error("Failed to generate lead ID:", idError);
      return alert("Could not generate Lead ID. Try again.");
    }
    const newLeadId = idResult;

    // 2. Parse input values
    const baseValue = parseInt(subscriptionSaleValue || "0");
    const resume = parseInt(resumeValue || "0");
    const linkedin = parseInt(linkedinValue || "0");
    const github = parseInt(githubValue || "0");
    const portfolio = parseInt(portfolioValue || "0");
    const totalSale = baseValue + resume + linkedin + github + portfolio;

    const start = new Date(onboardingDate);
    const nextDueDate = new Date(start);
    const durationInDays = parseInt(subscriptionCycle || "0");
    nextDueDate.setDate(start.getDate() + durationInDays);

    const now = new Date().toISOString();

    // 3. Insert into leads table
    const { error: leadsInsertError } = await supabase.from("leads").insert({
      business_id: newLeadId,
      name: clientName,
      email: clientEmail,
      phone: contactNumber,
      city: city,
      created_at: now,
      source: subscriptionSource || "Onboarded Client",
      status: "Assigned",
    });
    if (leadsInsertError) throw leadsInsertError;

    // 4. Insert into sales_closure table
    const { error: salesInsertError } = await supabase.from("sales_closure").insert({
      lead_id: newLeadId,
      email: clientEmail,
      lead_name: clientName,
      payment_mode: paymentMode,
      subscription_cycle: durationInDays,
      sale_value: totalSale,
      closed_at: onboardingDate,
      onboarded_date: onboardingDate,
      finance_status: "Paid",
      resume_sale_value: resume,
      linkedin_sale_value: linkedin,
      github_sale_value: github,
      portfolio_sale_value: portfolio,

      // Optional defaulted fields (update if needed)
      associates_email: "", 
      associates_name: "",
      associates_tl_email: "",
      associates_tl_name: "",
      checkout_date: null,
      invoice_url: "",
    });
    if (salesInsertError) throw salesInsertError;

    // 5. Reset form
    setClientName("");
    setClientEmail("");
    setContactNumber("");
    setCity("");
    setOnboardingDate("");
    setSubscriptionCycle("");
    setSubscriptionSaleValue("");
    setPaymentMode("");
    setResumeValue("");
    setPortfolioValue("");
    setLinkedinValue("");
    setGithubValue("");

    setOnboardDialogOpen(false);
    alert("✅ Client onboarded successfully!");

  } catch (err: any) {
    console.error("❌ Error onboarding client:", err?.message || err);
    alert(`Failed to onboard client: ${err?.message || "Unknown error"}`);
  }
}

const handleUpdateNote = async (call: CallHistory) => {
  try {
    const { error } = await supabase
      .from("call_history")
      .update({ notes: editedNote })
      .eq("lead_id", selectedLead?.business_id)
      .eq("followup_date", call.date); // Assuming `followup_date` is the primary way to match

    if (error) throw error;

    // ✅ Refresh call history and exit edit mode
    const updated = await fetchCallHistory(selectedLead!.id);
    setSelectedLead((prev) => prev ? { ...prev, call_history: updated } : null);
    setEditingNote(false);
    alert("Note updated!");
  } catch (err) {
    console.error("Failed to update note:", err);
    alert("Failed to update note.");
  }
};


  return (
    <ProtectedRoute allowedRoles={["Sales","Sales Associate", "Super Admin"]}>

      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">Sales CRM</h1>

<div className="justify-end flex gap-2">
            <Button
    className="bg-green-600 hover:bg-green-700 text-white"
    onClick={() => setOnboardDialogOpen(true)}
  >
    Onboard New Client
  </Button>

            <Button onClick={async () => {
              const followUps = await fetchFollowUps();
              setFollowUpsData(followUps);
              setFollowUpsDialogOpen(true);
            }}>
              Follow Ups
            </Button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <Dialog open={followUpsDialogOpen} onOpenChange={setFollowUpsDialogOpen}>
              {/* <DialogContent className="max-w-7xl"> */}
              <DialogContent className="max-w-7xl" onPointerDownOutside={(e) => e.preventDefault()}>

                <DialogHeader>
                  <DialogTitle>Follow Ups – DNP / Conversation Done</DialogTitle>
                  <DialogDescription>Leads with scheduled follow-ups</DialogDescription>
                  <div className="flex justify-end mb-4">
                    <Select value={followUpsFilter} onValueChange={(val) => setFollowUpsFilter(val as "today" | "all")}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Filter by Date" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="today">Today</SelectItem>
                        <SelectItem value="all">All Dates</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                </DialogHeader>

                <div className="max-h-[70vh] overflow-y-auto overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>S.No</TableHead>
                        <TableHead>Business ID</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Assigned To</TableHead>
                        <TableHead>Stage</TableHead>
                        <TableHead>Follow-up Date</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {followUpsData.filter((item) => {
                        if (followUpsFilter === "all") return true;
                        if (!item.followup_date) return false;
                        const today = new Date().toISOString().split("T")[0];
                        return item.followup_date === today;
                      }).length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center text-muted-foreground py-6">
                            {followUpsFilter === "all"
                              ? "No follow-up data available."
                              : "There are no follow ups today."}
                          </TableCell>
                        </TableRow>
                      ) : (
                        followUpsData
                          .filter((item) => {
                            if (followUpsFilter === "all") return true;
                            if (!item.followup_date) return false;
                            const today = new Date().toISOString().split("T")[0];
                            return item.followup_date === today;
                          })
                          .map((item, idx) => (
                            <TableRow key={idx}>
                              <TableCell>{idx + 1}</TableCell>
                              <TableCell>{item.business_id}</TableCell>
                              <TableCell>{item.name}</TableCell>
                              <TableCell>{item.email}</TableCell>
                              <TableCell>{item.phone}</TableCell>
                              <TableCell>{item.assigned_to}</TableCell>
                              <TableCell>
                                <Select value={item.current_stage}
                                  onValueChange={(value: SalesStage) => {
                                    const selectedItem = followUpsData.find((f) => f.id === item.id);
                                    if (!selectedItem) return;
                                    handleStageUpdate(item.id, value);
                                  }}

                                >
                                  {/* <SelectTrigger className="w-40"><SelectValue /></SelectTrigger> */}
                                  <SelectTrigger
                                    className={`w-40 ${item.current_stage === "Sale Done"
                                      ? "pointer-events-none opacity-100 text-black bg-gray-100 border border-gray-300 cursor-not-allowed"
                                      : ""
                                      }`}
                                  >
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {salesStages
                                      .filter((stage) => item.current_stage === "Prospect" || stage !== "Prospect")
                                      .map((stage) => (
                                        <SelectItem key={stage} value={stage}>
                                          <Badge className={getStageColor(stage)}>{stage}</Badge>
                                        </SelectItem>
                                      ))}
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell>{item.followup_date}</TableCell>
                              <TableCell>{item.notes}</TableCell>
                            </TableRow>
                          ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </DialogContent>
            </Dialog>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">All leads</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalLeadsCount}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Prospects</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{prospectCount}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">DNP & Conversation Done</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dnpAndConvoCount}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Sales Done</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{saleDoneCount}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Others</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{othersCount}</div>
              </CardContent>
            </Card>


          </div>

          {/* Search & Filter */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
            <Select value={stageFilter} onValueChange={setStageFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by stage" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stages</SelectItem>
                {salesStages.map(stage => (<SelectItem key={stage} value={stage}>{stage}</SelectItem>))}
              </SelectContent>
            </Select>

<div className="relative w-full sm:w-[300px]">
  {/* 📅 Button Trigger */}
  <div
    onClick={() => setIsDateDropdownOpen(!isDateDropdownOpen)}
    className="bg-white border rounded-md shadow-sm px-4 py-2 cursor-pointer flex justify-between items-center"
  >
    <span>
      {startDate && endDate
        ? `📅 ${dayjs(startDate).format('DD MMM')} → ${dayjs(endDate).format('DD MMM')}`
        : "📅 Date Range"}
    </span>
    <span className="text-gray-400">▼</span>
  </div>

  {/* 📅 Dropdown Content */}
  {isDateDropdownOpen && (
    <div className="absolute z-50 mt-2 bg-white rounded-md shadow-lg p-4 w-[300px] border space-y-4">
      <div>
        <Label className="text-sm text-gray-600">Start Date</Label>
        <Input
          type="date"
          value={startDate ?? ""}
          onChange={(e) => setStartDate(e.target.value)}
        />
      </div>

      <div>
        <Label className="text-sm text-gray-600">End Date</Label>
        <Input
          type="date"
          value={endDate ?? ""}
          onChange={(e) => setEndDate(e.target.value)}
        />
      </div>

      <Button
        variant="ghost"
        className="text-red-500 text-sm p-0"
        onClick={() => {
          setStartDate(null);
          setEndDate(null);
          setIsDateDropdownOpen(false); // close on clear
        }}
      >
        ❌ Clear Filter
      </Button>
    </div>
  )}
</div>

          </div>

          <Card>
            <CardHeader><CardTitle>Sales Pipeline</CardTitle></CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>S.No</TableHead>
                      <TableHead>Business ID</TableHead>
                      <TableHead>Client Name</TableHead>
                      <TableHead className="w-32">Email</TableHead>
                     <TableHead>Phone</TableHead>
<TableHead className="w-40">Created At</TableHead>
<TableHead className="w-20">Lead age</TableHead>

<TableHead className="w-40">Assigned At</TableHead>
<TableHead>Assigned To</TableHead>

                      <TableHead>Stage</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLeads.map((lead, idx) => (
                      <TableRow key={lead.id}>
                        <TableCell>{idx + 1}</TableCell>
                        <TableCell>{lead.business_id}</TableCell>
                        <TableCell>{lead.client_name}</TableCell>
                        <TableCell className="w-32 truncate">{lead.email}</TableCell>
                       <TableCell>{lead.phone}</TableCell>
{/* <TableCell>{lead.created_at ? lead.created_at.slice(0, 10) : "N/A"}</TableCell> */}

<TableCell className="w-40">{lead.created_at ? dayjs(lead.created_at).format('DD MMM YYYY') : "N/A"}</TableCell>
<TableCell>  {lead.created_at ? `${dayjs().diff(dayjs(lead.created_at), 'day')} days` : "N/A"}
</TableCell>

{/* <TableCell>{lead.assigned_at ? lead.assigned_at.slice(0, 10) : "N/A"}</TableCell> */}
{/* <TableCell>{lead.assigned_at ? lead.assigned_at.slice(0, 10) : "N/A"}</TableCell> */}


<TableCell className="w-40">{lead.assigned_at ? dayjs(lead.assigned_at).format('DD MMM YYYY') : "N/A"}</TableCell>


<TableCell>{lead.assigned_to}</TableCell>

                        <TableCell>
                          <Select value={lead.current_stage} onValueChange={(value: SalesStage) => handleStageUpdate(lead.id, value)}
                          >
                            <SelectTrigger
                              className={`w-40 ${lead.current_stage === "Sale Done"
                                ? "pointer-events-none opacity-100 text-black bg-gray-100 border border-gray-300 cursor-not-allowed"
                                : ""
                                }`}
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {salesStages
                                .filter((stage) => lead.current_stage === "Prospect" || stage !== "Prospect")
                                .map((stage) => (
                                  <SelectItem key={stage} value={stage}>
                                    <Badge className={getStageColor(stage)}>{stage}</Badge>
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline" onClick={async () => {
                            const callHistory = await fetchCallHistory(lead.id);
                            setSelectedLead({ ...lead, call_history: callHistory });
                            setHistoryDialogOpen(true);
                          }}>
                            <Eye className="h-3 w-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* History Dialog */}
          <Dialog  open={historyDialogOpen} onOpenChange={setHistoryDialogOpen} >
            {/* <DialogContent className="max-w-2xl"> */}
            <DialogContent className="max-w-5xl"onPointerDownOutside={(e) => e.preventDefault()}>

              <DialogHeader>
                <DialogTitle>{selectedLead?.client_name} - Call History</DialogTitle>
                <DialogDescription>Complete call history</DialogDescription>
              </DialogHeader>

              {selectedLead && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label>Email</Label><p>{selectedLead.email}</p></div>
                    <div><Label>Phone</Label><p>{selectedLead.phone}</p></div>
                    <div><Label>Assigned To</Label><p>{selectedLead.assigned_to}</p></div>
                    <div><Label>Current Stage</Label><Badge className={getStageColor(selectedLead.current_stage)}>{selectedLead.current_stage}</Badge></div>
                  </div>

                  <div>
                    <Label>Call History</Label>
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {/* {selectedLead.call_history.map((call, index) => (
                        <div key={index} className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex justify-between items-center mb-1">
                            <Badge className={getStageColor(call.stage)}>{call.stage}</Badge>
                            <span className="text-xs text-gray-500">{call.date}</span>
                          </div>
                          <p className="text-sm text-gray-600">{call.notes}</p>
                        </div>
                      ))} */}
                      {selectedLead.call_history.map((call, index) => {
  const isLatest = index === 0;
  return (
    <div key={index} className="p-3 bg-gray-50 rounded-lg space-y-1">
      <div className="flex justify-between items-center mb-1">
        <Badge className={getStageColor(call.stage)}>{call.stage}</Badge>
        <span className="text-xs text-gray-500">{call.date}</span>
      </div>

      {/* ✏️ Editable note for latest only */}
      {isLatest && editingNote ? (
        <div className="space-y-2">
          <Textarea
            value={editedNote}
            onChange={(e) => setEditedNote(e.target.value)}
          />
          <Button size="sm" onClick={() => handleUpdateNote(call)}>
            Save
          </Button>
        </div>
      ) : (
        <div className="flex justify-between">
          <p className="text-sm text-gray-600">{call.notes}</p>
          {isLatest && (
            <Button
              size="icon"
              variant="ghost"
              className="h-5 w-5 text-lg text-gray-500"
              onClick={() => {
                setEditingNote(true);
                setEditedNote(call.notes);
              }}
            >
              Edit
            </Button>
          )}
        </div>
      )}
    </div>
  );
})}

                    </div>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          <Dialog open={followUpDialogOpen} onOpenChange={handleFollowUpDialogClose}>
            <DialogContent onPointerDownOutside={(e) => e.preventDefault()}>

              <DialogHeader><DialogTitle>Schedule Follow-up</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Follow-up Date</Label>
                  <Input type="date" value={followUpData.follow_up_date} onChange={(e) =>
                    setFollowUpData((prev) => ({ ...prev, follow_up_date: e.target.value }))} />
                </div>
                <div>
                  <Label>Notes</Label>
                  <Textarea placeholder="Add notes..." value={followUpData.notes} onChange={(e) =>
                    setFollowUpData((prev) => ({ ...prev, notes: e.target.value }))} />
                </div>
              </div>
              <DialogFooter><Button onClick={handleFollowUpSubmit}>Save Follow-up</Button></DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={onboardDialogOpen} onOpenChange={setOnboardDialogOpen}>
  <DialogContent className="max-w-5xl" onPointerDownOutside={(e) => e.preventDefault()}>
    <DialogHeader>
      <DialogTitle className="flex items-center gap-2">
        🧾 Onboard New Client
      </DialogTitle>
    </DialogHeader>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Client Details */}
      <div className="border rounded-md p-4 space-y-3">
        <Label className="font-semibold">Client Details <span className="text-red-500">*</span></Label>
        <Input
  placeholder="Client Full Name"
  value={clientName}
  onChange={(e) => setClientName(e.target.value)}
/>

<Input
  placeholder="Client Email"
  value={clientEmail}
  onChange={(e) => setClientEmail(e.target.value)}
/>

<Input
  placeholder="Contact Number with country code"
  value={contactNumber}
  onChange={(e) => setContactNumber(e.target.value)}
/>

<Input
  placeholder="City"
  value={city}
  onChange={(e) => setCity(e.target.value)}
/>

<Input
  type="date"
  value={onboardingDate}
  onChange={(e) => setOnboardingDate(e.target.value)}
  placeholder="dd-mm-yyyy"
/>


      </div>

      {/* Subscription & Payment Info */}
      <div className="border rounded-md p-4 space-y-3">
        <Label className="font-semibold">Subscription & Payment Info <span className="text-red-500">*</span></Label>
        <Select value={paymentMode} onValueChange={setPaymentMode}>
  <SelectTrigger>
    <SelectValue placeholder="Select Payment Mode" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="UPI">UPI</SelectItem>
    <SelectItem value="PayPal">PayPal</SelectItem>
    <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
    <SelectItem value="Credit/Debit Card">Credit/Debit Card</SelectItem>
  </SelectContent>
</Select>

<Select value={subscriptionCycle} onValueChange={setSubscriptionCycle}>
  <SelectTrigger>
    <SelectValue placeholder="Select Subscription Duration" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="15">15 Days</SelectItem>
    <SelectItem value="30">1 Month</SelectItem>
    <SelectItem value="60">2 Months</SelectItem>
    <SelectItem value="90">3 Months</SelectItem>
  </SelectContent>
</Select>

<Input
  placeholder="Subscription Sale Value ($)"
  value={subscriptionSaleValue}
  onChange={(e) => setSubscriptionSaleValue(e.target.value)}
/>

<Input
  placeholder="Auto Total (Subscription Only)"
  value={autoTotal}
  disabled
/>

<Select value={subscriptionSource} onValueChange={setSubscriptionSource}>
  <SelectTrigger>
    <SelectValue placeholder="Select Client Source" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="Referral">Referral</SelectItem>
    <SelectItem value="NEW">NEW</SelectItem>
  </SelectContent>
</Select>

      </div>
    </div>

    {/* Add-on Services */}
    <div className="border rounded-md p-4 mt-4 space-y-3">
      <Label className="font-semibold">Optional Add-On Services</Label>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
  placeholder="Resume Sale Value ($)"
  value={resumeValue}
  onChange={(e) => setResumeValue(e.target.value)}
/>

<Input
  placeholder="Portfolio Creation Value ($)"
  value={portfolioValue}
  onChange={(e) => setPortfolioValue(e.target.value)}
/>

<Input
  placeholder="LinkedIn Optimization Value ($)"
  value={linkedinValue}
  onChange={(e) => setLinkedinValue(e.target.value)}
/>

<Input
  placeholder="GitHub Optimization Value ($)"
  value={githubValue}
  onChange={(e) => setGithubValue(e.target.value)}
/>

      </div>
    </div>

    {/* Auto Calculated Section */}
    <div className="border rounded-md p-4 mt-4">
      <Label className="font-semibold">Auto Calculated</Label>
      <div className="flex justify-between mt-2">
        {/* <p>Total Sale Value: <strong>$0</strong></p>
        <p>Next Payment Due Date: <strong>-</strong></p> */}
       <p>Total Sale Value: <strong>${totalSale}</strong></p>
<p>Next Payment Due Date: <strong>{nextDueDate}</strong></p>

      </div>
    </div>

    {/* Submit */}
    <DialogFooter className="pt-4">
      <Button
  className="bg-green-600 text-white hover:bg-green-700"
  onClick={handleOnboardClientSubmit}
>
  Submit
</Button>

    </DialogFooter>
  </DialogContent>
</Dialog>


          <Dialog open={saleClosingDialogOpen} onOpenChange={(open) => {
            if (!open && pendingStageUpdate && previousStage) {


              setLeads(prev =>
                prev.map(l =>
                  l.id === pendingStageUpdate.leadId
                    ? { ...l, current_stage: previousStage }
                    : l
                )
              );
              setFollowUpsData(prev =>
                prev.map(l =>
                  l.id === pendingStageUpdate.leadId
                    ? { ...l, current_stage: previousStage }
                    : l
                )
              );

              setPendingStageUpdate(null);
              setPreviousStage(null);
            }
            setSaleClosingDialogOpen(open);
          }}>

            <DialogContent onPointerDownOutside={(e) => e.preventDefault()}>
              <DialogHeader><DialogTitle>Close Sale</DialogTitle></DialogHeader>
              {/* <div className="space-y-4">
                <div><Label>Sale Value</Label>
                  <Input type="number" value={saleData.sale_value}
                    onChange={(e) => setSaleData(prev => ({ ...prev, sale_value: Number(e.target.value) }))} />
                </div>

                <div><Label>Subscription Cycle</Label>
                  <Select value={saleData.subscription_cycle.toString()}
                    onValueChange={(value) => setSaleData(prev => ({ ...prev, subscription_cycle: Number(value) as 15 | 30 | 60 | 90 }))}>
                    <SelectTrigger><SelectValue placeholder="Select cycle" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 Days</SelectItem>
                      <SelectItem value="30">1 month</SelectItem>
                      <SelectItem value="60">2 month</SelectItem>
                      <SelectItem value="90">3 month</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div><Label>Payment Mode</Label>
                  <Select value={saleData.payment_mode}
                    onValueChange={(value) => setSaleData(prev => ({ ...prev, payment_mode: value as SaleClosing["payment_mode"] }))}>
                    <SelectTrigger><SelectValue placeholder="Select payment mode" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UPI">UPI</SelectItem>
                      <SelectItem value="PayPal">PayPal</SelectItem>
                      <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                      <SelectItem value="Stripe">Stripe</SelectItem>
                      <SelectItem value="Credit/Debit Card">Credit/Debit Card</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>

                    </SelectContent>
                  </Select>
                </div>
              </div> */}

<div className="space-y-4">

  <div>
    <Label>Sale Closed On</Label>
    <Input
      type="date"
      value={saleData.closed_at}
      onChange={e => setSaleData(p => ({ ...p, closed_at: e.target.value }))}
      required
    />
  </div>

  <div>
    <Label>Base Sale Value (1 month)</Label>
    <Input
      type="number"
      value={saleData.base_value}
      onChange={e => setSaleData(p => ({ ...p, base_value: Number(e.target.value) }))}
      required
    />
  </div>

  <div>
    <Label>Subscription Cycle</Label>
    <Select
      value={saleData.subscription_cycle.toString()}
      onValueChange={v => setSaleData(p => ({ ...p, subscription_cycle: Number(v) as 15|30|60|90 }))}
    >
      <SelectTrigger><SelectValue placeholder="Choose" /></SelectTrigger>
      <SelectContent>
        <SelectItem value="15">15 days</SelectItem>
        <SelectItem value="30">1 month</SelectItem>
        <SelectItem value="60">2 months</SelectItem>
        <SelectItem value="90">3 months</SelectItem>
      </SelectContent>
    </Select>
  </div>

  <div className="grid grid-cols-2 gap-4">
    <div>
      <Label>Resume Enhancement ($)</Label>
      <Input type="number" value={saleData.resume_value}
        onChange={e => setSaleData(p => ({ ...p, resume_value: Number(e.target.value) }))}/>
    </div>
    <div>
      <Label>Portfolio Service ($)</Label>
      <Input type="number" value={saleData.portfolio_value}
        onChange={e => setSaleData(p => ({ ...p, portfolio_value: Number(e.target.value) }))}/>
    </div>
    <div>
      <Label>LinkedIn Optimization ($)</Label>
      <Input type="number" value={saleData.linkedin_value}
        onChange={e => setSaleData(p => ({ ...p, linkedin_value: Number(e.target.value) }))}/>
    </div>
    <div>
      <Label>GitHub Optimization ($)</Label>
      <Input type="number" value={saleData.github_value}
        onChange={e => setSaleData(p => ({ ...p, github_value: Number(e.target.value) }))}/>
    </div>
  </div>

  <div className="p-3 bg-gray-50 rounded-md text-sm">
    <p><strong>Total Amount →</strong> ${totalAmount.toLocaleString()}</p>
    {subscriptionEndsOn && (
      <p>
        <strong>Subscription ends:</strong> {subscriptionEndsOn}&nbsp;(
        {saleData.subscription_cycle} days)
      </p>
    )}
  </div>

  <div>
    <Label>Payment Mode</Label>
    <Select value={saleData.payment_mode}
      onValueChange={v => setSaleData(p => ({ ...p, payment_mode: v as SaleClosing["payment_mode"] }))}>
      <SelectTrigger><SelectValue placeholder="Pick one" /></SelectTrigger>
      <SelectContent>
        <SelectItem value="UPI">UPI</SelectItem>
        <SelectItem value="PayPal">PayPal</SelectItem>
        <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
        <SelectItem value="Stripe">Stripe</SelectItem>
        <SelectItem value="Credit/Debit Card">Credit/Debit Card</SelectItem>
        <SelectItem value="Other">Other</SelectItem>
      </SelectContent>
    </Select>
  </div>
</div>

              <DialogFooter><Button onClick={handleSaleClosureSubmit}>Save</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </DashboardLayout>


    </ProtectedRoute>
  );
}


