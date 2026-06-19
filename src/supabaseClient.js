import { createClient } from '@supabase/supabase-js';

// Default pre-configured database settings for your team
const DEFAULT_URL = 'https://anfpszghwoizjwsubijg.supabase.co';
const DEFAULT_KEY = 'sb_publishable_dQB_5jOAins25VvDvKV9qw_flppCPMj';

let supabaseUrl = localStorage.getItem('supabase_url') || DEFAULT_URL;
let supabaseAnonKey = localStorage.getItem('supabase_anon_key') || DEFAULT_KEY;

export let supabase = null;

// Strip any trailing slashes or REST paths
const getCleanUrl = (url) => {
  if (!url) return '';
  return url.trim().replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
};

if (supabaseUrl && supabaseAnonKey) {
  try {
    const cleanUrl = getCleanUrl(supabaseUrl);
    supabase = createClient(cleanUrl, supabaseAnonKey.trim());
  } catch (error) {
    console.error('Failed to initialize Supabase client:', error);
  }
}

export function updateSupabaseConfig(url, key) {
  if (!url || !key) {
    throw new Error('Supabase URL and Anon Key are required');
  }
  
  const cleanUrl = getCleanUrl(url);
  const cleanKey = key.trim();
  
  // Test if we can initialize client (validates URL format)
  const client = createClient(cleanUrl, cleanKey);
  
  localStorage.setItem('supabase_url', cleanUrl);
  localStorage.setItem('supabase_anon_key', cleanKey);
  
  supabaseUrl = cleanUrl;
  supabaseAnonKey = cleanKey;
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
