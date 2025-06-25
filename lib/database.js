// lib/database.js - Clean version
import { supabase } from './supabase';

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
