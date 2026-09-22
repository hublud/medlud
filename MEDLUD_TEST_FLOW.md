# MedLud — QA Test Flow Document

**App URL:** https://medlud.com  
**Test Date:** September 2026  
**Prepared for:** QA Tester

---

## 🔑 Test Credentials at a Glance

| Role | Email | Password | Portal |
|------|-------|----------|--------|
| **Admin** | *(use your existing admin account)* | *(your admin password)* | `/admin` |
| **Test Doctor** | *(created via admin — see Flow A)* | `MedLudStaff123!` | `/dashboard/staff` |
| **Test Nurse** | *(created via admin — see Flow A)* | `MedLudStaff123!` | `/dashboard/staff` |
| **Test Patient** | *(register fresh — see Flow B)* | *(set during signup)* | `/dashboard` |
| **SaaS Partner (Facility Admin)** | *(invited via admin — see Flow D)* | `MedLud@[LicenseNo]2026` | `/saas/dashboard` |
| **SaaS Lab Tech** | `labtech@[facilityshortname].medlud.local` | `MedLudStaff123!` | `/saas/dashboard` |
| **SaaS Pharmacist** | `pharmacist@[facilityshortname].medlud.local` | `MedLudStaff123!` | `/saas/dashboard` |

> **Payment Testing (Flutterwave Test Card)**  
> Card Number: `5531 8866 5214 2950`  
> Expiry: `09/32`  CVV: `564`  PIN: `3310`  OTP: `12345`

---

## 🗺️ Platform Overview

MedLud has **three portals**:

```
medlud.com/
├── /dashboard          → Patient Portal
├── /dashboard/staff    → Doctor / Nurse / Mental Health Portal  
├── /admin              → Platform Admin Panel
└── /saas/dashboard     → SaaS Facility Portal (Hospitals/Clinics)
```

---
---

# FLOW A — Admin Setup (Do This First)

> **Goal:** Set up test staff accounts so all subsequent flows can be tested.

### Step A1 — Log in as Admin
1. Go to **`/login`**
2. Enter admin credentials
3. You should be redirected to **`/admin`** automatically ✅

### Step A2 — Create a Test Doctor
1. In the sidebar, click **Staff Management**
2. Click **+ Add Staff** (top right)
3. Fill in the form:
   - **Full Name:** `Dr. Aisha Bello`
   - **Email:** `dr.aisha@testmedlud.com`
   - **Role:** `Doctor`
   - **Phone:** `+2348012345678`
4. Click **Create Account**
5. ✅ **Expected:** Success alert shows: `Email: dr.aisha@testmedlud.com | Password: MedLudStaff123!`
6. The doctor appears in the staff list as **Verified** (green badge)

### Step A3 — Create a Test Nurse
1. Click **+ Add Staff** again
2. Fill in:
   - **Full Name:** `Nurse Fatima Yusuf`
   - **Email:** `nurse.fatima@testmedlud.com`
   - **Role:** `Nurse`
3. Click **Create Account**
4. ✅ **Expected:** Success with same default password

### Step A4 — Configure Doctor as Specialist (Optional for Specialist Flow)
1. In the staff table, find **Dr. Aisha Bello**
2. Under **Specialist Config**, change the dropdown from `General Pool` → `Cardiology`
3. ✅ Pricing fields appear — set `Chat Price: 15000` and `Video Price: 20000`
4. Prices auto-save on change

### Step A5 — Credit Patient Wallet (for Telemedicine Testing)
1. Go to **User Management** in the sidebar
2. Find the patient you registered in Flow B (search by email)
3. Click **Edit** → locate the wallet credit option  
   *(Alternatively: in the admin sidebar, there may be a "Wallet Credit" quick action)*
4. Credit `₦50,000` to the test patient

---
---

# FLOW B — Patient Registration & Onboarding

> **Case Study:** *Emeka Okonkwo, a 34-year-old Lagos resident, signs up for MedLud for the first time.*

### Step B1 — Visit the Landing Page
1. Go to **`medlud.com`** (or `localhost:3000`)
2. Browse the landing page — hero section, features, pricing plans ✅
3. Click **Get Started** or navigate to **`/welcome`**

