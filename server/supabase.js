import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseServiceKey) {
    console.warn('WARNING: SUPABASE_SERVICE_ROLE_KEY is not defined. Server operations might fail due to RLS.');
} else {
    console.log('SUPABASE_SERVICE_ROLE_KEY is defined.');
}

// Admin client for server operations (bypasses RLS)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

// Create a client scoped to a user's JWT for RLS
export function createUserClient(accessToken) {
    return createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: `Bearer ${accessToken}` } }
    });
}
