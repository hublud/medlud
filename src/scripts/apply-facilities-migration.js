const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load env vars manually
const envPath = path.resolve(process.cwd(), '.env.local');
let envConfig = {};

if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
            envConfig[key.trim()] = valueParts.join('=').trim();
        }
    });
}

const supabaseUrl = envConfig.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = envConfig.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase URL or Service Key in .env.local');
    process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function applyMigration() {
    console.log('🚀 Applying Partnered Facilities & Referrals migrations...\n');

    try {
        const sqlFilePath = path.resolve(process.cwd(), 'src/scripts/sql/create_partnered_facilities.sql');
        if (!fs.existsSync(sqlFilePath)) {
            throw new Error(`Migration SQL file not found at ${sqlFilePath}`);
        }

        const sql = fs.readFileSync(sqlFilePath, 'utf-8');

        // Execute via RPC
        const { error } = await supabaseAdmin.rpc('exec_sql', { sql_query: sql });

        if (error) {
            console.error('❌ Error executing SQL via RPC:', error);
            console.log('\n⚠️ RPC execution failed. Please copy the SQL from "src/scripts/sql/create_partnered_facilities.sql" and run it manually in the Supabase SQL Editor.');
            process.exit(1);
        }

        console.log('✅ Migrations applied and seeded successfully!');
    } catch (err) {
        console.error('❌ Migration Error:', err.message);
        process.exit(1);
    }
}

applyMigration();