### Step B2 — Account Type Selection
1. On the Welcome page, click **Get Started**
2. You land on **`/account-type`** — select **Individual/Patient**
3. Click **Continue**

### Step B3 — Registration
1. Enter details:
   - **Full Name:** `Emeka Okonkwo`
   - **Email:** `emeka.okonkwo@gmail.com` *(use a real inbox you can check)*
   - **Password:** `TestPass123!`
   - **Confirm Password:** `TestPass123!`
2. Click **Create Account**
3. ✅ **Expected:** Redirected to `/verify-email?email=emeka.okonkwo@gmail.com`

### Step B4 — Email Verification
1. Check your email inbox for a **6-digit OTP** from MedLud
2. Enter the OTP in the 8-box input *(paste works too)*
3. Click **Verify**
4. ✅ **Expected:** Redirected to `/health-profile` (onboarding Step 1)

### Step B5 — Health Profile Onboarding
Complete all onboarding steps:

**Health Profile (`/health-profile`)**
- Date of Birth: `15 March 1990`
- Blood Group: `O+`
- Genotype: `AA`
- Allergies: `Penicillin`
- Chronic Conditions: *(leave blank)*
- Click **Save & Continue**

**Emergency Contact (`/emergency-contact`)**
- Name: `Ngozi Okonkwo`
- Relationship: `Wife`
- Phone: `+2348098765432`
- Click **Save & Continue**

**Permissions (`/permissions`)**
- Toggle ON: **Health Notifications**, **Appointment Reminders**
- Click **Finish Setup**

5. ✅ **Expected:** Redirected to `/completion` then auto-redirected to `/dashboard`

### Step B6 — Explore Patient Dashboard
On the dashboard, verify:
- [ ] Med-ID displayed (7-digit number)
- [ ] Wallet balance shows (₦0 initially)
- [ ] Navigation links work: Telemedicine, Appointments, EMR, Specialists, AI Assistant, Wallet

---
---

# FLOW C — Telemedicine Consultation (Core Case Study)

> **Case Study:** *Emeka has a persistent chest pain and wants to speak with a doctor urgently.*

**Participants needed:** Patient (Emeka) + Doctor (Dr. Aisha)  
**Tip:** Use two different browsers simultaneously — e.g. Chrome (Patient) + Firefox (Doctor), or Chrome + Chrome Incognito.

---

## C1 — Patient Side: Top Up Wallet

1. Log in as **Emeka** (patient)
2. Go to **Dashboard → Wallet** (`/dashboard/wallet`)
3. Click **Top Up Wallet**
4. Enter Amount: `₦20,000`
5. Click **Proceed to Payment**
6. Use the Flutterwave test card: `5531 8866 5214 2950` / Exp: `09/32` / CVV: `564`
7. PIN: `3310` → OTP: `12345`
8. ✅ **Expected:** Wallet balance updates to ₦20,000

---

## C2 — Patient Side: Start a Telemedicine Call

1. Still as Emeka, go to **Dashboard → Telemedicine** (`/dashboard/telemedicine`)
2. Click **Start New Consultation**
3. Describe symptoms:
   - **Title:** `Chest Pain`
   - **Description:** `I've been having a persistent sharp pain on the left side of my chest for the past 2 hours. It worsens when I breathe deeply.`
   - **Severity:** `Urgent`
4. Click **Next**
5. Choose call type: **Video Call** (₦8,000) or **Voice Call** (₦7,000)
6. Payment: Select **Pay from Wallet** → confirm deduction
7. ✅ **Expected:** "Connecting..." screen appears — call is now in the doctor queue

---

## C3 — Doctor Side: Accept the Call

1. Open a **new browser / incognito window**
2. Log in as **Dr. Aisha Bello** (`dr.aisha@testmedlud.com` / `MedLudStaff123!`)
3. ✅ **Expected:** Redirected to `/dashboard/staff` automatically
4. Click **"Enable Audio"** button (allows browser notification sound)
5. Wait a few seconds — an **incoming call modal** should appear with Emeka's name
6. Click **Accept Call**
7. ✅ **Expected:** Both browsers enter the Live Call screen

---

## C4 — Live Call (Both Sides)

