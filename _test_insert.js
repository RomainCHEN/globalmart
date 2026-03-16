import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseAdmin = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testOptions() {
    const { error } = await supabaseAdmin.from('cart_items').insert({
        user_id: '00000000-0000-0000-0000-000000000000',
        product_id: '00000000-0000-0000-0000-000000000000',
        quantity: 1,
        options: { Size: 'M', Color: 'Red' }
    });
    console.log("Insert with options error:", error?.message || 'Success (or relation constraint error)');
}

testOptions();
