
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
  
  {/* ✅ 1/3 WIDTH: Lead Profile */}
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

  {/* ✅ 2/3 WIDTH: Call History */}
  <Card className="h-full col-span-2">
    <CardHeader>
      <CardTitle className="text-2xl font-bold">Call History</CardTitle>
    </CardHeader>
    <CardContent className="text-gray-500 italic">
      Call history will appear here once integrated.
    </CardContent>
  </Card>

</div>
    </div>
  );
}
