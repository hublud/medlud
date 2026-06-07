const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, serviceKey);

const TABLES = [
    'profiles',
    'security_audit_logs',
    'facilities',
    'facility_staff',
    'departments',
    'triage_records',
    'wards',
    'beds',
    'ward_admissions',
    'ward_clinical_logs',
    'facility_invoices',
    'facility_emr_consents',
    'internal_referrals'
];

async function checkTables() {
    console.log('Checking database tables existence...');
    for (const table of TABLES) {
        try {
            const { error } = await supabase
                .from(table)
                .select('*')
                .limit(0);
            
            if (error) {
                console.log(`❌ Table "${table}": Error -> ${error.message} (Code: ${error.code})`);
            } else {
                console.log(`✅ Table "${table}": Exists`);
            }
        } catch (e) {
            console.log(`❌ Table "${table}": Exception -> ${e.message}`);
        }
    }
}

checkTables();
