# 🚨 IMPORTANT: Run This Migration First!

## The "Failed to save resource" Error

You're seeing this error because **the database tables don't exist yet**. 

## How to Fix (2 Minutes):

### Step 1: Copy the SQL
1. Open this file: `src/scripts/sql/create_mental_health_resources.sql`
2. Press `Ctrl+A` to select all
3. Press `Ctrl+C` to copy

### Step 2: Run in Supabase
1. Go to https://supabase.com/dashboard
2. Select your MedLud project
3. Click **"SQL Editor"** in the left sidebar
4. Click **"New query"** button
5. Paste the SQL (Ctrl+V)
6. Click **"Run"** or press `Ctrl+Enter`

### Step 3: Verify Success
You should see a message like "Success. No rows returned"

### Step 4: Test Again
1. Go back to `/admin/mental-health-resources`
2. Try adding a coping technique again
3. It should work now! ✅

---

## What the Migration Creates:
- `coping_techniques` table
- `mental_health_organizations` table  
- `self_care_tips` table
- Security policies (RLS)
- Default data (pre-populated with 5 techniques, 3 organizations, 5 tips)

After running this once, you'll never need to run it again!
