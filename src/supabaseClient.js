import { createClient } from '@supabase/supabase-js';

let supabaseUrl = localStorage.getItem('supabase_url') || '';
let supabaseAnonKey = localStorage.getItem('supabase_anon_key') || '';

export let supabase = null;

if (supabaseUrl && supabaseAnonKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
  } catch (error) {
    console.error('Failed to initialize Supabase client:', error);
  }
}

export function updateSupabaseConfig(url, key) {
  if (!url || !key) {
    throw new Error('Supabase URL and Anon Key are required');
  }
  
  // Test if we can initialize client (validates URL format)
  const client = createClient(url, key);
  
  localStorage.setItem('supabase_url', url);
  localStorage.setItem('supabase_anon_key', key);
  
  supabaseUrl = url;
  supabaseAnonKey = key;
  supabase = client;
  
  return supabase;
}

export function getSupabaseConfig() {
  return {
    url: supabaseUrl,
    key: supabaseAnonKey
  };
}

export function clearSupabaseConfig() {
  localStorage.removeItem('supabase_url');
  localStorage.removeItem('supabase_anon_key');
  supabaseUrl = '';
  supabaseAnonKey = '';
  supabase = null;
}
