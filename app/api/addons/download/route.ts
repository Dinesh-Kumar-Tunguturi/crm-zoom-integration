import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';


const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);


const ADDON_CONFIG = {
  badge: { column: 'badge_value', label: 'Badge' },
  job_board: { column: 'job_board_value', label: 'Job Board' },
  resume: { column: 'resume_sale_value', label: 'Resume' },
  portfolio: { column: 'portfolio_sale_value', label: 'Portfolio' },
  linkedin: { column: 'linkedin_sale_value', label: 'LinkedIn' },
  github: { column: 'github_sale_value', label: 'GitHub' },
  courses: { column: 'courses_sale_value', label: 'Courses' },
  custom: { column: 'custom_sale_value', label: 'Custom' },
  digital_resume: { column: 'digital_resume_sale_value', label: 'Digital Resume' },
} as const;


type AddonType = keyof typeof ADDON_CONFIG;


export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') as AddonType;
    const search = searchParams.get('search') || '';


    if (!type || !ADDON_CONFIG[type]) {
      return NextResponse.json(
        { error: 'Invalid addon type' },
        { status: 400 }
      );
    }


    const { column, label } = ADDON_CONFIG[type];


    // Fetch all records for the selected addon
    let query = supabase
      .from('sales_closure')
      .select(`
        lead_id,
        lead_name,
        email,
        company_application_email,
        phone_number,
        sale_value,
        application_sale_value,
        closed_at,
        onboarded_date,
        ${column}
      `)
      .gt(column, 0)
      .not(column, 'is', null)
      .order('closed_at', { ascending: false });


    // Apply search if provided
    if (search.trim() !== '') {
      const searchTerm = `%${search}%`;
      query = query.or(
        `lead_id.ilike.${searchTerm},lead_name.ilike.${searchTerm},email.ilike.${searchTerm},company_application_email.ilike.${searchTerm},phone_number.ilike.${searchTerm}`
      );
    }


    const { data: records, error } = await query;


    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }


    // Convert to CSV
    const headers = [
      'Lead ID',
      'Lead Name',
      'Email',
      'Company Application Email',
      'Phone Number',
      'Sale Value',
      'Application Sale Value',
      `${label} Value`,
      'Closed At',
      'Onboarded Date',
    ];


    const csvRows = [
      headers.join(','),
      ...(records || []).map(record => [
        `"${record.lead_id || ''}"`,
        `"${record.lead_name || ''}"`,
        `"${record.email || ''}"`,
        `"${record.company_application_email || ''}"`,
        `"${record.phone_number || ''}"`,
        record.sale_value || 0,
        record.application_sale_value || 0,
        record[column as keyof typeof record] || 0,
        `"${record.closed_at ? new Date(record.closed_at).toISOString() : ''}"`,
        `"${record.onboarded_date ? new Date(record.onboarded_date).toISOString() : ''}"`,
      ].join(','))
    ];


    const csvString = csvRows.join('\n');


    // Return as downloadable file
    return new NextResponse(csvString, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${label.toLowerCase().replace(/\s+/g, '_')}_addons_${new Date().toISOString().split('T')[0]}${search ? '_search' : ''}.csv"`,
      },
    });
  } catch (error) {
    console.error('Error downloading CSV:', error);
    return NextResponse.json(
      { error: 'Failed to generate CSV' },
      { status: 500 }
    );
  }
}

