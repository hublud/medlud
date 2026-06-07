import { NextResponse } from 'next/server';
import { resend } from '@/lib/resend';

export async function POST(req: Request) {
    try {
        const { appointmentId, patientEmail, patientName, doctorName, callType, scheduledDate, duration } = await req.json();

        if (!patientEmail) {
            return NextResponse.json({ error: 'Patient email is required' }, { status: 400 });
        }

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://medlud.com';
        const sessionUrl = `${appUrl}/dashboard/telemedicine/session/${appointmentId}`;

        const formattedDate = new Date(scheduledDate).toLocaleDateString(undefined, {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        const formattedTime = new Date(scheduledDate).toLocaleTimeString(undefined, {
            hour: '2-digit',
            minute: '2-digit'
        });

        const typeLabel = callType === 'chat' 
            ? 'Telemedicine Chat Room' 
            : `${callType.charAt(0).toUpperCase() + callType.slice(1)} Consultation`;

        const { data, error } = await resend.emails.send({
            from: 'Medlud Telemedicine <noreply@medlud.com>',
            to: patientEmail,
            subject: `Scheduled Telemedicine Session with Dr. ${doctorName}`,
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <span style="font-size: 24px; font-weight: bold; color: #059669;">Medlud</span>
                    </div>
                    <h2 style="color: #0f172a; font-size: 20px; font-weight: 800; margin-top: 0;">Telemedicine Session Scheduled</h2>
                    <p style="font-size: 15px; color: #475569; line-height: 1.6;">
                        Hello <strong>${patientName}</strong>,
                    </p>
                    <p style="font-size: 15px; color: #475569; line-height: 1.6;">
                        Your case has been escalated to a virtual telemedicine consultation with <strong>Dr. ${doctorName}</strong>. Below are the appointment particulars:
                    </p>
                    
                    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 15px; margin: 20px 0;">
                        <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #334155;">
                            <tr>
                                <td style="padding: 6px 0; font-weight: bold; color: #64748b; width: 120px;">Provider:</td>
                                <td style="padding: 6px 0; font-weight: bold;">Dr. ${doctorName}</td>
                            </tr>
                            <tr>
                                <td style="padding: 6px 0; font-weight: bold; color: #64748b;">Channel Type:</td>
                                <td style="padding: 6px 0;"><span style="background-color: #e0f2fe; color: #0369a1; padding: 2px 8px; border-radius: 6px; font-size: 12px; font-weight: bold;">${typeLabel}</span></td>
                            </tr>
                            <tr>
                                <td style="padding: 6px 0; font-weight: bold; color: #64748b;">Scheduled Date:</td>
                                <td style="padding: 6px 0; font-weight: bold;">${formattedDate}</td>
                            </tr>
                            <tr>
                                <td style="padding: 6px 0; font-weight: bold; color: #64748b;">Time:</td>
                                <td style="padding: 6px 0; font-weight: bold;">${formattedTime}</td>
                            </tr>
                            <tr>
                                <td style="padding: 6px 0; font-weight: bold; color: #64748b;">Duration:</td>
                                <td style="padding: 6px 0;">${duration}</td>
                            </tr>
                        </table>
                    </div>

                    <div style="margin: 30px 0; text-align: center;">
                        <a href="${sessionUrl}" style="background-color: #059669; color: white; padding: 14px 28px; text-decoration: none; border-radius: 10px; font-weight: bold; display: inline-block; box-shadow: 0 4px 6px -1px rgba(5, 150, 105, 0.2);">
                            Join Session Room
                        </a>
                    </div>
                    
                    <p style="font-size: 13px; color: #64748b; line-height: 1.5;">
                        <strong>Note:</strong> You can join the room on the scheduled date and time from this email or directly from your patient dashboard under the virtual consultation card.
                    </p>

                    <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
                    <p style="font-size: 11px; color: #94a3b8; text-align: center; line-height: 1.5;">
                        Medlud Inc. — Your Health, Our Priority.<br />
                        If you have trouble using the button above, copy and paste this link into your web browser:<br />
                        <a href="${sessionUrl}" style="color: #059669; word-break: break-all;">${sessionUrl}</a>
                    </p>
                </div>
            `,
        });

        if (error) {
            console.error('Resend email error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, id: data?.id });

    } catch (error: any) {
        console.error('Scheduled call notification error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
