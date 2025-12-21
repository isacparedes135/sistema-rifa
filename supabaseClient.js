
// Initialize Supabase Client
// We need to wait for the CDN script to load before using 'supabase' global
// Or we can assume it's loaded if placed in head or body correctly.

// REPLACE THIS WITH YOUR ANON KEY
const SUPABASE_URL = 'https://tgdbraiyrlnturphkoev.supabase.co';
const SUPABASE_KEY = 'sb_publishable_z48Iy3Rf_xBvhKv4uQYGVA_PSmYKwx7';

// Create a single instance
const _supabase = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;

// Helper wrapper to export it (simulation for modules) or just attach to window
window.sbClient = _supabase;