During the call, verify:
- [ ] Video/audio streams are working (both parties visible/audible)
- [ ] **Duration timer** is counting up on the doctor's screen
- [ ] Patient sees a "Waiting for doctor" state then transitions to live view

---

## C5 — Doctor Side: End Call & File Report

1. Doctor clicks **End Call**
2. The **Post-Call Report** form appears with:
   - AI-generated summary (from the call transcript) — verify it populated ✅
   - **Diagnosis:** `Musculoskeletal chest pain (likely intercostal strain)`
   - **Notes:** `Patient to avoid heavy lifting. Monitor for 48 hours. Return if symptoms worsen.`
   - **Prescriptions:** Click `+` → `Ibuprofen 400mg - twice daily - 5 days`
   - **Lab Tests:** Click `+` → `ECG` (to rule out cardiac issue)
3. Click **Submit Report**
4. ✅ **Expected:** Report saved, doctor returns to the queue

---

## C6 — Patient Side: View Consultation Summary

1. Back as Emeka, the call screen transitions to **Post-Call Summary**
2. Verify:
   - [ ] AI summary of the call is shown
   - [ ] Doctor name is displayed
   - [ ] Duration shown correctly
3. Go to **Telemedicine History** (back button on telemedicine page)
4. ✅ **Expected:** Completed consultation appears in history list

---
---

# FLOW D — Specialist Consultation

> **Case Study:** *Emeka's symptoms suggest a cardiac issue. His GP refers him to a Cardiologist.*

**Prerequisite:** Dr. Aisha must be configured as a **Cardiology specialist** (Step A4)

### Step D1 — Patient Requests a Specialist
1. Log in as **Emeka**
2. Go to **Dashboard → Specialists** (`/dashboard/specialists`)
3. Select **Cardiology** from the specialty grid
4. Click **Request Specialist Consultation**
5. Fill in the form:
   - **Reason:** `Recurring chest pain, ECG recommended by GP`
   - **Type:** `Video Call`
6. Confirm payment from wallet (specialist pricing: ₦20,000 for video)
7. ✅ **Expected:** Request submitted, shows "Awaiting a cardiologist"

### Step D2 — Doctor Claims the Specialist Case
1. Log in as **Dr. Aisha** (Cardiology specialist)
2. On the staff dashboard, click the **POOL** tab
3. ✅ **Expected:** Emeka's cardiology case appears in the pool
4. Click **Claim Case**
5. ✅ **Expected:** Redirected to the telemedicine session room

### Step D3 — Conduct & Complete
- Follow the same live call + report steps from C4–C6 above ✅

---
---

# FLOW E — Forgot Password

> Ensures the password reset flow works end-to-end.

1. Log out (if logged in)
2. Go to **`/login`**
3. Click **Forgot Password?**
4. ✅ **Expected:** Redirected to `/forgot-password` page
5. Enter `emeka.okonkwo@gmail.com`
6. Click **Send Reset Link**
7. ✅ **Expected:** Success message — "Check Your Inbox"
8. Check email for reset link
9. Click the link → ✅ Redirected to the correct dashboard (not patient onboarding)

---
---

# FLOW F — Admin Panel Full Walkthrough

> Log in as Admin and test each section.

### F1 — Overview Dashboard
- Go to `/admin`
- ✅ Verify: Total Users, Maternal Registrations, Pending Appointments stats load
- ✅ Verify: Recent Registrations table shows Emeka's account

### F2 — Analytics
- Go to `/admin/analytics`
- ✅ Verify: Charts/graphs render without errors

### F3 — Staff Performance
- Go to `/admin/staff-performance`
- ✅ Verify: Dr. Aisha shows completed calls with duration

### F4 — Telemedicine Logs
- Go to `/admin/telemedicine-logs`
- ✅ Verify: The Emeka → Dr. Aisha call appears in the log

### F5 — Financials & Payouts
- Go to `/admin/financials`
- ✅ Verify: Transaction for Emeka's wallet top-up and consultation payment shows

### F6 — Broadcast Announcement
- Go to `/admin` → Quick Actions → **Send Announcement**
- Type: `"System maintenance scheduled for Saturday 2am - 4am WAT"`
- Click **Send**
- ✅ Expected: Broadcast successful message with user count

