// Cliente único do Supabase (usa só a chave pública definida em config.js)
const sb = supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
