import { createClient } from '@supabase/supabase-js';

// Reemplaza estos valores con los de tu proyecto de Supabase
const supabaseUrl = 'https://rrogjmtnkweerqossikq.supabase.co/';
const supabaseAnonKey = 'sb_publishable_b6b8In97R8wgIZKH1MpPmg_4Jz1CfLf';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);