### F7 — User Management
- Go to `/admin/users`
- Search for `emeka` → ✅ Emeka's profile appears
- Try editing role or resetting password ✅

### F8 — Health Tips
- Go to `/admin/health-tips`
- Create a new tip: Title `"Stay Hydrated"`, Body `"Drink at least 8 glasses of water daily."`
- ✅ Verify tip is saved and visible

---
---

# FLOW G — SaaS Facility Portal

> **Case Study:** *"Lagos General Clinic" has subscribed to MedLud SaaS. Their admin, lab tech, and pharmacist all use the portal to manage patient requests.*

---

## G1 — Admin: Onboard a Facility

1. Log in as **Admin** → go to **Partnered Facilities** (`/admin/facilities`)
2. Click **+ Add Facility**
3. Fill in:
   - **Name:** `Lagos General Clinic`
   - **Type:** `Clinic`
   - **License No:** `LGC-2026-001`
   - **Email:** `admin@lagosgeneralclinic.com`
   - **Phone:** `+2341234567890`
   - **State:** `Lagos` | **City:** `Victoria Island`
   - **Address:** `14 Admiralty Way, Victoria Island, Lagos`
4. Click **Save**
5. ✅ Facility appears in the list

## G2 — Admin: Enable SaaS & Invite the Partner

1. Find **Lagos General Clinic** in the facilities list
2. Click **Manage** / open its detail view
3. Toggle **SaaS Enabled** → ON
4. Set `saas_subscription_status` → `active`
5. Set expiry date: `31 December 2027`
6. Click **Invite Partner** (sends onboarding email to `admin@lagosgeneralclinic.com`)
7. ✅ **Expected:** Success message with temp credentials:
   - Email: `admin@lagosgeneralclinic.com`
   - Password: `MedLud@LGC20260012026`

## G3 — Partner Admin: First Login

1. Open new browser / incognito
2. Go to `/login`
3. Enter: `admin@lagosgeneralclinic.com` / `MedLud@LGC20260012026`
4. ✅ **Expected:** Redirected to `/saas/dashboard`
5. Verify: Facility name "Lagos General Clinic" is shown, subscription status = Active

## G4 — Partner Admin: Explore SaaS Dashboard

| Section | URL | What to Verify |
|---------|-----|---------------|
| Overview | `/saas/dashboard` | Pending requests count, staff list |
| Requests | `/saas/dashboard/requests` | Patient search, prescriptions, lab, scan tabs |
| Triage | `/saas/dashboard/triage` | Patient queue management |
| Wards | `/saas/dashboard/wards` | Active admissions |
| Pharmacy | `/saas/dashboard/pharmacy` | Prescription fulfilment |
| Billing | `/saas/dashboard/billing` | Invoice generation |
| Settings | `/saas/dashboard/settings` | Facility profile edit |

---

## G5 — SaaS Triage Flow (Full Case Study)

> *Emeka walks into Lagos General Clinic with his chest pain. The triage nurse registers him.*

### Step G5.1 — Nurse Triages Patient
1. Log in as **Partner Admin** (or nurse staff account)
2. Go to `/saas/dashboard/triage`
3. Click **+ New Patient**
4. Search for **Emeka** by MED-ID or name
5. Record:
   - **BP:** `130/85 mmHg`
   - **Temperature:** `37.2°C`
   - **SpO2:** `98%`
   - **Pulse:** `88 bpm`
   - **Complaint:** `Chest pain — left side, 2 hours`
6. Click **Submit to Queue**
7. ✅ Patient appears in the waiting queue

### Step G5.2 — Doctor Reviews & Issues Prescription
1. In the facility, the attending doctor (could be a facility SaaS staff with doctor role) reviews the queue
2. Opens Emeka's triage card
3. Issues prescription:
   - `Ibuprofen 400mg — twice daily — 5 days`
   - `Aspirin 75mg — once daily — 7 days`
4. Orders Lab Test: `ECG + Full Blood Count`
5. Submits

### Step G5.3 — Lab Tech Processes Lab Request
1. Open new browser, log in as **Lab Tech**:
   - Email: `labtech@lagosgeneralclinic.medlud.local`
   - Password: `MedLudStaff123!`
