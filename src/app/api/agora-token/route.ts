import { NextResponse } from 'next/server';
import { RtcTokenBuilder, RtcRole } from 'agora-access-token';

export async function POST(req: Request) {
    try {
        const { channelName, uid } = await req.json();

        if (!channelName) {
            return NextResponse.json({ error: 'channelName is required' }, { status: 400 });
        }

        const appId = process.env.AGORA_APP_ID;
        const appCertificate = process.env.AGORA_APP_CERTIFICATE;

        if (!appId || !appCertificate) {
            console.error('Agora credentials missing in environment');
            return NextResponse.json({
                error: 'Agora configuration error',
                details: 'App ID or Certificate is not configured'
            }, { status: 500 });
        }

        // Use 0 as the UID for token generation to create a "wildcard" token.
        // This allows any user with any UID to join the channel using this token.
        // This is necessary because both the patient and the professional need to join the same channel,
        // often with different unique UIDs but sharing the same authorization token.
        const userId = 0;
        const role = RtcRole.PUBLISHER;

        const expirationTimeInSeconds = 3600; // 1 hour
        const currentTimestamp = Math.floor(Date.now() / 1000);
        const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

        const token = RtcTokenBuilder.buildTokenWithUid(
            appId,
            appCertificate,
            channelName,
            userId,
            role,
            privilegeExpiredTs
        );

        return NextResponse.json({ token, uid: userId, appId });
    } catch (error: any) {
        console.error('Agora Token Error:', error);
        return NextResponse.json({
            error: 'Failed to generate token',
            details: error.message
        }, { status: 500 });
    }
}
