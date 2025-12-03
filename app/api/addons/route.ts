import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';


const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);


const ADDON_COLUMNS = {
  badge: 'badge_value',
  job_board: 'job_board_value',
  resume: 'resume_sale_value',
  portfolio: 'portfolio_sale_value',
  linkedin: 'linkedin_sale_value',
  github: 'github_sale_value',
  courses: 'courses_sale_value',
  custom: 'custom_sale_value',
  digital_resume: 'digital_resume_sale_value',
};


export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') as keyof typeof ADDON_COLUMNS;
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '30');
    const search = searchParams.get('search') || '';


    if (!type || !ADDON_COLUMNS[type]) {
      return NextResponse.json(
        { error: 'Invalid addon type' },
        { status: 400 }
      );
    }


    const column = ADDON_COLUMNS[type];
    const offset = (page - 1) * pageSize;


    // Create base query
    let query = supabase
      .from('sales_closure')
      .select('*', { count: 'exact' })
      .gt(column, 0)
      .not(column, 'is', null);


    // Apply search if provided
    if (search.trim() !== '') {
      const searchTerm = `%${search}%`;
      query = query.or(
        `lead_id.ilike.${searchTerm},lead_name.ilike.${searchTerm},email.ilike.${searchTerm},company_application_email.ilike.${searchTerm},phone_number.ilike.${searchTerm}`
      );
    }


    // Get total count
    const { count, error: countError } = await query;


    if (countError) throw countError;


    const totalRecords = count || 0;
    const totalPages = Math.ceil(totalRecords / pageSize);


    // Fetch paginated records
    let dataQuery = supabase
      .from('sales_closure')
      .select(`
        id,
        lead_id,
        lead_name,
        email,
        company_application_email,
        phone_number,
        sale_value,
        application_sale_value,
        closed_at,
        onboarded_date,
        ${column},
        resume_sale_value,
        portfolio_sale_value,
        linkedin_sale_value,
        github_sale_value,
        courses_sale_value,
        custom_sale_value,
        badge_value,
        job_board_value,
        digital_resume_sale_value
      `)
      .gt(column, 0)
      .not(column, 'is', null)
      .order('closed_at', { ascending: false })
      .range(offset, offset + pageSize - 1);


    // Apply search to data query as well
    if (search.trim() !== '') {
      const searchTerm = `%${search}%`;
      dataQuery = dataQuery.or(
        `lead_id.ilike.${searchTerm},lead_name.ilike.${searchTerm},email.ilike.${searchTerm},company_application_email.ilike.${searchTerm},phone_number.ilike.${searchTerm}`
      );
    }


    const { data: records, error: recordsError } = await dataQuery;


    if (recordsError) throw recordsError;


    return NextResponse.json({
      records: records || [],
      total: totalRecords,
      totalPages,
      currentPage: page,
      pageSize,
    });
  } catch (error) {
    console.error('Error fetching addon records:', error);
    return NextResponse.json(
      { error: 'Failed to fetch records' },
      { status: 500 }
    );
  }
}

