require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Testing Supabase Connection...');
console.log('URL:', supabaseUrl);
console.log('Service Key (first 10 chars):', serviceKey ? serviceKey.substring(0, 10) : 'MISSING');

if (!supabaseUrl || !serviceKey) {
    console.error('Missing credentials in .env.local');
    process.exit(1);
}

const fs = require('fs');
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const results = {
    node_version: process.version,
    fetch_available: typeof fetch !== 'undefined',
    tests: []
};

async function testKey(keyName, key) {
    console.log(`Testing ${keyName}...`);
    if (!key) {
        results.tests.push({ name: keyName, status: 'SKIPPED', error: 'Key not found' });
        return;
    }

    // Check if key looks like a JWT
    const isJwt = key && key.split('.').length === 3;

    const client = createClient(supabaseUrl, key);
    try {
        const { data, error } = await client.from('profiles').select('count', { count: 'exact', head: true });
        if (error) {
            results.tests.push({
                name: keyName,
                status: 'FAILED',
                error: error.message || error,
                details: error,
                key_preview: key.substring(0, 10) + '...',
                is_jwt_format: isJwt
            });
        } else {
            results.tests.push({ name: keyName, status: 'SUCCESS', key_preview: key.substring(0, 10) + '...' });
        }
    } catch (err) {
        results.tests.push({ name: keyName, status: 'EXCEPTION', error: err.message, stack: err.stack });
    }
}

async function simpleFetch() {
    try {
        const res = await fetch(supabaseUrl);
        results.fetch_test = { status: res.status, ok: res.ok };
    } catch (e) {
        results.fetch_test = { error: e.message };
    }
}

async function runTests() {
    await simpleFetch();
    await testKey('Anon Key', anonKey);
    await testKey('Service Role Key', serviceKey);

    fs.writeFileSync('db_diagnostics.json', JSON.stringify(results, null, 2));
    console.log('Diagnostics written to db_diagnostics.json');
}

runTests();
