
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/utils/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

interface Lead {
  id: string;
  business_id: string;
  name: string;
  phone: string;
  email: string;
  city: string;
  source: string;
  status: string;
  created_at: string;
  assigned_to?: string;
  paid_amount?: number;
}

export default function LeadProfilePage() {
  const { business_id } = useParams();
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [saleHistory, setSaleHistory] = useState<any[]>([]);
  const [callHistory, setCallHistory] = useState<any[]>([]);



  useEffect(() => {
    const fetchLead = async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .eq("business_id", business_id)
        .single();

      if (error) {
        console.error("Error fetching lead:", error.message);
        setLead(null);
      } else {
        setLead(data);
      }

      setLoading(false);
    };

    const fetchSalesHistory = async () => {
  const { data, error } = await supabase
    .from("sales_closure")
    .select("*")
    .eq("lead_id", business_id)
    .order("onboarded_date", { ascending: false });

  if (error) {
    console.error("Error fetching sales history:", error.message);
    return;
  }

  setSaleHistory(data);
};

const fetchCallHistory = async () => {
  const { data, error } = await supabase
    .from("call_history")
    .select("*")
    .eq("lead_id", business_id)
    .order("followup_date", { ascending: false });

  if (error) {
    console.error("Error fetching call history:", error.message);
    return;
  }

  setCallHistory(data);
};

if (business_id) {
  fetchLead();
  fetchSalesHistory();
  fetchCallHistory(); // ✅
}


if (business_id) {
  fetchLead();
  fetchSalesHistory(); // 🔥
}

    if (business_id) fetchLead();
  }, [business_id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="animate-spin w-8 h-8 text-gray-600" />
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-600">
        No lead found with ID: {business_id}
      </div>
    );
  }
  

  return (
    <div className="min-h-screen h-screen w-full bg-gray-50 p-6">
      {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-50">
  
  <Card className="h-full col-span-1">
    <CardHeader>
      <CardTitle className="text-2xl font-bold">Lead Profile</CardTitle>
    </CardHeader>
    <CardContent className="space-y-4 text-sm text-gray-800">
      <div><strong>Business ID:</strong> {lead.business_id}</div>
      <div><strong>Name:</strong> {lead.name}</div>
      <div><strong>Phone:</strong> {lead.phone}</div>
      <div><strong>Email:</strong> {lead.email}</div>
      <div><strong>City:</strong> {lead.city}</div>
      <div><strong>Source:</strong> <Badge>{lead.source}</Badge></div>
      <div><strong>Status:</strong> <Badge>{lead.status}</Badge></div>
      <div><strong>Created At:</strong> {new Date(lead.created_at).toLocaleString()}</div>
      <div><strong>Salesperson:</strong> {lead.assigned_to || "Not Assigned"}</div>
      <div><strong>Paid Amount:</strong> {lead.paid_amount ? `₹${lead.paid_amount}` : "Not Paid"}</div>
    </CardContent>
  </Card>

 
  <Card className="h-full col-span-2">
    <CardHeader>
      <CardTitle className="text-2xl font-bold">Call History</CardTitle>
    </CardHeader>
    <CardContent className="text-gray-500 italic">
      Call history will appear here once integrated.
    </CardContent>
  </Card>

</div> */}

<div className="grid grid-cols-1 md:grid-cols-3 grid-rows-2 gap-6 h-full">
  {/* 1️⃣ Lead Profile (Left, Top) */}
  <Card className="h-full col-span-1 row-span-1">
    <CardHeader>
      <CardTitle className="text-2xl font-bold">Lead Profile</CardTitle>
    </CardHeader>
    <CardContent className="space-y-4 text-sm text-gray-800">
      <div><strong>Business ID:</strong> {lead.business_id}</div>
      <div><strong>Name:</strong> {lead.name}</div>
      <div><strong>Phone:</strong> {lead.phone}</div>
      <div><strong>Email:</strong> {lead.email}</div>
      <div><strong>City:</strong> {lead.city}</div>
      <div><strong>Source:</strong> <Badge>{lead.source}</Badge></div>
      <div><strong>Status:</strong> <Badge>{lead.status}</Badge></div>
      <div><strong>Created At:</strong> {new Date(lead.created_at).toLocaleString()}</div>
      <div><strong>Salesperson:</strong> {lead.assigned_to || "Not Assigned"}</div>
    </CardContent>
  </Card>

  {/* 2️⃣ Call History (Right, Top) */}
  <Card className="h-full col-span-2 row-span-1">
  <CardHeader>
    <CardTitle className="text-2xl font-bold">Call History</CardTitle>
  </CardHeader>
  <CardContent>
    {callHistory.length === 0 ? (
      <div className="text-gray-500 italic">No call records for this client.</div>
    ) : (
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm border border-gray-300">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="p-2 border">Follow-up Date</th>
              <th className="p-2 border">Stage</th>
              <th className="p-2 border">Notes</th>
              <th className="p-2 border">Assigned To</th>
              <th className="p-2 border">Phone</th>
              <th className="p-2 border">Email</th>
            </tr>
          </thead>
          <tbody>
            {callHistory.map((call, index) => (
              <tr key={index} className="border-t hover:bg-gray-50">
                <td className="p-2 border">
                  {call.followup_date
                    ? new Date(call.followup_date).toLocaleDateString()
                    : "-"}
                </td>
                <td className="p-2 border">{call.current_stage || "-"}</td>
                <td className="p-2 border">{call.notes || "-"}</td>
                <td className="p-2 border">{call.assigned_to || "-"}</td>
                <td className="p-2 border">{call.phone || "-"}</td>
                <td className="p-2 border">{call.email || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </CardContent>
</Card>


  {/* 3️⃣ Client Feedback (Left, Bottom) */}
  <Card className="h-full col-span-1 row-span-1">
    <CardHeader>
      <CardTitle className="text-2xl font-bold">Client Feedback</CardTitle>
    </CardHeader>
    <CardContent className="text-gray-500 italic">
      Feedback section will appear here.
    </CardContent>
  </Card>

  {/* 4️⃣ Sale Done History (Right, Bottom) */}
  <Card className="h-full col-span-2 row-span-1">
  <CardHeader>
    <CardTitle className="text-2xl font-bold">Sale Done History</CardTitle>
  </CardHeader>
  <CardContent>
    {saleHistory.length === 0 ? (
      <div className="text-gray-500 italic">No sales done for this client.</div>
    ) : (
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm border border-gray-300">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="p-2 border">Name</th>
              <th className="p-2 border">Sale Value</th>
              <th className="p-2 border">Payment mode</th>
              <th className="p-2 border">Subscription Cycle</th>
              <th className="p-2 border">Assigned To</th>
              <th className="p-2 border">Stage</th>
              <th className="p-2 border">Sale Done At</th>
              <th className="p-2 border">Onboarded At</th>
            </tr>
          </thead>
          <tbody>
            {saleHistory.map((sale, index) => (
              <tr key={index} className="border-t hover:bg-gray-50">
                <td className="p-2 border">{sale.lead_name || "-"}</td>
                <td className="p-2 border">₹{sale.sale_value}</td>
                <td className="p-2 border">{sale.payment_mode}</td>
                <td className="p-2 border">{sale.subscription_cycle} days</td>
                <td className="p-2 border">{sale.assigned_to || "Not Assigned"}</td>
                <td className="p-2 border">{sale.finance_status}</td>
                <td className="p-2 border">{sale.closed_at ? new Date(sale.closed_at).toLocaleString() : "-"}</td>
                <td className="p-2 border">{sale.onboarded_date ? new Date(sale.onboarded_date).toLocaleDateString() : "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </CardContent>
</Card>

</div>

    </div>



  );
}
