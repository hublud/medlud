import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
    try {
        const { patientEmail, doctorName, consultationId, messageSnippet } = await req.json();

        if (!patientEmail) {
            return NextResponse.json({ error: 'Patient email is required' }, { status: 400 });
        }

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://medlud.com';
        const sessionUrl = `${appUrl}/dashboard/telemedicine/session/${consultationId}`;

        const { data, error } = await resend.emails.send({
            from: 'Medlud Notifications <noreply@medlud.com>',
            to: patientEmail,
            subject: `New response from Dr. ${doctorName}`,
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 12px;">
                    <h2 style="color: #059669;">Hello from Medlud,</h2>
                    <p style="font-size: 16px; color: #334155;">
                        <strong>Dr. ${doctorName}</strong> has just responded to your consultation case.
                    </p>
                    ${messageSnippet ? `<blockquote style="background: #f1f5f9; padding: 15px; border-left: 4px solid #059669; color: #475569; font-style: italic; margin: 20px 0;">"${messageSnippet}"</blockquote>` : ''}
                    <div style="margin: 30px 0;">
                        <a href="${sessionUrl}" style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                            View Response & Reply
                        </a>
                    </div>
                    <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
                    <p style="font-size: 12px; color: #94a3b8; text-align: center;">
                        Medlud - Your Health, Our Priority.<br />
                        If the button above doesn't work, copy and paste this link into your browser:<br />
                        <a href="${sessionUrl}" style="color: #059669;">${sessionUrl}</a>
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
        console.error('Email notification error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
