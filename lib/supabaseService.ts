

// interface Lead {
//   id: string;
//   name: string;
//   phone: string;
//   email: string;
//   city: string;
//   source: string;
//   // Add other fields as needed
// }

// import { createClient } from '@supabase/supabase-js';

// const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// if (!supabaseUrl || !supabaseServiceRoleKey) {
//   throw new Error('Missing Supabase config: check .env.local');
// }

// export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);


// // Type matching Supabase leads table insert
// interface LeadInsert {
//   name: string;
//   phone: string;
//   email: string;
//   city: string;
//   source: string;
//   status: string;
//   assigned_to: string;
// }

// // Bulk insert leads into Supabase leads table
// export async function bulkAssignToSupabase(
//   selectedLeads: string[],
//   assignedTo: string,
//   allLeads: Lead[]
// ): Promise<void> {
//   const leadsToInsert: LeadInsert[] = selectedLeads.map((leadId) => {
//     const leadData = allLeads.find((l) => l.id === leadId);
//     if (!leadData) throw new Error(`Lead data not found for ID: ${leadId}`);

//     return {
//       name: leadData.name,
//       phone: leadData.phone,
//       email: leadData.email,
//       city: leadData.city,
//       source: leadData.source,
//       status: 'Assigned',
//       assigned_to: assignedTo
//     };
//   });
//   console.log('Payload to be inserted:', JSON.stringify(leadsToInsert, null, 2));


//   const { data, error } = await supabaseAdmin
//     .from('leads')
//     .insert(leadsToInsert);

//   if (error) {
//     console.error('Error inserting leads into Supabase:', error?.message, error?.details, error?.hint);

//     throw error;
//   } else {
//     console.log('Leads inserted successfully into Supabase:', data);
//   }
// }







interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string;
  city: string;
  source: string;
  // Add other fields as needed
}

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Missing Supabase config: check .env.local');
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);


// Type matching Supabase leads table insert
interface LeadInsert {
  name: string;
  phone: string;
  email: string;
  city: string;
  source: string;
  status: string;
  assigned_to: string;
}

// Bulk insert leads into Supabase leads table
export async function bulkAssignToSupabase(
  selectedLeads: string[],
  assignedTo: string,
  allLeads: Lead[]
): Promise<void> {
  const leadsToInsert: LeadInsert[] = selectedLeads.map((leadId) => {
    const leadData = allLeads.find((l) => l.id === leadId);
    if (!leadData) throw new Error(`Lead data not found for ID: ${leadId}`);

    return {
      name: leadData.name,
      phone: leadData.phone,
      email: leadData.email,
      city: leadData.city,
      source: leadData.source,
      status: 'Assigned',
      assigned_to: assignedTo
    };
  });
  console.log('Payload to be inserted:', JSON.stringify(leadsToInsert, null, 2));


  const { data, error } = await supabaseAdmin
    .from('leads')
    .insert(leadsToInsert);

  if (error) {
    console.error('Error inserting leads into Supabase:', error?.message, error?.details, error?.hint);

    throw error;
  } else {
    console.log('Leads inserted successfully into Supabase:', data);
  }
}


