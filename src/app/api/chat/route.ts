import { NextResponse } from 'next/server';
import { openai } from '@/lib/openai';
import { supabase, supabaseAdmin } from '@/lib/supabase';

export async function POST(req: Request) {
    try {
        console.log('Chat API called');

        // Check if OpenAI is configured
        if (!process.env.OPENAI_API_KEY) {
            console.error('OPENAI_API_KEY is not set in environment variables');
            return NextResponse.json({
                error: 'OpenAI API key is not configured',
                details: 'Please add OPENAI_API_KEY to your .env.local file'
            }, { status: 500 });
        }

        const { messages, systemPrompt, userId } = await req.json();

        if (!messages || !Array.isArray(messages)) {
            return NextResponse.json({ error: 'Messages array is required' }, { status: 400 });
        }

        // Enforcement of daily limit from platform settings
        if (userId) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // Fetch limit from platform settings
            const { data: settings } = await supabaseAdmin
                .from('platform_settings')
                .select('chat_message_limit')
                .limit(1)
                .single();

            const limit = settings?.chat_message_limit || 25;

            const { data: count, error: countError } = await supabase
                .rpc('get_daily_ai_message_count', { user_uuid: userId });

            console.log(`[Limit Check] User: ${userId}, Count: ${count}, Limit: ${limit}, Today (UTC): ${new Date().toISOString()}`);

            if (countError) {
                console.error('Error checking message count:', countError);
            } else if (count !== null && count >= limit) {
                console.log(`[Limit Reached] Blocking request for user ${userId}`);
                return NextResponse.json({
                    error: 'Daily message limit reached',
                    details: `You have reached your limit of ${limit} messages for today. Please come back tomorrow or consult a professional if you need immediate support.`
                }, { status: 429 });
            }
        }

        console.log('Sending request to OpenAI with', messages.length, 'messages');

        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: systemPrompt || 'You are a helpful assistant.' },
                ...messages
            ],
        });

        const reply = completion.choices[0].message.content;

        // Persist messages if userId is provided
        if (userId && reply) {
            const lastUserMessage = messages[messages.length - 1];

            // Use RPC to insert user message
            await supabase.rpc('insert_ai_chat_message', {
                p_user_id: userId,
                p_role: 'user',
                p_content: lastUserMessage.content
            });

            // Use RPC to insert AI message
            await supabase.rpc('insert_ai_chat_message', {
                p_user_id: userId,
                p_role: 'ai',
                p_content: reply
            });
        }

        console.log('OpenAI response received');
        return NextResponse.json({ reply });
    } catch (error: any) {
        console.error('=== OpenAI API Error ===');
        console.error('Error type:', error.constructor.name);
        console.error('Error message:', error.message);
        console.error('Error status:', error.status);
        console.error('Error code:', error.code);
        console.error('Full error:', JSON.stringify(error, null, 2));

        // OpenAI SDK errors have a different structure
        if (error.error) {
            console.error('OpenAI error details:', error.error);
        }

        return NextResponse.json({
            error: 'Failed to generate response',
            details: error.message || 'Unknown error',
            errorType: error.constructor.name,
            statusCode: error.status || error.statusCode,
            code: error.code
        }, { status: 500 });
    }
}
