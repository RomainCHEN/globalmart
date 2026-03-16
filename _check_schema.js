import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseAdmin = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSchema() {
    // We can't easily get schema, but we can try to update a non-existent row with an 'options' column
    // or just fetch one row and see if 'options' is selected if we do select('*')
    const { data: cartData, error: cartError } = await supabaseAdmin.from('cart_items').select('*').limit(1);
    console.log("Cart Items Columns:", cartData && cartData.length > 0 ? Object.keys(cartData[0]) : "No rows");
    
    // Also check order_items
    const { data: orderData } = await supabaseAdmin.from('order_items').select('*').limit(1);
    console.log("Order Items Columns:", orderData && orderData.length > 0 ? Object.keys(orderData[0]) : "No rows");
}

checkSchema();
