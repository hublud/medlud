import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
    try {
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://medlud.com';
        const dashboardUrl = `${appUrl}/dashboard`;

        const { data, error } = await resend.emails.send({
            from: 'Joshua from Medlud <hello@medlud.com>',
            to: email,
            replyTo: 'informhublud@gmail.com',
            subject: 'A Message from Our Founder – Joshua Nwamife 💙',
            html: `
                <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #334155; line-height: 1.6;">
                    <div style="margin-bottom: 30px;">
                        <img src="${appUrl}/medlud-logo.png" alt="Medlud" style="height: 40px;" />
                    </div>
                    
                    <h1 style="color: #059669; font-size: 24px; font-weight: 800; margin-bottom: 24px;">Welcome to Medlud,</h1>
                    
                    <p style="font-size: 16px; margin-bottom: 20px;">
                        I want to personally thank you for taking this step to join us. Medlud was born from a simple but powerful belief—that no one should be denied access to quality healthcare because of where they live or their circumstances.
                    </p>
                    
                    <p style="font-size: 16px; margin-bottom: 20px;">
                        Growing up and working within our communities, I saw firsthand the gaps in our healthcare system—the delays, the lack of access, the uncertainty people face when they need help the most. Medlud is our response to that reality. It is a vision to bridge those gaps using technology, compassion, and innovation.
                    </p>
                    
                    <p style="font-size: 16px; margin-bottom: 20px;">
                        Our goal is clear: to make healthcare in Africa more <strong>accessible</strong>, more <strong>reliable</strong>, and of the highest <strong>quality</strong> possible. But this is not something we can achieve alone.
                    </p>
                    
                    <p style="font-size: 16px; margin-bottom: 20px;">
                        By joining Medlud, you are now part of this mission. You are part of a community that believes in change, in progress, and in a future where healthcare works for everyone.
                    </p>
                    
                    <p style="font-size: 16px; margin-bottom: 30px;">
                        Thank you for trusting us. Thank you for believing in this vision.
                    </p>
                    
                    <p style="font-size: 16px; margin-bottom: 40px;">
                        Together, we will build something truly impactful.
                    </p>
                    
                    <div style="margin-bottom: 40px;">
                        <a href="${dashboardUrl}" style="background-color: #059669; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px;">
                            Visit My Dashboard
                        </a>
                    </div>
                    
                    <div style="border-top: 1px solid #e2e8f0; padding-top: 30px; margin-top: 40px;">
                        <p style="margin: 0; font-size: 16px; color: #1e293b; font-weight: 600;">With gratitude,</p>
                        <p style="margin: 5px 0 0 0; font-family: 'Georgia', serif; font-style: italic; font-size: 22px; color: #059669;">Joshua Nwamife</p>
                        <p style="margin: 2px 0 0 0; font-size: 14px; color: #64748b; font-weight: 500;">Founder, Medlud</p>
                    </div>
                    
                    <p style="margin-top: 50px; font-size: 12px; color: #94a3b8; text-align: center;">
                        &copy; ${new Date().getFullYear()} Medlud. All rights reserved.<br />
                        This email was sent to you as part of your Medlud membership.
                    </p>
                </div>
            `,
        });

        if (error) {
            console.error('❌ Resend Error Details:', {
                message: error.message,
                name: error.name,
                statusCode: (error as any).statusCode
            });
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        console.log('✅ Welcome email sent successfully to:', email, 'ID:', data?.id);
        return NextResponse.json({ success: true, id: data?.id });

    } catch (error: any) {
        console.error('💥 Fatal error in welcome email route:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
