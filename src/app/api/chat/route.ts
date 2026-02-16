import { NextResponse } from 'next/server';
import { openai } from '@/lib/openai';

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

        const { messages, systemPrompt } = await req.json();

        if (!messages || !Array.isArray(messages)) {
            return NextResponse.json({ error: 'Messages array is required' }, { status: 400 });
        }

        console.log('Sending request to OpenAI with', messages.length, 'messages');

        const completion = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                { role: 'system', content: systemPrompt || 'You are a helpful assistant.' },
                ...messages
            ],
        });

        const reply = completion.choices[0].message.content;

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
