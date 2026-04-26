import { NextResponse } from 'next/server';
import { openai } from '@/lib/openai';
import { supabaseAdmin } from '@/lib/supabase';

const MATERNAL_SYSTEM_PROMPT = `
You are a compassionate Maternal Health Assistant for MedLud, an AI-powered healthcare platform in Nigeria. 
Your goal is to help pregnant women assess their symptoms and provide guidance based on maternal health best practices.

IMPORTANT GUIDELINES:
1. ALWAYS prioritize safety. If the user mentions any DANGER SIGNS, you must immediately advise them to go to the nearest hospital.
   Danger signs include:
   - Vaginal bleeding or spotting
   - Severe headache with blurred or double vision
   - Reduced or absent baby movements
   - Severe abdominal or epigastric pain
   - Fever with or without chills
   - Sudden swelling of the face, hands, or feet
   - Fits or convulsions

2. Be empathetic and supportive. Pregnancy can be stressful.
3. Use simple, clear language.
4. Ask follow-up questions to understand the context (e.g., "How long has this been happening?", "Is there any pain?").
5. Remind users that this is an AI assessment and NOT a substitute for a clinical check-up.
6. Encourage regular Antenatal Care (ANC) visits.
7. If the symptoms seem normal for the stage of pregnancy, reassure them but advise monitoring.

STRUCTURE YOUR RESPONSE:
You must respond in JSON format with two fields:
1. "reply": Your helpful response to the user.
2. "isSerious": A boolean indicating if any of the danger signs mentioned above are detected or if the situation warrants an immediate specialist consultation.
`;

export async function POST(req: Request) {
    try {
        if (!process.env.OPENAI_API_KEY) {
            return NextResponse.json({
                error: 'OpenAI API key is not configured'
            }, { status: 500 });
        }

        const { messages, gestationalAge, userId } = await req.json();

        if (!messages || !Array.isArray(messages)) {
            return NextResponse.json({ error: 'Messages array is required' }, { status: 400 });
        }

        // 1. Check Usage Limit if userId is provided
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

            // Count user's messages today
            const { count, error: countError } = await supabaseAdmin
                .from('ai_chat_messages')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', userId)
                .eq('role', 'user')
                .gte('created_at', today.toISOString());

            if (count !== null && count >= limit) {
                return NextResponse.json({
                    error: 'Daily message limit reached',
                    details: `You have reached your limit of ${limit} messages today. Please try again tomorrow.`
                }, { status: 429 });
            }
        }

        const contextPrompt = gestationalAge
            ? `${MATERNAL_SYSTEM_PROMPT}\n\nUser Context: The user is currently ${gestationalAge} weeks pregnant.`
            : MATERNAL_SYSTEM_PROMPT;

        const lastUserMessage = messages[messages.length - 1]?.content;

        const completion = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                { role: 'system', content: contextPrompt },
                ...messages
            ],
            response_format: { type: "json_object" },
            temperature: 0.7,
        });

        const replyContent = completion.choices[0].message.content || '{}';
        const parsedReply = JSON.parse(replyContent);

        // 2. Persist to database if userId is provided
        if (userId) {
            await supabaseAdmin.from('ai_chat_messages').insert([
                {
                    user_id: userId,
                    role: 'user',
                    content: lastUserMessage,
                    is_serious: false
                },
                {
                    user_id: userId,
                    role: 'assistant',
                    content: parsedReply.reply,
                    is_serious: parsedReply.isSerious
                }
            ]);
        }

        return NextResponse.json(parsedReply);
    } catch (error: any) {
        console.error('Maternal AI Error:', error);
        return NextResponse.json({
            error: 'Failed to generate response',
            details: error.message || 'Unknown error'
        }, { status: 500 });
    }
}
