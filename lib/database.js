// lib/database.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const getEnvironmentEmail = (email) => {
  const env = process.env.ENVIRONMENT || 'development';
  return env === 'staging' ? `staging_${email}` : email;
};

export const getUserByEmail = async (email) => {
  const prefixedEmail = getEnvironmentEmail(email);
  
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', prefixedEmail)
    .single();
    
  return { data, error };
};

export const createUser = async (email) => {
  const prefixedEmail = getEnvironmentEmail(email);
  
  const { data, error } = await supabase
    .from('users')
    .insert([{ email: prefixedEmail }])
    .select()
    .single();
    
  return { data, error };
};

export { supabase };
