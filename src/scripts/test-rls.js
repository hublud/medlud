const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, anonKey);

async function run() {
    console.log('Logging in as doctor...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: 'taxnigeria1@gmail.com',
        password: 'FranClii2024!'
    });

    if (authError) {
        console.error('Login failed:', authError);
        return;
    }
    
    const user = authData.user;
    console.log('Logged in doctor ID:', user.id);

    console.log('Querying consultations table...');
    const { data, error } = await supabase
        .from('consultations')
        .select('*')
        .limit(5);

    if (error) {
        console.error('Query failed:', error);
    } else {
        console.log('Query succeeded! consultations count:', data.length);
        console.log('consultations rows:', data);
    }
}
run();
