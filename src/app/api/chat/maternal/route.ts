import { NextResponse } from 'next/server';
import { openai } from '@/lib/openai';

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
- Acknowledge the symptom.
- Ask critical safety questions if necessary.
- Provide a preliminary assessment.
- Give clear recommendations (ANC visit, rest, hydration, or IMMEDIATE HOSPITAL if danger signs).
`;

export async function POST(req: Request) {
    try {
        if (!process.env.OPENAI_API_KEY) {
            return NextResponse.json({
                error: 'OpenAI API key is not configured',
                details: 'Please add OPENAI_API_KEY to your .env.local file'
            }, { status: 500 });
        }

        const { messages, gestationalAge } = await req.json();

        if (!messages || !Array.isArray(messages)) {
            return NextResponse.json({ error: 'Messages array is required' }, { status: 400 });
        }

        const contextPrompt = gestationalAge
            ? `${MATERNAL_SYSTEM_PROMPT}\n\nUser Context: The user is currently ${gestationalAge} weeks pregnant.`
            : MATERNAL_SYSTEM_PROMPT;

        const completion = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                { role: 'system', content: contextPrompt },
                ...messages
            ],
            temperature: 0.7,
        });

        const reply = completion.choices[0].message.content;

        return NextResponse.json({ reply });
    } catch (error: any) {
        console.error('Maternal AI Error:', error);
        return NextResponse.json({
            error: 'Failed to generate response',
            details: error.message || 'Unknown error'
        }, { status: 500 });
    }
}
