import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Missing Supabase configuration");
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Parse URL parameters for filtering and pagination
    const url = new URL(req.url);
    const searchParams = url.searchParams;
    
    const category = searchParams.get('category');
    const gender = searchParams.get('gender');
    const accent = searchParams.get('accent');
    const age = searchParams.get('age');
    const useCase = searchParams.get('use_case');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const sortBy = searchParams.get('sort_by') || 'name';
    const sortOrder = searchParams.get('sort_order') || 'asc';

    // Build query
    let query = supabase
      .from('elevenlabs_voices')
      .select('*');

    // Apply filters
    if (category) {
      query = query.eq('category', category);
    }
    
    if (gender) {
      query = query.eq('gender', gender);
    }
    
    if (accent) {
      query = query.eq('accent', accent);
    }
    
    if (age) {
      query = query.eq('age', age);
    }
    
    if (useCase) {
      query = query.eq('use_case', useCase);
    }
    
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Apply sorting
    const ascending = sortOrder === 'asc';
    query = query.order(sortBy, { ascending });

    // Apply pagination
    if (limit > 0) {
      query = query.range(offset, offset + limit - 1);
    }

    // Execute query
    const { data: voices, error, count } = await query;

    if (error) {
      throw new Error(`Database query failed: ${error.message}`);
    }

    // Get total count for pagination info
    const { count: totalCount, error: countError } = await supabase
      .from('elevenlabs_voices')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('Error getting total count:', countError);
    }

    // Get unique filter values for frontend
    const { data: categories } = await supabase
      .from('elevenlabs_voices')
      .select('category')
      .not('category', 'is', null);

    const { data: genders } = await supabase
      .from('elevenlabs_voices')
      .select('gender')
      .not('gender', 'is', null);

    const { data: accents } = await supabase
      .from('elevenlabs_voices')
      .select('accent')
      .not('accent', 'is', null);

    const { data: ages } = await supabase
      .from('elevenlabs_voices')
      .select('age')
      .not('age', 'is', null);

    const { data: useCases } = await supabase
      .from('elevenlabs_voices')
      .select('use_case')
      .not('use_case', 'is', null);

    // Extract unique values
    const uniqueCategories = [...new Set(categories?.map(c => c.category).filter(Boolean))];
    const uniqueGenders = [...new Set(genders?.map(g => g.gender).filter(Boolean))];
    const uniqueAccents = [...new Set(accents?.map(a => a.accent).filter(Boolean))];
    const uniqueAges = [...new Set(ages?.map(a => a.age).filter(Boolean))];
    const uniqueUseCases = [...new Set(useCases?.map(u => u.use_case).filter(Boolean))];

    const response = {
      voices: voices || [],
      pagination: {
        total: totalCount || 0,
        limit,
        offset,
        hasMore: (voices?.length || 0) === limit
      },
      filters: {
        categories: uniqueCategories.sort(),
        genders: uniqueGenders.sort(),
        accents: uniqueAccents.sort(),
        ages: uniqueAges.sort(),
        useCases: uniqueUseCases.sort()
      },
      meta: {
        count: voices?.length || 0,
        query_params: {
          category,
          gender,
          accent,
          age,
          use_case: useCase,
          search,
          limit,
          offset,
          sort_by: sortBy,
          sort_order: sortOrder
        }
      }
    };

    return new Response(
      JSON.stringify(response),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );

  } catch (error) {
    console.error('Error in get-voices:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
        details: error instanceof Error ? error.toString() : undefined
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});