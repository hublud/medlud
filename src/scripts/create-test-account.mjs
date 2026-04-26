/**
 * create-test-account.mjs
 * Creates a pre-verified test user so you can test the full onboarding flow
 * without needing to receive an OTP email.
 *
 * Run with: node src/scripts/create-test-account.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Load .env.local manually
const envPath = resolve(process.cwd(), '.env.local');
const envContent = readFileSync(envPath, 'utf8');
const env = Object.fromEntries(
  envContent
    .split('\n')
    .filter(line => line.includes('=') && !line.startsWith('#'))
    .map(line => {
      const [key, ...rest] = line.split('=');
      return [key.trim(), rest.join('=').trim()];
    })
);

const SUPABASE_URL = env['NEXT_PUBLIC_SUPABASE_URL'];
const SERVICE_ROLE_KEY = env['SUPABASE_SERVICE_ROLE_KEY'];

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const TEST_EMAIL = 'test_onboarding@medlud.test';
const TEST_PASSWORD = 'TestMedlud@2026';

async function main() {
  console.log('\n🧪 Creating test account for onboarding flow testing...\n');
  console.log(`📧 Email: ${TEST_EMAIL}`);
  console.log(`🔑 Password: ${TEST_PASSWORD}\n`);

  // 1. Delete existing test user if present
  const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
  const existing = existingUsers?.users?.find(u => u.email === TEST_EMAIL);
  if (existing) {
    console.log('🗑️  Removing existing test user...');
    await supabaseAdmin.auth.admin.deleteUser(existing.id);
  }

  // 2. Create new user with email pre-confirmed (no OTP needed)
  const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
    email_confirm: true, // ← bypasses OTP entirely
    user_metadata: {
      full_name: 'Test Patient',
      phone: '+2348000000099',
    }
  });

  if (createError || !newUser?.user) {
    console.error('❌ Failed to create user:', createError?.message);
    process.exit(1);
  }

  const userId = newUser.user.id;
  console.log(`✅ Auth user created: ${userId}`);

  // 3. Create profile row at health-profile step (simulates post-email-verify state)
  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .upsert({
      id: userId,
      email: TEST_EMAIL,
      full_name: 'Test Patient',
      role: 'patient',
      onboarding_completed: false,
      onboarding_step: 'health-profile',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

  if (profileError) {
    console.error('❌ Failed to create profile:', profileError.message);
    process.exit(1);
  }

  console.log('✅ Profile created at onboarding_step: health-profile\n');

  console.log('━'.repeat(50));
  console.log('🚀 TEST ACCOUNT READY');
  console.log('━'.repeat(50));
  console.log(`   URL:      http://localhost:3000/login`);
  console.log(`   Email:    ${TEST_EMAIL}`);
  console.log(`   Password: ${TEST_PASSWORD}`);
  console.log('━'.repeat(50));
  console.log('\n📋 Expected flow after login:');
  console.log('   1. Login → redirected to /health-profile (Step 2/4)');
  console.log('   2. Fill health profile → Continue → /emergency-contact (Step 3/4)');
  console.log('   3. Fill emergency contact → Continue → /permissions (Step 4/4)');
  console.log('   4. Accept all terms → Allow & Continue → /completion');
  console.log('   5. Click "Go to Dashboard" → /dashboard\n');
}

main().catch(console.error);