2. Go to `/saas/dashboard/requests`
3. ✅ **Expected:** Auto-tabs to the **LABS** tab
4. Find Emeka's lab request
5. Click **Enter Results**
6. Input:
   - **ECG:** `Normal sinus rhythm`
   - **FBC:** `WBC 7.2, RBC 5.1, Hb 14.5`
7. Click **Submit Results**
8. ✅ Results saved and visible on Emeka's EMR

### Step G5.4 — Pharmacist Dispenses Medication
1. Open new browser, log in as **Pharmacist**:
   - Email: `pharmacist@lagosgeneralclinic.medlud.local`
   - Password: `MedLudStaff123!`
2. Go to `/saas/dashboard/requests` (or `/saas/dashboard/pharmacy`)
3. ✅ **Expected:** Auto-tabs to **PRESCRIPTIONS** tab
4. Find Emeka's prescription
5. Click **Mark as Dispensed**
6. ✅ Prescription status updates to Dispensed

### Step G5.5 — Billing
1. As Partner Admin, go to `/saas/dashboard/billing`
2. Find Emeka's visit
3. Generate invoice for:
   - Consultation fee: `₦5,000`
   - Lab (ECG + FBC): `₦8,000`
   - Medication: `₦3,500`
4. Click **Generate Bill**
5. ✅ Invoice created with total: ₦16,500

---
---

# 🧪 Edge Case Tests

| Scenario | Steps | Expected Result |
|----------|-------|-----------------|
| Duplicate email signup | Try registering with `emeka.okonkwo@gmail.com` again | Error: "Email already registered" |
| Wrong password login | Enter wrong password on login | Error message shown, not redirected |
| Admin accesses patient dashboard | Log in as admin → go to `/dashboard` | Auto-redirected to `/admin` |
| Doctor accesses patient onboarding | Log in as Dr. Aisha → go to `/health-profile` | Auto-redirected to `/dashboard/staff` |
| Patient accesses staff portal | Log in as Emeka → go to `/dashboard/staff` | Access blocked or incorrect data (patient role) |
| Wallet payment with insufficient balance | Patient tries call with ₦0 balance | Payment modal blocks with "Insufficient balance" |
| Expired SaaS subscription | Toggle facility SaaS expiry to past date | Partner sees "Subscription expired" banner |
| Forgot password for unknown email | Enter `unknown@email.com` on forgot-password page | Supabase sends a no-op (no error exposed to user for security) |

---

# ✅ End-to-End Checklist

```
PATIENT FLOW
[ ] Registration & email OTP verification
[ ] Onboarding (health profile, emergency contact, permissions)
[ ] Wallet top-up via Flutterwave
[ ] Telemedicine call initiated
[ ] Specialist consultation requested
[ ] History visible after call
[ ] Forgot password flow

DOCTOR/STAFF FLOW
[ ] Login → auto-redirect to /dashboard/staff
[ ] Audio unlock button works
[ ] Incoming call notification appears
[ ] Call accepted and live video works
[ ] Post-call report submitted with AI summary
[ ] Specialist case visible in POOL tab
[ ] Earnings/Wallet shows in WALLET tab

ADMIN FLOW
[ ] Create doctor account → doctor can log in
[ ] Create nurse account → nurse can log in
[ ] Set specialist config (specialty + pricing)
[ ] View telemedicine logs
[ ] View financials
[ ] Broadcast announcement
[ ] Invite SaaS facility

SAAS FLOW
[ ] Partner admin logs in → SaaS dashboard
[ ] Triage a patient
[ ] Issue prescription + lab order
[ ] Lab tech receives and fills lab results
[ ] Pharmacist dispenses medication
[ ] Billing invoice generated
```

---

## 📞 Testing Tips

1. **Two-browser method:** Use Chrome (Patient) + Firefox (Doctor) simultaneously to test telemedicine calls
2. **Allow mic/camera:** Both browsers must allow microphone/camera access for the call to work
3. **Use headphones:** Prevents echo when both windows are on the same computer
4. **Agora App ID:** `3671af6a0e094b8d9a440ce8f3482683` — already configured in the app
5. **Flutterwave is in test mode:** No real money is charged during testing
6. **Console logs:** Open browser DevTools → Console to see detailed logs for any failures
