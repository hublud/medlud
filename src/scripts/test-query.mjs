
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testQuery() {
    const userId = 'a8a465be-7d40-4d7f-bcdd-4e32bc856d64';

    console.log('Testing query WITH join...');
    const { data: withJoin, error: err1 } = await supabase
        .from('appointments')
        .select('*, doctor:profiles!doctor_id(full_name)')
        .eq('user_id', userId);

    console.log('Results with join:', withJoin?.length, err1?.message || 'No error');

    console.log('\nTesting query WITHOUT join...');
    const { data: withoutJoin, error: err2 } = await supabase
        .from('appointments')
        .select('*')
        .eq('user_id', userId);

    console.log('Results without join:', withoutJoin?.length, err2?.message || 'No error');
}

testQuery();
