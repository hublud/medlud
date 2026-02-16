# Mental Health Resources - Database Migration

## Step 1: Run the SQL Migration

You need to create the database tables in Supabase:

1. Open your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **SQL Editor** (in the left sidebar)
4. Click **New Query**
5. Copy the entire contents of `src/scripts/sql/create_mental_health_resources.sql`
6. Paste it into the SQL editor
7. Click **Run** or press `Ctrl+Enter`

### What the migration creates:
- `coping_techniques` table - For breathing exercises, grounding techniques, etc.
- `mental_health_organizations` table - For mental health support organizations
- `self_care_tips` table - For self-care suggestions
- Row Level Security (RLS) policies - Public can read, only admins can edit
- Default data - Pre-populated with existing resources

## Step 2: Access the Admin Panel

After running the migration:

1. Go to `/admin` in your app
2. Click **"Mental Health Resources"** in the sidebar (now visible!)
3. You can now manage all mental health resources

## Features:
- ✅ View all resources (including inactive)
- ✅ Delete resources (soft delete)
- ⏳ Add new resources (form placeholder - can be completed)
- ⏳ Edit existing resources (form placeholder - can be completed)

The public resources page at `/dashboard/mental-health/resources` will automatically show the database content.
