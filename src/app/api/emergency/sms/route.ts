import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import twilio from 'twilio';

// Initialize Supabase Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Initialize Twilio Client
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

const client = twilio(accountSid, authToken);

export async function POST(request: Request) {
    try {
        // 1. Validate Auth Header
        const authHeader = request.headers.get('Authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Unauthorized', details: 'Missing Authorization Header' }, { status: 401 });
        }

        // 2. Initialize Supabase with User Context
        // This client will act "as the user" and respect RLS policies
        const supabase = createClient(supabaseUrl, supabaseAnonKey, {
            global: { headers: { Authorization: authHeader } }
        });

        // 3. Verify User and Get ID from Token
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
            console.error('[SOS API] Auth failed:', userError);
            return NextResponse.json({ error: 'Unauthorized', details: 'Invalid Token' }, { status: 401 });
        }

        const userId = user.id;
        console.log(`[SOS API] Authorized User: ${userId}`);

        const { latitude, longitude } = await request.json();

        // 4. Fetch User Profile to get Emergency Contact
        // Using the user-scoped client, so RLS should allow reading own profile
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('full_name, emergency_contact_name, emergency_contact_phone, emergency_contact_relationship')
            .eq('id', userId)
            .single();

        if (profileError) {
            console.error('[SOS API] Supabase error:', JSON.stringify(profileError, null, 2));
            return NextResponse.json({
                error: 'Failed to fetch user profile',
                details: profileError
            }, { status: 500 });
        }

        if (!profile) {
            return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
        }

        const { full_name, emergency_contact_phone, emergency_contact_name } = profile;

        if (!emergency_contact_phone) {
            return NextResponse.json({ error: 'No emergency contact phone number found' }, { status: 404 });
        }

        // Helper to format phone number to E.164
        const formatPhoneNumber = (phone: string) => {
            // Remove spaces, dashes, parentheses
            const cleaned = phone.replace(/\D/g, '');

            // If starts with 0 and is 11 digits (Nigerian format), replace 0 with +234
            if (cleaned.startsWith('0') && cleaned.length === 11) {
                return `+234${cleaned.substring(1)}`;
            }

            // If it doesn't start with +, add it (assuming it includes country code but missing +)
            if (!phone.startsWith('+')) {
                return `+${cleaned}`;
            }

            return phone;
        };

        const formattedPhone = formatPhoneNumber(emergency_contact_phone);
        console.log(`[SOS API] Sending SMS to: ${formattedPhone} (Original: ${emergency_contact_phone})`);

        // 5. Construct Message
        let messageBody = `SOS! This is an emergency alert from ${full_name}. They have triggered the emergency button in the MedLud app.`;

        if (latitude && longitude) {
            const mapLink = `https://www.google.com/maps?q=${latitude},${longitude}`;
            messageBody += `\n\nTheir current location: ${mapLink}`;
        } else {
            messageBody += `\n\nLocation information was not available.`;
        }

        messageBody += `\n\nPlease check on them immediately.`;

        // 6. Send SMS via Twilio
        if (!accountSid || !authToken || !twilioPhoneNumber) {
            console.error('Twilio credentials missing');
            console.log(`[DEV MODE] Would send SMS to ${emergency_contact_phone}: ${messageBody}`);
            return NextResponse.json({ success: true, message: 'Simulated SMS sent (Twilio credentials missing)' });
        }

        const message = await client.messages.create({
            body: messageBody,
            from: twilioPhoneNumber,
            to: formattedPhone,
        });

        return NextResponse.json({ success: true, messageId: message.sid });

    } catch (error: any) {
        console.error('Error sending emergency SMS:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
