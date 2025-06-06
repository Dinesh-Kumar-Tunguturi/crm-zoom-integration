// app/api/assign-leads/route.ts
import { supabaseAdmin } from '@/lib/supabaseService';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { selectedLeads, assignedTo, allLeads } = body;

    const leadsToInsert = selectedLeads.map((leadId: string) => {
      const leadData = allLeads.find((l: any) => l.id === leadId);
      if (!leadData) throw new Error(`Lead not found: ${leadId}`);

      return {
        name: leadData.name,
        phone: leadData.phone,
        email: leadData.email,
        city: leadData.city,
        source: leadData.source,
        status: 'Assigned',
        assigned_to: assignedTo,
      };
    });

    const { data, error } = await supabaseAdmin.from('leads').insert(leadsToInsert);

    if (error) {
      console.error('Supabase insert error:', error.message);
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    return new Response(JSON.stringify({ message: 'Inserted successfully', data }), { status: 200 });
  } catch (err: any) {
    console.error('Unexpected error:', err);
    return new Response(JSON.stringify({ error: err.message || 'Unknown error' }), { status: 500 });
  }
}
